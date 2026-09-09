export type AlertRule = {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
  min_score: number | null;
  source: string | null;
  category: string | null;
  threshold: number;
  window_minutes: number;
  route_to: string | null;
  created_at: string;
  updated_at: string;
};


export type AlertRuleCreate = {
  name: string;
  description?: string;
  enabled?: boolean;
  min_score?: number;
  source?: string;
  category?: string;
  threshold?: number;
  window_minutes?: number;
  route_to?: string;
};