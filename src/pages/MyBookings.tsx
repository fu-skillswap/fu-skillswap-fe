import { useEffect, useState, useCallback } from 'react';
import {
  Bookmark, Calendar, Clock, Video, Check, X, Star, MessageSquare, Smile, Loader2, AlertCircle,
} from 'lucide-react';
import { bookingsApi } from '../api/bookings';
import type { Booking, BookingStatus, MeetingPlatform } from '../api/types';

/* ---------------------------------------------------------------------------
 * "Lịch của tôi" hợp nhất 2 luồng: lịch mình DẠY (role=MENTOR) và lịch mình
 * ĐẶT với mentor khác (role=MENTEE). Dữ liệu lấy thật từ BE qua bookingsApi.
 *  1. Cần xác nhận       -> mình dạy, status PENDING
 *  2. Đã xác nhận        -> mình dạy, status ACCEPTED
 *  3. Lịch hẹn mentor khác -> mình đặt (mọi trạng thái)
 *  4. Đã hoàn thành      -> mình dạy, status COMPLETED
 * ------------------------------------------------------------------------- */

type TabKey = 'confirmed' | 'pending' | 'mine' | 'completed';

const MEETING_PLATFORMS: { value: MeetingPlatform; label: string }[] = [
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams' },
  { value: 'DISCORD', label: 'Discord' },
  { value: 'OFFLINE', label: 'Trực tiếp (Offline)' },
  { value: 'OTHER', label: 'Khác' },
];

const statusBadge = (status: BookingStatus) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ACCEPTED': return 'bg-green-50 text-green-700 border-green-200';
    case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-red-50 text-red-700 border-red-200';
  }
};

const statusLabel = (status: BookingStatus, completedLabel = 'Hoàn thành') => {
  switch (status) {
    case 'PENDING': return 'Chờ duyệt';
    case 'ACCEPTED': return 'Đã nhận';
    case 'COMPLETED': return completedLabel;
    case 'REJECTED': return 'Từ chối';
    case 'CANCELLED_BY_MENTEE':
    case 'CANCELLED_BY_MENTOR': return 'Đã huỷ';
    case 'NO_SHOW': return 'Vắng mặt';
    default: return status;
  }
};

const dateOf = (b: Booking) =>
  b.requestedStartTime ? new Date(b.requestedStartTime).toLocaleDateString('vi-VN') : '—';

const timeOf = (b: Booking) => {
  if (!b.requestedStartTime) return '—';
  const s = new Date(b.requestedStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const e = b.requestedEndTime
    ? new Date(b.requestedEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  return e ? `${s} - ${e}` : s;
};

export const MyBookings: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('pending');

  const [mentorBookings, setMentorBookings] = useState<Booking[]>([]);
  const [menteeBookings, setMenteeBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Theo dõi cục bộ các booking đã gửi feedback (BE không trả cờ này trong list).
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const [activeMentorBooking, setActiveMentorBooking] = useState<Booking | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform>('GOOGLE_MEET');
  const [rejectReason, setRejectReason] = useState('');

  const [activeMenteeBooking, setActiveMenteeBooking] = useState<Booking | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [asMentor, asMentee] = await Promise.all([
        bookingsApi.listMine({ role: 'MENTOR', size: 100 }),
        bookingsApi.listMine({ role: 'MENTEE', size: 100 }),
      ]);
      setMentorBookings(asMentor?.content ?? []);
      setMenteeBookings(asMentee?.content ?? []);
    } catch (err: any) {
      console.error('Không tải được danh sách booking', err);
      setLoadError(err?.response?.data?.message || 'Không tải được lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ---- Mentor-side actions (lịch mình dạy) ---- */
  const handleOpenAccept = (booking: Booking) => {
    setActiveMentorBooking(booking);
    setMeetingLink('https://meet.google.com/');
    setMeetingPlatform('GOOGLE_MEET');
    setShowLinkModal(true);
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMentorBooking) return;
    if (meetingPlatform !== 'OFFLINE' && !meetingLink.trim()) return;
    setBusy(true);
    try {
      await bookingsApi.accept(activeMentorBooking.bookingId);
      await bookingsApi.saveMeetingLink(activeMentorBooking.bookingId, {
        meetingPlatform,
        meetingLink: meetingPlatform === 'OFFLINE' ? undefined : meetingLink.trim(),
        location: meetingPlatform === 'OFFLINE' ? meetingLink.trim() : undefined,
      });
      setShowLinkModal(false);
      flashSuccess(`Đã chấp nhận yêu cầu của ${activeMentorBooking.menteeDisplayName}. Lịch hẹn và link đã được gửi!`);
      await load();
    } catch (err: any) {
      setShowLinkModal(false);
      flashSuccess(err?.response?.data?.message || 'Chấp nhận lịch thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenReject = (booking: Booking) => {
    setActiveMentorBooking(booking);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim() || !activeMentorBooking) return;
    setBusy(true);
    try {
      await bookingsApi.reject(activeMentorBooking.bookingId, rejectReason.trim());
      setShowRejectModal(false);
      flashSuccess('Đã từ chối lịch đặt hẹn.');
      await load();
    } catch (err: any) {
      setShowRejectModal(false);
      flashSuccess(err?.response?.data?.message || 'Từ chối lịch thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkComplete = async (bookingId: string) => {
    setBusy(true);
    try {
      await bookingsApi.complete(bookingId);
      flashSuccess('Đã đánh dấu buổi học hoàn thành.');
      await load();
    } catch (err: any) {
      flashSuccess(err?.response?.data?.message || 'Đánh dấu hoàn thành thất bại.');
    } finally {
      setBusy(false);
    }
  };

  /* ---- Mentee-side actions ---- */
  const handleOpenReview = (booking: Booking) => {
    setActiveMenteeBooking(booking);
    setRating(5);
    setSatisfactionNote('');
    setPublicComment('');
    setIsPublic(true);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenteeBooking) return;
    setBusy(true);
    try {
      await bookingsApi.submitFeedback(activeMenteeBooking.bookingId, {
        rating,
        satisfactionLevel: rating,
        comment: publicComment || satisfactionNote,
        wouldRecommend: rating >= 4,
        isPublic,
      });
      setReviewedIds((prev) => new Set(prev).add(activeMenteeBooking.bookingId));
      setShowReviewModal(false);
      flashSuccess(`Cảm ơn bạn đã gửi đánh giá cho Mentor ${activeMenteeBooking.mentorDisplayName}!`, 4000);
    } catch (err: any) {
      setShowReviewModal(false);
      flashSuccess(err?.response?.data?.message || 'Gửi đánh giá thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteAsMentee = async (bookingId: string) => {
    setBusy(true);
    try {
      await bookingsApi.complete(bookingId);
      flashSuccess('Đã kết thúc buổi học! Bạn có thể gửi phản hồi để giúp Mentor hoàn thiện hơn.', 4000);
      await load();
    } catch (err: any) {
      flashSuccess(err?.response?.data?.message || 'Kết thúc buổi học thất bại.');
    } finally {
      setBusy(false);
    }
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

      {loadError && (
        <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-field text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
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

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-terracotta" /></div>
      ) : (
        <>
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
                    key={b.bookingId}
                    className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.menteeAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                          alt={b.menteeDisplayName}
                          className="w-9 h-9 rounded-field object-cover border border-brand-border"
                        />
                        <div>
                          <span className="text-body font-bold text-brand-text block">{b.menteeDisplayName}</span>
                          <span className="text-meta text-brand-text-muted font-bold">{b.serviceTitle || ''}</span>
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
                          <Calendar className="w-3.5 h-3.5 text-brand-terracotta" /> Ngày học: {dateOf(b)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand-blue" /> Khung giờ: {timeOf(b)}
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
                            disabled={busy}
                            onClick={() => handleOpenAccept(b)}
                            className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2 px-3.5 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Nhận dạy
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleOpenReject(b)}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-body font-bold py-2 px-3.5 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      )}

                      {b.status === 'ACCEPTED' && (
                        <button
                          disabled={busy}
                          onClick={() => handleMarkComplete(b.bookingId)}
                          className="bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2 px-4 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50"
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
                menteeBookings.map((b) => {
                  const reviewed = reviewedIds.has(b.bookingId);
                  return (
                    <div
                      key={b.bookingId}
                      className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1 text-left">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.mentorAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                            alt={b.mentorDisplayName}
                            className="w-10 h-10 rounded-field object-cover border border-brand-border"
                          />
                          <div>
                            <span className="text-body font-bold text-brand-text block">{b.mentorDisplayName}</span>
                            <span className="text-meta text-brand-terracotta font-bold">{b.serviceTitle || ''}</span>
                          </div>
                          <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ml-2 ${statusBadge(b.status)}`}>
                            {statusLabel(b.status, 'Đã học xong')}
                          </span>
                        </div>

                        <div className="space-y-1 bg-brand-bg/40 border border-brand-border p-3.5 rounded-card">
                          <p className="text-body font-bold text-brand-text flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-terracotta" /> Mục tiêu của bạn: {b.learningGoalTitle}
                          </p>
                          <p className="text-meta text-brand-text-muted font-medium pl-5 leading-relaxed">{b.learningGoalDescription}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-meta text-brand-text-muted font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-brand-terracotta" /> Ngày: {dateOf(b)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-blue" /> Thời gian: {timeOf(b)}
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
                            {b.meetingLink && (
                              <a
                                href={b.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-blue/20 transition-all active:scale-95"
                              >
                                <Video className="w-3.5 h-3.5" /> Vào lớp học
                              </a>
                            )}
                            <button
                              disabled={busy}
                              onClick={() => handleCompleteAsMentee(b.bookingId)}
                              className="flex items-center gap-1 bg-surface hover:bg-brand-bg border border-brand-border text-brand-text text-body font-bold py-2.5 px-3.5 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                            >
                              Kết thúc buổi học
                            </button>
                          </div>
                        )}

                        {b.status === 'COMPLETED' && (
                          <div className="space-y-1.5 text-right">
                            {reviewed ? (
                              <span className="text-meta text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-field block">
                                Đã gửi đánh giá
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenReview(b)}
                                className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95"
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
                  );
                })
              )}
            </div>
          )}
        </>
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
                  Chọn nền tảng và nhập link/địa điểm cho buổi học với {activeMentorBooking.menteeDisplayName}.
                </p>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Nền tảng</label>
                <select
                  value={meetingPlatform}
                  onChange={(e) => setMeetingPlatform(e.target.value as MeetingPlatform)}
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold cursor-pointer"
                >
                  {MEETING_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">
                  {meetingPlatform === 'OFFLINE' ? 'Địa điểm gặp mặt' : 'Link phòng học trực tuyến (URL)'}
                </label>
                <input
                  type={meetingPlatform === 'OFFLINE' ? 'text' : 'url'}
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                  placeholder={meetingPlatform === 'OFFLINE' ? 'Ví dụ: Thư viện Beta, FPTU HCM' : 'https://meet.google.com/abc-defg-hij'}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
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
                disabled={busy}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
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
                <span className="font-bold text-brand-text">{activeMenteeBooking.mentorDisplayName}</span>
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
                  Góp ý riêng cho Mentor (chỉ Mentor xem)
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
                  placeholder="Ví dụ: Anh Long hỗ trợ phần neural network cực kỳ dễ hiểu. Cảm ơn anh rất nhiều!"
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
                  disabled={busy}
                  className="flex-1 py-3 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
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
