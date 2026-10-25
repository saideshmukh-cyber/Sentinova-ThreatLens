import type { Alert, AlertStatus } from "@/types/alert";
import type { AlertRule, AlertRuleCreate } from "@/types/alert-rule";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/incident";
import type { IncidentTimeline } from "@/types/incident-timeline";
import type { Enrichment } from "@/types/enrichment";
import type { Indicator, IndicatorSearchResponse, IndicatorType, IndicatorStatus, TLP } from "@/types/indicator";
import type { SecurityEvent, SecurityEventCreate } from "@/types/security-event";
import type { DashboardAnalytics } from "@/types/dashboard";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("threatlens_access_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function request<T>(url: string, init?: RequestInit, allowRefresh = true): Promise<T> {
  const response = await fetch(url, { ...init, headers: authHeaders(init?.headers), cache: "no-store" });
  if (response.status === 401 && allowRefresh && typeof window !== "undefined") {
    const refreshToken = window.localStorage.getItem("threatlens_refresh_token");
    if (refreshToken) {
      try {
        const refreshed = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
          cache: "no-store",
        });
        if (refreshed.ok) {
          const data = await refreshed.json() as { access_token: string; refresh_token: string; role: string; username: string };
          window.localStorage.setItem("threatlens_access_token", data.access_token);
          window.localStorage.setItem("threatlens_refresh_token", data.refresh_token);
          window.localStorage.setItem("threatlens_user", JSON.stringify({ username: data.username, role: data.role }));
          return request<T>(url, init, false);
        }
      } catch {
        // Fall through to the original 401.
      }
    }
  }
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try { const data = await response.json(); if (data?.detail) message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail); } catch { /* default */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

type GetIndicatorsParams = { query?: string; indicatorType?: IndicatorType; page?: number; size?: number };

export async function getIndicators(params: GetIndicatorsParams = {}): Promise<IndicatorSearchResponse> {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.indicatorType) search.set("indicator_type", params.indicatorType);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return request<IndicatorSearchResponse>(`${API_URL}/api/v1/indicators/${suffix}`);
}

export async function getIndicator(indicatorId: number): Promise<Indicator> { return request(`${API_URL}/api/v1/indicators/${indicatorId}`); }

export async function createIndicator(indicatorType: IndicatorType, value: string, metadata: Partial<Pick<Indicator, "confidence" | "tlp" | "status" | "tags" | "attack_techniques" | "notes" | "ttl_days">> = {}): Promise<Indicator> {
  return request(`${API_URL}/api/v1/indicators/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ indicator_type: indicatorType, value, confidence: metadata.confidence ?? 0, tlp: metadata.tlp ?? "clear", status: metadata.status ?? "active", tags: metadata.tags ?? [], attack_techniques: metadata.attack_techniques ?? [], notes: metadata.notes ?? null, ttl_days: metadata.ttl_days ?? 30 }) });
}

export async function updateIndicator(indicatorId: number, data: { indicator_type: IndicatorType; value: string; confidence?: number; tlp?: TLP; status?: IndicatorStatus; tags?: string[]; attack_techniques?: string[]; notes?: string | null; ttl_days?: number | null }): Promise<Indicator> { return request(`${API_URL}/api/v1/indicators/${indicatorId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function deleteIndicator(indicatorId: number): Promise<Indicator> { return request(`${API_URL}/api/v1/indicators/${indicatorId}`, { method: "DELETE" }); }
export async function scoreIndicator(indicatorId: number): Promise<{ indicator_id: number; severity_score: number; breakdown: Record<string, number> }> { return request(`${API_URL}/api/v1/indicators/${indicatorId}/score`, { method: "POST" }); }

export async function getAlerts(): Promise<Alert[]> { return request(`${API_URL}/api/v1/alerts/`); }
export async function updateAlert(id: number, data: { status?: AlertStatus; assignee?: string | null }): Promise<Alert> { return request(`${API_URL}/api/v1/alerts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function attachAlertToIncident(alertId: number, incidentId: number): Promise<Alert> { return request(`${API_URL}/api/v1/alerts/${alertId}/incident/${incidentId}`, { method: "POST" }); }
export async function escalateAlert(alertId: number): Promise<Alert> {
  return request(`${API_URL}/api/v1/alerts/${alertId}/escalate`, { method: "POST" });
}

export async function createIncidentFromAlert(
  alertId: number,
  data: { title: string; description?: string; severity: IncidentSeverity },
): Promise<Incident> {
  return request(`${API_URL}/api/v1/alerts/${alertId}/incident`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getAlertRules(): Promise<AlertRule[]> { return request(`${API_URL}/api/v1/alert-rules/`); }
export async function createAlertRule(data: AlertRuleCreate): Promise<AlertRule> { return request(`${API_URL}/api/v1/alert-rules/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function updateAlertRule(id: number, data: Partial<AlertRuleCreate>): Promise<AlertRule> { return request(`${API_URL}/api/v1/alert-rules/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function deleteAlertRule(id: number): Promise<AlertRule> { return request(`${API_URL}/api/v1/alert-rules/${id}`, { method: "DELETE" }); }

export async function getIncidents(): Promise<Incident[]> { return request(`${API_URL}/api/v1/incidents/`); }
export async function createIncident(data: { title: string; description?: string; severity: IncidentSeverity; assignee?: string | null }): Promise<Incident> { return request(`${API_URL}/api/v1/incidents/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function updateIncident(id: number, data: Partial<{ title: string; description: string; severity: IncidentSeverity; status: IncidentStatus; assignee: string | null }>): Promise<Incident> { return request(`${API_URL}/api/v1/incidents/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function getIncident(id: number): Promise<Incident> { return request(`${API_URL}/api/v1/incidents/${id}`); }
export async function getIncidentTimeline(id: number): Promise<IncidentTimeline[]> { return request(`${API_URL}/api/v1/incidents/${id}/timeline`); }

export async function getEnrichments(indicatorId: number): Promise<Enrichment[]> { return request(`${API_URL}/api/v1/enrichments/indicator/${indicatorId}`); }
export async function getIndicatorEnrichments(indicatorId: number): Promise<Enrichment[]> { return getEnrichments(indicatorId); }
export async function enrichIndicator(indicatorId: number, kind: IndicatorType | "dns" | "ip" | "hash" | "virustotal"): Promise<Enrichment> {
  const route = kind === "domain" ? "dns" : kind === "ip" ? "ip" : kind === "hash" ? "hash" : "virustotal";
  return request(`${API_URL}/api/v1/enrichments/${indicatorId}/${route}`, { method: "POST" });
}

export type InvestigationHistoryItem = {
  investigation_id: number;
  indicator_id: number;
  indicator_type: IndicatorType;
  value: string;
  score: number;
  risk_level: string;
  created_at: string;
};

export type InvestigationResult = {
  investigation_id: number;
  indicator_id: number;
  indicator_type: IndicatorType;
  value: string;
  score: number;
  risk_level: string;
  summary: {
    score: number;
    risk_level: string;
    enrichment_count: number;
    sources: string[];
    score_breakdown: Record<string, unknown>;
  };
  enrichments: Array<Record<string, unknown>>;
};

export async function getInvestigations(
  page = 1,
  size = 25
): Promise<InvestigationHistoryItem[]> {
  return request(
    `${API_URL}/api/v1/investigations/?page=${page}&size=${size}`
  );
}

export async function createInvestigation(
  indicator_type: IndicatorType,
  value: string
): Promise<InvestigationResult> {
  return request(`${API_URL}/api/v1/investigations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ indicator_type, value }),
  });
}

export async function getInvestigation(
  id: number
): Promise<InvestigationResult> {
  return request(`${API_URL}/api/v1/investigations/${id}`);
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> { return request(`${API_URL}/api/v1/security-events/`); }
export async function createSecurityEvent(data: SecurityEventCreate): Promise<SecurityEvent> { return request(`${API_URL}/api/v1/security-events/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> { return request(`${API_URL}/api/v1/dashboard/analytics`); }
export async function getDashboardSummary<T = Record<string, unknown>>(): Promise<T> { return request(`${API_URL}/api/v1/dashboard/summary`); }
export async function globalSearch(query: string): Promise<{ indicators: Array<Record<string, unknown>>; events: Array<Record<string, unknown>> }> { return request(`${API_URL}/api/v1/search?q=${encodeURIComponent(query)}`); }

export async function getIndicatorSources(indicatorId: number): Promise<Array<{ id: number; indicator_id: number; source: string; confidence: number; first_seen: string; last_seen: string }>> { return request(`${API_URL}/api/v1/indicators/${indicatorId}/sources`); }
export async function getRelationships(indicatorId: number): Promise<Array<{ id: number; source_indicator_id: number; target_indicator_id: number; relationship_type: string; created_at: string }>> { return request(`${API_URL}/api/v1/indicators/${indicatorId}/relationships`); }
export async function createRelationship(indicatorId: number, target_indicator_id: number, relationship_type: string) { return request(`${API_URL}/api/v1/indicators/${indicatorId}/relationships`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_indicator_id, relationship_type }) }); }

export async function signup(username: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string; role: string; username: string }> {
  return request(`${API_URL}/api/v1/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
}

export async function login(username: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string; role: string; username: string }> {
  return request(`${API_URL}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
}

export async function getDashboardLayout(): Promise<{ visible: Record<string, boolean> }> { return request(`${API_URL}/api/v1/dashboard/layout`); }
export async function saveDashboardLayout(visible: Record<string, boolean>): Promise<{ visible: Record<string, boolean>; saved: boolean }> { return request(`${API_URL}/api/v1/dashboard/layout`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visible }) }); }

export type FeedConfig = { name: string; description: string; enabled: boolean; schedule_minutes: number; last_run_at: string | null };
export async function getFeedConfigs(): Promise<FeedConfig[]> { return request(`${API_URL}/api/v1/feeds/`); }
export async function updateFeedConfig(name: string, data: { enabled?: boolean; schedule_minutes?: number }): Promise<FeedConfig> { return request(`${API_URL}/api/v1/feeds/${encodeURIComponent(name)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function runFeed(name: string): Promise<Record<string, unknown>> { return request(`${API_URL}/api/v1/feeds/${encodeURIComponent(name)}/run`, { method: "POST" }); }

export type SavedHunt = { id: number; user_id: number | null; name: string; query: string; indicator_type: string | null; created_at: string; updated_at: string };
export async function getSavedHunts(): Promise<SavedHunt[]> { return request(`${API_URL}/api/v1/hunts/`); }
export async function saveHunt(data: { name: string; query: string; indicator_type?: string | null }): Promise<SavedHunt> { return request(`${API_URL}/api/v1/hunts/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function deleteHunt(id: number): Promise<{ deleted: boolean; id: number }> { return request(`${API_URL}/api/v1/hunts/${id}`, { method: "DELETE" }); }

export type AuditLog = { id: number; actor: string; action: string; entity_type: string; entity_id: string | null; details: Record<string, unknown>; correlation_id: string | null; timestamp: string };
export async function getAuditLogs(limit = 100): Promise<AuditLog[]> { return request(`${API_URL}/api/v1/audit/?limit=${limit}`); }

export async function downloadExport(path: string, filename: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders(), cache: "no-store" });
  if (!response.ok) { throw new Error(`Export failed: ${response.status}`); }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
