import client from '@/services/apiClient'
import type { AppDispatch } from '@/store'
import { clearPatientData, setMedicalHistory, setProfile } from '@/store/slices/patientSlice'
import type { Gender, MedicalHistory, Patient } from '@/types'
import {
  clearPatientSessionCache,
  delay,
  readStorage,
  storageKeys,
  writePatientExtendedProfile,
  writeStorage,
} from '@/utils'
import { getCurrentPatientId } from '@/utils/userScope'

const hasToken = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.localStorage.getItem(storageKeys.token))

const emptyMedicalHistory = (): MedicalHistory => ({
  chronicDiseases: [],
  allergies: [],
  currentMedicines: [],
})

const emptyPatientProfile = (patientId: string): Patient => ({
  id: patientId,
  fullName: '',
  age: 0,
  gender: 'OTHER' as Gender,
  heightCm: 0,
  weightKg: 0,
})

const formatDateOnly = (value: unknown): string | undefined => {
  if (!value) return undefined
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString().slice(0, 10)
}

export const mapPatientFromApi = (data: Record<string, unknown>): Patient => ({
  id: String(data.id ?? ''),
  fullName: String(data.fullName ?? ''),
  age: Number(data.age ?? 0),
  gender: (String(data.gender ?? 'OTHER').toUpperCase() as Gender) || 'OTHER',
  heightCm: Number(data.heightCm ?? data.height ?? 0),
  weightKg: Number(data.weightKg ?? data.weight ?? 0),
  bloodGroup: data.bloodGroup as Patient['bloodGroup'],
  email: data.email ? String(data.email) : undefined,
  dateOfBirth: formatDateOnly(data.dateOfBirth),
  address: data.address ? String(data.address) : undefined,
  emergencyContact: data.emergencyContact ? String(data.emergencyContact) : undefined,
})

const syncExtendedProfileCache = (profile: Patient): void => {
  writePatientExtendedProfile({
    email: profile.email,
    dateOfBirth: profile.dateOfBirth,
    address: profile.address,
    emergencyContact: profile.emergencyContact,
  })
}

/** Clear stale caches and load the authenticated patient's data from the API. */
export const loadPatientSessionData = async (dispatch: AppDispatch): Promise<void> => {
  clearPatientSessionCache()
  dispatch(clearPatientData())

  if (!hasToken()) {
    return
  }

  const [profile, medicalHistory] = await Promise.all([
    getProfile(),
    getMedicalHistory(),
  ])
  dispatch(setProfile(profile))
  dispatch(setMedicalHistory(medicalHistory))
  syncExtendedProfileCache(profile)
}

export const getProfile = async (): Promise<Patient> => {
  if (hasToken()) {
    const response = await client.get<Record<string, unknown>>('/patients/me')
    return mapPatientFromApi(response.data)
  }
  await delay()
  const patientId = getCurrentPatientId()
  return patientId ? emptyPatientProfile(patientId) : emptyPatientProfile('patient')
}

export const updateProfile = async (data: Partial<Patient>): Promise<Patient> => {
  if (hasToken()) {
    const response = await client.put<Record<string, unknown>>('/patients/me', {
      fullName: data.fullName,
      age: data.age,
      gender: data.gender,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      bloodGroup: data.bloodGroup,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      emergencyContact: data.emergencyContact,
    })
    const mapped = mapPatientFromApi(response.data)
    syncExtendedProfileCache(mapped)
    return mapped
  }
  await delay()
  const patientId = getCurrentPatientId() ?? data.id
  const current =
    readStorage<Patient | null>(storageKeys.profile, null) ??
    (patientId ? emptyPatientProfile(patientId) : emptyPatientProfile('patient'))
  const next = { ...current, ...data, id: data.id ?? current.id ?? patientId ?? 'patient' }
  writeStorage(storageKeys.profile, next)
  syncExtendedProfileCache(next)
  return next
}

export const getMedicalHistory = async (): Promise<MedicalHistory> => {
  if (hasToken()) {
    const response = await client.get<MedicalHistory>('/patients/me/medical-history')
    return response.data
  }
  await delay()
  return readStorage<MedicalHistory | null>(storageKeys.medicalHistory, null) ?? emptyMedicalHistory()
}

export const updateMedicalHistory = async (data: MedicalHistory): Promise<MedicalHistory> => {
  if (hasToken()) {
    const response = await client.put<MedicalHistory>('/patients/me/medical-history', data)
    return response.data
  }
  writeStorage(storageKeys.medicalHistory, data)
  return data
}
