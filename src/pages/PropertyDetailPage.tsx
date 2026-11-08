import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Bath, BedDouble, CalendarDays, ChevronLeft, ChevronRight, Mail, MapPin, Maximize2, Pencil, Phone, User } from 'lucide-react'
import type { Property } from '../lib/types'
import { ApiError, api, imageUrl } from '../lib/api'
import { categoryName, formatDate, formatNumber, formatPrice } from '../lib/format'
import { authUrl, saveIntent } from '../lib/returnTo'
import { useProperty, keys } from '../hooks/queries'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FavoriteButton, SmartImage } from '../components/PropertyCard'
import { Modal } from '../components/Modal'
import { ErrorState, FormError, ListingBadge, PageLoader, Spinner, StatusBadge } from '../components/ui'
import { NotFoundPage } from './StatusPages'

function Gallery({ property }: { property: Property }) {
  const { t } = useTranslation()
  const images = [...property.images].sort((a, b) => a.sortOrder - b.sortOrder)
  const [index, setIndex] = useState(0)
  const count = images.length
  const current = images[Math.min(index, count - 1)]
  const go = (d: number) => setIndex((i) => (i + d + count) % count)

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <SmartImage
          key={current?.id ?? 'none'}
          src={imageUrl(current?.url)}
          alt={current?.altText || property.title}
          className="aspect-[16/10] w-full"
        />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t('gallery.prev')} className="absolute start-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-fg shadow-card hover:text-accent">
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t('gallery.next')} className="absolute end-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-fg shadow-card hover:text-accent">
              <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <span className="absolute bottom-3 end-3 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-semibold" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('gallery.show', { n: i + 1 })}
              aria-current={i === index}
              className={`shrink-0 overflow-hidden rounded-xl border-2 ${i === index ? 'border-accent' : 'border-transparent'}`}
            >
              <SmartImage src={imageUrl(img.url)} alt="" className="h-16 w-24" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InquiryForm({ property, onDone }: { property: Property; onDone: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState(() => t(property.listingType === 'SALE' ? 'inquiry.defaultSale' : 'inquiry.defaultRent', { title: property.title }))
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState<'required' | 'max' | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.inquiries.create(property.id, { message: message.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.inquiries })
      toast(t('inquiry.success'))
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mutation.isPending) return // takroriy yuborishdan himoya
    if (!message.trim()) return setError('required')
    if (message.length > 1000) return setError('max')
    setError(null)
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center">
        <p className="rounded-xl bg-success-soft p-4 font-medium text-success" role="status">
          {t('inquiry.success')}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/cabinet/inquiries" className="btn-outline">
            {t('nav.myInquiries')}
          </Link>
          <button type="button" className="btn-primary" onClick={onDone}>
            {t('common.close')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-muted">{t('inquiry.hint')}</p>
      <div>
        <label htmlFor="inq-message" className="label">
          {t('inquiry.message')} *
        </label>
        <textarea
          id="inq-message"
          data-autofocus
          rows={5}
          maxLength={1000}
          className="input py-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="inq-count"
        />
        <div className="mt-1 flex justify-between gap-2 text-xs">
          <span className="text-danger" role="alert">
            {error === 'required' ? t('validation.required') : error === 'max' ? t('validation.maxLength', { max: 1000 }) : ''}
          </span>
          <span id="inq-count" className="text-muted">
            {message.length}/1000
          </span>
        </div>
      </div>
      <div>
        <label htmlFor="inq-phone" className="label">
          {t('fields.phone')} <span className="font-normal text-muted">({t('common.optional')})</span>
        </label>
        <input id="inq-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
      </div>
      <FormError error={mutation.error} />
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner className="size-4" /> : <Mail className="size-4" aria-hidden />}
          {t('inquiry.send')}
        </button>
      </div>
    </form>
  )
}

export function PropertyDetailPage() {
  const { t, i18n } = useTranslation()
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const { data: property, isPending, isError, error, refetch } = useProperty(id)
  const { user, status } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inquiryOpen, setInquiryOpen] = useState(false)

  const isOwner = !!user && !!property && user.id === property.ownerId
  const canInquire = property?.status === 'APPROVED' && !isOwner

  // Login'dan keyin ?inquiry=1 bilan qaytilsa murojaat formasi ochiladi (yuborilmaydi)
  useEffect(() => {
    if (searchParams.get('inquiry') === '1' && status === 'authenticated' && property && canInquire) {
      setInquiryOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('inquiry')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, status, property, canInquire, setSearchParams])

  if (!Number.isInteger(id) || id <= 0) return <NotFoundPage />
  if (isPending) return <PageLoader />
  if (isError) {
    if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    )
  }

  const interestLabel = property.listingType === 'SALE' ? t('detail.interestSale') : t('detail.interestRent')

  const onInterest = () => {
    if (status !== 'authenticated') {
      const returnTo = `/properties/${property.id}?inquiry=1`
      saveIntent({ propertyId: property.id, action: 'inquiry', returnTo })
      navigate(authUrl('register', returnTo, 'inquiry'))
      return
    }
    setInquiryOpen(true)
  }

  // Mehmon "Bog'lanish"ni bossa — ro'yxatdan o'tish, keyin shu e'longa qaytish
  const onContact = () => {
    if (status !== 'authenticated') {
      const returnTo = `/properties/${property.id}`
      saveIntent({ propertyId: property.id, action: 'contact', returnTo })
      navigate(authUrl('register', returnTo, 'contact'))
      return
    }
    setInquiryOpen(true)
  }

  const specs = [
    { icon: Maximize2, label: t('fields.area'), value: `${formatNumber(property.area, i18n.language)} ${t('property.sqm')}` },
    { icon: BedDouble, label: t('fields.rooms'), value: formatNumber(property.rooms, i18n.language) },
    { icon: Bath, label: t('fields.bathrooms'), value: formatNumber(property.bathrooms, i18n.language) },
  ]

  return (
    <div className="container-page py-6 sm:py-8">
      <Link to="/properties" className="btn-ghost -ms-3 mb-4">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('detail.back')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <Gallery property={property} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <ListingBadge type={property.listingType} />
            <span className="inline-flex items-center rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold">{categoryName(property.category)}</span>
            {property.status !== 'APPROVED' && <StatusBadge status={property.status} />}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight break-words sm:text-3xl">{property.title}</h1>
          <p className="mt-2 flex items-start gap-1.5 text-muted">
            <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              {property.city}, {property.address}
            </span>
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-3">
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-4">
                <Icon className="size-5 text-accent" aria-hidden />
                <dt className="mt-2 text-xs text-muted">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{t('fields.description')}</h2>
            <p className="whitespace-pre-line break-words text-muted">{property.description}</p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-sm text-muted">{t('fields.price')}</p>
            <p className="mt-1 text-3xl font-bold break-words text-accent">{formatPrice(property.price, property.currency, i18n.language)}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <CalendarDays className="size-4" aria-hidden />
              {t('detail.published', { date: formatDate(property.createdAt, i18n.language) })}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {isOwner ? (
                <div className="flex-1 space-y-3">
                  <p className="rounded-xl bg-accent-soft p-3 text-sm">{t('detail.ownListing')}</p>
                  <Link to={`/cabinet/properties/${property.id}/edit`} className="btn-outline w-full">
                    <Pencil className="size-4" aria-hidden />
                    {t('common.edit')}
                  </Link>
                </div>
              ) : canInquire ? (
                <>
                  <button type="button" className="btn-primary min-w-0 flex-1" onClick={onInterest}>
                    <Mail className="size-4 shrink-0" aria-hidden />
                    {interestLabel}
                  </button>
                  <FavoriteButton propertyId={property.id} className="rounded-xl" />
                  {/* Bog'lanish: mehmon — ro'yxatdan o'tishga, foydalanuvchi — qo'ng'iroq yoki murojaat */}
                  {status === 'authenticated' && property.owner?.phone ? (
                    <a href={`tel:${property.owner.phone.replace(/\s/g, '')}`} className="btn-outline w-full">
                      <Phone className="size-4" aria-hidden />
                      {t('detail.contact')}
                    </a>
                  ) : (
                    <button type="button" className="btn-outline w-full" onClick={onContact}>
                      <Phone className="size-4" aria-hidden />
                      {t('detail.contact')}
                    </button>
                  )}
                </>
              ) : null}
            </div>
            {status === 'guest' && canInquire && <p className="mt-3 text-xs text-muted">{t('detail.guestHint')}</p>}
          </div>

          {property.owner && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-muted">{t('detail.owner')}</h2>
              <p className="flex items-center gap-2 font-semibold">
                <User className="size-5 text-accent" aria-hidden />
                <span className="break-words">{property.owner.fullName}</span>
              </p>
              {property.owner.phone && status === 'authenticated' ? (
                <a href={`tel:${property.owner.phone.replace(/\s/g, '')}`} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm hover:text-accent">
                  <Phone className="size-4" aria-hidden />
                  {property.owner.phone}
                </a>
              ) : property.owner.phone ? (
                <p className="mt-2 text-sm text-muted">{t('detail.phoneHidden')}</p>
              ) : null}
            </div>
          )}
        </aside>
      </div>

      <Modal open={inquiryOpen} onClose={() => setInquiryOpen(false)} title={interestLabel}>
        <InquiryForm property={property} onDone={() => setInquiryOpen(false)} />
      </Modal>
    </div>
  )
}
