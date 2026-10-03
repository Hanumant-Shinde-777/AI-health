import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import patientRoutes from './routes/patientRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import { listDoctors } from './controllers/doctorController.js'
import { asyncHandler } from './utils/asyncHandler.js'
import consultationRoutes from './routes/consultationRoutes.js'
import prescriptionRoutes from './routes/prescriptionRoutes.js'
import legacyRoutes from './routes/legacyRoutes.js'
import followUpRoutes from './routes/followUpRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import supportRoutes from './routes/supportRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import { authMiddleware } from './middleware/authMiddleware.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import { rateLimit } from './middleware/rateLimitMiddleware.js'
import { securityHeaders } from './middleware/securityHeaders.js'
import { corsOptions, describeCorsPolicy } from './config/cors.js'
import { stripSecretsMiddleware } from './middleware/stripSecrets.js'

const app = express()
app.disable('x-powered-by')
if (env.TRUST_PROXY) {
  app.set('trust proxy', /^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY)
}

const authLimiter = rateLimit({
  name: 'auth',
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_AUTH_MAX,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
})
const aiLimiter = rateLimit({
  name: 'ai',
  windowMs: env.RATE_LIMIT_AI_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_AI_MAX,
  message: 'Too many AI requests. Please wait a moment and try again.',
})
const supportLimiter = rateLimit({
  name: 'support',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many support messages. Please try again later.',
})

app.use(securityHeaders)
app.use(stripSecretsMiddleware)
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'ai-health-assistant-api' })
})

// Spec routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/patient', patientRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/consultation', consultationRoutes)
app.use('/api/prescription', prescriptionRoutes)

// Public doctors list (spec: GET /api/doctors)
app.get('/api/doctors', asyncHandler(listDoctors))

// Follow-up routes
app.use('/api/follow-ups', followUpRoutes)

// AI Orchestrator routes (no auth required)
app.use('/api/ai', aiLimiter, aiRoutes)

// Help & Support contact form (public)
app.use('/api/support', supportLimiter, supportRoutes)

// Notifications built from the user's own consultations and prescriptions
app.use('/api/notifications', authMiddleware, notificationRoutes)

// Frontend legacy paths (/api/patients, /api/consultations, …)
app.use('/api', legacyRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`API http://localhost:${env.PORT}/api`)
  console.log(`CORS: ${describeCorsPolicy()}`)
})
