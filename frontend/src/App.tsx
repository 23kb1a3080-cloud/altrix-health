import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n/config'
import type { PatientProfile } from './api/client'
import { api } from './api/client'
import { Navbar } from './components/Navbar'
import { AboutView } from './components/AboutView'
import { DashboardView } from './components/DashboardView'
import { UploadView } from './components/UploadView'
import { DocumentDetailView } from './components/DocumentDetailView'
import { TimelineView } from './components/TimelineView'
import { ChatView } from './components/ChatView'
import { ABHAView } from './components/ABHAView'
import { ShieldAlert, FileDown, Printer, Heart } from 'lucide-react'

export function App() {
  const { t } = useTranslation()
  const [currentTab, setCurrentTab] = useState<string>('about')
  const [patientId] = useState<string>('patient-ravi-kumar-demo')
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getProfile(patientId)
      setProfile(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportFHIR = () => {
    api.exportFHIRBundle(patientId)
  }

  const handlePrintSummary = () => {
    window.print()
  }

  const handleDocumentProcessed = (docId: string) => {
    setActiveDocumentId(docId)
    loadProfile()
  }

  const handleOpenDocument = (docId: string) => {
    setActiveDocumentId(docId)
  }

  const handleBackFromDocument = () => {
    setActiveDocumentId(null)
    loadProfile()
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-chocolate-deep">
      {/* Navbar */}
      <Navbar
        currentTab={activeDocumentId ? 'document' : currentTab}
        setCurrentTab={(tab) => {
          setActiveDocumentId(null)
          setCurrentTab(tab)
        }}
        onExportFHIR={handleExportFHIR}
        onPrintSummary={handlePrintSummary}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-chocolate">Connecting to Altrix Health Copilot...</p>
          </div>
        ) : activeDocumentId ? (
          <DocumentDetailView
            documentId={activeDocumentId}
            onBack={handleBackFromDocument}
          />
        ) : currentTab === 'about' ? (
          <AboutView onNavigateTab={setCurrentTab} />
        ) : currentTab === 'dashboard' && profile ? (
          <DashboardView
            profile={profile}
            onNavigateTab={setCurrentTab}
            onOpenDocument={handleOpenDocument}
          />
        ) : currentTab === 'upload' ? (
          <UploadView
            patientId={patientId}
            onDocumentProcessed={handleDocumentProcessed}
          />
        ) : currentTab === 'timeline' ? (
          <TimelineView
            patientId={patientId}
            onOpenDocument={handleOpenDocument}
          />
        ) : currentTab === 'chat' ? (
          <ChatView
            patientId={patientId}
            onOpenDocument={handleOpenDocument}
          />
        ) : currentTab === 'abha' && profile ? (
          <ABHAView
            profile={profile}
            onProfileUpdated={loadProfile}
            onExportFHIR={handleExportFHIR}
          />
        ) : null}
      </main>

      {/* Persistent Footer with Safety Disclaimer */}
      <footer className="bg-cream-light border-t border-latte-dark mt-auto py-5 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-chocolate">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <ShieldAlert className="w-4 h-4 text-caramel shrink-0" />
            <span className="leading-tight">{t('footer.disclaimer')}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportFHIR}
              className="hover:text-caramel-dark flex items-center font-medium transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 mr-1 text-caramel" />
              {t('dashboard.export_fhir')}
            </button>
            <button
              onClick={handlePrintSummary}
              className="hover:text-caramel-dark flex items-center font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-chocolate" />
              {t('dashboard.share_summary')}
            </button>
            <span className="inline-flex items-center text-[10px] bg-latte text-chocolate-deep font-bold px-2 py-0.5 rounded border border-latte-dark">
              <Heart className="w-2.5 h-2.5 mr-1 text-caramel fill-caramel" />
              {t('footer.abdm_badge')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
