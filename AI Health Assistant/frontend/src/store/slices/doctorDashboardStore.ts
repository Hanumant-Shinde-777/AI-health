import { create } from 'zustand'
import { getDoctorConsultations } from '@/services/consultationsService'
import type { Consultation } from '@/types'
import { getCurrentDoctorId } from '@/utils/userScope'
import {
  computeDoctorDashboardStats,
  getPendingCases,
  type DoctorDashboardStats,
} from '@/utils/doctorDashboard'

const emptyStats: DoctorDashboardStats = {
  pending: 0,
  reviewed: 0,
  today: 0,
  total: 0,
}

const scopeCasesToCurrentDoctor = (cases: Consultation[]): Consultation[] => {
  const currentDoctorId = getCurrentDoctorId()
  if (!currentDoctorId) {
    return cases
  }
  return cases.filter((item) => item.doctorId === currentDoctorId)
}

const deriveFromCases = (cases: Consultation[]) => {
  const scopedCases = scopeCasesToCurrentDoctor(cases)
  return {
    cases: scopedCases,
    stats: computeDoctorDashboardStats(scopedCases),
    pendingCases: getPendingCases(scopedCases),
  }
}

interface DoctorDashboardState {
  cases: Consultation[]
  stats: DoctorDashboardStats
  pendingCases: Consultation[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  fetchCases: () => Promise<void>
  upsertCase: (updated: Consultation) => void
  markCaseReviewed: (consultationId: string) => void
  setCases: (cases: Consultation[]) => void
}

export const useDoctorDashboardStore = create<DoctorDashboardState>((set, get) => ({
  cases: [],
  stats: emptyStats,
  pendingCases: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchCases: async () => {
    const hasData = get().cases.length > 0
    set({ isLoading: !hasData, error: null })
    try {
      const cases = await getDoctorConsultations()
      set({
        ...deriveFromCases(cases),
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      })
    } catch {
      set({ isLoading: false, error: 'fetch_failed' })
    }
  },

  upsertCase: (updated) => {
    const existing = get().cases
    const nextCases = existing.some((c) => c.id === updated.id)
      ? existing.map((c) => (c.id === updated.id ? updated : c))
      : [updated, ...existing]
    set({
      ...deriveFromCases(nextCases),
      lastUpdated: new Date(),
    })
  },

  markCaseReviewed: (consultationId) => {
    const existing = get().cases
    const target = existing.find((item) => item.id === consultationId)
    if (!target) {
      return
    }
    const nextCases = existing.map((item) => (item.id === consultationId
      ? {
          ...item,
          status: 'REVIEWED',
          caseStatus: 'PRESCRIPTION_READY',
          reviewedAt: new Date().toISOString(),
        }
      : item))
    set({
      ...deriveFromCases(nextCases),
      lastUpdated: new Date(),
    })
  },

  setCases: (cases) => {
    set({
      ...deriveFromCases(cases),
      lastUpdated: new Date(),
    })
  },
}))
