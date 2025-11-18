'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Code from '@tiptap/extension-code'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Code as CodeIcon, List, ListOrdered, Heading2, Underline as UnderlineIcon } from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [4],
        },
      }),
      Underline,
      Code.configure({
        HTMLAttributes: {
          class: 'code-inline',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (html !== value) {
        onChange(html)
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Force re-render to update button states
      editor.view.updateState(editor.state)
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const { from, to } = editor.state.selection
      editor.commands.setContent(value)
      editor.commands.setTextSelection({ from, to })
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-3 border border-input rounded-t-lg bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className="h-9 px-3"
        >
          <Bold className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Bold</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className="h-9 px-3"
        >
          <Italic className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Italic</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className="h-9 px-3"
        >
          <UnderlineIcon className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Underline</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('code') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Code"
          className="h-9 px-3"
        >
          <CodeIcon className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Code</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 4 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            // Check if we're already in a heading
            if (editor.isActive('heading', { level: 4 })) {
              // Toggle off - go to new line with normal text
              editor.chain().focus().enter().setParagraph().run()
            } else {
              // Check if we're at the start of a line
              const { from } = editor.state.selection
              const $from = editor.state.doc.resolve(from)
              const isAtStart = $from.parentOffset === 0
              
              if (isAtStart) {
                // At start of line, just make it a heading
                editor.chain().focus().setHeading({ level: 4 }).run()
              } else {
                // In middle of line, create new line and make it a heading
                editor.chain().focus().enter().setHeading({ level: 4 }).run()
              }
            }
          }}
          title="Heading"
          className="h-9 px-3"
        >
          <Heading2 className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Heading</span>
        </Button>
        
        <div className="w-px h-7 bg-border mx-1" />
        
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className="h-9 px-3"
        >
          <List className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Bullets</span>
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className="h-9 px-3"
        >
          <ListOrdered className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">Numbers</span>
        </Button>
      </div>
      
      <div className="w-full rounded-b-lg rounded-t-none border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 border border-t-0">
        <EditorContent editor={editor} />
      </div>
      
      <style jsx global>{`
        .ProseMirror {
          min-height: 150px;
          outline: none;
        }
        
        .ProseMirror:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }
        
        .ProseMirror h4 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.4;
          text-transform: capitalize;
        }
        
        .ProseMirror h4:first-letter {
          text-transform: uppercase;
        }
        
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        
        .ProseMirror li {
          margin: 0.25em 0;
        }
        
        .ProseMirror strong {
          font-weight: bold;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
        
        .ProseMirror u {
          text-decoration: underline;
        }
        
        .ProseMirror code.code-inline {
          background-color: #fee;
          color: #c00;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
        }
        
        .ProseMirror p {
          margin: 0.5em 0;
        }
        
        .ProseMirror p:first-child {
          margin-top: 0;
        }
        
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  )
}
