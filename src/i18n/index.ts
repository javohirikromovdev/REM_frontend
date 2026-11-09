import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import ru from './locales/ru'
import uzLatn from './locales/uz-Latn'
import uzCyrl from './locales/uz-Cyrl'

export const LOCALES = [
  { code: 'uz-Latn', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'ЎЗ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

const STORAGE_KEY = 'rem-locale'
const DEFAULT_LOCALE: LocaleCode = 'uz-Latn'

function initialLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LOCALES.some((l) => l.code === saved)) return saved as LocaleCode
  } catch {
  }
  return DEFAULT_LOCALE
}

void i18n.use(initReactI18next).init({
  resources: {
    'uz-Latn': { translation: uzLatn },
    'uz-Cyrl': { translation: uzCyrl },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: initialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  load: 'currentOnly',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
  }
})

export default i18n
