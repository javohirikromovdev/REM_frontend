import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BedDouble, Building2, Heart, MapPin, Maximize2 } from 'lucide-react'
import type { Property } from '../lib/types'
import { imageUrl } from '../lib/api'
import { formatNumber, formatPrice } from '../lib/format'
import { useToggleFavorite } from '../hooks/queries'
import { ListingBadge } from './ui'

/** Rasm yuklanmasa yoki yo'q bo'lsa fallback ko'rsatadi */
export function SmartImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-surface-2 text-muted ${className}`} role="img" aria-label={alt}>
        <Building2 className="size-12 opacity-60" aria-hidden />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

export function firstImage(p: Property) {
  const sorted = [...(p.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  return imageUrl(sorted[0]?.url)
}

export function FavoriteButton({ propertyId, className = '' }: { propertyId: number; className?: string }) {
  const { t } = useTranslation()
  const fav = useToggleFavorite()
  const saved = fav.isSaved(propertyId)
  return (
    <button
      type="button"
      onClick={() => fav.toggle(propertyId)}
      disabled={fav.isPending(propertyId)}
      aria-pressed={saved}
      aria-label={saved ? t('favorites.remove') : t('favorites.add')}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface/90 text-fg backdrop-blur transition-colors hover:text-accent disabled:opacity-60 ${className}`}
    >
      <Heart className={`size-5 ${saved ? 'fill-accent text-accent' : ''}`} aria-hidden />
    </button>
  )
}

export function PropertyCard({ property }: { property: Property }) {
  const { t, i18n } = useTranslation()
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative">
        <SmartImage src={firstImage(property)} alt={property.title} className="aspect-[4/3] w-full" />
        <div className="absolute start-3 top-3">
          <ListingBadge type={property.listingType} />
        </div>
        {/* Yurakcha kartochka havolasidan alohida ishlaydi */}
        <FavoriteButton propertyId={property.id} className="absolute end-3 top-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold">
          <Link to={`/properties/${property.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {property.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {property.city}, {property.address}
          </span>
        </p>
        <p className="mb-4 mt-3 text-xl font-bold text-accent">
          {formatPrice(property.price, property.currency, i18n.language)}
        </p>
        <div className="mt-auto flex items-center gap-4 border-t border-line pt-3 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-4" aria-hidden />
            {t('property.roomsCount', { count: property.rooms })}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize2 className="size-4" aria-hidden />
            {formatNumber(property.area, i18n.language)} {t('property.sqm')}
          </span>
        </div>
      </div>
    </article>
  )
}
