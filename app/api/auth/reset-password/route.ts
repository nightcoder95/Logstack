import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { verifyPasswordResetToken, updatePassword, clearPasswordResetToken } from '@/lib/db/users'
import { resetPasswordSchema } from '@/lib/validation'

// POST /api/auth/reset-password - Set a new password using a valid reset token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token, password } = result.data

    const userId = await verifyPasswordResetToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)
    await updatePassword(userId, passwordHash)
    await clearPasswordResetToken(userId)

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
