var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { throwCustomError } from "./utilites/err.js";
import { convertTime } from "./handler.js";
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
export function addUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("users", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.insertOne({
                userId,
                weighReminder: "0900",
                trainReminder: "2000",
            });
            return result.insertedId;
        }));
    });
}
export function addWeighTimeReminder(userId, reminder) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("weigh_time_reminder", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.updateOne({ userId }, { $set: reminder }, { upsert: true });
            return result.upsertedId || null;
        }));
    });
}
export function addWeightRecord(weightRecord) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("weight_records", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.insertOne(weightRecord);
            return result.insertedId;
        }));
    });
}
export function addRole(userId, ptRole) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("users", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.updateOne({ userId }, { $set: { ptRole } }, { upsert: true });
            return result.upsertedId || null;
        }));
    });
}
export function getUserProfile(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("users", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.findOne({ userId });
            return result;
        }));
    });
}
export function getPendingReminders(curTime, reminderType) {
    return __awaiter(this, void 0, void 0, function* () {
        const nowReminderTime = convertTime(curTime);
        const laterReminderTime = convertTime(new Date(curTime.getTime() + 5 * 60 * 1000));
        return performDb("users", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection
                .find({
                [reminderType]: { $gte: nowReminderTime, $lt: laterReminderTime },
            })
                .toArray();
            return result;
        }));
    });
}
function performDb(collectionName, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Connected to MongoDB!");
            const collection = yield client.db("chatfat").collection(collectionName);
            return yield callback(collection);
        }
        catch (err) {
            throwCustomError(`資料庫操作失敗`, err);
        }
        finally {
            yield client.close();
        }
    });
}
