import { useEffect, useState } from 'react'
import { ChevronRight, Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getSupportStaffAccess } from '@/services/supportService'
import { classNames } from '@/utils'

/** Profile-page entry to the support inbox. Renders nothing unless the account is support staff. */
const SupportInboxLink = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [staff, setStaff] = useState(false)

  useEffect(() => {
    let active = true
    void getSupportStaffAccess().then((isStaff) => {
      if (active) setStaff(isStaff)
    })
    return () => {
      active = false
    }
  }, [])

  if (!staff) return null

  return (
    <Link to="/staff/support" className={classNames('card flex items-center gap-3 p-4 transition active:scale-[0.99]', className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Inbox size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{t('supportInbox.title')}</span>
        <span className="block text-xs text-muted">{t('supportInbox.linkHint')}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  )
}

export default SupportInboxLink
