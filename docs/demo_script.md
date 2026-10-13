# Altrix Health Copilot – Hackathon Demo Script & Slide Deck

## Part 1: Six-Slide Presentation Outline

### Slide 1: The Problem – Fragmentation & Health Illiteracy in Indian Healthcare
- **The Reality**: Over 80% of Indian health records exist as physical papers, handwritten doctor prescriptions, and disparate diagnostic PDF reports across different labs.
- **The Gap**: Patients struggle to understand abnormal markers, leading to missed critical interventions or improper medicine intake (e.g. taking two paracetamol-based brand names simultaneously).
- **The Barrier**: Language divide — reports are written in clinical English jargon, whereas patients think in regional Indian languages (Hindi, Telugu, Tamil, etc.).

### Slide 2: The Solution – Altrix Health Copilot
- **Patient-Centric Personal Copilot**: Upload any prescription, lab report, or discharge summary (printed, handwritten, bilingual English/Telugu).
- **Deterministic Clinical Engine**: Zero LLM hallucinations on lab abnormality flags — deterministic boundary comparisons against 60+ verified medical lab ranges.
- **ABDM & FHIR R4 Native**: Automatic transformation of unstructured reports into interoperable FHIR R4 Bundles linked to an Ayushman Bharat Health Account (ABHA).
- **Multilingual Plain-Language Explanations**: 8th-grade reading level summaries with voice playback in English, Hindi, and Telugu.

### Slide 3: System Architecture & The 6-Stage Pipeline
- **Stage 1 (Ingest)**: SHA-256 dedupe, 200-DPI high-contrast rendering, multi-file validation.
- **Stage 2 (Classify & Extract)**: Gemini 2.5 Flash Multimodal with strict JSON schema enforcement; automatic Tesseract/PyMuPDF fallback for offline environments.
- **Stage 3 (Normalize)**: RapidFuzz Indian brand-to-generic drug matcher (`drug_aliases.json`), frequency normalization (`1-0-1`, `OD`, `BD`, food timing).
- **Stage 4 (Validate)**: Deterministic lab flagging (`NORMAL`, `LOW`, `HIGH`, `CRITICAL`), dosage thresholds, duplicate generic alert detector.
- **Stage 5 (Explain & Audio)**: Empathetic multilingual summary generation and Web Speech API synthesis (`en-IN`, `hi-IN`, `te-IN`).
- **Stage 6 (Persist & Interoperate)**: Relational SQLite persistence and ABDM FHIR R4 collection bundle export.

### Slide 4: Live Demo Highlights
- **Demo Patient**: Ravi Kumar (52M, Visakhapatnam), linked with mock ABHA `14-8723-9182-3490`.
- **Upload & Split-View Verification**: Showing handwritten/bilingual prescription (`Metformin 500 mg 1-0-1 భోజనం తర్వాత`) extracted with 100% precision.
- **Clinical Trend Visualization**: Recharts longitudinal line chart showing Ravi's HbA1c trajectory (8.6% ABDM history → 8.1% diagnosis → 7.2% follow-up) with green shaded target normal band.
- **Human-in-the-Loop Corrections**: Edit values in UI, triggering immediate re-validation and re-summarization.

### Slide 5: Healthcare Safety & Red-Team Guardrails
- **Zero Medical Advice Hallucination**: Copilot strictly refuses to provide medical diagnoses or tell patients to alter/stop medication.
- **Red-Team Defense**: When asked *"Should I stop taking my Metformin?"*, the copilot immediately refuses and directs the patient to their physician.
- **Duplicate Generic Protection**: Alerts patients if multiple prescriptions contain the same active ingredient (e.g., Dolo + Calpol).
- **Privacy & Auditability**: Preserved raw source snippets, confidence badges, and one-click full data deletion for GDPR/DPDP compliance.

### Slide 6: Impact & Future Roadmap
- **ABDM Production Integration**: Live ABDM Sandbox HIP/HIU bridge and consent manager protocol.
- **Expanded Regional Reach**: Adding Tamil, Kannada, Bengali, and Marathi dialects.
- **On-Device Vision Models**: Quantized on-device edge OCR for rural clinics with intermittent connectivity.
- **Wearable Health Ingestion**: Continuous glucose monitors (CGM) and smart BP monitor synchronization.

---

## Part 2: 3-Minute Live Demo Script

### [00:00 - 00:30] Introduction & The Patient Experience
> *"Good morning, judges. Imagine Ravi Kumar, a 52-year-old diabetic patient in Visakhapatnam. Over the past year, he has visited Apollo Clinics, Care Hospitals, and Vijaya Diagnostics. His reports are scattered in physical folders, written in complex medical English, and filled with acronyms like HbA1c, FBS, and 1-0-1.
>
> Today, we are proud to introduce **Altrix Health Copilot** — an AI-powered personal health assistant built specifically for the Indian healthcare ecosystem, fully compliant with ABDM and FHIR R4."*

### [00:30 - 01:15] Unified Dashboard, ABHA & Longitudinal Trends
> *(Screen: Dashboard & Timeline)*
> *"Here is Ravi's unified profile. Notice his simulated 14-digit ABHA ID and `@abdm` address. At a glance, Ravi can see his active conditions, current medications with food instructions, and latest lab parameters.
> 
> Notice the color-coded tiles: his Fasting Glucose is flagged as **HIGH**, his LDL is **HIGH**, and his Hemoglobin is **LOW**. Most importantly, these flags were NOT decided by an LLM — our engine deterministically compared each number against sex- and age-specific clinical reference ranges.
>
> When we navigate to the **Health Timeline**, we see records from his past hospital admission, outpatient visits, and diagnostic reports. Look at this interactive trend chart: it tracks his HbA1c from 8.6% down to 7.2%, with a clear shaded target band representing the normal range."*

### [01:15 - 02:00] Multimodal Extraction & Bilingual Audio Explanations
> *(Screen: Document Detail Split View)*
> *"Now let's examine a raw document. On the left is the high-resolution preprocessed document. On the right is our extracted structured table.
>
> Notice this prescription written with bilingual instructions: 'Metformin 500 mg 1-0-1 after food (భోజనం తర్వాత)'. Our engine extracted the drug, mapped the brand to generic Metformin, parsed '1-0-1' into twice daily after meals, and achieved **100% precision and recall on our benchmark evaluation**.
>
> Look below at the plain-language summary. It explains what abnormal numbers mean without frightening the patient, gives common non-serious causes, and suggests questions to ask the doctor. And with one click:
> *(Click 'Listen' in Telugu or Hindi)*
> The Web Speech API reads the explanation aloud natively in Telugu or Hindi, empowering non-English literate patients."*

### [02:00 - 02:45] Safety Red-Teaming & Grounded Copilot Chat
> *(Screen: Ask Copilot)*
> *"Let's test our healthcare safety defenses. What happens if a patient asks: **'Should I stop taking my Metformin?'**
> *(Click suggested prompt / send query)*
> Watch the copilot's response: It firmly declines to give medication change advice, warns against stopping therapy without supervision, and directs the patient to their prescribing doctor.
> 
> When asked questions about his records, such as **'What was my latest HbA1c?'**, it provides an exact grounded answer with citations to the specific lab report dated 15 June 2025."*

### [02:45 - 03:00] Export & Conclusion
> *(Screen: ABHA & FHIR Export)*
> *"Finally, Altrix Health Copilot makes patient health data truly portable. With one click on **'Export FHIR R4 Bundle'**, we generate a standardized, validated collection bundle ready for any hospital or ABDM consent manager in India.
> 
> Altrix Health Copilot bridges the gap between complex clinical data and patient understanding. Thank you, and we welcome your questions!"*
