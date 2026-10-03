import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ErrorAlert from '@/components/feedback/ErrorAlert'
import { Skeleton } from '@/components/feedback/Skeleton'
import RiskBadge from '@/components/ui/RiskBadge'
import CaseStatusBadge from '@/components/ui/CaseStatusBadge'
import { getDoctorConsultations } from '@/services/consultationsService'
import type { Consultation } from '@/types'
import { formatDate } from '@/utils'

interface PatientVisitHistoryProps {
  patientId?: string
  currentConsultationId: string
}

/** Doctor's view of this patient's other consultations with them, newest first. */
const PatientVisitHistory = ({ patientId, currentConsultationId }: PatientVisitHistoryProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [cases, setCases] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = async () => {
    setLoading(true)
    setFailed(false)
    try {
      setCases(await getDoctorConsultations())
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const previous = useMemo(
    () =>
      cases
        .filter((item) => item.patientId === patientId && item.id !== currentConsultationId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [cases, patientId, currentConsultationId],
  )

  if (!patientId) return null

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <History size={18} className="text-primary" aria-hidden />
        {t('visitHistory.title')}
      </h2>

      {loading ? (
        <div className="mt-4 space-y-3" aria-hidden>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : failed ? (
        <ErrorAlert
          className="mt-3"
          action={
            <button type="button" className="text-sm font-semibold text-primary" onClick={() => void load()}>
              {t('common.retry') || 'Retry'}
            </button>
          }
        >
          {t('visitHistory.loadError')}
        </ErrorAlert>
      ) : previous.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('visitHistory.firstVisit')}</p>
      ) : (
        <ol className="relative mt-4 space-y-3 border-l-2 border-border pl-4">
          {previous.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[23px] top-3 h-3 w-3 rounded-full border-2 border-card bg-primary" aria-hidden />
              <button
                type="button"
                onClick={() => navigate(`/doctor-consultation/${item.id}`)}
                className="flex w-full items-center gap-3 rounded-app bg-surface p-3 text-left transition hover:bg-primary/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {item.possibleCause ?? item.aiSummary?.possibleCause ?? item.symptoms}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.riskLevel ? <RiskBadge level={item.riskLevel} /> : null}
                    {item.caseStatus ? <CaseStatusBadge status={item.caseStatus} /> : null}
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-subtle" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default PatientVisitHistory
