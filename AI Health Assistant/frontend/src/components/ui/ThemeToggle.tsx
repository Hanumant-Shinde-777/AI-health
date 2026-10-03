import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme, type ThemePreference } from '@/context/ThemeContext'
import { classNames } from '@/utils'

const OPTIONS: { value: ThemePreference; icon: LucideIcon; labelKey: string; fallback: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light', fallback: 'Light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark', fallback: 'Dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system', fallback: 'System' },
]

/** Light / Dark / System segmented control, typically placed in a settings card. */
const ThemeToggle = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label={t('theme.title', 'Appearance')}
      className={classNames('grid grid-cols-3 gap-1 rounded-pill border border-border bg-surface p-1', className)}
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey, fallback }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setPreference(value)}
            className={classNames(
              'flex items-center justify-center gap-1.5 rounded-pill py-2 text-xs font-semibold transition-all duration-200',
              active ? 'bg-card text-primary shadow-card' : 'text-muted hover:text-foreground',
            )}
          >
            <Icon size={15} />
            {t(labelKey, fallback)}
          </button>
        )
      })}
    </div>
  )
}

/** Card wrapper with title + description, for profile/settings pages. */
export const AppearanceCard = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <div className={classNames('card space-y-3 p-4', className)}>
      <div>
        <p className="text-sm font-semibold text-foreground">{t('theme.title', 'Appearance')}</p>
        <p className="mt-0.5 text-xs text-muted">{t('theme.description', 'Choose how the app looks on this device.')}</p>
      </div>
      <ThemeToggle />
    </div>
  )
}

export default ThemeToggle
