'use client'

import { useQueryClient } from '@tanstack/react-query'
import { LogForm, type LogFormData } from '@/components/LogForm'
import { useProfile } from '@/lib/hooks/useProfile'

export default function NewLogPage() {
  const queryClient = useQueryClient()
  const { profile } = useProfile()

  const handleSubmit = async (data: LogFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
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
        return { success: false, error: json.message || 'Failed to create log' }
      }

      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      return { success: true }
    } catch {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  return (
    <LogForm
      mode="create"
      onSubmit={handleSubmit}
      customEntryTypes={profile?.custom_entry_types}
    />
  )
}
