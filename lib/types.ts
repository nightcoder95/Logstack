export interface Todo {
  text: string
  done: boolean
}

export interface CustomEntryType {
  value: string
  label: string
}

export interface UserPreferences {
  accentColor?: string
  theme?: 'light' | 'dark' | 'system'
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  custom_entry_types: CustomEntryType[]
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface Log {
  id: string
  user_id: string
  date: string
  entry_type: string
  title: string
  todos: Todo[] | null
  description: string | null
  deadline: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
