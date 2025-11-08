import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Log } from '@/lib/types'

interface UseLogsOptions {
  searchTerm?: string
  selectedTypes?: string[]
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  includeDeleted?: boolean
  sortBy?: 'date' | 'title' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

interface UseLogsResult {
  logs: Log[]
  total: number
}

export function useLogs(options: UseLogsOptions = {}) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { 
    searchTerm = '', 
    selectedTypes = [], 
    startDate = '', 
    endDate = '',
    limit = 100,
    offset = 0,
    includeDeleted = false,
    sortBy = 'date',
    sortOrder = 'desc'
  } = options

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
        },
        () => {
          // Invalidate and refetch logs when any change occurs
          queryClient.invalidateQueries({ queryKey: ['logs'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  return useQuery({
    queryKey: ['logs', searchTerm, selectedTypes, startDate, endDate, limit, offset, includeDeleted, sortBy, sortOrder],
    queryFn: async (): Promise<UseLogsResult> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { logs: [], total: 0 }

      let query = supabase
        .from('logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Filter out soft-deleted logs unless explicitly requested
      if (!includeDeleted) {
        query = query.is('deleted_at', null)
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedTypes.length > 0) {
        query = query.in('entry_type', selectedTypes)
      }

      if (startDate) {
        query = query.gte('date', startDate)
      }

      if (endDate) {
        query = query.lte('date', endDate)
      }

      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error
      return { logs: (data || []) as Log[], total: count || 0 }
    },
    staleTime: 30 * 1000,
  })
}
