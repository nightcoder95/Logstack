'use client'

import { Search, X, Download, CalendarDays, FileText } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/DatePicker'
import { ENTRY_TYPES, TYPE_COLORS } from '@/lib/constants'

interface LogsFilterProps {
  searchTerm: string
  selectedTypes: string[]
  startDate: string
  endDate: string
  sortBy: 'date' | 'title' | 'created_at' | 'updated_at'
  sortOrder: 'asc' | 'desc'
  isSearching: boolean
  onSearchChange: (value: string) => void
  onTypeToggle: (type: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onSortChange: (sortBy: string, sortOrder: string) => void
  onExport: (format: 'csv' | 'json') => void
}

export function LogsFilter({
  searchTerm,
  selectedTypes,
  startDate,
  endDate,
  sortBy,
  sortOrder,
  isSearching,
  onSearchChange,
  onTypeToggle,
  onStartDateChange,
  onEndDateChange,
  onSortChange,
  onExport,
}: LogsFilterProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {searchTerm && !isSearching && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DatePicker
          value={startDate}
          onChange={onStartDateChange}
          placeholder="Start date"
        />

        <DatePicker
          value={endDate}
          onChange={onEndDateChange}
          placeholder="End date"
        />

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
            onSortChange(newSortBy, newSortOrder)
          }}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="date-desc">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="title-asc">Title (A-Z)</option>
          <option value="title-desc">Title (Z-A)</option>
          <option value="created_at-desc">Created (Newest)</option>
          <option value="created_at-asc">Created (Oldest)</option>
          <option value="updated_at-desc">Updated (Newest)</option>
          <option value="updated_at-asc">Updated (Oldest)</option>
        </select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            className="flex-1 hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Export all logs as CSV"
          >
            <Download className="-ml-1 mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('json')}
            className="flex-1 hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Export all logs as JSON"
          >
            <Download className="-ml-1 mr-2 h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Quick Filters:</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM-dd')
                onStartDateChange(today)
                onEndDateChange(today)
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const start = startOfWeek(new Date(), { weekStartsOn: 1 })
                const end = endOfWeek(new Date(), { weekStartsOn: 1 })
                onStartDateChange(format(start, 'yyyy-MM-dd'))
                onEndDateChange(format(end, 'yyyy-MM-dd'))
              }}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const start = startOfMonth(new Date())
                const end = endOfMonth(new Date())
                onStartDateChange(format(start, 'yyyy-MM-dd'))
                onEndDateChange(format(end, 'yyyy-MM-dd'))
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const end = format(new Date(), 'yyyy-MM-dd')
                const start = format(subDays(new Date(), 7), 'yyyy-MM-dd')
                onStartDateChange(start)
                onEndDateChange(end)
              }}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const end = format(new Date(), 'yyyy-MM-dd')
                const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')
                onStartDateChange(start)
                onEndDateChange(end)
              }}
            >
              Last 30 Days
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Entry Types:</span>
          <div className="flex flex-wrap gap-2">
            {ENTRY_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                size="sm"
                onClick={() => onTypeToggle(type.value)}
                className={`transition-all ${selectedTypes.includes(type.value) ? TYPE_COLORS[type.value] : 'hover:border-accent'}`}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
