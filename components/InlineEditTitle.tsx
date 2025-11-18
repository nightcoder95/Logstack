'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface InlineEditTitleProps {
  logId: string
  initialTitle: string
  onSave: (id: string, newTitle: string) => Promise<void>
}

export function InlineEditTitle({ logId, initialTitle, onSave }: InlineEditTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty')
      setTitle(initialTitle)
      setIsEditing(false)
      return
    }

    if (title === initialTitle) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(logId, title.trim())
      setIsEditing(false)
      toast.success('Title updated')
    } catch (error) {
      toast.error('Failed to update title')
      setTitle(initialTitle)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(initialTitle)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          maxLength={200}
          className="flex-1 bg-background border border-accent rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-accent hover:text-accent/80 p-1"
          title="Save"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="text-muted-foreground hover:text-foreground p-1"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-1 group">
      <span className="truncate">{title}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-accent transition-all p-1"
        title="Edit title"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}
