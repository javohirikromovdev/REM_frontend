import type { TFunction } from 'i18next'
import { ApiError } from './api'

/** API xatosini tarjima qilingan umumiy matnga aylantiradi */
export function errorTitle(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return t('errors.network')
      case 400:
        return t('errors.validation')
      case 401:
        return t('errors.unauthorized')
      case 403:
        return t('errors.forbidden')
      case 404:
        return t('errors.notFound')
      case 409:
        return t('errors.conflict')
      case 413:
        return t('errors.tooLarge')
      case 429:
        return t('errors.tooMany')
      case 503:
        return t('errors.unavailable')
    }
  }
  return t('errors.generic')
}

/** Backend qaytargan aniq xabarlar (asl holida) */
export function errorDetails(error: unknown): string[] {
  return error instanceof ApiError ? error.messages : []
}
