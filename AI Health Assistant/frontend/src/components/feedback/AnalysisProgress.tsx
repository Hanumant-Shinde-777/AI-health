import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ThinkingIndicator from '@/components/feedback/ThinkingIndicator'
import { classNames } from '@/utils'

export type AnalysisStage = 'analyzing' | 'questions'

const STEPS: { stage: AnalysisStage; key: string; fallback: string }[] = [
  { stage: 'analyzing', key: 'analysisProgress.analyzing', fallback: 'Checking your symptoms' },
  { stage: 'questions', key: 'analysisProgress.questions', fallback: 'Preparing follow-up questions' },
]

/** Step list for the real two-call symptom analysis (analyze → first follow-up question). */
const AnalysisProgress = ({ stage }: { stage: AnalysisStage }) => {
  const { t } = useTranslation()
  const current = STEPS.findIndex((step) => step.stage === stage)
  const percent = ((current + 0.5) / STEPS.length) * 100

  return (
    <div className="card space-y-4 p-4 animate-slide-up-fade" role="status" aria-live="polite">
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gradient-primary transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li key={step.stage} className="flex items-center gap-3 text-sm">
              <span
                className={classNames(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-success text-white',
                  active && 'bg-primary/15 text-primary ring-2 ring-primary/40',
                  !done && !active && 'bg-surface text-subtle',
                )}
              >
                {done ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <span className={classNames('flex-1', active ? 'font-semibold text-foreground' : done ? 'text-muted' : 'text-subtle')}>
                {t(step.key, step.fallback)}
              </span>
              {active ? <ThinkingIndicator /> : null}
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-subtle">{t('analysisProgress.hint', 'This usually takes a few seconds.')}</p>
    </div>
  )
}

export default AnalysisProgress
