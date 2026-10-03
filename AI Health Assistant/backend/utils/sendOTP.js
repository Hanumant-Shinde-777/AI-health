import { env } from '../config/env.js'
import { ApiError } from './apiError.js'

/** Twilio is configured when the account, token and a sender (number or messaging service) are set. */
export const isSmsConfigured = () =>
  Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID))

const sendSmsViaTwilio = async (to, body) => {
  const params = new URLSearchParams({ To: to, Body: body })
  if (env.TWILIO_MESSAGING_SERVICE_SID) params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID)
  else params.set('From', env.TWILIO_PHONE_NUMBER)

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10_000),
    },
  )
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    // Log provider details server-side only; never echo them (or the code) to the client
    console.error(`[OTP] Twilio send failed (${response.status}):`, detail?.message ?? detail)
    throw new ApiError(502, 'Could not send the verification code. Please try again shortly.', 'SMS_FAILED')
  }
}

/**
 * Delivers an OTP. Phones are already normalised to E.164 (+91XXXXXXXXXX) by utils/phone.js.
 * - Twilio configured → SMS to the phone (email delivery is not implemented, so SMS is used for both channels)
 * - DEV_LOG_OTP (default outside production) → code is printed to the server log
 * - Neither → 503, instead of silently "sending" a code nobody receives
 */
export const sendOTP = async ({ phone, email, otp, channel = 'sms' }) => {
  const target = channel === 'email' && email ? email : phone
  if (env.DEV_LOG_OTP) {
    console.log(`[OTP] ${channel.toUpperCase()} → ${target}: ${otp}`)
  }

  if (isSmsConfigured()) {
    if (!phone) throw new ApiError(400, 'A phone number is required to send the code', 'VALIDATION')
    const minutes = env.OTP_TTL_MINUTES
    await sendSmsViaTwilio(phone, `${otp} is your AI Health Assistant verification code. It expires in ${minutes} minutes. Do not share it with anyone.`)
    return { success: true, delivered: 'sms' }
  }

  if (env.DEV_LOG_OTP) return { success: true, delivered: 'log' }

  console.error('[OTP] No SMS provider configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER).')
  throw new ApiError(503, 'Verification codes cannot be sent right now. Please contact support.', 'SMS_NOT_CONFIGURED')
}
