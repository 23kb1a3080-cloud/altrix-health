const API_BASE = '/api'

export interface PatientRead {
  id: string
  name: string
  abha_number?: string
  abha_address?: string
  dob?: string
  age?: number
  sex?: string
  preferred_language: string
  created_at: string
}

export interface AlertItem {
  type: 'critical_lab' | 'abnormal_lab' | 'duplicate_medicine' | 'dosage_warning' | 'ocr_review'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  source_document_id?: string
}

export interface PatientProfile {
  patient: PatientRead
  active_conditions: Array<{
    id: string
    name: string
    icd10_hint?: string
    recorded_date?: string
    clinical_status: string
  }>
  current_medicines: Array<{
    id: string
    name_as_written: string
    generic_name?: string
    strength?: string
    form?: string
    frequency_raw?: string
    instructions?: string
    start_date?: string
    status: string
  }>
  latest_labs: Array<{
    id: string
    test_name: string
    loinc_code?: string
    value_text: string
    value_numeric?: number
    unit?: string
    standard_reference_range?: string
    flag: string
    severity: string
    sample_date?: string
    needs_review: boolean
  }>
  alerts: AlertItem[]
  document_count: number
}

export interface TimelineEvent {
  id: string
  event_date: string
  event_type: 'prescription' | 'lab_report' | 'discharge_summary' | 'diagnostic_imaging' | 'condition_diagnosed' | 'abdm_visit'
  title: string
  facility?: string
  doctor?: string
  document_id?: string
  details: Record<string, any>
}

export interface TrendPoint {
  date: string
  value: number
  unit: string
  flag: string
  document_id?: string
}

export interface TrendData {
  test_name: string
  loinc_code?: string
  unit: string
  reference_min?: number
  reference_max?: number
  critical_min?: number
  critical_max?: number
  data_points: TrendPoint[]
}

export interface PlainLanguageSummary {
  headline: string
  key_points: string[]
  abnormal_findings: Array<{
    test: string
    value: string
    status: string
    what_it_means: string
    common_non_serious_causes: string
    ask_your_doctor: string
  }>
  medicines: Array<{
    name: string
    what_its_for_generally: string
    how_to_take: string
    common_cautions: string
  }>
  suggested_questions_for_doctor: string[]
  urgency_note?: string
  disclaimer: string
}

export interface DocumentDetail {
  id: string
  patient_id: string
  type: string
  original_filename: string
  doc_date?: string
  facility?: string
  doctor?: string
  language_detected?: string
  extraction_method: string
  status: string
  preview_url?: string
  extracted_data: {
    document_type: string
    languages_detected: string[]
    is_handwritten: boolean
    document_date?: string
    facility?: string
    doctor?: any
    patient?: any
    diagnoses: any[]
    medicines: any[]
    lab_results: any[]
    discharge?: any
    warnings: string[]
  }
  validated_labs: Array<{
    id: string
    test_name: string
    loinc_code?: string
    value_text: string
    value_numeric?: number
    unit?: string
    printed_reference_range?: string
    standard_reference_range?: string
    flag: string
    severity: string
    needs_review: boolean
    confidence: number
    source_text?: string
  }>
  validated_medicines: Array<{
    id: string
    name_as_written: string
    generic_name?: string
    strength?: string
    form?: string
    dose?: string
    frequency_raw?: string
    instructions?: string
    confidence: number
    source_text?: string
  }>
  summary?: PlainLanguageSummary
  warnings: string[]
  needs_review_count: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  citations?: Array<{
    document_title: string
    date?: string
    document_id?: string
    snippet: string
  }>
}

export const api = {
  async getProfile(patientId: string): Promise<PatientProfile> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/profile`)
    if (!res.ok) throw new Error('Failed to load profile')
    return res.json()
  },

  async getTimeline(patientId: string, eventType?: string): Promise<{ events: TimelineEvent[] }> {
    const url = eventType && eventType !== 'all' 
      ? `${API_BASE}/patients/${patientId}/timeline?event_type=${eventType}`
      : `${API_BASE}/patients/${patientId}/timeline`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load timeline')
    return res.json()
  },

  async getTrends(patientId: string, testName: string): Promise<TrendData> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/trends?test=${encodeURIComponent(testName)}`)
    if (!res.ok) throw new Error('Failed to load trends')
    return res.json()
  },

  async uploadDocument(patientId: string, file: File): Promise<{ document_id: string; status: string; message: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/patients/${patientId}/documents`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to upload document')
    return res.json()
  },

  async getDocument(documentId: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${documentId}`)
    if (!res.ok) throw new Error('Failed to load document')
    return res.json()
  },

  async patchDocumentEntities(documentId: string, patch: any): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/entities`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to patch entities')
    return res.json()
  },

  async getSummary(documentId: string, lang: string = 'en'): Promise<PlainLanguageSummary> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/summary?lang=${lang}`)
    if (!res.ok) throw new Error('Failed to load summary')
    return res.json()
  },

  async createABHA(name: string, preferredAddress?: string): Promise<{ abha_number: string; abha_address: string; message: string }> {
    const res = await fetch(`${API_BASE}/abha/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, preferred_address_name: preferredAddress }),
    })
    if (!res.ok) throw new Error('Failed to create ABHA')
    return res.json()
  },

  async linkABHA(patientId: string, abhaNumber: string, otp: string): Promise<{ success: boolean; imported_visits_count: number; message: string }> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/abha/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abha_number: abhaNumber, otp }),
    })
    if (!res.ok) throw new Error('Failed to link ABHA')
    return res.json()
  },

  async chat(patientId: string, message: string, language: string = 'en'): Promise<{ reply: string; citations: any[]; disclaimer: string }> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    })
    if (!res.ok) throw new Error('Failed to chat')
    return res.json()
  },

  async exportFHIRBundle(patientId: string): Promise<void> {
    window.open(`${API_BASE}/patients/${patientId}/fhir-bundle`, '_blank')
  },

  async deletePatientData(patientId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/patients/${patientId}/data`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to wipe data')
    return res.json()
  }
}
