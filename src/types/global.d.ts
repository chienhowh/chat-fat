import {
  WebhookEvent,
  MessageEvent,
  EventSource,
  Message,
} from "@line/bot-sdk";
// 全域自動識別
type LINEWebhookEvent = WebhookEvent;
type LINEMessageEvent = MessageEvent;
type LINEEventSource = EventSource;
type LINEMessage = Message;
