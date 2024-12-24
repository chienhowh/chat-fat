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
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log("Connected to MongoDB!");

    const result = await client
      .db("chatfat")
      .collection("weight_records")
      .insertOne(weightRecord);

    console.log("Document inserted with ID:", result.insertedId);
    return result.insertedId;
  } catch (err) {
    console.error("Error inserting record:", err);
    throw new Error("資料庫操作失敗");
  } finally {
    await client.close();
  }
}

module.exports = addWeightRecord;
