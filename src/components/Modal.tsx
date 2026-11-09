import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function useFocusTrap(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const node = ref.current
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
      if (e.key === 'Tab' && node) {
        const els = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (els.length === 0) return
        const firstEl = els[0]
        const lastEl = els[els.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [open])

  return ref
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  const { t } = useTranslation()
  const ref = useFocusTrap(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card relative max-h-[92vh] w-full overflow-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="icon-btn -m-2" onClick={onClose} aria-label={t('common.close')}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({ open, onClose, title, children, side = 'end' }: Props & { side?: 'start' | 'end' }) {
  const { t } = useTranslation()
  const ref = useFocusTrap(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 flex w-[min(22rem,88vw)] flex-col border-line bg-surface shadow-card ${
          side === 'end' ? 'end-0 border-s' : 'start-0 border-e'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-muted">{text}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onClose} data-autofocus>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
