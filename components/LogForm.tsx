'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ENTRY_TYPES } from '@/lib/constants'
import type { Todo, Log } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/RichTextEditor'

export interface LogFormData {
  date: string
  entryType: string
  title: string
  todos: Todo[]
  description: string
  deadline: string
}

interface LogFormProps {
  mode: 'create' | 'edit'
  initialData?: Log | null
  onSubmit: (data: LogFormData) => Promise<{ success: boolean; error?: string }>
  customEntryTypes?: Array<{ value: string; label: string }>
  loading?: boolean
}

export function LogForm({ mode, initialData, onSubmit, customEntryTypes = [], loading = false }: LogFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [entryType, setEntryType] = useState('daily_work')
  const [title, setTitle] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  // Combine default and custom entry types
  const allEntryTypes = [...ENTRY_TYPES, ...customEntryTypes]

  // Initialize form with initial data (for edit mode)
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date)
      setEntryType(initialData.entry_type)
      setTitle(initialData.title)
      setDescription(initialData.description || '')
      setDeadline(initialData.deadline ? format(new Date(initialData.deadline), "yyyy-MM-dd'T'HH:mm") : '')

      if (initialData.todos) {
        try {
          const parsedTodos = typeof initialData.todos === 'string' 
            ? JSON.parse(initialData.todos) 
            : initialData.todos
          setTodos(Array.isArray(parsedTodos) ? parsedTodos : [])
        } catch {
          setTodos([])
        }
      } else {
        setTodos([])
      }
    }
  }, [initialData])

  const addTodo = useCallback(() => {
    if (newTodo.trim() && todos.length < 20) {
      setTodos(prev => [...prev, { text: newTodo.trim(), done: false }])
      setNewTodo('')
    }
  }, [newTodo, todos.length])

  const removeTodo = useCallback((index: number) => {
    setTodos(prev => prev.filter((_, i) => i !== index))
  }, [])

  const toggleTodo = useCallback((index: number) => {
    setTodos(prev =>
      prev.map((todo, i) => (i === index ? { ...todo, done: !todo.done } : todo))
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (title.length > 200) {
      toast.error('Title must be less than 200 characters')
      return
    }

    setIsSubmitting(true)

    const result = await onSubmit({
      date,
      entryType,
      title: title.trim(),
      todos,
      description: description.trim() || '',
      deadline: deadline || '',
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success(mode === 'create' ? 'Log created successfully' : 'Log updated successfully')
      router.push('/dashboard/logs')
    } else {
      toast.error(result.error || 'Failed to save log')
    }
  }

  const isLoading = loading || isSubmitting

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
          <CardTitle>{mode === 'create' ? 'Add New Log' : 'Edit Log'}</CardTitle>
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
                Description
              </Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Write details, accomplishments, blockers..."
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Save Log' : 'Update Log'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
