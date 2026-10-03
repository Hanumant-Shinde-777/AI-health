// Notifications derived from the user's own data, so they reach every device.
// Items are structured (type + params); the app renders the text in the user's language.
import { Router } from 'express'
import prisma from '../config/prismaClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const LIMIT = 50

const iso = (d) => new Date(d).toISOString()

/** GET /api/notifications — newest first, at most 50. Requires authMiddleware. */
router.get('/', asyncHandler(async (req, res) => {
  const { id, role } = req.user
  const items = []

  if (role === 'DOCTOR') {
    const pending = await prisma.consultation.findMany({
      where: { doctorId: id, status: 'pending' },
      select: { id: true, createdAt: true, possibleDisease: true, riskLevel: true, patient: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
    })
    for (const c of pending) {
      items.push({
        notificationId: `new-case:${c.id}`,
        type: 'DOCTOR_NEW_CASE',
        caseId: c.id,
        createdAt: iso(c.createdAt),
        route: `/doctor-consultation/${c.id}`,
        params: { patientName: c.patient?.fullName ?? '', condition: c.possibleDisease ?? '', riskLevel: c.riskLevel ?? '' },
      })
    }
  } else {
    const [needInfo, approved] = await Promise.all([
      prisma.consultation.findMany({
        where: { patientId: id, status: 'need_more_info' },
        select: { id: true, updatedAt: true, doctorMessage: true, doctor: { select: { fullName: true } } },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT,
      }),
      prisma.prescription.findMany({
        where: { patientId: id, status: 'approved' },
        select: { id: true, consultationId: true, updatedAt: true, doctor: { select: { fullName: true } } },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT,
      }),
    ])
    for (const c of needInfo) {
      items.push({
        // Includes updatedAt so a second request for information shows up as new
        notificationId: `need-info:${c.id}:${iso(c.updatedAt)}`,
        type: 'PATIENT_DOCTOR_MESSAGE',
        caseId: c.id,
        createdAt: iso(c.updatedAt),
        route: '/history',
        params: { doctorName: c.doctor?.fullName ?? '', message: c.doctorMessage ?? '' },
      })
    }
    for (const p of approved) {
      items.push({
        notificationId: `rx-ready:${p.id}`,
        type: 'PATIENT_PRESCRIPTION_READY',
        caseId: p.consultationId,
        createdAt: iso(p.updatedAt),
        route: `/my-prescription/${p.id}`,
        params: { doctorName: p.doctor?.fullName ?? '' },
      })
    }
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ success: true, data: items.slice(0, LIMIT) })
}))

export default router
