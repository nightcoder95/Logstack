import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/db/users'
import { forgotPasswordSchema } from '@/lib/validation'

// POST /api/auth/forgot-password
// Always returns the same success message regardless of whether the email exists
// to prevent user enumeration attacks.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = result.data
    const tokenResult = await createPasswordResetToken(email)

    if (tokenResult) {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${tokenResult.token}`

      if (process.env.NODE_ENV === 'development') {
        // In development, log the reset URL since no email service is configured
        console.log(`[PASSWORD RESET] URL for ${email}: ${resetUrl}`)
      } else {
        // TODO: Integrate an email provider (e.g. Resend, SendGrid, Nodemailer)
        // and send the reset URL to the user's email address.
        console.error('[PASSWORD RESET] No email provider configured. Reset URL:', resetUrl)
      }
    }

    // Always return success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    })
  } catch (error) {
    console.error('Error processing forgot password:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
