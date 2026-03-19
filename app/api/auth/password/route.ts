import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { compare, hash } from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { getUserById, updatePassword } from '@/lib/db/users'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be less than 100 characters'),
})

// POST /api/auth/password - Change password (requires current password verification)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const body = await request.json()
    const result = changePasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = result.data

    const user = await getUserById(session.user.id)
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'No password set on this account' },
        { status: 400 }
      )
    }

    const isCurrentValid = await compare(currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    const newHash = await hash(newPassword, 12)
    await updatePassword(session.user.id, newHash)

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update password' },
      { status: 500 }
    )
  }
}
