import crypto from 'crypto'
import type { Patient } from '../types.js'
import { store } from '../store.js'

export function generateMockABHANumber(): string {
  // ABDM 14-digit pattern: XX-XXXX-XXXX-XXXX
  const p1 = Math.floor(10 + Math.random() * 89).toString()
  const p2 = Math.floor(1000 + Math.random() * 9000).toString()
  const p3 = Math.floor(1000 + Math.random() * 9000).toString()
  const p4 = Math.floor(1000 + Math.random() * 9000).toString()
  return `${p1}-${p2}-${p3}-${p4}`
}

export function generateMockABHAAddress(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'patient'
  const rand = Math.floor(100 + Math.random() * 900)
  return `${clean}${rand}@abdm`
}

export function importMockABDMVisit(patient: Patient) {
  const encId = `enc-abdm-${crypto.randomUUID().slice(0, 8)}`
  const dateStr = '2024-11-20'

  store.saveEncounter({
    id: encId,
    patient_id: patient.id,
    facility_name: 'Visakha Institute of Medical Sciences',
    doctor_name: 'Dr. S. K. Rao (Cardiologist)',
    encounter_type: 'abdm_visit',
    encounter_date: dateStr,
    summary: 'Routine Cardiology Follow-up & Baseline Metabolic Panel (Synced via ABDM)',
    created_at: new Date().toISOString(),
  })

  // Add historical blood glucose and lipid observation
  const obsId = `obs-abdm-${crypto.randomUUID().slice(0, 8)}`
  store.saveObservation({
    id: obsId,
    patient_id: patient.id,
    test_name: 'Fasting Blood Glucose',
    loinc_code: '1558-6',
    value_text: '142',
    value_numeric: 142,
    unit: 'mg/dL',
    standard_reference_range: '70 - 100 mg/dL',
    flag: 'HIGH',
    severity: 'warning',
    sample_date: dateStr,
    created_at: new Date().toISOString(),
  })
}
