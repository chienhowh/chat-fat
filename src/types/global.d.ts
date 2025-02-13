import {
  WebhookEvent,
  MessageEvent,
  EventSource,
  Message,
  JoinEvent,
} from "@line/bot-sdk";
// 全域自動識別
type LINEWebhookEvent = WebhookEvent;
type LINEMessageEvent = MessageEvent;
type LINEJoinEvent = JoinEvent;
type LINEEventSource = EventSource;
type LINEMessage = Message;
