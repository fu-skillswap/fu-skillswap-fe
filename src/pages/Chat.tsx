import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, ShieldAlert, Sparkles, Check, Clock, Loader2, MessagesSquare } from 'lucide-react';
import { chatApi } from '../api/chat';
import { chatSocket } from '../lib/chatSocket';
import { useAuth } from '../context/AuthContext';
import type { Conversation, ChatMessage, ChatMessageEvent } from '../api/types';

// Tin nhắn hiển thị: ChatMessage thật + cờ tạm thời (optimistic) khi đang gửi.
type DisplayMessage = ChatMessage & { pending?: boolean; failed?: boolean };

const avatarFor = (c: Pick<Conversation, 'otherUserAvatarUrl' | 'otherUserName' | 'otherUserId'>) =>
  c.otherUserAvatarUrl ||
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.otherUserName || c.otherUserId || 'user')}`;

/** ISO LocalDateTime (không timezone) -> HH:mm hôm nay, hoặc dd/MM cho ngày khác. */
const fmtTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const fmtClock = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const myUserId = user?.publicId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // ---------- Data loaders ----------
  const loadConversations = useCallback(async (selectFirst = false) => {
    try {
      const res = await chatApi.listConversations({ size: 50 });
      const list = res.content ?? [];
      setConversations(list);
      if (selectFirst && !activeIdRef.current && list.length > 0) {
        setActiveId(list[0].id);
      }
      setError(null);
    } catch (e) {
      console.error('Lỗi tải danh sách hội thoại:', e);
      setError('Không tải được danh sách hội thoại.');
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string, showSpinner = false) => {
    if (showSpinner) setLoadingMsgs(true);
    try {
      const res = await chatApi.getMessages(conversationId, { size: 50 });
      // BE trả newest-first -> đảo lại thành thứ tự thời gian tăng dần để hiển thị.
      const ordered = [...(res.content ?? [])].reverse();
      // Chỉ cập nhật nếu vẫn đang xem đúng conversation này (tránh race khi đổi thread).
      if (activeIdRef.current === conversationId) {
        setMessages((prev) => {
          // Giữ lại các tin đang gửi dở (pending) chưa có trong response.
          const pending = prev.filter((m) => m.pending || m.failed);
          return [...ordered, ...pending];
        });
      }
    } catch (e) {
      console.error('Lỗi tải tin nhắn:', e);
    } finally {
      if (showSpinner) setLoadingMsgs(false);
    }
  }, []);

  // Tải inbox lần đầu.
  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

  // Mở 1 hội thoại: chọn active + đánh dấu đã đọc (xoá badge unread cục bộ).
  const openConversation = useCallback((c: Conversation) => {
    setActiveId(c.id);
    if ((c.unreadCount ?? 0) > 0) {
      setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));
      chatApi.markRead(c.id).catch(() => {});
    }
  }, []);

  // Đổi thread -> tải tin nhắn của thread đó.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setMessages([]);
    loadMessages(activeId, true);
  }, [activeId, loadMessages]);

  // WebSocket realtime: kết nối STOMP và lắng nghe tin nhắn đẩy từ BE.
  useEffect(() => {
    chatSocket.connect();
    const offStatus = chatSocket.onStatus(setWsConnected);
    const offMsg = chatSocket.onMessage((event: ChatMessageEvent) => {
      // Tin của chính mình đã được xử lý optimistic qua REST -> bỏ qua để tránh trùng.
      if (myUserId && event.senderId === myUserId) return;

      // Nếu đang mở đúng thread -> chèn tin ngay (dedupe theo messageId).
      if (activeIdRef.current === event.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.messageId)) return prev;
          const incoming: DisplayMessage = {
            id: event.messageId,
            conversationId: event.conversationId,
            senderId: event.senderId,
            senderName: event.senderName,
            messageType: event.messageType,
            content: event.content,
            createdAt: event.createdAt,
            isMine: false,
          };
          return [...prev, incoming];
        });
      }

      // Cập nhật preview + đưa hội thoại lên đầu inbox. Nếu chưa có trong list -> reload.
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === event.conversationId);
        if (!exists) {
          loadConversations();
          return prev;
        }
        return [...prev]
          .map((c) =>
            c.id === event.conversationId
              ? { ...c, lastMessageContent: event.content, lastMessageAt: event.createdAt }
              : c,
          )
          .sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
      });
    });
    return () => {
      offStatus();
      offMsg();
    };
  }, [myUserId, loadConversations]);

  // Polling fallback (phòng khi WS rớt): tin nhắn thread đang mở 10s, inbox 25s.
  useEffect(() => {
    const msgTimer = setInterval(() => {
      if (activeIdRef.current) loadMessages(activeIdRef.current);
    }, 10000);
    const inboxTimer = setInterval(() => loadConversations(), 25000);
    return () => {
      clearInterval(msgTimer);
      clearInterval(inboxTimer);
    };
  }, [loadMessages, loadConversations]);

  // Auto-scroll xuống cuối khi có tin mới / đổi thread.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  // ---------- Send ----------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || !activeId || sending) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic: DisplayMessage = {
      id: tempId,
      conversationId: activeId,
      content,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      isMine: true,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputText('');
    setSending(true);

    try {
      const saved = await chatApi.sendMessage(activeId, content);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...saved } : m)));
      // Cập nhật preview + thứ tự inbox ngay (không chờ poll).
      setConversations((prev) =>
        [...prev]
          .map((c) =>
            c.id === activeId
              ? { ...c, lastMessageContent: content, lastMessageAt: saved.createdAt }
              : c,
          )
          .sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')),
      );
    } catch (err) {
      console.error('Gửi tin nhắn thất bại:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      );
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.otherUserName || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="meetmind-card rounded-card overflow-hidden flex h-[78vh] border border-line bg-surface">
      {/* Left panel: Inbox */}
      <div className="w-full sm:w-80 md:w-96 border-r border-brand-border flex flex-col shrink-0 bg-surface-muted/50">
        <div className="p-4 border-b border-brand-border space-y-3 bg-surface">
          <h2 className="text-lg font-bold text-fg flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-fg-muted animate-pulse" /> Hộp thư trò chuyện
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-brand-grey" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm đối tác chat..."
              className="w-full bg-surface-muted border border-brand-border rounded-field py-2 pl-9 pr-3 text-body focus:outline-none focus:border-brand-secondary font-semibold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-brand-border bg-surface">
          {loadingConvos ? (
            <div className="py-10 flex flex-col items-center gap-2 text-fg-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-meta font-semibold">Đang tải hội thoại...</span>
            </div>
          ) : error && conversations.length === 0 ? (
            <div className="py-8 px-4 text-center text-body text-red-500 font-semibold">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-10 px-5 text-center text-brand-text-muted space-y-2">
              <MessagesSquare className="w-8 h-8 mx-auto text-fg-faint" />
              <p className="text-body font-bold text-fg">
                {searchQuery ? 'Không tìm thấy cuộc hội thoại.' : 'Chưa có cuộc trò chuyện nào.'}
              </p>
              {!searchQuery && (
                <p className="text-meta font-medium leading-relaxed">
                  Cuộc trò chuyện sẽ tự động xuất hiện sau khi một buổi đặt lịch được mentor chấp nhận.
                </p>
              )}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c)}
                  className={`w-full p-4 flex gap-3 text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-brand-primary/10 border-l-4 border-brand-primary shadow-xs'
                      : 'hover:bg-surface-muted'
                  }`}
                >
                  <img
                    src={avatarFor(c)}
                    alt={c.otherUserName || 'Người dùng'}
                    className="w-11 h-11 rounded-field object-cover border border-brand-border shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-body font-bold text-brand-text truncate">
                        {c.otherUserName || 'Người dùng'}
                      </span>
                      <span className="text-meta text-fg-faint font-semibold shrink-0">
                        {fmtTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-meta truncate leading-tight ${(c.unreadCount ?? 0) > 0 ? 'font-bold text-brand-text' : 'font-medium text-brand-text-muted'}`}>
                        {c.lastMessageContent || 'Bắt đầu cuộc trò chuyện...'}
                      </p>
                      {(c.unreadCount ?? 0) > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-brand-primary text-white text-meta font-extrabold flex items-center justify-center">
                          {c.unreadCount! > 99 ? '99+' : c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Messages */}
      <div className="flex-1 flex flex-col justify-between bg-surface text-left">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-brand-text-muted gap-3">
            <MessagesSquare className="w-12 h-12 text-fg-faint" />
            <p className="text-body font-bold text-fg">Chọn một cuộc trò chuyện để bắt đầu</p>
            <p className="text-meta font-medium max-w-xs leading-relaxed">
              Mọi tin nhắn đều gắn với một buổi mentoring đã được xác nhận.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-surface shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={avatarFor(activeConversation)}
                  alt={activeConversation.otherUserName || 'Người dùng'}
                  className="w-10 h-10 rounded-field object-cover border border-brand-border"
                />
                <div>
                  <span className="text-body font-bold text-brand-text block">
                    {activeConversation.otherUserName || 'Người dùng'}
                  </span>
                  <span className="text-meta text-brand-text-muted font-bold uppercase leading-none">
                    {activeConversation.sourceType === 'BOOKING' ? 'Buổi mentoring' : 'Trò chuyện'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5" title={wsConnected ? 'Đã kết nối realtime' : 'Đang kết nối lại...'}>
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-meta text-fg-muted font-semibold hidden sm:inline">
                  {wsConnected ? 'Trực tuyến' : 'Đang kết nối'}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 p-5 overflow-y-auto bg-surface-muted/20 space-y-4">
              <div className="max-w-md mx-auto p-3.5 bg-surface-muted border border-line text-fg-muted text-meta font-semibold rounded-card flex items-start gap-2 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-fg-muted shrink-0 mt-0.5" />
                <span>
                  Tin nhắn gắn với buổi đặt lịch đã xác nhận. Mọi trao đổi học tập đều tuân thủ Quy tắc ứng xử.
                </span>
              </div>

              {loadingMsgs ? (
                <div className="py-10 flex flex-col items-center gap-2 text-fg-muted">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-meta font-semibold">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center text-brand-text-muted text-meta font-semibold">
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.isMine;
                  const isSystem = msg.messageType === 'SYSTEM';
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="inline-block px-3 py-1.5 bg-surface-muted border border-line text-fg-muted text-meta font-semibold rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[75%] ${
                        isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                      }`}
                    >
                      {!isMe && (
                        <img
                          src={avatarFor(activeConversation)}
                          alt={msg.senderName || ''}
                          className="w-7 h-7 rounded-lg border border-brand-border object-cover mt-1 shrink-0"
                        />
                      )}
                      <div className="space-y-1">
                        <div
                          className={`p-3.5 rounded-card text-body font-semibold leading-relaxed ${
                            isMe
                              ? 'bg-brand-primary text-white rounded-br-none shadow-sm'
                              : 'bg-surface-muted text-fg rounded-bl-none border border-line/50'
                          } ${msg.failed ? 'opacity-60 ring-1 ring-red-400' : ''}`}
                        >
                          {msg.content}
                        </div>
                        <div className="text-meta text-fg-faint font-semibold flex items-center gap-1 justify-end">
                          <span>{fmtClock(msg.createdAt)}</span>
                          {isMe && (
                            <span className="text-fg">
                              {msg.failed ? (
                                <span className="text-red-500 font-bold">Gửi lỗi</span>
                              ) : msg.pending ? (
                                <Clock className="w-3 h-3 text-fg-faint" />
                              ) : (
                                <Check className="w-3 h-3 text-fg-faint" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-4 border-t border-brand-border bg-surface shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={2000}
                  placeholder={`Nhắn tin cho ${activeConversation.otherUserName || 'đối phương'}...`}
                  className="flex-1 bg-surface-muted border border-brand-border rounded-field py-3 px-4 text-body focus:outline-none focus:border-brand-secondary font-semibold"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="p-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-field cursor-pointer active:scale-95 shadow-xs transition-all flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gửi tin nhắn"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
