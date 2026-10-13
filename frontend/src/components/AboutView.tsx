import React from 'react'
import {
  ShieldCheck,
  FileText,
  Volume2,
  TrendingUp,
  MessageSquare,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  HeartHandshake,
  AlertTriangle,
  FileCheck,
} from 'lucide-react'

interface AboutViewProps {
  onNavigateTab: (tab: string) => void
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigateTab }) => {

  const capabilities = [
    {
      icon: <FileText className="w-5 h-5 text-caramel" />,
      title: 'Multimodal & Multilingual OCR',
      description:
        'Digitizes Indian medical documents across PDFs, phone photos, and lab reports. Seamlessly parses bilingual English, Hindi, and Telugu text and handwritten prescriptions.',
      badge: '100% Benchmark Accuracy',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-caramel" />,
      title: 'Deterministic Clinical Validation',
      description:
        'Biomarkers and lab tests are mapped to official LOINC codes and verified against age- and sex-stratified normal ranges. Abnormal values are never guessed by an LLM.',
      badge: 'Zero Hallucinations',
    },
    {
      icon: <Volume2 className="w-5 h-5 text-caramel" />,
      title: 'Plain-Language Audio Summaries',
      description:
        'Translates complex medical jargon into 8th-grade reading level summaries in English, Hindi, and Telugu, with text-to-speech voice narration for accessible understanding.',
      badge: 'EN • HI • TE Voice',
    },
    {
      icon: <QrCode className="w-5 h-5 text-caramel" />,
      title: 'ABDM & 14-Digit ABHA ID',
      description:
        'Generates standard XX-XXXX-XXXX-XXXX ABHA numbers, links to the Ayushman Bharat Digital Mission sandbox, and packages health records into valid FHIR R4 JSON Bundles.',
      badge: 'ABDM FHIR R4 Ready',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-caramel" />,
      title: 'Longitudinal Biomarker Trends',
      description:
        'Aggregates historical lab values across different hospitals into chronological timelines with interactive charts and shaded reference target bands.',
      badge: 'Interactive Visuals',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-caramel" />,
      title: 'Guardrailed Copilot Chat',
      description:
        'Answers patient queries strictly grounded in uploaded medical records with document citations. Rigorously defends against unsafe diagnostic or medication modification queries.',
      badge: 'Red-Team Defended',
    },
  ]

  const pipelineSteps = [
    {
      num: '01',
      title: 'Ingestion & Enhancement',
      desc: 'PyMuPDF 200-DPI page rendering, SHA-256 deduplication, and image preprocessing.',
    },
    {
      num: '02',
      title: 'Extraction & Normalization',
      desc: 'Multimodal entity extraction, Indic numeral conversion, and date standardization.',
    },
    {
      num: '03',
      title: 'Deterministic Verification',
      desc: 'LOINC range comparison, dosage threshold checks, and duplicate generic alerts.',
    },
    {
      num: '04',
      title: 'FHIR R4 & ABHA Sync',
      desc: 'Assembly into ABDM-compliant FHIR R4 Bundles and exportable clinical summaries.',
    },
  ]

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-chocolate-deep via-chocolate-dark to-chocolate text-cream p-8 sm:p-12 lg:p-16 shadow-xl border border-caramel/30">
        <div className="absolute right-0 top-0 -mr-24 -mt-24 w-96 h-96 bg-caramel/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-20 w-80 h-80 bg-latte/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-latte/20 border border-caramel/40 text-cream text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-caramel-light" />
            <span>Ayushman Bharat Digital Mission (ABDM) & FHIR R4 Aligned</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your Intelligent Health Record Copilot for Indian Healthcare
          </h1>

          <p className="text-base sm:text-lg text-latte leading-relaxed">
            Altrix Health Copilot transforms heterogeneous medical documents—handwritten doctor prescriptions, bilingual reports in English, Hindi, and Telugu, discharge summaries, and lab panels—into standardized, deterministically validated health records with plain-language explanations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-caramel hover:bg-caramel-dark text-white font-bold text-sm shadow-md transition-all hover:scale-105"
            >
              <span>Explore Demo Patient (Ravi Kumar)</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <button
              onClick={() => onNavigateTab('upload')}
              className="inline-flex items-center px-5 py-3 rounded-xl bg-latte/20 hover:bg-latte/30 text-cream border border-caramel/40 font-semibold text-sm transition-colors"
            >
              <FileCheck className="w-4 h-4 mr-2 text-caramel-light" />
              <span>Try Document Ingestion</span>
            </button>
            <button
              onClick={() => onNavigateTab('chat')}
              className="inline-flex items-center px-5 py-3 rounded-xl bg-latte/15 hover:bg-latte/25 text-cream border border-caramel/30 font-semibold text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2 text-caramel-light" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Interactive Demo Highlight */}
      <section className="bg-cream-light rounded-2xl p-6 sm:p-8 border border-latte-dark shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-caramel animate-pulse" />
              <h2 className="text-lg font-bold text-chocolate-deep">Pre-loaded Synthetic Patient: Ravi Kumar (52M)</h2>
            </div>
            <p className="text-xs sm:text-sm text-chocolate leading-relaxed">
              Explore 4 realistic Indian clinical documents already processed and linked: a Complete Blood Count & HbA1c lab report, a bilingual handwritten prescription, an inpatient discharge summary, and follow-up lab investigations with a 14-digit simulated ABHA ID.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-latte text-chocolate-dark font-medium border border-latte-dark">
                ID: 14-8723-9182-3490
              </span>
              <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 font-medium border border-rose-200 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                Flagged: HbA1c 8.4% (Critical High)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-latte text-chocolate-dark font-medium border border-latte-dark">
                4 Documents • 29 Labs • 7 Medicines
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2.5 bg-caramel text-white font-semibold text-xs rounded-xl hover:bg-caramel-dark transition-colors shadow-xs"
            >
              Open Health Profile
            </button>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="px-4 py-2.5 bg-latte text-chocolate-deep font-semibold text-xs rounded-xl hover:bg-latte-dark border border-latte-dark transition-colors"
            >
              View Trends & Timeline
            </button>
            <button
              onClick={() => onNavigateTab('abha')}
              className="px-4 py-2.5 bg-latte text-chocolate-deep font-semibold text-xs rounded-xl hover:bg-latte-dark border border-latte-dark transition-colors"
            >
              View ABHA Card
            </button>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-caramel">Core Architecture & Features</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-chocolate-deep">
            Engineered for Clinical Safety and Patient Clarity
          </h2>
          <p className="text-xs sm:text-sm text-chocolate">
            Built from first principles for the realities of Indian medical documentation with deterministic safety rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="bg-cream-light rounded-2xl p-6 border border-latte-dark shadow-xs hover:border-caramel/70 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-latte border border-latte-dark flex items-center justify-center">
                    {cap.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-latte text-chocolate-dark border border-latte-dark">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base text-chocolate-deep">{cap.title}</h3>
                <p className="text-xs sm:text-sm text-chocolate leading-relaxed">{cap.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Step Pipeline Flow */}
      <section className="bg-cream-light rounded-3xl p-8 sm:p-10 border border-latte-dark shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-latte-dark">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-caramel">End-to-End Pipeline</span>
            <h2 className="text-xl sm:text-2xl font-bold text-chocolate-deep mt-1">
              How Documents Travel Through Altrix Copilot
            </h2>
          </div>
          <div className="inline-flex items-center text-xs text-chocolate-dark bg-latte px-3 py-1 rounded-full border border-latte-dark font-medium">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-caramel" />
            Deterministic Fallback Protected
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-cream border border-latte-dark space-y-2">
              <span className="text-xs font-mono font-extrabold text-caramel bg-latte px-2 py-0.5 rounded">
                STEP {step.num}
              </span>
              <h4 className="font-bold text-sm text-chocolate-deep pt-1">{step.title}</h4>
              <p className="text-xs text-chocolate leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Safety Banner */}
      <section className="rounded-2xl bg-latte/60 border border-latte-dark p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-chocolate-deep">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-latte border border-latte-dark flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5 text-caramel" />
          </div>
          <div>
            <h4 className="font-bold text-chocolate-deep">Patient Safety Guardrails & Human-in-the-Loop</h4>
            <p className="text-xs text-chocolate mt-0.5">
              Patients and physicians can inspect raw document views side-by-side and edit any extracted values. The AI will never prescribe, alter dosages, or deliver medical diagnoses.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('dashboard')}
          className="shrink-0 px-5 py-2.5 bg-caramel hover:bg-caramel-dark text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          Get Started
        </button>
      </section>
    </div>
  )
}
