import type { IndicatorSearchResponse } from "@/types/indicator";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function getIndicators(): Promise<IndicatorSearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/indicators/`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch indicators: ${response.status}`,
    );
  }

  return response.json();
}