export type AlertWebSocketMessage = {
  event?: string;
  channel?: string;
  data?: {
    alert?: Record<string, unknown>;
    indicator?: Record<string, unknown>;
    [key: string]: unknown;
  };
  alert?: Record<string, unknown>;
  [key: string]: unknown;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL = API_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

export function connectAlertWebSocket(
  onMessage: (message: AlertWebSocketMessage) => void,
  onStatusChange?: (connected: boolean) => void,
) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("threatlens_access_token") : null;
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  const socket = new WebSocket(`${WS_URL}/ws/alerts${query}`);

  socket.onopen = () => onStatusChange?.(true);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data) as AlertWebSocketMessage);
    } catch {
      console.error("Invalid WebSocket message:", event.data);
    }
  };
  socket.onerror = () => onStatusChange?.(false);
  socket.onclose = () => onStatusChange?.(false);
  return socket;
}
