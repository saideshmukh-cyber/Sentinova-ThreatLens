export type IndicatorType = "ip" | "domain" | "url" | "hash" | "email" | "cve";
export type IndicatorStatus = "active" | "expired" | "whitelisted" | "under_review";
export type TLP = "clear" | "green" | "amber" | "red";

export type Indicator = {
  id: number;
  indicator_type: IndicatorType;
  value: string;
  severity_score: number;
  confidence: number;
  tlp: TLP | string;
  status: IndicatorStatus | string;
  tags: string[];
  attack_techniques: string[];
  notes: string | null;
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  ttl_days: number | null;
};

export type IndicatorSearchResponse = {
  total: number;
  page: number;
  size: number;
  items: Indicator[];
};
