import { Collection, Document, MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { UserRole, WeightRecord } from "./types/db.interface.js";
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

export async function addUser(userId: string, data: any) {
  return performDb("users", async (collection) => {
    const result = await collection.updateOne(
      { userId },
      { $set: data },
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

export async function addRole(userId: string, ptRole: string) {
  return performDb("users", async (collection) => {
    const result = await collection.updateOne(
      { userId },
      { $set: { ptRole } },
      { upsert: true }
    );
    return result.upsertedId || null;
  });
}

export async function getUserProfile(userId: string): Promise<UserRole> {
  return performDb("users", async (collection) => {
    const result = await collection.findOne({ userId });
    return result;
  });
}

export async function getPendingReminders(
  startTime: string,
  endTime: string
): Promise<UserRole[]> {
  return performDb("users", async (collection) => {
    const result = await collection
      .find({
        $or: [
          { weighReminder: { $gte: startTime, $lt: endTime } },
          { trainReminder: { $gte: startTime, $lt: endTime } },
        ],
      })
      .toArray();
    return result;
  });
}

export async function addReminder(
  userId: string,
  reminder: any
): Promise<UserRole[]> {
  return performDb("users", async (collection) => {
    const result = await collection.updateOne(
      { userId },
      { $set: reminder },
      { upsert: true }
    );
    return result.upsertedId || null;
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

process.on("SIGINT", async () => {
  console.log("Closing connection...");
  process.exit(0);
});
