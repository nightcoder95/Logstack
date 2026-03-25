import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLogs, createLog, bulkSoftDeleteLogs } from '@/lib/db/logs'
import { logSchema, bulkDeleteSchema } from '@/lib/validation'
import sanitizeHtml from 'sanitize-html'

// GET /api/logs - Fetch logs with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || undefined
    const types = searchParams.get('types')?.split(',').filter(Boolean) || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
    // Accept both snake_case (client) and camelCase — the DAL normalises via SORT_FIELD_MAP
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    const result = await getLogs({
      userId: session.user.id,
      searchTerm,
      selectedTypes: types,
      startDate,
      endDate,
      limit,
      offset,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

// POST /api/logs - Create a new log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const body = await request.json()

    const result = logSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, entry_type, date, todos, description, deadline } = result.data

    const sanitizedDescription = description ? sanitizeHtml(description, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
      allowedAttributes: { a: ['href', 'target', 'rel'] },
      transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
    }) : null

    const log = await createLog({
      userId: session.user.id,
      title,
      entryType: entry_type,
      date,
      todos: todos ?? null,
      description: sanitizedDescription,
      deadline: deadline ?? null,
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create log' },
      { status: 500 }
    )
  }
}

// DELETE /api/logs - Bulk soft delete
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const body = await request.json()

    const result = bulkDeleteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const deletedCount = await bulkSoftDeleteLogs(result.data.ids, session.user.id)

    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    console.error('Error bulk deleting logs:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete logs' },
      { status: 500 }
    )
  }
}
