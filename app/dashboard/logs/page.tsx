'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { FileText } from 'lucide-react'
import { LogsTableSkeleton } from '@/components/LogsTableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLogs } from '@/lib/hooks/useLogs'
import { useDeleteLog, useBulkDeleteLogs, useUpdateLog } from '@/lib/hooks/useLogMutations'
import { ActiveFilters } from '@/components/logs/ActiveFilters'
import { LogsFilter } from '@/components/logs/LogsFilter'
import { LogsBulkActions } from '@/components/logs/LogsBulkActions'
import { LogsTable } from '@/components/logs/LogsTable'
import { LogsMobileList } from '@/components/logs/LogsMobileList'
import { LogsPagination } from '@/components/logs/LogsPagination'
import { toast } from 'sonner'

export default function LogsPage() {
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

  const deleteMutation = useDeleteLog()
  const bulkDeleteMutation = useBulkDeleteLogs()
  const updateMutation = useUpdateLog()

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }, [deleteMutation])

  const handleBulkDelete = useCallback(() => {
    if (!confirm(`Are you sure you want to delete ${selectedLogs.size} log(s)? This action cannot be undone.`)) {
      return
    }
    bulkDeleteMutation.mutate(Array.from(selectedLogs), {
      onSuccess: () => {
        setSelectedLogs(new Set())
        setIsSelectMode(false)
      },
    })
  }, [selectedLogs, bulkDeleteMutation])

  const handleUpdateTitle = useCallback(async (id: string, newTitle: string) => {
    return updateMutation.mutateAsync({ id, data: { title: newTitle } })
  }, [updateMutation])

  const handleBulkExport = useCallback((exportFormat: 'csv' | 'json') => {
    const selectedLogsData = logs.filter(log => selectedLogs.has(log.id))
    
    if (exportFormat === 'csv') {
      const headers = ['id', 'date', 'entry_type', 'title', 'todos', 'description', 'deadline']
      const csvContent = [
        headers.join(','),
        ...selectedLogsData.map((log) =>
          headers.map(h => {
            const value = log[h as keyof typeof log]
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
      a.download = `selected-logs-${format(new Date(), 'yyyyMMdd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${selectedLogs.size} log(s) exported as CSV`)
    } else {
      const jsonContent = JSON.stringify(selectedLogsData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `selected-logs-${format(new Date(), 'yyyyMMdd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${selectedLogs.size} log(s) exported as JSON`)
    }
  }, [logs, selectedLogs])

  const handleExport = useCallback((exportFormat: 'csv' | 'json') => {
    if (logs.length === 0) {
      toast.error('No logs to export')
      return
    }

    if (exportFormat === 'csv') {
      const headers = ['id', 'date', 'entry_type', 'title', 'todos', 'description', 'deadline', 'created_at', 'updated_at']
      const csvContent = [
        headers.join(','),
        ...logs.map((log) =>
          headers
            .map((header) => {
              const value = log[header as keyof typeof log]
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
    } else {
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

  const toggleExpand = useCallback((id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }, [expandedRows])

  const toggleType = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }, [])

  const handleSort = useCallback((column: 'date' | 'title' | 'created_at' | 'updated_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
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

  const hasActiveFilters = useMemo(
    () => !!(debouncedSearchTerm || selectedTypes.length > 0 || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc'),
    [debouncedSearchTerm, selectedTypes, startDate, endDate, sortBy, sortOrder]
  )

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm, selectedTypes, startDate, endDate, sortBy, sortOrder])

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
        <LogsBulkActions
          isSelectMode={isSelectMode}
          selectedCount={selectedLogs.size}
          onSelectModeToggle={() => {
            setIsSelectMode(!isSelectMode)
            setSelectedLogs(new Set())
          }}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>

      <ActiveFilters
        searchTerm={debouncedSearchTerm}
        selectedTypes={selectedTypes}
        startDate={startDate}
        endDate={endDate}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onClearSearch={() => setSearchTerm('')}
        onClearType={toggleType}
        onClearStartDate={() => setStartDate('')}
        onClearEndDate={() => setEndDate('')}
        onClearSort={() => { setSortBy('date'); setSortOrder('desc'); }}
      />

      <LogsFilter
        searchTerm={searchTerm}
        selectedTypes={selectedTypes}
        startDate={startDate}
        endDate={endDate}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isSearching={isSearching}
        onSearchChange={setSearchTerm}
        onTypeToggle={toggleType}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSortChange={(by, order) => { setSortBy(by as typeof sortBy); setSortOrder(order as typeof sortOrder); }}
        onExport={handleExport}
      />

      {/* Mobile Card View */}
      <LogsMobileList
        logs={logs}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        currentPage={currentPage}
        totalPages={totalPages}
        totalLogs={totalLogs}
        onDelete={setDeleteId}
        onPageChange={setCurrentPage}
      />

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
          <>
            <LogsTable
              logs={logs}
              isSelectMode={isSelectMode}
              selectedLogs={selectedLogs}
              expandedRows={expandedRows}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSelectLog={toggleSelectLog}
              onSelectAll={toggleSelectAll}
              onToggleExpand={toggleExpand}
              onSort={handleSort}
              onUpdateTitle={handleUpdateTitle}
              onDelete={setDeleteId}
            />
            <LogsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalLogs={totalLogs}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
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
            <Button 
              variant="destructive" 
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
