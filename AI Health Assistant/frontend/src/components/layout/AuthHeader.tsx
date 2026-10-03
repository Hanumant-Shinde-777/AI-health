import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

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
        <button type="button" onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-surface active:scale-95">
          <ArrowLeft size={18} />
        </button>
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
