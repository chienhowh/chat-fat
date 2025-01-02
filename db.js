const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://chienhowh:${process.env.MONGODB_ATLAS}@cluster0.onb0g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function addWeightRecord(weightRecord) {
  return performDb("weight_records", async (collection) => {
    const result = await collection.insertOne(weightRecord);
    return result.insertedId;
  });
}

async function addRole(roleRecord) {
  return performDb("role_records", async (collection) => {
    const result = await collection.insertOne(roleRecord);
    return result.insertedId;
  });
}

async function getRole(userId) {
  return performDb("role_records", async (collection) => {
    const result = await collection.findOne({ userId });
    return result;
  });
}

async function performDb(collectionName, callback) {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const collection = await client.db("chatfat").collection(collectionName);
    return await callback(collection);
  } catch (err) {
    throw new Error(`資料庫操作失敗: ${err.message}`);
  } finally {
    await client.close();
  }
}

module.exports = { addWeightRecord, addRole, getRole };
