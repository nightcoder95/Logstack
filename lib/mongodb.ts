import { MongoClient, MongoClientOptions } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const uri = process.env.MONGODB_URI
      if (!uri) {
        throw new Error('Please add your MONGODB_URI to .env.local')
      }
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Please add your MONGODB_URI to .env.local')
  }
  const client = new MongoClient(uri, options)
  return client.connect()
}

// Thenable that defers MongoDB connection until first awaited.
// This prevents build-time errors when env vars are not available.
const clientPromise: Promise<MongoClient> = {
  then(onfulfilled, onrejected) {
    return getClientPromise().then(onfulfilled, onrejected)
  },
  catch(onrejected) {
    return getClientPromise().catch(onrejected)
  },
  finally(onfinally) {
    return getClientPromise().finally(onfinally)
  },
  [Symbol.toStringTag]: 'MongoClientPromise',
} as Promise<MongoClient>

export async function getDb() {
  const client = await clientPromise
  const dbName = process.env.MONGODB_DB
  if (!dbName) {
    throw new Error('Please add your MONGODB_DB to .env.local')
  }
  return client.db(dbName)
}

export async function getLogsCollection() {
  const db = await getDb()
  return db.collection('logs')
}

export async function getUsersCollection() {
  const db = await getDb()
  return db.collection('users')
}

export default clientPromise
