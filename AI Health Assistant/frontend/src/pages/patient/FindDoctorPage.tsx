import { useEffect, useMemo, useState } from 'react'
import { Building2, Search, Star, Stethoscope, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Layout from '@/layouts/MainLayout'
import BackButton from '@/components/ui/BackButton'
import ErrorAlert from '@/components/feedback/ErrorAlert'
import { SkeletonCard } from '@/components/feedback/Skeleton'
import { searchDoctors } from '@/services/doctorsService'
import type { MatchedDoctor } from '@/types/doctors'
import { classNames } from '@/utils'

const ALL = '__all__'

const normalize = (value: string) => value.toLocaleLowerCase().trim()

const FindDoctorPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<MatchedDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState(ALL)

  const load = async () => {
    setLoading(true)
    setFailed(false)
    try {
      setDoctors(await searchDoctors())
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const specialties = useMemo(
    () => [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [doctors],
  )

  const filtered = useMemo(() => {
    const q = normalize(query)
    return doctors.filter(
      (d) =>
        (specialty === ALL || d.specialization === specialty) &&
        (!q || [d.name, d.specialization, d.hospital].some((field) => normalize(field ?? '').includes(q))),
    )
  }, [doctors, query, specialty])

  return (
    <Layout>
      <div className="page-padding space-y-4">
        <div className="flex items-start gap-3">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">{t('findDoctor.title', 'Find a doctor')}</h1>
            <p className="mt-1 text-sm text-muted">{t('findDoctor.subtitle', 'Browse available doctors by name, specialty or clinic.')}</p>
          </div>
        </div>

        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            placeholder={t('findDoctor.searchPlaceholder', 'Search doctor, specialty or clinic')}
            aria-label={t('findDoctor.searchPlaceholder', 'Search doctor, specialty or clinic')}
            className="input rounded-pill pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('historyFilters.clearSearch', 'Clear search')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        {specialties.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label={t('findDoctor.specialtyLabel', 'Filter by specialty')}>
            {[ALL, ...specialties].map((item) => {
              const active = specialty === item
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSpecialty(item)}
                  className={classNames(
                    'shrink-0 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
                    active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted hover:text-foreground',
                  )}
                >
                  {item === ALL ? t('historyFilters.all', 'All') : item}
                </button>
              )
            })}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : failed ? (
          <ErrorAlert
            action={
              <button type="button" className="text-sm font-semibold text-primary" onClick={() => void load()}>
                {t('common.retry') || 'Retry'}
              </button>
            }
          >
            {t('findDoctor.loadError', 'Could not load doctors. Check your connection and try again.')}
          </ErrorAlert>
        ) : doctors.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Stethoscope size={22} />
            </div>
            <p className="font-semibold text-foreground">{t('findDoctor.emptyTitle', 'No doctors available right now')}</p>
            <p className="text-sm text-muted">{t('findDoctor.emptyBody', 'Please check again later.')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-semibold text-foreground">{t('historyFilters.noMatches', 'No matching results')}</p>
            <button
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={() => {
                setQuery('')
                setSpecialty(ALL)
              }}
            >
              {t('historyFilters.clearFilters', 'Clear filters')}
            </button>
          </div>
        ) : (
          <ul className="space-y-3" aria-live="polite">
            {filtered.map((doctor) => (
              <li key={doctor.id} className="card flex gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary" aria-hidden>
                  {doctor.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() || 'D'}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{doctor.name}</p>
                    {doctor.rating > 0 ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
                        <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden />
                        {doctor.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-primary">{doctor.specialization}</p>
                  {doctor.hospital ? (
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Building2 size={13} aria-hidden />
                      {doctor.hospital}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted">
                    {doctor.experience > 0 ? <span>{t('findDoctor.experience', '{{years}} yrs experience', { years: doctor.experience })}</span> : null}
                    {doctor.consultationFee > 0 ? <span>{t('findDoctor.fee', 'Fee ₹{{fee}}', { fee: doctor.consultationFee })}</span> : null}
                    {doctor.availableToday ? (
                      <span className="font-semibold text-success">{t('summary.availableToday', 'Available today')}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !failed && doctors.length > 0 ? (
          <div className="card space-y-3 p-4 text-center">
            <p className="text-sm text-muted">{t('findDoctor.howToConsult', 'To consult a doctor, describe your symptoms first — you choose your doctor on the summary screen.')}</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/symptoms')}>
              {t('home.describeSymptoms', 'Describe Your Symptoms')}
            </button>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}

export default FindDoctorPage
