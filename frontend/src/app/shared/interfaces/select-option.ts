export interface SelectOption<T = string> {
  label: string
  value: T
  description?: string
  disabled?: boolean
}
