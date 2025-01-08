"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUser = addUser;
exports.addWeighTimeReminder = addWeighTimeReminder;
exports.addWeightRecord = addWeightRecord;
exports.addRole = addRole;
exports.getRole = getRole;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const err_1 = require("./utilites/err");
dotenv_1.default.config();
const uri = `mongodb+srv://chienhowh:${process.env.MONGODB_ATLAS}@cluster0.onb0g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
function addUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("users", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.insertOne({ _id: userId });
            return result.insertedId;
        }));
    });
}
function addWeighTimeReminder(userId, reminder) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("weigh_time_reminder", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.updateOne({ userId }, { $set: reminder }, { upsert: true });
            return result.upsertedId || null;
        }));
    });
}
function addWeightRecord(weightRecord) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("weight_records", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.insertOne(weightRecord);
            return result.insertedId;
        }));
    });
}
function addRole(userId, ptRole) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("role_records", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.updateOne({ userId }, { $set: ptRole }, { upsert: true });
            return result.upsertedId || null;
        }));
    });
}
function getRole(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return performDb("role_records", (collection) => __awaiter(this, void 0, void 0, function* () {
            const result = yield collection.findOne({ userId });
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
            (0, err_1.throwCustomError)(`資料庫操作失敗`, err);
        }
        finally {
            yield client.close();
        }
    });
}
