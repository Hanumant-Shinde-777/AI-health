import prisma from '../config/prismaClient.js'
import { ApiError } from '../utils/apiError.js'
import { detectEmergency, getRecommendedSpecializations } from '../services/emergencyService.js'

const normalizeStatus = (status) => {
  if (status === 'active') return 'pending'
  if (status === 'acknowledged') return 'reviewed'
  return status
}

const mapAlert = (row) => ({
  id: row.id,
  patientId: row.patientId,
  patientName: row.patient?.fullName ?? 'Patient',
  patientAge: row.patient?.age ?? null,
  patientGender: row.patient?.gender ?? null,
  doctorId: row.doctorId,
  doctorName: row.doctor?.fullName ?? null,
  detectedSymptom: row.detectedSymptom,
  matchedKeyword: row.matchedKeyword,
  symptomText: row.symptomText,
  status: normalizeStatus(row.status),
  reviewedAt: row.reviewedAt?.toISOString() ?? null,
  servicesAlerted: row.servicesAlerted,
  createdAt: row.createdAt.toISOString(),
})

/** GET /api/emergency/recommended-doctors?symptom=... */
export const getRecommendedDoctors = async (req, res) => {
  const symptomText = String(req.query.symptom ?? '').trim()
  const detection = detectEmergency(symptomText)
  const specs = detection.isEmergency
    ? detection.recommendedSpecializations
    : getRecommendedSpecializations(req.query.keyword ?? '', symptomText)

  const doctors = await prisma.doctor.findMany({
    where: {
      isVerified: true,
      OR: specs.map((spec) => ({
        specialization: { contains: spec.split(' ')[0], mode: 'insensitive' },
      })),
    },
    select: {
      id: true,
      fullName: true,
      specialization: true,
      clinicName: true,
      consultationFee: true,
      rating: true,
      yearsOfExperience: true,
      availability: true,
    },
    orderBy: { rating: 'desc' },
    take: 12,
  })

  res.json({
    success: true,
    data: {
      isEmergency: detection.isEmergency,
      matchedKeyword: detection.matchedKeyword ?? null,
      recommendedSpecializations: specs,
      doctors,
    },
  })
}

/** POST /api/emergency — patient assigns doctor to emergency */
export const createEmergencyAlert = async (req, res) => {
  const { doctorId, detectedSymptom, matchedKeyword, symptomText } = req.body
  if (!doctorId || !detectedSymptom) {
    throw new ApiError(400, 'doctorId and detectedSymptom are required', 'VALIDATION')
  }

  if (req.user.role !== 'PATIENT') {
    throw new ApiError(403, 'Please log in as a patient to alert doctors', 'PATIENT_REQUIRED')
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })
  if (!doctor?.isVerified) {
    throw new ApiError(400, 'Doctor not found', 'NOT_FOUND')
  }

  const row = await prisma.emergencyAlert.create({
    data: {
      patientId: req.user.id,
      doctorId,
      detectedSymptom: String(detectedSymptom),
      matchedKeyword: matchedKeyword ? String(matchedKeyword) : null,
      symptomText: symptomText ? String(symptomText) : String(detectedSymptom),
      status: 'pending',
      servicesAlerted: true,
    },
    include: { patient: true, doctor: true },
  })

  res.status(201).json({ success: true, data: mapAlert(row) })
}

/** GET /api/emergency/patient/latest — patient's most recent emergency for home tile */
export const getPatientLatestEmergency = async (req, res) => {
  if (req.user.role !== 'PATIENT') {
    return res.json({ success: true, data: null })
  }

  const row = await prisma.emergencyAlert.findFirst({
    where: { patientId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { select: { fullName: true, age: true, gender: true } },
      doctor: { select: { fullName: true, specialization: true } },
    },
  })

  res.json({ success: true, data: row ? mapAlert(row) : null })
}

/** GET /api/emergency/doctor/active — logged-in doctor's active emergencies */
export const listDoctorActiveEmergencies = async (req, res) => {
  const rows = await prisma.emergencyAlert.findMany({
    where: { doctorId: req.user.id, status: { in: ['pending', 'active'] } },
    include: {
      patient: { select: { fullName: true, age: true, gender: true } },
      doctor: { select: { fullName: true, specialization: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: rows.map(mapAlert), count: rows.length })
}

/** GET /api/emergency/:id */
export const getEmergencyById = async (req, res) => {
  const row = await prisma.emergencyAlert.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { select: { fullName: true, age: true, gender: true, phone: true } },
      doctor: { select: { fullName: true, specialization: true } },
    },
  })
  if (!row) {
    throw new ApiError(404, 'Emergency alert not found', 'NOT_FOUND')
  }

  const isPatient = req.user.role === 'PATIENT' && row.patientId === req.user.id
  const isDoctor = req.user.role === 'DOCTOR' && row.doctorId === req.user.id
  if (!isPatient && !isDoctor) {
    throw new ApiError(403, 'Forbidden', 'FORBIDDEN')
  }

  res.json({ success: true, data: mapAlert(row) })
}

/** PATCH /api/emergency/:id/respond — doctor accepts/responds */
export const respondToEmergency = async (req, res) => {
  const existing = await prisma.emergencyAlert.findUnique({ where: { id: req.params.id } })
  if (!existing || existing.doctorId !== req.user.id) {
    throw new ApiError(404, 'Emergency alert not found', 'NOT_FOUND')
  }

  const row = await prisma.emergencyAlert.update({
    where: { id: req.params.id },
    data: { status: 'reviewed', reviewedAt: new Date() },
    include: {
      patient: { select: { fullName: true, age: true, gender: true } },
      doctor: { select: { fullName: true, specialization: true } },
    },
  })

  res.json({ success: true, data: mapAlert(row) })
}
