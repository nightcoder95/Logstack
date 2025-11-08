'use client'

import { Calendar, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { motion } from 'framer-motion'
import type { Log } from '@/lib/types'

type Notification = {
  id: string
  type: 'missing_log' | 'deadline' | 'streak'
  title: string
  message: string
  link: string
  priority: number
  icon: React.ReactNode
  variant: 'default' | 'warning' | 'info'
}

type Props = {
  hasLoggedToday: boolean
  upcomingDeadlines: Log[]
  streak: number
}

export function NotificationCard({ hasLoggedToday, upcomingDeadlines, streak }: Props) {
  const notifications: Notification[] = []

  // Add missing log notification (high priority)
  if (!hasLoggedToday) {
    notifications.push({
      id: 'missing-log',
      type: 'missing_log',
      title: "Haven't logged today",
      message: 'Keep your streak going by adding today\'s log',
      link: '/dashboard/logs/new',
      priority: 1,
      icon: <Calendar className="h-4 w-4" />,
      variant: 'warning',
    })
  }

  // Add deadline notifications (medium priority)
  upcomingDeadlines.forEach((log, index) => {
    notifications.push({
      id: `deadline-${log.id}`,
      type: 'deadline',
      title: log.title,
      message: log.deadline
        ? `Due ${format(new Date(log.deadline), 'MMM dd, h:mm a')}`
        : 'Deadline soon',
      link: `/dashboard/logs/${log.id}/edit`,
      priority: 2 + index,
      icon: <Clock className="h-4 w-4" />,
      variant: 'default',
    })
  })

  // Add streak notification if streak > 0 (low priority)
  if (streak > 0 && hasLoggedToday) {
    notifications.push({
      id: 'streak',
      type: 'streak',
      title: `${streak} day streak!`,
      message: 'Great job maintaining your logging habit',
      link: '/dashboard',
      priority: 100,
      icon: <TrendingUp className="h-4 w-4" />,
      variant: 'info',
    })
  }

  // Sort by priority
  const sortedNotifications = notifications.sort((a, b) => a.priority - b.priority)

  const getVariantStyles = (variant: Notification['variant']) => {
    switch (variant) {
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-500/10'
      case 'info':
        return 'border-l-4 border-l-accent bg-accent/10'
      default:
        return 'border-l-4 border-l-red-500 bg-red-500/10'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Notifications & Reminders</CardTitle>
        <CardDescription>Stay on top of your tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>All caught up! No notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={notification.link}>
                  <div
                    className={`p-4 rounded-lg transition-all hover:scale-[1.02] cursor-pointer ${getVariantStyles(
                      notification.variant
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{notification.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        {notification.type === 'missing_log' && 'Action needed'}
                        {notification.type === 'deadline' && 'Upcoming'}
                        {notification.type === 'streak' && 'Achievement'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
