import { useTranslation } from 'react-i18next'
import type { CaseStatus } from '@/types/doctors'
import { classNames } from '@/utils'

const styles: Record<CaseStatus, string> = {
  PENDING_REVIEW: 'bg-warning/15 text-warning ring-warning/25',
  UNDER_REVIEW: 'bg-primary/15 text-primary ring-primary/25',
  NEED_MORE_INFO: 'bg-violet-500/15 text-violet-700 ring-violet-400/25 dark:text-violet-300',
  PRESCRIPTION_READY: 'bg-success/15 text-success ring-success/25',
  CLOSED: 'bg-surface text-muted ring-border',
}

interface CaseStatusBadgeProps {
  status: CaseStatus
  className?: string
}

const CaseStatusBadge = ({ status, className }: CaseStatusBadgeProps) => {
  const { t } = useTranslation()
  return (
    <span
      className={classNames(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[status],
        className,
      )}
    >
      {t(`caseStatus.${status}`)}
    </span>
  )
}

export default CaseStatusBadge
