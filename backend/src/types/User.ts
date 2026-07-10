export type User = {
  id?: number
  name?: string
  firstname: string
  lastname: string
  email?: string | null
  phone?: string | null
  role?: 'MANAGER' | 'ADMIN' | 'DELIVERY' | 'CUSTOMER'
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
  password?: string
  password_digest?: string
}

export type PublicUser = {
  id?: number
  name?: string
  firstname: string
  lastname: string
  email?: string | null
  phone?: string | null
  role?: 'MANAGER' | 'ADMIN' | 'DELIVERY' | 'CUSTOMER'
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}
