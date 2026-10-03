import type { RiskLevel } from '@/types'

interface RiskBadgeProps {
  level: RiskLevel
}

const levelStyles: Record<RiskLevel, string> = {
  LOW: 'bg-success/15 text-success ring-1 ring-inset ring-success/30',
  MEDIUM: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/30',
  HIGH: 'bg-danger/15 text-danger ring-1 ring-inset ring-danger/30',
}

const levelLabels: Record<RiskLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const RiskBadge = ({ level }: RiskBadgeProps) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${levelStyles[level]}`}>
    <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
    {levelLabels[level]}
  </span>
)

export default RiskBadge
