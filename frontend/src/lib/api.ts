import type {
  Indicator,
  IndicatorSearchResponse,
  IndicatorType,
} from "@/types/indicator";

const API_BASE_URL = "http://127.0.0.1:8000";

export type GetIndicatorsParams = {
  query?: string;
  indicatorType?: IndicatorType;
  page?: number;
  size?: number;
};

export async function getIndicators(
  params: GetIndicatorsParams = {},
): Promise<IndicatorSearchResponse> {
  const searchParams = new URLSearchParams();

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

  if (params.page) {
    searchParams.set(
      "page",
      String(params.page),
    );
  }

  if (params.size) {
    searchParams.set(
      "size",
      String(params.size),
    );
  }

  const queryString =
    searchParams.toString();

  const url = queryString
    ? `${API_BASE_URL}/api/v1/indicators/?${queryString}`
    : `${API_BASE_URL}/api/v1/indicators/`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch indicators: ${response.status}`,
    );
  }

  return response.json();
}

export async function createIndicator(
  indicatorType: IndicatorType,
  value: string,
): Promise<Indicator> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/indicators/`,
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
        "This indicator already exists.",
      );
    }

    if (response.status === 422) {
      throw new Error(
        "The indicator value is invalid.",
      );
    }

    throw new Error(
      `Failed to create indicator: ${response.status}`,
    );
  }

  return response.json();
}