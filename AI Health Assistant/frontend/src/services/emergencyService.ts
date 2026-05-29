import client from '@/services/apiClient'
import type { MatchedDoctor } from '@/types/doctors'

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
  status: string
  servicesAlerted: boolean
  createdAt: string
}

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
  const response = await client.post<{ success: boolean; data: EmergencyAlert }>('/emergency', data)
  return response.data.data
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
