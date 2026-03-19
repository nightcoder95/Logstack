import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { compare } from 'bcryptjs'
import clientPromise from './mongodb'

// Extend the session type to include user.id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const client = await clientPromise
        const usersCollection = client.db(process.env.MONGODB_DB).collection('users')

        const user = await usersCollection.findOne({ email: credentials.email.toLowerCase() })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.passwordHash) {
          throw new Error('Please sign in with the method you used to create your account')
        }

        const isValid = await compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.fullName || null,
          image: user.image || user.avatarUrl || null,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login timestamp — look up by _id, not email
      if (!user.id) return
      const client = await clientPromise
      const usersCollection = client.db(process.env.MONGODB_DB).collection('users')
      const { ObjectId } = await import('mongodb')
      await usersCollection.updateOne(
        { _id: new ObjectId(user.id) },
        { $set: { lastLoginAt: new Date() } }
      )
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
