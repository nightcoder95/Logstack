'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/lib/theme-context'
import { useProfile } from '@/lib/hooks/useProfile'
import { Palette, User, Save, Tag, Plus, X } from 'lucide-react'
import { ENTRY_TYPES } from '@/lib/constants'
import type { CustomEntryType } from '@/lib/types'

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
  const { data: session } = useSession()
  const { accentColor, setAccentColor } = useTheme()
  const { profile, updateProfile, isUpdating: isUpdatingProfile } = useProfile()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // New custom entry type input
  const [newEntryLabel, setNewEntryLabel] = useState('')

  // Load profile data into local state
  useEffect(() => {
    if (profile) {
      setEmail(profile.email)
      setFullName(profile.full_name || '')
    } else if (session?.user?.email) {
      setEmail(session.user.email)
    }
  }, [profile, session])

  const handleColorChange = (color: typeof accentColor) => {
    setAccentColor(color)
    toast.success(`Theme color changed to ${color}`)
  }

  const handleUpdateProfile = () => {
    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    updateProfile(
      { full_name: fullName.trim() },
      {
        onSuccess: () => toast.success('Profile updated successfully'),
        onError: (error: Error) => toast.error(error.message || 'Failed to update profile'),
      }
    )
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
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

    setIsUpdatingPassword(true)

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Failed to update password')
      } else {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast.error('An unexpected error occurred')
    }

    setIsUpdatingPassword(false)
  }

  const handleAddEntryType = () => {
    if (!newEntryLabel.trim()) return

    const value = newEntryLabel
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    if (!value) {
      toast.error('Entry type name must contain at least one alphanumeric character')
      return
    }

    const current: CustomEntryType[] = profile?.custom_entry_types ?? []

    if (current.some(t => t.value === value)) {
      toast.error('An entry type with this name already exists')
      return
    }

    if (current.length >= 20) {
      toast.error('Maximum 20 custom entry types allowed')
      return
    }

    updateProfile(
      { custom_entry_types: [...current, { value, label: newEntryLabel.trim() }] },
      {
        onSuccess: () => { setNewEntryLabel(''); toast.success('Entry type added') },
        onError: (error: Error) => toast.error(error.message || 'Failed to add entry type'),
      }
    )
  }

  const handleRemoveEntryType = (typeValue: string) => {
    const current: CustomEntryType[] = profile?.custom_entry_types ?? []
    updateProfile(
      { custom_entry_types: current.filter(t => t.value !== typeValue) },
      {
        onSuccess: () => toast.success('Entry type removed'),
        onError: (error: Error) => toast.error(error.message || 'Failed to remove entry type'),
      }
    )
  }

  const customEntryTypes: CustomEntryType[] = profile?.custom_entry_types ?? []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Theme Color */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

      {/* Custom Entry Types — stored in MongoDB via profile API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <CardTitle>Entry Types</CardTitle>
            </div>
            <CardDescription>Manage your custom log entry types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Default Entry Types</Label>
              <div className="flex flex-wrap gap-2">
                {ENTRY_TYPES.map((type) => (
                  <div key={type.value} className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium">
                    {type.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Custom Entry Types</Label>
              {customEntryTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {customEntryTypes.map((type) => (
                    <div
                      key={type.value}
                      className="px-3 py-1.5 rounded-lg bg-accent/20 text-sm font-medium flex items-center gap-2"
                    >
                      {type.label}
                      <button
                        onClick={() => handleRemoveEntryType(type.value)}
                        className="hover:text-destructive"
                        aria-label={`Remove ${type.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">No custom entry types yet</p>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Enter new entry type name"
                  value={newEntryLabel}
                  onChange={(e) => setNewEntryLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddEntryType() }
                  }}
                />
                <Button variant="outline" size="icon" onClick={handleAddEntryType} disabled={isUpdatingProfile}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Custom entry types are saved to your account and synced across devices
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed at this time</p>
            </div>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
