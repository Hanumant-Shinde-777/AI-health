import { AlertTriangle, Ambulance, HeartPulse, Phone, PhoneCall, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Layout from '@/layouts/MainLayout'
import BackButton from '@/components/ui/BackButton'
import { readPatientExtendedProfile } from '@/utils'

/** India emergency numbers. 112 = national emergency, 108 = ambulance, 14416 = Tele-MANAS mental health. */
const EMERGENCY_NUMBERS = [
  { number: '112', key: 'emergency.national', fallback: 'National emergency', icon: PhoneCall, primary: true },
  { number: '108', key: 'emergency.ambulance', fallback: 'Ambulance', icon: Ambulance, primary: false },
  { number: '14416', key: 'emergency.mentalHealth', fallback: 'Mental health helpline (Tele-MANAS)', icon: HeartPulse, primary: false },
] as const

const WARNING_SIGNS = ['chestPain', 'breathing', 'stroke', 'bleeding', 'unconscious', 'allergy', 'selfHarm'] as const
const WARNING_FALLBACKS: Record<(typeof WARNING_SIGNS)[number], string> = {
  chestPain: 'Chest pain or pressure, especially spreading to the arm, jaw or back',
  breathing: 'Severe difficulty breathing or blue lips',
  stroke: 'Face drooping, arm weakness or slurred speech (possible stroke)',
  bleeding: 'Heavy bleeding that will not stop',
  unconscious: 'Fainting, seizure or not responding',
  allergy: 'Swelling of the face or throat after food, medicine or a sting',
  selfHarm: 'Thoughts of harming yourself',
}

/** Digits and a leading + only, so the value is safe in a tel: link. */
const toTelHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, '')}`

const EmergencyPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const emergencyContact = readPatientExtendedProfile()?.emergencyContact?.trim()
  const contactDigits = emergencyContact?.replace(/\D/g, '') ?? ''

  return (
    <Layout>
      <div className="page-padding space-y-5">
        <div className="flex items-start gap-3">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
              {t('emergency.title', 'Emergency help')}
            </h1>
            <p className="mt-1 text-sm text-muted">{t('emergency.subtitle', 'If this is an emergency, call now. Do not wait for the app.')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {EMERGENCY_NUMBERS.map(({ number, key, fallback, icon: Icon, primary }) => (
            <a
              key={number}
              href={toTelHref(number)}
              className={
                primary
                  ? 'flex items-center gap-4 rounded-card bg-gradient-to-br from-danger to-danger/80 p-5 text-white shadow-[0_8px_28px_rgb(var(--c-danger)/0.4)] transition active:scale-[0.98]'
                  : 'card flex items-center gap-4 p-4 transition active:scale-[0.98]'
              }
            >
              <span
                className={
                  primary
                    ? 'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20'
                    : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger'
                }
              >
                <Icon size={primary ? 28 : 22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={primary ? 'block text-3xl font-extrabold tracking-wide' : 'block text-xl font-bold text-foreground'}>
                  {number}
                </span>
                <span className={primary ? 'block text-sm text-white/90' : 'block text-sm text-muted'}>{t(key, fallback)}</span>
              </span>
              <span
                className={
                  primary
                    ? 'rounded-pill bg-white px-4 py-2 text-sm font-bold text-danger'
                    : 'rounded-pill bg-danger/15 px-3 py-1.5 text-xs font-bold text-danger'
                }
              >
                {t('emergency.call', 'Call')}
              </span>
            </a>
          ))}
        </div>

        <div className="card space-y-3 p-4">
          <p className="text-sm font-semibold text-foreground">{t('emergency.yourContact', 'Your emergency contact')}</p>
          {contactDigits.length >= 6 ? (
            <a href={toTelHref(emergencyContact!)} className="flex items-center gap-3 rounded-app bg-primary/10 p-3 transition active:scale-[0.98]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserRound size={20} />
              </span>
              <span className="flex-1 font-semibold text-foreground">{emergencyContact}</span>
              <Phone size={18} className="text-primary" />
            </a>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-app bg-surface p-3">
              <p className="text-sm text-muted">{t('emergency.noContact', 'No emergency contact saved yet.')}</p>
              <button type="button" className="shrink-0 text-sm font-semibold text-primary" onClick={() => navigate('/my-profile')}>
                {t('emergency.addContact', 'Add')}
              </button>
            </div>
          )}
        </div>

        <div className="card space-y-3 border-danger/30 p-4">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <p className="text-sm font-bold">{t('emergency.warningTitle', 'Call immediately if you notice')}</p>
          </div>
          <ul className="space-y-2">
            {WARNING_SIGNS.map((sign) => (
              <li key={sign} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
                {t(`emergency.signs.${sign}`, WARNING_FALLBACKS[sign])}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-subtle">
          {t('emergency.disclaimer', 'This app cannot contact emergency services for you. Calls go through your phone.')}
        </p>
      </div>
    </Layout>
  )
}

export default EmergencyPage
