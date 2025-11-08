'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const ENTRY_TYPES = [
  { value: 'daily_work', label: 'Daily Work' },
  { value: 'goal_progress', label: 'Goal Progress' },
  { value: 'learning', label: 'Learning' },
  { value: 'win', label: 'Win / Achievement' },
  { value: 'help_given', label: 'Help Given' },
  { value: 'feedback_received', label: 'Feedback Received' },
  { value: 'leave', label: 'Leave' },
]

interface Todo {
  text: string
  done: boolean
}

export default function NewLogPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [entryType, setEntryType] = useState('daily_work')
  const [title, setTitle] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const addTodo = () => {
    if (newTodo.trim() && todos.length < 20) {
      setTodos([...todos, { text: newTodo.trim(), done: false }])
      setNewTodo('')
    }
  }

  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index))
  }

  const toggleTodo = (index: number) => {
    setTodos(
      todos.map((todo, i) => (i === index ? { ...todo, done: !todo.done } : todo))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!title.trim()) {
      toast.error('Title is required')
      setLoading(false)
      return
    }

    if (title.length > 200) {
      toast.error('Title must be less than 200 characters')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in')
      setLoading(false)
      return
    }

    const logData: any = {
      user_id: user.id,
      date,
      entry_type: entryType,
      title: title.trim(),
      description: description.trim() || null,
      todos: todos.length > 0 ? JSON.stringify(todos) : null,
      deadline: deadline || null,
    }

    const { error } = await supabase.from('logs').insert([logData])

    if (error) {
      toast.error('Failed to create log')
      console.error(error)
      setLoading(false)
    } else {
      toast.success('Log created successfully')
      router.push('/dashboard/logs')
      router.refresh()
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/logs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Logs
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Add New Log</h1>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="entry_type" className="block text-sm font-medium text-gray-700 mb-1">
                Entry Type *
              </label>
              <select
                id="entry_type"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {ENTRY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title * <span className="text-xs text-gray-500">(max 200 characters)</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="e.g., Fixed JSON bug in API"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work TODOs <span className="text-xs text-gray-500">(max 20 items)</span>
            </label>
            <div className="space-y-2">
              {todos.map((todo, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(index)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`flex-1 ${todo.done ? 'line-through text-gray-500' : ''}`}>
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTodo(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {todos.length < 20 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTodo())}
                    placeholder="Add a short action item and press Enter"
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addTodo}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-xs text-gray-500">(Markdown supported)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Write details, accomplishments, blockers... (Markdown supported)"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/dashboard/logs"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
