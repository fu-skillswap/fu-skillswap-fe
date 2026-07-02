import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark, Calendar, Clock, Video, Check, X, Star, MessageSquare, Smile, Loader2, AlertCircle, Coins,
} from 'lucide-react';
import { bookingsApi } from '../api/bookings';
import { onAvatarError } from '../lib/img';
import { chatSocket } from '../lib/chatSocket';
import { PaymentModal } from '../components/PaymentModal';
import type { Booking, BookingStatus, MeetingPlatform } from '../api/types';

const WEEKDAYS = [
  { value: 'MONDAY', label: 'T2' },
  { value: 'TUESDAY', label: 'T3' },
  { value: 'WEDNESDAY', label: 'T4' },
  { value: 'THURSDAY', label: 'T5' },
  { value: 'FRIDAY', label: 'T6' },
  { value: 'SATURDAY', label: 'T7' },
  { value: 'SUNDAY', label: 'CN' },
];

const getWeekDays = (offset = 0) => {
  const start = new Date();
  const day = start.getDay();
  // Monday is 1, Sunday is 0. Adjust so Monday is first day of the week
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
  const monday = new Date(start.setDate(diff));
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
};

const formatDateISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateDisplay = (d: Date) => {
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const getLocalDateStr = (iso: string) => {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Service có thu phí (cần thanh toán) khi không free và giá SCoin > 0. */
const isPaidBooking = (b: Booking) =>
  b.serviceIsFreeSnapshot === false && (b.servicePriceScoinSnapshot ?? 0) > 0;

/* ---------------------------------------------------------------------------
 * "Lịch của tôi" hợp nhất 2 luồng: lịch mình DẠY (role=MENTOR) và lịch mình
 * ĐẶT với mentor khác (role=MENTEE). Dữ liệu lấy thật từ BE qua bookingsApi.
 *  1. Cần xác nhận       -> mình dạy, status PENDING
 *  2. Đã xác nhận        -> mình dạy, status ACCEPTED
 *  3. Lịch hẹn mentor khác -> mình đặt (mọi trạng thái)
 *  4. Đã hoàn thành      -> mình dạy, status COMPLETED
 * ------------------------------------------------------------------------- */

type TabKey = 'confirmed' | 'pending' | 'completed' | 'awaiting_payment';

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
    case 'ACCEPTED_AWAITING_PAYMENT': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'PAYMENT_EXPIRED': return 'bg-red-50 text-red-600 border-red-200';
    case 'AWAITING_MENTOR_COMPLETION':
    case 'AWAITING_MENTEE_CONFIRMATION': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'COMPLETED':
    case 'AUTO_CLOSED': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'UNDER_REVIEW': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-red-50 text-red-700 border-red-200';
  }
};

const statusLabel = (status: BookingStatus, completedLabel = 'Hoàn thành') => {
  switch (status) {
    case 'PENDING': return 'Chờ duyệt';
    case 'ACCEPTED': return 'Đã nhận';
    case 'ACCEPTED_AWAITING_PAYMENT': return 'Chờ thanh toán';
    case 'PAYMENT_EXPIRED': return 'Hết hạn thanh toán';
    case 'AWAITING_MENTOR_COMPLETION': return 'Chờ mentor xác nhận';
    case 'AWAITING_MENTEE_CONFIRMATION': return 'Chờ mentee xác nhận';
    case 'COMPLETED': return completedLabel;
    case 'AUTO_CLOSED': return 'Tự đóng';
    case 'UNDER_REVIEW': return 'Đang xem xét';
    case 'EXPIRED': return 'Hết hạn';
    case 'REJECTED': return 'Từ chối';
    case 'CANCELLED_BY_MENTEE':
    case 'CANCELLED_BY_MENTOR': return 'Đã huỷ';
    case 'NO_SHOW': return 'Vắng mặt';
    default: return status;
  }
};

const dateOf = (b: Booking) =>
  b.selectedStartTime ? new Date(b.selectedStartTime).toLocaleDateString('vi-VN') : '—';

const timeOf = (b: Booking) => {
  if (!b.selectedStartTime) return '—';
  const s = new Date(b.selectedStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const e = b.selectedEndTime
    ? new Date(b.selectedEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  return e ? `${s} - ${e}` : s;
};

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [bookingWeekOffset, setBookingWeekOffset] = useState<number>(0);

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
  const [issueBooking, setIssueBooking] = useState<Booking | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [satisfactionNote, setSatisfactionNote] = useState('');
  const [publicComment, setPublicComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Booking mentee đang mở chi tiết từ calendar
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  // Booking mentee đang mở modal thanh toán PayOS.
  const [payBooking, setPayBooking] = useState<Booking | null>(null);

  // States cho Hủy lịch
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRole, setCancelRole] = useState<'MENTEE' | 'MENTOR'>('MENTEE');
  const [activeCancelBooking, setActiveCancelBooking] = useState<Booking | null>(null);

  const flashSuccess = (msg: string, _duration?: number) => {
    window.dispatchEvent(new CustomEvent('push-toast', {
      detail: {
        title: 'Thành công',
        message: msg,
        type: 'BOOKING_ACCEPTED'
      }
    }));
    window.dispatchEvent(new Event('refresh-notifications'));
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoadError(err?.response?.data?.message || 'Không tải được lịch hẹn. Vui lòng thử lại.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime: BE đẩy BOOKING_STATUS_UPDATED khi trạng thái booking đổi (vd thanh
  // toán PayOS xong → PAID). Refresh ngầm để danh sách cập nhật không cần F5.
  useEffect(() => {
    chatSocket.connect();
    const unsubscribe = chatSocket.onBookingStatus(() => { load(true); });
    return () => { unsubscribe(); };
  }, [load]);

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
      if (activeMentorBooking.status === 'PENDING') {
        await bookingsApi.accept(activeMentorBooking.bookingId);
      }
      await bookingsApi.saveMeetingLink(activeMentorBooking.bookingId, {
        meetingPlatform,
        meetingLink: meetingPlatform === 'OFFLINE' ? undefined : meetingLink.trim(),
        location: meetingPlatform === 'OFFLINE' ? meetingLink.trim() : undefined,
      });
      setShowLinkModal(false);
      if (activeMentorBooking.status === 'PENDING') {
        flashSuccess(`Đã chấp nhận yêu cầu của ${activeMentorBooking.menteeDisplayName}. Lịch hẹn và link học đã được lưu!`);
      } else {
        flashSuccess('Cập nhật liên kết phòng học thành công!');
      }
      await load();
    } catch (err: any) {
      setShowLinkModal(false);
      flashSuccess(err?.response?.data?.message || 'Chấp nhận/Cập nhật liên kết phòng học thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenEditMeetingLink = (booking: Booking) => {
    setActiveMentorBooking(booking);
    setMeetingLink(booking.meetingLink || '');
    setMeetingPlatform(booking.meetingPlatform || 'GOOGLE_MEET');
    setShowLinkModal(true);
  };

  const handleOpenCancel = (booking: Booking, role: 'MENTEE' | 'MENTOR') => {
    setActiveCancelBooking(booking);
    setCancelRole(role);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCancelBooking || !cancelReason.trim()) return;
    setBusy(true);
    try {
      if (cancelRole === 'MENTOR') {
        await bookingsApi.mentorCancel(activeCancelBooking.bookingId, cancelReason.trim());
        flashSuccess('Đã hủy lịch dạy thành công.');
      } else {
        await bookingsApi.cancel(activeCancelBooking.bookingId, cancelReason.trim());
        flashSuccess('Đã hủy yêu cầu/lịch học thành công.');
      }
      setShowCancelModal(false);
      await load();
    } catch (err: any) {
      setShowCancelModal(false);
      flashSuccess(err?.response?.data?.message || 'Hủy lịch thất bại.');
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

  // Mentor báo đã dạy xong (chỉ hợp lệ khi AWAITING_MENTOR_COMPLETION) -> chờ mentee xác nhận.
  const handleMarkComplete = async (bookingId: string) => {
    setBusy(true);
    try {
      await bookingsApi.mentorComplete(bookingId);
      flashSuccess('Đã báo hoàn thành. Đang chờ mentee xác nhận.');
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

  // Mentee xác nhận buổi đã diễn ra ổn (AWAITING_MENTEE_CONFIRMATION -> COMPLETED).
  const handleConfirmAsMentee = async (bookingId: string) => {
    setBusy(true);
    try {
      await bookingsApi.confirm(bookingId);
      flashSuccess('Đã xác nhận hoàn thành! Bạn có thể gửi đánh giá cho Mentor.', 4000);
      await load();
    } catch (err: any) {
      flashSuccess(err?.response?.data?.message || 'Xác nhận thất bại.');
    } finally {
      setBusy(false);
    }
  };

  /* ---- Báo sự cố sau buổi học ---- */
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueBooking || !issueDescription.trim()) return;
    setBusy(true);
    try {
      await bookingsApi.submitIssue(issueBooking.bookingId, {
        issueType: 'NO_SHOW_OR_QUALITY_OR_OTHER',
        description: issueDescription.trim(),
        wantsAdminReview: true,
      });
      setShowIssueModal(false);
      flashSuccess('Đã gửi báo cáo sự cố. Admin sẽ xem xét.');
      await load();
    } catch (err: any) {
      setShowIssueModal(false);
      flashSuccess(err?.response?.data?.message || 'Gửi báo cáo thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenIssue = (booking: Booking) => {
    setIssueBooking(booking);
    setIssueDescription('');
    setShowIssueModal(true);
  };

  const getBookingsForDay = (dayDate: Date) => {
    const targetStr = formatDateISO(dayDate);
    const allBookings = [...mentorBookings, ...menteeBookings];
    // Lọc trùng ID
    const uniqueBookings = allBookings.filter((b, index, self) =>
      self.findIndex(x => x.bookingId === b.bookingId) === index
    );
    return uniqueBookings.filter(b => b.selectedStartTime && getLocalDateStr(b.selectedStartTime) === targetStr);
  };

  const pendingList = mentorBookings.filter((b) => b.status === 'PENDING');
  const awaitingPaymentList = mentorBookings.filter((b) => b.status === 'ACCEPTED_AWAITING_PAYMENT');
  // "Đã xác nhận" gồm các lịch dạy đã được mentor đồng ý và đã thanh toán (hoặc miễn phí).
  const confirmedList = mentorBookings.filter((b) => b.status === 'ACCEPTED');
  // "Đã hoàn thành" gồm các lịch hẹn đã học xong (đang chờ xác nhận hoàn thành, tự đóng, đang xem xét, hoặc đã hoàn tất).
  const completedList = mentorBookings.filter((b) =>
    ['COMPLETED', 'AUTO_CLOSED', 'UNDER_REVIEW', 'AWAITING_MENTOR_COMPLETION', 'AWAITING_MENTEE_CONFIRMATION'].includes(b.status),
  );

  // Mentee bookings gộp vào tab theo trạng thái
  const menteePendingList = menteeBookings.filter((b) => b.status === 'PENDING');
  const menteeAwaitingPaymentList = menteeBookings.filter((b) => b.status === 'ACCEPTED_AWAITING_PAYMENT');
  const menteeConfirmedList = menteeBookings.filter((b) =>
    ['ACCEPTED', 'PAYMENT_EXPIRED', 'AWAITING_MENTOR_COMPLETION', 'AWAITING_MENTEE_CONFIRMATION'].includes(b.status),
  );
  const menteeCompletedList = menteeBookings.filter((b) =>
    ['COMPLETED', 'AUTO_CLOSED', 'UNDER_REVIEW', 'REJECTED', 'CANCELLED'].includes(b.status),
  );

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Cần xác nhận', count: pendingList.length + menteePendingList.length },
    { key: 'awaiting_payment', label: 'Chờ thanh toán', count: awaitingPaymentList.length + menteeAwaitingPaymentList.length },
    { key: 'confirmed', label: 'Đã xác nhận', count: confirmedList.length + menteeConfirmedList.length },
    { key: 'completed', label: 'Đã hoàn thành', count: completedList.length + menteeCompletedList.length },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Title & View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
            <Bookmark className="w-8 h-8 text-brand-terracotta" /> Lịch của tôi
          </h1>
          <p className="text-brand-text-muted text-body font-medium">
            Quản lý tất cả lịch hẹn trao đổi kỹ năng — cả lịch bạn nhận dạy và lịch bạn đặt với mentor khác.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-brand-bg border border-brand-border p-1 rounded-field gap-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'bg-surface text-brand-text shadow-sm border border-brand-border' : 'text-brand-text-muted hover:text-brand-text'}`}
          >
            Dạng danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-surface text-brand-text shadow-sm border border-brand-border' : 'text-brand-text-muted hover:text-brand-text'}`}
          >
            Dạng lịch (Calendar)
          </button>
        </div>
      </div>

      {/* Success notification is now handled globally at top-right */}

      {loadError && (
        <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-field text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Tabs list (Only show when in list view) */}
      {viewMode === 'list' && (
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
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-terracotta" /></div>
      ) : viewMode === 'calendar' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Calendar Header with Week Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/60 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-brand-terracotta shrink-0" />
              <div className="text-left">
                <h3 className="text-base font-bold text-brand-text">Lịch học & dạy hàng tuần</h3>
                <p className="text-meta text-brand-text-muted font-semibold">
                  {(() => {
                    const weekDays = getWeekDays(bookingWeekOffset);
                    return `Từ thứ 2 (${formatDateDisplay(weekDays[0])}) đến Chủ nhật (${formatDateDisplay(weekDays[6])})`;
                  })()}
                </p>
              </div>
            </div>
            
            <div className="flex bg-brand-bg border border-brand-border p-0.5 rounded-field gap-0.5 shrink-0">
              <button
                onClick={() => setBookingWeekOffset(bookingWeekOffset - 1)}
                className="px-3 py-1 rounded-[8px] text-[11px] font-bold text-brand-text-muted hover:text-brand-text cursor-pointer"
              >
                Tuần trước
              </button>
              <button
                onClick={() => setBookingWeekOffset(0)}
                className={`px-3 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${bookingWeekOffset === 0 ? 'bg-surface text-brand-text shadow-xs border border-brand-border' : 'text-brand-text-muted hover:text-brand-text'}`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setBookingWeekOffset(bookingWeekOffset + 1)}
                className={`px-3 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${bookingWeekOffset === 1 ? 'bg-surface text-brand-text shadow-xs border border-brand-border' : 'text-brand-text-muted hover:text-brand-text'}`}
              >
                Tuần sau
              </button>
              <button
                onClick={() => setBookingWeekOffset(bookingWeekOffset + 2)}
                className="px-3 py-1 rounded-[8px] text-[11px] font-bold text-brand-text-muted hover:text-brand-text cursor-pointer"
              >
                Tuần sau nữa
              </button>
            </div>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
            {getWeekDays(bookingWeekOffset).map((dayDate, idx) => {
              const dayName = WEEKDAYS[idx].label;
              const dateStr = formatDateISO(dayDate);
              const isToday = formatDateISO(new Date()) === dateStr;
              const dayBookings = getBookingsForDay(dayDate);
              
              return (
                <div key={idx} className={`rounded-xl border p-3 flex flex-col text-left min-h-[350px] transition-all ${isToday ? 'bg-brand-terracotta/5 border-brand-terracotta/30' : 'bg-surface/30 border-brand-border'}`}>
                  {/* Day Header */}
                  <div className="text-center pb-2 border-b border-brand-border mb-2 shrink-0">
                    <span className={`text-[11px] font-extrabold block tracking-wide uppercase ${isToday ? 'text-brand-terracotta' : 'text-brand-text-muted'}`}>
                      {dayName}
                    </span>
                    <span className={`text-title font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-full mt-1 ${isToday ? 'bg-brand-terracotta text-white shadow-sm' : 'text-brand-text'}`}>
                      {dayDate.getDate()}
                    </span>
                  </div>
                  
                  {/* Day Bookings List */}
                  <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none pr-0.5">
                    {dayBookings.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-8">
                        <span className="text-[10px] text-brand-text-muted/40 italic font-semibold text-center leading-tight">
                          Không có lịch hẹn
                        </span>
                      </div>
                    ) : (
                      dayBookings.map(b => {
                        // Xác định vai trò của user hiện tại trong booking
                        const isUserMentor = mentorBookings.some(x => x.bookingId === b.bookingId);
                        const partnerName = isUserMentor ? b.menteeDisplayName : b.mentorDisplayName;
                        const partnerAvatar = isUserMentor ? b.menteeAvatarUrl : b.mentorAvatarUrl;
                        
                        return (
                          <div
                            key={b.bookingId}
                            onClick={() => setSelectedBookingForDetail(b)}
                            className={`p-2.5 rounded-lg border text-left shadow-xs cursor-pointer transition-all hover:-translate-y-[1px] hover:shadow-sm ${
                              isUserMentor 
                                ? 'bg-blue-50/75 border-blue-200 hover:bg-blue-100/75 text-blue-900' 
                                : 'bg-amber-50/75 border-amber-200 hover:bg-amber-100/75 text-amber-900'
                            }`}
                          >
                            <div className="text-[10px] font-bold flex items-center justify-between gap-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-brand-text-muted/70 shrink-0" />
                                {b.selectedStartTime ? new Date(b.selectedStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isUserMentor ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'}`}>
                                {isUserMentor ? 'DẠY' : 'HỌC'}
                              </span>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              <div className="text-[10px] font-extrabold truncate" title={b.serviceTitle}>
                                {b.serviceTitle}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold text-brand-text-muted">
                                <img
                                  src={partnerAvatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                                  onError={onAvatarError}
                                  alt={partnerName}
                                  className="w-4 h-4 rounded-full border border-brand-border"
                                />
                                <span className="truncate">{partnerName}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* --- Tab: Cần xác nhận / Chờ thanh toán / Đã xác nhận / Đã hoàn thành --- */}
          {(tab === 'pending' || tab === 'awaiting_payment' || tab === 'confirmed' || tab === 'completed') && (() => {
            const mentorList =
              tab === 'pending'
                ? pendingList
                : tab === 'awaiting_payment'
                ? awaitingPaymentList
                : tab === 'confirmed'
                ? confirmedList
                : completedList;
            const menteeList =
              tab === 'pending'
                ? menteePendingList
                : tab === 'awaiting_payment'
                ? menteeAwaitingPaymentList
                : tab === 'confirmed'
                ? menteeConfirmedList
                : menteeCompletedList;
            const totalEmpty = mentorList.length === 0 && menteeList.length === 0;
            return (
            <div className="space-y-4">
              {totalEmpty ? (
                <div className="meetmind-card py-16 text-center text-brand-text-muted text-body font-semibold rounded-card">
                  {tab === 'pending' && 'Không có yêu cầu nào đang chờ xác nhận.'}
                  {tab === 'awaiting_payment' && 'Không có lịch hẹn nào đang chờ thanh toán.'}
                  {tab === 'confirmed' && 'Bạn chưa có lịch nào được xác nhận.'}
                  {tab === 'completed' && 'Chưa có buổi nào hoàn thành.'}
                </div>
              ) : (
                <>
                {mentorList.map((b) => (
                  <div
                    key={b.bookingId}
                    className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.menteeAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                          onError={onAvatarError}
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
                      {/* Status Badge */}
                      {b.status !== 'PENDING' && (
                        <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border mb-1 ${statusBadge(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 justify-end items-center">
                        {b.status === 'PENDING' && (
                          <>
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
                          </>
                        )}

                        {b.canComplete && (
                          <button
                            disabled={busy}
                            onClick={() => handleMarkComplete(b.bookingId)}
                            className="bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2 px-4 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                          >
                            Đánh dấu hoàn thành
                          </button>
                        )}

                        {b.conversationId && (
                          <button
                            onClick={() => navigate(`/chat?conversationId=${b.conversationId}`)}
                            className="flex items-center gap-1.5 bg-brand-blue/15 hover:bg-brand-blue/25 text-brand-blue border border-brand-blue/30 text-body font-bold py-2 px-3.5 rounded-field cursor-pointer transition-all active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Trò chuyện
                          </button>
                        )}

                        {b.status === 'ACCEPTED' && (
                          <button
                            disabled={busy}
                            onClick={() => handleOpenEditMeetingLink(b)}
                            className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2 px-3.5 rounded-field cursor-pointer transition-all active:scale-95"
                          >
                            Đổi link học
                          </button>
                        )}

                        {b.canCancel && (
                          <button
                            disabled={busy}
                            onClick={() => handleOpenCancel(b, 'MENTOR')}
                            className="text-meta font-bold text-red-600 hover:underline cursor-pointer py-2 px-1"
                          >
                            Hủy dạy
                          </button>
                        )}

                        {b.status === 'AWAITING_MENTOR_COMPLETION' && (
                          <button
                            disabled={busy}
                            onClick={() => handleOpenIssue(b)}
                            className="text-meta font-bold text-red-600 hover:underline cursor-pointer py-2 px-1"
                          >
                            Báo sự cố
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {menteeList.map((b) => {
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
                            onError={onAvatarError}
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
                        {/* Status Badge */}
                        {b.status !== 'PENDING' && (
                          <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border mb-1 ${statusBadge(b.status)}`}>
                            {statusLabel(b.status, 'Đã học xong')}
                          </span>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 justify-end items-center">
                          {b.status === 'PENDING' && (
                            <span className="text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3.5 py-2 rounded-field mr-2">
                              Đang chờ Mentor phản hồi
                            </span>
                          )}

                          {(b.status === 'ACCEPTED' || b.status === 'ACCEPTED_AWAITING_PAYMENT') && isPaidBooking(b) && (
                            <button
                              onClick={() => setPayBooking(b)}
                              className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95 animate-pulse"
                            >
                              <Coins className="w-3.5 h-3.5" /> Thanh toán ngay — {(b.servicePriceScoinSnapshot ?? 0).toLocaleString('en-US')} SCoin
                            </button>
                          )}
                          {b.status === 'PAYMENT_EXPIRED' && (
                            <span className="text-meta text-red-600 font-bold bg-red-50 border border-red-200 px-3.5 py-2 rounded-field">
                              Đã hết hạn thanh toán (2h)
                            </span>
                          )}

                          {b.meetingLink && b.status === 'ACCEPTED' && (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-blue/20 transition-all active:scale-95"
                            >
                              <Video className="w-3.5 h-3.5" /> Vào lớp học
                            </a>
                          )}

                          {b.canComplete && (
                            <button
                              disabled={busy}
                              onClick={() => handleConfirmAsMentee(b.bookingId)}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Xác nhận hoàn thành
                            </button>
                          )}

                          {b.canSubmitFeedback && (
                            reviewed ? (
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
                            )
                          )}

                          {b.conversationId && (
                            <button
                              onClick={() => navigate(`/chat?conversationId=${b.conversationId}`)}
                              className="flex items-center gap-1.5 bg-brand-blue/15 hover:bg-brand-blue/25 text-brand-blue border border-brand-blue/30 text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Trò chuyện
                            </button>
                          )}

                          {b.canCancel && (
                            <button
                              disabled={busy}
                              onClick={() => handleOpenCancel(b, 'MENTEE')}
                              className="text-meta font-bold text-red-600 hover:underline cursor-pointer py-2 px-1"
                            >
                              Hủy lịch học
                            </button>
                          )}

                          {(b.status === 'AWAITING_MENTEE_CONFIRMATION' || b.status === 'AWAITING_MENTOR_COMPLETION') && (
                            <button
                              disabled={busy}
                              onClick={() => handleOpenIssue(b)}
                              className="text-meta font-bold text-red-600 hover:underline cursor-pointer py-2 px-1"
                            >
                              Báo sự cố
                            </button>
                          )}
                        </div>

                        {b.status === 'REJECTED' && (
                          <span className="text-meta text-red-600 font-bold bg-red-50 border border-red-100 px-3.5 py-2 rounded-field">
                            Đã từ chối lịch hẹn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                </>
              )}
            </div>
            );
          })()}
        </>
      )}

      {/* Payment Modal (mentee thanh toán booking qua PayOS) */}
      {payBooking && (
        <PaymentModal
          bookingId={payBooking.bookingId}
          serviceTitle={payBooking.serviceTitle}
          basePriceScoin={payBooking.servicePriceScoinSnapshot}
          onClose={() => setPayBooking(null)}
          onPaid={() => { setPayBooking(null); flashSuccess('Thanh toán thành công!'); load(); }}
        />
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
                <h3 className="text-lg font-bold font-serif text-brand-text">
                  {activeMentorBooking.status === 'ACCEPTED' ? 'Cập nhật liên kết phòng học' : 'Cung cấp liên kết phòng học'}
                </h3>
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

      {/* Issue Modal (báo sự cố sau buổi học) */}
      {showIssueModal && issueBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div className="text-left">
                <h3 className="text-lg font-bold font-serif text-brand-text">Báo sự cố buổi học</h3>
                <p className="text-brand-text-muted text-body font-medium mt-0.5">
                  Mô tả vấn đề (mentor vắng mặt, chất lượng, lý do khác). Admin sẽ xem xét.
                </p>
              </div>
              <textarea
                required
                rows={4}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                maxLength={2000}
                placeholder="Mô tả chi tiết sự cố bạn gặp phải..."
                className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none font-medium"
              />
              <button
                type="submit"
                disabled={busy || !issueDescription.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                Gửi báo cáo
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

      {/* Cancel Booking Modal */}
      {showCancelModal && activeCancelBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative shadow-xl">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="text-left">
                <h3 className="text-lg font-bold font-serif text-brand-text">Xác nhận hủy lịch hẹn</h3>
                <p className="text-brand-text-muted text-body font-medium mt-0.5">
                  Vui lòng cung cấp lý do hủy để thông báo cho đối phương.
                </p>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">
                  Lý do hủy (bắt buộc, tối thiểu 5 ký tự)
                </label>
                <textarea
                  required
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Mình bận việc đột xuất không thể tham gia đúng hẹn..."
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={busy || cancelReason.trim().length < 5}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Xác nhận Hủy lịch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedBookingForDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {(() => {
              const b = selectedBookingForDetail;
              const isUserMentor = mentorBookings.some(x => x.bookingId === b.bookingId);
              const partnerName = isUserMentor ? b.menteeDisplayName : b.mentorDisplayName;
              const partnerAvatar = isUserMentor ? b.menteeAvatarUrl : b.mentorAvatarUrl;
              const reviewed = reviewedIds.has(b.bookingId);

              return (
                <div className="space-y-4 text-left animate-scaleUp">
                  <div className="border-b border-brand-border pb-3">
                    <h3 className="text-lg font-bold font-serif text-brand-text">Chi tiết lịch hẹn</h3>
                    <p className="text-brand-text-muted text-meta font-extrabold uppercase tracking-wider mt-0.5">
                      Vai trò: {isUserMentor ? 'Mentor (Bạn dạy)' : 'Mentee (Bạn học)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-brand-bg/40 border border-brand-border rounded-card">
                    <img
                      src={partnerAvatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                      onError={onAvatarError}
                      alt={partnerName}
                      className="w-12 h-12 rounded-card bg-surface object-cover border border-brand-border"
                    />
                    <div className="text-left">
                      <span className="text-body font-extrabold text-brand-text block">{partnerName}</span>
                      <span className="text-meta text-brand-terracotta font-extrabold">{b.serviceTitle || ''}</span>
                    </div>
                    <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ml-auto shrink-0 ${statusBadge(b.status)}`}>
                      {statusLabel(b.status, isUserMentor ? 'Hoàn thành' : 'Đã học xong')}
                    </span>
                  </div>

                  <div className="space-y-1 bg-brand-bg/40 border border-brand-border p-3.5 rounded-card text-left">
                    <p className="text-body font-extrabold text-brand-text flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-terracotta shrink-0" /> Mục tiêu: {b.learningGoalTitle}
                    </p>
                    {b.learningGoalDescription && (
                      <p className="text-meta text-brand-text-muted font-medium pl-5 leading-relaxed">{b.learningGoalDescription}</p>
                    )}
                  </div>

                  <div className="space-y-2 bg-surface border border-brand-border p-3.5 rounded-card text-meta font-bold text-brand-text-muted text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                      <span>Ngày học: {dateOf(b)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                      <span>Khung giờ: {timeOf(b)}</span>
                    </div>
                    {b.meetingLink && (
                      <div className="flex items-center gap-2 text-brand-blue">
                        <Video className="w-3.5 h-3.5 shrink-0" />
                        <span>Phòng học:{' '}
                          <a href={b.meetingLink} target="_blank" rel="noreferrer" className="hover:underline font-extrabold text-brand-blue">
                            {b.meetingLink}
                          </a>
                        </span>
                      </div>
                    )}
                    {b.status === 'REJECTED' && b.rejectReason && (
                      <div className="text-red-500 font-extrabold border-t border-brand-border/60 pt-1.5 mt-1.5">
                        Lý do từ chối: {b.rejectReason}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Mentor role */}
                  {isUserMentor && (
                    <div className="pt-2 flex justify-end gap-2">
                      {b.status === 'PENDING' && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => { handleOpenAccept(b); setSelectedBookingForDetail(null); }}
                            className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md transition-all active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" /> Nhận dạy
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => { handleOpenReject(b); setSelectedBookingForDetail(null); }}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </>
                      )}

                      {b.status === 'ACCEPTED' && (
                        <div className="w-full flex flex-col gap-2">
                          <span className="w-full text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3 py-2 rounded-field text-center block">
                            Chờ tới giờ học
                          </span>
                          <div className="flex justify-center gap-4 text-meta">
                            <button
                              disabled={busy}
                              onClick={() => { handleOpenEditMeetingLink(b); setSelectedBookingForDetail(null); }}
                              className="font-bold text-brand-blue hover:underline cursor-pointer"
                            >
                              Đổi link học
                            </button>
                            <span className="text-brand-border/60">|</span>
                            <button
                              disabled={busy}
                              onClick={() => { handleOpenCancel(b, 'MENTOR'); setSelectedBookingForDetail(null); }}
                              className="font-bold text-red-600 hover:underline cursor-pointer"
                            >
                              Hủy dạy
                            </button>
                          </div>
                        </div>
                      )}

                      {b.status === 'AWAITING_MENTOR_COMPLETION' && (
                        <div className="w-full flex flex-col gap-2">
                          <button
                            disabled={busy}
                            onClick={() => { handleMarkComplete(b.bookingId); setSelectedBookingForDetail(null); }}
                            className="w-full bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all active:scale-95"
                          >
                            Đánh dấu hoàn thành
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => { handleOpenIssue(b); setSelectedBookingForDetail(null); }}
                            className="w-full text-center text-meta font-bold text-red-600 hover:underline cursor-pointer py-1"
                          >
                            Báo sự cố
                          </button>
                        </div>
                      )}

                      {b.status === 'AWAITING_MENTEE_CONFIRMATION' && (
                        <span className="w-full text-meta text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-field text-center block">
                          Chờ mentee xác nhận
                        </span>
                      )}

                      {(b.status === 'COMPLETED' || b.status === 'AUTO_CLOSED') && (
                        <span className="w-full text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3 py-2 rounded-field text-center block">
                          Buổi học đã hoàn tất
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for Mentee role */}
                  {!isUserMentor && (
                    <div className="pt-2 flex flex-col gap-2">
                      {b.status === 'PENDING' && (
                        <div className="w-full flex flex-col gap-2">
                          <span className="w-full text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3.5 py-2 rounded-field text-center block">
                            Đang chờ Mentor phản hồi
                          </span>
                          <button
                            disabled={busy}
                            onClick={() => { handleOpenCancel(b, 'MENTEE'); setSelectedBookingForDetail(null); }}
                            className="w-full text-center text-meta font-bold text-red-600 hover:underline cursor-pointer py-1"
                          >
                            Hủy yêu cầu
                          </button>
                        </div>
                      )}

                      {b.status === 'ACCEPTED' && (
                        <div className="flex flex-col gap-2 w-full">
                          {isPaidBooking(b) && (
                            <button
                              onClick={() => { setPayBooking(b); setSelectedBookingForDetail(null); }}
                              className="flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all"
                            >
                              <Coins className="w-3.5 h-3.5" /> Thanh toán {(b.servicePriceScoinSnapshot ?? 0).toLocaleString('en-US')} SCoin
                            </button>
                          )}
                          {b.meetingLink ? (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all"
                            >
                              <Video className="w-3.5 h-3.5" /> Vào lớp học
                            </a>
                          ) : (
                            <span className="w-full text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3 py-2 rounded-field text-center block">
                              Chờ mentor gửi link
                            </span>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => { handleOpenCancel(b, 'MENTEE'); setSelectedBookingForDetail(null); }}
                            className="w-full text-center text-meta font-bold text-red-600 hover:underline cursor-pointer py-1 mt-1"
                          >
                            Hủy lịch học
                          </button>
                        </div>
                      )}

                      {b.status === 'AWAITING_MENTOR_COMPLETION' && (
                        <span className="w-full text-meta text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-3 py-2 text-center block">
                          Chờ mentor xác nhận hoàn thành
                        </span>
                      )}

                      {b.status === 'AWAITING_MENTEE_CONFIRMATION' && (
                        <div className="w-full flex flex-col gap-2">
                          <button
                            disabled={busy}
                            onClick={() => { handleConfirmAsMentee(b.bookingId); setSelectedBookingForDetail(null); }}
                            className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Xác nhận hoàn thành
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => { handleOpenIssue(b); setSelectedBookingForDetail(null); }}
                            className="w-full text-center text-meta font-bold text-red-600 hover:underline cursor-pointer py-1"
                          >
                            Báo sự cố
                          </button>
                        </div>
                      )}

                      {(b.status === 'COMPLETED' || b.status === 'AUTO_CLOSED') && (
                        <div className="w-full">
                          {reviewed ? (
                            <span className="w-full text-meta text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-2 rounded-field text-center block">
                              Đã gửi đánh giá
                            </span>
                          ) : (
                            <button
                              onClick={() => { handleOpenReview(b); setSelectedBookingForDetail(null); }}
                              className="w-full flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all"
                            >
                              <Smile className="w-3.5 h-3.5" /> Đánh giá buổi học
                            </button>
                          )}
                        </div>
                      )}

                      {b.status === 'REJECTED' && (
                        <span className="w-full text-meta text-red-600 font-bold bg-red-50 border border-red-100 px-3.5 py-2 rounded-field text-center block">
                          Đã từ chối lịch hẹn
                        </span>
                      )}
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
