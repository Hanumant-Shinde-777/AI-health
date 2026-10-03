import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/** A lazy chunk that 404s after a redeploy surfaces as one of these messages. */
const isChunkLoadError = (error: unknown) =>
  error instanceof Error &&
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error.message,
  )

/** Router-level error screen: replaces React Router's default stack-trace page. */
const RouteErrorPage = () => {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthenticated, role } = useAuth()
  const homePath = !isAuthenticated ? '/' : role === 'DOCTOR' ? '/doctor-dashboard' : '/home'
  const chunkError = isChunkLoadError(error)
  const notFound = isRouteErrorResponse(error) && error.status === 404

  if (import.meta.env.DEV) {
    console.error('[RouteError]', error)
  }

  const title = chunkError
    ? t('errors.updateTitle', 'A new version is available')
    : notFound
      ? t('errors.notFoundTitle', 'Page not found')
      : t('errors.genericTitle', 'Something went wrong')
  const body = chunkError
    ? t('errors.updateBody', 'Reload the page to get the latest version of the app.')
    : notFound
      ? t('errors.notFoundBody', "The page you're looking for doesn't exist.")
      : t('errors.genericBody', 'An unexpected error occurred. Please try again.')

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/15 text-danger">
        <AlertTriangle size={30} />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        <button type="button" className="btn-secondary" onClick={() => navigate(homePath, { replace: true })}>
          <span className="flex items-center gap-2">
            <Home size={16} />
            {t('errors.goHome', 'Home')}
          </span>
        </button>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          <span className="flex items-center gap-2">
            <RotateCcw size={16} />
            {t('errors.reload', 'Reload')}
          </span>
        </button>
      </div>
    </div>
  )
}

export default RouteErrorPage
