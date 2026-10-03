// Baseline security headers for a JSON API (dependency-free subset of helmet).
// CSP / CORP are deliberately omitted: the API also serves prescription PDFs and may be
// called from a different domain than the frontend.
export const securityHeaders = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
}
