// Help & Support — public contact form (signed-out users need help too, rate limited in server.js)
// plus the staff inbox for reading and closing messages
import { Router } from 'express'
import prisma from '../config/prismaClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { verifyToken } from '../utils/generateToken.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { env } from '../config/env.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LIMITS = { name: 100, email: 200, messageMin: 10, messageMax: 2000 }

/** Signed-in sender, if a valid token is present. Never required. */
const optionalUser = (req) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    const payload = verifyToken(header.slice(7))
    return payload?.id ? { id: String(payload.id), role: String(payload.role ?? '').toLowerCase() || null } : null
  } catch {
    return null
  }
}

/**
 * POST /api/support
 * Body: { name: string, email: string, message: string }
 */
router.post('/', asyncHandler(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''

  if (!name || name.length > LIMITS.name) {
    throw new ApiError(400, `Name is required (max ${LIMITS.name} characters)`, 'VALIDATION')
  }
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) {
    throw new ApiError(400, 'A valid email address is required', 'VALIDATION')
  }
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) {
    throw new ApiError(400, `Message must be ${LIMITS.messageMin}-${LIMITS.messageMax} characters`, 'VALIDATION')
  }

  const user = optionalUser(req)
  const row = await prisma.supportMessage.create({
    data: { name, email, message, userId: user?.id ?? null, role: user?.role ?? null },
    select: { id: true, createdAt: true },
  })
  res.status(201).json({ success: true, data: row })
}))

// ---- Staff inbox ---------------------------------------------------------------
// Staff are existing patient/doctor accounts whose email is listed in SUPPORT_STAFF_EMAILS.

const STATUSES = ['open', 'closed']

const isStaff = async (user) => {
  if (!env.SUPPORT_STAFF_EMAILS.length) return false
  const where = { where: { id: user.id }, select: { email: true } }
  const account = user.role === 'DOCTOR' ? await prisma.doctor.findUnique(where) : await prisma.patient.findUnique(where)
  const email = account?.email?.trim().toLowerCase()
  return Boolean(email && env.SUPPORT_STAFF_EMAILS.includes(email))
}

const requireStaff = asyncHandler(async (req, res, next) => {
  if (!(await isStaff(req.user))) throw new ApiError(403, 'Support inbox is for staff only', 'FORBIDDEN')
  next()
})

/** GET /api/support/access — lets the app decide whether to show the inbox link */
router.get('/access', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { staff: await isStaff(req.user) } })
}))

/** GET /api/support/messages?status=open|closed|all — newest first */
router.get('/messages', authMiddleware, requireStaff, asyncHandler(async (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : null
  const [rows, counts] = await Promise.all([
    prisma.supportMessage.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.supportMessage.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  const count = (s) => counts.find((c) => c.status === s)?._count._all ?? 0
  res.json({ success: true, data: rows, counts: { open: count('open'), closed: count('closed') } })
}))

/** PATCH /api/support/messages/:id  Body: { status: 'open' | 'closed' } */
router.patch('/messages/:id', authMiddleware, requireStaff, asyncHandler(async (req, res) => {
  const status = req.body?.status
  if (!STATUSES.includes(status)) throw new ApiError(400, 'status must be open or closed', 'VALIDATION')
  const existing = await prisma.supportMessage.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!existing) throw new ApiError(404, 'Message not found', 'NOT_FOUND')
  const row = await prisma.supportMessage.update({ where: { id: req.params.id }, data: { status } })
  res.json({ success: true, data: row })
}))

export default router
