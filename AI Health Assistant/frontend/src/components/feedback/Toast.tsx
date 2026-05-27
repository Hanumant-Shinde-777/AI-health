import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react'

interface ToastItem {
  id: number
  message: string
  onDismiss?: () => void
}

interface ToastContextValue {
  showToast: (message: string) => void
  showSequentialToasts: (messages: string[]) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 3000

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, number>>(new Map())

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((current) => {
      const target = current.find((toast) => toast.id === id)
      target?.onDismiss?.()
      return current.filter((toast) => toast.id !== id)
    })
  }, [])

  const showOne = useCallback(
    (messages: string[], index: number) => {
      if (index >= messages.length) {
        return
      }
      const id = Date.now() + index
      const advance = () => {
        dismissToast(id)
        window.setTimeout(() => showOne(messages, index + 1), 200)
      }
      setToasts([{ id, message: messages[index], onDismiss: advance }])
      const timer = window.setTimeout(advance, AUTO_DISMISS_MS)
      timersRef.current.set(id, timer)
    },
    [dismissToast],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast: (message: string) => {
        const id = Date.now()
        setToasts((current) => [...current, { id, message }])
        const timer = window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
        timersRef.current.set(id, timer)
      },
      showSequentialToasts: (messages: string[]) => {
        if (!messages.length) return
        showOne(messages, 0)
      },
    }),
    [dismissToast, showOne],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-4 z-50 flex w-full max-w-[430px] -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="pointer-events-auto rounded-xl bg-slate-900 px-4 py-3 text-center text-sm text-white shadow-lg"
          >
            {toast.message}
          </button>
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
