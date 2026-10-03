import type { ReactNode } from 'react'
import BackButton from '@/components/ui/BackButton'

const AuthHeader = ({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}) => (
  <div className="mb-6 flex items-start justify-between gap-3">
    <div className="flex items-start gap-3">
      {onBack ? (
        <BackButton onClick={onBack} />
      ) : null}
      <div>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
    </div>
    {right}
  </div>
)

export default AuthHeader
