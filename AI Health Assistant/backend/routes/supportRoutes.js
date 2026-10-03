// Help & Support contact form — public (signed-out users need help too), rate limited in server.js
import { Router } from 'express'
import prisma from '../config/prismaClient.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { verifyToken } from '../utils/generateToken.js'

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

export default router
