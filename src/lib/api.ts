import type {
  Category,
  Favorite,
  Inquiry,
  LoginResponse,
  MessageResponse,
  Paginated,
  Property,
  PropertyImage,
  PropertyInput,
  PropertyQuery,
  PropertyStatus,
  User,
} from './types'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const TOKEN_KEY = 'rem-token'

export const tokenStorage = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  messages: string[]
  body: unknown
  constructor(status: number, messages: string[], body: unknown = null) {
    super(messages[0] ?? `HTTP ${status}`)
    this.status = status
    this.messages = messages
    this.body = body
  }

  get retryAfterSeconds(): number | null {
    const v = this.body && typeof this.body === 'object' ? (this.body as { retryAfterSeconds?: unknown }).retryAfterSeconds : null
    return typeof v === 'number' ? v : null
  }
}

let unauthorizedHandler: (() => void) | null = null
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  skipAuthRedirect?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuthRedirect } = options
  const token = tokenStorage.get()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(API_BASE_URL + path, { method, headers, body: payload })
  } catch {
    throw new ApiError(0, [])
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    let messages: string[] = []
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message: unknown }).message
      messages = Array.isArray(m) ? m.map(String) : m ? [String(m)] : []
    }
    if (res.status === 401 && token && !skipAuthRedirect) unauthorizedHandler?.()
    throw new ApiError(res.status, messages, data)
  }
  return data as T
}

function toQuery(params: object): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') sp.set(key, String(value))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const api = {
  auth: {
    register: (data: { fullName: string; email: string; password: string; phone: string }) =>
      request<User>('/auth/register', { method: 'POST', body: data }),
    login: (data: { email: string; password: string }) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: data, skipAuthRedirect: true }),
    me: () => request<User>('/auth/me', { skipAuthRedirect: true }),
    sendCode: (email: string) =>
      request<{ message: string; expiresInSeconds: number; resendAfterSeconds: number; dailyLimit: number; remainingSends: number }>('/auth/email/send-code', { method: 'POST', body: { email } }),
    verifyCode: (email: string, code: string) =>
      request<{ verified: boolean }>('/auth/email/verify', { method: 'POST', body: { email, code } }),
  },
  users: {
    me: () => request<User>('/users/me'),
    updateMe: (data: { fullName?: string; phone?: string }) =>
      request<User>('/users/me', { method: 'PATCH', body: data }),
  },
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (data: { name: string; slug: string }) =>
      request<Category>('/categories', { method: 'POST', body: data }),
    update: (id: number, data: { name?: string; slug?: string }) =>
      request<Category>(`/categories/${id}`, { method: 'PATCH', body: data }),
    remove: (id: number) => request<Category>(`/categories/${id}`, { method: 'DELETE' }),
  },
  properties: {
    list: (query: PropertyQuery) => request<Paginated<Property>>(`/properties${toQuery(query)}`),
    get: (id: number) => request<Property>(`/properties/${id}`),
    mine: (page: number, limit = 10) =>
      request<Paginated<Property>>(`/properties/my/list${toQuery({ page, limit })}`),
    create: (data: PropertyInput) => request<Property>('/properties', { method: 'POST', body: data }),
    update: (id: number, data: Partial<PropertyInput>) =>
      request<Property>(`/properties/${id}`, { method: 'PATCH', body: data }),
    remove: (id: number) => request<MessageResponse>(`/properties/${id}`, { method: 'DELETE' }),
    uploadImage: (id: number, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<PropertyImage>(`/properties/${id}/images`, { method: 'POST', body: form })
    },
    removeImage: (id: number, imageId: number) =>
      request<MessageResponse>(`/properties/${id}/images/${imageId}`, { method: 'DELETE' }),
  },
  favorites: {
    list: () => request<Favorite[]>('/favorites'),
    add: (propertyId: number) => request<unknown>(`/favorites/${propertyId}`, { method: 'POST' }),
    remove: (propertyId: number) =>
      request<MessageResponse>(`/favorites/${propertyId}`, { method: 'DELETE' }),
  },
  inquiries: {
    create: (propertyId: number, data: { message: string; phone?: string }) =>
      request<Inquiry>(`/properties/${propertyId}/inquiries`, { method: 'POST', body: data }),
    mine: () => request<Inquiry[]>('/inquiries/my'),
  },
  admin: {
    properties: (status: PropertyStatus, page: number, limit = 10) =>
      request<Paginated<Property>>(`/admin/properties${toQuery({ status, page, limit })}`),
    setStatus: (id: number, status: 'APPROVED' | 'REJECTED') =>
      request<Property>(`/admin/properties/${id}/status`, { method: 'PATCH', body: { status } }),
    users: () => request<User[]>('/admin/users'),
  },
}

export function imageUrl(url: string | undefined | null): string | null {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  return API_BASE_URL + (url.startsWith('/') ? url : `/${url}`)
}
