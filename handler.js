const { addWeightRecord, addRole, getRole } = require("./db");
require("dotenv").config();
const line = require("@line/bot-sdk");
// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

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
            {
              type: "action",
              action: {
                type: "message",
                label: "C.雞湯教練",
                text: "雞湯教練",
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
  await addRole(userId, { userId, role });
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
    const messages = [
      {
        type: "text",
        text: `已記錄${displayName}的體重 ${weight} kg`,
      },
      {
        type: "text",
        text: role
          ? coachReply(role)
          : "您尚未選擇教練，可輸入'選教練'挑選您的專屬教練!",
      },
    ];

    return client.replyMessage({
      replyToken: event.replyToken,
      messages,
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
  const coaches = [
    {
      name: "嚴厲教練",
      quotes: [
        "這麼胖還有臉報告？",
        "還敢吃？訓練量加倍！",
        "體重還在飆？今天卡路里砍一半！",
        "努力呢？還想繼續放縱嗎？",
        "你是在給我交代，還是給自己找藉口？",
      ],
    },
    {
      name: "色色旻柔",
      quotes: [
        "深蹲記得下到底，像你談感情一樣，別老卡在半空中！",
        "杠鈴舉不起來？我看你手機挺能舉，來點平衡感吧！",
        "臥推推不動？平時不是挺會撩嗎？力氣去哪了？",
        "拉伸的時候別害羞，動作大點，這姿勢你應該不陌生吧？",
        "看到跑步機就累？平常追人挺積極的啊，跑起來！",
      ],
    },
    {
      name: "雞湯教練",
      quotes: [
        "每一次的流汗，都是你對未來自己的承諾，加油！",
        "不需要和別人比，只需要每天都比昨天的自己強一點！",
        "你能做到的，比你想像的更多，別放棄！",
        "健身路上，最難的不是重量，而是堅持，但我知道你可以！",
        "今天的你，會成為明天的榜樣！",
      ],
    },
    // {
    //   name: "搞笑教練",
    //   quotes: [
    //     "深蹲的時候別翹屁股！你是來健身的，不是來跳舞的！",
    //     "臥推的時候別亂叫，隔壁以為我們在比賽吶喊呢！",
    //     "跑步機沒壞，你慢一點它不會加速的，別害怕！",
    //     "今天吃多了吧？沒事，我們來個雙倍燃脂套餐！",
    //     "啞鈴掉了？沒事，心態不能掉，撿起來繼續幹！",
    //   ],
    // },
    // {
    //   name: "佛系教練",
    //   quotes: [
    //     "力量，不是比誰更強，而是找到自己的平衡。試著再多一點吧。",
    //     "你感覺疲憊，因為你已經在突破舒適區了。很好，繼續吧。",
    //     "每一個動作，都是和身體的一場對話，你聽見它的聲音了嗎？",
    //     "流汗的瞬間，時間彷彿靜止，這才是真正的當下。",
    //     "你的對手不是別人，而是你曾經的藉口。",
    //   ],
    // },
    // {
    //   name: "科學教練",
    //   quotes: [
    //     "深蹲的角度控制在膝蓋不超過腳尖，這樣能保護你的關節。",
    //     "40分鐘後，糖原消耗會開始分解脂肪，這就是為什麼我們要堅持有氧運動！",
    //     "肌肉生長需要足夠的蛋白質和休息，別忘了訓練後補充營養！",
    //     "力量訓練後心跳維持在燃脂區，可以幫你更有效減重！",
    //     "你感到酸痛是因為乳酸堆積，記得適當拉伸和放鬆。",
    //   ],
    // },
    // {
    //   name: "溫柔教練",
    //   quotes: [
    //     "今天的狀態怎麼樣？沒關係，慢慢來，我陪你一步步來。",
    //     "別給自己太大壓力，輕鬆點，運動應該是讓你快樂的。",
    //     "你已經很棒了，別忘了欣賞自己的努力！",
    //     "累了就休息一下，身體的感受是最重要的。",
    //     "我相信你會做到，無論快慢，我都會在這裡等你。",
    //   ],
    // },
  ];
  const responses = coaches.find((item) => item.name === role)?.quotes ?? [];
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = {
  handleRoleSelection,
  handleRoleConfirmation,
  handleAddWeight,
};
