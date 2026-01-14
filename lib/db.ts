import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
    throw new Error("Please define MONGODB_URI in .env.local");
}

interface MongoCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
 var mongooseCache: MongoCache | undefined;
}
let cached = global.mongooseCache

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGO_URI);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
 