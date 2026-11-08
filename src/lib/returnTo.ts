// Login/registratsiyadan keyin qaytish manzili va mehmonning niyati (intent)

const INTENT_KEY = 'rem-intent'

/** Faqat sayt ichidagi ruxsat etilgan sahifalar */
const ALLOWED = [/^\/$/, /^\/properties(\/\d+)?$/, /^\/favorites$/, /^\/cabinet(\/.*)?$/, /^\/admin(\/.*)?$/]

export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  const path = value.split(/[?#]/)[0]
  if (!ALLOWED.some((re) => re.test(path))) return null
  return value
}

export type IntentAction = 'inquiry' | 'contact' | 'favorite' | 'auth'

export interface AuthIntent {
  propertyId?: number
  action: IntentAction
  returnTo: string
}

export function saveIntent(intent: AuthIntent) {
  const returnTo = safeReturnTo(intent.returnTo)
  if (!returnTo) return
  sessionStorage.setItem(INTENT_KEY, JSON.stringify({ ...intent, returnTo }))
}

export function readIntent(): AuthIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as AuthIntent
    if (!safeReturnTo(data.returnTo)) return null
    return data
  } catch {
    return null
  }
}

export function clearIntent() {
  sessionStorage.removeItem(INTENT_KEY)
}

/** Mehmonni registratsiyaga yuboradigan havola (kontekst query'da ham saqlanadi) */
export function authUrl(page: 'login' | 'register', returnTo: string, reason: IntentAction = 'auth') {
  const sp = new URLSearchParams({ returnTo, reason })
  return `/${page}?${sp.toString()}`
}
