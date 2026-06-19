export interface PublicUser {
  id?: number
  firstname: string
  lastname: string
}

export interface UserInput {
  firstname: string
  lastname: string
  password: string
}

export interface UserUpdate {
  firstname: string
  lastname: string
  password?: string
}
