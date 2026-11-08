import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = (id: number) => setToasts((list) => list.filter((x) => x.id !== id))

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list.slice(-3), { id, kind, message }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [])

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
  const colors = {
    success: 'border-success/40 text-success',
    error: 'border-danger/40 text-danger',
    info: 'border-accent/40 text-accent',
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.kind]
          return (
            <div
              key={toast.id}
              className={`card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3 ${colors[toast.kind]}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm text-fg">{toast.message}</p>
              <button
                type="button"
                className="-m-1 inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                onClick={() => dismiss(toast.id)}
                aria-label={t('common.close')}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
