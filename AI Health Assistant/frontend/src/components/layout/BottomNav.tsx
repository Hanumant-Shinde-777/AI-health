import { Calendar, FileText, History, Home, User, Users, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { classNames } from '@/utils'

interface NavItem {
  key: string
  label: string
  icon: LucideIcon
  to: string
  active: boolean
}

const NavBar = ({ items, onNavigate }: { items: NavItem[]; onNavigate: (to: string) => void }) => (
  <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
    <div className="flex h-16 items-stretch gap-1 rounded-[22px] border border-border/80 bg-card/85 p-1.5 shadow-float backdrop-blur-xl">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.to)}
            aria-current={item.active ? 'page' : undefined}
            className={classNames(
              'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium transition-all duration-200 active:scale-95',
              item.active ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-surface hover:text-foreground',
            )}
          >
            <Icon size={20} strokeWidth={item.active ? 2.4 : 1.8} />
            <span className={classNames('max-w-full truncate px-1', item.active ? 'font-semibold' : '')}>{item.label}</span>
          </button>
        )
      })}
    </div>
  </nav>
)

const BottomNav = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { role } = useAuth()

  if (role === 'DOCTOR') {
    const doctorItems = [
      {
        key: 'dashboard',
        label: t('bottomNav.dashboard'),
        icon: Home,
        to: '/doctor-dashboard',
        active: pathname === '/doctor-dashboard',
      },
      {
        key: 'patients',
        label: t('bottomNav.patients'),
        icon: Users,
        to: '/doctor-patients',
        active: pathname.startsWith('/doctor-patients'),
      },
      {
        key: 'calendar',
        label: t('bottomNav.calendar'),
        icon: Calendar,
        to: '/doctor-calendar',
        active: pathname.startsWith('/doctor-calendar'),
      },
      {
        key: 'profile',
        label: t('bottomNav.profile'),
        icon: User,
        to: '/doctor-profile',
        active: pathname.startsWith('/doctor-profile'),
      },
    ]

    return <NavBar items={doctorItems} onNavigate={navigate} />
  }

  const items = [
    {
      key: 'home',
      label: t('bottomNav.home'),
      icon: Home,
      to: '/home',
      active: pathname.startsWith('/home'),
    },
    {
      key: 'history',
      label: t('bottomNav.history'),
      icon: History,
      to: '/history',
      active: pathname.startsWith('/history') || pathname.startsWith('/follow-up'),
    },
    {
      key: 'prescription',
      label: t('bottomNav.prescription'),
      icon: FileText,
      to: '/my-prescription',
      active:
        pathname.startsWith('/my-prescription') ||
        pathname.startsWith('/pdf-share'),
    },
    {
      key: 'profile',
      label: t('bottomNav.profile'),
      icon: User,
      to: '/my-profile',
      active: pathname.startsWith('/my-profile') || pathname.startsWith('/medical-history'),
    },
  ]

  return <NavBar items={items} onNavigate={navigate} />
}

export default BottomNav
