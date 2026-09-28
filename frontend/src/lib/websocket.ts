export type AlertWebSocketMessage = {
  event?: string;
  data?: {
    alert?: Record<string, unknown>;
    indicator?: Record<string, unknown>;
    [key: string]: unknown;
  };
  alert?: Record<string, unknown>;
  [key: string]: unknown;
};

export function connectAlertWebSocket(
  onMessage: (message: AlertWebSocketMessage) => void,
  onStatusChange?: (connected: boolean) => void,
) {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("threatlens_access_token")
    : null;
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  const socket = new WebSocket(`ws://127.0.0.1:8000/ws/alerts${query}`);

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
