export type Enrichment = {
  id: number;
  indicator_id: number;
  source: string;
  data: Record<string, unknown>;
  created_at: string;
};