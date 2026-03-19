import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes
        if (
          pathname === '/login' ||
          pathname === '/forgot-password' ||
          pathname.startsWith('/reset-password') ||
          pathname.startsWith('/api/auth/')
        ) {
          return true
        }
        
        // Require authentication for dashboard routes
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/forgot-password',
    '/reset-password/:path*',
  ],
}
