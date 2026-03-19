import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { signupSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = signupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: result.error.issues[0].message },
        { status: 400 }
      )
    }
    
    const { email, password, full_name } = result.data
    
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const usersCollection = db.collection('users')
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'USER_EXISTS', message: 'An account with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const passwordHash = await hash(password, 12)
    
    // Create user
    const now = new Date()
    const insertResult = await usersCollection.insertOne({
      email: email.toLowerCase(),
      passwordHash,
      name: full_name || null,
      fullName: full_name || null,
      emailVerified: null,
      image: null,
      avatarUrl: null,
      customEntryTypes: [],
      preferences: {
        accentColor: 'blue',
        theme: 'dark',
      },
      createdAt: now,
      updatedAt: now,
    })
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: insertResult.insertedId.toString(),
        email: email.toLowerCase(),
        name: full_name || null,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
