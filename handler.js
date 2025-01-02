const { addWeightRecord, addRole, getRole } = require("./db");

async function handleRoleSelection(event) {
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
                type: "message",
                label: "A.嚴厲教練",
                text: "嚴厲教練",
              },
            },
            {
              type: "action",
              action: {
                type: "message",
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

async function handleRoleConfirmation(event, role) {
  const { userId } = event.source;
  await addRole({ userId, role });
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: `您選擇了${role}做為您的教練!`,
      },
    ],
  });
}

async function handleAddWeight(event, weight) {
  try {
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

    const role = await getRole(userId);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `已記錄${displayName}的體重 ${weight} kg, ${coachReply(role)}`,
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

// Line API
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
// Line API End

function coachReply(ptRole) {
  const role = ptRole ? ptRole.role : "嚴厲教練";
  let responses = [];
  if (role === "色色旻柔") {
    responses = [
      "深蹲記得下到底，像你談感情一樣，別老卡在半空中！",
      "杠鈴舉不起來？我看你手機挺能舉，來點平衡感吧！",
      "臥推推不動？平時不是挺會撩嗎？力氣去哪了？",
      "拉伸的時候別害羞，動作大點，這姿勢你應該不陌生吧？",
      "看到跑步機就累？平常追人挺積極的啊，跑起來！",
    ];
  } else {
    responses = [
      "這麼胖還有臉報告？",
      "還敢吃？訓練量加倍！",
      "體重還在飆？今天卡路里砍一半！",
      "努力呢？還想繼續放縱嗎？",
      "你是在給我交代，還是給自己找藉口？",
    ];
  }
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

module.exports = {
  handleRoleSelection,
  handleRoleConfirmation,
  handleAddWeight,
};
