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
  daily_work: 'bg-blue-500/30 text-blue-200 border-blue-400/50 hover:bg-blue-500/40',
  goal_progress: 'bg-purple-500/30 text-purple-200 border-purple-400/50 hover:bg-purple-500/40',
  learning: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50 hover:bg-emerald-500/40',
  win: 'bg-amber-500/30 text-amber-200 border-amber-400/50 hover:bg-amber-500/40',
  help_given: 'bg-pink-500/30 text-pink-200 border-pink-400/50 hover:bg-pink-500/40',
  feedback_received: 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50 hover:bg-indigo-500/40',
  leave: 'bg-slate-500/30 text-slate-200 border-slate-400/50 hover:bg-slate-500/40',
}

export const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  daily_work: { bg: 'rgba(59, 130, 246, 0.3)', text: 'rgb(191, 219, 254)', border: 'rgba(96, 165, 250, 0.5)' },
  goal_progress: { bg: 'rgba(168, 85, 247, 0.3)', text: 'rgb(233, 213, 255)', border: 'rgba(192, 132, 252, 0.5)' },
  learning: { bg: 'rgba(16, 185, 129, 0.3)', text: 'rgb(167, 243, 208)', border: 'rgba(52, 211, 153, 0.5)' },
  win: { bg: 'rgba(245, 158, 11, 0.3)', text: 'rgb(253, 230, 138)', border: 'rgba(251, 191, 36, 0.5)' },
  help_given: { bg: 'rgba(236, 72, 153, 0.3)', text: 'rgb(251, 207, 232)', border: 'rgba(244, 114, 182, 0.5)' },
  feedback_received: { bg: 'rgba(99, 102, 241, 0.3)', text: 'rgb(199, 210, 254)', border: 'rgba(129, 140, 248, 0.5)' },
  leave: { bg: 'rgba(100, 116, 139, 0.3)', text: 'rgb(226, 232, 240)', border: 'rgba(148, 163, 184, 0.5)' },
}
