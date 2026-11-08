import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  const base = 'inline-flex size-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors'
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={t('pagination.label')}>
      <button
        type="button"
        className={`${base} border-line bg-surface hover:border-accent disabled:opacity-50`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('pagination.prev')}
      >
        <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={t('pagination.page', { page: p })}
            className={`${base} ${p === page ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface hover:border-accent'}`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${base} border-line bg-surface hover:border-accent disabled:opacity-50`}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t('pagination.next')}
      >
        <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
      </button>
    </nav>
  )
}
