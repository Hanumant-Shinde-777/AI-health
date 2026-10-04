import prisma from '../config/prismaClient.js'
import { renderPrescriptionPdf } from '../utils/prescriptionPdf.js'
import { ApiError } from '../utils/apiError.js'

const canAccess = (prescription, user) => {
  if (user.role === 'PATIENT' && prescription.patientId === user.id) return true
  if (user.role === 'DOCTOR' && prescription.doctorId === user.id) return true
  return false
}

/** Drafts are the doctor's work in progress — patients only ever see approved prescriptions. */
export const hiddenFromUser = (prescription, user) =>
  user.role === 'PATIENT' && prescription.status !== 'approved'

export const create = async (req, res) => {
  const { consultationId, patientId, diagnosis, medicines, advice, followUpDate } = req.body
  if (!consultationId || !diagnosis) {
    throw new ApiError(400, 'consultationId and diagnosis are required', 'VALIDATION')
  }

  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } })
  if (!consultation || consultation.doctorId !== req.user.id) {
    throw new ApiError(404, 'Consultation not found', 'NOT_FOUND')
  }
  // The prescription's patient is always the consultation's patient. patientId is optional
  // (the app doesn't send it); if a client does send one it must match.
  if (patientId && patientId !== consultation.patientId) {
    throw new ApiError(400, 'patientId does not match the consultation', 'VALIDATION')
  }

  const prescription = await prisma.prescription.create({
    data: {
      consultationId,
      patientId: consultation.patientId,
      doctorId: req.user.id,
      diagnosis,
      medicines: medicines ?? [],
      advice,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: 'draft',
    },
  })

  res.status(201).json({ success: true, data: prescription })
}

export const approve = async (req, res) => {
  const existing = await prisma.prescription.findUnique({ where: { id: req.params.id } })
  if (!existing || existing.doctorId !== req.user.id) {
    throw new ApiError(404, 'Prescription not found', 'NOT_FOUND')
  }
  const prescription = await prisma.prescription.update({
    where: { id: req.params.id },
    data: { status: 'approved' },
  })
  res.json({ success: true, data: prescription })
}

export const getById = async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    include: { doctor: true, patient: true, consultation: true },
  })
  if (!prescription) throw new ApiError(404, 'Prescription not found', 'NOT_FOUND')
  if (!canAccess(prescription, req.user)) throw new ApiError(403, 'Forbidden', 'FORBIDDEN')
  if (hiddenFromUser(prescription, req.user)) throw new ApiError(404, 'Prescription not found', 'NOT_FOUND')
  res.json({ success: true, data: prescription })
}

export const listByPatient = async (req, res) => {
  if (req.params.patientId !== req.user.id) {
    throw new ApiError(403, 'Forbidden', 'FORBIDDEN')
  }
  const rows = await prisma.prescription.findMany({
    where: { patientId: req.params.patientId, status: 'approved' },
    include: { doctor: { select: { fullName: true, specialization: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: rows })
}

export const getByConsultation = async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { consultationId: req.params.consultationId },
    include: { patient: true, doctor: true },
  })
  if (!prescription || prescription.doctorId !== req.user.id) {
    throw new ApiError(404, 'Prescription not found', 'NOT_FOUND')
  }
  res.json({ success: true, data: prescription })
}

/**
 * GET /:id/pdf — branded prescription PDF.
 * Patients can download their own approved prescriptions; doctors their own (drafts are stamped DRAFT).
 */
export const downloadPdf = async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      patientId: true,
      doctorId: true,
      diagnosis: true,
      medicines: true,
      advice: true,
      followUpDate: true,
      status: true,
      createdAt: true,
      patient: { select: { fullName: true, age: true, gender: true } },
      doctor: { select: { fullName: true, specialization: true, licenseNumber: true, clinicName: true, clinicAddress: true } },
    },
  })
  if (!prescription) throw new ApiError(404, 'Prescription not found', 'NOT_FOUND')
  if (!canAccess(prescription, req.user)) throw new ApiError(403, 'Forbidden', 'FORBIDDEN')
  if (hiddenFromUser(prescription, req.user)) {
    throw new ApiError(404, 'Prescription not found', 'NOT_FOUND')
  }

  const pdf = await renderPrescriptionPdf(prescription)
  const date = new Date(prescription.createdAt).toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="prescription-${date}-${prescription.id.slice(0, 8)}.pdf"`)
  res.setHeader('Content-Length', String(pdf.length))
  res.setHeader('Cache-Control', 'private, no-store')
  res.send(pdf)
}
