export type User = {
  id?: number
  firstname: string
  lastname: string
  password?: string
  password_digest?: string
}

export type PublicUser = {
  id?: number
  firstname: string
  lastname: string
}
