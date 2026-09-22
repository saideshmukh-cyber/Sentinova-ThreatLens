export type IndicatorType = "ip" | "domain" | "url" | "hash";

export type Indicator = {
  id: number;
  indicator_type: IndicatorType;
  value: string;
  severity_score: number;
  created_at: string;
};

export type IndicatorSearchResponse = {
  total: number;
  page: number;
  size: number;
  items: Indicator[];
};
