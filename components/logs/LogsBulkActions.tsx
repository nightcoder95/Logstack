'use client'

import { Plus, X, Download, Trash2, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface LogsBulkActionsProps {
  isSelectMode: boolean
  selectedCount: number
  onSelectModeToggle: () => void
  onBulkExport: (format: 'csv' | 'json') => void
  onBulkDelete: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function LogsBulkActions({
  isSelectMode,
  selectedCount,
  onSelectModeToggle,
  onBulkExport,
  onBulkDelete,
  hasActiveFilters,
  onClearFilters,
}: LogsBulkActionsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {isSelectMode && selectedCount > 0 && (
        <>
          <Button 
            variant="outline"
            onClick={() => onBulkExport('csv')}
            className="bg-accent/10 border-accent text-accent-foreground hover:bg-accent hover:text-white"
          >
            <Download className="h-5 w-5 mr-2" />
            Export ({selectedCount})
          </Button>
          <Button 
            variant="destructive"
            onClick={onBulkDelete}
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete ({selectedCount})
          </Button>
        </>
      )}
      <Button 
        variant={isSelectMode ? "default" : "outline"}
        onClick={onSelectModeToggle}
        className={isSelectMode ? "bg-accent hover:bg-accent/90" : ""}
      >
        {isSelectMode ? (
          <>
            <X className="h-5 w-5 mr-2" />
            Cancel Selection
          </>
        ) : (
          <>
            <CheckSquare className="h-5 w-5 mr-2" />
            Select Multiple
          </>
        )}
      </Button>
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          <X className="h-5 w-5 mr-2" />
          Clear Filters
        </Button>
      )}
      <Button asChild>
        <Link href="/dashboard/logs/new">
          <Plus className="h-5 w-5 mr-2" />
          Add Log
        </Link>
      </Button>
    </div>
  )
}
