export interface PtRole {
  userId: string;
  role: string;
}

export interface WeightRecord {
  userId: string;
  weight: number;
  timestamp: Date;
  note: string;
}

export interface Reminder {
  userId: string;
  reminderTime: string; // ex. 0800, 2230
}

export interface UserRole {
  userId: string;
  ptRole: string;
  userName?: string;
  weighReminder: string;
  trainReminder: string; // ex. 0800, 2230
  userTimeZone: string; // ex. +08:00
}

export type CoachReplyType = "train" | "messureWeight" | "weight";

export interface CoachReply {
  [propertyName: string]: Record<CoachReplyType, string[]>;
}
