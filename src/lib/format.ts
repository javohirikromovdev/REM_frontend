// Narx va sanani joriy til bo'yicha formatlash (valyuta konvertatsiya qilinmaydi)
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
    // noma'lum valyuta kodi bo'lsa — son + asl kod
    return `${new Intl.NumberFormat(intlLocale(lng)).format(value)} ${currency}`
  }
}

export function formatNumber(value: number, lng: string) {
  return new Intl.NumberFormat(intlLocale(lng)).format(value)
}

// Brauzerlarning ko'pchiligida uz-Latn oy nomlari yo'q ("2026 M11 8"), shuning uchun qo'lda
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export function formatDate(iso: string | undefined, lng: string) {
  if (!iso) return ''
  if (lng === 'uz-Latn') {
    const d = new Date(iso)
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`
  }
  return new Intl.DateTimeFormat(intlLocale(lng), { dateStyle: 'medium' }).format(new Date(iso))
}

/** Ma'lum sluglar tarjima qilinadi, noma'lumlari backenddagi asl nom bilan */
export function categoryName(category: Pick<Category, 'slug' | 'name'> | undefined) {
  if (!category) return ''
  const key = `categories.${category.slug}`
  return i18n.exists(key) ? i18n.t(key) : category.name
}
