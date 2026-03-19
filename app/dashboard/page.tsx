'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Calendar, TrendingUp, Target, Plus } from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ENTRY_TYPE_LABELS } from '@/lib/constants'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NotificationCard } from '@/components/NotificationCard'
import type { LogStats } from '@/lib/db/logs'

const COLORS = ['hsl(var(--accent))', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316']

export default function DashboardPage() {
  const { data: session } = useSession()

  const { data: stats, isLoading } = useQuery<LogStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('/api/logs/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: !!session?.user?.id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  })

  // Derive chart data from aggregated stats (no record limit — always accurate)
  const typeDistribution = Object.entries(stats?.logsByType ?? {})
    .map(([type, count]) => ({
      name: ENTRY_TYPE_LABELS[type] ?? type,
      value: count,
    }))
    .filter(item => item.value > 0)

  const mostUsedType = typeDistribution.reduce(
    (max, item) => (item.value > max.value ? item : max),
    { name: 'None', value: 0 }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg text-muted-foreground"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to your work log</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/logs/new">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Log
          </Link>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalLogs ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Entries recorded</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.streak ?? 0} days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Type</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{mostUsedType.name}</div>
            <p className="text-xs text-muted-foreground mt-1">{mostUsedType.value} entries</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts and Notifications */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution by Type</CardTitle>
            <CardDescription>Your log entries by category</CardDescription>
          </CardHeader>
          <CardContent>
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No logs yet
              </div>
            )}
          </CardContent>
        </Card>

        <NotificationCard
          hasLoggedToday={stats?.hasLoggedToday ?? false}
          upcomingDeadlines={stats?.upcomingDeadlines ?? []}
          streak={stats?.streak ?? 0}
        />
      </motion.div>
    </motion.div>
  )
}
