import React, { useState } from 'react';
import { ListTodo, Check, X, Calendar, MessageSquare, Video, Clock } from 'lucide-react';

interface BookingRequest {
  id: string;
  menteeName: string;
  avatarUrl: string;
  specialization: string;
  learningGoalTitle: string;
  learningGoalDescription: string;
  date: string;
  time: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  meetingLink?: string;
  rejectReason?: string;
}

export const MentorBookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRequest[]>([
    {
      id: 'b1',
      menteeName: 'Nguyễn Tiến Đạt',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
      specialization: 'An toàn thông tin',
      learningGoalTitle: 'Học cơ bản về React Native để code app',
      learningGoalDescription: 'Mình đã có nền tảng tốt về CSS và JS, muốn học cấu trúc JSX và cách hoạt động của React Native component.',
      date: '2026-06-15',
      time: '14:00 - 15:30',
      status: 'PENDING',
    },
    {
      id: 'b2',
      menteeName: 'Nguyễn Hoàng Nam',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
      specialization: 'Thiết kế đồ họa',
      learningGoalTitle: 'Hướng dẫn deploy app React lên Vercel/Netlify',
      learningGoalDescription: 'Em có làm một trang portfolio bằng React thuần nhưng chưa biết cấu hình deploy và trỏ domain cá nhân.',
      date: '2026-06-17',
      time: '10:00 - 11:30',
      status: 'ACCEPTED',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    },
  ]);

  const [activeBooking, setActiveBooking] = useState<BookingRequest | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenAccept = (booking: BookingRequest) => {
    setActiveBooking(booking);
    setMeetingLink('https://meet.google.com/');
    setShowLinkModal(true);
  };

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingLink.trim()) return;

    if (activeBooking) {
      setBookings(
        bookings.map((b) => {
          if (b.id === activeBooking.id) {
            return { ...b, status: 'ACCEPTED', meetingLink };
          }
          return b;
        })
      );
      setShowLinkModal(false);
      setSuccessMsg(`Đã chấp nhận yêu cầu của ${activeBooking.menteeName}. Lịch hẹn và link Google Meet đã được gửi tới sinh viên!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleOpenReject = (booking: BookingRequest) => {
    setActiveBooking(booking);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    if (activeBooking) {
      setBookings(
        bookings.map((b) => {
          if (b.id === activeBooking.id) {
            return { ...b, status: 'REJECTED', rejectReason };
          }
          return b;
        })
      );
      setShowRejectModal(false);
      setSuccessMsg('Đã từ chối lịch đặt hẹn.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleMarkComplete = (bookingId: string) => {
    setBookings(
      bookings.map((b) => {
        if (b.id === bookingId) {
          return { ...b, status: 'COMPLETED' };
        }
        return b;
      })
    );
    setSuccessMsg('Đã đánh dấu buổi học hoàn thành. Vòng lặp feedback đã được kích hoạt!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <ListTodo className="w-8 h-8 text-brand-terracotta" /> Quản lý đặt lịch hẹn
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Xem các yêu cầu đặt lịch học từ sinh viên (mentee), phê duyệt, gửi link phòng học trực tuyến và đánh dấu hoàn tất.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-field text-body font-semibold">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* List bookings */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="meetmind-card py-16 text-center text-brand-text-muted text-body font-semibold rounded-card">
            Hiện không có yêu cầu đặt lịch nào.
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
            >
              {/* Applicant, times, learning goals */}
              <div className="space-y-3 flex-1 text-left">
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatarUrl}
                    alt={b.menteeName}
                    className="w-9 h-9 rounded-field object-cover border border-brand-border"
                  />
                  <div>
                    <span className="text-body font-bold text-brand-text block">{b.menteeName}</span>
                    <span className="text-meta text-brand-text-muted font-bold">{b.specialization}</span>
                  </div>
                  <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ml-2 ${
                    b.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : b.status === 'ACCEPTED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : b.status === 'COMPLETED'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {b.status === 'PENDING' ? 'Chờ duyệt' : b.status === 'ACCEPTED' ? 'Đã nhận' : b.status === 'COMPLETED' ? 'Hoàn thành' : 'Từ chối'}
                  </span>
                </div>

                <div className="space-y-1 bg-brand-bg/40 border border-brand-border p-3.5 rounded-card">
                  <p className="text-body font-bold text-brand-text flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-terracotta" /> Mục tiêu: {b.learningGoalTitle}
                  </p>
                  <p className="text-meta text-brand-text-muted font-medium pl-5">
                    {b.learningGoalDescription}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-meta text-brand-text-muted font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-terracotta" /> Ngày học: {b.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-blue" /> Khung giờ: {b.time}
                  </span>
                  {b.meetingLink && (
                    <span className="flex items-center gap-1 text-brand-blue">
                      <Video className="w-3.5 h-3.5" /> Link: <a href={b.meetingLink} target="_blank" rel="noreferrer" className="hover:underline font-bold">{b.meetingLink}</a>
                    </span>
                  )}
                  {b.status === 'REJECTED' && b.rejectReason && (
                    <span className="text-red-500 font-bold">Lý do từ chối: {b.rejectReason}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                {b.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenAccept(b)}
                      className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2 px-3.5 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Nhận dạy
                    </button>
                    <button
                      onClick={() => handleOpenReject(b)}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-body font-bold py-2 px-3.5 rounded-field cursor-pointer transition-all active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                )}

                {b.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleMarkComplete(b.id)}
                    className="bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2 px-4 rounded-field cursor-pointer transition-all active:scale-95"
                  >
                    Đánh dấu hoàn thành
                  </button>
                )}
                
                {b.status === 'COMPLETED' && (
                  <span className="text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3 py-1.5 rounded-field">
                    Buổi học đã hoàn tất
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Meet Link Modal */}
      {showLinkModal && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative">
            <button
              onClick={() => setShowLinkModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div className="text-left">
                <h3 className="text-lg font-bold font-serif text-brand-text">Cung cấp liên kết phòng học</h3>
                <p className="text-brand-text-muted text-body font-medium mt-0.5">
                  Nhập link Google Meet, Zoom hoặc MS Teams cho buổi học với {activeBooking.menteeName}.
                </p>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Link phòng học trực tuyến (URL)</label>
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Xác nhận & Gửi</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative">
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="text-left">
                <h3 className="text-lg font-bold font-serif text-brand-text">Từ chối yêu cầu đặt lịch</h3>
                <p className="text-brand-text-muted text-body font-semibold mt-0.5">
                  Vui lòng cung cấp lý do cho sinh viên.
                </p>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Lý do từ chối (bắt buộc)</label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Khung giờ này mình bận đột xuất, bạn chọn slot rảnh khác giúp mình nhé..."
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all"
              >
                Xác nhận Từ chối
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
