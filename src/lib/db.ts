import mongoose from "mongoose";

const MONGODB_URI = (() => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required");
  }
  return uri;
})();

interface MongooseCache {
  conn: typeof import("mongoose") | null;
  promise: Promise<typeof import("mongoose")> | null;
}

const globalWithMongoose = global as typeof globalThis & { mongoose?: MongooseCache };

const cached = globalWithMongoose.mongoose ?? (globalWithMongoose.mongoose = { conn: null, promise: null });

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
