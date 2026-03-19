import { NextRequest, NextResponse } from 'next/server'
import { verifyPasswordResetToken } from '@/lib/db/users'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// POST /api/auth/verify-reset-token - Check if a reset token is valid before showing the form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ valid: false })
    }

    const userId = await verifyPasswordResetToken(result.data.token)
    return NextResponse.json({ valid: !!userId })
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return NextResponse.json({ valid: false })
  }
}
