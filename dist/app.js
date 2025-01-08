var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { middleware } from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import { handleRoleSelection, handleRoleConfirmation, handleAddWeight, handleNewFollowers, handleSendReminder, } from "./handler";
dotenv.config();
// create LINE SDK config from env variables
const config = {
    channelSecret: process.env.CHANNEL_SECRET || "",
};
// create Express app
// about Express itself: https://expressjs.com/
const app = express();
// register a webhook handler with middleware
// about the middleware, please refer to doc
app.get("/", (req, res) => {
    console.log("work");
    res.send("Hello World!");
});
app.post("/lineWebhook", middleware(config), (req, res) => {
    console.log("req::", req.body);
    Promise.all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
        console.error(err);
        res.status(500).end();
    });
});
function handleEvent(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (event.type !== "message" || event.message.type !== "text") {
            // ignore non-text-message event
            return Promise.resolve(null);
        }
        const userMessage = event.message.text;
        if (userMessage === "選教練") {
            return handleRoleSelection(event);
        }
        // 應該要能直接針對quickreply
        if (["嚴厲教練", "色色旻柔", "雞湯教練"].includes(userMessage)) {
            return handleRoleConfirmation(event, userMessage);
        }
        const weightMatch = userMessage.match(/體重\s*(\d+(\.\d+)?)/);
        if (weightMatch) {
            return handleAddWeight(event, parseFloat(weightMatch[1]));
        }
        // TODO: 收到加好友訊息
        if (userMessage === "add") {
            return handleNewFollowers(event);
        }
        // TODO:
        if (userMessage === "提醒運動") {
            const { userId } = event.source;
            return handleSendReminder(userId, "記得運動");
        }
        return Promise.resolve();
    });
}
// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
