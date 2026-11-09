import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Heart, MessageSquare, Pencil, Plus, Shield, Trash2, User } from 'lucide-react'
import { api } from '../../lib/api'
import { categoryName, formatDate, formatPrice } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useFavorites, useMyInquiries, useMyProperties } from '../../hooks/queries'
import { PropertyCard, SmartImage, firstImage } from '../../components/PropertyCard'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/Modal'
import { EmptyState, ErrorState, FormError, GridSkeleton, PageHeader, PageLoader, Spinner, StatusBadge } from '../../components/ui'
import { errorTitle } from '../../lib/errors'

export function CabinetLayout() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const links = [
    { to: '/cabinet', label: t('nav.profile'), icon: User, end: true },
    { to: '/cabinet/properties', label: t('nav.myListings'), icon: FileText, end: false },
    { to: '/cabinet/inquiries', label: t('nav.myInquiries'), icon: MessageSquare, end: false },
    { to: '/favorites', label: t('nav.favorites'), icon: Heart, end: false },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: t('nav.admin'), icon: Shield, end: false }] : []),
  ]
  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label={t('nav.cabinet')} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-2 lg:card lg:flex-col lg:p-2">
            {links.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium whitespace-nowrap lg:border-transparent ${
                      isActive ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-fg hover:bg-surface-2 lg:bg-transparent'
                    }`
                  }
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.users
      .me()
      .then((me) => setUser(me))
      .catch(() => undefined)
  }, [setUser])

  const mutation = useMutation({
    mutationFn: () => api.users.updateMe({ fullName: fullName.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) }),
    onSuccess: (updated) => {
      setUser(updated)
      toast(t('profile.saved'))
    },
  })

  if (!user) return <PageLoader />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return setError('validation.required')
    setError(null)
    mutation.mutate()
  }

  return (
    <>
      <PageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} />
      <div className="card p-5 sm:p-6">
        <dl className="mb-6 grid gap-4 border-b border-line pb-6 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs text-muted">{t('fields.email')}</dt>
            <dd className="break-words font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t('profile.role')}</dt>
            <dd className="font-medium">{t(`roles.${user.role}`)}</dd>
          </div>
          {user.createdAt && (
            <div>
              <dt className="text-xs text-muted">{t('profile.memberSince')}</dt>
              <dd className="font-medium">{formatDate(user.createdAt, i18n.language)}</dd>
            </div>
          )}
        </dl>
        <form onSubmit={submit} className="grid max-w-xl gap-4" noValidate>
          <div>
            <label htmlFor="p-name" className="label">
              {t('fields.fullName')}
            </label>
            <input id="p-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!error} />
            {error && <p className="field-error">{t(error)}</p>}
          </div>
          <div>
            <label htmlFor="p-phone" className="label">
              {t('fields.phone')} <span className="font-normal text-muted">({t('common.optional')})</span>
            </label>
            <input id="p-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
            <p className="mt-1 text-xs text-muted">{t('profile.phoneHint')}</p>
          </div>
          <FormError error={mutation.error} />
          <div>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner className="size-4" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export function MyPropertiesPage() {
  const { t, i18n } = useTranslation()
  const [sp, setSp] = useSearchParams()
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const result = useMyProperties(page)
  const queryClient = useQueryClient()
  const toast = useToast()
  const [toDelete, setToDelete] = useState<{ id: number; title: string } | null>(null)

  const del = useMutation({
    mutationFn: (id: number) => api.properties.remove(id),
    onSuccess: () => {
      toast(t('seller.deleted'))
      setToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['my-properties'] })
      void queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
    onError: (err) => toast(errorTitle(err, t), 'error'),
  })

  return (
    <>
      <PageHeader
        title={t('nav.myListings')}
        subtitle={t('seller.subtitle')}
        action={
          <Link to="/cabinet/properties/new" className="btn-primary">
            <Plus className="size-4" aria-hidden />
            {t('nav.postAd')}
          </Link>
        }
      />
      {result.isPending ? (
        <PageLoader />
      ) : result.isError ? (
        <ErrorState error={result.error} onRetry={() => void result.refetch()} />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          title={t('seller.empty')}
          action={
            <Link to="/cabinet/properties/new" className="btn-primary">
              {t('nav.postAd')}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {result.data.items.map((p) => (
              <li key={p.id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
                <SmartImage src={firstImage(p)} alt={p.title} className="aspect-[4/3] w-full shrink-0 rounded-xl sm:w-36" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-muted">
                      {t(`listingType.${p.listingType}`)} · {categoryName(p.category)}
                    </span>
                  </div>
                  <Link to={`/properties/${p.id}`} className="mt-1 block font-semibold break-words hover:text-accent">
                    {p.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {p.city} · {formatPrice(p.price, p.currency, i18n.language)}
                  </p>
                  {p.status !== 'APPROVED' && <p className="mt-1 text-xs text-muted">{t(`seller.statusHint.${p.status}`)}</p>}
                </div>
                <div className="flex gap-2">
                  <Link to={`/cabinet/properties/${p.id}/edit`} className="btn-outline flex-1 sm:flex-none">
                    <Pencil className="size-4" aria-hidden />
                    {t('common.edit')}
                  </Link>
                  <button type="button" className="btn-outline flex-1 text-danger sm:flex-none" onClick={() => setToDelete({ id: p.id, title: p.title })}>
                    <Trash2 className="size-4" aria-hidden />
                    {t('common.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={(p) => setSp(p > 1 ? { page: String(p) } : {})} />
        </>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title={t('seller.deleteTitle')}
        text={t('seller.deleteText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
      />
    </>
  )
}

export function MyInquiriesPage() {
  const { t, i18n } = useTranslation()
  const result = useMyInquiries()
  return (
    <>
      <PageHeader title={t('nav.myInquiries')} subtitle={t('inquiries.subtitle')} />
      {result.isPending ? (
        <PageLoader />
      ) : result.isError ? (
        <ErrorState error={result.error} onRetry={() => void result.refetch()} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title={t('inquiries.empty')}
          action={
            <Link to="/properties" className="btn-primary">
              {t('nav.listings')}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {result.data.map((inq) => (
            <li key={inq.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link to={`/properties/${inq.property.id}`} className="font-semibold break-words hover:text-accent">
                  {inq.property.title}
                </Link>
                <time className="text-xs text-muted" dateTime={inq.createdAt}>
                  {formatDate(inq.createdAt, i18n.language)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line break-words text-sm text-muted">{inq.message}</p>
              {inq.phone && (
                <p className="mt-2 text-xs text-muted">
                  {t('fields.phone')}: {inq.phone}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function FavoritesPage() {
  const { t } = useTranslation()
  const result = useFavorites()
  return (
    <div className="container-page py-8">
      <PageHeader title={t('nav.favorites')} subtitle={t('favorites.subtitle')} />
      {result.isPending ? (
        <GridSkeleton count={3} />
      ) : result.isError ? (
        <ErrorState error={result.error} onRetry={() => void result.refetch()} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title={t('favorites.empty')}
          text={t('favorites.emptyText')}
          action={
            <Link to="/properties" className="btn-primary">
              {t('nav.listings')}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((f) => (
            <PropertyCard key={f.id} property={f.property} />
          ))}
        </div>
      )}
    </div>
  )
}

