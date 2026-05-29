import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { useToast } from '@/components/feedback/Toast'
import Layout from '@/layouts/MainLayout'
import {
  getEmergencyAlert,
  respondToEmergency,
  type EmergencyAlert,
} from '@/services/emergencyService'
import { formatDate } from '@/utils'
import { formatCaseRelativeTime } from '@/utils/doctorDashboard'

const DoctorEmergencyDetailPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { showToast } = useToast()
  const [alert, setAlert] = useState<EmergencyAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getEmergencyAlert(id)
        setAlert(data)
      } catch {
        showToast(t('doctorDashboard.loadError'))
        navigate('/doctor-dashboard')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, navigate, showToast, t])

  const handleRespond = async () => {
    if (!alert) return
    setResponding(true)
    try {
      const updated = await respondToEmergency(alert.id)
      setAlert(updated)
      showToast(t('emergencyAlert.responded'))
      navigate('/doctor-dashboard')
    } catch {
      showToast(t('common.tryAgain'))
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return (
      <Layout hideNav>
        <LoadingSpinner className="min-h-screen" />
      </Layout>
    )
  }

  if (!alert) {
    return null
  }

  return (
    <Layout hideNav>
      <div className="page-padding space-y-5 bg-background pb-8">
        <div className="flex items-center gap-3">
          <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => navigate('/doctor-dashboard')}>
            {t('common.back')}
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('emergencyAlert.detailTitle')}</h1>
        </div>

        <div className="card space-y-4 border-danger/30 bg-danger/5 p-5">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={22} />
            <p className="font-bold">{t('emergencyAlert.detailEmergency')}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{alert.patientName}</p>
            <p className="text-sm text-muted">
              {alert.patientAge ?? '—'} · {alert.patientGender ?? '—'}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-foreground">{t('emergencyAlert.detectedSymptom')}:</span>{' '}
              {alert.detectedSymptom}
            </p>
            <p>
              <span className="font-semibold text-foreground">{t('emergencyAlert.detectedAt')}:</span>{' '}
              {formatDate(alert.createdAt)} ({formatCaseRelativeTime(alert.createdAt)})
            </p>
            <p>
              <span className="font-semibold text-foreground">{t('emergencyAlert.servicesStatus')}:</span>{' '}
              {t('emergencyAlert.servicesAlerted')}
            </p>
            <p>
              <span className="font-semibold text-foreground">{t('emergencyAlert.caseStatus')}:</span>{' '}
              {alert.status === 'reviewed' || alert.status === 'acknowledged'
                ? t('emergencyAlert.statusAcknowledged')
                : t('emergencyAlert.statusActive')}
            </p>
          </div>
        </div>

        {alert.status === 'pending' || alert.status === 'active' ? (
          <button
            type="button"
            className="btn-primary w-full bg-danger hover:bg-danger/90"
            disabled={responding}
            onClick={() => void handleRespond()}
          >
            {responding ? <LoadingSpinner size={20} /> : t('emergencyAlert.acceptRespond')}
          </button>
        ) : (
          <p className="text-center text-sm font-medium text-success">{t('emergencyAlert.alreadyResponded')}</p>
        )}
      </div>
    </Layout>
  )
}

export default DoctorEmergencyDetailPage
