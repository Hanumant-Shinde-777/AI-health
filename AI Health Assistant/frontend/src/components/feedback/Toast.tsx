import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import { Info } from 'lucide-react'

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
        const id = Date.now()
        setToasts((current) => [...current, { id, message }])
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }, 3000)
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 flex w-full max-w-[430px] -translate-x-1/2 flex-col gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-3 rounded-app border border-border bg-surface/95 px-4 py-3 text-sm text-foreground shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md animate-toast-in"
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
