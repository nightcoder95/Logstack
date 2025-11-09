'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ENTRY_TYPES } from '@/lib/constants'
import type { Todo } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'

export default function EditLogPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [date, setDate] = useState('')
  const [entryType, setEntryType] = useState('daily_work')
  const [title, setTitle] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  
  // Load custom entry types from localStorage
  const [allEntryTypes, setAllEntryTypes] = useState<Array<{ value: string; label: string }>>(
    [...ENTRY_TYPES]
  )
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('custom-entry-types')
      if (stored) {
        try {
          const customTypes = JSON.parse(stored)
          setAllEntryTypes([...ENTRY_TYPES, ...customTypes])
        } catch (e) {
          // Failed to load custom entry types
        }
      }
    }
  }, [])

  const fetchLog = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      toast.error('Log not found')
      router.push('/dashboard/logs')
      return
    }

    setDate(data.date)
    setEntryType(data.entry_type)
    setTitle(data.title)
    setDescription(data.description || '')
    setDeadline(data.deadline ? format(new Date(data.deadline), "yyyy-MM-dd'T'HH:mm") : '')
    
    if (data.todos) {
      try {
        const parsedTodos = typeof data.todos === 'string' ? JSON.parse(data.todos) : data.todos
        setTodos(parsedTodos)
      } catch (e) {
        setTodos([])
      }
    }

    setFetching(false)
  }, [params.id, supabase, router])

>>>>>>> feature/codebase-fixes
  useEffect(() => {
    if (params.id) {
      fetchLog()
    }
  }, [params.id, fetchLog])

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
      date,
      entry_type: entryType,
      title: title.trim(),
      description: description.trim() || null,
      todos: todos.length > 0 ? JSON.stringify(todos) : null,
      deadline: deadline || null,
    }

    const { error } = await supabase
      .from('logs')
      .update(logData)
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to update log')
      setLoading(false)
    } else {
      toast.success('Log updated successfully')
      // Invalidate React Query cache to refresh the logs list
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      router.push('/dashboard/logs')
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/logs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry_type">Entry Type *</Label>
                <select
                  id="entry_type"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  required
                  className="w-full rounded-lg border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {allEntryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title * <span className="text-xs text-muted-foreground">(max 200 characters)</span>
              </Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g., Fixed JSON bug in API"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Work TODOs <span className="text-xs text-muted-foreground">(max 20 items)</span>
              </Label>
              <div className="space-y-2">
                {todos.map((todo, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(index)}
                      className="rounded border-input"
                    />
                    <span className={`flex-1 ${todo.done ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTodo(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {todos.length < 20 && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTodo()
                        }
                      }}
                      placeholder="Add a short action item and press Enter"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addTodo}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-xs text-muted-foreground">(Markdown supported)</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Write details, accomplishments, blockers... (Markdown supported)"
                className="w-full rounded-lg border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                type="datetime-local"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" asChild>
                <Link href="/dashboard/logs">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Update Log'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
