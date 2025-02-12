var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Client } from "@line/bot-sdk";
import dotenv from "dotenv";
import { addWeightRecord, addRole, addReminder, addUser, getUserProfile, } from "./db.js";
import { throwCustomError } from "./utilites/err.js";
dotenv.config();
// create LINE SDK client
const client = new Client({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "",
});
export function handleRoleSelection(event) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
export function handleRoleConfirmation(event, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = event.source;
        yield addRole(userId, role);
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: `您選擇了${role}做為您的教練!`,
        });
    });
}
export function handleAddWeight(event, weight) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let displayName = "您";
            const { userId } = event.source;
            const profile = yield getLineUserProfile(event.source);
            console.log(" handleEvent ~ profile:", profile);
            displayName = profile.displayName;
            yield addWeightRecord({
                userId: userId,
                weight,
                timestamp: new Date(),
                note: "",
            });
            const role = yield getUserProfile(userId);
            const messages = [
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
        }
        catch (err) {
            console.log("err::", err);
            return client.replyMessage(event.replyToken, {
                type: "text",
                text: "無法記錄體重，請稍後再試！",
            });
        }
    });
}
export function handleAddReminder(userId, reminder, time) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🚀 ~ handleSendReminder ~ userId:", userId);
        try {
            yield addReminder(userId, { [reminder]: time });
        }
        catch (err) {
            throwCustomError(`發送提醒失敗`, err);
        }
    });
}
export function handleNewFollowers(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = event.source.userId;
            yield Promise.all([addUser(userId)]);
            return client.pushMessage(userId, {
                type: "text",
                text: "歡迎加入！",
            });
        }
        catch (err) {
            throwCustomError(`發送提醒失敗`, err);
        }
    });
}
function getLineUserProfile(source) {
    return __awaiter(this, void 0, void 0, function* () {
        const { type, userId } = source;
        try {
            let response;
            if (type === "group") {
                const { groupId } = source;
                response = yield client.getGroupMemberProfile(groupId, userId);
            }
            else {
                response = yield client.getProfile(userId);
            }
            return response;
        }
        catch (err) {
            throwCustomError(`取得使用者名稱 ${userId} 時出錯`, err);
        }
    });
}
function coachReply(ptRole) {
    var _a, _b;
    const role = ptRole !== null && ptRole !== void 0 ? ptRole : "嚴厲教練";
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
    const responses = (_b = (_a = coaches.find((item) => item.name === role)) === null || _a === void 0 ? void 0 : _a.quotes) !== null && _b !== void 0 ? _b : [];
    return responses[Math.floor(Math.random() * responses.length)];
}
export function convertTime(time) {
    const nowHour = time.getUTCHours().toString().padStart(2, "0");
    const nowMinute = time.getUTCMinutes().toString().padStart(2, "0");
    return `${nowHour}${nowMinute}`;
}
export function sendNotification(role) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        return client.pushMessage(role.userId, {
            type: "text",
            text: `${(_a = role.userName) !== null && _a !== void 0 ? _a : "寶貝"}，該量體重了，不然怎麼知道自己有沒有更性感？`,
        });
    });
}
export function sendTrainNotification(role) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        return client.pushMessage(role.userId, [
            {
                type: "text",
                text: `${(_a = role.userName) !== null && _a !== void 0 ? _a : "寶貝"}今天運動了嗎?`,
            },
            {
                type: "text",
                text: "別讓啞鈴等得太久，它可是比你曖昧對象更需要你的陪伴！",
            },
        ]);
    });
}
export function handleTutorial(event) {
    return __awaiter(this, void 0, void 0, function* () {
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: `體重記錄："體重99" | 選教練："選教練"
          運動提醒："提醒訓練0900" | 測量提醒："提醒測量0900"
    `,
        });
    });
}
// TODO: 放到首次
// 📌 **使用說明**
// ⚡ **記錄體重**：輸入 `體重 99`
// ⚡ **選擇教練**：輸入 `選教練`
// ⚡ **提醒運動**：輸入 `提醒訓練 0900`（早上9:00 提醒）
// ⚡ **提醒測量**：輸入 `提醒測量 0900`（早上9:00 提醒）
