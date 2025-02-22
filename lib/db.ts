import { MongoClient } from "mongodb"
import mongoose, { Mongoose } from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
type MongoClientType = MongoClient | mongoose.mongo.MongoClient
let client: MongoClientType

let globalWithMongo = global as typeof globalThis & {
    _mongooseClient?: Mongoose
}

export const clientPromise = async () => {
    await connectToDB()

    return Promise.resolve<MongoClientType>(client)
}

export const connectToDB = async () => {

    if (process.env.NODE_ENV === 'development') {

        if (!globalWithMongo._mongooseClient) {
            globalWithMongo._mongooseClient = await mongoose.connect(uri)
        }

        client = globalWithMongo._mongooseClient.connection.getClient()
    } else {
        let _client = await mongoose.connect(uri)
        client = _client.connection.getClient()
    }
}


// import mongoose, { Mongoose } from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) {
//   throw new Error('❌ Missing environment variable: "MONGODB_URI"');
// }

// // Global variable to store the connection in development
// let globalWithMongo = global as typeof globalThis & { mongooseClient?: Mongoose };

// // Async function to connect to MongoDB
// export const connectToDB = async () => {
//   try {
//     if (globalWithMongo.mongooseClient) {
//       console.log("🔄 Using existing MongoDB connection...");
//       return globalWithMongo.mongooseClient;
//     }

//     console.log("⏳ Connecting to MongoDB...");

//     const connection = await mongoose.connect(MONGODB_URI, {
//       tls: true, // Ensure TLS is enabled for MongoDB Atlas
//     });

//     console.log("✅ Connected to MongoDB!");

//     if (process.env.NODE_ENV === 'development') {
//       globalWithMongo.mongooseClient = connection;
//     }

//     return connection;
//   } catch (error) {
//     console.error("❌ MongoDB connection error:", error);
//     process.exit(1);
//   }
// };

// // Export a reusable function to get the client (if needed)
// export const getClient = () => mongoose.connection.getClient();
