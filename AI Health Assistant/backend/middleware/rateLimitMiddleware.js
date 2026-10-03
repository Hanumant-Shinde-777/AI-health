// In-memory fixed-window rate limiter (per client IP).
// Good for a single instance; use a shared store (e.g. Redis) when running several.

/**
 * @param {{ windowMs: number, max: number, name: string, message?: string }} options
 */
export const rateLimit = ({ windowMs, max, name, message = 'Too many requests. Please try again shortly.' }) => {
  const hits = new Map()

  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, windowMs)
  sweep.unref?.()

  return (req, res, next) => {
    if (req.method === 'OPTIONS') return next()

    const now = Date.now()
    const key = req.ip ?? req.socket?.remoteAddress ?? 'unknown'
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1

    const remaining = Math.max(0, max - entry.count)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)))

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      console.warn(`[rateLimit:${name}] limit exceeded for ${key}`)
      return res.status(429).json({ success: false, message, error: message, code: 'RATE_LIMITED', retryAfter })
    }
    next()
  }
}
