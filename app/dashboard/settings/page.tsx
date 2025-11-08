'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/lib/theme-context'
import { Palette, User, Save } from 'lucide-react'

const ACCENT_COLORS = [
  { name: 'Red', value: 'red', color: 'hsl(0, 84.2%, 60.2%)' },
  { name: 'Blue', value: 'blue', color: 'hsl(217.2, 91.2%, 59.8%)' },
  { name: 'Green', value: 'green', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { name: 'Purple', value: 'purple', color: 'hsl(262.1, 83.3%, 57.8%)' },
  { name: 'Orange', value: 'orange', color: 'hsl(24.6, 95%, 53.1%)' },
  { name: 'Pink', value: 'pink', color: 'hsl(330.4, 81.2%, 60.4%)' },
  { name: 'Yellow', value: 'yellow', color: 'hsl(47.9, 95.8%, 53.1%)' },
  { name: 'Teal', value: 'teal', color: 'hsl(173.4, 80.4%, 40%)' },
] as const

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { accentColor, setAccentColor } = useTheme()
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
      }
      return user
    },
  })

  const handleColorChange = (color: typeof accentColor) => {
    setAccentColor(color)
    toast.success(`Theme color changed to ${color}`)
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsUpdating(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setIsUpdating(false)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Theme Color</CardTitle>
            </div>
            <CardDescription>Choose your preferred accent color</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`group relative aspect-square rounded-lg transition-all hover:scale-110 ${
                    accentColor === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                      : 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-muted'
                  }`}
                  style={{ backgroundColor: color.color }}
                >
                  <span className="sr-only">{color.name}</span>
                  {accentColor === color.value && (
                    <motion.div
                      layoutId="selected"
                      className="absolute inset-0 rounded-lg"
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Current color: <span className="font-medium capitalize">{accentColor}</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed at this time
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={isUpdating}
              className="w-full md:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
