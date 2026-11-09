import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Inbox, Loader2, RotateCcw } from 'lucide-react'
import type { ListingType, PropertyStatus } from '../lib/types'
import { errorDetails, errorTitle } from '../lib/errors'

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />
}

export function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted" role="status">
      <Spinner className="size-6" />
      <span>{t('common.loading')}</span>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-6 w-2/5" />
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Inbox className="size-7" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  const details = errorDetails(error)
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center" role="alert">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">{errorTitle(error, t)}</h3>
      {details.length > 0 && <p className="mt-1 max-w-md text-sm text-muted">{details.join('. ')}</p>}
      {onRetry && (
        <button type="button" className="btn-outline mt-5" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden />
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function FormError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  if (!error) return null
  const details = errorDetails(error)
  return (
    <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger" role="alert">
      <p className="font-semibold">{errorTitle(error, t)}</p>
      {details.length > 0 && (
        <ul className="mt-1 list-disc ps-5">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ListingBadge({ type }: { type: ListingType }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">
      {t(`listingType.${type}`)}
    </span>
  )
}

export function StatusBadge({ status }: { status: PropertyStatus }) {
  const { t } = useTranslation()
  const styles: Record<PropertyStatus, string> = {
    PENDING: 'bg-warning-soft text-warning',
    APPROVED: 'bg-success-soft text-success',
    REJECTED: 'bg-danger-soft text-danger',
  }
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {t(`status.${status}`)}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
