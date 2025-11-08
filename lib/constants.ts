export const ENTRY_TYPES = [
  { value: 'daily_work', label: 'Daily Work' },
  { value: 'goal_progress', label: 'Goal Progress' },
  { value: 'learning', label: 'Learning' },
  { value: 'win', label: 'Win / Achievement' },
  { value: 'help_given', label: 'Help Given' },
  { value: 'feedback_received', label: 'Feedback Received' },
  { value: 'leave', label: 'Leave' },
] as const

export const ENTRY_TYPE_LABELS: Record<string, string> = {
  daily_work: 'Daily Work',
  goal_progress: 'Goal Progress',
  learning: 'Learning',
  win: 'Win',
  help_given: 'Help Given',
  feedback_received: 'Feedback Received',
  leave: 'Leave',
}

export const TYPE_COLORS: Record<string, string> = {
  daily_work: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  goal_progress: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  learning: 'bg-green-500/20 text-green-300 border-green-500/30',
  win: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  help_given: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  feedback_received: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  leave: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
}
