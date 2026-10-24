export type SecurityEvent = {
  id: number;
  source: string;
  event_type: string;
  category: string | null;
  indicator_value: string;
  timestamp: string;
  created_at: string;
};


export type SecurityEventCreate = {
  source: string;
  event_type: string;
  category?: string;
  indicator_value: string;
  timestamp: string;
};