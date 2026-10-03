import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/useLanguage'
import { classNames, languageOptions } from '@/utils'

/** Only languages that have a translation file; others would silently show English. */
const SUPPORTED = ['en', 'hi', 'mr']
const OPTIONS = languageOptions.filter((option) => SUPPORTED.includes(option.code))

/** Language switcher for profile/settings pages (same setting as the first-run language screen). */
const LanguageCard = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { selectedLanguage, setLanguage } = useLanguage()

  return (
    <div className={classNames('card space-y-3 p-4', className)}>
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Languages size={16} className="text-primary" aria-hidden />
          {t('languageCard.title')}
        </p>
        <p className="mt-0.5 text-xs text-muted">{t('languageCard.description')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('languageCard.title')}>
        {OPTIONS.map((option) => {
          const active = selectedLanguage === option.code
          return (
            <button
              key={option.code}
              type="button"
              lang={option.code}
              aria-pressed={active}
              onClick={() => setLanguage(option.code)}
              className={classNames(
                'flex items-center justify-center gap-1.5 rounded-app border px-2 py-2.5 text-sm font-semibold transition-all',
                active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-surface text-foreground/85 hover:border-primary/40',
              )}
            >
              {active ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
              {option.nativeLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LanguageCard
