export interface RealtimeMessage {
  type: "question" | "answer" | "feedback" | "complete" | "error" | "voice_chunk" | "voice_response" | "transcript" | "proctoring";
  payload: any;
  timestamp: number;
}

export interface RealtimeProvider {
  connect(roomId: string): Promise<void>;
  disconnect(): void;
  send(message: RealtimeMessage): void;
  onMessage(handler: (message: RealtimeMessage) => void): void;
  onConnectionChange(handler: (connected: boolean) => void): void;
  isConnected(): boolean;
}

export class WebSocketProvider implements RealtimeProvider {
  private ws: WebSocket | null = null;
  private handlers: ((message: RealtimeMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private roomId: string = "";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  async connect(roomId: string): Promise<void> {
    this.roomId = roomId;
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/interview/${roomId}`;

      try {
        this.ws = new WebSocket(wsUrl);
      } catch {
        reject(new Error("WebSocket connection failed"));
        return;
      }

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.connectionHandlers.forEach((h) => h(true));
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          this.handlers.forEach((h) => h(message));
        } catch {}
      };

      this.ws.onclose = () => {
        this.connectionHandlers.forEach((h) => h(false));
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        reject(new Error("WebSocket error"));
      };
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.roomId).catch(() => {});
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(message: RealtimeMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: (message: RealtimeMessage) => void): void {
    this.handlers.push(handler);
  }

  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createRealtimeProvider(): RealtimeProvider {
  return new WebSocketProvider();
}
