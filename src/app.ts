import { middleware } from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import {
  handleRoleSelection,
  handleRoleConfirmation,
  handleAddWeight,
  handleNewFollowers,
  sendNotification,
  convertTime,
  sendTrainNotification,
  handleAddReminder,
} from "./handler.js";
import { LINEWebhookEvent } from "./types/global.js";
import schedule from "node-schedule";
import { getPendingReminders } from "./db.js";
import pLimit from "p-limit";

dotenv.config();
const limit = pLimit(5);
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
  if (event.type === "follow") {
    return handleNewFollowers(event);
  }

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

  const reminderMatch = userMessage.match(/[:\s]*提醒\s*(運動|測量)\s*(\d{4})/);
  if (reminderMatch) {
    const { userId } = event.source;
    const type =
      reminderMatch[1] === "運動" ? "trainReminder" : "weighReminder";
    return handleAddReminder(userId!, type, reminderMatch[2]);
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
    const startTime = convertTime(now);
    const endTime = convertTime(new Date(now.getTime() + 5 * 60 * 1000));
    const reminders = await getPendingReminders(startTime, endTime);

    if (reminders.length === 0) {
      console.log("沒有需要提醒的任務");
      return;
    }

    // 根據提醒類型分類用戶
    const weighUsers = reminders.filter(
      (user) =>
        user.weighReminder &&
        user.weighReminder >= startTime &&
        user.weighReminder < endTime
    );

    const trainUsers = reminders.filter(
      (user) =>
        user.trainReminder &&
        user.trainReminder >= startTime &&
        user.trainReminder < endTime
    );

    await Promise.all(
      weighUsers.map((reminder) =>
        limit(() =>
          sendNotification(reminder).catch((error) => {
            console.error(`發送測量通知給 ${reminder.userName} 失敗:`, error);
            return null;
          })
        )
      )
    );

    await Promise.all(
      trainUsers.map((reminder) =>
        limit(() =>
          sendTrainNotification(reminder).catch((error) => {
            console.error(`發送訓練通知給 ${reminder.userName} 失敗:`, error);
            return null;
          })
        )
      )
    );
  } catch (err) {
    console.error("處理提醒時出錯:", err);
  }
});
