'use client'

import { format, parseISO } from 'date-fns'
import { Pencil, Trash2, ChevronDown, ChevronRight, FileText, Calendar, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { InlineEditTitle } from '@/components/InlineEditTitle'
import { TYPE_STYLES, ENTRY_TYPES } from '@/lib/constants'
import type { Log } from '@/lib/types'

interface LogsTableProps {
  logs: Log[]
  isSelectMode: boolean
  selectedLogs: Set<string>
  expandedRows: Set<string>
  sortBy: 'date' | 'title' | 'created_at' | 'updated_at'
  sortOrder: 'asc' | 'desc'
  onSelectLog: (id: string) => void
  onSelectAll: () => void
  onToggleExpand: (id: string) => void
  onSort: (column: 'date' | 'title' | 'created_at' | 'updated_at') => void
  onUpdateTitle: (id: string, title: string) => Promise<void>
  onDelete: (id: string) => void
}

export function LogsTable({
  logs,
  isSelectMode,
  selectedLogs,
  expandedRows,
  sortBy,
  sortOrder,
  onSelectLog,
  onSelectAll,
  onToggleExpand,
  onSort,
  onUpdateTitle,
  onDelete,
}: LogsTableProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <span className="ml-1 opacity-50">↕</span>
    }
    return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {isSelectMode && (
                <th className="px-6 py-4 w-10">
                  <button
                    onClick={onSelectAll}
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
                onClick={() => onSort('date')}
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
                onClick={() => onSort('title')}
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
              const todosCount = log.todos ? (typeof log.todos === 'string' ? JSON.parse(log.todos as string).length : (log.todos as unknown as { text: string; done: boolean }[]).length) : 0
              const isExpanded = expandedRows.has(log.id)
              const hasDescription = log.description && log.description.trim() !== '' && log.description !== '<p></p>'

              return (
                <>
                  <tr key={log.id} className="hover:bg-accent/5 transition-all duration-150 border-b border-border/50">
                    {isSelectMode && (
                      <td className="px-6 py-5 whitespace-nowrap">
                        <button
                          onClick={() => onSelectLog(log.id)}
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
                          onClick={() => onToggleExpand(log.id)}
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
                          onSave={onUpdateTitle}
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
                          onClick={() => onDelete(log.id)}
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
    </Card>
  )
}
