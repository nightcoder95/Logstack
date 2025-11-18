'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className = '' }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-10 ${value ? 'pr-10' : ''} cursor-pointer hover:border-accent transition-colors`}
          onClick={() => setShowCalendar(true)}
        />
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
              setShowCalendar(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            title="Clear date"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {value && (
        <div className="absolute left-0 top-full mt-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded whitespace-nowrap z-10">
          {format(new Date(value), 'EEEE, MMMM d, yyyy')}
        </div>
      )}
    </div>
  )
}
