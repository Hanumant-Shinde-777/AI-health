import prisma from '../config/prismaClient.js'
import { verifyToken } from '../utils/generateToken.js'
import { ApiError } from '../utils/apiError.js'

const normalizeRole = (role) => {
  const r = String(role ?? '').toUpperCase()
  if (r === 'DOCTOR') return 'doctor'
  if (r === 'PATIENT') return 'patient'
  return null
}

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    const payload = verifyToken(header.slice(7))
    const userId = payload.id ?? payload.sub
    if (!userId) {
      throw new ApiError(401, 'Invalid token payload', 'UNAUTHORIZED')
    }

    const roleClaim = normalizeRole(payload.role)

    if (roleClaim === 'patient') {
      const patient = await prisma.patient.findUnique({ where: { id: userId } })
      if (!patient) {
        throw new ApiError(401, 'User not found', 'UNAUTHORIZED')
      }
      req.user = { id: patient.id, role: 'PATIENT' }
      return next()
    }

    if (roleClaim === 'doctor') {
      const doctor = await prisma.doctor.findUnique({ where: { id: userId } })
      if (!doctor) {
        throw new ApiError(401, 'User not found', 'UNAUTHORIZED')
      }
      req.user = { id: doctor.id, role: 'DOCTOR' }
      return next()
    }

    const [patient, doctor] = await Promise.all([
      prisma.patient.findUnique({ where: { id: userId } }),
      prisma.doctor.findUnique({ where: { id: userId } }),
    ])

    if (patient) {
      req.user = { id: patient.id, role: 'PATIENT' }
      return next()
    }
    if (doctor) {
      req.user = { id: doctor.id, role: 'DOCTOR' }
      return next()
    }

    throw new ApiError(401, 'User not found', 'UNAUTHORIZED')
  } catch (e) {
    if (e instanceof ApiError) return next(e)
    next(new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED'))
  }
}
