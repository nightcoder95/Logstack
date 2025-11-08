export interface Todo {
  text: string
  done: boolean
}

export interface Log {
  id: string
  user_id: string
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
