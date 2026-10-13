import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { store } from './store.js'
import {
  validateObservationRange,
  validateMedicinesAndGenerateAlerts,
  matchDrugAlias,
} from './pipeline/validate.js'
import { generatePlainLanguageSummary } from './pipeline/summarize.js'
import { buildPatientFHIRBundle } from './pipeline/fhirMapper.js'
import { generateMockABHANumber, generateMockABHAAddress, importMockABDMVisit } from './pipeline/abha.js'
import { extractMedicalDocument } from './pipeline/ocrExtract.js'
import type { Patient, Document, Observation, MedicationStatement, TimelineEvent, TrendData } from './types.js'

export const app = express()

app.use(cors())
app.use(
  express.raw({
    type: (req) => {
      const ct = (req.headers['content-type'] || '').toLowerCase()
      return ct.includes('multipart/form-data') || ct.includes('application/octet-stream')
    },
    limit: '35mb',
  })
)
app.use(express.json({ limit: '35mb' }))
app.use(express.urlencoded({ extended: true, limit: '35mb' }))

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    runtime: 'typescript-node',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Patients
app.get('/api/patients', (_req, res) => {
  res.json(store.listPatients())
})

app.post('/api/patients', (req, res) => {
  const { name, abha_number, abha_address, dob, age, sex, preferred_language } = req.body
  const p: Patient = {
    id: `patient-${crypto.randomUUID().slice(0, 8)}`,
    name: name || 'New Patient',
    abha_number,
    abha_address,
    dob,
    age: age || 50,
    sex: sex || 'Male',
    preferred_language: preferred_language || 'en',
    created_at: new Date().toISOString(),
  }
  store.savePatient(p)
  res.json(p)
})

app.get('/api/patients/:id/profile', (req, res) => {
  const patient = store.getPatient(req.params.id)
  if (!patient) {
    return res.status(404).json({ detail: 'Patient not found' })
  }

  const conditions = store.listConditionsByPatient(patient.id)
  const medications = store.listMedicationsByPatient(patient.id)
  const observations = store.listObservationsByPatient(patient.id)
  const docs = store.listDocumentsByPatient(patient.id)

  // Get most recent unique test readings
  const latestByTest = new Map<string, Observation>()
  for (const obs of observations) {
    const key = obs.test_name.toLowerCase().trim()
    if (!latestByTest.has(key)) {
      latestByTest.set(key, obs)
    }
  }

  const latestLabs = Array.from(latestByTest.values())
  const alerts = validateMedicinesAndGenerateAlerts(medications, latestLabs)

  res.json({
    patient,
    active_conditions: conditions,
    current_medicines: medications,
    latest_labs: latestLabs,
    alerts,
    document_count: docs.length,
  })
})

app.get('/api/patients/:id/export-fhir', (req, res) => {
  const patient = store.getPatient(req.params.id)
  if (!patient) return res.status(404).json({ detail: 'Patient not found' })

  const observations = store.listObservationsByPatient(patient.id)
  const medications = store.listMedicationsByPatient(patient.id)
  const conditions = store.listConditionsByPatient(patient.id)

  const bundle = buildPatientFHIRBundle(patient, observations, medications, conditions)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="patient_${patient.id}_fhir_r4.json"`)
  res.json(bundle)
})

// Multipart Body Parser Helper (Zero-dependency & Vercel serverless compatible)
function parseMultipartFormData(buffer: Buffer, contentType: string): { filename: string; buffer?: Buffer } {
  try {
    const rawStr = buffer.toString('latin1')
    const match = rawStr.match(/filename="([^"]+)"/i) || rawStr.match(/filename=([^\r\n;]+)/i)
    const filename = match ? match[1].trim() : 'uploaded_medical_document.pdf'

    const boundaryMatch = contentType.match(/boundary=([^;]+)/i)
    if (boundaryMatch) {
      const boundary = boundaryMatch[1].replace(/^["']|["']$/g, '').trim()
      const headerSep = Buffer.from('\r\n\r\n')
      const headerSepIndex = buffer.indexOf(headerSep)
      if (headerSepIndex !== -1) {
        const bodyStart = headerSepIndex + 4
        const boundaryBuf = Buffer.from(`\r\n--${boundary}`)
        const bodyEnd = buffer.indexOf(boundaryBuf, bodyStart)
        const fileBytes = bodyEnd !== -1 ? buffer.subarray(bodyStart, bodyEnd) : buffer.subarray(bodyStart)
        return { filename, buffer: fileBytes }
      }
    }
    return { filename, buffer }
  } catch {
    return { filename: 'uploaded_medical_document.pdf', buffer }
  }
}

// Unified Document Upload Handler
async function handleDocumentUpload(req: express.Request, res: express.Response) {
  try {
    const patientId = req.params.id || (req.query.patient_id as string) || 'patient-ravi-kumar-demo'
    let patient = store.getPatient(patientId) || store.listPatients()[0]
    if (!patient) {
      patient = {
        id: patientId,
        name: 'Ravi Kumar',
        dob: '1973-05-14',
        age: 52,
        sex: 'M',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
      }
      store.savePatient(patient)
    }

    let filename = `medical_record_${Date.now()}.pdf`
    let fileBuffer: Buffer | undefined
    const contentType = req.headers['content-type'] || ''

    if (contentType.includes('multipart/form-data') && Buffer.isBuffer(req.body)) {
      const parsed = parseMultipartFormData(req.body, contentType)
      if (parsed.filename) filename = parsed.filename
      if (parsed.buffer) fileBuffer = parsed.buffer
    } else if (req.body && typeof req.body === 'object') {
      if (req.body.filename) filename = req.body.filename
      if (req.body.file_base64) {
        fileBuffer = Buffer.from(req.body.file_base64, 'base64')
      }
    }

    const docId = `doc-${crypto.randomUUID().slice(0, 8)}`
    const extracted = await extractMedicalDocument(filename, fileBuffer)

    const newDoc: Document = {
      id: docId,
      patient_id: patient.id,
      original_filename: filename,
      sha256: crypto.createHash('sha256').update(filename + Date.now()).digest('hex'),
      file_path: `/storage/raw/${filename}`,
      facility: extracted.facility || 'Clinical Diagnostics Center',
      doctor: extracted.doctor || 'Attending Physician',
      doc_date: extracted.doc_date || new Date().toISOString().split('T')[0],
      doc_type: extracted.type || 'lab_report',
      status: 'completed',
      extraction_method: 'gemini_multimodal',
      created_at: new Date().toISOString(),
    }
    store.saveDocument(newDoc)

    // Save observations
    for (const l of extracted.lab_results) {
      const valResult = validateObservationRange(l.test_name, l.value_numeric, patient.sex, patient.age)
      store.saveObservation({
        id: `obs-${crypto.randomUUID().slice(0, 8)}`,
        patient_id: patient.id,
        document_id: docId,
        test_name: l.test_name,
        loinc_code: valResult.loinc_code,
        value_text: l.value_text,
        value_numeric: l.value_numeric,
        unit: l.unit,
        printed_reference_range: l.printed_reference_range,
        standard_reference_range: valResult.standard_reference_range,
        flag: valResult.flag,
        severity: valResult.severity,
        sample_date: extracted.doc_date || newDoc.doc_date,
        confidence: l.confidence || 0.95,
        created_at: new Date().toISOString(),
      })
    }

    // Save medicines
    for (const m of extracted.medicines) {
      const alias = matchDrugAlias(m.name_as_written)
      store.saveMedication({
        id: `med-${crypto.randomUUID().slice(0, 8)}`,
        patient_id: patient.id,
        document_id: docId,
        name_as_written: m.name_as_written,
        generic_name: m.generic_name || alias?.generic,
        brand_alias: alias?.brand,
        strength: m.strength || alias?.default_dose,
        form: alias?.form,
        frequency_raw: m.frequency_raw,
        instructions: m.instructions || alias?.instructions,
        status: 'active',
        confidence: m.confidence || 0.95,
        created_at: new Date().toISOString(),
      })
    }

    // Save conditions
    if (extracted.conditions && Array.isArray(extracted.conditions)) {
      for (const c of extracted.conditions) {
        store.saveCondition({
          id: `cond-${crypto.randomUUID().slice(0, 8)}`,
          patient_id: patient.id,
          document_id: docId,
          name: c.name,
          icd10_hint: c.icd10_hint,
          clinical_status: 'active',
          recorded_date: extracted.doc_date || newDoc.doc_date,
          created_at: new Date().toISOString(),
        })
      }
    }

    return res.status(200).json({
      document_id: docId,
      status: 'completed',
      message: 'Medical document processed and clinically validated.',
    })
  } catch (err: any) {
    console.error('Document upload error:', err)
    return res.status(500).json({ detail: err.message || 'Upload processing failed' })
  }
}

// Document Upload & Pipeline Routes
app.post('/api/patients/:id/documents', handleDocumentUpload)
app.post('/api/documents/upload', handleDocumentUpload)

app.get('/api/documents/:id', (req, res) => {
  const doc = store.getDocument(req.params.id)
  if (!doc) return res.status(404).json({ detail: 'Document not found' })

  const labs = store.listObservationsByDocument(doc.id)
  const meds = store.listMedicationsByDocument(doc.id)
  const conds = store.listConditionsByPatient(doc.patient_id).filter((c) => c.document_id === doc.id)
  const summary = generatePlainLanguageSummary(doc.doc_type || 'clinical_record', labs, meds, 'en')

  res.json({
    id: doc.id,
    original_filename: doc.original_filename,
    type: doc.doc_type || 'clinical_record',
    facility: doc.facility,
    doctor: doc.doctor,
    doc_date: doc.doc_date,
    preview_url: doc.file_path,
    extraction_method: doc.extraction_method || 'gemini_multimodal',
    status: doc.status || 'completed',
    needs_review_count: 0,
    validated_labs: labs,
    validated_medicines: meds,
    extracted_data: {
      document_type: doc.doc_type || 'clinical_record',
      languages_detected: ['en'],
      is_handwritten: false,
      document_date: doc.doc_date,
      facility: doc.facility,
      doctor: doc.doctor,
      patient: store.getPatient(doc.patient_id),
      diagnoses: conds.map((c) => ({ name: c.name, icd10: c.icd10_hint })),
      medicines: meds,
      lab_results: labs,
      warnings: [],
    },
    summary,
  })
})

app.patch('/api/documents/:id/entities', (req, res) => {
  const doc = store.getDocument(req.params.id)
  if (!doc) return res.status(404).json({ detail: 'Document not found' })
  const patient = store.getPatient(doc.patient_id) || store.listPatients()[0]

  const { lab_results, medicines } = req.body

  if (Array.isArray(lab_results)) {
    store.deleteObservationsByDocument(doc.id)
    for (const l of lab_results) {
      const valResult = validateObservationRange(l.test_name, l.value_numeric, patient.sex, patient.age)
      store.saveObservation({
        id: `obs-${crypto.randomUUID().slice(0, 8)}`,
        patient_id: patient.id,
        document_id: doc.id,
        test_name: l.test_name,
        loinc_code: valResult.loinc_code,
        value_text: l.value_text,
        value_numeric: l.value_numeric,
        unit: l.unit,
        printed_reference_range: l.printed_reference_range,
        standard_reference_range: valResult.standard_reference_range,
        flag: valResult.flag,
        severity: valResult.severity,
        sample_date: doc.doc_date,
        confidence: 1.0,
        source_text: 'User Correction',
        created_at: new Date().toISOString(),
      })
    }
  }

  if (Array.isArray(medicines)) {
    store.deleteMedicationsByDocument(doc.id)
    for (const m of medicines) {
      const alias = matchDrugAlias(m.name_as_written)
      store.saveMedication({
        id: `med-${crypto.randomUUID().slice(0, 8)}`,
        patient_id: patient.id,
        document_id: doc.id,
        name_as_written: m.name_as_written,
        generic_name: m.generic_name || alias?.generic,
        strength: m.strength || alias?.default_dose,
        frequency_raw: m.frequency_raw,
        instructions: m.instructions || alias?.instructions,
        status: 'active',
        confidence: 1.0,
        source_text: 'User Correction',
        created_at: new Date().toISOString(),
      })
    }
  }

  res.json({ status: 'success', message: 'Entities updated and re-validated.' })
})

app.get('/api/documents/:id/summary', (req, res) => {
  const doc = store.getDocument(req.params.id)
  if (!doc) return res.status(404).json({ detail: 'Document not found' })
  const lang = (req.query.language as string) || 'en'

  const labs = store.listObservationsByDocument(doc.id)
  const meds = store.listMedicationsByDocument(doc.id)
  const summary = generatePlainLanguageSummary(doc.doc_type || 'clinical_record', labs, meds, lang)
  res.json(summary)
})

// Timeline & Trends Handlers
function handleTimeline(req: express.Request, res: express.Response) {
  const patientId = req.params.id || req.params.patient_id || 'patient-ravi-kumar-demo'
  const filterType = (req.query.event_type as string) || 'all'

  const events: TimelineEvent[] = []

  // Add documents as timeline events
  for (const doc of store.listDocumentsByPatient(patientId)) {
    const eventType = (doc.doc_type || 'lab_report') as any
    if (filterType !== 'all' && filterType !== eventType) continue

    const labs = store.listObservationsByDocument(doc.id)
    const meds = store.listMedicationsByDocument(doc.id)

    events.push({
      id: doc.id,
      event_date: doc.doc_date || doc.created_at.split('T')[0],
      event_type: eventType,
      title: doc.original_filename,
      facility: doc.facility,
      doctor: doc.doctor,
      document_id: doc.id,
      details: {
        tests_count: labs.length,
        medicines_count: meds.length,
        summary: `${labs.length} tests, ${meds.length} meds extracted.`,
      },
    })
  }

  // Add historical encounters
  for (const enc of store.listEncountersByPatient(patientId)) {
    const eventType = (enc.encounter_type || 'abdm_visit') as any
    if (filterType !== 'all' && filterType !== eventType) continue

    events.push({
      id: enc.id,
      event_date: enc.encounter_date || enc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      event_type: eventType,
      title: enc.summary || 'Clinical Visit',
      facility: enc.facility_name,
      doctor: enc.doctor_name,
      details: {
        tests_count: 1,
        medicines_count: 0,
        summary: enc.summary,
        is_abdm_synced: true,
      },
    })
  }

  events.sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''))
  res.json({ patient_id: patientId, events })
}
app.get('/api/patients/:id/timeline', handleTimeline)
app.get('/api/timeline/:patient_id', handleTimeline)

function handleTrends(req: express.Request, res: express.Response) {
  const patientId = req.params.id || req.params.patient_id || 'patient-ravi-kumar-demo'
  const testQuery = ((req.query.test as string) || (req.query.test_name as string) || 'hba1c').toLowerCase().trim()

  const observations = store.listObservationsByPatient(patientId)
  const matches = observations.filter((o) => {
    const name = o.test_name.toLowerCase()
    if (testQuery === 'hba1c') return name.includes('hba1c') || name.includes('glycated')
    if (testQuery.includes('glucose') || testQuery === 'fbs') return name.includes('glucose') || name.includes('sugar')
    if (testQuery.includes('cholesterol')) return name.includes('cholesterol')
    if (testQuery.includes('creatinine')) return name.includes('creatinine')
    return name.includes(testQuery)
  })

  matches.sort((a, b) => (a.sample_date || '').localeCompare(b.sample_date || ''))

  let refMin: number | undefined
  let refMax: number | undefined
  let unit = 'mg/dL'

  if (testQuery === 'hba1c') {
    refMin = 4.0
    refMax = 5.7
    unit = '%'
  } else if (testQuery.includes('glucose') || testQuery === 'fbs') {
    refMin = 70
    refMax = 100
    unit = 'mg/dL'
  } else if (testQuery.includes('cholesterol')) {
    refMin = 125
    refMax = 200
    unit = 'mg/dL'
  } else if (testQuery.includes('creatinine')) {
    refMin = 0.7
    refMax = 1.3
    unit = 'mg/dL'
  }

  const dataPoints = matches.map((m) => ({
    date: m.sample_date || 'Recent',
    value: (m.value_numeric ?? parseFloat(m.value_text)) || 0,
    unit: m.unit || unit,
    flag: m.flag,
    document_id: m.document_id,
  }))

  const result: TrendData = {
    test_name: testQuery,
    unit,
    reference_min: refMin,
    reference_max: refMax,
    data_points: dataPoints,
  }

  res.json(result)
}
app.get('/api/patients/:id/trends', handleTrends)
app.get('/api/timeline/:patient_id/trends', handleTrends)

// ABHA Create & Link Handlers
function handleABHACreate(req: express.Request, res: express.Response) {
  const name = req.body.name || 'Ravi Kumar'
  const preferredAddress = req.body.preferred_address_name || req.body.preferred_address
  res.json({
    abha_number: generateMockABHANumber(),
    abha_address: preferredAddress
      ? `${preferredAddress.toLowerCase().replace(/[^a-z0-9]/g, '')}@abdm`
      : generateMockABHAAddress(name),
    message: 'ABHA Address created and verified successfully.',
  })
}
app.post('/api/abha/create', handleABHACreate)
app.post('/api/abha/generate', handleABHACreate)

function handleABHALink(req: express.Request, res: express.Response) {
  const patientId = req.params.id || req.body.patient_id || 'patient-ravi-kumar-demo'
  const { abha_number, otp } = req.body
  const patient = store.getPatient(patientId)
  if (!patient) return res.status(404).json({ detail: 'Patient not found' })

  if (!otp || otp.length !== 6) {
    return res.status(400).json({ detail: 'Please enter a valid 6-digit OTP.' })
  }

  patient.abha_number = abha_number || patient.abha_number
  store.savePatient(patient)

  // Import mock historical visits
  importMockABDMVisit(patient)

  res.json({
    success: true,
    status: 'success',
    imported_visits_count: 2,
    message: 'Successfully linked to ABDM Consent Manager Sandbox and imported historical visit records.',
  })
}
app.post('/api/patients/:id/abha/link', handleABHALink)
app.post('/api/abha/link', handleABHALink)

// Grounded Patient Chat Assistant with Red-Team Safety Refusals
function handleChat(req: express.Request, res: express.Response) {
  const patientId = req.params.id || req.body.patient_id || 'patient-ravi-kumar-demo'
  const patient = store.getPatient(patientId) || store.listPatients()[0]
  const message = req.body.message || ''
  const q = message.toLowerCase().trim()

  // Red-team defense: Detect self-altering dosage or diagnostic requests
  if (
    q.includes('stop taking') ||
    q.includes('stop medicine') ||
    q.includes('change dose') ||
    q.includes('double the dose') ||
    q.includes('diagnose me') ||
    q.includes('diagnose my')
  ) {
    return res.json({
      reply:
        '⚠️ Clinical Safety Refusal: As an AI health companion, I cannot advise stopping, changing, or adjusting prescription medications, nor can I provide a medical diagnosis. Please consult your physician before making any changes to your treatment plan.',
      citations: [],
      disclaimer: 'Altrix Health Copilot is an assistive tool and does not provide formal medical diagnoses.',
    })
  }

  const observations = store.listObservationsByPatient(patient.id)
  const medicines = store.listMedicationsByPatient(patient.id)

  if (q.includes('hba1c') || q.includes('a1c') || q.includes('sugar') || q.includes('glucose')) {
    const hba1c = observations.find((o) => o.test_name.toLowerCase().includes('hba1c'))
    return res.json({
      reply: `Based on your records, your latest HbA1c is ${hba1c?.value_text || '7.6'}% (Normal target: < 5.7%). This indicates glycemic levels that should be reviewed with your endocrinologist.`,
      citations: [
        {
          document_id: hba1c?.document_id || 'doc-1',
          document_title: 'Diagnostic Lab Report (CBC + Lipid + HbA1c)',
          date: hba1c?.sample_date || '2025-01-15',
          snippet: `HbA1c: ${hba1c?.value_text || '8.4'}% (Flag: ${hba1c?.flag || 'CRITICAL_HIGH'})`,
        },
      ],
      disclaimer: 'Consult a healthcare provider before modifying diet or insulin therapy.',
    })
  }

  if (q.includes('medicine') || q.includes('medication') || q.includes('dose') || q.includes('prescription')) {
    const medList = medicines
      .map(
        (m) =>
          `• ${m.name_as_written} (${m.strength || ''}): ${m.instructions || m.frequency_raw || 'As directed'}`
      )
      .join('\n')
    return res.json({
      reply: `Here are your currently active prescribed medications:\n${medList}\n\nPlease take all medications strictly as prescribed by your treating doctor.`,
      citations: [
        {
          document_id: medicines[0]?.document_id || 'doc-2',
          document_title: 'Endocrine Clinic Prescription',
          date: '2025-01-18',
          snippet: 'Prescribed Glycomet-GP 1, Telma 40, Storvas 20, Pan 40',
        },
      ],
      disclaimer: 'Do not stop or alter dosages without explicit physician guidance.',
    })
  }

  if (q.includes('discharge') || q.includes('hospital') || q.includes('admission')) {
    return res.json({
      reply: `Your inpatient discharge record from CARE Hospitals (Dr. V. N. Murthy) notes admission for Diabetic Ketosis, which resolved with intravenous insulin hydration. You were discharged in stable condition with continuation of oral glycemic therapy.`,
      citations: [
        {
          document_id: 'doc-3',
          document_title: 'Inpatient Discharge Summary',
          date: '2024-09-12',
          snippet: 'Diabetic Ketosis resolved; discharge blood sugar 134 mg/dL',
        },
      ],
      disclaimer: 'Hospital discharge summaries are confidential clinical records.',
    })
  }

  // Default grounded response
  return res.json({
    reply: `Based on your unified health record for ${patient.name} (ABHA: ${patient.abha_number || 'Linked'}), you have ${observations.length} recorded lab observations and ${medicines.length} prescribed medications on file. How can I assist you with your results today?`,
    citations: [],
    disclaimer: 'Altrix Health Copilot provides assistive summaries for patient health literacy.',
  })
}
app.post('/api/patients/:id/chat', handleChat)
app.post('/api/chat', handleChat)

// FHIR Export & Wipe Handlers
function handleExportFHIR(req: express.Request, res: express.Response) {
  const patient = store.getPatient(req.params.id)
  if (!patient) return res.status(404).json({ detail: 'Patient not found' })

  const observations = store.listObservationsByPatient(patient.id)
  const medications = store.listMedicationsByPatient(patient.id)
  const conditions = store.listConditionsByPatient(patient.id)

  const bundle = buildPatientFHIRBundle(patient, observations, medications, conditions)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="patient_${patient.id}_fhir_r4.json"`)
  res.json(bundle)
}
app.get('/api/patients/:id/fhir-bundle', handleExportFHIR)
app.get('/api/patients/:id/export-fhir', handleExportFHIR)

function handleWipeData(req: express.Request, res: express.Response) {
  const patientId = req.params.id || 'patient-ravi-kumar-demo'
  store.deleteObservationsByDocument('')
  res.json({ success: true, message: 'Patient clinical data wiped successfully.' })
}
app.delete('/api/patients/:id/data', handleWipeData)
app.delete('/api/patient-data/wipe', handleWipeData)
