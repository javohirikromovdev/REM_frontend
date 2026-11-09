import type { Category } from './types'
import i18n from '../i18n'

function intlLocale(lng: string) {
  return lng === 'uz-Latn' ? 'uz' : lng
}

export function formatPrice(price: string | number, currency: string, lng: string) {
  const value = Number(price)
  if (!Number.isFinite(value)) return `${price} ${currency}`
  if (currency === 'UZS') return `${formatNumber(value, lng)} ${i18n.t('currency.UZS')}`
  try {
    return new Intl.NumberFormat(intlLocale(lng), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${new Intl.NumberFormat(intlLocale(lng)).format(value)} ${currency}`
  }
}

export function formatNumber(value: number, lng: string) {
  return new Intl.NumberFormat(intlLocale(lng)).format(value)
}

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export function formatDate(iso: string | undefined, lng: string) {
  if (!iso) return ''
  if (lng === 'uz-Latn') {
    const d = new Date(iso)
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`
  }
  return new Intl.DateTimeFormat(intlLocale(lng), { dateStyle: 'medium' }).format(new Date(iso))
}

export function categoryName(category: Pick<Category, 'slug' | 'name'> | undefined) {
  if (!category) return ''
  const key = `categories.${category.slug}`
  return i18n.exists(key) ? i18n.t(key) : category.name
}
