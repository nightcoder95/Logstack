'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

interface LogInput {
  title: string
  entry_type: string
  date: string
  todos?: { text: string; done: boolean }[] | null
  description?: string | null
  deadline?: string | null
}

interface UpdateLogInput {
  id: string
  data: Partial<LogInput>
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    toast.error('Session expired. Please log in again.')
    await signOut({ callbackUrl: '/login' })
    throw new Error('Unauthorized')
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'An error occurred')
  }
  
  return data
}

export function useCreateLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LogInput) => {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create log')
    },
  })
}

export function useUpdateLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateLogInput) => {
      const response = await fetch(`/api/logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update log')
    },
  })
}

export function useDeleteLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
      })
      return handleResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success('Log deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete log')
    },
  })
}

export function useBulkDeleteLogs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      return handleResponse(response)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success(`${data.deletedCount || 'Selected'} log(s) deleted successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete logs')
    },
  })
}
