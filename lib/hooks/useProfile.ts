import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { Profile } from '@/lib/types'

export function useProfile() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile | null> => {
      if (!session?.user?.id) return null

      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        if (response.status === 401) return null
        throw new Error('Failed to fetch profile')
      }
      
      return response.json()
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update profile')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  }
}
