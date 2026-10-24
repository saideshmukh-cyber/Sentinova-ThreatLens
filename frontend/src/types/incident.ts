export type IncidentSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";


export type IncidentStatus =
  | "open"
  | "in-progress"
  | "resolved"
  | "closed";


export type Incident = {
  id: number;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignee: string | null;
  created_at: string;
  updated_at: string;
};