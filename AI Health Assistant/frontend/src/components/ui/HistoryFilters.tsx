import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RiskFilter } from '@/utils/historyFilters'
import { classNames } from '@/utils'

interface HistoryFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  risk?: RiskFilter
  onRiskChange?: (risk: RiskFilter) => void
  resultCount: number
  totalCount: number
}

const RISKS: { value: RiskFilter; key: string; fallback: string; dot?: string }[] = [
  { value: 'ALL', key: 'historyFilters.all', fallback: 'All' },
  { value: 'LOW', key: 'historyFilters.low', fallback: 'Low', dot: 'bg-success' },
  { value: 'MEDIUM', key: 'historyFilters.medium', fallback: 'Medium', dot: 'bg-warning' },
  { value: 'HIGH', key: 'historyFilters.high', fallback: 'High', dot: 'bg-danger' },
]

/** Search box + optional risk chips for the history lists. */
const HistoryFilters = ({ query, onQueryChange, risk, onRiskChange, resultCount, totalCount }: HistoryFiltersProps) => {
  const { t } = useTranslation()
  const filtering = query.trim() !== '' || (risk !== undefined && risk !== 'ALL')

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('historyFilters.searchPlaceholder', 'Search condition, doctor or medicine')}
          aria-label={t('historyFilters.searchLabel', 'Search history')}
          maxLength={100}
          className="input rounded-pill pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label={t('historyFilters.clearSearch', 'Clear search')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {risk !== undefined && onRiskChange ? (
        <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label={t('historyFilters.riskLabel', 'Filter by risk')}>
          {RISKS.map((item) => {
            const active = risk === item.value
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => onRiskChange(item.value)}
                className={classNames(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all',
                  active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted hover:text-foreground',
                )}
              >
                {item.dot ? <span className={classNames('h-2 w-2 rounded-full', item.dot)} aria-hidden /> : null}
                {t(item.key, item.fallback)}
              </button>
            )
          })}
        </div>
      ) : null}

      {filtering ? (
        <p className="text-xs text-muted" aria-live="polite">
          {t('historyFilters.results', '{{count}} of {{total}} shown', { count: resultCount, total: totalCount })}
        </p>
      ) : null}
    </div>
  )
}

export default HistoryFilters
