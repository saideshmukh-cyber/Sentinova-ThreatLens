import type {
  Alert,
  AlertStatus,
} from "@/types/alert";

import type {
  AlertRule,
  AlertRuleCreate,
} from "@/types/alert-rule";

import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incident";

import type {
  IncidentTimeline,
} from "@/types/incident-timeline";

import type {
  Enrichment,
} from "@/types/enrichment";

import type {
  Indicator,
  IndicatorSearchResponse,
  IndicatorType,
} from "@/types/indicator";

import type {
  SecurityEvent,
  SecurityEventCreate,
} from "@/types/security-event";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";


type GetIndicatorsParams = {
  query?: string;
  indicatorType?: IndicatorType;
  page?: number;
  size?: number;
};


export async function getIndicators(
  params: GetIndicatorsParams = {},
): Promise<IndicatorSearchResponse> {
  const searchParams =
    new URLSearchParams();

  if (params.query) {
    searchParams.set(
      "query",
      params.query,
    );
  }

  if (params.indicatorType) {
    searchParams.set(
      "indicator_type",
      params.indicatorType,
    );
  }

  if (params.page !== undefined) {
    searchParams.set(
      "page",
      String(params.page),
    );
  }

  if (params.size !== undefined) {
    searchParams.set(
      "size",
      String(params.size),
    );
  }

  const queryString =
    searchParams.toString();

  const url =
    queryString.length > 0
      ? `${API_URL}/api/v1/indicators/?${queryString}`
      : `${API_URL}/api/v1/indicators/`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch indicators: ${response.status}`,
    );
  }

  return response.json();
}


export async function getIndicator(
  indicatorId: number,
): Promise<Indicator> {
  const response =
    await fetch(
      `${API_URL}/api/v1/indicators/${indicatorId}`,
    );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Indicator not found.",
      );
    }

    throw new Error(
      `Failed to fetch indicator: ${response.status}`,
    );
  }

  return response.json();
}


export async function createIndicator(
  indicatorType: IndicatorType,
  value: string,
): Promise<Indicator> {
  const response =
    await fetch(
      `${API_URL}/api/v1/indicators/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indicator_type:
            indicatorType,
          value,
        }),
      },
    );

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        "Indicator already exists.",
      );
    }

    let message =
      `Failed to create indicator: ${response.status}`;

    try {
      const data =
        await response.json();

      if (data.detail) {
        message = data.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function updateIndicator(
  indicatorId: number,
  indicatorType: IndicatorType,
  value: string,
): Promise<Indicator> {
  const response =
    await fetch(
      `${API_URL}/api/v1/indicators/${indicatorId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indicator_type:
            indicatorType,
          value,
        }),
      },
    );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Indicator not found.",
      );
    }

    if (response.status === 409) {
      throw new Error(
        "Indicator already exists.",
      );
    }

    let message =
      `Failed to update indicator: ${response.status}`;

    try {
      const data =
        await response.json();

      if (data.detail) {
        message = data.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function deleteIndicator(
  indicatorId: number,
): Promise<Indicator> {
  const response =
    await fetch(
      `${API_URL}/api/v1/indicators/${indicatorId}`,
      {
        method: "DELETE",
      },
    );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Indicator not found.",
      );
    }

    let message =
      `Failed to delete indicator: ${response.status}`;

    try {
      const data =
        await response.json();

      if (data.detail) {
        message = data.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getIndicatorEnrichments(
  indicatorId: number,
): Promise<Enrichment[]> {
  const response =
    await fetch(
      `${API_URL}/api/v1/enrichments/indicator/${indicatorId}`,
    );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch enrichments: ${response.status}`,
    );
  }

  return response.json();
}


export async function enrichIndicator(
  indicatorId: number,
  indicatorType: IndicatorType,
): Promise<Enrichment> {
  let endpoint: string;

  switch (indicatorType) {
    case "domain":
      endpoint = "dns";
      break;

    case "ip":
      endpoint = "ip";
      break;

    case "hash":
      endpoint = "hash";
      break;

    case "url":
      endpoint = "virustotal";
      break;

    default:
      endpoint = "virustotal";
  }

  const response =
    await fetch(
      `${API_URL}/api/v1/enrichments/${indicatorId}/${endpoint}`,
      {
        method: "POST",
      },
    );

  if (!response.ok) {
    let message =
      `Failed to enrich indicator: ${response.status}`;

    try {
      const data =
        await response.json();

      if (data.detail) {
        message = data.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getAlerts(): Promise<Alert[]> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alerts/`,
    );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch alerts: ${response.status}`,
    );
  }

  return response.json();
}


export async function updateAlert(
  alertId: number,
  data: {
    status?: AlertStatus;
    assignee?: string;
  },
): Promise<Alert> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alerts/${alertId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    let message =
      `Failed to update alert: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function attachAlertToIncident(
  alertId: number,
  incidentId: number,
): Promise<Alert> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alerts/${alertId}/incident/${incidentId}`,
      {
        method: "POST",
      },
    );

  if (!response.ok) {
    let message =
      `Failed to attach alert to incident: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getIncidents(): Promise<Incident[]> {
  const response =
    await fetch(
      `${API_URL}/api/v1/incidents/`,
    );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch incidents: ${response.status}`,
    );
  }

  return response.json();
}


export async function getIncident(
  incidentId: number,
): Promise<Incident> {
  const response =
    await fetch(
      `${API_URL}/api/v1/incidents/${incidentId}`,
    );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Incident not found.",
      );
    }

    throw new Error(
      `Failed to fetch incident: ${response.status}`,
    );
  }

  return response.json();
}


export async function createIncident(
  data: {
    title: string;
    description?: string;
    severity?: IncidentSeverity;
    assignee?: string;
  },
): Promise<Incident> {
  const response =
    await fetch(
      `${API_URL}/api/v1/incidents/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    let message =
      `Failed to create incident: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function updateIncident(
  incidentId: number,
  data: {
    title?: string;
    description?: string;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    assignee?: string;
  },
): Promise<Incident> {
  const response =
    await fetch(
      `${API_URL}/api/v1/incidents/${incidentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    let message =
      `Failed to update incident: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getIncidentTimeline(
  incidentId: number,
): Promise<IncidentTimeline[]> {
  const response =
    await fetch(
      `${API_URL}/api/v1/incidents/${incidentId}/timeline`,
    );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch incident timeline: ${response.status}`,
    );
  }

  return response.json();
}


export async function getAlertRules(): Promise<AlertRule[]> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alert-rules/`,
    );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch alert rules: ${response.status}`,
    );
  }

  return response.json();
}


export async function createAlertRule(
  data: AlertRuleCreate,
): Promise<AlertRule> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alert-rules/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    let message =
      `Failed to create alert rule: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function updateAlertRule(
  ruleId: number,
  data: Partial<AlertRuleCreate>,
): Promise<AlertRule> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alert-rules/${ruleId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    let message =
      `Failed to update alert rule: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function deleteAlertRule(
  ruleId: number,
): Promise<AlertRule> {
  const response =
    await fetch(
      `${API_URL}/api/v1/alert-rules/${ruleId}`,
      {
        method: "DELETE",
      },
    );

  if (!response.ok) {
    let message =
      `Failed to delete alert rule: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getSecurityEvents(): Promise<
  SecurityEvent[]
> {
  const response = await fetch(
    `${API_URL}/api/v1/security-events/`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch security events: ${response.status}`,
    );
  }

  return response.json();
}


export async function createSecurityEvent(
  data: SecurityEventCreate,
): Promise<SecurityEvent> {
  const response = await fetch(
    `${API_URL}/api/v1/security-events/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    let message =
      `Failed to create security event: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData.detail) {
        message = errorData.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json();
}