'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    setSupabase(client)
    
    // Check if we have a valid session from the reset link
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValid(true)
      } else {
        toast.error('Invalid or expired reset link')
        router.push('/forgot-password')
      }
    })
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    if (!supabase) {
      toast.error('Authentication not initialized')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Password updated successfully!')
      router.push('/login')
    }
  }

  if (!supabase || !isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" />
              <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            </div>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Enter new password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
