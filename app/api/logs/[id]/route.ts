import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLogById, updateLog, softDeleteLog, isValidObjectId } from '@/lib/db/logs'
import { logSchema } from '@/lib/validation'
import sanitizeHtml from 'sanitize-html'

// GET /api/logs/[id] - Fetch a single log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'INVALID_ID', message: 'Invalid log ID' }, { status: 400 })
    }

    const log = await getLogById(id, session.user.id)

    if (!log) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Log not found' }, { status: 404 })
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error fetching log:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch log' },
      { status: 500 }
    )
  }
}

// PATCH /api/logs/[id] - Update a log
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'INVALID_ID', message: 'Invalid log ID' }, { status: 400 })
    }

    const body = await request.json()

    const result = logSchema.partial().safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, entry_type, date, todos, description, deadline } = result.data

    const sanitizedDescription =
      description !== undefined ? (description ? sanitizeHtml(description, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
        allowedAttributes: { a: ['href', 'target', 'rel'] },
        transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
      }) : null) : undefined

    const log = await updateLog(id, session.user.id, {
      title,
      entryType: entry_type,
      date,
      todos,
      description: sanitizedDescription,
      deadline,
    })

    if (!log) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Log not found' }, { status: 404 })
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error updating log:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update log' },
      { status: 500 }
    )
  }
}

// DELETE /api/logs/[id] - Soft delete a log
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'INVALID_ID', message: 'Invalid log ID' }, { status: 400 })
    }

    const success = await softDeleteLog(id, session.user.id)

    if (!success) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting log:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete log' },
      { status: 500 }
    )
  }
}
