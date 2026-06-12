import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Video, Phone, ShieldAlert, Sparkles, Check, CheckCheck } from 'lucide-react';

interface ChatPartner {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  status: 'ONLINE' | 'OFFLINE';
  lastMessage: string;
  time: string;
  unread?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'ME' | 'PARTNER';
  text: string;
  time: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
}

export const Chat: React.FC = () => {
  // List of active conversations
  const [inbox, setInbox] = useState<ChatPartner[]>([
    {
      id: 'm1',
      name: 'Trần Hoàng Long',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
      role: 'Mentor Trí tuệ nhân tạo (K18)',
      status: 'ONLINE',
      lastMessage: 'Ok em, tối nay 20:00 mình call nhé!',
      time: '10:30',
      unread: true
    },
    {
      id: 'm2',
      name: 'Lê Minh Hương',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      role: 'Mentor Lập trình Fullstack (K18)',
      status: 'ONLINE',
      lastMessage: 'Bạn sửa lỗi render React được chưa?',
      time: 'Hôm qua',
      unread: false
    },
    {
      id: 'm5',
      name: 'Nguyễn Hoàng Nam',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
      role: 'Mentee Thiết kế đồ họa (K19)',
      status: 'OFFLINE',
      lastMessage: 'Cho mình xin file Auto Layout Figma hôm trước nha.',
      time: '2 ngày trước',
      unread: false
    }
  ]);

  const [activePartnerId, setActivePartnerId] = useState('m1');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
    m1: [
      { id: 'm1_1', sender: 'PARTNER', text: 'Chào em, anh thấy em gửi đề xuất đặt lịch học PyTorch cơ bản.', time: '10:20' },
      { id: 'm1_2', sender: 'ME', text: 'Dạ vâng anh, tối nay em đang làm dở Lab 2 mà không biết code model mạng neural sao cho đúng.', time: '10:25' },
      { id: 'm1_3', sender: 'PARTNER', text: 'Ok em, tối nay 20:00 mình call nhé!', time: '10:30', status: 'READ' }
    ],
    m2: [
      { id: 'm2_1', sender: 'PARTNER', text: 'Bạn đã xem qua cấu trúc Context API mình gửi chưa?', time: 'Hôm qua' },
      { id: 'm2_2', sender: 'ME', text: 'Dạ em xem rồi, nó chạy mượt mà lắm, hết bị re-render vô hạn rồi chị.', time: 'Hôm qua' },
      { id: 'm2_3', sender: 'PARTNER', text: 'Bạn sửa lỗi render React được chưa?', time: 'Hôm qua', status: 'READ' }
    ],
    m5: [
      { id: 'm5_1', sender: 'ME', text: 'Cảm ơn Nam đã hướng dẫn mình cách căn chỉnh lưới Figma nha!', time: '2 ngày trước' },
      { id: 'm5_2', sender: 'PARTNER', text: 'Cho mình xin file Auto Layout Figma hôm trước nha.', time: '2 ngày trước', status: 'READ' }
    ]
  });

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePartner = inbox.find((p) => p.id === activePartnerId) || inbox[0];
  const activeMessages = messagesMap[activePartnerId] || [];

  // Scroll to bottom of message list on updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activePartnerId, messagesMap]);

  // Mark unread conversation as read
  useEffect(() => {
    if (activePartner.unread) {
      setInbox(
        inbox.map((p) => {
          if (p.id === activePartner.id) {
            return { ...p, unread: false };
          }
          return p;
        })
      );
    }
  }, [activePartnerId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'ME',
      text: inputText,
      time: currentTime,
      status: 'SENT'
    };

    // Update messages map
    const updatedMessages = [...activeMessages, userMsg];
    setMessagesMap({
      ...messagesMap,
      [activePartnerId]: updatedMessages
    });

    // Update last message in Inbox list
    setInbox(
      inbox.map((p) => {
        if (p.id === activePartnerId) {
          return { ...p, lastMessage: inputText, time: currentTime };
        }
        return p;
      })
    );

    setInputText('');

    // Simulate Mentor Auto-Reply after 1.2 seconds
    setTimeout(() => {
      // Set status to Delivered & Read
      setMessagesMap((prev) => {
        const currentMsgs = prev[activePartnerId] || [];
        const index = currentMsgs.findIndex((m) => m.id === userMsg.id);
        if (index !== -1) {
          currentMsgs[index] = { ...currentMsgs[index], status: 'READ' };
        }
        return { ...prev, [activePartnerId]: currentMsgs };
      });

      const replyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        sender: 'PARTNER',
        text: `Chào bạn, mình đã nhận được tin nhắn: "${inputText}". Mình sẽ phản hồi chi tiết sớm nhé! 👍`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activePartnerId]: [...(prev[activePartnerId] || []), replyMsg]
      }));

      setInbox((prevInbox) =>
        prevInbox.map((p) => {
          if (p.id === activePartnerId) {
            return { ...p, lastMessage: replyMsg.text, time: replyMsg.time };
          }
          return p;
        })
      );
    }, 1200);
  };

  const filteredInbox = inbox.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="meetmind-card rounded-3xl overflow-hidden flex h-[78vh] border border-slate-200/80 bg-white">
      
      {/* Left panel: Inbox chat list */}
      <div className="w-full sm:w-80 md:w-96 border-r border-brand-border flex flex-col shrink-0 bg-slate-50/50">
        {/* Inbox header / Search */}
        <div className="p-4 border-b border-brand-border space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-slate-700 animate-pulse" /> Hộp thư trò chuyện
            </h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-brand-grey" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm đối tác chat..."
              className="w-full bg-slate-50 border border-brand-border rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand-secondary font-semibold"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-brand-border bg-white">
          {filteredInbox.length === 0 ? (
            <div className="py-8 text-center text-xs text-brand-text-muted font-bold">
              Không tìm thấy cuộc hội thoại nào.
            </div>
          ) : (
            filteredInbox.map((partner) => (
              <button
                key={partner.id}
                onClick={() => setActivePartnerId(partner.id)}
                className={`w-full p-4 flex gap-3 text-left transition-colors cursor-pointer ${
                  activePartnerId === partner.id
                    ? 'bg-brand-primary/10 border-l-4 border-brand-primary shadow-xs'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={partner.avatarUrl}
                    alt={partner.name}
                    className="w-11 h-11 rounded-xl object-cover border border-brand-border"
                  />
                  {partner.status === 'ONLINE' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dot-glow-green" />
                  )}
                </div>

                {/* Info summary */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-brand-text truncate">{partner.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">{partner.time}</span>
                  </div>
                  <span className="text-[9px] text-slate-700 font-extrabold block truncate uppercase leading-none">{partner.role}</span>
                  <p className={`text-[10px] truncate leading-tight font-medium ${
                    partner.unread && activePartnerId !== partner.id
                      ? 'text-brand-text font-extrabold'
                      : 'text-brand-text-muted'
                  }`}>
                    {partner.lastMessage}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Chat messages window */}
      <div className="flex-1 flex flex-col justify-between bg-white text-left">
        {/* Active conversation Header */}
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={activePartner.avatarUrl}
              alt={activePartner.name}
              className="w-10 h-10 rounded-xl object-cover border border-brand-border"
            />
            <div>
              <span className="text-xs font-bold text-brand-text block">{activePartner.name}</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activePartner.status === 'ONLINE' ? 'bg-green-500' : 'bg-brand-grey'}`} />
                <span className="text-[10px] text-brand-text-muted font-bold uppercase leading-none">{activePartner.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-brand-border bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl border border-brand-border bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer">
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messaging Timeline area */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-50/20 space-y-4">
          
          {/* Disclaimer details */}
          <div className="max-w-md mx-auto p-3.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-2xl flex items-start gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>Tin nhắn được mã hóa bảo mật. Mọi giao dịch đặt lịch và trao đổi học tập đều tuân thủ Quy tắc ứng xử FPTU.</span>
          </div>

          {activeMessages.map((msg) => {
            const isMe = msg.sender === 'ME';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
              >
                {/* Partner avatar */}
                {!isMe && (
                  <img
                    src={activePartner.avatarUrl}
                    alt={activePartner.name}
                    className="w-7 h-7 rounded-lg border border-brand-border object-cover mt-1 shrink-0"
                  />
                )}

                {/* Message Bubble container */}
                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                      isMe
                        ? 'bg-brand-primary text-white rounded-br-none shadow-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50'
                    }`}
                  >
                    {msg.text}
                  </div>
                  
                  {/* Status Indicator / Timestamp */}
                  <div className={`text-[9px] text-slate-400 font-semibold flex items-center gap-1 justify-end`}>
                    <span>{msg.time}</span>
                    {isMe && (
                      <span className="text-slate-800">
                        {msg.status === 'READ' ? (
                          <CheckCheck className="w-3 h-3" />
                        ) : msg.status === 'DELIVERED' ? (
                          <CheckCheck className="w-3 h-3 text-slate-350" />
                        ) : (
                          <Check className="w-3 h-3 text-slate-350" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input composer area */}
        <div className="p-4 border-t border-brand-border bg-white shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhắn tin cho ${activePartner.name}...`}
              className="flex-1 bg-slate-50 border border-brand-border rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-brand-secondary font-semibold"
            />
            <button
              type="submit"
              className="p-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl cursor-pointer active:scale-95 shadow-xs transition-all flex items-center justify-center shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
