export interface Todo {
  text: string
  done: boolean
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Log {
  id: string
  user_id: string
  user_email?: string | null
  date: string
  entry_type: string
  title: string
  todos: string | null
  description: string | null
  deadline: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
