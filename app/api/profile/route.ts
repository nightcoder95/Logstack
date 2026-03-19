import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, updateUserProfile } from '@/lib/db/users'
import { profileSchema } from '@/lib/validation'

// GET /api/profile - Fetch user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const profile = await getUserProfile(session.user.id)

    if (!profile) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Please sign in' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input (partial validation)
    const result = profileSchema.partial().safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { full_name, avatar_url, custom_entry_types, preferences } = result.data

    const profile = await updateUserProfile(session.user.id, {
      fullName: full_name,
      avatarUrl: avatar_url,
      customEntryTypes: custom_entry_types,
      preferences,
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
