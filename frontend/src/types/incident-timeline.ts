export type IncidentTimeline = {
  id: number;
  incident_id: number;
  event_type: string;
  description: string;
  actor: string | null;
  created_at: string;
};