export type Role = 'USER' | 'ADMIN'
export type ListingType = 'SALE' | 'RENT'
export type PropertyStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SortOption = 'newest' | 'price_asc' | 'price_desc'

export interface User {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: Role
  createdAt?: string
}

export interface Category {
  id: number
  name: string
  slug: string
}

export interface PropertyImage {
  id: number
  url: string
  altText: string | null
  propertyId: number
  sortOrder: number
}

export interface PropertyOwner {
  id: number
  fullName: string
  phone: string | null
  email?: string
}

export interface Property {
  id: number
  title: string
  description: string
  price: string | number
  currency: string
  listingType: ListingType
  status: PropertyStatus
  address: string
  city: string
  area: number
  rooms: number
  bathrooms: number
  createdAt: string
  updatedAt: string
  ownerId: number
  categoryId: number
  images: PropertyImage[]
  category: Category
  owner?: PropertyOwner
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Favorite {
  id: number
  userId: number
  propertyId: number
  createdAt: string
  property: Property
}

export interface Inquiry {
  id: number
  message: string
  phone: string | null
  senderId: number
  propertyId: number
  createdAt: string
  property: { id: number; title: string }
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface MessageResponse {
  message: string
}

export interface PropertyQuery {
  page?: number
  limit?: number
  city?: string
  category?: string
  type?: ListingType
  minPrice?: number
  maxPrice?: number
  rooms?: number
  sort?: SortOption
}

export interface PropertyInput {
  title: string
  description: string
  address: string
  city: string
  price: number
  area: number
  rooms: number
  bathrooms: number
  listingType: ListingType
  categoryId: number
  currency?: string
}
