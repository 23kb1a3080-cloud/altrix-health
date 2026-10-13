import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { TimelineEvent, TrendData } from '../api/client'
import { api } from '../api/client'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts'
import {
  Calendar,
  FileText,
  Pill,
  Activity,
  Hospital,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

interface TimelineViewProps {
  patientId: string
  onOpenDocument: (docId: string) => void
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  patientId,
  onOpenDocument,
}) => {
  const { t } = useTranslation()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Trends
  const [selectedTest, setSelectedTest] = useState<string>('hba1c')
  const [trendData, setTrendData] = useState<TrendData | null>(null)

  useEffect(() => {
    loadTimeline()
  }, [filterType])

  useEffect(() => {
    loadTrends(selectedTest)
  }, [selectedTest])

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const res = await api.getTimeline(patientId, filterType)
      setEvents(res.events)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadTrends = async (testName: string) => {
    try {
      const res = await api.getTrends(patientId, testName)
      setTrendData(res)
    } catch (err) {
      console.error(err)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return <Pill className="w-4 h-4 text-caramel" />
      case 'discharge_summary':
        return <Hospital className="w-4 h-4 text-chocolate-dark" />
      case 'abdm_visit':
        return <Activity className="w-4 h-4 text-caramel-dark" />
      default:
        return <FileText className="w-4 h-4 text-chocolate" />
    }
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'bg-latte text-chocolate-deep border-latte-dark'
      case 'discharge_summary':
        return 'bg-latte-dark/60 text-chocolate-deep border-latte-dark'
      case 'abdm_visit':
        return 'bg-latte text-chocolate-dark border-latte-dark'
      default:
        return 'bg-latte text-chocolate-deep border-latte-dark'
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-chocolate">Loading timeline events...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-chocolate-deep">{t('timeline.title')}</h1>
        <p className="text-sm text-chocolate mt-1">{t('timeline.subtitle')}</p>
      </div>

      {/* Longitudinal Lab Trend Chart with Shaded Reference Band */}
      <div className="bg-cream-light rounded-2xl p-6 border border-latte-dark shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-chocolate-deep flex items-center">
              <TrendingUp className="w-5 h-5 text-caramel mr-2" />
              {t('timeline.trend_title')}
            </h2>
            <p className="text-xs text-chocolate">
              Longitudinal tracking over time with clinical reference target band
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-chocolate-dark">{t('timeline.trend_select')}:</label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="bg-cream border border-latte-dark rounded-lg px-3 py-1.5 text-xs font-semibold text-chocolate-deep focus:outline-hidden cursor-pointer"
            >
              <option value="hba1c">Glycated Hemoglobin (HbA1c)</option>
              <option value="fasting_blood_glucose">Fasting Blood Glucose (FBS)</option>
              <option value="hemoglobin">Hemoglobin (Hb)</option>
              <option value="total_cholesterol">Total Cholesterol</option>
              <option value="ldl_cholesterol">LDL Cholesterol</option>
              <option value="serum_creatinine">Serum Creatinine</option>
            </select>
          </div>
        </div>

        {/* Recharts LineChart */}
        {trendData && trendData.data_points.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.data_points} margin={{ top: 10, right: 25, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3E9E0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8D6E63' }} />
                <YAxis
                  unit={` ${trendData.unit}`}
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#8D6E63' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-chocolate-deep text-cream p-3 rounded-xl text-xs shadow-lg space-y-1 border border-caramel/40">
                          <p className="font-semibold text-caramel-light">{data.date}</p>
                          <p className="text-sm font-bold text-white">
                            {data.value} {data.unit}
                          </p>
                          <p className="text-[11px] text-latte">
                            Status Flag:{' '}
                            <span
                              className={`font-semibold ${
                                data.flag === 'NORMAL' ? 'text-caramel-light' : 'text-amber-300'
                              }`}
                            >
                              {data.flag}
                            </span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />

                {/* Shaded Reference Normal Band */}
                {trendData.reference_min !== undefined && trendData.reference_max !== undefined && (
                  <ReferenceArea
                    y1={trendData.reference_min}
                    y2={trendData.reference_max}
                    fill="#C68B59"
                    fillOpacity={0.16}
                    label={{
                      value: `Target Normal (${trendData.reference_min}-${trendData.reference_max} ${trendData.unit})`,
                      position: 'insideTopLeft',
                      fill: '#8D6E63',
                      fontSize: 10,
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#C68B59"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#8D6E63', strokeWidth: 2, stroke: '#FBF6F1' }}
                  activeDot={{ r: 7, fill: '#5D4037' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-chocolate/60">
            No historical series points available for {selectedTest}.
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-latte-dark pb-3">
        {[
          { id: 'all', label: t('timeline.filter_all') },
          { id: 'lab_report', label: t('timeline.filter_labs') },
          { id: 'prescription', label: t('timeline.filter_prescriptions') },
          { id: 'discharge_summary', label: t('timeline.filter_discharge') },
          { id: 'abdm_visit', label: t('timeline.filter_abdm') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === tab.id
                ? 'bg-caramel text-white shadow-xs'
                : 'bg-cream-light text-chocolate-dark hover:bg-latte border border-latte-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-latte-dark">
        {events.map((event) => {
          return (
            <div key={event.id} className="relative group">
              {/* Timeline Node Icon */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cream-light border-2 border-caramel flex items-center justify-center shadow-xs">
                {getEventIcon(event.event_type)}
              </div>

              {/* Event Card */}
              <div
                onClick={() => event.document_id && onOpenDocument(event.document_id)}
                className={`bg-cream-light rounded-2xl p-5 border border-latte-dark shadow-xs transition-all ${
                  event.document_id ? 'hover:border-caramel/70 hover:shadow-sm cursor-pointer' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-chocolate flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-caramel" />
                        {event.event_date}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getEventBadge(event.event_type)}`}>
                        {event.event_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-chocolate-deep mt-1">{event.title}</h3>
                    <p className="text-xs text-chocolate mt-0.5">
                      {event.facility && `Facility: ${event.facility}`}
                      {event.doctor && ` • Doctor: ${event.doctor}`}
                    </p>
                  </div>

                  {event.document_id && (
                    <div className="text-caramel hover:text-caramel-dark flex items-center text-xs font-semibold">
                      <span>View Record</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>

                {/* Event Details Summary */}
                <div className="mt-3 pt-3 border-t border-latte-dark flex flex-wrap gap-4 text-xs text-chocolate">
                  {event.details.tests_count > 0 && (
                    <span className="font-medium text-chocolate-deep bg-latte px-2 py-0.5 rounded border border-latte-dark">
                      🧪 {event.details.tests_count} Lab Tests
                    </span>
                  )}
                  {event.details.medicines_count > 0 && (
                    <span className="font-medium text-chocolate-deep bg-latte px-2 py-0.5 rounded border border-latte-dark">
                      💊 {event.details.medicines_count} Prescribed Medicines
                    </span>
                  )}
                  {event.details.summary && (
                    <span className="text-chocolate/80">{event.details.summary}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
