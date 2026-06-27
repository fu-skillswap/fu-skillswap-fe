// =====================================================================
// src/lib/chatSocket.ts — STOMP/SockJS client cho chat & notification realtime.
// BE: endpoint /ws (SockJS), auth qua query ?token=<accessToken>,
// đẩy tin về /user/queue/messages (payload = ChatMessageEvent)
// và /user/queue/notifications (payload = NotificationItem).
// =====================================================================
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessageEvent, NotificationItem } from '../api/types';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://api.skillswap.asia';

type MessageHandler = (event: ChatMessageEvent) => void;
type NotificationHandler = (notification: NotificationItem) => void;
type StatusHandler = (connected: boolean) => void;

class ChatSocket {
  private client: Client | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private notificationHandlers = new Set<NotificationHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private connected = false;

  /** Khởi tạo kết nối nếu chưa có. An toàn khi gọi nhiều lần. */
  connect(): void {
    if (this.client) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      // Mỗi lần (re)connect lấy token mới nhất để tránh dùng access token đã hết hạn.
      webSocketFactory: () =>
        new SockJS(`${API_BASE}/ws?token=${encodeURIComponent(localStorage.getItem('accessToken') || token)}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.setConnected(true);

        // Đăng ký nhận tin nhắn
        client.subscribe('/user/queue/messages', (msg: IMessage) => {
          try {
            const event = JSON.parse(msg.body) as ChatMessageEvent;
            this.messageHandlers.forEach((h) => h(event));
          } catch (e) {
            console.error('[chatSocket] parse message lỗi:', e);
          }
        });

        // Đăng ký nhận thông báo
        client.subscribe('/user/queue/notifications', (msg: IMessage) => {
          try {
            const event = JSON.parse(msg.body) as NotificationItem;
            this.notificationHandlers.forEach((h) => h(event));
          } catch (e) {
            console.error('[chatSocket] parse notification lỗi:', e);
          }
        });
      },
      onWebSocketClose: () => this.setConnected(false),
      onStompError: (frame) => console.error('[chatSocket] STOMP error:', frame.headers['message']),
    });

    client.activate();
    this.client = client;
  }

  private setConnected(value: boolean) {
    this.connected = value;
    this.statusHandlers.forEach((h) => h(value));
  }

  isConnected(): boolean {
    return this.connected;
  }

  /** Đăng ký nhận tin nhắn realtime. Trả về hàm hủy đăng ký. */
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
    this.messageHandlers.clear();
    this.notificationHandlers.clear();
    this.statusHandlers.clear();
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
  }
}

export const chatSocket = new ChatSocket();
