import { useQuery } from '@tanstack/react-query'
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
  const { 
    searchTerm = '', 
    selectedTypes = [], 
    startDate = '', 
    endDate = '',
    limit = 10,
    offset = 0,
    sortBy = 'date',
    sortOrder = 'desc'
  } = options

  // Build query string
  const params = new URLSearchParams()
  if (searchTerm) params.set('search', searchTerm)
  if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','))
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  params.set('sortBy', sortBy)
  params.set('sortOrder', sortOrder)

  return useQuery({
    queryKey: ['logs', searchTerm, selectedTypes, startDate, endDate, limit, offset, sortBy, sortOrder],
    queryFn: async (): Promise<UseLogsResult> => {
      const response = await fetch(`/api/logs?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          return { logs: [], total: 0 }
        }
        throw new Error('Failed to fetch logs')
      }
      
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds - replaced real-time with polling
    refetchInterval: 30 * 1000, // Poll every 30 seconds as replacement for real-time
  })
}
