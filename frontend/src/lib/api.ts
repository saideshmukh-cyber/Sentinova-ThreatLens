import type {
  Enrichment,
} from "@/types/enrichment";

import type {
  Indicator,
  IndicatorSearchResponse,
  IndicatorType,
} from "@/types/indicator";

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

  const response = await fetch(url);

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
  const response = await fetch(
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
  const response = await fetch(
    `${API_URL}/api/v1/indicators/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        indicator_type: indicatorType,
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
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getIndicatorEnrichments(
  indicatorId: number,
): Promise<Enrichment[]> {
  const response = await fetch(
    `${API_URL}/api/v1/enrichments/indicator/${indicatorId}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Indicator not found.",
      );
    }

    throw new Error(
      `Failed to fetch enrichments: ${response.status}`,
    );
  }

  return response.json();
}

export async function enrichIndicator(
  indicatorId: number,
  indicatorType: IndicatorType,
): Promise<Enrichment[]> {
  const endpoints: Record<
    IndicatorType,
    string
  > = {
    domain: "dns",
    ip: "ip",
    hash: "hash",
    url: "virustotal",
  };

  const endpoint =
    endpoints[indicatorType];

  const response = await fetch(
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
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return getIndicatorEnrichments(
    indicatorId,
  );
}