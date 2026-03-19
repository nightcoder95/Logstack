import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLogStats } from '@/lib/db/logs'

// GET /api/logs/stats - Aggregated dashboard stats (never limited to N records)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const stats = await getLogStats(session.user.id)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching log stats:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
