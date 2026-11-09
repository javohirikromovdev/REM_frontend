import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ImagePlus, RotateCcw, Trash2, X } from 'lucide-react'
import type { ListingType, Property, PropertyInput } from '../../lib/types'
import { ApiError, api, imageUrl } from '../../lib/api'
import { categoryName } from '../../lib/format'
import { errorDetails, errorTitle } from '../../lib/errors'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { keys, useCategories, useProperty } from '../../hooks/queries'
import { SmartImage } from '../../components/PropertyCard'
import { ConfirmDialog } from '../../components/Modal'
import { ErrorState, FormError, PageHeader, PageLoader, Spinner, StatusBadge } from '../../components/ui'
import { ForbiddenPage, NotFoundPage } from '../StatusPages'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const CURRENCIES = ['UZS', 'USD', 'EUR']

type FormState = Record<'title' | 'description' | 'address' | 'city' | 'price' | 'area' | 'rooms' | 'bathrooms' | 'categoryId' | 'currency', string> & { listingType: ListingType }

const EMPTY: FormState = { title: '', description: '', address: '', city: '', price: '', area: '', rooms: '', bathrooms: '', categoryId: '', currency: 'UZS', listingType: 'SALE' }

function fromProperty(p: Property): FormState {
  return {
    title: p.title,
    description: p.description,
    address: p.address,
    city: p.city,
    price: String(Number(p.price)),
    area: String(p.area),
    rooms: String(p.rooms),
    bathrooms: String(p.bathrooms),
    categoryId: String(p.categoryId),
    currency: p.currency,
    listingType: p.listingType,
  }
}

function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {}
  for (const k of ['title', 'description', 'address', 'city'] as const) if (!f[k].trim()) e[k] = 'validation.required'
  const price = Number(f.price)
  if (!f.price) e.price = 'validation.required'
  else if (!(price > 0)) e.price = 'validation.positive'
  else if (!/^\d+(\.\d{1,2})?$/.test(f.price)) e.price = 'validation.decimals'
  if (!f.area) e.area = 'validation.required'
  else if (!(Number(f.area) > 0)) e.area = 'validation.positive'
  for (const k of ['rooms', 'bathrooms'] as const) {
    if (!f[k]) e[k] = 'validation.required'
    else if (!Number.isInteger(Number(f[k])) || Number(f[k]) < 1) e[k] = 'validation.integerMin1'
  }
  if (!f.categoryId) e.categoryId = 'validation.required'
  return e
}

function toInput(f: FormState): PropertyInput {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    address: f.address.trim(),
    city: f.city.trim(),
    price: Number(f.price),
    area: Number(f.area),
    rooms: Number(f.rooms),
    bathrooms: Number(f.bathrooms),
    listingType: f.listingType,
    categoryId: Number(f.categoryId),
    currency: f.currency,
  }
}

interface QueueItem {
  key: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: unknown
}

function useUploadQueue(onUploaded: (propertyId: number) => void) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [rejected, setRejected] = useState<{ name: string; reason: 'type' | 'size' }[]>([])
  const update = (key: string, patch: Partial<QueueItem>) => setQueue((q) => q.map((i) => (i.key === key ? { ...i, ...patch } : i)))

  const add = (files: FileList | null): QueueItem[] => {
    if (!files) return []
    const ok: QueueItem[] = []
    const bad: typeof rejected = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) bad.push({ name: file.name, reason: 'type' })
      else if (file.size > MAX_SIZE) bad.push({ name: file.name, reason: 'size' })
      else ok.push({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file), status: 'pending' })
    }
    setRejected(bad)
    setQueue((q) => [...q, ...ok])
    return ok
  }

  const remove = (key: string) =>
    setQueue((q) => {
      const item = q.find((i) => i.key === key)
      if (item) URL.revokeObjectURL(item.preview)
      return q.filter((i) => i.key !== key)
    })

  const upload = async (propertyId: number, items: QueueItem[]) => {
    let failed = 0
    for (const item of items) {
      update(item.key, { status: 'uploading', error: undefined })
      try {
        await api.properties.uploadImage(propertyId, item.file)
        update(item.key, { status: 'done' })
      } catch (error) {
        failed++
        update(item.key, { status: 'error', error })
      }
    }
    onUploaded(propertyId)
    return failed
  }

  useEffect(() => () => queue.forEach((i) => URL.revokeObjectURL(i.preview)), [])

  return { queue, rejected, add, remove, upload, setQueue }
}

function QueueList({ queue, onRemove, onRetry }: { queue: QueueItem[]; onRemove: (k: string) => void; onRetry?: (item: QueueItem) => void }) {
  const { t } = useTranslation()
  if (queue.length === 0) return null
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {queue.map((item) => (
        <li key={item.key} className="flex items-center gap-3 rounded-xl border border-line p-2">
          <img src={item.preview} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.file.name}</p>
            <p className={`text-xs ${item.status === 'error' ? 'text-danger' : item.status === 'done' ? 'text-success' : 'text-muted'}`}>
              {item.status === 'error' ? `${errorTitle(item.error, t)} ${errorDetails(item.error).join('. ')}` : t(`upload.${item.status}`)}
            </p>
          </div>
          {item.status === 'uploading' && <Spinner className="size-5 text-accent" />}
          {item.status === 'error' && onRetry && (
            <button type="button" className="icon-btn" onClick={() => onRetry(item)} aria-label={t('common.retry')}>
              <RotateCcw className="size-4" aria-hidden />
            </button>
          )}
          {(item.status === 'pending' || item.status === 'error') && (
            <button type="button" className="icon-btn" onClick={() => onRemove(item.key)} aria-label={t('common.remove')}>
              <X className="size-4" aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function FilePicker({ onFiles, disabled }: { onFiles: (f: FileList | null) => void; disabled?: boolean }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input ref={ref} id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={disabled} onChange={(e) => {
        onFiles(e.target.files)
        e.target.value = ''
      }} />
      <label htmlFor="images" className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-4 text-center text-sm text-muted hover:border-accent hover:text-accent ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        <ImagePlus className="size-7" aria-hidden />
        <span className="font-semibold">{t('upload.choose')}</span>
        <span className="text-xs">{t('upload.rules')}</span>
      </label>
    </div>
  )
}

export function PropertyFormPage() {
  const { t } = useTranslation()
  const { id: idParam } = useParams()
  const editId = idParam ? Number(idParam) : null
  const isEdit = editId !== null
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const categories = useCategories()
  const existing = useProperty(editId ?? 0)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(!isEdit)
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [imageToDelete, setImageToDelete] = useState<number | null>(null)

  const refreshProperty = (pid: number) => {
    void queryClient.invalidateQueries({ queryKey: keys.property(pid) })
    void queryClient.invalidateQueries({ queryKey: ['my-properties'] })
    void queryClient.invalidateQueries({ queryKey: ['properties'] })
  }
  const uploads = useUploadQueue(refreshProperty)

  useEffect(() => {
    if (isEdit && existing.data && !initialized) {
      setForm(fromProperty(existing.data))
      setInitialized(true)
    }
  }, [isEdit, existing.data, initialized])

  const save = useMutation({
    mutationFn: async () => {
      const input = toInput(form)
      if (isEdit) return api.properties.update(editId, input)
      return api.properties.create(input)
    },
    onSuccess: async (property) => {
      refreshProperty(property.id)
      if (isEdit) {
        toast(t('seller.updated'))
        return
      }
      setCreatedId(property.id)
      const pending = uploads.queue.filter((i) => i.status === 'pending')
      const failed = await uploads.upload(property.id, pending)
      if (failed === 0) {
        toast(t('seller.created'))
        navigate('/cabinet/properties', { replace: true })
      } else {
        toast(t('seller.createdWithErrors'), 'error')
      }
    },
  })

  const removeImage = useMutation({
    mutationFn: (imageId: number) => api.properties.removeImage(editId!, imageId),
    onSuccess: () => {
      toast(t('upload.deleted'))
      setImageToDelete(null)
      refreshProperty(editId!)
    },
    onError: (err) => toast(errorTitle(err, t), 'error'),
  })

  if (isEdit) {
    if (!Number.isInteger(editId) || editId <= 0) return <NotFoundPage />
    if (existing.isPending) return <PageLoader />
    if (existing.isError) {
      if (existing.error instanceof ApiError && existing.error.status === 404) return <NotFoundPage />
      return <ErrorState error={existing.error} onRetry={() => void existing.refetch()} />
    }
    if (existing.data.ownerId !== user?.id) return <ForbiddenPage />
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const locked = createdId !== null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (save.isPending || locked) return
    const next = validate(form)
    setErrors(next)
    if (Object.keys(next).length === 0) save.mutate()
    else document.getElementById(`pf-${Object.keys(next)[0]}`)?.focus()
  }

  const field = (key: keyof FormState, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`pf-${key}`} className="label">
        {label} *
      </label>
      <input id={`pf-${key}`} className="input" value={form[key]} onChange={set(key)} disabled={locked} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `pf-${key}-err` : undefined} {...props} />
      {errors[key] && (
        <p id={`pf-${key}-err`} className="field-error">
          {t(errors[key])}
        </p>
      )}
    </div>
  )

  const currencies = CURRENCIES.includes(form.currency) ? CURRENCIES : [...CURRENCIES, form.currency]
  const images = [...(existing.data?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      <PageHeader
        title={isEdit ? t('seller.editTitle') : t('seller.newTitle')}
        subtitle={isEdit ? undefined : t('seller.newSubtitle')}
        action={isEdit && existing.data ? <StatusBadge status={existing.data.status} /> : undefined}
      />

      <form onSubmit={submit} className="card grid gap-5 p-5 sm:p-6" noValidate>
        {field('title', t('fields.title'))}
        <div>
          <label htmlFor="pf-description" className="label">
            {t('fields.description')} *
          </label>
          <textarea id="pf-description" rows={5} className="input py-2" value={form.description} onChange={set('description')} disabled={locked} aria-invalid={!!errors.description} />
          {errors.description && <p className="field-error">{t(errors.description)}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="label">{t('filters.type')} *</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['SALE', 'RENT'] as ListingType[]).map((type) => (
                <button key={type} type="button" disabled={locked} aria-pressed={form.listingType === type} className={`chip ${form.listingType === type ? 'chip-active' : ''}`} onClick={() => setForm((f) => ({ ...f, listingType: type }))}>
                  {t(`listingType.${type}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="pf-categoryId" className="label">
              {t('filters.category')} *
            </label>
            <select id="pf-categoryId" className="input" value={form.categoryId} onChange={set('categoryId')} disabled={locked || categories.isPending} aria-invalid={!!errors.categoryId}>
              <option value="">{categories.isPending ? t('common.loading') : t('seller.chooseCategory')}</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryName(c)}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="field-error">{t(errors.categoryId)}</p>}
            {categories.isError && <p className="field-error">{errorTitle(categories.error, t)}</p>}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {field('city', t('fields.city'))}
          {field('address', t('fields.address'))}
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          {field('price', t('fields.price'), { type: 'number', min: 0, step: '0.01', inputMode: 'decimal' })}
          <div>
            <label htmlFor="pf-currency" className="label">
              {t('fields.currency')}
            </label>
            <select id="pf-currency" className="input" value={form.currency} onChange={set('currency')} disabled={locked}>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {field('area', `${t('fields.area')} (${t('property.sqm')})`, { type: 'number', min: 0, step: 'any', inputMode: 'decimal' })}
          {field('rooms', t('fields.rooms'), { type: 'number', min: 1, step: 1, inputMode: 'numeric' })}
          {field('bathrooms', t('fields.bathrooms'), { type: 'number', min: 1, step: 1, inputMode: 'numeric' })}
        </div>

        {!isEdit && (
          <div>
            <p className="label">{t('upload.title')}</p>
            <FilePicker onFiles={uploads.add} disabled={locked} />
            {uploads.rejected.map((r) => (
              <p key={r.name} className="field-error">
                {r.name}: {t(r.reason === 'type' ? 'upload.badType' : 'upload.tooBig')}
              </p>
            ))}
            <QueueList queue={uploads.queue} onRemove={uploads.remove} onRetry={createdId ? (item) => void uploads.upload(createdId, [item]) : undefined} />
          </div>
        )}

        <FormError error={save.error} />

        {locked ? (
          <div className="rounded-xl bg-warning-soft p-4 text-sm" role="status">
            <p>{t('seller.createdWithErrors')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/cabinet/properties/${createdId}/edit`} className="btn-outline">
                {t('seller.continueEdit')}
              </Link>
              <Link to="/cabinet/properties" className="btn-ghost">
                {t('nav.myListings')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-3">
            <Link to="/cabinet/properties" className="btn-outline">
              {t('common.cancel')}
            </Link>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Spinner className="size-4" />}
              {isEdit ? t('common.save') : t('seller.publish')}
            </button>
          </div>
        )}
        {!isEdit && !locked && <p className="text-xs text-muted">{t('seller.moderationHint')}</p>}
      </form>

      {isEdit && (
        <section className="card mt-6 p-5 sm:p-6" aria-labelledby="img-title">
          <h2 id="img-title" className="mb-4 text-lg font-semibold">
            {t('upload.title')}
          </h2>
          {images.length > 0 ? (
            <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <li key={img.id} className="relative">
                  <SmartImage src={imageUrl(img.url)} alt={img.altText || form.title} className="aspect-[4/3] w-full rounded-xl" />
                  <button type="button" onClick={() => setImageToDelete(img.id)} aria-label={t('upload.delete')} className="absolute end-2 top-2 inline-flex size-11 items-center justify-center rounded-full bg-surface/90 text-danger shadow-card">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-muted">{t('upload.none')}</p>
          )}
          <FilePicker
            onFiles={(files) => {
              const added = uploads.add(files)
              if (added.length) void uploads.upload(editId!, added)
            }}
          />
          {uploads.rejected.map((r) => (
            <p key={r.name} className="field-error">
              {r.name}: {t(r.reason === 'type' ? 'upload.badType' : 'upload.tooBig')}
            </p>
          ))}
          <QueueList queue={uploads.queue.filter((i) => i.status !== 'done')} onRemove={uploads.remove} onRetry={(item) => void uploads.upload(editId!, [item])} />
        </section>
      )}

      <ConfirmDialog
        open={imageToDelete !== null}
        title={t('upload.deleteTitle')}
        text={t('upload.deleteText')}
        confirmLabel={t('common.delete')}
        loading={removeImage.isPending}
        onClose={() => setImageToDelete(null)}
        onConfirm={() => imageToDelete !== null && removeImage.mutate(imageToDelete)}
      />
    </>
  )
}
