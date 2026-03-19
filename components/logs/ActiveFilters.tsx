'use client'

import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ENTRY_TYPES } from '@/lib/constants'

interface ActiveFiltersProps {
  searchTerm: string
  selectedTypes: string[]
  startDate: string
  endDate: string
  sortBy: string
  sortOrder: string
  onClearSearch: () => void
  onClearType: (type: string) => void
  onClearStartDate: () => void
  onClearEndDate: () => void
  onClearSort: () => void
}

export function ActiveFilters({
  searchTerm,
  selectedTypes,
  startDate,
  endDate,
  sortBy,
  sortOrder,
  onClearSearch,
  onClearType,
  onClearStartDate,
  onClearEndDate,
  onClearSort,
}: ActiveFiltersProps) {
  const hasActiveFilters = searchTerm || selectedTypes.length > 0 || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc'

  if (!hasActiveFilters) return null

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Active Filters:</span>
        {searchTerm && (
          <Badge variant="secondary" className="gap-1">
            Search: {searchTerm}
            <button onClick={onClearSearch} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {selectedTypes.map(type => (
          <Badge key={type} variant="secondary" className="gap-1">
            {ENTRY_TYPES.find(t => t.value === type)?.label}
            <button onClick={() => onClearType(type)} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {startDate && (
          <Badge variant="secondary" className="gap-1">
            From: {format(parseISO(startDate), 'MMM dd, yyyy')}
            <button onClick={onClearStartDate} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {endDate && (
          <Badge variant="secondary" className="gap-1">
            To: {format(parseISO(endDate), 'MMM dd, yyyy')}
            <button onClick={onClearEndDate} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {(sortBy !== 'date' || sortOrder !== 'desc') && (
          <Badge variant="secondary" className="gap-1">
            Sort: {sortBy} ({sortOrder})
            <button onClick={onClearSort} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </Card>
  )
}
