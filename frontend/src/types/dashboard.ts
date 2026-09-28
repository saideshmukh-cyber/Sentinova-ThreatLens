export type DashboardPoint = {
  region: string;
  count: number;
  country?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type DashboardAnalytics = {
  generated_at: string;
  risk_score: number;
  active_critical_high: number;
  open_alerts: number;
  resolved_alerts: number;
  open_incidents: number;
  high_risk_investigations: number;
  volume_trend: Array<{ date: string; indicators: number; events: number }>;
  alert_trend: Array<{ date: string; open: number; resolved: number }>;
  category_breakdown: Array<{ label: string; value: number }>;
  source_breakdown: Array<{ label: string; value: number }>;
  attack_technique_breakdown: Array<{ label: string; value: number }>;
  severity_distribution: Record<string, number>;
  geo_activity: DashboardPoint[];
  top_indicators: Array<{ id: number; value: string; indicator_type: string; severity_score: number }>;
};
