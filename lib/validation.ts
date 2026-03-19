import { z } from 'zod'

// Entry type enum values from constants
export const ENTRY_TYPE_VALUES = [
  'daily_work',
  'goal_progress',
  'learning',
  'win',
  'help_given',
  'feedback_received',
  'leave',
] as const

// Todo schema
export const todoSchema = z.object({
  text: z.string().min(1, 'Todo text is required').max(500, 'Todo text must be less than 500 characters'),
  done: z.boolean().default(false),
})

// Custom entry type schema
export const customEntryTypeSchema = z.object({
  value: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Value must be lowercase alphanumeric with underscores'),
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
})

// User preferences schema
export const preferencesSchema = z.object({
  accentColor: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

// Log schema for create/update
export const logSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  entry_type: z.enum(ENTRY_TYPE_VALUES, {
    message: 'Invalid entry type',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  todos: z.array(todoSchema).max(20, 'Maximum 20 todos allowed').nullable().optional(),
  description: z.string().max(50000, 'Description must be less than 50000 characters').nullable().optional(),
  deadline: z.string().nullable().optional(),
})

// Log schema for partial updates
export const logUpdateSchema = logSchema.partial().extend({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
})

// Profile schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .nullable(),
  avatar_url: z.string().url('Invalid avatar URL').max(500, 'URL too long').nullable().optional(),
  custom_entry_types: z.array(customEntryTypeSchema).max(20, 'Maximum 20 custom entry types').optional(),
  preferences: preferencesSchema.optional(),
})

// Auth schemas
export const authSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
})

export const loginSchema = authSchema

export const signupSchema = authSchema.extend({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional(),
})

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
})

// Bulk delete schema
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required').max(100, 'Maximum 100 items at a time'),
})

// Query params schema for logs list
export const logsQuerySchema = z.object({
  searchTerm: z.string().max(200).optional(),
  selectedTypes: z.array(z.string()).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['date', 'title', 'created_at', 'updated_at']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeDeleted: z.coerce.boolean().default(false),
})

// Type exports
export type LogInput = z.infer<typeof logSchema>
export type LogUpdateInput = z.infer<typeof logUpdateSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
export type CustomEntryTypeInput = z.infer<typeof customEntryTypeSchema>
export type AuthInput = z.infer<typeof authSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
export type LogsQueryInput = z.infer<typeof logsQuerySchema>
export type TodoInput = z.infer<typeof todoSchema>
