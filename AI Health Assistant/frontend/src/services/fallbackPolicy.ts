import axios from 'axios'
import i18n from '@/i18n/i18n'

/**
 * Demo mode: services may answer from local mock data when the backend can't be reached.
 * On in development builds, or in any build with VITE_DEMO_MODE=true. Off in production.
 */
export const isDemoMode = (): boolean => import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

/**
 * Whether a failed API call may fall back to local mock data.
 *
 * Only when the server could not be reached at all (no HTTP response) AND demo mode is on.
 * An HTTP error response (400, 401, 403, 429, 500, …) means the server rejected the request —
 * falling back would tell the user something was saved, sent or verified when it wasn't.
 */
export const canUseMockFallback = (error: unknown): boolean => {
  if (!isDemoMode()) return false
  if (axios.isAxiosError(error)) return !error.response
  // Non-axios errors (e.g. thrown before the request) are not "server unreachable"
  return false
}

/** Rethrows unless the error qualifies for the mock fallback. Use at the top of a service `catch`. */
export const assertMockFallbackAllowed = (error: unknown): void => {
  if (!canUseMockFallback(error)) throw error
}

/** User-facing message for an API error (server message when present, friendly text for common cases). */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return navigator.onLine === false ? i18n.t('network.offlineError', 'You are offline. Check your connection and try again.') : fallback
    if (error.response.status === 429) return i18n.t('network.rateLimited', 'Too many requests. Please wait a moment and try again.')
    const data = error.response.data as { message?: unknown; error?: unknown } | undefined
    const message = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : ''
    if (message && error.response.status < 500) return message
  }
  return fallback
}
