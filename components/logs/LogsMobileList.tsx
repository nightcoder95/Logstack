'use client'

import { Card } from '@/components/ui/card'
import { LogCard } from '@/components/LogCard'
import { Button } from '@/components/ui/button'
import type { Log } from '@/lib/types'

interface LogsMobileListProps {
  logs: Log[]
  isLoading: boolean
  hasActiveFilters: boolean
  currentPage: number
  totalPages: number
  totalLogs: number
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
}

export function LogsMobileList({
  logs,
  isLoading,
  hasActiveFilters,
  currentPage,
  totalPages,
  totalLogs,
  onDelete,
  onPageChange,
}: LogsMobileListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-24 bg-muted-foreground/20 rounded" />
                  <div className="h-5 w-3/4 bg-muted-foreground/20 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded" />
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-4 w-28 bg-muted-foreground/10 rounded" />
                <div className="h-4 w-20 bg-muted-foreground/10 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return null
  }

  return (
    <div className="block lg:hidden space-y-4">
      {logs.map((log) => (
        <LogCard key={log.id} log={log} onDelete={onDelete} />
      ))}
      
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground text-center">
              Page {currentPage} of {totalPages} ({totalLogs} total)
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
