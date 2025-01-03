const line = require("@line/bot-sdk");
const express = require("express");
const {
  handleAddWeight,
  handleRoleSelection,
  handleRoleConfirmation,
} = require("./handler");

require("dotenv").config();

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
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

app.post("/lineWebhook", line.middleware(config), (req, res) => {
  console.log("req::", req.body);
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  if (userMessage === "選教練") {
    return handleRoleSelection(event);
  }

  if (["嚴厲教練", "色色旻柔", "雞湯教練"].includes(userMessage)) {
    return handleRoleConfirmation(event, userMessage);
  }

  const weightMatch = userMessage.match(/體重\s*(\d+(\.\d+)?)/);
  if (weightMatch) {
    return handleAddWeight(event, parseFloat(weightMatch[1]));
  }

  return Promise.resolve();
}

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
