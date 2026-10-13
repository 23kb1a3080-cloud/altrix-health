import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { AlertItem, MedicationStatement, Observation } from '../types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RANGES_FILE = path.join(__dirname, '..', 'data', 'reference_ranges.json')
const DRUGS_FILE = path.join(__dirname, '..', 'data', 'drug_aliases.json')

let referenceRanges: Record<string, any> = {}
let drugAliases: Record<string, any> = {}

try {
  referenceRanges = JSON.parse(fs.readFileSync(RANGES_FILE, 'utf-8'))
} catch (e) {
  console.warn('Could not read reference_ranges.json', e)
}

try {
  drugAliases = JSON.parse(fs.readFileSync(DRUGS_FILE, 'utf-8'))
} catch (e) {
  console.warn('Could not read drug_aliases.json', e)
}

export function matchTestDefinition(testName: string) {
  if (!testName) return null
  const cleaned = testName.trim().toLowerCase()

  // Priority check for HbA1c to prevent collision with Hemoglobin
  if (cleaned.includes('hba1c') || cleaned.includes('glycated') || cleaned.includes('a1c')) {
    if (referenceRanges['hba1c']) return referenceRanges['hba1c']
  }

  // Exact key check
  const normalizedKey = cleaned.replace(/[\s-]+/g, '_')
  if (referenceRanges[normalizedKey]) {
    return referenceRanges[normalizedKey]
  }

  // Check aliases with word boundaries
  for (const [key, def] of Object.entries(referenceRanges)) {
    if (def.name && def.name.toLowerCase() === cleaned) return def
    if (Array.isArray(def.aliases)) {
      for (const alias of def.aliases) {
        const aliasLower = alias.toLowerCase()
        if (cleaned === aliasLower) return def
        // Word boundary match
        const regex = new RegExp(`\\b${aliasLower}\\b`, 'i')
        if (regex.test(cleaned)) return def
      }
    }
  }

  return null
}

export interface RangeValidationResult {
  loinc_code?: string
  standard_reference_range?: string
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH'
  severity: 'info' | 'warning' | 'critical'
}

export function validateObservationRange(
  testName: string,
  valueNumeric: number | undefined,
  patientSex: string = 'male',
  _patientAge: number = 52
): RangeValidationResult {
  const def = matchTestDefinition(testName)
  if (!def || valueNumeric === undefined || isNaN(valueNumeric)) {
    return {
      flag: 'NORMAL',
      severity: 'info',
    }
  }

  const sexKey = (patientSex || 'default').toLowerCase().startsWith('f') ? 'female' : 'male'
  const rangeConfig = def.ranges?.[sexKey] || def.ranges?.['default'] || def.ranges

  if (!rangeConfig) {
    return {
      loinc_code: def.loinc,
      flag: 'NORMAL',
      severity: 'info',
    }
  }

  const min = rangeConfig.min
  const max = rangeConfig.max
  const critLow = rangeConfig.critical_low
  const critHigh = rangeConfig.critical_high

  const unit = def.canonical_unit || ''
  const standardRangeStr = min !== undefined && max !== undefined ? `${min} - ${max} ${unit}`.trim() : undefined

  let flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH' = 'NORMAL'
  let severity: 'info' | 'warning' | 'critical' = 'info'

  if (critHigh !== undefined && valueNumeric >= critHigh) {
    flag = 'CRITICAL_HIGH'
    severity = 'critical'
  } else if (critLow !== undefined && valueNumeric <= critLow) {
    flag = 'CRITICAL_LOW'
    severity = 'critical'
  } else if (max !== undefined && valueNumeric > max) {
    flag = 'HIGH'
    severity = 'warning'
  } else if (min !== undefined && valueNumeric < min) {
    flag = 'LOW'
    severity = 'warning'
  }

  return {
    loinc_code: def.loinc,
    standard_reference_range: standardRangeStr,
    flag,
    severity,
  }
}

export function matchDrugAlias(drugName: string) {
  if (!drugName) return null
  const cleaned = drugName.trim().toLowerCase()
  for (const [brand, info] of Object.entries(drugAliases)) {
    if (cleaned.includes(brand) || brand.includes(cleaned)) {
      return { brand, ...info }
    }
  }
  return null
}

export function validateMedicinesAndGenerateAlerts(
  medicines: MedicationStatement[],
  observations: Observation[] = []
): AlertItem[] {
  const alerts: AlertItem[] = []

  // Check abnormal observations
  for (const obs of observations) {
    if (obs.flag.includes('CRITICAL')) {
      alerts.push({
        type: 'critical_lab',
        severity: 'critical',
        title: `Critical Lab Value: ${obs.test_name}`,
        description: `${obs.test_name} measured at ${obs.value_text} ${obs.unit || ''} (Target: ${obs.standard_reference_range || 'Normal range'}). Immediate clinical review advised.`,
        source_document_id: obs.document_id,
      })
    } else if (obs.flag === 'HIGH' || obs.flag === 'LOW') {
      alerts.push({
        type: 'abnormal_lab',
        severity: 'warning',
        title: `Abnormal Reading: ${obs.test_name} (${obs.flag})`,
        description: `${obs.test_name} is ${obs.flag.toLowerCase()} at ${obs.value_text} ${obs.unit || ''} (Normal: ${obs.standard_reference_range || 'Reference range'}).`,
        source_document_id: obs.document_id,
      })
    }
  }

  // Check duplicate active generics
  const activeGenerics = new Map<string, string[]>()
  for (const med of medicines) {
    if (med.generic_name) {
      const parts = med.generic_name.split('+').map((p) => p.trim().toLowerCase())
      for (const p of parts) {
        if (!activeGenerics.has(p)) activeGenerics.set(p, [])
        activeGenerics.get(p)!.push(med.name_as_written)
      }
    }
  }

  for (const [generic, brands] of activeGenerics.entries()) {
    if (brands.length > 1) {
      alerts.push({
        type: 'duplicate_medicine',
        severity: 'warning',
        title: `Potential Duplicate Therapy: ${generic.toUpperCase()}`,
        description: `Multiple prescribed medicines contain the active generic '${generic}': ${brands.join(', ')}. Verify with doctor to avoid accidental overdose.`,
      })
    }
  }

  return alerts
}
