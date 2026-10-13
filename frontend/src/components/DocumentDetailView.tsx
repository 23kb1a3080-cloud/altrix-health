import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { DocumentDetail, PlainLanguageSummary } from '../api/client'
import { api } from '../api/client'
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Save,
  Pill,
  FileText,
  AlertCircle,
  HelpCircle,
  ZoomIn,
} from 'lucide-react'

interface DocumentDetailViewProps {
  documentId: string
  onBack: () => void
}

export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({
  documentId,
  onBack,
}) => {
  const { t, i18n } = useTranslation()
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLang, setSummaryLang] = useState<string>(i18n.language || 'en')
  const [summary, setSummary] = useState<PlainLanguageSummary | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Local editable copies of lab results
  const [editLabs, setEditLabs] = useState<any[]>([])
  const [editMeds, setEditMeds] = useState<any[]>([])

  useEffect(() => {
    loadDocumentData()
  }, [documentId])

  useEffect(() => {
    if (doc) {
      loadLanguageSummary(summaryLang)
    }
  }, [summaryLang, doc?.id])

  // Stop speech if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const loadDocumentData = async () => {
    setLoading(true)
    try {
      const data = await api.getDocument(documentId)
      setDoc(data)
      setSummary(data.summary || null)
      setEditLabs(data.validated_labs || [])
      setEditMeds(data.validated_medicines || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadLanguageSummary = async (lang: string) => {
    try {
      const sum = await api.getSummary(documentId, lang)
      setSummary(sum)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSpeechToggle = () => {
    if (!('speechSynthesis' in window) || !summary) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    const textToSpeak = `${summary.headline}. ${summary.key_points.join('. ')}. ${
      summary.urgency_note ? summary.urgency_note + '.' : ''
    } ${summary.disclaimer}`

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    const langCode = summaryLang === 'te' ? 'te-IN' : summaryLang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.lang = langCode
    utterance.rate = 0.95

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)
    setIsPlayingAudio(true)
  }

  const handleSaveEdits = async () => {
    setIsSaving(true)
    try {
      const patchPayload = {
        lab_results: editLabs.map((l) => ({
          test_name: l.test_name,
          value_text: String(l.value_numeric ?? l.value_text),
          value_numeric: Number(l.value_numeric ?? l.value_text),
          unit: l.unit,
          printed_reference_range: l.printed_reference_range,
          confidence: 1.0,
          source_text: 'User Correction',
        })),
        medicines: editMeds.map((m) => ({
          name_as_written: m.name_as_written,
          strength: m.strength,
          frequency_raw: m.frequency_raw,
          instructions: m.instructions,
          confidence: 1.0,
          source_text: 'User Correction',
        })),
      }
      await api.patchDocumentEntities(documentId, patchPayload)
      await loadDocumentData()
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || !doc) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-chocolate">Loading document details & validation...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-latte-dark text-chocolate-dark hover:bg-latte transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-chocolate-deep">{doc.original_filename}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase bg-latte text-chocolate-dark border border-latte-dark">
                {doc.type.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-cream text-chocolate border border-latte-dark">
                {doc.extraction_method === 'gemini_multimodal' ? 'Gemini AI OCR' : 'Tesseract Rule Fallback'}
              </span>
            </div>
            <p className="text-xs text-chocolate mt-0.5">
              Facility: {doc.facility || 'Clinic'} • Doctor: {doc.doctor || 'Physician'} • Date: {doc.doc_date || 'Recent'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <button
              onClick={handleSaveEdits}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 bg-caramel hover:bg-caramel-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? 'Re-calculating...' : t('doc_detail.save_edits')}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-latte-dark hover:bg-latte text-chocolate-deep rounded-xl text-xs font-semibold transition-colors"
            >
              {t('doc_detail.edit_values')}
            </button>
          )}
        </div>
      </div>

      {/* Split View: Left Document Preview, Right Extracted Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Original Preview Image */}
        <div className="lg:col-span-5 bg-cream-light rounded-2xl p-4 border border-latte-dark shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-latte-dark">
            <span className="font-bold text-xs uppercase tracking-wider text-chocolate flex items-center">
              <ZoomIn className="w-4 h-4 mr-1 text-caramel" />
              {t('doc_detail.original_view')}
            </span>
            <span className="text-[11px] text-chocolate/70">200-DPI Preprocessed</span>
          </div>

          <div className="flex-1 bg-cream rounded-xl overflow-hidden min-h-[420px] max-h-[580px] flex items-center justify-center border border-latte-dark relative">
            {doc.preview_url ? (
              <img
                src={doc.preview_url}
                alt="Document Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-6 text-chocolate/60">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50 text-chocolate" />
                <p className="text-xs">Original file stored under secure storage</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Structured Extracted Table & Validation */}
        <div className="lg:col-span-7 bg-cream-light rounded-2xl p-5 border border-latte-dark shadow-xs space-y-6">
          {/* Lab Observations Table */}
          {editLabs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-bold text-sm text-chocolate-deep flex items-center">
                  <FileText className="w-4 h-4 text-caramel mr-1.5" />
                  Validated Lab Results ({editLabs.length})
                </h3>
                {doc.needs_review_count > 0 && (
                  <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                    {doc.needs_review_count} {t('doc_detail.needs_review')}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-latte-dark">
                <table className="min-w-full divide-y divide-latte-dark text-xs">
                  <thead className="bg-latte text-chocolate-deep font-semibold">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Investigation</th>
                      <th className="px-3 py-2.5 text-left">Value</th>
                      <th className="px-3 py-2.5 text-left">Unit</th>
                      <th className="px-3 py-2.5 text-left">Reference Range</th>
                      <th className="px-3 py-2.5 text-center">Status Flag</th>
                      <th className="px-3 py-2.5 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-latte-dark/60 bg-cream-light">
                    {editLabs.map((lab, idx) => {
                      const isHigh = lab.flag.includes('HIGH')
                      const isLow = lab.flag.includes('LOW')
                      return (
                        <tr key={idx} className="hover:bg-latte/40">
                          <td className="px-3 py-2 font-medium text-chocolate-deep">{lab.test_name}</td>
                          <td className="px-3 py-2 font-bold text-chocolate-deep">
                            {isEditing ? (
                              <input
                                type="number"
                                step="any"
                                value={lab.value_numeric ?? ''}
                                onChange={(e) => {
                                  const updated = [...editLabs]
                                  updated[idx].value_numeric = parseFloat(e.target.value) || 0
                                  setEditLabs(updated)
                                }}
                                className="w-20 px-1.5 py-0.5 border border-caramel rounded bg-cream text-chocolate-deep focus:outline-hidden"
                              />
                            ) : (
                              lab.value_text
                            )}
                          </td>
                          <td className="px-3 py-2 text-chocolate">{lab.unit || '-'}</td>
                          <td className="px-3 py-2 text-chocolate text-[11px]">
                            {lab.standard_reference_range || lab.printed_reference_range || '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-latte text-chocolate-deep border border-latte-dark'
                              }`}
                            >
                              {lab.flag}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                lab.confidence >= 0.8
                                  ? 'bg-latte text-chocolate-deep'
                                  : 'bg-amber-100 text-amber-800 font-bold'
                              }`}
                            >
                              {(lab.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medicines Table */}
          {editMeds.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-chocolate-deep flex items-center mb-2.5">
                <Pill className="w-4 h-4 text-caramel mr-1.5" />
                Extracted Prescriptions ({editMeds.length})
              </h3>
              <div className="space-y-2">
                {editMeds.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-cream border border-latte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-chocolate-deep">{med.name_as_written}</span>
                        {med.generic_name && (
                          <span className="text-xs text-caramel font-medium">({med.generic_name})</span>
                        )}
                      </div>
                      {med.instructions && (
                        <p className="text-xs text-chocolate mt-0.5">{med.instructions}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-semibold bg-cream-light px-2 py-1 rounded border border-latte-dark text-chocolate-dark">
                        {med.strength || med.dose || 'Standard dose'}
                      </span>
                      <span className="text-xs font-mono font-bold bg-latte text-chocolate-deep px-2 py-1 rounded border border-latte-dark">
                        {med.frequency_raw || 'OD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Plain-Language Multilingual Medical Explanation */}
      {summary && (
        <div className="bg-gradient-to-br from-latte/90 via-cream-light to-latte/60 rounded-2xl p-6 border border-latte-dark shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-latte-dark">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-caramel animate-pulse" />
                <h3 className="font-bold text-base text-chocolate-deep">{summary.headline}</h3>
              </div>
              <p className="text-xs text-chocolate mt-0.5">Class 8 Reading Level • Verified Medical Guardrails</p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Language Switcher for Summary */}
              <div className="flex items-center bg-cream-light rounded-lg px-2.5 py-1 border border-latte-dark shadow-2xs">
                <Languages className="w-4 h-4 text-caramel mr-1.5" />
                <select
                  aria-label="Summary Language"
                  value={summaryLang}
                  onChange={(e) => setSummaryLang(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-chocolate-deep focus:outline-hidden cursor-pointer"
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">हिन्दी (HI)</option>
                  <option value="te">తెలుగు (TE)</option>
                </select>
              </div>

              {/* Audio Listen Button */}
              <button
                onClick={handleSpeechToggle}
                className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                  isPlayingAudio
                    ? 'bg-rose-700 text-white hover:bg-rose-800'
                    : 'bg-caramel text-white hover:bg-caramel-dark'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 mr-1.5" />
                    {t('doc_detail.stop_audio')}
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-1.5" />
                    {t('doc_detail.listen')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Urgency Note if critical */}
          {summary.urgency_note && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-sm">Medical Attention Recommended</h4>
                <p className="mt-0.5 leading-relaxed">{summary.urgency_note}</p>
              </div>
            </div>
          )}

          {/* Key Points */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-chocolate">Key Highlights</h4>
            <ul className="space-y-1 text-xs text-chocolate-dark">
              {summary.key_points.map((pt, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-caramel mr-2 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Abnormal Findings Explanations */}
          {summary.abnormal_findings && summary.abnormal_findings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-caramel-dark">Abnormal Value Explanations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summary.abnormal_findings.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-cream-light border border-latte-dark shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-chocolate-deep">{item.test}: {item.value}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-latte text-chocolate-deep border border-latte-dark">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-chocolate-dark">
                      <strong className="text-chocolate-deep">What it means:</strong> {item.what_it_means}
                    </p>
                    <p className="text-xs text-chocolate">
                      <strong className="text-chocolate-dark">Common non-serious factors:</strong> {item.common_non_serious_causes}
                    </p>
                    <p className="text-xs text-caramel-dark font-medium">
                      💡 Discuss with doctor: {item.ask_your_doctor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Questions for Doctor */}
          {summary.suggested_questions_for_doctor && summary.suggested_questions_for_doctor.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-chocolate-deep flex items-center">
                <HelpCircle className="w-3.5 h-3.5 mr-1 text-caramel" />
                Suggested Questions to Ask Your Doctor
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {summary.suggested_questions_for_doctor.map((q, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-cream-light border border-latte-dark text-xs text-chocolate-deep font-medium flex items-start">
                    <span className="w-4 h-4 rounded-full bg-latte text-chocolate-deep border border-latte-dark text-[10px] font-bold flex items-center justify-center mr-2 shrink-0">
                      {i + 1}
                    </span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="pt-2 border-t border-latte-dark text-[11px] text-chocolate/80 italic">
            {summary.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
