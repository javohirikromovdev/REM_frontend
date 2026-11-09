import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError, api } from '../lib/api'
import type { PropertyQuery, PropertyStatus } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authUrl, saveIntent } from '../lib/returnTo'
import { errorTitle } from '../lib/errors'

export const keys = {
  categories: ['categories'] as const,
  properties: (q: PropertyQuery) => ['properties', q] as const,
  property: (id: number) => ['property', id] as const,
  favorites: ['favorites'] as const,
  inquiries: ['inquiries'] as const,
  myProperties: (page: number) => ['my-properties', page] as const,
  adminProperties: (status: PropertyStatus, page: number) => ['admin-properties', status, page] as const,
  adminUsers: ['admin-users'] as const,
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: api.categories.list, staleTime: 5 * 60_000 })
}

export function useProperties(query: PropertyQuery) {
  return useQuery({
    queryKey: keys.properties(query),
    queryFn: () => api.properties.list(query),
    placeholderData: keepPreviousData,
  })
}

export function useProperty(id: number) {
  const { status } = useAuth()
  return useQuery({
    queryKey: keys.property(id),
    queryFn: () => api.properties.get(id),
    enabled: Number.isInteger(id) && id > 0 && status !== 'loading',
    retry: (count, err) => !(err instanceof ApiError && err.status < 500 && err.status > 0) && count < 2,
  })
}

export function useFavorites() {
  const { status } = useAuth()
  return useQuery({
    queryKey: keys.favorites,
    queryFn: api.favorites.list,
    enabled: status === 'authenticated',
  })
}

export function useToggleFavorite() {
  const { status } = useAuth()
  const { data } = useFavorites()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { t } = useTranslation()
  const savedIds = new Set((data ?? []).map((f) => f.propertyId))

  const mutation = useMutation({
    mutationFn: async ({ id, saved }: { id: number; saved: boolean }) => {
      try {
        if (saved) await api.favorites.remove(id)
        else await api.favorites.add(id)
      } catch (err) {
        if (err instanceof ApiError && (err.status === 409 || (saved && err.status === 404))) return saved
        throw err
      }
      return !saved
    },
    onSuccess: (wasAdded, { saved }) => {
      void queryClient.invalidateQueries({ queryKey: keys.favorites })
      if (wasAdded !== saved) toast(saved ? t('favorites.removed') : t('favorites.added'))
    },
    onError: (err) => toast(errorTitle(err, t), 'error'),
  })

  const toggle = (id: number) => {
    if (status !== 'authenticated') {
      const returnTo = location.pathname + location.search
      saveIntent({ propertyId: id, action: 'favorite', returnTo })
      navigate(authUrl('register', returnTo, 'favorite'))
      return
    }
    mutation.mutate({ id, saved: savedIds.has(id) })
  }

  return {
    toggle,
    isSaved: (id: number) => savedIds.has(id),
    isPending: (id: number) => mutation.isPending && mutation.variables?.id === id,
  }
}

export function useMyInquiries() {
  return useQuery({ queryKey: keys.inquiries, queryFn: api.inquiries.mine })
}

export function useMyProperties(page: number) {
  return useQuery({
    queryKey: keys.myProperties(page),
    queryFn: () => api.properties.mine(page),
    placeholderData: keepPreviousData,
  })
}

export function useAdminProperties(status: PropertyStatus, page: number) {
  return useQuery({
    queryKey: keys.adminProperties(status, page),
    queryFn: () => api.admin.properties(status, page),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUsers() {
  return useQuery({ queryKey: keys.adminUsers, queryFn: api.admin.users })
}
