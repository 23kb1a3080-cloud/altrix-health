import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type {
  Patient,
  Document,
  Observation,
  MedicationStatement,
  Condition,
  Encounter,
  FHIRResource,
  DocumentSummary,
} from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_FILE = path.join(__dirname, 'data', 'seed_data.json')

class DataStore {
  patients: Map<string, Patient> = new Map()
  documents: Map<string, Document> = new Map()
  observations: Map<string, Observation> = new Map()
  medications: Map<string, MedicationStatement> = new Map()
  conditions: Map<string, Condition> = new Map()
  encounters: Map<string, Encounter> = new Map()
  fhirResources: Map<string, FHIRResource> = new Map()
  summaries: Map<string, DocumentSummary> = new Map()

  constructor() {
    this.init()
  }

  init() {
    try {
      if (fs.existsSync(SEED_FILE)) {
        const raw = fs.readFileSync(SEED_FILE, 'utf-8')
        const data = JSON.parse(raw)

        if (Array.isArray(data.patients)) {
          for (const p of data.patients) this.patients.set(p.id, p)
        }
        if (Array.isArray(data.documents)) {
          for (const d of data.documents) this.documents.set(d.id, d)
        }
        if (Array.isArray(data.observations)) {
          for (const o of data.observations) this.observations.set(o.id, o)
        }
        if (Array.isArray(data.medication_statements)) {
          for (const m of data.medication_statements) this.medications.set(m.id, m)
        }
        if (Array.isArray(data.conditions)) {
          for (const c of data.conditions) this.conditions.set(c.id, c)
        }
        if (Array.isArray(data.encounters)) {
          for (const e of data.encounters) this.encounters.set(e.id, e)
        }
        if (Array.isArray(data.fhir_resources)) {
          for (const f of data.fhir_resources) this.fhirResources.set(f.id, f)
        }
        if (Array.isArray(data.document_summaries)) {
          for (const s of data.document_summaries) this.summaries.set(s.id, s)
        }
      }
    } catch (err) {
      console.warn('Warning: Could not read seed_data.json, initializing empty store', err)
    }

    // Ensure fallback demo patient exists
    if (!this.patients.has('patient-ravi-kumar-demo')) {
      const demoPatient: Patient = {
        id: 'patient-ravi-kumar-demo',
        name: 'Ravi Kumar',
        abha_number: '14-8723-9182-3490',
        abha_address: 'ravikumar@abdm',
        dob: '1972-06-15',
        age: 52,
        sex: 'Male',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
      }
      this.patients.set(demoPatient.id, demoPatient)
    }
  }

  // Patient
  getPatient(id: string): Patient | undefined {
    return this.patients.get(id)
  }
  listPatients(): Patient[] {
    return Array.from(this.patients.values())
  }
  savePatient(p: Patient) {
    this.patients.set(p.id, p)
  }

  // Document
  getDocument(id: string): Document | undefined {
    return this.documents.get(id)
  }
  listDocumentsByPatient(patientId: string): Document[] {
    return Array.from(this.documents.values()).filter((d) => d.patient_id === patientId)
  }
  saveDocument(doc: Document) {
    this.documents.set(doc.id, doc)
  }

  // Observations
  listObservationsByPatient(patientId: string): Observation[] {
    return Array.from(this.observations.values()).filter((o) => o.patient_id === patientId)
  }
  listObservationsByDocument(docId: string): Observation[] {
    return Array.from(this.observations.values()).filter((o) => o.document_id === docId)
  }
  saveObservation(obs: Observation) {
    this.observations.set(obs.id, obs)
  }
  deleteObservationsByDocument(docId: string) {
    for (const [id, obs] of this.observations.entries()) {
      if (obs.document_id === docId) this.observations.delete(id)
    }
  }

  // MedicationStatements
  listMedicationsByPatient(patientId: string): MedicationStatement[] {
    return Array.from(this.medications.values()).filter((m) => m.patient_id === patientId)
  }
  listMedicationsByDocument(docId: string): MedicationStatement[] {
    return Array.from(this.medications.values()).filter((m) => m.document_id === docId)
  }
  saveMedication(med: MedicationStatement) {
    this.medications.set(med.id, med)
  }
  deleteMedicationsByDocument(docId: string) {
    for (const [id, med] of this.medications.entries()) {
      if (med.document_id === docId) this.medications.delete(id)
    }
  }

  // Conditions
  listConditionsByPatient(patientId: string): Condition[] {
    return Array.from(this.conditions.values()).filter((c) => c.patient_id === patientId)
  }
  saveCondition(cond: Condition) {
    this.conditions.set(cond.id, cond)
  }

  // Encounters
  listEncountersByPatient(patientId: string): Encounter[] {
    return Array.from(this.encounters.values()).filter((e) => e.patient_id === patientId)
  }
  saveEncounter(enc: Encounter) {
    this.encounters.set(enc.id, enc)
  }

  // FHIR Resources
  listFHIRResourcesByPatient(patientId: string): FHIRResource[] {
    return Array.from(this.fhirResources.values()).filter((f) => f.patient_id === patientId)
  }
  saveFHIRResource(res: FHIRResource) {
    this.fhirResources.set(res.id, res)
  }
  deleteFHIRResourcesByDocument(docId: string) {
    for (const [id, f] of this.fhirResources.entries()) {
      if (f.document_id === docId) this.fhirResources.delete(id)
    }
  }

  // Summaries
  getSummaryByDocumentAndLang(docId: string, lang: string): DocumentSummary | undefined {
    return Array.from(this.summaries.values()).find(
      (s) => s.document_id === docId && s.language === lang
    )
  }
  saveSummary(s: DocumentSummary) {
    this.summaries.set(s.id, s)
  }
}

export const store = new DataStore()
