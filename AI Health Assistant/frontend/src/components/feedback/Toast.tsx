import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { Info } from 'lucide-react'
import axios from 'axios'
import i18n from '@/i18n/i18n'
import { getApiErrorMessage } from '@/services/fallbackPolicy'

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast: (message: string) => {
        const id = Date.now() + Math.random()
        setToasts((current) => [...current, { id, message }])
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }, 3000)
      },
    }),
    [],
  )

  // Safety net: an awaited API call that nobody caught (e.g. a save button handler) would
  // otherwise fail silently. Surface API failures as a toast instead.
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      if (!axios.isAxiosError(reason) || axios.isCancel(reason)) return
      // 401s are handled by the API client (session cleared + redirect to login)
      if (reason.response?.status === 401) return
      value.showToast(getApiErrorMessage(reason, i18n.t('network.requestFailed', 'Something went wrong. Please try again.')))
    }
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', onUnhandledRejection)
  }, [value])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 print:hidden flex w-full max-w-[430px] -translate-x-1/2 flex-col gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-3 rounded-app border border-border bg-surface/95 px-4 py-3 text-sm text-foreground shadow-float backdrop-blur-md animate-toast-in"
          >
            <Info size={18} className="mt-0.5 shrink-0 text-primary" />
            <span className="flex-1 leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const Toast = () => null

export default Toast
