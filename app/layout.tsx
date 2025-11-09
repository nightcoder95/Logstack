import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/lib/theme-context'

export const metadata: Metadata = {
  title: 'LogStack',
  description: 'Personal daily work log application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster position="top-right" theme="dark" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
