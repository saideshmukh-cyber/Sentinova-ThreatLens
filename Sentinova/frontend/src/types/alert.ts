export type AlertStatus =
  | "new"
  | "acknowledged"
  | "in-progress"
  | "resolved"
  | "closed";

export type Alert = {
  id: number;
  indicator_id: number;
  incident_id: number | null;
  severity_score: number;
  rule: string;
  status: AlertStatus;
  assignee: string | null;
  created_at: string;
  updated_at: string;
};