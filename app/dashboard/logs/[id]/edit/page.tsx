'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogForm, type LogFormData } from '@/components/LogForm'
import { useProfile } from '@/lib/hooks/useProfile'
import type { Log } from '@/lib/types'

export default function EditLogPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { profile } = useProfile()
  const [log, setLog] = useState<Log | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/logs/${params.id}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) { router.push('/login'); return null }
          if (res.status === 400) { toast.error('Invalid log ID'); router.push('/dashboard/logs'); return null }
          toast.error('Log not found')
          router.push('/dashboard/logs')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data) setLog(data)
        setFetching(false)
      })
      .catch(() => {
        toast.error('Failed to load log')
        router.push('/dashboard/logs')
      })
  }, [params.id, router])

  const handleSubmit = async (data: LogFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/logs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          entry_type: data.entryType,
          date: data.date,
          todos: data.todos.length > 0 ? data.todos : null,
          description: data.description || null,
          deadline: data.deadline || null,
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        return { success: false, error: json.message || 'Failed to update log' }
      }

      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      return { success: true }
    } catch {
      return { success: false, error: 'An unexpected error occurred' }
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
    <LogForm
      mode="edit"
      initialData={log}
      onSubmit={handleSubmit}
      customEntryTypes={profile?.custom_entry_types}
    />
  )
}
