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
  daily_work: 'bg-blue-100 text-blue-800',
  goal_progress: 'bg-purple-100 text-purple-800',
  learning: 'bg-green-100 text-green-800',
  win: 'bg-yellow-100 text-yellow-800',
  help_given: 'bg-pink-100 text-pink-800',
  feedback_received: 'bg-indigo-100 text-indigo-800',
  leave: 'bg-gray-100 text-gray-800',
}
