export interface Patient {
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

export interface Document {
  id: string
  patient_id: string
  original_filename: string
  sha256: string
  file_path: string
  file_type?: string
  facility?: string
  doctor?: string
  doc_date?: string
  doc_type?: string
  status: string
  extraction_method?: string
  raw_extracted_json?: string
  needs_review_count?: number
  created_at: string
}

export interface Observation {
  id: string
  patient_id: string
  document_id?: string
  test_name: string
  loinc_code?: string
  value_text: string
  value_numeric?: number
  unit?: string
  printed_reference_range?: string
  standard_reference_range?: string
  flag: string
  severity: string
  confidence?: number
  sample_date?: string
  source_text?: string
  needs_review?: boolean
  created_at: string
}

export interface MedicationStatement {
  id: string
  patient_id: string
  document_id?: string
  name_as_written: string
  generic_name?: string
  brand_alias?: string
  strength?: string
  form?: string
  frequency_raw?: string
  frequency_standard?: string
  dose?: string
  instructions?: string
  start_date?: string
  status: string
  daily_dose_mg?: number
  dosage_warning?: string
  confidence?: number
  source_text?: string
  created_at: string
}

export interface Condition {
  id: string
  patient_id: string
  document_id?: string
  name: string
  icd10_hint?: string
  clinical_status: string
  recorded_date?: string
  created_at: string
}

export interface Encounter {
  id: string
  patient_id: string
  document_id?: string
  facility_name: string
  doctor_name?: string
  encounter_type: string
  encounter_date: string
  summary?: string
  created_at: string
}

export interface FHIRResource {
  id: string
  patient_id: string
  document_id?: string
  resource_type: string
  resource_json: string
  created_at: string
}

export interface DocumentSummary {
  id: string
  document_id: string
  language: string
  headline: string
  summary_text: string
  key_points_json: string
  abnormal_findings_json: string
  suggested_questions_json: string
  urgency_note?: string
  disclaimer: string
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
  patient: Patient
  active_conditions: Condition[]
  current_medicines: MedicationStatement[]
  latest_labs: Observation[]
  alerts: AlertItem[]
  document_count: number
}

export interface TimelineEvent {
  id: string
  event_date: string
  event_type: 'lab_report' | 'prescription' | 'discharge_summary' | 'abdm_visit'
  title: string
  facility?: string
  doctor?: string
  document_id?: string
  details: {
    tests_count: number
    medicines_count: number
    summary?: string
    is_abdm_synced?: boolean
  }
}

export interface TrendDataPoint {
  date: string
  value: number
  unit: string
  flag: string
  document_id?: string
}

export interface TrendData {
  test_name: string
  loinc?: string
  unit: string
  reference_min?: number
  reference_max?: number
  data_points: TrendDataPoint[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  citations?: Array<{
    document_id: string
    document_title: string
    date?: string
    snippet: string
  }>
}
