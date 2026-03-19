import { MongoClient, MongoClientOptions } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var mongoClient: MongoClient | undefined
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!uri) {
  throw new Error('Please add your MONGODB_URI to .env.local')
}

if (!dbName) {
  throw new Error('Please add your MONGODB_DB to .env.local')
}

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global.mongoClient) {
    global.mongoClient = new MongoClient(uri, options)
  }
  client = global.mongoClient
  clientPromise = client.connect()
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getDb() {
  const client = await clientPromise
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
