'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, parseISO, differenceInHours } from 'date-fns'
import { Calendar, TrendingUp, Target, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ENTRY_TYPE_LABELS } from '@/lib/constants'
import type { Log } from '@/lib/types'
import { useMemo } from 'react'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316']

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(100)

      if (error) throw error
      return (data || []) as Log[]
    },
    staleTime: 60 * 1000,
  })

  // Check if logged today
  const hasLoggedToday = logs.some((log) => log.date === today)

  // Calculate streak
  const calculateStreak = () => {
    const uniqueDates = Array.from(new Set(logs.map((log) => log.date))).sort().reverse()
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = format(subDays(today, i), 'yyyy-MM-dd')
      if (uniqueDates[i] === expectedDate) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const streak = calculateStreak()

  // Upcoming deadlines (within 48 hours)
  const upcomingDeadlines = logs.filter((log) => {
    if (!log.deadline) return false
    const deadlineDate = new Date(log.deadline)
    const hoursUntil = differenceInHours(deadlineDate, new Date())
    return hoursUntil > 0 && hoursUntil <= 48
  })

  // Chart data: entries per day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const count = logs.filter((log) => log.date === date).length
    return {
      date: format(parseISO(date), 'MMM dd'),
      count,
    }
  })

  // Distribution by type
  const typeDistribution = Object.keys(ENTRY_TYPE_LABELS).map((type) => {
    const count = logs.filter((log) => log.entry_type === type).length
    return {
      name: ENTRY_TYPE_LABELS[type],
      value: count,
    }
  }).filter((item) => item.value > 0)

  // Most used type
  const mostUsedType = typeDistribution.reduce(
    (max, item) => (item.value > max.value ? item : max),
    { name: 'None', value: 0 }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/logs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Log
        </Link>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {!hasLoggedToday && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-yellow-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  You haven't logged today
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  <Link
                    href="/dashboard/logs/new"
                    className="underline hover:text-yellow-900"
                  >
                    Add today's log
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {upcomingDeadlines.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-red-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Upcoming deadlines (within 48 hours)
                </p>
                <ul className="mt-2 space-y-1">
                  {upcomingDeadlines.map((log) => (
                    <li key={log.id} className="text-sm text-red-700">
                      <Link
                        href={`/dashboard/logs/${log.id}/edit`}
                        className="underline hover:text-red-900"
                      >
                        {log.title}
                      </Link>
                      {' - '}
                      {log.deadline && format(new Date(log.deadline), 'MMM dd, yyyy h:mm a')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Logs
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {logs.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Current Streak
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {streak} days
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Most Used Type
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 truncate">
                    {mostUsedType.name}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Logs per Day (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Logs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribution by Type
          </h2>
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
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No logs yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
