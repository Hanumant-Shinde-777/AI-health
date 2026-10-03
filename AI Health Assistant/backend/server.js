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
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import { rateLimit } from './middleware/rateLimitMiddleware.js'
import { securityHeaders } from './middleware/securityHeaders.js'

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

const corsOptions = {
  origin(origin, callback) {
    if (!origin || origin.startsWith('http://localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}

app.use(securityHeaders)
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

// Frontend legacy paths (/api/patients, /api/consultations, …)
app.use('/api', legacyRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`API http://localhost:${env.PORT}/api`)
  console.log('CORS: http://localhost:* (any port)')
})
