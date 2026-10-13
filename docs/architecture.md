# Altrix Health Copilot Architecture Specification

## 1. System Overview
**Altrix Health Copilot** is a privacy-first, ABDM/FHIR R4-aligned personal health assistant designed for Indian clinical workflows. It processes heterogeneous, bilingual, and handwritten healthcare documents (PDF/JPG/PNG), extracts structured entities, deterministically flags abnormal clinical parameters without delegating clinical judgments to generative LLMs, provides empathetic Class 8 plain-language summaries in English, Hindi, and Telugu, and links everything to simulated ABHA credentials.

---

## 2. End-to-End Data Pipeline Architecture
The pipeline operates deterministically in six distinct phases per upload:

```mermaid
flowchart TD
    subgraph Ingest["1. Ingestion & Preprocessing"]
        A["Uploaded File (PDF / JPG / PNG)"] --> B["SHA-256 Hashing & Deduplication"]
        B --> C["Raw File Storage (storage/raw/)"]
        C --> D["PyMuPDF 200-DPI Page Rendering"]
        D --> E["Pillow Contrast Enhancement & Orientation Fix"]
    end

    subgraph Extract["2. Multimodal Extraction"]
        E --> F{"Gemini API Key Available?"}
        F -- Yes --> G["Gemini 2.5 Flash Multimodal Call"]
        G --> H["JSON Mode + Pydantic ExtractedDocument Schema"]
        F -- No / Error --> I["PyMuPDF + Tesseract OCR Fallback"]
        I --> J["Heuristic Regular Expression Engine"]
        H --> K["Raw Extracted Entities & Snippets"]
        J --> K
    end

    subgraph Normalize["3. Normalization Engine"]
        K --> L["Date Normalization (ISO YYYY-MM-DD + Indic Digits)"]
        K --> M["Unit Standardization (mg/dL, g/dL, mmol/L, /µL, %)"]
        K --> N["RapidFuzz Brand-to-Generic Mapping (drug_aliases.json)"]
        K --> O["Frequency Notation Parser (1-0-1, OD, BD, Food Rules)"]
    end

    subgraph Validate["4. Deterministic Validation Engine (No LLM Hallucinations)"]
        L & M & N & O --> P["Age & Sex-Aware Range Evaluation (reference_ranges.json)"]
        P --> Q["Flag Computation: NORMAL / LOW / HIGH / CRITICAL"]
        P --> R["Safety Sanity Checks: Implausible Doses & Duplicate Generics"]
        P --> S["OCR Confidence Thresholds (< 0.60 -> needs_review)"]
    end

    subgraph Summarize["5. Guardrailed Plain-Language Summary"]
        Q & R & S --> T["Structured Validated JSON Payload"]
        T --> U{"Gemini Available?"}
        U -- Yes --> V["Gemini Summary Prompt (Class 8 Reading Level)"]
        U -- No --> W["Offline Multilingual Template Generator"]
        V --> X["Native Multilingual Output: EN / HI / TE"]
        W --> X
    end

    subgraph Persist["6. Storage & ABDM/FHIR Export"]
        X --> Y["SQLite Relational Persistence"]
        X --> Z["FHIR R4 Bundle Mapper (fhir_mapper.py)"]
        Z --> AA["Canonical FHIR Store (MedicationStatement, Observation, Bundle)"]
    end
```

---

## 3. Component & Storage View

```mermaid
graph TB
    subgraph FrontendClient["Frontend Layer (React 19 + Vite + TailwindCSS)"]
        UI_Nav["Responsive Navigation & Language Switcher"]
        UI_Dash["Dashboard (Tiles, Flags, Alerts, Vitals)"]
        UI_Upload["Drag-and-Drop & Camera Capture (Progress Stepper)"]
        UI_Doc["Document Detail (Split View, Audio TTS, Human Edits)"]
        UI_Time["Timeline & Recharts Longitudinal Trends"]
        UI_Chat["Ask Copilot (Grounded Chat with Record Citations)"]
        UI_ABHA["Simulated Digital ABHA Health Card"]
    end

    subgraph BackendAPI["Backend Service Layer (FastAPI + Python 3.10)"]
        API_Docs["/api/patients/{id}/documents"]
        API_Profile["/api/patients/{id}/profile"]
        API_Timeline["/api/patients/{id}/timeline & /trends"]
        API_Chat["/api/patients/{id}/chat (Safety Guardrails)"]
        API_ABHA["/api/abha/create & /link & /fhir-bundle"]
    end

    subgraph PipelineCore["Clinical Pipeline Services"]
        Pipe_Ingest["ingest.py"]
        Pipe_OCR["ocr_extract.py"]
        Pipe_Norm["normalize.py"]
        Pipe_Val["validate.py"]
        Pipe_Sum["summarize.py"]
        Pipe_FHIR["fhir_mapper.py"]
        Pipe_ABHA["abha.py"]
    end

    subgraph ExternalAndStorage["Storage & Integration"]
        DB_SQLITE[("SQLite Database (altrix.db)")]
        FS_RAW[("File Storage (storage/raw/)")]
        KB_RANGES["Clinical Knowledge (reference_ranges.json)"]
        KB_DRUGS["Pharmacology DB (drug_aliases.json)"]
        EXT_GEMINI["Google Gemini 2.5 Flash API"]
        EXT_ABDM["Mock ABDM Gateway (sandbox simulation)"]
    end

    FrontendClient <-->|REST JSON & Multipart| BackendAPI
    BackendAPI --> PipelineCore
    PipelineCore --> DB_SQLITE
    PipelineCore --> FS_RAW
    PipelineCore --> KB_RANGES
    PipelineCore --> KB_DRUGS
    PipelineCore -.->|Multimodal Vision & Summary| EXT_GEMINI
    PipelineCore -.->|Historical FHIR Bundle Import| EXT_ABDM
```

---

## 4. ABDM / FHIR R4 Data Model (Entity-Relationship Diagram)

```mermaid
erDiagram
    PATIENT ||--o{ DOCUMENT : "owns"
    PATIENT ||--o{ CONDITION : "diagnosed_with"
    PATIENT ||--o{ MEDICATION_STATEMENT : "prescribed"
    PATIENT ||--o{ OBSERVATION : "measures"
    PATIENT ||--o{ ENCOUNTER : "attends"
    PATIENT ||--o{ FHIR_RESOURCE : "has_canonical"
    
    DOCUMENT ||--o{ OBSERVATION : "records"
    DOCUMENT ||--o{ MEDICATION_STATEMENT : "contains"
    DOCUMENT ||--o{ CONDITION : "diagnoses"
    DOCUMENT ||--o{ DOCUMENT_SUMMARY : "summarized_in"

    PATIENT {
        string id PK
        string abha_number "14-XXXX-XXXX-XXXX"
        string abha_address "user@abdm"
        string name
        string dob
        int age
        string sex
        string preferred_language
    }

    DOCUMENT {
        string id PK
        string patient_id FK
        string type "lab_report | prescription | discharge_summary"
        string original_filename
        string sha256
        string doc_date
        string facility
        string doctor
        string extraction_method "gemini_multimodal | tesseract_fallback"
        string status "uploaded | processing | completed | failed"
        string raw_extraction_json
    }

    OBSERVATION {
        string id PK
        string patient_id FK
        string document_id FK
        string test_name "Hemoglobin, HbA1c, etc."
        string loinc_code "LOINC (e.g. 4548-4)"
        float value_numeric
        string unit "UCUM compliant"
        string flag "NORMAL | LOW | HIGH | CRITICAL_LOW | CRITICAL_HIGH"
        string standard_reference_range
        string sample_date
        boolean needs_review
        float confidence
    }

    MEDICATION_STATEMENT {
        string id PK
        string patient_id FK
        string document_id FK
        string name_as_written
        string generic_name "Mapped via drug_aliases.json"
        string strength "500 mg"
        string frequency_raw "1-0-1, BD, OD"
        int times_per_day
        string instructions "after food"
        string status "active"
    }

    CONDITION {
        string id PK
        string patient_id FK
        string document_id FK
        string name
        string icd10_hint "E11, I10"
        string clinical_status "active"
        string recorded_date
    }

    DOCUMENT_SUMMARY {
        string id PK
        string document_id FK
        string language "en | hi | te"
        string summary_json "Class 8 Plain Language JSON"
    }

    FHIR_RESOURCE {
        string id PK
        string patient_id FK
        string resource_type "Patient | Observation | MedicationStatement | Bundle"
        string resource_json
    }
```

---

## 5. Healthcare Safety & Guardrails
1. **Rule-Based Normal/Abnormal Categorization**: The LLM is never allowed to determine whether a lab value is normal, high, or critical. The validation engine performs deterministic boundary checks against validated reference ranges.
2. **Strict Refusal of Clinical Directives**: Red-team defenses intercept questions about altering, stopping, or increasing medication (e.g., "should I stop my metformin?") with firm directions to seek the prescribing physician's advice.
3. **Audio Accessibility**: Multilingual text-to-speech supports patient health literacy across diverse Indian language speakers via the Web Speech API (`en-IN`, `hi-IN`, `te-IN`).
4. **Auditability**: Original documents, 200-DPI high-fidelity rendered pages, raw extraction JSON, and confidence scores are preserved for every entity.
