import { useEffect, useState } from 'react';
import {
  Bookmark, Calendar, Clock, Video, Check, X, Star, MessageSquare, Smile,
} from 'lucide-react';

/* ---------------------------------------------------------------------------
 * Vì mentee và mentor dùng chung 1 giao diện, trang "Lịch của tôi" hợp nhất
 * cả 2 luồng cũ (MentorBookings + MenteeBookings) thành 1 trang duy nhất,
 * chia theo 4 tab:
 *  1. Đã xác nhận       -> lịch mình DẠY đã được mình nhận (status ACCEPTED)
 *  2. Cần xác nhận       -> lịch mình DẠY đang chờ mình duyệt (status PENDING)
 *  3. Lịch hẹn mentor khác -> lịch mình ĐẶT với các mentor khác (mọi trạng thái)
 *  4. Đã hoàn thành      -> lịch mình DẠY đã hoàn tất (status COMPLETED)
 * ------------------------------------------------------------------------- */

interface MentorSideBooking {
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

interface MenteeSideBooking {
  id: string;
  mentorName: string;
  avatarUrl: string;
  skill: string;
  date: string;
  time: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  meetingLink?: string;
  rejectReason?: string;
  learningGoal: string;
  isReviewed?: boolean;
  reviewRating?: number;
  reviewComment?: string;
}

const MENTOR_SEED: MentorSideBooking[] = [
  {
    id: 'b1',
    menteeName: 'Nguyễn Tiến Đạt',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
    specialization: 'An toàn thông tin',
    learningGoalTitle: 'Học cơ bản về React Native để code app',
    learningGoalDescription:
      'Mình đã có nền tảng tốt về CSS và JS, muốn học cấu trúc JSX và cách hoạt động của React Native component.',
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
    learningGoalDescription:
      'Em có làm một trang portfolio bằng React thuần nhưng chưa biết cấu hình deploy và trỏ domain cá nhân.',
    date: '2026-06-17',
    time: '10:00 - 11:30',
    status: 'ACCEPTED',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
];

const MENTEE_SEED: MenteeSideBooking[] = [
  {
    id: 'b1',
    mentorName: 'Trần Hoàng Long',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
    skill: 'Python & Machine Learning',
    date: '2026-06-15',
    time: '14:00 - 15:30',
    status: 'PENDING',
    learningGoal: 'Học cơ bản về PyTorch và xây dựng mạng neural đơn giản',
  },
  {
    id: 'b2',
    mentorName: 'Lê Minh Hương',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
    skill: 'React & Node.js',
    date: '2026-06-12',
    time: '09:30 - 11:00',
    status: 'ACCEPTED',
    meetingLink: 'https://meet.google.com/xyz-pdq-abc',
    learningGoal: 'Sửa lỗi re-render vô hạn trong React Context & Hook',
  },
  {
    id: 'b3',
    mentorName: 'Nguyễn Hoàng Nam',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
    skill: 'UI Design & Figma',
    date: '2026-06-08',
    time: '15:00 - 16:30',
    status: 'COMPLETED',
    meetingLink: 'https://meet.google.com/tuv-wxyz-qrs',
    learningGoal: 'Góp ý layout portfolio cá nhân và căn lề Auto Layout trong Figma',
    isReviewed: false,
  },
  {
    id: 'b4',
    mentorName: 'Nguyễn Tiến Đạt',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
    skill: 'An ninh mạng',
    date: '2026-06-05',
    time: '10:00 - 11:30',
    status: 'REJECTED',
    rejectReason: 'Khoảng thời gian này mình có lịch thi tại trường.',
    learningGoal: 'Hướng dẫn cài đặt Kali Linux song song trên Windows',
  },
];

function mergeById<T extends { id: string }>(seed: T[], stored: T[]): T[] {
  const storedIds = new Set(stored.map((s) => s.id));
  return [...stored, ...seed.filter((s) => !storedIds.has(s.id))];
}

function loadFromStorage<T extends { id: string }>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seed;
    return mergeById(seed, parsed);
  } catch {
    return seed;
  }
}

type TabKey = 'confirmed' | 'pending' | 'mine' | 'completed';

const statusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ACCEPTED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-red-50 text-red-700 border-red-200';
  }
};

const statusLabel = (status: string, completedLabel = 'Hoàn thành') => {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt';
    case 'ACCEPTED':
      return 'Đã nhận';
    case 'COMPLETED':
      return completedLabel;
    default:
      return 'Từ chối';
  }
};

export const MyBookings: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('pending');

  const [mentorBookings, setMentorBookings] = useState<MentorSideBooking[]>(() =>
    loadFromStorage('mockMentorBookings', MENTOR_SEED)
  );
  const [menteeBookings, setMenteeBookings] = useState<MenteeSideBooking[]>(() =>
    loadFromStorage('mockMenteeBookings', MENTEE_SEED)
  );

  // Đồng bộ lại vào localStorage mỗi khi state thay đổi, để các trang khác
  // (Dashboard, Mentors) ghi request mới vẫn được phản ánh khi quay lại trang.
  useEffect(() => {
    localStorage.setItem('mockMentorBookings', JSON.stringify(mentorBookings));
  }, [mentorBookings]);

  useEffect(() => {
    localStorage.setItem('mockMenteeBookings', JSON.stringify(menteeBookings));
  }, [menteeBookings]);

  const [activeMentorBooking, setActiveMentorBooking] = useState<MentorSideBooking | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [activeMenteeBooking, setActiveMenteeBooking] = useState<MenteeSideBooking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [satisfactionNote, setSatisfactionNote] = useState('');
  const [publicComment, setPublicComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const flashSuccess = (msg: string, duration = 3000) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), duration);
  };

  /* ---- Mentor-side actions (lịch mình dạy) ---- */
  const handleOpenAccept = (booking: MentorSideBooking) => {
    setActiveMentorBooking(booking);
    setMeetingLink('https://meet.google.com/');
    setShowLinkModal(true);
  };

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingLink.trim() || !activeMentorBooking) return;
    setMentorBookings((prev) =>
      prev.map((b) => (b.id === activeMentorBooking.id ? { ...b, status: 'ACCEPTED', meetingLink } : b))
    );
    setShowLinkModal(false);
    flashSuccess(`Đã chấp nhận yêu cầu của ${activeMentorBooking.menteeName}. Lịch hẹn và link đã được gửi!`);
  };

  const handleOpenReject = (booking: MentorSideBooking) => {
    setActiveMentorBooking(booking);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim() || !activeMentorBooking) return;
    setMentorBookings((prev) =>
      prev.map((b) => (b.id === activeMentorBooking.id ? { ...b, status: 'REJECTED', rejectReason } : b))
    );
    setShowRejectModal(false);
    flashSuccess('Đã từ chối lịch đặt hẹn.');
  };

  const handleMarkComplete = (bookingId: string) => {
    setMentorBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'COMPLETED' } : b)));
    flashSuccess('Đã đánh dấu buổi học hoàn thành. Vòng lặp feedback đã được kích hoạt!');
  };

  /* ---- Mentee-side actions (lịch mình hẹn mentor khác) ---- */
  const handleOpenReview = (booking: MenteeSideBooking) => {
    setActiveMenteeBooking(booking);
    setRating(5);
    setSatisfactionNote('');
    setPublicComment('');
    setIsPublic(true);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenteeBooking) return;
    setMenteeBookings((prev) =>
      prev.map((b) =>
        b.id === activeMenteeBooking.id
          ? { ...b, isReviewed: true, reviewRating: rating, reviewComment: publicComment }
          : b
      )
    );
    setShowReviewModal(false);
    flashSuccess(`Cảm ơn bạn đã gửi đánh giá cho Mentor ${activeMenteeBooking.mentorName}!`, 4000);
  };

  const handleSimulateComplete = (bookingId: string) => {
    setMenteeBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'COMPLETED', isReviewed: false } : b))
    );
    flashSuccess('Đã kết thúc buổi học! Bạn có thể gửi phản hồi để giúp Mentor hoàn thiện hơn.', 4000);
  };

  const confirmedList = mentorBookings.filter((b) => b.status === 'ACCEPTED');
  const pendingList = mentorBookings.filter((b) => b.status === 'PENDING');
  const completedList = mentorBookings.filter((b) => b.status === 'COMPLETED');

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Cần xác nhận', count: pendingList.length },
    { key: 'confirmed', label: 'Đã xác nhận', count: confirmedList.length },
    { key: 'mine', label: 'Lịch hẹn mentor khác', count: menteeBookings.length },
    { key: 'completed', label: 'Đã hoàn thành', count: completedList.length },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <Bookmark className="w-8 h-8 text-brand-terracotta" /> Lịch của tôi
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Quản lý tất cả lịch hẹn trao đổi kỹ năng — cả lịch bạn nhận dạy và lịch bạn đặt với mentor khác.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-field text-body font-semibold animate-fadeIn">
          <Check className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-field text-body font-bold transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/20'
                : 'bg-brand-bg/60 text-brand-text-muted hover:bg-brand-bg hover:text-brand-text'
            }`}
          >
            {t.label}
            <span
              className={`text-meta font-extrabold rounded-full px-1.5 min-w-[1.4rem] text-center ${
                tab === t.key ? 'bg-white/25' : 'bg-brand-border/60'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* --- Tab: Cần xác nhận / Đã xác nhận / Đã hoàn thành (lịch mình dạy) --- */}
      {(tab === 'pending' || tab === 'confirmed' || tab === 'completed') && (
        <div className="space-y-4">
          {(tab === 'pending' ? pendingList : tab === 'confirmed' ? confirmedList : completedList).length === 0 ? (
            <div className="meetmind-card py-16 text-center text-brand-text-muted text-body font-semibold rounded-card">
              {tab === 'pending' && 'Không có yêu cầu nào đang chờ bạn xác nhận.'}
              {tab === 'confirmed' && 'Bạn chưa có lịch dạy nào được xác nhận.'}
              {tab === 'completed' && 'Chưa có buổi dạy nào hoàn thành.'}
            </div>
          ) : (
            (tab === 'pending' ? pendingList : tab === 'confirmed' ? confirmedList : completedList).map((b) => (
              <div
                key={b.id}
                className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
              >
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
                    <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ml-2 ${statusBadge(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                  </div>

                  <div className="space-y-1 bg-brand-bg/40 border border-brand-border p-3.5 rounded-card">
                    <p className="text-body font-bold text-brand-text flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-terracotta" /> Mục tiêu: {b.learningGoalTitle}
                    </p>
                    <p className="text-meta text-brand-text-muted font-medium pl-5">{b.learningGoalDescription}</p>
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
                        <Video className="w-3.5 h-3.5" /> Link:{' '}
                        <a href={b.meetingLink} target="_blank" rel="noreferrer" className="hover:underline font-bold">
                          {b.meetingLink}
                        </a>
                      </span>
                    )}
                  </div>
                </div>

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
      )}

      {/* --- Tab: Lịch hẹn mentor khác (lịch mình đặt làm mentee) --- */}
      {tab === 'mine' && (
        <div className="space-y-4">
          {menteeBookings.length === 0 ? (
            <div className="meetmind-card py-16 text-center text-brand-text-muted text-body font-semibold rounded-card">
              Bạn chưa gửi yêu cầu đặt lịch nào.
            </div>
          ) : (
            menteeBookings.map((b) => (
              <div
                key={b.id}
                className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="space-y-3 flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.avatarUrl}
                      alt={b.mentorName}
                      className="w-10 h-10 rounded-field object-cover border border-brand-border"
                    />
                    <div>
                      <span className="text-body font-bold text-brand-text block">{b.mentorName}</span>
                      <span className="text-meta text-brand-terracotta font-bold">{b.skill}</span>
                    </div>
                    <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ml-2 ${statusBadge(b.status)}`}>
                      {statusLabel(b.status, 'Đã học xong')}
                    </span>
                  </div>

                  <div className="space-y-1 bg-brand-bg/40 border border-brand-border p-3.5 rounded-card">
                    <p className="text-body font-bold text-brand-text flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-terracotta" /> Mục tiêu của bạn:
                    </p>
                    <p className="text-meta text-brand-text-muted font-medium pl-5 leading-relaxed">{b.learningGoal}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-meta text-brand-text-muted font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-terracotta" /> Ngày: {b.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-blue" /> Thời gian: {b.time}
                    </span>
                    {b.meetingLink && b.status === 'ACCEPTED' && (
                      <span className="flex items-center gap-1 text-brand-blue">
                        <Video className="w-3.5 h-3.5 animate-pulse" /> Link phòng:{' '}
                        <a href={b.meetingLink} target="_blank" rel="noreferrer" className="hover:underline font-bold text-brand-blue">
                          {b.meetingLink}
                        </a>
                      </span>
                    )}
                    {b.status === 'REJECTED' && b.rejectReason && (
                      <span className="text-red-500 font-bold">Lý do từ chối: {b.rejectReason}</span>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                  {b.status === 'PENDING' && (
                    <span className="text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3.5 py-2 rounded-field">
                      Đang chờ Mentor phản hồi
                    </span>
                  )}

                  {b.status === 'ACCEPTED' && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-blue/20 transition-all active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5" /> Vào lớp học
                      </a>
                      <button
                        onClick={() => handleSimulateComplete(b.id)}
                        className="flex items-center gap-1 bg-surface hover:bg-brand-bg border border-brand-border text-brand-text text-body font-bold py-2.5 px-3.5 rounded-field cursor-pointer transition-all active:scale-95"
                      >
                        Kết thúc buổi học
                      </button>
                    </div>
                  )}

                  {b.status === 'COMPLETED' && (
                    <div className="space-y-1.5 text-right">
                      {b.isReviewed ? (
                        <div className="space-y-1 text-right">
                          <span className="text-meta text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-field block">
                            Đã gửi đánh giá
                          </span>
                          <div className="flex justify-end gap-0.5 text-amber-500">
                            {Array.from({ length: b.reviewRating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(b)}
                          className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95 animate-bounce"
                        >
                          <Smile className="w-3.5 h-3.5" /> Đánh giá buổi học
                        </button>
                      )}
                    </div>
                  )}

                  {b.status === 'REJECTED' && (
                    <span className="text-meta text-red-600 font-bold bg-red-50 border border-red-100 px-3.5 py-2 rounded-field">
                      Đã từ chối lịch hẹn
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Meet Link Modal (chấp nhận dạy) */}
      {showLinkModal && activeMentorBooking && (
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
                  Nhập link Google Meet, Zoom hoặc MS Teams cho buổi học với {activeMentorBooking.menteeName}.
                </p>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">
                  Link phòng học trực tuyến (URL)
                </label>
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
      {showRejectModal && activeMentorBooking && (
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
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">
                  Lý do từ chối (bắt buộc)
                </label>
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

      {/* Review & Feedback Modal */}
      {showReviewModal && activeMenteeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl text-left space-y-4">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-left space-y-1 border-b border-brand-border pb-3">
              <h3 className="text-xl font-bold font-serif text-brand-text">Đánh giá & Góp ý buổi học</h3>
              <p className="text-brand-text-muted text-body font-medium">
                Chia sẻ trải nghiệm học tập cùng Mentor{' '}
                <span className="font-bold text-brand-text">{activeMenteeBooking.mentorName}</span>
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div className="text-center py-2 bg-brand-bg/40 border border-brand-border rounded-card space-y-1.5">
                <span className="text-meta font-bold text-brand-text-muted uppercase tracking-wider block">
                  Độ hài lòng chung
                </span>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredRating !== null ? hoveredRating : rating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-brand-border fill-transparent'
                        } transition-colors duration-150`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-body font-bold text-brand-terracotta block">
                  {rating === 5 && 'Tuyệt vời, vượt mong đợi! ⭐'}
                  {rating === 4 && 'Rất tốt, rất nhiệt tình! 👍'}
                  {rating === 3 && 'Tạm ổn, cần cải thiện thêm 🤝'}
                  {rating === 2 && 'Chưa thực sự tốt 😕'}
                  {rating === 1 && 'Rất không hài lòng 😞'}
                </span>
              </div>

              <div>
                <label className="block text-body font-bold text-brand-text-muted mb-1.5">
                  Góp ý riêng cho Mentor (Bảo mật, chỉ Mentor xem)
                </label>
                <textarea
                  value={satisfactionNote}
                  onChange={(e) => setSatisfactionNote(e.target.value)}
                  rows={2}
                  placeholder="Gợi ý: Cách truyền đạt của mentor có nhanh quá không? Cách chọn ví dụ thực tế đã dễ hiểu chưa?..."
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              <div>
                <label className="block text-body font-bold text-brand-text-muted mb-1.5 flex items-center gap-1">
                  Đánh giá công khai (Hiển thị trên hồ sơ Mentor)
                </label>
                <textarea
                  required
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Anh Long hỗ trợ support phần neural network cực kỳ dễ hiểu. Cảm ơn anh rất nhiều!"
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-terracotta"></div>
                  <span className="ml-3 text-body font-bold text-brand-text-muted">Đồng ý hiển thị đánh giá này công khai</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-1/3 py-3 rounded-field border border-brand-border hover:bg-brand-bg text-brand-text text-body font-bold cursor-pointer transition-all active:scale-95 text-center"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/25 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Gửi phản hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
