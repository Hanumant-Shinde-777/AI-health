// Defense in depth: never let credential fields leave the API.
// Many queries `include: { patient: true, doctor: true }`, which returns whole user rows —
// including the bcrypt password hash — to the *other* party of a consultation. Rather than
// rely on every query remembering a `select`, every JSON response is scrubbed here.

const SECRET_KEYS = new Set(['password', 'passwordHash', 'otp'])

const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Returns a copy of `value` with secret keys removed at any depth. Dates and other objects pass through.
 * `ancestors` holds only the current path, so an object referenced twice is scrubbed both times;
 * a true cycle (which JSON could not serialize anyway) becomes null.
 */
export const stripSecrets = (value, ancestors = new WeakSet()) => {
  const isArray = Array.isArray(value)
  if (!isArray && !isPlainObject(value)) return value
  if (ancestors.has(value)) return null
  ancestors.add(value)
  let out
  if (isArray) {
    out = value.map((item) => stripSecrets(item, ancestors))
  } else {
    out = {}
    for (const [key, child] of Object.entries(value)) {
      if (SECRET_KEYS.has(key)) continue
      out[key] = stripSecrets(child, ancestors)
    }
  }
  ancestors.delete(value)
  return out
}

/** Express middleware: scrub secrets from every res.json() body. */
export const stripSecretsMiddleware = (_req, res, next) => {
  const json = res.json.bind(res)
  res.json = (body) => json(stripSecrets(body))
  next()
}
