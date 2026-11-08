import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import type { ListingType, PropertyQuery, SortOption } from '../lib/types'
import { useCategories, useProperties } from '../hooks/queries'
import { categoryName } from '../lib/format'
import { PropertyCard } from '../components/PropertyCard'
import { Pagination } from '../components/Pagination'
import { Drawer } from '../components/Modal'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui'

const PAGE_SIZE = 12
const ROOM_OPTIONS = [1, 2, 3, 4, 5]
const SORTS: SortOption[] = ['newest', 'price_asc', 'price_desc']
const FILTER_KEYS = ['city', 'category', 'type', 'minPrice', 'maxPrice', 'rooms'] as const

const positiveInt = (v: string | null) => (v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : undefined)
const nonNegative = (v: string | null) => (v && v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : undefined)

/** URL query → API query */
function parseQuery(sp: URLSearchParams): PropertyQuery {
  const type = sp.get('type')
  const sort = sp.get('sort') as SortOption | null
  return {
    page: positiveInt(sp.get('page')) ?? 1,
    limit: PAGE_SIZE,
    city: sp.get('city')?.trim() || undefined,
    category: sp.get('category') || undefined,
    type: type === 'SALE' || type === 'RENT' ? (type as ListingType) : undefined,
    minPrice: nonNegative(sp.get('minPrice')),
    maxPrice: nonNegative(sp.get('maxPrice')),
    rooms: positiveInt(sp.get('rooms')),
    sort: sort && SORTS.includes(sort) ? sort : 'newest',
  }
}

interface PanelProps {
  query: PropertyQuery
  setParams: (changes: Record<string, string | undefined>) => void
  onClear: () => void
  onApplied?: () => void
}

function FilterPanel({ query, setParams, onClear, onApplied }: PanelProps) {
  const { t } = useTranslation()
  const { data: categories } = useCategories()
  const [city, setCity] = useState(query.city ?? '')
  const [minPrice, setMinPrice] = useState(query.minPrice?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(query.maxPrice?.toString() ?? '')
  const [priceError, setPriceError] = useState(false)

  // URL o'zgarsa (Back/Forward, tozalash) draft qiymatlar ham yangilanadi
  useEffect(() => {
    setCity(query.city ?? '')
    setMinPrice(query.minPrice?.toString() ?? '')
    setMaxPrice(query.maxPrice?.toString() ?? '')
    setPriceError(false)
  }, [query.city, query.minPrice, query.maxPrice])

  const apply = (e: FormEvent) => {
    e.preventDefault()
    const min = minPrice === '' ? undefined : Number(minPrice)
    const max = maxPrice === '' ? undefined : Number(maxPrice)
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError(true)
      return
    }
    setPriceError(false)
    setParams({ city: city.trim() || undefined, minPrice: min?.toString(), maxPrice: max?.toString() })
    onApplied?.()
  }

  const sectionTitle = 'mb-3 text-sm font-semibold'
  return (
    <form onSubmit={apply} className="space-y-6" noValidate>
      <fieldset>
        <legend className={sectionTitle}>{t('filters.type')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {([undefined, 'SALE', 'RENT'] as const).map((type) => (
            <button
              key={type ?? 'all'}
              type="button"
              aria-pressed={query.type === type}
              className={`chip px-2 ${query.type === type ? 'chip-active' : ''}`}
              onClick={() => setParams({ type })}
            >
              {type ? t(`listingType.${type}`) : t('filters.all')}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="f-category" className="label">
          {t('filters.category')}
        </label>
        <select id="f-category" className="input" value={query.category ?? ''} onChange={(e) => setParams({ category: e.target.value || undefined })}>
          <option value="">{t('filters.allCategories')}</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {categoryName(c)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-city" className="label">
          {t('filters.citySearch')}
        </label>
        <input id="f-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('filters.cityPlaceholder')} />
      </div>

      <fieldset>
        <legend className={sectionTitle}>{t('filters.rooms')}</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!query.rooms} className={`chip ${!query.rooms ? 'chip-active' : ''}`} onClick={() => setParams({ rooms: undefined })}>
            {t('filters.all')}
          </button>
          {ROOM_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={query.rooms === n}
              className={`chip ${query.rooms === n ? 'chip-active' : ''}`}
              onClick={() => setParams({ rooms: String(n) })}
            >
              {t('property.roomsCount', { count: n })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={sectionTitle}>{t('filters.price')}</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="f-min" className="sr-only">
              {t('filters.minPrice')}
            </label>
            <input
              id="f-min"
              type="number"
              min={0}
              inputMode="numeric"
              className="input"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={t('filters.minPrice')}
              aria-invalid={priceError}
              aria-describedby={priceError ? 'f-price-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="f-max" className="sr-only">
              {t('filters.maxPrice')}
            </label>
            <input
              id="f-max"
              type="number"
              min={0}
              inputMode="numeric"
              className="input"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('filters.maxPrice')}
              aria-invalid={priceError}
              aria-describedby={priceError ? 'f-price-error' : undefined}
            />
          </div>
        </div>
        {priceError && (
          <p id="f-price-error" className="field-error" role="alert">
            {t('validation.priceRange')}
          </p>
        )}
      </fieldset>

      <div className="grid gap-2">
        <button type="submit" className="btn-primary">
          {t('filters.apply')}
        </button>
        <button type="button" className="btn-outline" onClick={onClear}>
          <RotateCcw className="size-4" aria-hidden />
          {t('filters.clear')}
        </button>
      </div>
    </form>
  )
}

export function CatalogPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseQuery(searchParams), [searchParams])
  const result = useProperties(query)
  const [drawerOpen, setDrawerOpen] = useState(false)

  /** Filtr o'zgarsa page=1 bo'ladi (page kalitini o'chiramiz) */
  const setParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  const clearAll = () => {
    const next = new URLSearchParams()
    const sort = searchParams.get('sort')
    if (sort) next.set('sort', sort)
    setSearchParams(next)
    setDrawerOpen(false)
  }

  const changePage = (page: number) => {
    setParams({ page: page > 1 ? String(page) : undefined })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCount = FILTER_KEYS.filter((k) => searchParams.get(k)).length
  const panelProps = { query, setParams, onClear: clearAll }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('catalog.title')}</h1>
          <p className="mt-1 text-muted" aria-live="polite">
            {result.data ? t('catalog.found', { count: result.data.total }) : ' '}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button type="button" className="btn-outline flex-1 lg:hidden" onClick={() => setDrawerOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden />
            {t('filters.title')}
            {activeCount > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-accent text-xs text-on-accent">{activeCount}</span>
            )}
          </button>
          <label className="relative flex flex-1 items-center sm:flex-none">
            <span className="sr-only">{t('sort.label')}</span>
            <ArrowUpDown className="pointer-events-none absolute start-3 size-4 text-muted" aria-hidden />
            <select className="input ps-9 sm:w-56" value={query.sort} onChange={(e) => setParams({ sort: e.target.value === 'newest' ? undefined : e.target.value })}>
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sort.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label={t('filters.title')}>
          <div className="card sticky top-20 p-5">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <SlidersHorizontal className="size-5" aria-hidden />
              {t('filters.title')}
            </h2>
            <FilterPanel {...panelProps} />
          </div>
        </aside>

        <section aria-label={t('catalog.results')} className="min-w-0">
          {result.isPending ? (
            <GridSkeleton />
          ) : result.isError ? (
            <ErrorState error={result.error} onRetry={() => void result.refetch()} />
          ) : result.data.items.length === 0 ? (
            <EmptyState
              title={t('catalog.empty')}
              text={activeCount > 0 ? t('catalog.emptyFiltered') : undefined}
              action={
                activeCount > 0 && (
                  <button type="button" className="btn-outline" onClick={clearAll}>
                    {t('filters.clear')}
                  </button>
                )
              }
            />
          ) : (
            <div className={result.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.data.items.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={changePage} />
            </div>
          )}
        </section>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t('filters.title')} side="start">
        <FilterPanel {...panelProps} onApplied={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}
