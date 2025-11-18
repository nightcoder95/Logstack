'use client'

import { format, parseISO } from 'date-fns'
import { Calendar, FileText, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ENTRY_TYPES, TYPE_STYLES } from '@/lib/constants'
import { useState, memo } from 'react'

interface LogCardProps {
  log: any
  onDelete: (id: string) => void
}

export const LogCard = memo(function LogCard({ log, onDelete }: LogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const typeLabel = ENTRY_TYPES.find((t) => t.value === log.entry_type)?.label || log.entry_type
  const todosCount = log.todos ? JSON.parse(log.todos).length : 0
  const hasDescription = log.description && log.description.trim() !== '' && log.description !== '<p></p>'

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: TYPE_STYLES[log.entry_type]?.bg || 'rgba(100, 116, 139, 0.3)',
                  color: TYPE_STYLES[log.entry_type]?.text || 'rgb(226, 232, 240)',
                  borderColor: TYPE_STYLES[log.entry_type]?.border || 'rgba(148, 163, 184, 0.5)',
                }}
              >
                {typeLabel}
              </span>
              {hasDescription && (
                <FileText className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-semibold text-base truncate">{log.title}</h3>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/logs/${log.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(log.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date and Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(parseISO(log.date), 'MMM dd, yyyy')}</span>
          </div>
          {todosCount > 0 && (
            <span className="text-xs">
              {todosCount} TODO{todosCount !== 1 ? 's' : ''}
            </span>
          )}
          {log.deadline && (
            <span className="text-xs">
              Due: {format(new Date(log.deadline), 'MMM dd')}
            </span>
          )}
        </div>

        {/* Description Toggle */}
        {hasDescription && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>{isExpanded ? 'Hide' : 'Show'} description</span>
            </button>
            
            {isExpanded && (
              <div 
                className="text-sm prose prose-sm max-w-none prose-invert pl-6 animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: log.description || '' }}
              />
            )}
          </>
        )}
      </div>
    </Card>
  )
})
