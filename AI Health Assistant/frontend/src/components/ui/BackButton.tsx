import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Round icon-only back button used by the page headers (labelled for screen readers). */
const BackButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('common.back')}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-surface active:scale-95 print:hidden"
    >
      <ArrowLeft size={18} aria-hidden />
    </button>
  )
}

export default BackButton
