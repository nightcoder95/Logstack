'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Plus, Search, Download, Pencil, Trash2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronDown, ChevronRight, FileText, CalendarDays, CheckSquare, Square } from 'lucide-react'
import { DatePicker } from '@/components/DatePicker'
import { InlineEditTitle } from '@/components/InlineEditTitle'
import { LogsTableSkeleton } from '@/components/LogsTableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { LogCard } from '@/components/LogCard'
import { format as formatDate, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import { ENTRY_TYPES, TYPE_COLORS, TYPE_STYLES } from '@/lib/constants'
import { useLogs } from '@/lib/hooks/useLogs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useQueryClient } from '@tanstack/react-query'

export default function LogsPage() {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'created_at' | 'updated_at'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Debounce search to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const isSearching = searchTerm !== debouncedSearchTerm

  const { data, isLoading } = useLogs({
    searchTerm: debouncedSearchTerm,
    selectedTypes,
    startDate,
    endDate,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    sortBy,
    sortOrder,
  })

  const logs = useMemo(() => data?.logs || [], [data?.logs])
  const totalLogs = data?.total || 0
  const totalPages = useMemo(() => Math.ceil(totalLogs / itemsPerPage), [totalLogs, itemsPerPage])

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update
    const previousData = queryClient.getQueryData(['logs'])
    queryClient.setQueryData(['logs'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        logs: old.logs.filter((log: any) => log.id !== id),
        total: old.total - 1
      }
    })

    const { error } = await supabase.rpc('soft_delete_log', { log_id: id })

    if (error) {
      // Revert on error
      queryClient.setQueryData(['logs'], previousData)
      toast.error('Failed to delete log: ' + error.message)
    } else {
      toast.success('Log deleted successfully')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    }
  }, [supabase, queryClient])

  const handleBulkDelete = useCallback(async () => {
    const count = selectedLogs.size
    
    // Optimistic update
    const previousData = queryClient.getQueryData(['logs'])
    queryClient.setQueryData(['logs'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        logs: old.logs.filter((log: any) => !selectedLogs.has(log.id)),
        total: old.total - count
      }
    })

    const deletePromises = Array.from(selectedLogs).map(id =>
      supabase.rpc('soft_delete_log', { log_id: id })
    )

    const results = await Promise.all(deletePromises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      // Revert on error
      queryClient.setQueryData(['logs'], previousData)
      toast.error(`Failed to delete ${errors.length} log(s)`)
    } else {
      toast.success(`${count} log(s) deleted successfully`)
      setSelectedLogs(new Set())
      setIsSelectMode(false)
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    }
  }, [selectedLogs, supabase, queryClient])

  const handleUpdateTitle = useCallback(async (id: string, newTitle: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('logs')
      .update({ title: newTitle })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // Optimistically update the cache
    queryClient.setQueryData(['logs'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        logs: old.logs.map((log: any) => 
          log.id === id ? { ...log, title: newTitle } : log
        )
      }
    })
  }, [supabase, queryClient])

  const handleBulkExport = useCallback((format: 'csv' | 'json') => {
    const selectedLogsData = logs.filter(log => selectedLogs.has(log.id))
    
    if (format === 'csv') {
      const headers = ['id', 'date', 'entry_type', 'title', 'todos', 'description', 'deadline']
      const csvContent = [
        headers.join(','),
        ...selectedLogsData.map((log: any) =>
          headers.map(h => {
            const value = log[h]
            if (h === 'todos') return `"${JSON.stringify(value || []).replace(/"/g, '""')}"`
            if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`
            return value || ''
          }).join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `selected-logs-${formatDate(new Date(), 'yyyyMMdd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${selectedLogs.size} log(s) exported as CSV`)
    } else {
      const jsonContent = JSON.stringify(selectedLogsData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `selected-logs-${formatDate(new Date(), 'yyyyMMdd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${selectedLogs.size} log(s) exported as JSON`)
    }
  }, [logs, selectedLogs])

  const toggleSelectAll = useCallback(() => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(logs.map(log => log.id)))
    }
  }, [selectedLogs, logs])

  const toggleSelectLog = useCallback((id: string) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedLogs(newSelected)
  }, [selectedLogs])

  const handleExport = useCallback((exportFormat: 'csv' | 'json') => {
    if (logs.length === 0) {
      toast.error('No logs to export')
      return
    }

    if (exportFormat === 'csv') {
      const headers = ['id', 'date', 'entry_type', 'title', 'todos', 'description', 'deadline', 'created_at', 'updated_at']
      const csvContent = [
        headers.join(','),
        ...logs.map((log: any) =>
          headers
            .map((header) => {
              const value = log[header]
              if (header === 'todos') {
                return `"${JSON.stringify(value || []).replace(/"/g, '""')}"`
              }
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value || ''
            })
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `worklogs-${format(new Date(), 'yyyyMMdd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } else if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(logs, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `worklogs-${format(new Date(), 'yyyyMMdd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('JSON exported successfully')
    }
  }, [logs])

  const toggleType = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }, [])

  const handleSort = useCallback((column: 'date' | 'title' | 'created_at' | 'updated_at') => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to descending
      setSortBy(column)
      setSortOrder('desc')
    }
  }, [sortBy, sortOrder])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedTypes([])
    setStartDate('')
    setEndDate('')
    setSortBy('date')
    setSortOrder('desc')
    setCurrentPage(1)
    toast.success('Filters cleared')
  }, [])

  // Reset to page 1 when filters change
  const resetPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  // Reset page when filters change
  useEffect(() => {
    resetPage()
  }, [debouncedSearchTerm, selectedTypes, startDate, endDate, sortBy, sortOrder])

  const hasActiveFilters = useMemo(
    () => debouncedSearchTerm || selectedTypes.length > 0 || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc',
    [debouncedSearchTerm, selectedTypes, startDate, endDate, sortBy, sortOrder]
  )

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Logs</h1>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              {logs.length} result{logs.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          {isSelectMode && selectedLogs.size > 0 && (
            <>
              <Button 
                variant="outline"
                onClick={() => handleBulkExport('csv')}
                className="bg-accent/10 border-accent text-accent-foreground hover:bg-accent hover:text-white"
              >
                <Download className="h-5 w-5 mr-2" />
                Export ({selectedLogs.size})
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedLogs.size} log(s)? This action cannot be undone.`)) {
                    handleBulkDelete()
                  }
                }}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete ({selectedLogs.size})
              </Button>
            </>
          )}
          <Button 
            variant={isSelectMode ? "default" : "outline"}
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              setSelectedLogs(new Set())
            }}
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
            <Button variant="outline" onClick={clearFilters}>
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
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">Active Filters:</span>
            {debouncedSearchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {debouncedSearchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTypes.map(type => (
              <Badge key={type} variant="secondary" className="gap-1">
                {ENTRY_TYPES.find(t => t.value === type)?.label}
                <button onClick={() => toggleType(type)} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {startDate && (
              <Badge variant="secondary" className="gap-1">
                From: {format(parseISO(startDate), 'MMM dd, yyyy')}
                <button onClick={() => setStartDate('')} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary" className="gap-1">
                To: {format(parseISO(endDate), 'MMM dd, yyyy')}
                <button onClick={() => setEndDate('')} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(sortBy !== 'date' || sortOrder !== 'desc') && (
              <Badge variant="secondary" className="gap-1">
                Sort: {sortBy} ({sortOrder})
                <button onClick={() => { setSortBy('date'); setSortOrder('desc'); }} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {searchTerm && !isSearching && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Start date"
          />

          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="End date"
          />

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
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
              onClick={() => handleExport('csv')}
              className="flex-1 hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Export all logs as CSV"
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
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
                  const today = formatDate(new Date(), 'yyyy-MM-dd')
                  setStartDate(today)
                  setEndDate(today)
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
                  setStartDate(formatDate(start, 'yyyy-MM-dd'))
                  setEndDate(formatDate(end, 'yyyy-MM-dd'))
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
                  setStartDate(formatDate(start, 'yyyy-MM-dd'))
                  setEndDate(formatDate(end, 'yyyy-MM-dd'))
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const end = formatDate(new Date(), 'yyyy-MM-dd')
                  const start = formatDate(subDays(new Date(), 7), 'yyyy-MM-dd')
                  setStartDate(start)
                  setEndDate(end)
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const end = formatDate(new Date(), 'yyyy-MM-dd')
                  const start = formatDate(subDays(new Date(), 30), 'yyyy-MM-dd')
                  setStartDate(start)
                  setEndDate(end)
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
                  onClick={() => toggleType(type.value)}
                  className={`transition-all ${selectedTypes.includes(type.value) ? TYPE_COLORS[type.value] : 'hover:border-accent'}`}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {isLoading ? (
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
        ) : logs.length === 0 ? (
          <Card>
            <EmptyState
              title="No logs found"
              description={hasActiveFilters ? "Try adjusting your filters to see more results." : "Start tracking your work by creating your first log entry."}
              actionLabel={hasActiveFilters ? undefined : "Create First Log"}
              actionHref={hasActiveFilters ? undefined : "/dashboard/logs/new"}
              icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            />
          </Card>
        ) : (
          <>
            {logs.map((log) => (
              <LogCard key={log.id} log={log} onDelete={setDeleteId} />
            ))}
            
            {/* Mobile Pagination */}
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
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {isLoading ? (
          <LogsTableSkeleton />
        ) : logs.length === 0 ? (
          <Card>
            <EmptyState
              title="No logs found"
              description={hasActiveFilters ? "Try adjusting your filters to see more results." : "Start tracking your work by creating your first log entry."}
              actionLabel={hasActiveFilters ? undefined : "Create First Log"}
              actionHref={hasActiveFilters ? undefined : "/dashboard/logs/new"}
              icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  {isSelectMode && (
                    <th className="px-6 py-4 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={selectedLogs.size === logs.length ? "Deselect all" : "Select all"}
                      >
                        {selectedLogs.size === logs.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-6 py-4 w-10"></th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon column="date" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Title
                      <SortIcon column="title" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    TODOs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const typeLabel = ENTRY_TYPES.find((t) => t.value === log.entry_type)?.label || log.entry_type
                  const todosCount = log.todos ? JSON.parse(log.todos).length : 0
                  const isExpanded = expandedRows.has(log.id)
                  const hasDescription = log.description && log.description.trim() !== '' && log.description !== '<p></p>'

                  const toggleExpand = () => {
                    const newExpanded = new Set(expandedRows)
                    if (isExpanded) {
                      newExpanded.delete(log.id)
                    } else {
                      newExpanded.add(log.id)
                    }
                    setExpandedRows(newExpanded)
                  }

                  return (
                    <>
                      <tr key={log.id} className="hover:bg-accent/5 transition-all duration-150 border-b border-border/50">
                        {isSelectMode && (
                          <td className="px-6 py-5 whitespace-nowrap">
                            <button
                              onClick={() => toggleSelectLog(log.id)}
                              className="text-muted-foreground hover:text-accent transition-colors"
                            >
                              {selectedLogs.has(log.id) ? (
                                <CheckSquare className="h-4 w-4 text-accent" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="px-6 py-5 whitespace-nowrap">
                          {hasDescription ? (
                            <button
                              onClick={toggleExpand}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={isExpanded ? "Hide description" : "Show description"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center text-foreground font-medium">
                              <Calendar className="h-4 w-4 text-accent mr-2" />
                              {format(parseISO(log.date), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-foreground/70 ml-6">
                              {format(parseISO(log.date), 'EEEE')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:scale-105"
                            style={{
                              backgroundColor: TYPE_STYLES[log.entry_type]?.bg || 'rgba(100, 116, 139, 0.3)',
                              color: TYPE_STYLES[log.entry_type]?.text || 'rgb(226, 232, 240)',
                              borderColor: TYPE_STYLES[log.entry_type]?.border || 'rgba(148, 163, 184, 0.5)',
                            }}
                          >
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm max-w-xs">
                          <div className="flex items-center gap-2 text-foreground">
                            <InlineEditTitle
                              logId={log.id}
                              initialTitle={log.title}
                              onSave={handleUpdateTitle}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-foreground/80">
                          {todosCount > 0 ? `${todosCount} items` : '-'}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-foreground/80">
                          {log.deadline ? format(new Date(log.deadline), 'MMM dd, h:mm a') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/logs/${log.id}/edit`}
                              className="text-accent hover:text-accent/80 transition-colors p-1 hover:bg-accent/10 rounded"
                              title="Edit log"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteId(log.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors p-1 hover:bg-destructive/10 rounded"
                              title="Delete log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && hasDescription && (
                        <tr 
                          key={`${log.id}-description`} 
                          className="bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <td colSpan={isSelectMode ? 8 : 7} className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Description</div>
                                <div 
                                  className="text-sm prose prose-sm max-w-none prose-invert"
                                  style={{
                                    wordBreak: 'break-word',
                                  }}
                                  dangerouslySetInnerHTML={{ __html: log.description || '' }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

        {/* Pagination */}
        {!isLoading && logs.length > 0 && (
          <div className="border-t border-border px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-foreground/80 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs} logs
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:border-accent transition-colors"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-9"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
          )}
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this log? It will be removed from your view.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
