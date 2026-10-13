import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PatientProfile } from '../api/client'
import { api } from '../api/client'
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react'

interface ABHAViewProps {
  profile: PatientProfile
  onProfileUpdated: () => void
  onExportFHIR: () => void
}

export const ABHAView: React.FC<ABHAViewProps> = ({
  profile,
  onProfileUpdated,
  onExportFHIR,
}) => {
  const { t } = useTranslation()
  const { patient } = profile

  const [activeSubTab, setActiveSubTab] = useState<'card' | 'create' | 'link'>('card')
  const [createName, setCreateName] = useState(patient.name)
  const [prefAddress, setPrefAddress] = useState('ravikumar')
  const [createdABHA, setCreatedABHA] = useState<{ abha_number: string; abha_address: string } | null>(null)

  const [linkNumber, setLinkNumber] = useState(patient.abha_number || '14-8723-9182-3490')
  const [linkOtp, setLinkOtp] = useState('123456')
  const [linkStatus, setLinkStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateMockABHA = async () => {
    setIsLoading(true)
    try {
      const res = await api.createABHA(createName, prefAddress)
      setCreatedABHA({ abha_number: res.abha_number, abha_address: res.abha_address })
      setLinkNumber(res.abha_number)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkABHA = async () => {
    setIsLoading(true)
    setLinkStatus(null)
    try {
      const res = await api.linkABHA(patient.id, linkNumber, linkOtp)
      setLinkStatus(res.message)
      onProfileUpdated()
      setTimeout(() => {
        setActiveSubTab('card')
      }, 1500)
    } catch (err: any) {
      setLinkStatus(err.message || 'Error linking ABHA.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-caramel text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-chocolate-deep">{t('abha.title')}</h1>
            <p className="text-xs text-chocolate">{t('abha.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-latte-dark pb-3">
        {[
          { id: 'card', label: t('abha.card_title') },
          { id: 'create', label: t('abha.create_tab') },
          { id: 'link', label: t('abha.link_tab') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeSubTab === tab.id
                ? 'bg-caramel text-white shadow-xs'
                : 'bg-cream-light text-chocolate-dark hover:bg-latte border border-latte-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Digital ABHA Card View */}
      {activeSubTab === 'card' && (
        <div className="space-y-6">
          <div className="max-w-md mx-auto bg-gradient-to-tr from-chocolate-deep via-chocolate-dark to-chocolate rounded-3xl p-6 sm:p-8 text-cream shadow-xl border-2 border-caramel/50 relative overflow-hidden">
            {/* National Health Authority Header simulation */}
            <div className="flex items-center justify-between pb-4 border-b border-latte-dark/30">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                  🇮🇳
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-caramel-light">
                    National Health Authority (NHA)
                  </h4>
                  <p className="text-[10px] text-latte">Ayushman Bharat Digital Mission</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-caramel/30 text-cream border border-caramel/50 px-2 py-0.5 rounded">
                SIMULATED SANDBOX
              </span>
            </div>

            {/* Card Body */}
            <div className="my-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{patient.name}</h3>
                <p className="text-xs text-latte mt-0.5">
                  Age: {patient.age || 52} Yrs • Gender: {patient.sex || 'Male'}
                </p>
                <div className="mt-4">
                  <span className="text-[10px] uppercase font-semibold text-caramel-light">ABHA Number:</span>
                  <p className="text-lg font-mono font-bold tracking-wider text-white">
                    {patient.abha_number || '14-8723-9182-3490'}
                  </p>
                </div>
                <div className="mt-1">
                  <span className="text-[10px] uppercase font-semibold text-caramel-light">ABHA Address:</span>
                  <p className="text-sm font-medium text-white">
                    {patient.abha_address || 'ravikumar@abdm'}
                  </p>
                </div>
              </div>

              {/* QR Code Graphic placeholder */}
              <div className="w-24 h-24 bg-cream-light p-2 rounded-2xl flex flex-col items-center justify-center text-chocolate-deep shadow-md border border-latte-dark">
                <QrCode className="w-16 h-16 text-chocolate-dark" />
                <span className="text-[8px] font-bold uppercase tracking-tight text-chocolate mt-0.5">Scan PHR</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-latte-dark/30 flex items-center justify-between text-[10px] text-caramel-light">
              <span>Consent Manager: ABDM Sandbox</span>
              <span className="flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-caramel" />
                FHIR R4 Verified
              </span>
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onExportFHIR}
              className="px-5 py-2.5 rounded-xl bg-caramel hover:bg-caramel-dark text-white font-semibold text-xs shadow-xs transition-colors flex items-center"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {t('dashboard.export_fhir')}
            </button>
          </div>
        </div>
      )}

      {/* Create Simulated ABHA */}
      {activeSubTab === 'create' && (
        <div className="bg-cream-light rounded-2xl p-6 border border-latte-dark shadow-xs max-w-lg mx-auto space-y-4">
          <h3 className="font-bold text-sm text-chocolate-deep flex items-center">
            <Sparkles className="w-4 h-4 text-caramel mr-2" />
            Generate Simulated ABHA Credentials
          </h3>
          <p className="text-xs text-chocolate">
            Creates a valid 14-digit ABDM number formatted XX-XXXX-XXXX-XXXX and a linked @abdm address.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-chocolate-dark">Full Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-latte-dark bg-cream rounded-xl text-xs text-chocolate-deep focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-chocolate-dark">Preferred Address Prefix</label>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={prefAddress}
                  onChange={(e) => setPrefAddress(e.target.value)}
                  className="flex-1 px-3 py-2 border border-latte-dark bg-cream rounded-l-xl text-xs text-chocolate-deep focus:outline-hidden"
                />
                <span className="bg-latte border border-l-0 border-latte-dark px-3 py-2 text-xs text-chocolate-dark rounded-r-xl font-mono">
                  @abdm
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateMockABHA}
            disabled={isLoading}
            className="w-full py-2.5 bg-caramel hover:bg-caramel-dark text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {t('abha.create_btn')}
          </button>

          {createdABHA && (
            <div className="p-4 bg-latte border border-latte-dark rounded-xl space-y-1 text-xs text-chocolate-deep">
              <h4 className="font-bold">Generated Simulated ABHA:</h4>
              <p>Number: <strong className="font-mono">{createdABHA.abha_number}</strong></p>
              <p>Address: <strong className="font-mono">{createdABHA.abha_address}</strong></p>
              <button
                onClick={() => setActiveSubTab('link')}
                className="text-xs font-semibold text-caramel hover:text-caramel-dark underline mt-2 block"
              >
                Proceed to Link with OTP →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Link Mock ABHA with OTP */}
      {activeSubTab === 'link' && (
        <div className="bg-cream-light rounded-2xl p-6 border border-latte-dark shadow-xs max-w-lg mx-auto space-y-4">
          <h3 className="font-bold text-sm text-chocolate-deep flex items-center">
            <LinkIcon className="w-4 h-4 text-caramel mr-2" />
            Link Simulated ABHA & Import Historical Records
          </h3>
          <p className="text-xs text-chocolate">
            Simulates linking to the National Health Authority consent manager and imports past visits from mock ABDM bundle.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-chocolate-dark">ABHA Number or Address</label>
              <input
                type="text"
                value={linkNumber}
                onChange={(e) => setLinkNumber(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-latte-dark bg-cream rounded-xl text-xs font-mono text-chocolate-deep focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-chocolate-dark">{t('abha.otp_label')}</label>
              <input
                type="text"
                maxLength={6}
                value={linkOtp}
                onChange={(e) => setLinkOtp(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-caramel/70 bg-cream rounded-xl text-xs font-mono tracking-widest text-chocolate-deep focus:outline-hidden"
              />
              <span className="text-[11px] text-chocolate font-medium block mt-1">{t('abha.otp_hint')}</span>
            </div>
          </div>

          <button
            onClick={handleLinkABHA}
            disabled={isLoading}
            className="w-full py-2.5 bg-caramel hover:bg-caramel-dark text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {t('abha.link_btn')}
          </button>

          {linkStatus && (
            <div className="p-3 bg-latte border border-latte-dark rounded-xl text-xs text-chocolate-deep">
              {linkStatus}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
