import { FileDown, HeartPulse, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/feedback/Toast'
import { shareText } from '@/utils/healthReport'
import { formatDateTime } from '@/utils'

interface ReportActionsProps {
  title: string
  getShareText: () => string
}

/** "Save as PDF" (browser print dialog with the print stylesheet) + "Share" buttons. */
const ReportActions = ({ title, getShareText }: ReportActionsProps) => {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const onShare = async () => {
    const outcome = await shareText(title, getShareText())
    if (outcome === 'copied') showToast(t('report.copied', 'Summary copied to clipboard'))
    if (outcome === 'failed') showToast(t('report.shareFailed', 'Could not share the summary. Please try again.'))
  }

  return (
    <div className="grid grid-cols-2 gap-3 print:hidden">
      <button type="button" className="btn-ghost h-11 text-sm" onClick={() => window.print()}>
        <span className="flex items-center gap-2">
          <FileDown size={17} />
          {t('report.savePdf', 'Save as PDF')}
        </span>
      </button>
      <button type="button" className="btn-ghost h-11 text-sm" onClick={() => void onShare()}>
        <span className="flex items-center gap-2">
          <Share2 size={17} />
          {t('report.share', 'Share')}
        </span>
      </button>
    </div>
  )
}

/** Shown only on paper / PDF: app name, patient, generated date. */
export const PrintHeader = ({ patientName }: { patientName?: string }) => {
  const { t } = useTranslation()
  return (
    <div className="hidden border-b border-border pb-3 print:block">
      <div className="flex items-center gap-2 text-primary">
        <HeartPulse size={20} />
        <span className="text-base font-bold">AI Health Assistant</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{t('report.title', 'Health Summary Report')}</p>
      <p className="text-xs text-muted">
        {patientName ? `${t('report.patient', 'Patient')}: ${patientName} · ` : ''}
        {t('report.generated', 'Generated')}: {formatDateTime(new Date().toISOString())}
      </p>
    </div>
  )
}

export default ReportActions
