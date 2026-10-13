import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import {
  UploadCloud,
  Camera,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react'

interface UploadViewProps {
  patientId: string
  onDocumentProcessed: (documentId: string) => void
}

export const UploadView: React.FC<UploadViewProps> = ({
  patientId,
  onDocumentProcessed,
}) => {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const steps = [
    t('upload.step_reading'),
    t('upload.step_extracting'),
    t('upload.step_checking'),
    t('upload.step_summarizing'),
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setErrorMessage(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setErrorMessage(null)
    }
  }

  const handleProcessUpload = async () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setErrorMessage(null)
    setCurrentStep(1)

    // Visual step progression simulator for pipeline steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev))
    }, 1800)

    try {
      const res = await api.uploadDocument(patientId, selectedFile)
      clearInterval(stepInterval)
      setCurrentStep(4)
      setTimeout(() => {
        setIsProcessing(false)
        onDocumentProcessed(res.document_id)
      }, 1000)
    } catch (err: any) {
      clearInterval(stepInterval)
      setIsProcessing(false)
      setErrorMessage(err.message || 'Error processing medical document. Please try again.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-chocolate-deep">{t('upload.title')}</h1>
        <p className="text-sm text-chocolate mt-1 max-w-lg mx-auto">{t('upload.subtitle')}</p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-cream-light rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-caramel bg-latte/60 scale-[1.01]'
            : selectedFile
            ? 'border-caramel-light bg-latte/30'
            : 'border-latte-dark hover:border-caramel'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-latte text-caramel flex items-center justify-center mx-auto shadow-xs border border-latte-dark">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-chocolate-deep">{selectedFile.name}</h3>
              <p className="text-xs text-chocolate mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                disabled={isProcessing}
                onClick={handleProcessUpload}
                className="px-6 py-2.5 rounded-xl bg-caramel hover:bg-caramel-dark text-white font-semibold text-sm shadow-xs transition-colors flex items-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('upload.processing')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('upload.upload_btn')}
                  </>
                )}
              </button>

              <button
                disabled={isProcessing}
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2.5 rounded-xl border border-latte-dark text-chocolate-dark hover:bg-latte text-sm font-medium transition-colors"
              >
                Choose Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-latte text-chocolate border border-latte-dark flex items-center justify-center mx-auto shadow-xs">
              <UploadCloud className="w-8 h-8 text-caramel" />
            </div>
            <div>
              <p className="text-sm font-medium text-chocolate-deep">{t('upload.drag_drop')}</p>
              <p className="text-xs text-chocolate/80 mt-1">Supports PDF, JPG, PNG up to 15MB (handwritten & regional Indian scripts)</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-caramel hover:bg-caramel-dark text-white font-semibold text-sm shadow-xs transition-colors"
              >
                Browse Files
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-latte hover:bg-latte-dark text-chocolate-deep border border-latte-dark font-semibold text-sm transition-colors flex items-center"
              >
                <Camera className="w-4 h-4 mr-2 text-caramel" />
                {t('upload.camera_btn')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Stepper during Processing */}
      {isProcessing && (
        <div className="bg-cream-light rounded-2xl p-6 border border-latte-dark shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-caramel animate-spin" />
            <h3 className="font-bold text-sm text-chocolate-deep">Pipeline Execution in Progress</h3>
          </div>

          <div className="space-y-2">
            {steps.map((st, idx) => {
              const isDone = currentStep > idx + 1
              const isCurr = currentStep === idx + 1
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                    isDone
                      ? 'bg-latte border-latte-dark text-chocolate-deep'
                      : isCurr
                      ? 'bg-latte-dark/50 border-caramel text-chocolate-deep animate-pulse'
                      : 'bg-cream border-latte-dark text-chocolate/50'
                  }`}
                >
                  <span className="flex items-center">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-caramel mr-2" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center mr-2 text-[10px]">
                        {idx + 1}
                      </span>
                    )}
                    {st}
                  </span>
                  {isCurr && <span className="text-[10px] bg-caramel px-2 py-0.5 rounded text-white font-bold">ACTIVE</span>}
                  {isDone && <span className="text-[10px] text-caramel font-bold">DONE</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Upload Failed</h4>
            <p className="mt-0.5 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Sample Document Quick-Load Buttons for Demonstration */}
      <div className="bg-latte/50 rounded-2xl p-5 border border-latte-dark">
        <h4 className="font-bold text-xs uppercase tracking-wider text-chocolate mb-2.5">
          Demo Quick Load (Synthetic Test Documents)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              const file = new File(['synthetic comprehensive patient dataset'], 'sample_patient_dataset_project_testing.pdf', {
                type: 'application/pdf',
              })
              setSelectedFile(file)
              setErrorMessage(null)
            }}
            className="p-3 rounded-xl bg-cream-light hover:bg-latte border border-latte-dark hover:border-caramel flex flex-col justify-between text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="font-medium text-chocolate-deep flex items-center group-hover:text-caramel">
              <FileText className="w-4 h-4 text-caramel mr-1.5 shrink-0" />
              <span className="truncate">sample_patient_dataset.pdf</span>
            </div>
            <span className="text-[11px] text-chocolate/70 mt-1">Full Panel (CBC + HbA1c + Rx)</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              const file = new File(['synthetic lab test data'], 'doc_a_lab_report.pdf', {
                type: 'application/pdf',
              })
              setSelectedFile(file)
              setErrorMessage(null)
            }}
            className="p-3 rounded-xl bg-cream-light hover:bg-latte border border-latte-dark hover:border-caramel flex flex-col justify-between text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="font-medium text-chocolate-deep flex items-center group-hover:text-caramel">
              <FileText className="w-4 h-4 text-caramel mr-1.5 shrink-0" />
              <span className="truncate">doc_a_lab_report.pdf</span>
            </div>
            <span className="text-[11px] text-chocolate/70 mt-1">CBC + HbA1c + Lipid Panel</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              const file = new File(['synthetic prescription image'], 'doc_b_prescription.png', {
                type: 'image/png',
              })
              setSelectedFile(file)
              setErrorMessage(null)
            }}
            className="p-3 rounded-xl bg-cream-light hover:bg-latte border border-latte-dark hover:border-caramel flex flex-col justify-between text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="font-medium text-chocolate-deep flex items-center group-hover:text-caramel">
              <FileText className="w-4 h-4 text-caramel mr-1.5 shrink-0" />
              <span className="truncate">doc_b_prescription.png</span>
            </div>
            <span className="text-[11px] text-chocolate/70 mt-1">Bilingual Prescription (4 Meds)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
