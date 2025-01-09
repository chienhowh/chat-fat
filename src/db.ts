import { Collection, Document, MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { PtRole, Reminder, WeightRecord } from "./types/db.interface.js";
import { throwCustomError } from "./utilites/err.js";

dotenv.config();

const uri = `mongodb+srv://chienhowh:${process.env.MONGODB_ATLAS}@cluster0.onb0g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export async function addUser(userId: string) {
  return performDb("users", async (collection) => {
    const result = await collection.insertOne({ _id: userId as any });
    return result.insertedId;
  });
}

export async function addWeighTimeReminder(userId: string, reminder: Reminder) {
  return performDb("weigh_time_reminder", async (collection) => {
    const result = await collection.updateOne(
      { userId },
      { $set: reminder },
      { upsert: true }
    );
    return result.upsertedId || null;
  });
}

export async function addWeightRecord(weightRecord: WeightRecord) {
  return performDb("weight_records", async (collection) => {
    const result = await collection.insertOne(weightRecord);
    return result.insertedId;
  });
}

export async function addRole(userId: string, ptRole: PtRole) {
  return performDb("role_records", async (collection) => {
    const result = await collection.updateOne(
      { userId },
      { $set: ptRole },
      { upsert: true }
    );
    return result.upsertedId || null;
  });
}

export async function getRole(userId: string) {
  return performDb("role_records", async (collection) => {
    const result = await collection.findOne({ userId });
    return result;
  });
}

async function performDb(
  collectionName: string,
  callback: (collection: Collection<Document>) => Promise<any>
) {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const collection = await client.db("chatfat").collection(collectionName);
    return await callback(collection);
  } catch (err) {
    throwCustomError(`資料庫操作失敗`, err);
  } finally {
    await client.close();
  }
}
