import { useMemo, useState } from 'react'
import {
  Apple,
  Bike,
  Brain,
  CalendarCheck,
  Carrot,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  GlassWater,
  HeartHandshake,
  Moon,
  Salad,
  ShieldCheck,
  Smile,
  Syringe,
  BedDouble,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Layout from '@/layouts/MainLayout'
import BackButton from '@/components/ui/BackButton'
import { classNames } from '@/utils'

type Category = 'nutrition' | 'exercise' | 'mental' | 'sleep' | 'hydration' | 'preventive'

const CATEGORIES: { id: Category; icon: LucideIcon; tint: string }[] = [
  { id: 'nutrition', icon: Salad, tint: 'bg-success/15 text-success' },
  { id: 'exercise', icon: Dumbbell, tint: 'bg-warning/15 text-warning' },
  { id: 'mental', icon: Brain, tint: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  { id: 'sleep', icon: Moon, tint: 'bg-primary/15 text-primary' },
  { id: 'hydration', icon: Droplet, tint: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  { id: 'preventive', icon: ShieldCheck, tint: 'bg-danger/15 text-danger' },
]

/** Text for each tip lives in i18n: healthTips.tips.<id>.title / .body */
const TIPS: { id: string; category: Category; icon: LucideIcon }[] = [
  { id: 'plate', category: 'nutrition', icon: Salad },
  { id: 'fruit', category: 'nutrition', icon: Apple },
  { id: 'salt', category: 'nutrition', icon: Carrot },
  { id: 'walk', category: 'exercise', icon: Footprints },
  { id: 'strength', category: 'exercise', icon: Bike },
  { id: 'sitting', category: 'exercise', icon: Dumbbell },
  { id: 'talk', category: 'mental', icon: HeartHandshake },
  { id: 'breathe', category: 'mental', icon: Smile },
  { id: 'screens', category: 'mental', icon: Brain },
  { id: 'schedule', category: 'sleep', icon: BedDouble },
  { id: 'caffeine', category: 'sleep', icon: Coffee },
  { id: 'darkRoom', category: 'sleep', icon: Moon },
  { id: 'water', category: 'hydration', icon: GlassWater },
  { id: 'heat', category: 'hydration', icon: Droplet },
  { id: 'ors', category: 'hydration', icon: Droplet },
  { id: 'checkups', category: 'preventive', icon: CalendarCheck },
  { id: 'vaccines', category: 'preventive', icon: Syringe },
  { id: 'handwash', category: 'preventive', icon: ShieldCheck },
]

const HealthTipsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | 'all'>('all')

  const visible = useMemo(() => (category === 'all' ? TIPS : TIPS.filter((tip) => tip.category === category)), [category])
  const tintFor = (id: Category) => CATEGORIES.find((c) => c.id === id)?.tint ?? 'bg-primary/15 text-primary'

  return (
    <Layout>
      <div className="page-padding space-y-4">
        <div className="flex items-start gap-3">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">{t('healthTips.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('healthTips.subtitle')}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label={t('healthTips.filterLabel')}>
          {(['all', ...CATEGORIES.map((c) => c.id)] as const).map((id) => {
            const active = category === id
            const Icon = CATEGORIES.find((c) => c.id === id)?.icon
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(id)}
                className={classNames(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
                  active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted hover:text-foreground',
                )}
              >
                {Icon ? <Icon size={14} aria-hidden /> : null}
                {t(`healthTips.categories.${id}`)}
              </button>
            )
          })}
        </div>

        <ul className="space-y-3" aria-live="polite">
          {visible.map(({ id, category: cat, icon: Icon }) => (
            <li key={id} className="card flex gap-3 p-4 animate-fade-in">
              <div className={classNames('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tintFor(cat))} aria-hidden>
                <Icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{t(`healthTips.categories.${cat}`)}</p>
                <p className="mt-0.5 font-semibold text-foreground">{t(`healthTips.tips.${id}.title`)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t(`healthTips.tips.${id}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-center text-xs text-subtle">{t('healthTips.disclaimer')}</p>
      </div>
    </Layout>
  )
}

export default HealthTipsPage
