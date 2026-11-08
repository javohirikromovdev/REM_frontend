import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Category, PropertyStatus } from '../../lib/types'
import { api } from '../../lib/api'
import { categoryName, formatDate, formatPrice } from '../../lib/format'
import { errorTitle } from '../../lib/errors'
import { useToast } from '../../context/ToastContext'
import { keys, useAdminProperties, useAdminUsers, useCategories } from '../../hooks/queries'
import { SmartImage, firstImage } from '../../components/PropertyCard'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog, Modal } from '../../components/Modal'
import { EmptyState, ErrorState, FormError, PageHeader, PageLoader, Spinner, StatusBadge } from '../../components/ui'

export function AdminLayout() {
  const { t } = useTranslation()
  const tabs = [
    { to: '/admin', label: t('admin.moderation'), end: true },
    { to: '/admin/users', label: t('admin.users'), end: false },
    { to: '/admin/categories', label: t('admin.categories'), end: false },
  ]
  return (
    <div className="container-page py-8">
      <PageHeader title={t('nav.admin')} subtitle={t('admin.subtitle')} />
      <nav aria-label={t('nav.admin')} className="-mx-4 mb-6 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {tabs.map((tab) => (
            <li key={tab.to} className="shrink-0">
              <NavLink to={tab.to} end={tab.end} className={({ isActive }) => `chip whitespace-nowrap ${isActive ? 'chip-active' : ''}`}>
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}

const STATUSES: PropertyStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

export function AdminPropertiesPage() {
  const { t, i18n } = useTranslation()
  const [sp, setSp] = useSearchParams()
  const statusParam = sp.get('status') as PropertyStatus | null
  const status: PropertyStatus = statusParam && STATUSES.includes(statusParam) ? statusParam : 'PENDING'
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const result = useAdminProperties(status, page)
  const queryClient = useQueryClient()
  const toast = useToast()

  const setStatus = useMutation({
    mutationFn: ({ id, next }: { id: number; next: 'APPROVED' | 'REJECTED' }) => api.admin.setStatus(id, next),
    onSuccess: (_, { next }) => {
      toast(next === 'APPROVED' ? t('admin.approved') : t('admin.rejected'))
      void queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
      void queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
    onError: (err) => toast(errorTitle(err, t), 'error'),
  })

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t('admin.statusFilter')}>
        {STATUSES.map((s) => (
          <button key={s} type="button" aria-pressed={s === status} className={`chip ${s === status ? 'chip-active' : ''}`} onClick={() => setSp(s === 'PENDING' ? {} : { status: s })}>
            {t(`status.${s}`)}
          </button>
        ))}
      </div>
      {result.isPending ? (
        <PageLoader />
      ) : result.isError ? (
        <ErrorState error={result.error} onRetry={() => void result.refetch()} />
      ) : result.data.items.length === 0 ? (
        <EmptyState title={t('admin.noProperties')} />
      ) : (
        <>
          <ul className="space-y-3">
            {result.data.items.map((p) => {
              const busy = setStatus.isPending && setStatus.variables?.id === p.id
              return (
                <li key={p.id} className="card flex flex-col gap-4 p-3 md:flex-row md:items-center">
                  <SmartImage src={firstImage(p)} alt={p.title} className="aspect-[4/3] w-full shrink-0 rounded-xl md:w-40" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-muted">
                        {t(`listingType.${p.listingType}`)} · {categoryName(p.category)} · {formatDate(p.createdAt, i18n.language)}
                      </span>
                    </div>
                    <Link to={`/properties/${p.id}`} className="mt-1 block font-semibold break-words hover:text-accent">
                      {p.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {p.city}, {p.address} · {formatPrice(p.price, p.currency, i18n.language)}
                    </p>
                    {p.owner && (
                      <p className="mt-1 text-xs break-words text-muted">
                        {t('detail.owner')}: {p.owner.fullName} · {p.owner.email} {p.owner.phone && `· ${p.owner.phone}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {p.status !== 'APPROVED' && (
                      <button type="button" className="btn-primary flex-1 md:flex-none" disabled={busy} onClick={() => setStatus.mutate({ id: p.id, next: 'APPROVED' })}>
                        <Check className="size-4" aria-hidden />
                        {t('admin.approve')}
                      </button>
                    )}
                    {p.status !== 'REJECTED' && (
                      <button type="button" className="btn-outline flex-1 text-danger md:flex-none" disabled={busy} onClick={() => setStatus.mutate({ id: p.id, next: 'REJECTED' })}>
                        <X className="size-4" aria-hidden />
                        {t('admin.reject')}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination
            page={result.data.page}
            totalPages={result.data.totalPages}
            onChange={(p) => {
              const next = new URLSearchParams(sp)
              if (p > 1) next.set('page', String(p))
              else next.delete('page')
              setSp(next)
            }}
          />
        </>
      )}
    </>
  )
}

export function AdminUsersPage() {
  const { t, i18n } = useTranslation()
  const result = useAdminUsers()
  if (result.isPending) return <PageLoader />
  if (result.isError) return <ErrorState error={result.error} onRetry={() => void result.refetch()} />
  if (result.data.length === 0) return <EmptyState title={t('admin.noUsers')} />
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-start text-sm">
        <thead className="border-b border-line bg-surface-2 text-xs text-muted">
          <tr>
            <th className="p-3 text-start font-semibold">ID</th>
            <th className="p-3 text-start font-semibold">{t('fields.fullName')}</th>
            <th className="p-3 text-start font-semibold">{t('fields.email')}</th>
            <th className="p-3 text-start font-semibold">{t('fields.phone')}</th>
            <th className="p-3 text-start font-semibold">{t('profile.role')}</th>
            <th className="p-3 text-start font-semibold">{t('admin.registeredAt')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {result.data.map((u) => (
            <tr key={u.id}>
              <td className="p-3 text-muted">{u.id}</td>
              <td className="p-3 font-medium">{u.fullName}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3 text-muted">{u.phone ?? '—'}</td>
              <td className="p-3">
                <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-accent-soft text-accent' : 'bg-surface-2'}`}>{t(`roles.${u.role}`)}</span>
              </td>
              <td className="p-3 text-muted">{formatDate(u.createdAt, i18n.language)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoryForm({ initial, onDone }: { initial: Category | null; onDone: () => void }) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => (initial ? api.categories.update(initial.id, { name: name.trim(), slug: slug.trim() }) : api.categories.create({ name: name.trim(), slug: slug.trim() })),
    onSuccess: () => {
      toast(t('common.saved'))
      void queryClient.invalidateQueries({ queryKey: keys.categories })
      onDone()
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mutation.isPending) return
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'validation.required'
    if (!slug.trim()) next.slug = 'validation.required'
    else if (!/^[a-z0-9-]+$/.test(slug.trim())) next.slug = 'validation.slug'
    setErrors(next)
    if (Object.keys(next).length === 0) mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="cat-name" className="label">
          {t('admin.categoryName')}
        </label>
        <input id="cat-name" data-autofocus className="input" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        {errors.name && <p className="field-error">{t(errors.name)}</p>}
      </div>
      <div>
        <label htmlFor="cat-slug" className="label">
          Slug
        </label>
        <input id="cat-slug" className="input font-mono" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="kvartira" aria-invalid={!!errors.slug} aria-describedby="cat-slug-hint" />
        <p id="cat-slug-hint" className={errors.slug ? 'field-error' : 'mt-1 text-xs text-muted'}>
          {t('validation.slug')}
        </p>
      </div>
      <FormError error={mutation.error} />
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner className="size-4" />}
          {t('common.save')}
        </button>
      </div>
    </form>
  )
}

export function AdminCategoriesPage() {
  const { t } = useTranslation()
  const result = useCategories()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const del = useMutation({
    mutationFn: (id: number) => api.categories.remove(id),
    onSuccess: () => {
      toast(t('admin.categoryDeleted'))
      setToDelete(null)
      void queryClient.invalidateQueries({ queryKey: keys.categories })
    },
    onError: (err) => {
      setToDelete(null)
      toast(`${errorTitle(err, t)}`, 'error')
    },
  })

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          <Plus className="size-4" aria-hidden />
          {t('admin.addCategory')}
        </button>
      </div>
      {result.isPending ? (
        <PageLoader />
      ) : result.isError ? (
        <ErrorState error={result.error} onRetry={() => void result.refetch()} />
      ) : result.data.length === 0 ? (
        <EmptyState title={t('home.noSections')} />
      ) : (
        <ul className="card divide-y divide-line">
          {result.data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-words">{c.name}</p>
                <p className="text-xs text-muted">
                  <span className="font-mono">{c.slug}</span> · {categoryName(c)}
                </p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setEditing(c)} aria-label={`${t('common.edit')}: ${c.name}`}>
                <Pencil className="size-4" aria-hidden />
              </button>
              <button type="button" className="icon-btn text-danger" onClick={() => setToDelete(c)} aria-label={`${t('common.delete')}: ${c.name}`}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">{t('admin.categoryDeleteHint')}</p>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? t('admin.addCategory') : t('admin.editCategory')}>
        {editing !== null && <CategoryForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!toDelete}
        title={t('admin.deleteCategoryTitle')}
        text={t('admin.deleteCategoryText', { name: toDelete?.name ?? '' })}
        confirmLabel={t('common.delete')}
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
      />
    </>
  )
}
