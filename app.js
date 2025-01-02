const line = require("@line/bot-sdk");
const express = require("express");
const axios = require("axios");
const { addWeightRecord, addRole } = require("./db");

require("dotenv").config();

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.get("/", (req, res) => {
  console.log("work");
  res.send("Hello World!");
});

app.post("/lineWebhook", line.middleware(config), (req, res) => {
  console.log("req::", req.body);
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const weightMatch = userMessage.match(/體重\s*(\d+(\.\d+)?)/);

  if (userMessage === "選角色") {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "請選擇您的專屬教練：",
          quickReply: {
            items: [
              {
                type: "action",
                action: {
                  label: "A.嚴厲教練",
                  text: "嚴厲教練",
                },
              },
              {
                type: "action",
                action: {
                  label: "B.色色旻柔",
                  text: "色色旻柔",
                },
              },
            ],
          },
        },
      ],
    });
  }

  if (["嚴厲教練", "色色旻柔"].includes(userMessage)) {
    const { userId } = event.source;
    await addRole({ userId, role: userMessage });
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `您選擇了${userMessage}`,
        },
      ],
    });
  }

  if (weightMatch) {
    try {
      const weight = parseFloat(weightMatch[1]); // 提取體重數值
      let displayName = "您";
      const { userId } = event.source;
      const profile = await getUserProfile(event.source);
      console.log(" handleEvent ~ profile:", profile);
      displayName = profile.displayName;

      await addWeightRecord({
        userId,
        weight,
        timestamp: new Date(),
        note: "",
      });

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `已記錄${displayName}的體重 ${weight} kg, ${coachReply()}`,
          },
        ],
      });
    } catch (err) {
      console.log("err::", err);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: "無法記錄體重，請稍後再試！",
          },
        ],
      });
    }
  }

  return Promise.resolve();
}

// 取得使用者名稱的輔助函數
async function getUserProfile(source) {
  const { type, groupId, userId } = source;
  try {
    let response;
    if (type === "group") {
      response = await client.getGroupMemberProfile(groupId, userId);
    } else {
      response = await client.getProfile(userId);
    }
    return response;
  } catch (err) {
    throw new Error(`取得使用者名稱${userId}時出錯:`, err);
  }
}

function coachReply() {
  const responses = [
    "這麼胖還有臉報告？",
    "還敢吃？訓練量加倍！",
    "體重還在飆？今天卡路里砍一半！",
    "努力呢？還想繼續放縱嗎？",
    "你是在給我交代，還是給自己找藉口？",
  ];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
