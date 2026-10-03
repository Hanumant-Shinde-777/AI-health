import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, LifeBuoy, PhoneCall, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Layout from '@/layouts/MainLayout'
import BackButton from '@/components/ui/BackButton'
import ErrorAlert from '@/components/feedback/ErrorAlert'
import ThinkingIndicator from '@/components/feedback/ThinkingIndicator'
import { sendSupportMessage } from '@/services/supportService'
import { getApiErrorMessage } from '@/services/fallbackPolicy'
import { readPatientExtendedProfile } from '@/utils'
import { useAppSelector } from '@/store'

const GUIDE_STEPS = ['describe', 'answer', 'review', 'doctor', 'prescription'] as const
const FAQ_IDS = ['diagnosis', 'emergency', 'time', 'privacy', 'language', 'pdf', 'followUp', 'otp'] as const
const HELPLINES = [
  { number: '112', key: 'emergency.national' },
  { number: '108', key: 'emergency.ambulance' },
  { number: '14416', key: 'emergency.mentalHealth' },
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>

const SupportPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profileName = useAppSelector((state) => state.patient.profile?.fullName)
  const [name, setName] = useState(profileName ?? '')
  const [email, setEmail] = useState(() => readPatientExtendedProfile()?.email ?? '')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!name.trim()) next.name = t('support.form.errors.name')
    if (!EMAIL_RE.test(email.trim())) next.email = t('support.form.errors.email')
    if (message.trim().length < 10) next.message = t('support.form.errors.message')
    return next
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending')
    setSubmitError('')
    try {
      await sendSupportMessage({ name: name.trim(), email: email.trim(), message: message.trim() })
      setStatus('sent')
      setMessage('')
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, t('support.form.sendFailed')))
      setStatus('error')
    }
  }

  const fieldError = (id: keyof FieldErrors) =>
    errors[id] ? (
      <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
        <AlertCircle size={13} className="shrink-0" />
        {errors[id]}
      </p>
    ) : null

  return (
    <Layout>
      <div className="page-padding space-y-5">
        <div className="flex items-start gap-3">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">{t('support.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('support.subtitle')}</p>
          </div>
        </div>

        {/* Emergency first: nobody in crisis should have to scroll for it */}
        <section className="card space-y-3 border-danger/30 p-4" aria-labelledby="support-helplines">
          <h2 id="support-helplines" className="flex items-center gap-2 text-sm font-bold text-danger">
            <PhoneCall size={17} />
            {t('support.helplinesTitle')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {HELPLINES.map(({ number, key }) => (
              <a key={number} href={`tel:${number}`} className="rounded-app bg-danger/10 p-2.5 text-center transition active:scale-[0.97]">
                <span className="block text-lg font-extrabold text-danger">{number}</span>
                <span className="block text-[11px] leading-tight text-foreground/80">{t(key)}</span>
              </a>
            ))}
          </div>
          <button type="button" className="text-sm font-semibold text-primary" onClick={() => navigate('/emergency')}>
            {t('emergency.moreOptions')} →
          </button>
        </section>

        <section className="card space-y-3 p-4" aria-labelledby="support-guide">
          <h2 id="support-guide" className="text-base font-semibold text-foreground">{t('support.guideTitle')}</h2>
          <ol className="space-y-3">
            {GUIDE_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(`support.guide.${step}.title`)}</p>
                  <p className="mt-0.5 text-sm text-muted">{t(`support.guide.${step}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-2" aria-labelledby="support-faq">
          <h2 id="support-faq" className="text-base font-semibold text-foreground">{t('support.faqTitle')}</h2>
          {FAQ_IDS.map((id) => (
            <details key={id} className="card group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-foreground">
                {t(`support.faq.${id}.q`)}
                <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="border-t border-border/60 px-4 pb-4 pt-3 text-sm leading-relaxed text-muted">{t(`support.faq.${id}.a`)}</p>
            </details>
          ))}
        </section>

        <section className="card space-y-4 p-4" aria-labelledby="support-contact">
          <div>
            <h2 id="support-contact" className="flex items-center gap-2 text-base font-semibold text-foreground">
              <LifeBuoy size={18} className="text-primary" />
              {t('support.form.title')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('support.form.subtitle')}</p>
          </div>

          {status === 'sent' ? (
            <div role="status" className="flex items-start gap-3 rounded-app border border-success/30 bg-success/10 p-3.5 animate-fade-in">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{t('support.form.sentTitle')}</p>
                <p className="mt-0.5 text-sm text-muted">{t('support.form.sentBody')}</p>
                <button type="button" className="mt-2 text-sm font-semibold text-primary" onClick={() => setStatus('idle')}>
                  {t('support.form.sendAnother')}
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(event) => void onSubmit(event)} noValidate>
              <div>
                <label htmlFor="support-name" className="form-label">{t('support.form.name')}</label>
                <input id="support-name" className={errors.name ? 'input input-error' : 'input'} value={name} maxLength={100}
                  autoComplete="name" onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
                {fieldError('name')}
              </div>
              <div>
                <label htmlFor="support-email" className="form-label">{t('support.form.email')}</label>
                <input id="support-email" type="email" inputMode="email" className={errors.email ? 'input input-error' : 'input'} value={email}
                  maxLength={200} autoComplete="email" onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
                {fieldError('email')}
              </div>
              <div>
                <label htmlFor="support-message" className="form-label">{t('support.form.message')}</label>
                <textarea id="support-message" className={errors.message ? 'textarea textarea-error' : 'textarea'} value={message}
                  maxLength={2000} rows={5} placeholder={t('support.form.messagePlaceholder')} onChange={(e) => setMessage(e.target.value)}
                  aria-invalid={Boolean(errors.message)} />
                <div className="mt-1 flex items-start justify-between gap-2">
                  <div className="flex-1">{fieldError('message')}</div>
                  <p className="shrink-0 text-xs tabular-nums text-subtle">{message.length}/2000</p>
                </div>
              </div>
              {status === 'error' ? <ErrorAlert>{submitError}</ErrorAlert> : null}
              <button type="submit" className="btn-primary" disabled={status === 'sending'}>
                {status === 'sending' ? (
                  <ThinkingIndicator dotClassName="bg-white" label={t('support.form.sending')} />
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={17} />
                    {t('support.form.send')}
                  </span>
                )}
              </button>
              <p className="text-center text-xs text-subtle">{t('support.form.notForEmergencies')}</p>
            </form>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default SupportPage
