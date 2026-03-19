import crypto from 'crypto'
import { ObjectId } from 'mongodb'
import { getUsersCollection } from '../mongodb'
import { isValidObjectId } from './logs'

export interface CustomEntryType {
  value: string
  label: string
}

export interface UserPreferences {
  accentColor?: string
  theme?: 'light' | 'dark' | 'system'
}

export interface UserDocument {
  _id: ObjectId
  email: string
  passwordHash?: string
  name?: string | null
  fullName?: string | null
  emailVerified?: Date | null
  image?: string | null
  avatarUrl?: string | null
  customEntryTypes: CustomEntryType[]
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  passwordResetToken?: string  // SHA-256 hash of the plain token
  passwordResetExpiry?: Date
}

export interface UpdateUserInput {
  fullName?: string | null
  avatarUrl?: string | null
  customEntryTypes?: CustomEntryType[]
  preferences?: Partial<UserPreferences>
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  custom_entry_types: CustomEntryType[]
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

function documentToProfile(doc: UserDocument): UserProfile {
  return {
    id: doc._id.toString(),
    email: doc.email,
    full_name: doc.fullName ?? doc.name ?? null,
    avatar_url: doc.avatarUrl ?? doc.image ?? null,
    custom_entry_types: doc.customEntryTypes ?? [],
    preferences: doc.preferences ?? {},
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  }
}

export async function getUserById(id: string): Promise<UserDocument | null> {
  if (!isValidObjectId(id)) return null
  const collection = await getUsersCollection()
  return collection.findOne({ _id: new ObjectId(id) }) as Promise<UserDocument | null>
}

export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  const collection = await getUsersCollection()
  return collection.findOne({ email: email.toLowerCase() }) as Promise<UserDocument | null>
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await getUserById(userId)
  return user ? documentToProfile(user) : null
}

export async function updateUserProfile(userId: string, input: UpdateUserInput): Promise<UserProfile | null> {
  if (!isValidObjectId(userId)) return null

  const collection = await getUsersCollection()
  const now = new Date()

  const updateDoc: Record<string, unknown> = { updatedAt: now }

  if (input.fullName !== undefined) {
    updateDoc.fullName = input.fullName
    updateDoc.name = input.fullName
  }
  if (input.avatarUrl !== undefined) {
    updateDoc.avatarUrl = input.avatarUrl
    updateDoc.image = input.avatarUrl
  }
  if (input.customEntryTypes !== undefined) {
    updateDoc.customEntryTypes = input.customEntryTypes
  }
  if (input.preferences !== undefined) {
    updateDoc.preferences = input.preferences
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updateDoc },
    { returnDocument: 'after' }
  )

  return result ? documentToProfile(result as UserDocument) : null
}

export async function updatePassword(userId: string, passwordHash: string): Promise<boolean> {
  if (!isValidObjectId(userId)) return false

  const collection = await getUsersCollection()
  const now = new Date()

  const result = await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash, updatedAt: now } }
  )

  return result.modifiedCount > 0
}

// --- Password reset token management ---

/**
 * Generates a password reset token for a user identified by email.
 * Returns the plain token (to be included in the reset link) and userId,
 * or null if no user with that email exists.
 * The token hash + expiry are stored on the user document.
 */
export async function createPasswordResetToken(
  email: string
): Promise<{ token: string; userId: string } | null> {
  const collection = await getUsersCollection()
  const user = await collection.findOne({ email: email.toLowerCase() })
  if (!user) return null

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await collection.updateOne(
    { _id: user._id },
    { $set: { passwordResetToken: tokenHash, passwordResetExpiry: expiry, updatedAt: new Date() } }
  )

  return { token, userId: user._id.toString() }
}

/**
 * Verifies a plain reset token. Returns the userId if valid and not expired,
 * or null otherwise.
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const collection = await getUsersCollection()
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const user = await collection.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpiry: { $gt: new Date() },
  })

  return user ? user._id.toString() : null
}

/**
 * Clears the password reset token fields from a user document after use.
 */
export async function clearPasswordResetToken(userId: string): Promise<void> {
  if (!isValidObjectId(userId)) return

  const collection = await getUsersCollection()
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $unset: { passwordResetToken: '', passwordResetExpiry: '' }, $set: { updatedAt: new Date() } }
  )
}
