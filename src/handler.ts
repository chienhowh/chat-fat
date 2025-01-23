import { Client } from "@line/bot-sdk";
import dotenv from "dotenv";
import {
  addWeightRecord,
  addRole,
  addWeighTimeReminder,
  addUser,
  getUserProfile,
} from "./db.js";
import {
  LINEEventSource,
  LINEMessage,
  LINEMessageEvent,
} from "./types/global.js";
import { UserRole } from "./types/db.interface.js";
import { throwCustomError } from "./utilites/err.js";

dotenv.config();

// create LINE SDK client
const client = new Client({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "",
});

export async function handleRoleSelection(event: LINEMessageEvent) {
  return client.replyMessage(event.replyToken, {
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
  });
}

export async function handleRoleConfirmation(
  event: LINEMessageEvent,
  role: string
) {
  const { userId } = event.source;
  await addRole(userId!, role);
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: `您選擇了${role}做為您的教練!`,
  });
}

export async function handleAddWeight(event: LINEMessageEvent, weight: number) {
  try {
    let displayName = "您";
    const { userId } = event.source;
    const profile = await getLineUserProfile(event.source);
    console.log(" handleEvent ~ profile:", profile);
    displayName = profile.displayName;

    await addWeightRecord({
      userId: userId!,
      weight,
      timestamp: new Date(),
      note: "",
    });

    const role = await getUserProfile(userId!);
    const messages: LINEMessage[] = [
      {
        type: "text",
        text: `已記錄${displayName}的體重 ${weight} kg`,
      },
      {
        type: "text",
        text: role.ptRole
          ? coachReply(role.ptRole)
          : "您尚未選擇教練，可輸入'選教練'挑選您的專屬教練!",
      },
    ];

    return client.replyMessage(event.replyToken, messages);
  } catch (err) {
    console.log("err::", err);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "無法記錄體重，請稍後再試！",
    });
  }
}

export async function handleSendReminder(userId: string, message: string) {
  console.log("🚀 ~ handleSendReminder ~ userId:", userId);
  try {
    return client.pushMessage(userId, {
      type: "text",
      text: message,
    });
  } catch (err) {
    throwCustomError(`發送提醒失敗`, err);
  }
}

export async function handleNewFollowers(event: LINEMessageEvent) {
  try {
    const userId = event.source.userId!;
    await Promise.all([
      addUser(userId),
      addWeighTimeReminder(userId, {
        userId: userId!,
        reminderTime: "0800",
      }),
    ]);
    return client.pushMessage(userId, {
      type: "text",
      text: "歡迎加入！",
    });
  } catch (err) {
    throwCustomError(`發送提醒失敗`, err);
  }
}

async function getLineUserProfile(source: LINEEventSource) {
  const { type, userId } = source;
  try {
    let response;
    if (type === "group") {
      const { groupId } = source;
      response = await client.getGroupMemberProfile(groupId, userId!);
    } else {
      response = await client.getProfile(userId!);
    }
    return response;
  } catch (err) {
    throwCustomError(`取得使用者名稱 ${userId} 時出錯`, err);
  }
}

function coachReply(ptRole: string) {
  const role = ptRole ?? "嚴厲教練";
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
        "人見人愛美少女",
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
  ];
  const responses = coaches.find((item) => item.name === role)?.quotes ?? [];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function convertTime(time: Date) {
  const nowHour = time.getUTCHours().toString().padStart(2, "0");
  const nowMinute = time.getUTCMinutes().toString().padStart(2, "0");
  return `${nowHour}${nowMinute}`;
}

export async function sendNotification(role: UserRole) {
  return client.pushMessage(role.userId, {
    type: "text",
    text: `${role.userName ?? ""}該量體重囉`,
  });
}
