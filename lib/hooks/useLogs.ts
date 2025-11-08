import { useQuery } from '@tanstack/react-query'
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
}

interface UseLogsResult {
  logs: Log[]
  total: number
}

export function useLogs(options: UseLogsOptions = {}) {
  const supabase = createClient()
  const { 
    searchTerm = '', 
    selectedTypes = [], 
    startDate = '', 
    endDate = '',
    limit = 100,
    offset = 0,
    includeDeleted = false
  } = options

  return useQuery({
    queryKey: ['logs', searchTerm, selectedTypes, startDate, endDate, limit, offset, includeDeleted],
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
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error
      return { logs: (data || []) as Log[], total: count || 0 }
    },
    staleTime: 30 * 1000,
  })
}
