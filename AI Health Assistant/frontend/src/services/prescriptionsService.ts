import client from '@/services/apiClient'
import axios from 'axios'
import type { Prescription, PrescriptionPayload } from '@/types'
import { updateConsultationCaseStatus } from '@/services/consultationsService'
import { useDoctorDashboardStore } from '@/store/slices/doctorDashboardStore'
import {
  delay,
  generateId,
  getMockConsultations,
  getMockPrescriptions,
  isLocalMockId,
  readDoctorProfile,
  saveMockPrescriptions,
  setActivePrescriptionId,
} from '@/utils'
import {
  filterPrescriptionsForPatient,
  getCurrentPatientId,
} from '@/utils/userScope'
import { notifyPatientPrescriptionReady } from '@/utils/notifications'

const shouldUseMockFallback = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return true
  }
  const status = error.response?.status
  if (!status) {
    return true
  }
  // Consultation/prescription may exist only in local mock storage (e.g. consultation-rziz4v)
  return status === 404 || status >= 500
}

export const getPrescription = async (id: string): Promise<Prescription> => {
  if (isLocalMockId(id)) {
    await delay()
    const patientId = getCurrentPatientId()
    const pool = patientId
      ? filterPrescriptionsForPatient(getMockPrescriptions(), patientId)
      : getMockPrescriptions()
    const prescription = pool.find((item) => item.id === id)
    if (!prescription) {
      throw new Error('Prescription not found')
    }
    return prescription
  }

  try {
    const response = await client.get<Prescription>(`/prescriptions/${id}`)
    return response.data
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error
    }
    await delay()
    const patientId = getCurrentPatientId()
    const pool = patientId
      ? filterPrescriptionsForPatient(getMockPrescriptions(), patientId)
      : getMockPrescriptions()
    const prescription = pool.find((item) => item.id === id)
    if (!prescription) {
      throw new Error('Prescription not found')
    }
    return prescription
  }
}

export const getPrescriptions = async (): Promise<Prescription[]> => {
  try {
    const response = await client.get<Prescription[]>('/prescriptions')
    return response.data
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error
    }
    await delay()
    const patientId = getCurrentPatientId()
    if (!patientId) {
      return []
    }
    return filterPrescriptionsForPatient(getMockPrescriptions(), patientId)
  }
}

const savePrescriptionToMock = (data: PrescriptionPayload): Prescription => {
  const prescriptions = getMockPrescriptions()
  const consultation = getMockConsultations().find((item) => item.id === data.consultationId)
  const doctorProfile = readDoctorProfile()
  const existingIndex = prescriptions.findIndex((item) => item.consultationId === data.consultationId)

  const next: Prescription = {
    ...(existingIndex >= 0 ? prescriptions[existingIndex] : {}),
    id: existingIndex >= 0 ? prescriptions[existingIndex].id : generateId('prescription'),
    consultationId: data.consultationId,
    diagnosis: data.diagnosis,
    medicines: data.medicines,
    advice: data.advice,
    ors: data.ors,
    status: data.status ?? 'DRAFT',
    doctorName: doctorProfile?.fullName ? `Dr. ${doctorProfile.fullName}` : consultation?.doctorName ?? 'Doctor',
    qualification: doctorProfile?.specialization,
    registrationNumber: doctorProfile?.registrationNumber,
    patientName: consultation?.patientName ?? 'Patient',
    patientAge: consultation?.patientAge ?? 0,
    patientGender: consultation?.patientGender ?? 'OTHER',
    dateTime: data.dateTime ?? new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    prescriptions[existingIndex] = next
  } else {
    prescriptions.unshift(next)
  }
  saveMockPrescriptions(prescriptions)
  setActivePrescriptionId(next.id)
  return next
}

export const createPrescription = async (data: PrescriptionPayload): Promise<Prescription> => {
  if (isLocalMockId(data.consultationId)) {
    await delay()
    return savePrescriptionToMock(data)
  }

  try {
    const response = await client.post<Prescription>('/prescriptions', data)
    return response.data
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error
    }
    await delay()
    const consultation = getMockConsultations().find((item) => item.id === data.consultationId)
    if (!consultation) {
      throw error
    }
    return savePrescriptionToMock(data)
  }
}

export const updatePrescription = async (
  id: string,
  data: Partial<PrescriptionPayload>,
): Promise<Prescription> => {
  if (isLocalMockId(id)) {
    await delay()
    const prescriptions = getMockPrescriptions()
    const index = prescriptions.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('Prescription not found')
    }

    const current = prescriptions[index]
    const next: Prescription = {
      ...current,
      diagnosis: data.diagnosis ?? current.diagnosis,
      medicines: data.medicines ?? current.medicines,
      advice: data.advice ?? current.advice,
      ors: data.ors ?? current.ors,
      dateTime: data.dateTime ?? current.dateTime,
      status: data.status ?? current.status,
    }

    prescriptions[index] = next
    saveMockPrescriptions(prescriptions)
    return next
  }

  try {
    const response = await client.patch<Prescription>(`/prescriptions/${id}`, data)
    return response.data
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error
    }
    await delay()
    const prescriptions = getMockPrescriptions()
    const index = prescriptions.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('Prescription not found')
    }

    const current = prescriptions[index]
    const next: Prescription = {
      ...current,
      diagnosis: data.diagnosis ?? current.diagnosis,
      medicines: data.medicines ?? current.medicines,
      advice: data.advice ?? current.advice,
      ors: data.ors ?? current.ors,
      dateTime: data.dateTime ?? current.dateTime,
      status: data.status ?? current.status,
    }

    prescriptions[index] = next
    saveMockPrescriptions(prescriptions)
    return next
  }
}

export const approvePrescription = async (id: string): Promise<Prescription> => {
  if (isLocalMockId(id)) {
    await delay()
    const updated = await updatePrescription(id, { status: 'APPROVED' })
    const prescriptions = getMockPrescriptions()
    const index = prescriptions.findIndex((item) => item.id === id)
    if (index >= 0) {
      prescriptions[index] = {
        ...updated,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
      }
      saveMockPrescriptions(prescriptions)
      setActivePrescriptionId(id)
      const approved = prescriptions[index]
      const consultation = getMockConsultations().find((c) => c.id === approved.consultationId)
      if (consultation) {
        useDoctorDashboardStore.getState().markCaseReviewed(consultation.id)
        await updateConsultationCaseStatus(consultation.id, 'PRESCRIPTION_READY', {
          reviewedAt: new Date().toISOString(),
        })
        if (consultation.patientId) {
          notifyPatientPrescriptionReady({
            patientId: consultation.patientId,
            doctorName: consultation.doctorName ?? 'Doctor',
            caseId: consultation.id,
          })
        }
      }
      return approved
    }
    return updated
  }

  try {
    const response = await client.patch<Prescription>(`/prescriptions/${id}/approve`)
    const approved = response.data
    if (approved.consultationId) {
      useDoctorDashboardStore.getState().markCaseReviewed(approved.consultationId)
    }
    if (approved.consultationId) {
      try {
        await updateConsultationCaseStatus(approved.consultationId, 'PRESCRIPTION_READY', {
          reviewedAt: new Date().toISOString(),
        })
      } catch {
        // Backend may already mark consultation reviewed during approve.
      }
      const patientId = approved.patientId ?? getMockConsultations().find((c) => c.id === approved.consultationId)?.patientId
      if (patientId) {
        notifyPatientPrescriptionReady({
          patientId,
          doctorName: approved.doctorName ?? 'Doctor',
          caseId: approved.consultationId,
        })
      }
    }
    return approved
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error
    }
    await delay()
    const updated = await updatePrescription(id, { status: 'APPROVED' })
    const prescriptions = getMockPrescriptions()
    const index = prescriptions.findIndex((item) => item.id === id)
    if (index >= 0) {
      prescriptions[index] = {
        ...updated,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
      }
      saveMockPrescriptions(prescriptions)
      setActivePrescriptionId(id)
      const approved = prescriptions[index]
      const consultation = getMockConsultations().find((c) => c.id === approved.consultationId)
      if (consultation) {
        useDoctorDashboardStore.getState().markCaseReviewed(consultation.id)
        await updateConsultationCaseStatus(consultation.id, 'PRESCRIPTION_READY', {
          reviewedAt: new Date().toISOString(),
        })
        if (consultation.patientId) {
          notifyPatientPrescriptionReady({
            patientId: consultation.patientId,
            doctorName: consultation.doctorName ?? 'Doctor',
            caseId: consultation.id,
          })
        }
      }
      return approved
    }

    return updated
  }
}

export const downloadPdf = async (id: string): Promise<Blob> => {
  try {
    const response = await client.get<Blob>(`/prescriptions/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error
    }
    await delay()
    const prescription = await getPrescription(id)
    const lines = [
      `Prescription ID: ${prescription.id}`,
      `Doctor: ${prescription.doctorName ?? ''}`,
      `Diagnosis: ${prescription.diagnosis}`,
      '',
      'Medicines:',
      ...prescription.medicines.map(
        (item) => `- ${item.name}: ${item.dosage}, ${item.frequency}, ${item.duration}`,
      ),
      '',
      `Advice: ${prescription.advice ?? ''}`,
    ]
    return new Blob([lines.join('\n')], { type: 'application/pdf' })
  }
}
