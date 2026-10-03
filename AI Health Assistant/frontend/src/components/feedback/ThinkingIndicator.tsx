import { classNames } from '@/utils'

interface ThinkingIndicatorProps {
  label?: string
  className?: string
  /** Dot color class, e.g. "bg-white" inside a primary button */
  dotClassName?: string
}

/** Three bouncing dots — the "AI is thinking" indicator. */
const ThinkingIndicator = ({ label, className, dotClassName = 'bg-primary' }: ThinkingIndicatorProps) => (
  <span className={classNames('inline-flex items-center gap-2', className)} role="status" aria-live="polite">
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={classNames('h-1.5 w-1.5 rounded-full animate-typing-dot', dotClassName)}
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </span>
    {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
  </span>
)

export default ThinkingIndicator
