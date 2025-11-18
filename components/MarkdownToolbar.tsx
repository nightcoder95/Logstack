'use client'

import { Button } from '@/components/ui/button'
import { Bold, Italic, Code, List, ListOrdered, Heading2 } from 'lucide-react'

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onInsert: () => void
}

export function MarkdownToolbar({ textareaRef, onInsert }: MarkdownToolbarProps) {
  const insertMarkdown = (before: string, after: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newText =
      textarea.value.substring(0, start) +
      before +
      textToInsert +
      after +
      textarea.value.substring(end)

    textarea.value = newText
    textarea.focus()
    
    // Set cursor position
    const newCursorPos = start + before.length + textToInsert.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    
    onInsert()
  }

  const insertList = (prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    let newText: string
    if (selectedText) {
      const lines = selectedText.split('\n')
      const formattedLines = lines.map(line => line.trim() ? `${prefix} ${line}` : line)
      newText =
        textarea.value.substring(0, start) +
        formattedLines.join('\n') +
        textarea.value.substring(end)
    } else {
      newText =
        textarea.value.substring(0, start) +
        `${prefix} Item 1\n${prefix} Item 2\n${prefix} Item 3` +
        textarea.value.substring(end)
    }

    textarea.value = newText
    textarea.focus()
    onInsert()
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 border border-input rounded-t-lg bg-muted/30">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertMarkdown('**', '**', 'bold text')}
        title="Bold"
        className="h-9 px-3 hover:bg-accent"
      >
        <Bold className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Bold</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertMarkdown('*', '*', 'italic text')}
        title="Italic"
        className="h-9 px-3 hover:bg-accent"
      >
        <Italic className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Italic</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertMarkdown('`', '`', 'code')}
        title="Inline Code"
        className="h-9 px-3 hover:bg-accent"
      >
        <Code className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Code</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertMarkdown('## ', '', 'Heading')}
        title="Heading"
        className="h-9 px-3 hover:bg-accent"
      >
        <Heading2 className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Heading</span>
      </Button>
      
      <div className="w-px h-7 bg-border mx-1" />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertList('-')}
        title="Bullet List"
        className="h-9 px-3 hover:bg-accent"
      >
        <List className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Bullets</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertList('1.')}
        title="Numbered List"
        className="h-9 px-3 hover:bg-accent"
      >
        <ListOrdered className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Numbers</span>
      </Button>
    </div>
  )
}
