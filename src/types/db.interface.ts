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
  weightReminder: string; // ex. 0900
}
