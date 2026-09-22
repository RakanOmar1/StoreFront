export interface PublicUser {
  id?: number
  name?: string
  firstname: string
  lastname: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  role?: 'MANAGER' | 'ADMIN' | 'DELIVERY' | 'CUSTOMER'
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserInput {
  name?: string
  firstname: string
  lastname: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  password: string
}

export interface UserUpdate {
  name?: string
  firstname?: string
  lastname?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  password?: string
}
