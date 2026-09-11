export type AlertWebSocketMessage = {
  event?: string;
  alert?: Record<string, unknown>;
  [key: string]: unknown;
};

export function connectAlertWebSocket(
  onMessage: (message: AlertWebSocketMessage) => void,
  onStatusChange?: (connected: boolean) => void,
) {
  const socket = new WebSocket(
    "ws://127.0.0.1:8000/ws/alerts",
  );

  socket.onopen = () => {
    onStatusChange?.(true);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch {
      console.error(
        "Invalid WebSocket message:",
        event.data,
      );
    }
  };

  socket.onerror = () => {
    onStatusChange?.(false);
  };

  socket.onclose = () => {
    onStatusChange?.(false);
  };

  return socket;
}