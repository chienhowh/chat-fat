import { Client } from "@line/bot-sdk";
import dotenv from "dotenv";
import {
  addWeightRecord,
  addRole,
  addReminder,
  addUser,
  getUserProfile,
} from "./db.js";
import {
  LINEEventSource,
  LINEJoinEvent,
  LINEMessage,
  LINEMessageEvent,
} from "./types/global.js";
import { CoachReply, CoachReplyType, UserRole } from "./types/db.interface.js";
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
          ? coachReply(role.ptRole, "weight")
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

export async function handleAddReminder(
  userId: string,
  reminder: "weighReminder" | "trainReminder",
  time: string
) {
  console.log("🚀 ~ handleSendReminder ~ userId:", userId);
  try {
    await addReminder(userId, { [reminder]: time });
  } catch (err) {
    throwCustomError(`發送提醒失敗`, err);
  }
}

export async function handleNewFollowers(event: LINEJoinEvent) {
  try {
    const userId = event.source.userId!;
    const profile = await getLineUserProfile(event.source);
    await addUser(userId, { userId, userName: profile.displayName });
    console.log("add user:", userId, "::", profile.displayName);
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

function coachReply(ptRole: string, type: CoachReplyType) {
  const role = ptRole ?? "嚴厲教練";
  const coaches: CoachReply = {
    嚴厲教練: {
      weight: [
        "這麼胖還有臉報告？",
        "還敢吃？訓練量加倍！",
        "體重還在飆？今天卡路里砍一半！",
        "努力呢？還想繼續放縱嗎？",
        "你是在給我交代，還是給自己找藉口？",
      ],
      messureWeight: [
        "體重不測就等於白練，站上去！",
        "你不敢量體重，是因為你知道自己沒控制好嗎？",
        "只有垃圾才害怕秤的數字，你是哪種人？",
        "你以為閉上眼睛就能減肥嗎？快去量！",
        "少廢話，量體重，再來100下深蹲!",
      ],
      train: [
        "沒藉口！沒退路！只有做到！",
        "你訓練強度不夠，難怪體重降不下來！",
        "這麼輕鬆的重量，連小孩都能舉！加重！",
        "還有時間滑手機？動起來！",
        "如果這是你的極限，那你的極限也太爛了！",
      ],
    },
    色色旻柔: {
      weight: [
        "人見人愛美少女",
        "深蹲記得下到底，像你談感情一樣，別老卡在半空中！",
        "杠鈴舉不起來？我看你手機挺能舉，來點平衡感吧！",
        "臥推推不動？平時不是挺會撩嗎？力氣去哪了？",
        "拉伸的時候別害羞，動作大點，這姿勢你應該不陌生吧？",
        "看到跑步機就累？平常追人挺積極的啊，跑起來！",
      ],
      messureWeight: [
        "該量體重了，不然怎麼知道自己有沒有更性感？",
        "來嘛，量完我幫你檢查身體哪裡變結實了～",
        "害羞什麼，快測量，我看看你是不是偷偷變得更有料了😏",
        "來站上體重計，就像你站進我的心裡一樣沉重～",
        "測一下嘛～不然怎麼知道要怎麼調教你？",
      ],
      train: [
        "別讓啞鈴等得太久，它可是比你曖昧對象更需要你的陪伴",
        "多舉幾下吧，我喜歡看到你揮汗如雨的樣子😏",
        "有力氣撩人，沒力氣舉重？讓我看看你的誠意！",
        "跑起來！追愛都這麼積極了，運動怎麼能懶？",
        "深蹲到位，想像一下如果我在旁邊看著呢？",
      ],
    },
    雞湯教練: {
      weight: [
        "每一次的流汗，都是你對未來自己的承諾，加油！",
        "不需要和別人比，只需要每天都比昨天的自己強一點！",
        "你能做到的，比你想像的更多，別放棄！",
        "健身路上，最難的不是重量，而是堅持，但我知道你可以！",
        "今天的你，會成為明天的榜樣！",
      ],
      messureWeight: [
        "體重不是你的敵人，而是幫助你了解身體變化的朋友。",
        "無論數字如何，都要記得，你的努力不只是體現在體重上。",
        "測量體重只是過程，真正的成就來自你的堅持與汗水。",
        "不論今天的數字如何，你依然是努力變好的自己。",
        "這不只是一個數字，而是你前進的見證，加油！",
      ],
      train: [
        "每一次的流汗，都是對未來自己的投資！",
        "運動不只是減重，而是讓你變得更強！",
        "今天的你比昨天更進步了嗎？再來一組！",
        "沒有輕鬆的捷徑，只有堅持不懈的努力！",
        "你今天的每一次訓練，都是未來更強的自己給你的回報！",
      ],
    },
  };
  const responses = coaches[role][type];
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
    text: `${
      role.userName ?? "寶貝"
    }，該量體重了，不然怎麼知道自己有沒有更性感？`,
  });
}
export async function sendTrainNotification(role: UserRole) {
  return client.pushMessage(role.userId, [
    {
      type: "text",
      text: `${role.userName ?? "寶貝"}今天運動了嗎?`,
    },
    {
      type: "text",
      text: "別讓啞鈴等得太久，它可是比你曖昧對象更需要你的陪伴！",
    },
  ]);
}
