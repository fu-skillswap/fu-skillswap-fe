// =====================================================================
// src/lib/chatSocket.ts — Raw WebSocket realtime client.
// BE (mới) bỏ STOMP/SockJS, dùng raw WS tại /ws?token=<accessToken>.
// Server đẩy envelope JSON { type, payload, timestamp } với type:
//   AUTH_OK | CHAT_MESSAGE_CREATED | NEW_NOTIFICATION | PONG | ERROR
// Client gửi { type: "PING" } để giữ kết nối.
// =====================================================================
import type { ChatMessageEvent, NotificationItem } from '../api/types';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://api.skillswap.asia';

// http(s)://host -> ws(s)://host cho endpoint WebSocket.
const WS_BASE = API_BASE.replace(/^http/, 'ws');

const PING_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 5_000;

type MessageHandler = (event: ChatMessageEvent) => void;
type NotificationHandler = (notification: NotificationItem) => void;
type StatusHandler = (connected: boolean) => void;

interface RealtimeEnvelope {
  type: string;
  payload?: unknown;
}

class ChatSocket {
  private ws: WebSocket | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private notificationHandlers = new Set<NotificationHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private connected = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  /** Khởi tạo kết nối nếu chưa có. An toàn khi gọi nhiều lần. */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    this.intentionalClose = false;
    const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(token)}`);
    this.ws = ws;

    ws.onmessage = (e) => this.handleEnvelope(e.data);
    ws.onclose = () => {
      this.stopPing();
      this.setConnected(false);
      if (!this.intentionalClose) this.scheduleReconnect();
    };
    ws.onerror = () => {
      // onclose sẽ chạy ngay sau onerror và lo việc reconnect.
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }

  private handleEnvelope(raw: string): void {
    let envelope: RealtimeEnvelope;
    try {
      envelope = JSON.parse(raw) as RealtimeEnvelope;
    } catch (err) {
      console.error('[chatSocket] parse lỗi:', err);
      return;
    }

    switch (envelope.type) {
      case 'AUTH_OK':
        // Đã xác thực handshake xong -> bắt đầu heartbeat + báo connected.
        this.setConnected(true);
        this.startPing();
        break;
      case 'CHAT_MESSAGE_CREATED':
        this.messageHandlers.forEach((h) => h(envelope.payload as ChatMessageEvent));
        break;
      case 'NEW_NOTIFICATION':
        this.notificationHandlers.forEach((h) => h(envelope.payload as NotificationItem));
        break;
      case 'PONG':
        break;
      case 'ERROR':
        console.error('[chatSocket] server error:', envelope.payload);
        break;
      default:
        break;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ws = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private setConnected(value: boolean): void {
    this.connected = value;
    this.statusHandlers.forEach((h) => h(value));
  }

  isConnected(): boolean {
    return this.connected;
  }

  /** Đăng ký nhận tin nhắn chat realtime. Trả về hàm hủy đăng ký. */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /** Đăng ký nhận thông báo realtime. Trả về hàm hủy đăng ký. */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  /** Đăng ký theo dõi trạng thái kết nối. Trả về hàm hủy đăng ký. */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.connected);
    return () => this.statusHandlers.delete(handler);
  }

  /** Ngắt hẳn kết nối (dùng khi logout). */
  disconnect(): void {
    this.intentionalClose = true;
    this.messageHandlers.clear();
    this.notificationHandlers.clear();
    this.statusHandlers.clear();
    this.stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }
}

export const chatSocket = new ChatSocket();
