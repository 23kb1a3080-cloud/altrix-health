import React from 'react'
import { useTranslation } from 'react-i18next'
import type { PatientProfile } from '../api/client'
import {
  AlertTriangle,
  AlertCircle,
  Pill,
  FileText,
  Upload,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface DashboardViewProps {
  profile: PatientProfile
  onNavigateTab: (tab: string) => void
  onOpenDocument: (docId: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  onNavigateTab,
  onOpenDocument,
}) => {
  const { t } = useTranslation()
  const { patient, active_conditions, current_medicines, latest_labs, alerts } = profile

  const getLabFlagBadge = (flag: string) => {
    switch (flag) {
      case 'CRITICAL_HIGH':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          indicator: 'bg-rose-500',
          icon: <ArrowUpRight className="w-4 h-4 text-rose-600" />,
          label: 'CRITICAL HIGH',
        }
      case 'CRITICAL_LOW':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          indicator: 'bg-rose-500',
          icon: <ArrowDownRight className="w-4 h-4 text-rose-600" />,
          label: 'CRITICAL LOW',
        }
      case 'HIGH':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          indicator: 'bg-caramel',
          icon: <ArrowUpRight className="w-4 h-4 text-amber-600" />,
          label: 'HIGH',
        }
      case 'LOW':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          indicator: 'bg-blue-500',
          icon: <ArrowDownRight className="w-4 h-4 text-blue-600" />,
          label: 'LOW',
        }
      default:
        return {
          bg: 'bg-latte border-latte-dark text-chocolate-deep',
          indicator: 'bg-caramel',
          icon: <CheckCircle2 className="w-4 h-4 text-caramel" />,
          label: 'NORMAL',
        }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Patient Profile Banner */}
      <div className="bg-gradient-to-r from-chocolate-deep via-chocolate-dark to-chocolate rounded-2xl p-6 sm:p-8 text-cream shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-caramel/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-latte text-sm font-medium tracking-wide uppercase">
                {t('dashboard.welcome')}
              </span>
              <span className="bg-caramel/30 text-cream border border-caramel/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Mock ABHA Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{patient.name}</h1>
            
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-latte">
              <div className="flex items-center">
                <span className="text-caramel-light mr-1.5">{t('dashboard.abha_id')}:</span>
                <span className="font-mono bg-chocolate-deep/80 px-2 py-0.5 rounded text-white font-medium border border-caramel/40">
                  {patient.abha_number || '14-8723-9182-3490'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-caramel-light mr-1.5">{t('dashboard.abha_address')}:</span>
                <span className="font-medium text-cream">{patient.abha_address || 'ravikumar@abdm'}</span>
              </div>
              <div>
                <span>{patient.age || 52} Yrs • {patient.sex || 'Male'} • Visakhapatnam</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('upload')}
              className="inline-flex items-center px-4 py-2.5 bg-caramel text-white font-semibold text-sm rounded-xl hover:bg-caramel-dark transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 mr-2 text-white" />
              {t('dashboard.upload_new')}
            </button>
            <button
              onClick={() => onNavigateTab('chat')}
              className="inline-flex items-center px-4 py-2.5 bg-chocolate-deep/80 hover:bg-chocolate-deep text-cream font-medium text-sm rounded-xl border border-caramel/30 transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2 text-caramel-light" />
              {t('nav.chat')}
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Health Alerts */}
      {alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-chocolate-deep flex items-center">
              <AlertTriangle className="w-5 h-5 text-caramel mr-2" />
              {t('dashboard.clinical_alerts')}
            </h2>
            <span className="text-xs text-chocolate font-medium">{alerts.length} Flagged Observations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert, idx) => {
              const isCrit = alert.severity === 'critical'
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isCrit
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isCrit ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                      {isCrit ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{alert.title}</h4>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isCrit ? 'bg-rose-200/80 text-rose-800' : 'bg-amber-200/80 text-amber-800'}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">{alert.description}</p>
                      {alert.source_document_id && (
                        <button
                          onClick={() => onOpenDocument(alert.source_document_id!)}
                          className="mt-2 text-xs font-semibold text-caramel hover:text-caramel-dark underline flex items-center"
                        >
                          View Source Document →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-latte/70 border border-latte-dark rounded-xl flex items-center space-x-3 text-chocolate-deep">
          <CheckCircle2 className="w-5 h-5 text-caramel shrink-0" />
          <p className="text-sm">{t('dashboard.no_alerts')}</p>
        </div>
      )}

      {/* Latest Key Lab Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-chocolate-deep flex items-center">
              <FileText className="w-5 h-5 text-caramel mr-2" />
              {t('dashboard.latest_labs')}
            </h2>
            <p className="text-xs text-chocolate">Deterministically flagged using age/sex clinical reference ranges</p>
          </div>
          <button
            onClick={() => onNavigateTab('timeline')}
            className="text-xs font-semibold text-caramel hover:text-caramel-dark flex items-center"
          >
            {t('dashboard.view_timeline')} →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {latest_labs.map((lab) => {
            const badge = getLabFlagBadge(lab.flag)
            return (
              <div
                key={lab.id}
                className="bg-cream-light rounded-xl p-4 border border-latte-dark shadow-xs hover:border-caramel/70 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-sm text-chocolate-deep line-clamp-1" title={lab.test_name}>
                      {lab.test_name}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                      {badge.icon}
                      <span className="ml-1">{badge.label}</span>
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline space-x-1.5">
                    <span className="text-2xl font-bold tracking-tight text-chocolate-deep">{lab.value_text}</span>
                    <span className="text-xs font-medium text-chocolate">{lab.unit}</span>
                  </div>

                  {lab.standard_reference_range && (
                    <div className="mt-2 text-[11px] text-chocolate">
                      <span>Normal Target: </span>
                      <span className="font-medium text-chocolate-deep">{lab.standard_reference_range}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-latte-dark flex items-center justify-between text-[11px] text-chocolate/80">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1 text-caramel" />
                    {lab.sample_date || 'Recent'}
                  </span>
                  {lab.loinc_code && (
                    <span className="font-mono text-[10px] bg-latte px-1.5 py-0.2 rounded text-chocolate-dark border border-latte-dark">
                      LOINC {lab.loinc_code}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout: Active Conditions & Current Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Conditions */}
        <div className="bg-cream-light rounded-2xl p-5 border border-latte-dark shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-chocolate-deep flex items-center">
              <Clock className="w-4 h-4 text-caramel mr-2" />
              {t('dashboard.active_conditions')}
            </h3>
            <span className="text-xs bg-latte text-chocolate-dark font-semibold px-2 py-0.5 rounded-full border border-latte-dark">
              {active_conditions.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {active_conditions.map((cond) => (
              <div
                key={cond.id}
                className="p-3 rounded-xl bg-cream border border-latte-dark flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-chocolate-deep">{cond.name}</h4>
                  <p className="text-xs text-chocolate mt-0.5">
                    Diagnosed / Recorded: {cond.recorded_date || 'Historical'}
                  </p>
                </div>
                {cond.icd10_hint && (
                  <span className="text-[11px] font-mono bg-cream-light px-2 py-1 rounded border border-latte-dark text-chocolate-dark font-medium">
                    ICD-10: {cond.icd10_hint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Prescribed Medicines */}
        <div className="bg-cream-light rounded-2xl p-5 border border-latte-dark shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-chocolate-deep flex items-center">
              <Pill className="w-4 h-4 text-caramel mr-2" />
              {t('dashboard.current_medicines')}
            </h3>
            <span className="text-xs bg-latte text-chocolate-dark font-semibold px-2 py-0.5 rounded-full border border-latte-dark">
              {current_medicines.length} Tracked
            </span>
          </div>

          <div className="space-y-2.5">
            {current_medicines.map((med) => (
              <div
                key={med.id}
                className="p-3.5 rounded-xl bg-cream border border-latte-dark"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-chocolate-deep">
                      {med.name_as_written}
                    </h4>
                    {med.generic_name && med.generic_name.toLowerCase() !== med.name_as_written.toLowerCase() && (
                      <span className="text-xs text-caramel font-medium">
                        Generic: {med.generic_name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold bg-latte text-chocolate-deep px-2 py-0.5 rounded border border-latte-dark">
                    {med.frequency_raw || 'As directed'}
                  </span>
                </div>

                {med.instructions && (
                  <p className="text-xs text-chocolate mt-1.5 flex items-center">
                    <span className="font-medium mr-1 text-chocolate-deep">Direction:</span> {med.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
