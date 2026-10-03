import type { Consultation, Prescription, RiskLevel } from '@/types'

export type RiskFilter = 'ALL' | RiskLevel

const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim()

const matches = (query: string, fields: Array<string | undefined | null>) => {
  const q = normalize(query)
  if (!q) return true
  return fields.some((field) => field && normalize(field).includes(q))
}

/** Text search over cause, doctor, symptoms; optional risk filter. Same risk default as the list ('MEDIUM'). */
export const filterConsultations = (items: Consultation[], query: string, risk: RiskFilter): Consultation[] =>
  items.filter(
    (item) =>
      (risk === 'ALL' || (item.riskLevel ?? 'MEDIUM') === risk) &&
      matches(query, [item.possibleCause, item.aiSummary?.possibleCause, item.doctorName, item.symptoms, ...(item.symptomList ?? [])]),
  )

/** Text search over diagnosis, doctor and medicine names. */
export const filterPrescriptions = (items: Prescription[], query: string): Prescription[] =>
  items.filter((item) => matches(query, [item.diagnosis, item.doctorName, ...item.medicines.map((m) => m.name)]))
