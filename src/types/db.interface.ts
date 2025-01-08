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
