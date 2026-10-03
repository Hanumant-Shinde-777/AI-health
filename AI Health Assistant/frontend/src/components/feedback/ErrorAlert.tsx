import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { classNames } from '@/utils'

interface ErrorAlertProps {
  children: ReactNode
  title?: string
  action?: ReactNode
  className?: string
}

/** Inline error panel: tinted background, icon, optional title and action. */
const ErrorAlert = ({ children, title, action, className }: ErrorAlertProps) => (
  <div
    role="alert"
    className={classNames(
      'flex items-start gap-3 rounded-app border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm animate-fade-in',
      className,
    )}
  >
    <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
    <div className="min-w-0 flex-1">
      {title ? <p className="font-semibold text-danger">{title}</p> : null}
      <div className={title ? 'mt-0.5 text-foreground/85' : 'text-foreground/90'}>{children}</div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
)

export default ErrorAlert
