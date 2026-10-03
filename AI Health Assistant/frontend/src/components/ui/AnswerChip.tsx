import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

export interface AnswerChipProps {
  label: ReactNode
  selected: boolean
  onPress: () => void
}

export function AnswerChip({ label, selected, onPress }: AnswerChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      className={[
        'inline-flex items-center gap-1.5 rounded-pill border px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.96]',
        selected
          ? 'border-primary bg-primary text-white shadow-[0_4px_14px_rgb(var(--c-primary)/0.35)]'
          : 'border-border bg-surface text-foreground/85 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground',
      ].join(' ')}
    >
      {selected ? <Check size={14} strokeWidth={3} className="-ml-0.5" /> : null}
      {label}
    </button>
  )
}
