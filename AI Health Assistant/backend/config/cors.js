import { env } from './env.js'

/** Matches http://localhost:5173, http://127.0.0.1:5174, etc. */
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

/** Origins from FRONTEND_URL (comma-separated), without trailing slashes. */
const parseAllowedOrigins = () =>
  (env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

const allowedOrigins = new Set(parseAllowedOrigins())

/**
 * Allowed: requests without an Origin (same-origin, curl, Postman), any localhost origin in
 * development, and every origin listed in FRONTEND_URL.
 */
export const corsOriginCallback = (origin, callback) => {
  if (!origin) {
    return callback(null, true)
  }

  if (env.NODE_ENV === 'development' && LOCALHOST_ORIGIN.test(origin)) {
    return callback(null, true)
  }

  if (allowedOrigins.has(origin)) {
    return callback(null, true)
  }

  // 403 (not 500) so the error handler reports it as a client-side rejection
  const error = new Error(`CORS blocked origin: ${origin}. Add it to FRONTEND_URL to allow it.`)
  error.status = 403
  callback(error)
}

export const corsOptions = {
  origin: corsOriginCallback,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}

/** Human-readable summary for the startup log. */
export const describeCorsPolicy = () => {
  const listed = [...allowedOrigins]
  const parts = []
  if (env.NODE_ENV === 'development') parts.push('any localhost / 127.0.0.1 port')
  if (listed.length) parts.push(listed.join(', '))
  return parts.join(' + ') || 'no browser origins (set FRONTEND_URL)'
}
