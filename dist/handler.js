"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRoleSelection = handleRoleSelection;
exports.handleRoleConfirmation = handleRoleConfirmation;
exports.handleAddWeight = handleAddWeight;
exports.handleSendReminder = handleSendReminder;
exports.handleNewFollowers = handleNewFollowers;
const bot_sdk_1 = require("@line/bot-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./db.js");
const err_js_1 = require("./utilites/err.js");
dotenv_1.default.config();
// create LINE SDK client
const client = new bot_sdk_1.Client({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "",
});
function handleRoleSelection(event) {
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
function handleRoleConfirmation(event, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = event.source;
        yield (0, db_js_1.addRole)(userId, { userId: userId, role });
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: `您選擇了${role}做為您的教練!`,
        });
    });
}
function handleAddWeight(event, weight) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let displayName = "您";
            const { userId } = event.source;
            const profile = yield getUserProfile(event.source);
            console.log(" handleEvent ~ profile:", profile);
            displayName = profile.displayName;
            yield (0, db_js_1.addWeightRecord)({
                userId: userId,
                weight,
                timestamp: new Date(),
                note: "",
            });
            const role = yield (0, db_js_1.getRole)(userId);
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
function handleSendReminder(userId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🚀 ~ handleSendReminder ~ userId:", userId);
        try {
            return client.pushMessage(userId, {
                type: "text",
                text: message,
            });
        }
        catch (err) {
            (0, err_js_1.throwCustomError)(`發送提醒失敗`, err);
        }
    });
}
function handleNewFollowers(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = event.source.userId;
            yield Promise.all([
                (0, db_js_1.addUser)(userId),
                (0, db_js_1.addWeighTimeReminder)(userId, {
                    userId: userId,
                    reminderTime: "0800",
                }),
            ]);
            return client.pushMessage(userId, {
                type: "text",
                text: "歡迎加入！",
            });
        }
        catch (err) {
            (0, err_js_1.throwCustomError)(`發送提醒失敗`, err);
        }
    });
}
function getUserProfile(source) {
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
            (0, err_js_1.throwCustomError)(`取得使用者名稱 ${userId} 時出錯`, err);
        }
    });
}
function coachReply(ptRole) {
    var _a, _b;
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
    ];
    const responses = (_b = (_a = coaches.find((item) => item.name === role)) === null || _a === void 0 ? void 0 : _a.quotes) !== null && _b !== void 0 ? _b : [];
    return responses[Math.floor(Math.random() * responses.length)];
}
function getErrorMessage(err) {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}
