import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Send, Calendar, Clock, Check, X, Star, Search, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { mentorsApi } from '../api/mentors';
import type {
  MentorCard, MentorRecommendation, MentorReview,
  MentorAvailabilitySlot, ServiceSlotCandidate,
} from '../api/types';
import { bookingsApi } from '../api/bookings';
import { onAvatarError } from '../lib/img';

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

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const getDayNameLong = (date: Date) => {
  const dayIndex = date.getDay();
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayIndex];
};

const getSubjectCode = (fullTitle: string = '') => {
  const match = fullTitle.match(/^\[(.*?)\]/);
  return match ? match[1] : '';
};

// View-model gộp card + thông tin tương hợp (nếu có từ recommendations).
interface MentorVM extends MentorCard {
  matchScore?: number;
  matchReasons?: string[];
}

const skillsOf = (m: MentorCard): string[] => (m.helpTopicTags || []).map((t) => t.nameVi);

const fmtDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const parseCandidateTime = (timeStr: string) => {
  if (!timeStr) return new Date();
  if (/^\d{8}T\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    const formatted = `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)}T${timeStr.slice(9)}`;
    return new Date(formatted);
  }
  return new Date(timeStr);
};

export const Mentors: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [mentors, setMentors] = useState<MentorVM[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // chỉ hiện skeleton lần đầu
  const [searching, setSearching] = useState(false);          // các lần tìm sau: giữ list cũ + spinner nhẹ
  const [loadError, setLoadError] = useState<string | null>(null);
  const recMapRef = useRef<Map<string, MentorRecommendation>>(new Map());
  const didInitRef = useRef(false);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeMentor, setActiveMentor] = useState<MentorVM | null>(null);
  const [activeSlots, setActiveSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  // Khung giờ chính xác (candidate) mentee chọn trong slot — key = "startTime|endTime".
  const [candidates, setCandidates] = useState<ServiceSlotCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidateKey, setSelectedCandidateKey] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingWeekOffset, setBookingWeekOffset] = useState<number>(0);

  // Review Drawer State
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [drawerMentor, setDrawerMentor] = useState<MentorVM | null>(null);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // recommendations chỉ tải MỘT LẦN (dùng để ghép matchScore/reasons), không gọi lại mỗi lần gõ.
  useEffect(() => {
    mentorsApi.getRecommendations(12)
      .then((recs) => {
        const m = new Map<string, MentorRecommendation>();
        recs.forEach((r) => r.mentor && m.set(r.mentor.mentorUserId, r));
        recMapRef.current = m;
      })
      .catch(() => { /* không bắt buộc */ });
  }, []);

  // Tải danh sách mentor từ BE (search). Lần đầu -> skeleton; các lần sau -> giữ list cũ.
  const loadMentors = useCallback(async (keyword: string) => {
    const firstLoad = !didInitRef.current;
    if (firstLoad) setInitialLoading(true); else setSearching(true);
    setLoadError(null);
    try {
      const paged = await mentorsApi.search({ keyword: keyword || undefined, size: 24 });
      const cards = paged?.content ?? [];
      const merged: MentorVM[] = cards.map((c) => {
        const rec = recMapRef.current.get(c.mentorUserId);
        return { ...c, matchScore: rec?.matchScore, matchReasons: rec?.matchReasons };
      });
      setMentors(merged);
    } catch (err: any) {
      console.error('Không tải được danh sách mentor', err);
      setLoadError(err?.response?.data?.message || 'Không tải được danh sách mentor. Vui lòng thử lại.');
      setMentors([]);
    } finally {
      didInitRef.current = true;
      setInitialLoading(false);
      setSearching(false);
    }
  }, []);

  // Debounce keyword -> gọi search server-side (lần đầu chạy ngay, không trễ).
  useEffect(() => {
    const delay = didInitRef.current ? 350 : 0;
    const t = setTimeout(() => loadMentors(searchQuery.trim()), delay);
    return () => clearTimeout(t);
  }, [searchQuery, loadMentors]);

  const specializations = Array.from(
    new Set(mentors.map((m) => m.specializationName).filter((s): s is string => !!s)),
  );

  // Lọc phía client cho chuyên ngành & trạng thái (keyword đã lọc ở server).
  const filteredMentors = mentors.filter((m) => {
    const matchesSpecialization = selectedSpecialization === 'ALL' || m.specializationName === selectedSpecialization;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'AVAILABLE' && m.isAvailable) ||
      (selectedStatus === 'BUSY' && !m.isAvailable);
    return matchesSpecialization && matchesStatus;
  });

  const fetchSlots = async (mentorUserId: string) => {
    setBookingLoading(true);
    try {
      const slots = await mentorsApi.getAvailabilitySlots(mentorUserId);
      setActiveSlots(slots);
      if (slots.length === 1) setSelectedSlotId(slots[0].slotId);
    } catch (err: any) {
      console.error('Lỗi tải slots:', err);
      setBookingError('Không tải được thông tin lịch rảnh của mentor.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSwitchWeek = async (offset: number) => {
    if (!activeMentor) return;
    setBookingWeekOffset(offset);
    setSelectedSlotId('');
    setSelectedServiceId('');
    setSelectedCandidateKey('');
    setCandidates([]);
    await fetchSlots(activeMentor.mentorUserId);
  };

  const handleOpenBooking = async (mentor: MentorVM) => {
    setActiveMentor(mentor);
    setShowBookingModal(true);
    setBookingSuccess(false);
    setBookingError(null);
    setSelectedServiceId('');
    setSelectedSlotId('');
    setCandidates([]);
    setSelectedCandidateKey('');
    setGoalTitle('');
    setGoalDescription('');
    setActiveSlots([]);
    setBookingLoading(true);
    setBookingWeekOffset(0);
    try {
      // Lấy cờ canRequestBooking (BE mới) song song với slots để gate sớm.
      const detail = await mentorsApi.getDetail(mentor.mentorUserId).catch(() => null);
      if (detail && detail.canRequestBooking === false) {
        setActiveSlots([]);
        setBookingError(
          detail.hasActiveServices === false
            ? 'Mentor này hiện chưa mở dịch vụ nào để đặt lịch.'
            : 'Mentor này hiện chưa nhận yêu cầu đặt lịch. Vui lòng quay lại sau.',
        );
        return;
      }
      await fetchSlots(mentor.mentorUserId);
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || 'Không tải được thông tin đặt lịch của mentor.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Slot đang chọn + danh sách service gắn vào slot đó (nguồn để chọn service khi đặt).
  const selectedSlot = activeSlots.find((s) => s.slotId === selectedSlotId) || null;
  const slotServices = selectedSlot?.services || [];

  // Khi đổi slot: reset service + candidate (service phải thuộc slot mới).
  const handleSelectSlot = (slotId: string) => {
    setSelectedSlotId(slotId);
    setSelectedServiceId('');
    setCandidates([]);
    setSelectedCandidateKey('');
    setBookingError(null);
    const slot = activeSlots.find((s) => s.slotId === slotId);
    if (slot?.services && slot.services.length === 1) {
      setSelectedServiceId(slot.services[0].serviceId);
    }
  };

  // Khi slot + service đã chọn -> tải candidate segments (khung giờ đặt được).
  useEffect(() => {
    if (!activeMentor || !selectedSlotId || !selectedServiceId) {
      setCandidates([]);
      setSelectedCandidateKey('');
      return;
    }
    let cancelled = false;
    setCandidatesLoading(true);
    setSelectedCandidateKey('');
    mentorsApi
      .getSlotCandidates(activeMentor.mentorUserId, selectedSlotId, selectedServiceId)
      .then((res) => {
        if (cancelled) return;
        const list = res.candidateServiceSlots || [];
        setCandidates(list);
        const firstSelectable = list[0];
        if (firstSelectable) setSelectedCandidateKey(`${firstSelectable.startTime}|${firstSelectable.endTime}`);
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setCandidatesLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeMentor, selectedSlotId, selectedServiceId]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMentor) return;
    if (!selectedSlotId || !selectedServiceId) {
      setBookingError('Vui lòng chọn khung giờ và dịch vụ.');
      return;
    }
    const [selStart, selEnd] = selectedCandidateKey.split('|');
    if (!selStart || !selEnd) {
      setBookingError('Vui lòng chọn một khung giờ cụ thể.');
      return;
    }
    setBookingSubmitting(true);
    setBookingError(null);
    try {
      await bookingsApi.create({
        mentorUserId: activeMentor.mentorUserId,
        availabilitySlotId: selectedSlotId,
        serviceId: selectedServiceId,
        selectedStartTime: selStart,
        selectedEndTime: selEnd,
        learningGoalTitle: goalTitle.trim() || 'Yêu cầu trao đổi kỹ năng',
        learningGoalDescription: goalDescription.trim() || undefined,
      });
      setBookingSuccess(true);
      setTimeout(() => setShowBookingModal(false), 1800);
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || 'Gửi yêu cầu đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleOpenReviews = async (mentor: MentorVM) => {
    setDrawerMentor(mentor);
    setShowReviewDrawer(true);
    setReviews([]);
    setReviewsLoading(true);
    try {
      const paged = await mentorsApi.getReviews(mentor.mentorUserId, 0, 20);
      setReviews(paged?.content ?? []);
    } catch (err) {
      console.warn('Không tải được đánh giá mentor', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getBookingDaySlots = (dayDate: Date) => {
    const targetStr = formatDateISO(dayDate);
    return activeSlots.filter(s => getLocalDateStr(s.startTime) === targetStr);
  };

  return (
    <div className="space-y-8 text-left relative min-h-screen pb-16">

      {/* Title */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1 bg-brand-terracotta/15 text-brand-terracotta text-body font-bold py-1 px-3 rounded-full border border-brand-terracotta/25">
          <Sparkles className="w-3.5 h-3.5" /> Kết nối kỹ năng FPT
        </span>
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight">
          Tìm kiếm Mentor & Bạn cùng tiến
        </h1>
        <p className="text-brand-text-muted text-body max-w-2xl font-medium">
          Lọc và ghép cặp với các sinh viên khóa trên hoặc các bạn cùng ngành để bắt đầu phiên trao đổi kỹ năng học thuật.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface border border-brand-border p-4 rounded-card shadow-sm">

        {/* Search bar */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-grey" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc từ khóa kỹ năng (React, Python...)..."
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-3 pl-10 pr-10 text-body text-brand-text focus:outline-none focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta transition-all font-semibold"
          />
          {searching && <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 text-brand-terracotta animate-spin" />}
        </div>

        {/* Specialization Filter */}
        <div className="relative">
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-3 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
          >
            <option value="ALL">Tất cả chuyên ngành</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-3 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng (Available)</option>
            <option value="BUSY">Đang bận (Busy)</option>
          </select>
        </div>

      </div>

      {loadError && (
        <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-card text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Grid Mentors */}
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="meetmind-card h-64 animate-pulse"></div>
          ))}
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="meetmind-card py-16 text-center space-y-3 rounded-card">
          <SlidersHorizontal className="w-10 h-10 text-brand-grey mx-auto" />
          <p className="text-brand-text font-bold text-body">Không tìm thấy Mentor phù hợp</p>
          <p className="text-brand-text-muted text-body font-semibold">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-150 ${searching ? 'opacity-60' : 'opacity-100'}`}>
          {filteredMentors.map((m) => {
            const skills = skillsOf(m);
            return (
              <div
                key={m.mentorUserId}
                className="meetmind-card meetmind-card-hover p-6 flex flex-col justify-between gap-5 relative overflow-hidden group rounded-card"
              >
                <div className="space-y-4">

                  {/* Avatar & Header */}
                  <div className="flex items-start gap-4">
                    <img
                      src={m.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                      onError={onAvatarError}
                      alt={m.displayName}
                      className="w-14 h-14 rounded-card bg-brand-bg object-cover border border-brand-border"
                    />
                    <div className="space-y-1 text-left">
                      <h3 className="text-brand-text font-bold text-base leading-tight group-hover:text-brand-terracotta transition-colors">
                        {m.displayName}
                      </h3>
                      <p className="text-brand-text-muted text-body font-semibold">
                        {m.programName || 'FPT University'}
                      </p>
                      {m.specializationName && (
                        <span className="inline-block text-meta font-extrabold text-brand-terracotta bg-brand-terracotta/15 border border-brand-terracotta/25 px-2 py-0.5 rounded-lg">
                          {m.specializationName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating & Match */}
                  <div className="flex items-center gap-4 text-body font-bold">
                    <button
                      onClick={() => handleOpenReviews(m)}
                      className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors font-bold cursor-pointer"
                      title="Click để xem nhận xét chi tiết"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {(m.ratingAverage ?? 0).toFixed(1)}{' '}
                      <span className="text-brand-text-muted text-meta underline font-semibold ml-1">
                        ({m.reviewCount} đánh giá)
                      </span>
                    </button>
                    {typeof m.matchScore === 'number' && (
                      <>
                        <span className="text-brand-border font-normal">|</span>
                        <span className="text-brand-text-muted font-semibold">
                          Tương hợp:{' '}
                          <span className="text-brand-terracotta font-extrabold">{Math.round(m.matchScore)}%</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Match Rationale reasons */}
                  {m.matchReasons && m.matchReasons.length > 0 && (
                    <div className="bg-brand-bg/50 border border-brand-border/60 p-3 rounded-card text-left space-y-1">
                      <span className="text-meta font-bold text-brand-terracotta uppercase tracking-wider block">Gợi ý tương hợp</span>
                      <ul className="space-y-1">
                        {m.matchReasons.map((reason, idx) => (
                          <li key={idx} className="text-meta text-brand-text font-medium flex items-start gap-1">
                            <Check className="w-3.5 h-3.5 text-brand-terracotta shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Headline / expertise */}
                  <p className="text-brand-text-muted text-body leading-relaxed font-medium line-clamp-3">
                    {m.headline || m.expertiseDescription}
                  </p>

                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-meta bg-brand-bg border border-brand-border text-brand-text-muted py-0.5 px-2 rounded-lg font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Footer status & button */}
                <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${m.isAvailable ? 'bg-green-500 dot-glow-green' : 'bg-red-500'}`}></span>
                    <span className="text-meta text-brand-text-muted uppercase tracking-wider font-extrabold">
                      {m.isAvailable ? 'Sẵn sàng' : 'Bận'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenBooking(m)}
                    disabled={!m.isAvailable}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold shadow-md shadow-brand-terracotta/20 hover:opacity-90 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Lên lịch
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Drawer component */}
      {showReviewDrawer && drawerMentor && (
        <>
          <div
            onClick={() => setShowReviewDrawer(false)}
            className="fixed inset-0 z-45 bg-black/35 backdrop-blur-sm transition-all duration-300"
          />

          <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-surface border-l border-brand-border shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slideLeft text-left">
            <div className="space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div>
                  <h3 className="text-lg font-bold font-serif text-brand-text">Đánh giá từ sinh viên</h3>
                  <p className="text-body text-brand-text-muted font-medium mt-0.5">Phản hồi công khai cho Mentor {drawerMentor.displayName}</p>
                </div>
                <button
                  onClick={() => setShowReviewDrawer(false)}
                  className="p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="flex items-center gap-4 bg-brand-bg/40 border border-brand-border p-4 rounded-card">
                <div className="text-center shrink-0 pr-4 border-r border-brand-border">
                  <span className="text-3xl font-extrabold text-brand-text font-serif">{(drawerMentor.ratingAverage ?? 0).toFixed(1)}</span>
                  <div className="flex justify-center gap-0.5 text-amber-500 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(drawerMentor.ratingAverage ?? 0) ? 'fill-amber-500' : 'text-brand-border'}`} />
                    ))}
                  </div>
                  <span className="text-meta text-brand-text-muted font-bold block mt-1.5">{drawerMentor.reviewCount} đánh giá</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-meta font-semibold text-brand-text">
                    <span>Buổi đã hoàn thành:</span>
                    <span className="text-brand-terracotta font-bold">{drawerMentor.completedSessions}</span>
                  </div>
                  <div className="flex items-center gap-2 text-meta font-semibold text-brand-text">
                    <span>Hình thức:</span>
                    <span className="text-brand-blue font-bold">{drawerMentor.teachingMode}</span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsLoading ? (
                  <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-terracotta" /></div>
                ) : reviews.length === 0 ? (
                  <p className="text-body text-brand-text-muted font-semibold text-center py-8">Chưa có đánh giá nào.</p>
                ) : reviews.map((rev) => (
                  <div key={rev.reviewId} className="p-4 border border-brand-border rounded-card space-y-3 bg-surface hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.reviewerAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                          onError={onAvatarError}
                          alt={rev.reviewerDisplayName}
                          className="w-8 h-8 rounded-lg border border-brand-border"
                        />
                        <div>
                          <span className="text-body font-bold text-brand-text block">{rev.reviewerDisplayName}</span>
                          <span className="text-meta text-brand-text-muted font-semibold block">{fmtDateTime(rev.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-body text-brand-text leading-relaxed font-medium">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>

            </div>

            {/* Book scheduling trigger */}
            <div className="pt-4 border-t border-brand-border">
              <button
                onClick={() => {
                  setShowReviewDrawer(false);
                  handleOpenBooking(drawerMentor);
                }}
                disabled={!drawerMentor.isAvailable}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold cursor-pointer disabled:opacity-40 shadow-md shadow-brand-terracotta/25 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt lịch học cùng {drawerMentor.displayName}</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* Booking Scheduler Modal */}
      {showBookingModal && activeMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-5xl bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">

            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {bookingSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto border border-green-200 shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-brand-text font-bold text-lg font-serif">Gửi yêu cầu đặt lịch thành công!</h3>
                <p className="text-brand-text-muted text-body font-semibold max-w-md mx-auto">Hệ thống đã gửi yêu cầu tới {activeMentor.displayName}. Bạn có thể theo dõi trạng thái tại mục "Lịch của tôi".</p>
              </div>
            ) : bookingLoading ? (
              <div className="py-24 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-terracotta" />
                <p className="text-brand-text-muted text-body font-semibold animate-pulse">Đang tải lịch trống của mentor...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="text-left border-b border-brand-border pb-4">
                  <h3 className="text-brand-text font-bold text-xl font-serif">Đặt lịch học với {activeMentor.displayName}</h3>
                  <p className="text-brand-text-muted text-body font-medium mt-0.5">Chọn khung giờ trống trên lịch → Chọn môn học hỗ trợ → Điền mục tiêu học tập</p>
                </div>

                {/* Mentor Info Row */}
                <div className="flex items-center gap-3.5 p-3.5 bg-brand-bg/40 border border-brand-border rounded-card text-left max-w-md">
                  <img
                    src={activeMentor.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                    onError={onAvatarError}
                    alt={activeMentor.displayName}
                    className="w-12 h-12 rounded-card bg-surface object-cover border border-brand-border"
                  />
                  <div>
                    <span className="text-body font-extrabold text-brand-text block">{activeMentor.displayName}</span>
                    <span className="text-meta text-brand-terracotta font-extrabold">{activeMentor.specializationName || activeMentor.headline}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="flex items-start gap-2 bg-red-500/5 border border-red-200 text-red-600 p-3.5 rounded-field text-meta font-semibold text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Calendar (col-span-8) */}
                  <div className="lg:col-span-8 space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-terracotta" />
                        <h4 className="text-body font-extrabold text-brand-text">Chọn khung lịch rảnh của mentor</h4>
                      </div>
                      
                      {/* Week switcher */}
                      <div className="flex bg-brand-bg border border-brand-border p-0.5 rounded-field gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSwitchWeek(0)}
                          className={`px-3 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${bookingWeekOffset === 0 ? 'bg-surface text-brand-text shadow-xs border border-brand-border' : 'text-brand-text-muted hover:text-brand-text'}`}
                        >
                          Tuần này
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchWeek(1)}
                          className={`px-3 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${bookingWeekOffset === 1 ? 'bg-surface text-brand-text shadow-xs border border-brand-border' : 'text-brand-text-muted hover:text-brand-text'}`}
                        >
                          Tuần sau
                        </button>
                      </div>
                    </div>

                    {/* Week calendar grid */}
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pt-1.5">
                      {getWeekDays(bookingWeekOffset).map((dayDate, idx) => {
                        const dayName = WEEKDAYS[idx].label;
                        const dateStr = formatDateISO(dayDate);
                        const isToday = formatDateISO(new Date()) === dateStr;
                        const daySlots = getBookingDaySlots(dayDate);
                        
                        return (
                          <div key={idx} className={`rounded-xl border p-2 flex flex-col text-left min-h-[260px] transition-all ${isToday ? 'bg-brand-terracotta/5 border-brand-terracotta/30' : 'bg-surface/30 border-brand-border'}`}>
                            {/* Day Header */}
                            <div className="text-center pb-1.5 border-b border-brand-border mb-2 shrink-0">
                              <span className={`text-[10px] font-extrabold block tracking-wide uppercase ${isToday ? 'text-brand-terracotta' : 'text-brand-text-muted'}`}>
                                {dayName}
                              </span>
                              <span className={`text-meta font-extrabold inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 ${isToday ? 'bg-brand-terracotta text-white shadow-xs' : 'text-brand-text'}`}>
                                {dayDate.getDate()}
                              </span>
                            </div>
                            
                            {/* Day Slots List */}
                            <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none pr-0.5">
                              {daySlots.length === 0 ? (
                                <div className="h-full flex items-center justify-center py-8">
                                  <span className="text-[10px] text-brand-text-muted/50 italic font-semibold text-center leading-tight">
                                    Không có lịch
                                  </span>
                                </div>
                              ) : (
                                daySlots.map(slot => {
                                  const selected = selectedSlotId === slot.slotId;
                                  const hasServices = slot.services && slot.services.length > 0;
                                  
                                  return (
                                    <div
                                      key={slot.slotId}
                                      onClick={() => {
                                        if (hasServices) {
                                          handleSelectSlot(slot.slotId);
                                        }
                                      }}
                                      className={`p-2 rounded-lg border text-left shadow-2xs group/item relative cursor-pointer transition-all hover:-translate-y-[1px] ${
                                        selected
                                          ? 'bg-brand-terracotta/15 border-brand-terracotta hover:bg-brand-terracotta/20 text-brand-terracotta'
                                          : hasServices
                                            ? 'bg-green-50/70 border-green-200 hover:bg-green-100/70 text-green-800'
                                            : 'bg-brand-bg/40 border-brand-border text-brand-text-muted/60 opacity-50 cursor-not-allowed'
                                      }`}
                                    >
                                      <div className="text-[9px] font-extrabold flex items-center justify-between">
                                        <span className="flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5 shrink-0" />
                                          {fmtTime(slot.startTime)}
                                        </span>
                                      </div>
                                      
                                      {hasServices && (
                                        <div className="mt-1.5 space-y-1">
                                          {slot.services?.map(sv => {
                                            const code = getSubjectCode(sv.title);
                                            return (
                                              <span
                                                key={sv.serviceId}
                                                className="block text-[8px] font-black tracking-wide truncate bg-white/70 border border-brand-border/30 px-1 py-0.5 rounded text-center leading-normal"
                                                title={sv.title}
                                              >
                                                {code ? code : sv.title}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
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

                  {/* Right Column: Booking Configuration Form (col-span-4) */}
                  <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-brand-border pt-4 lg:pt-0 lg:pl-6 text-left animate-fadeIn">
                    {!selectedSlotId ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-brand-bg/30 border border-brand-border border-dashed rounded-card">
                        <Calendar className="w-10 h-10 text-brand-text-muted opacity-50 mb-2.5" />
                        <h4 className="text-body font-extrabold text-brand-text">Cấu hình Đăng ký</h4>
                        <p className="text-meta text-brand-text-muted font-medium mt-1">Vui lòng chọn một khung lịch rảnh (màu xanh lá) trên lịch để bắt đầu điền thông tin đặt lịch học.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleBookingSubmit} className="space-y-4">
                        <div className="border-b border-brand-border/60 pb-3">
                          <span className="text-[10px] font-extrabold text-brand-text-muted uppercase tracking-wider block">Khung giờ đã chọn</span>
                          <span className="text-body font-extrabold text-brand-text block mt-1">
                            {selectedSlot ? (
                              <>
                                {getDayNameLong(new Date(selectedSlot.startTime))}, {formatDateDisplay(new Date(selectedSlot.startTime))}
                                <span className="text-brand-terracotta ml-1.5 font-black">
                                  ({fmtTime(selectedSlot.startTime)} - {fmtTime(selectedSlot.endTime)})
                                </span>
                              </>
                            ) : 'Chưa chọn'}
                          </span>
                        </div>

                        {/* Service selector (Môn học) */}
                        <div>
                          <label className="block text-meta font-extrabold text-brand-text-muted uppercase mb-1.5">Môn học / Dịch vụ</label>
                          {slotServices.length === 0 ? (
                            <p className="text-meta text-red-600 font-semibold">Khung lịch này chưa được gán dịch vụ nào.</p>
                          ) : slotServices.length === 1 ? (
                            <div className="p-3 bg-brand-bg border border-brand-border rounded-field text-body font-bold text-brand-text flex items-center justify-between">
                              <span>{slotServices[0].title}</span>
                              <span className="text-meta font-black text-brand-terracotta">{slotServices[0].isFree ? 'Miễn phí' : `${slotServices[0].priceScoin?.toLocaleString('en-US') || 0} Point`}</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {slotServices.map(s => {
                                const selected = selectedServiceId === s.serviceId;
                                return (
                                  <button
                                    key={s.serviceId}
                                    type="button"
                                    onClick={() => {
                                      setSelectedServiceId(s.serviceId);
                                      setBookingError(null);
                                    }}
                                    className={`w-full p-2.5 rounded-field border flex items-center justify-between text-left transition-all ${
                                      selected
                                        ? 'bg-brand-terracotta/10 border-brand-terracotta text-brand-terracotta'
                                        : 'bg-brand-bg border-brand-border text-brand-text hover:bg-brand-bg/85 cursor-pointer'
                                    }`}
                                  >
                                    <span className="text-meta font-bold">{s.title}</span>
                                    <span className="text-[10px] font-black">{s.isFree ? 'FREE' : `${s.priceScoin?.toLocaleString('en-US')} P`}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Precise time segment candidates selector */}
                        {selectedSlotId && selectedServiceId && (
                          <div>
                            <label className="block text-meta font-extrabold text-brand-text-muted uppercase mb-1.5">Giờ học cụ thể</label>
                            {candidatesLoading ? (
                              <div className="flex items-center gap-2 text-meta text-brand-text-muted font-semibold py-1">
                                <Loader2 className="w-4 h-4 animate-spin text-brand-terracotta" /> Đang kiểm tra slot trống...
                              </div>
                            ) : candidates.length === 0 ? (
                              <p className="text-meta text-red-600 font-semibold">Khung giờ đã đầy hoặc không phù hợp.</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                {candidates.map((c) => {
                                  const key = `${c.startTime}|${c.endTime}`;
                                  const selected = selectedCandidateKey === key;
                                  return (
                                    <button
                                      type="button"
                                      key={key}
                                      onClick={() => setSelectedCandidateKey(key)}
                                      className={`px-2 py-1.5 rounded-field text-[11px] font-bold border transition-all text-center leading-tight ${
                                        selected
                                          ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-sm'
                                          : 'bg-brand-bg border-brand-border text-brand-text hover:border-brand-terracotta cursor-pointer'
                                      }`}
                                    >
                                      {parseCandidateTime(c.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Goal Title */}
                        <div>
                          <label className="block text-meta font-extrabold text-brand-text-muted uppercase mb-1">Mục tiêu (tiêu đề ngắn)</label>
                          <input
                            type="text"
                            required
                            value={goalTitle}
                            onChange={(e) => setGoalTitle(e.target.value)}
                            placeholder="Ví dụ: Cần support bài Lab 3 Java Web"
                            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                          />
                        </div>

                        {/* Goal Description */}
                        <div>
                          <label className="block text-meta font-extrabold text-brand-text-muted uppercase mb-1">Mô tả chi tiết</label>
                          <textarea
                            required
                            rows={3}
                            value={goalDescription}
                            onChange={(e) => setGoalDescription(e.target.value)}
                            placeholder="Mô tả rõ lỗi gặp phải hoặc phần kiến thức cần mentor hỗ trợ..."
                            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={bookingSubmitting || !selectedSlotId || !selectedServiceId || !selectedCandidateKey}
                          className="w-full flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {bookingSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Gửi yêu cầu đặt lịch</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                  
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
