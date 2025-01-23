import { middleware } from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import {
  handleRoleSelection,
  handleRoleConfirmation,
  handleAddWeight,
  handleNewFollowers,
  handleSendReminder,
  sendNotification,
} from "./handler.js";
import { LINEWebhookEvent } from "./types/global.js";
import schedule from "node-schedule";
import { getPendingReminders } from "./db.js";
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
app.get("/", (req: any, res: any) => {
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

async function handleEvent(event: LINEWebhookEvent) {
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
    return handleSendReminder(userId!, "記得運動");
  }

  return Promise.resolve();
}

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

schedule.scheduleJob("*/5 * * * *", async () => {
  console.log(`檢查提醒時間範圍: ${new Date().toISOString()}`);
  try {
    const now = new Date();
    const reminders = await getPendingReminders(now, "weighReminder");
    console.log("🚀 ~ schedule.scheduleJob ~ reminders:", reminders);
    if (reminders.length === 0) {
      console.log("沒有需要提醒的任務");
      return;
    }

    for (const reminder of reminders) {
      console.log(`提醒用戶 ${reminder.userId}, ${reminder.userName}`);
      await sendNotification(reminder);
    }
  } catch (err) {
    console.error("處理提醒時出錯:", err);
  }
});
