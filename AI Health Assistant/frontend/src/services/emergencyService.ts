import client from '@/services/apiClient'
import type { MatchedDoctor } from '@/types/doctors'
import { readStorage, removeStorage, storageKeys, writeStorage } from '@/utils'
import { tokenRoleFromJwt } from '@/utils/jwt'

export interface EmergencyDoctorListItem {
  id: string
  fullName: string
  specialization: string
  clinicName: string | null
  consultationFee: number | null
  rating: number | null
  yearsOfExperience: number | null
  availability: boolean
}

export interface EmergencyAlert {
  id: string
  patientId: string
  patientName: string
  patientAge: number | null
  patientGender: string | null
  doctorId: string
  doctorName: string | null
  detectedSymptom: string
  matchedKeyword: string | null
  symptomText: string
  status: 'pending' | 'reviewed' | string
  reviewedAt: string | null
  servicesAlerted: boolean
  createdAt: string
}

export type PatientEmergencyTileState = 'none' | 'pending' | 'reviewed'

export const mapEmergencyTileState = (alert: EmergencyAlert | null): PatientEmergencyTileState => {
  if (!alert) return 'none'
  if (alert.status === 'reviewed' || alert.status === 'acknowledged') return 'reviewed'
  if (alert.status === 'pending' || alert.status === 'active') return 'pending'
  return 'none'
}

export const cachePatientLatestEmergency = (alert: EmergencyAlert | null): void => {
  if (typeof window === 'undefined') return
  if (!alert) {
    removeStorage(storageKeys.patientLatestEmergency)
    return
  }
  writeStorage(storageKeys.patientLatestEmergency, alert)
}

export const readCachedPatientLatestEmergency = (): EmergencyAlert | null =>
  readStorage<EmergencyAlert | null>(storageKeys.patientLatestEmergency, null)

const mapDoctor = (d: EmergencyDoctorListItem): MatchedDoctor => ({
  id: d.id,
  name: d.fullName,
  specialization: d.specialization,
  hospital: d.clinicName ?? '',
  experience: d.yearsOfExperience ?? 0,
  consultationFee: d.consultationFee ?? 0,
  rating: d.rating ?? 0,
  availableToday: d.availability,
  nextAvailable: d.availability ? 'Today' : 'Soon',
})

export const getEmergencyRecommendedDoctors = async (symptom: string) => {
  const response = await client.get<{
    success: boolean
    data: {
      isEmergency: boolean
      matchedKeyword: string | null
      recommendedSpecializations: string[]
      doctors: EmergencyDoctorListItem[]
    }
  }>('/emergency/recommended-doctors', { params: { symptom } })
  const payload = response.data.data
  return {
    ...payload,
    doctors: payload.doctors.map(mapDoctor),
  }
}

export const assignEmergencyDoctor = async (data: {
  doctorId: string
  detectedSymptom: string
  matchedKeyword?: string
  symptomText?: string
}) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(storageKeys.token) : null
  const jwtRole = tokenRoleFromJwt(token)
  if (jwtRole !== 'PATIENT') {
    const error = new Error('PATIENT_SESSION_REQUIRED') as Error & { code?: string }
    error.code = 'PATIENT_SESSION_REQUIRED'
    throw error
  }

  const response = await client.post<{ success: boolean; data: EmergencyAlert }>('/emergency', data)
  const alert = response.data.data
  cachePatientLatestEmergency(alert)
  return alert
}

export const getPatientLatestEmergency = async () => {
  const response = await client.get<{ success: boolean; data: EmergencyAlert | null }>(
    '/emergency/patient/latest',
  )
  const data = response.data.data
  cachePatientLatestEmergency(data)
  return data
}

export const getDoctorActiveEmergencies = async () => {
  const response = await client.get<{ success: boolean; data: EmergencyAlert[]; count: number }>(
    '/emergency/doctor/active',
  )
  return response.data
}

export const getEmergencyAlert = async (id: string) => {
  const response = await client.get<{ success: boolean; data: EmergencyAlert }>(`/emergency/${id}`)
  return response.data.data
}

export const respondToEmergency = async (id: string) => {
  const response = await client.patch<{ success: boolean; data: EmergencyAlert }>(`/emergency/${id}/respond`)
  return response.data.data
}
