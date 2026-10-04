import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { CheckCircle2, Inbox, Mail, RotateCcw, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Layout from '@/layouts/MainLayout'
import BackButton from '@/components/ui/BackButton'
import ErrorAlert from '@/components/feedback/ErrorAlert'
import { SkeletonCard } from '@/components/feedback/Skeleton'
import {
  listSupportMessages,
  setSupportMessageStatus,
  type SupportInbox,
  type SupportMessage,
  type SupportMessageStatus,
} from '@/services/supportService'
import { getApiErrorMessage } from '@/services/fallbackPolicy'
import { classNames, formatDateTime } from '@/utils'

type Filter = SupportMessageStatus | 'all'
const FILTERS: Filter[] = ['open', 'closed', 'all']

const SupportInboxPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('open')
  const [inbox, setInbox] = useState<SupportInbox | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading')
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (next: Filter) => {
    setState('loading')
    setError('')
    try {
      setInbox(await listSupportMessages(next))
      setState('ready')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setState('forbidden')
        return
      }
      setError(getApiErrorMessage(err, t('supportInbox.loadFailed')))
      setState('error')
    }
  }, [t])

  useEffect(() => {
    void load(filter)
  }, [filter, load])

  const toggleStatus = async (item: SupportMessage) => {
    const next: SupportMessageStatus = item.status === 'open' ? 'closed' : 'open'
    setUpdatingId(item.id)
    setError('')
    try {
      await setSupportMessageStatus(item.id, next)
      // Re-fetch so the list and the counts both reflect the change
      setInbox(await listSupportMessages(filter))
    } catch (err) {
      setError(getApiErrorMessage(err, t('supportInbox.updateFailed')))
    } finally {
      setUpdatingId(null)
    }
  }

  const count = (f: Filter) =>
    inbox ? (f === 'all' ? inbox.counts.open + inbox.counts.closed : inbox.counts[f]) : null

  return (
    <Layout>
      <div className="page-padding space-y-5">
        <div className="flex items-start gap-3">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">{t('supportInbox.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('supportInbox.subtitle')}</p>
          </div>
        </div>

        {state === 'forbidden' ? (
          <div className="card flex flex-col items-center gap-2 p-6 text-center">
            <ShieldAlert size={28} className="text-muted" />
            <p className="font-semibold text-foreground">{t('supportInbox.forbiddenTitle')}</p>
            <p className="text-sm text-muted">{t('supportInbox.forbiddenBody')}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label={t('supportInbox.filterLabel')}>
              {FILTERS.map((f) => {
                const active = filter === f
                const n = count(f)
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(f)}
                    className={classNames(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
                      active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted hover:text-foreground',
                    )}
                  >
                    {t(`supportInbox.filters.${f}`)}
                    {n !== null ? <span className="tabular-nums opacity-80">{n}</span> : null}
                  </button>
                )
              })}
            </div>

            {error ? (
              <ErrorAlert
                action={
                  state === 'error' ? (
                    <button type="button" className="text-sm font-semibold text-primary" onClick={() => void load(filter)}>
                      {t('supportInbox.retry')}
                    </button>
                  ) : undefined
                }
              >
                {error}
              </ErrorAlert>
            ) : null}

            {state === 'loading' ? (
              <div className="space-y-3" role="status" aria-label={t('supportInbox.loading')}>
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : null}

            {state === 'ready' && inbox && inbox.messages.length === 0 ? (
              <div className="card flex flex-col items-center gap-2 p-6 text-center">
                <Inbox size={28} className="text-muted" />
                <p className="text-sm text-muted">{t(`supportInbox.empty.${filter}`)}</p>
              </div>
            ) : null}

            {state === 'ready' && inbox && inbox.messages.length > 0 ? (
              <ul className="space-y-3">
                {inbox.messages.map((item) => (
                  <li key={item.id} className={classNames('card space-y-3 p-4', item.status === 'closed' && 'opacity-75')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{item.name}</p>
                        <p className="truncate text-xs text-muted">{item.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={classNames(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                            item.status === 'open' ? 'bg-warning/15 text-warning ring-warning/25' : 'bg-surface text-muted ring-border',
                          )}
                        >
                          {t(`supportInbox.status.${item.status}`)}
                        </span>
                        <span className="text-[11px] text-subtle">{t(`supportInbox.sender.${item.role ?? 'guest'}`)}</span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{item.message}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <time dateTime={item.createdAt} className="text-xs text-subtle">{formatDateTime(item.createdAt)}</time>
                      <div className="flex items-center gap-4">
                        <a
                          href={`mailto:${item.email}?subject=${encodeURIComponent(t('supportInbox.replySubject'))}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                        >
                          <Mail size={15} />
                          {t('supportInbox.reply')}
                        </a>
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => void toggleStatus(item)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 disabled:opacity-50"
                        >
                          {item.status === 'open' ? <CheckCircle2 size={15} /> : <RotateCcw size={15} />}
                          {t(item.status === 'open' ? 'supportInbox.markClosed' : 'supportInbox.reopen')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </Layout>
  )
}

export default SupportInboxPage
