/** Decode JWT payload without verification (client-side role sync only). */
export const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export const tokenRoleFromJwt = (token: string | null): 'PATIENT' | 'DOCTOR' | null => {
  if (!token || token.startsWith('mock-token-')) return null
  const payload = decodeJwtPayload(token)
  const raw = String(payload?.role ?? '').toUpperCase()
  if (raw === 'PATIENT') return 'PATIENT'
  if (raw === 'DOCTOR') return 'DOCTOR'
  return null
}
