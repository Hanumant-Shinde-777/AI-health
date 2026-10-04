import 'dotenv/config'

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const isProduction = NODE_ENV === 'production'
const DEFAULT_JWT_SECRET = 'dev-change-me-in-production'

const toPositiveInt = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT ?? 5000),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  /** Comma-separated allowed origins in production (e.g. https://app.example.com) */
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173,http://localhost:5174',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  OTP_TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES ?? 10),
  /** Log OTP codes to the console. On by default only outside production. */
  DEV_LOG_OTP: process.env.DEV_LOG_OTP ? process.env.DEV_LOG_OTP !== 'false' : !isProduction,

  // Brute-force lockout (read by utils/loginService.js)
  MAX_OTP_ATTEMPTS: toPositiveInt(process.env.MAX_OTP_ATTEMPTS, 5),
  OTP_LOCK_MINUTES: toPositiveInt(process.env.OTP_LOCK_MINUTES, 15),
  MAX_PASSWORD_ATTEMPTS: toPositiveInt(process.env.MAX_PASSWORD_ATTEMPTS, 5),
  PASSWORD_LOCK_MINUTES: toPositiveInt(process.env.PASSWORD_LOCK_MINUTES, 15),

  // Per-IP rate limits
  RATE_LIMIT_AUTH_MAX: toPositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 30),
  RATE_LIMIT_AUTH_WINDOW_MINUTES: toPositiveInt(process.env.RATE_LIMIT_AUTH_WINDOW_MINUTES, 15),
  RATE_LIMIT_AI_MAX: toPositiveInt(process.env.RATE_LIMIT_AI_MAX, 40),
  RATE_LIMIT_AI_WINDOW_MINUTES: toPositiveInt(process.env.RATE_LIMIT_AI_WINDOW_MINUTES, 1),
  /** Set when running behind a reverse proxy so req.ip is the client address (e.g. 1) */
  TRUST_PROXY: process.env.TRUST_PROXY ?? '',

  /** Comma-separated account emails (patient or doctor) that can read the support inbox */
  SUPPORT_STAFF_EMAILS: (process.env.SUPPORT_STAFF_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),

  // SMS delivery for OTP codes (Twilio). Sender: TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? '',
  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID ?? '',
}

if (isProduction && env.JWT_SECRET === DEFAULT_JWT_SECRET) {
  console.warn('[env] WARNING: JWT_SECRET is not set — using the insecure development default. Set JWT_SECRET in production.')
}
if (isProduction && env.DEV_LOG_OTP) {
  console.warn('[env] WARNING: DEV_LOG_OTP is enabled in production — OTP codes will be written to logs.')
}
if (isProduction && !(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID))) {
  console.warn('[env] WARNING: no SMS provider configured (TWILIO_*). Users will not receive OTP codes and cannot sign in.')
}
