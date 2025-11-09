'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Download, Pencil, Trash2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ENTRY_TYPES, TYPE_COLORS } from '@/lib/constants'
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

  const { data, isLoading } = useLogs({
    searchTerm,
    selectedTypes,
    startDate,
    endDate,
    limit: 100,
    sortBy,
    sortOrder,
  })

  const logs = data?.logs || []

  const handleDelete = async (id: string) => {
    const { error } = await supabase.rpc('soft_delete_log', { log_id: id })

    if (error) {
      toast.error('Failed to delete log: ' + error.message)
    } else {
      toast.success('Log deleted successfully')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    }
  }

  const handleExport = (exportFormat: 'csv' | 'json') => {
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
  }

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleSort = (column: 'date' | 'title' | 'created_at' | 'updated_at') => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to descending
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTypes([])
    setStartDate('')
    setEndDate('')
    setSortBy('date')
    setSortOrder('desc')
    toast.success('Filters cleared')
  }

  const hasActiveFilters = searchTerm || selectedTypes.length > 0 || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc'

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
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
          <Button asChild>
            <Link href="/dashboard/logs/new">
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Log
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 space-y-4">
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={startDate ? 'pr-10' : ''}
            />
            {startDate && (
              <button
                onClick={() => setStartDate('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={endDate ? 'pr-10' : ''}
            />
            {endDate && (
              <button
                onClick={() => setEndDate('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

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
              className="flex-1"
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              className="flex-1"
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ENTRY_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={selectedTypes.includes(type.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleType(type.value)}
              className={selectedTypes.includes(type.value) ? TYPE_COLORS[type.value] : ''}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No logs found. <Link href="/dashboard/logs/new" className="text-accent hover:text-accent/80 underline">Create your first log</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon column="date" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Title
                      <SortIcon column="title" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    TODOs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const typeLabel = ENTRY_TYPES.find((t) => t.value === log.entry_type)?.label || log.entry_type
                  const todosCount = log.todos ? JSON.parse(log.todos).length : 0

                  return (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          {format(parseISO(log.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={TYPE_COLORS[log.entry_type]}>
                          {typeLabel}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate">
                        {log.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {todosCount > 0 ? `${todosCount} items` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {log.deadline ? format(new Date(log.deadline), 'MMM dd, h:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/logs/${log.id}/edit`}
                          className="text-accent hover:text-accent/80 mr-4"
                        >
                          <Pencil className="inline h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(log.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="inline h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
