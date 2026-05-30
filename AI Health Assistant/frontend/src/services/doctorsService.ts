import client from '@/services/apiClient'
import { delay, readDoctorProfile, writeDoctorProfile, type DoctorProfileRecord } from '@/utils'
import type { MatchedDoctor } from '@/types/doctors'
import {
  getSpecFromSymptom,
  getSpecializationFallbackChain,
  getSpecializationQueryVariants,
} from '@/utils/doctors'

export interface DoctorProfileUpdateInput {
  fullName: string
  mobile: string
  email: string
  profilePictureUrl: string
  specialization: string
  hospital: string
  consultationFee: string
}

interface BackendDoctorListItem {
  id: string
  fullName: string
  specialization: string
  clinicName: string | null
  consultationFee: number | null
  rating: number | null
  yearsOfExperience: number | null
  availability: boolean
}

export interface DoctorMatchResult {
  doctors: MatchedDoctor[]
  recommendedSpec: string
  displaySpec: string
  usedFallback: boolean
}

const mapToMatchedDoctor = (d: BackendDoctorListItem): MatchedDoctor => ({
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

const fetchDoctorsBySpecQuery = async (specialization: string): Promise<MatchedDoctor[]> => {
  const response = await client.get<{ success: boolean; data: BackendDoctorListItem[] }>('/doctors', {
    params: { specialization },
  })
  return (response.data.data ?? []).map(mapToMatchedDoctor)
}

/** Try exact specialization query variants until doctors are found. */
export const fetchDoctorsForSpecialization = async (spec: string): Promise<MatchedDoctor[]> => {
  const variants = getSpecializationQueryVariants(spec)
  for (const variant of variants) {
    const doctors = await fetchDoctorsBySpecQuery(variant)
    if (doctors.length > 0) {
      return doctors
    }
  }
  return []
}

/**
 * Resolve doctors for a symptom using recommended spec + related fallback chain.
 * All UI should use displaySpec from the result (original or fallback).
 */
export const resolveDoctorsForSymptom = async (symptom: string): Promise<DoctorMatchResult> => {
  const recommendedSpec = getSpecFromSymptom(symptom)
  const chain = getSpecializationFallbackChain(recommendedSpec)

  for (let i = 0; i < chain.length; i += 1) {
    const spec = chain[i]
    const doctors = await fetchDoctorsForSpecialization(spec)
    if (doctors.length > 0) {
      return {
        doctors,
        recommendedSpec,
        displaySpec: spec,
        usedFallback: i > 0,
      }
    }
  }

  return {
    doctors: [],
    recommendedSpec,
    displaySpec: recommendedSpec,
    usedFallback: false,
  }
}

/** @deprecated Use resolveDoctorsForSymptom — kept for compatibility. */
export const getDoctorsBySpecialization = async (
  specialization: string,
): Promise<{ doctors: MatchedDoctor[]; usedFallback: boolean; effectiveSpecialization: string }> => {
  const recommendedSpec = specialization
  const chain = getSpecializationFallbackChain(recommendedSpec)

  for (let i = 0; i < chain.length; i += 1) {
    const spec = chain[i]
    const doctors = await fetchDoctorsForSpecialization(spec)
    if (doctors.length > 0) {
      return {
        doctors,
        usedFallback: i > 0,
        effectiveSpecialization: spec,
      }
    }
  }

  return { doctors: [], usedFallback: false, effectiveSpecialization: recommendedSpec }
}

/** Fetch the authenticated doctor's own profile from the backend. */
export const getDoctorProfile = async (): Promise<DoctorProfileRecord | null> => {
  try {
    const response = await client.get<DoctorProfileRecord>('/doctor/profile')
    return response.data
  } catch {
    return null
  }
}

/** Fetch the public list of available doctors (for patient-side doctor selection). */
export const getDoctors = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await client.get<{ success: boolean; data: Array<{ id: string; fullName: string }> }>('/doctors')
    return (response.data.data ?? []).map((d) => ({ id: d.id, name: d.fullName }))
  } catch {
    return []
  }
}

export const updateDoctorProfile = async (data: DoctorProfileUpdateInput): Promise<DoctorProfileRecord> => {
  try {
    const response = await client.patch<DoctorProfileRecord>('/doctor/update-profile', data)
    writeDoctorProfile(response.data)
    return response.data
  } catch {
    await delay()
    const current = readDoctorProfile()
    const next: DoctorProfileRecord = {
      fullName: data.fullName,
      specialization: data.specialization,
      registrationNumber: current?.registrationNumber ?? '',
      hospital: data.hospital,
      experienceYears: current?.experienceYears ?? '',
      consultationFee: data.consultationFee,
      email: data.email,
      mobile: data.mobile,
      profilePictureUrl: data.profilePictureUrl,
      clinicAddress: current?.clinicAddress,
      availableDays: current?.availableDays,
      consultationHoursFrom: current?.consultationHoursFrom,
      consultationHoursTo: current?.consultationHoursTo,
    }
    writeDoctorProfile(next)
    return next
  }
}
