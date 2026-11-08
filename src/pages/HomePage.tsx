import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Briefcase, Building, Home, LandPlot, LayoutGrid, MapPin, Search, Tag, Wallet } from 'lucide-react'
import type { ListingType } from '../lib/types'
import { useCategories, useProperties } from '../hooks/queries'
import { categoryName } from '../lib/format'
import { PropertyCard } from '../components/PropertyCard'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui'

// Hero slaydlari: dekorativ rasm (Unsplash) + har biriga o'z sarlavhasi. Rasm yuklanmasa gradient fon qoladi.
const HERO_SLIDES = [
  { image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=75', key: 'slide1' },
  { image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=75', key: 'slide2' },
  { image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=75', key: 'slide3' },
]
const HERO_INTERVAL = 3000 // 3 soniya
const SWIPE_THRESHOLD = 50 // px

/** Butun heroni qoplaydigan, avtomatik va swipe bilan almashadigan slayder */
function HeroSlider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const startX = useRef<number | null>(null)
  const count = HERO_SLIDES.length
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const go = (index: number) => setActive(((index % count) + count) % count)

  // Har slayd o'zgarganda taymer qaytadan boshlanadi (qo'lda almashtirilganda ham)
  useEffect(() => {
    if (reducedMotion || paused) return
    const id = window.setTimeout(() => setActive((i) => (i + 1) % count), HERO_INTERVAL)
    return () => window.clearTimeout(id)
  }, [active, paused, reducedMotion, count])

  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest('input, select, textarea, button, a, form')

  const onPointerDown = (e: React.PointerEvent) => {
    if (isInteractive(e.target)) return
    startX.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    const rtl = document.documentElement.dir === 'rtl'
    go(active + ((dx < 0) !== rtl ? 1 : -1))
  }

  const track = `flex h-full ${reducedMotion ? '' : 'transition-transform duration-700 ease-out'}`
  const offset = { transform: `translateX(-${active * 100}%)` }

  return (
    <section
      className="relative touch-pan-y overflow-hidden border-b border-line bg-[linear-gradient(135deg,var(--hero-from),var(--hero-to))] select-none"
      aria-roledescription="carousel"
      aria-label={t('hero.carousel')}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (startX.current = null)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Rasm butun hero bo'ylab yoyiladi va chapga suriladi */}
      <div className="absolute inset-0" aria-hidden>
        <div className={track} style={offset}>
          {HERO_SLIDES.map((s) => (
            <div key={s.key} className="relative h-full w-full shrink-0">
              <img
                src={s.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Matn o'qilishi uchun qoplama */}
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,var(--hero-from)_0%,color-mix(in_srgb,var(--hero-from)_75%,transparent)_45%,color-mix(in_srgb,var(--hero-from)_15%,transparent)_100%)] max-md:bg-[color-mix(in_srgb,var(--hero-from)_72%,transparent)]"
        aria-hidden
      />

      <div className="container-page relative py-12 sm:py-16 lg:py-20">
        {/* Slayd matnlari ham rasm bilan birga suriladi */}
        <div className="max-w-2xl overflow-hidden" aria-live={paused ? 'polite' : 'off'}>
          <div className={track} style={offset}>
            {HERO_SLIDES.map((s, i) => (
              <div
                key={s.key}
                className="w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={t('hero.slideOf', { n: i + 1, total: count })}
                aria-hidden={i !== active}
              >
                {i === 0 ? (
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">{t(`hero.${s.key}Title`)}</h1>
                ) : (
                  <p className="text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">{t(`hero.${s.key}Title`)}</p>
                )}
                <p className="mt-3 text-lg text-muted">{t(`hero.${s.key}Text`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1" role="group" aria-label={t('hero.carousel')}>
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              aria-label={t('hero.goTo', { n: i + 1 })}
              aria-current={i === active}
              className="group inline-flex h-11 items-center px-1"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-accent' : 'w-3 bg-muted/50 group-hover:bg-muted'}`} />
            </button>
          ))}
        </div>

        <div className="mt-6 max-w-5xl">{children}</div>
      </div>
    </section>
  )
}

const CATEGORY_ICONS: Record<string, typeof Home> = { kvartira: Building, uy: Home, ofis: Briefcase, yer: LandPlot }

export function TypeTabs({ value, onChange }: { value: ListingType; onChange: (v: ListingType) => void }) {
  const { t } = useTranslation()
  return (
    <div className="inline-grid grid-cols-2 rounded-xl border border-line bg-surface p-1" role="group" aria-label={t('filters.type')}>
      {(['SALE', 'RENT'] as ListingType[]).map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={value === type}
          onClick={() => onChange(type)}
          className={`min-h-11 rounded-lg px-6 text-sm font-semibold transition-colors ${value === type ? 'bg-accent text-on-accent' : 'text-fg hover:bg-surface-2'}`}
        >
          {type === 'SALE' ? t('hero.buy') : t('hero.rent')}
        </button>
      ))}
    </div>
  )
}

function HeroSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const [type, setType] = useState<ListingType>('SALE')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const sp = new URLSearchParams({ type })
    if (city.trim()) sp.set('city', city.trim())
    if (category) sp.set('category', category)
    if (maxPrice && Number(maxPrice) > 0) sp.set('maxPrice', String(Number(maxPrice)))
    navigate(`/properties?${sp}`)
  }

  const fieldWrap = 'flex min-w-0 flex-1 items-center gap-3 px-3 py-2'
  return (
    <div className="space-y-4">
      <TypeTabs value={type} onChange={setType} />
      <form onSubmit={submit} className="card flex flex-col gap-1 p-2 md:flex-row md:items-center md:divide-x md:divide-line rtl:md:divide-x-reverse">
        <label className={fieldWrap}>
          <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-muted">{t('filters.city')}</span>
            <input
              className="w-full bg-transparent text-sm font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:outline-none"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('filters.cityPlaceholder')}
            />
          </span>
        </label>
        <label className={fieldWrap}>
          <Tag className="size-5 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-muted">{t('filters.category')}</span>
            <select
              className="w-full bg-transparent text-sm font-semibold text-fg focus:outline-none [&>option]:bg-surface"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t('filters.allCategories')}</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.slug}>
                  {categoryName(c)}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className={fieldWrap}>
          <Wallet className="size-5 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-muted">{t('filters.maxPrice')}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="w-full bg-transparent text-sm font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:outline-none"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('filters.anyPrice')}
            />
          </span>
        </label>
        <div className="p-1 md:ps-3">
          <button type="submit" className="btn-primary w-full md:w-auto md:px-6">
            <Search className="size-5" aria-hidden />
            {t('common.search')}
          </button>
        </div>
      </form>
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const categories = useCategories()
  const latest = useProperties({ limit: 6, sort: 'newest' })

  return (
    <>
      <HeroSlider>
        <HeroSearch />
      </HeroSlider>

      <section className="container-page mt-12" aria-labelledby="sections-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="sections-title" className="text-2xl font-bold">
            {t('home.sections')}
          </h2>
        </div>
        {categories.isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
        ) : categories.isError ? (
          <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
        ) : categories.data.length === 0 ? (
          <EmptyState title={t('home.noSections')} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.data.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug] ?? LayoutGrid
              return (
                <Link
                  key={c.id}
                  to={`/properties?category=${encodeURIComponent(c.slug)}`}
                  className="card flex min-h-24 items-center gap-3 p-4 transition-colors hover:border-accent"
                >
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 break-words font-semibold">{categoryName(c)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="container-page mt-12" aria-labelledby="latest-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 id="latest-title" className="text-2xl font-bold">
            {t('home.latest')}
          </h2>
          <Link to="/properties" className="btn-ghost text-accent">
            {t('home.viewAll')}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
        {latest.isPending ? (
          <GridSkeleton count={3} />
        ) : latest.isError ? (
          <ErrorState error={latest.error} onRetry={() => void latest.refetch()} />
        ) : latest.data.items.length === 0 ? (
          <EmptyState title={t('catalog.empty')} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {latest.data.items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
