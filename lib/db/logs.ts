import { ObjectId, Sort } from 'mongodb'
import { getLogsCollection } from '../mongodb'
import type { Log } from '../types'

export interface LogDocument {
  _id: ObjectId
  userId: ObjectId
  date: string
  entryType: string
  title: string
  todos: { text: string; done: boolean }[] | null
  description: string | null
  deadline: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateLogInput {
  userId: string
  title: string
  entryType: string
  date: string
  todos?: { text: string; done: boolean }[] | null
  description?: string | null
  deadline?: string | null
}

export interface UpdateLogInput {
  title?: string
  entryType?: string
  date?: string
  todos?: { text: string; done: boolean }[] | null
  description?: string | null
  deadline?: string | null
}

export interface LogsQueryOptions {
  userId: string
  searchTerm?: string
  selectedTypes?: string[]
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeDeleted?: boolean
}

// Maps client-facing snake_case sort keys to MongoDB camelCase field names
const SORT_FIELD_MAP: Record<string, string> = {
  date: 'date',
  title: 'title',
  created_at: 'createdAt',
  createdAt: 'createdAt',
  updated_at: 'updatedAt',
  updatedAt: 'updatedAt',
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id
}

function documentToLog(doc: LogDocument): Log {
  return {
    id: doc._id.toString(),
    user_id: doc.userId.toString(),
    date: doc.date,
    entry_type: doc.entryType,
    title: doc.title,
    todos: doc.todos ?? null,
    description: doc.description,
    deadline: doc.deadline,
    deleted_at: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  }
}

export async function createLog(input: CreateLogInput): Promise<Log> {
  const collection = await getLogsCollection()
  const now = new Date()

  const doc: Omit<LogDocument, '_id'> = {
    userId: new ObjectId(input.userId),
    date: input.date,
    entryType: input.entryType,
    title: input.title,
    todos: input.todos ?? null,
    description: input.description ?? null,
    deadline: input.deadline ?? null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collection.insertOne(doc as LogDocument)
  return documentToLog({ ...doc, _id: result.insertedId } as LogDocument)
}

export async function updateLog(id: string, userId: string, input: UpdateLogInput): Promise<Log | null> {
  if (!isValidObjectId(id)) return null

  const collection = await getLogsCollection()
  const now = new Date()

  const updateDoc: Record<string, unknown> = { updatedAt: now }

  if (input.title !== undefined) updateDoc.title = input.title
  if (input.entryType !== undefined) updateDoc.entryType = input.entryType
  if (input.date !== undefined) updateDoc.date = input.date
  if (input.todos !== undefined) updateDoc.todos = input.todos
  if (input.description !== undefined) updateDoc.description = input.description
  if (input.deadline !== undefined) updateDoc.deadline = input.deadline

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), userId: new ObjectId(userId), deletedAt: null },
    { $set: updateDoc },
    { returnDocument: 'after' }
  )

  return result ? documentToLog(result as LogDocument) : null
}

export async function softDeleteLog(id: string, userId: string): Promise<boolean> {
  if (!isValidObjectId(id)) return false

  const collection = await getLogsCollection()
  const now = new Date()

  const result = await collection.updateOne(
    { _id: new ObjectId(id), userId: new ObjectId(userId), deletedAt: null },
    { $set: { deletedAt: now, updatedAt: now } }
  )

  return result.modifiedCount > 0
}

export async function bulkSoftDeleteLogs(ids: string[], userId: string): Promise<number> {
  const validIds = ids.filter(isValidObjectId)
  if (validIds.length === 0) return 0

  const collection = await getLogsCollection()
  const now = new Date()

  const result = await collection.updateMany(
    { _id: { $in: validIds.map(id => new ObjectId(id)) }, userId: new ObjectId(userId), deletedAt: null },
    { $set: { deletedAt: now, updatedAt: now } }
  )

  return result.modifiedCount
}

export async function getLogById(id: string, userId: string): Promise<Log | null> {
  if (!isValidObjectId(id)) return null

  const collection = await getLogsCollection()

  const doc = await collection.findOne({
    _id: new ObjectId(id),
    userId: new ObjectId(userId),
    deletedAt: null,
  })

  return doc ? documentToLog(doc as LogDocument) : null
}

export async function getLogs(options: LogsQueryOptions): Promise<{ logs: Log[]; total: number }> {
  const collection = await getLogsCollection()

  const query: Record<string, unknown> = {
    userId: new ObjectId(options.userId),
  }

  if (!options.includeDeleted) {
    query.deletedAt = null
  }

  if (options.selectedTypes && options.selectedTypes.length > 0) {
    query.entryType = { $in: options.selectedTypes }
  }

  if (options.startDate || options.endDate) {
    const dateQuery: Record<string, string> = {}
    if (options.startDate) dateQuery.$gte = options.startDate
    if (options.endDate) dateQuery.$lte = options.endDate
    query.date = dateQuery
  }

  if (options.searchTerm) {
    query.$or = [
      { title: { $regex: options.searchTerm, $options: 'i' } },
      { description: { $regex: options.searchTerm, $options: 'i' } },
    ]
  }

  const sortField = SORT_FIELD_MAP[options.sortBy ?? 'date'] ?? 'date'
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1
  const sort: Sort = { [sortField]: sortDirection }

  const limit = Math.min(options.limit ?? 10, 100)
  const offset = options.offset ?? 0

  const [docs, total] = await Promise.all([
    collection.find(query).sort(sort).skip(offset).limit(limit).toArray(),
    collection.countDocuments(query),
  ])

  return {
    logs: docs.map(doc => documentToLog(doc as LogDocument)),
    total,
  }
}

export interface LogStats {
  totalLogs: number
  logsByType: Record<string, number>
  logsThisMonth: number
  logsThisWeek: number
  logsToday: number
  streak: number
  hasLoggedToday: boolean
  upcomingDeadlines: Log[]
}

export async function getLogStats(userId: string): Promise<LogStats> {
  if (!isValidObjectId(userId)) {
    return { totalLogs: 0, logsByType: {}, logsThisMonth: 0, logsThisWeek: 0, logsToday: 0, streak: 0, hasLoggedToday: false, upcomingDeadlines: [] }
  }

  const collection = await getLogsCollection()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStartStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

  const baseQuery = { userId: new ObjectId(userId), deletedAt: null }

  const [totalLogs, logsByTypeAgg, logsThisMonth, logsThisWeek, logsToday, allDates, upcomingDeadlineDocs] =
    await Promise.all([
      collection.countDocuments(baseQuery),
      collection
        .aggregate<{ _id: string; count: number }>([
          { $match: baseQuery },
          { $group: { _id: '$entryType', count: { $sum: 1 } } },
        ])
        .toArray(),
      collection.countDocuments({ ...baseQuery, date: { $gte: monthStartStr } }),
      collection.countDocuments({ ...baseQuery, date: { $gte: weekAgoStr } }),
      collection.countDocuments({ ...baseQuery, date: todayStr }),
      // All unique log dates for streak calculation
      collection.distinct('date', baseQuery),
      // Upcoming deadlines within 48 hours
      collection
        .find({ ...baseQuery, deadline: { $gt: now.toISOString(), $lte: fortyEightHoursLater } })
        .limit(10)
        .toArray(),
    ])

  // Streak calculation (UTC dates)
  const sortedDates = (allDates as string[]).sort().reverse()
  let streak = 0
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    if (sortedDates[i] === expected) {
      streak++
    } else {
      break
    }
  }

  const logsByType: Record<string, number> = {}
  for (const item of logsByTypeAgg) {
    logsByType[item._id] = item.count
  }

  return {
    totalLogs,
    logsByType,
    logsThisMonth,
    logsThisWeek,
    logsToday,
    streak,
    hasLoggedToday: logsToday > 0,
    upcomingDeadlines: upcomingDeadlineDocs.map(doc => documentToLog(doc as LogDocument)),
  }
}
