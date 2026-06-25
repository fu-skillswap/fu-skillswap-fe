import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Send, Calendar, Check, X, Star, Search, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { mentorsApi } from '../api/mentors';
import type {
  MentorCard, MentorRecommendation, MentorReview,
  MentorAvailabilitySlot, ServiceSlotCandidate,
} from '../api/types';
import { bookingsApi } from '../api/bookings';
import { onAvatarError } from '../lib/img';

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
    try {
      const slots = await mentorsApi.getAvailabilitySlots(mentor.mentorUserId);
      setActiveSlots(slots);
      if (slots.length === 1) setSelectedSlotId(slots[0].slotId);
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
        const firstSelectable = list.find((c) => c.isSelectable);
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
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto border border-green-200">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-brand-text font-bold text-base">Yêu cầu đã được gửi!</h3>
                <p className="text-brand-text-muted text-body font-semibold">Hệ thống đã gửi yêu cầu tới {activeMentor.displayName}. Theo dõi trạng thái ở mục "Lịch của tôi".</p>
              </div>
            ) : bookingLoading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-brand-terracotta" />
                <p className="text-brand-text-muted text-body font-semibold">Đang tải lịch trống...</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="text-left">
                  <h3 className="text-brand-text font-bold text-lg font-serif">Đặt lịch với {activeMentor.displayName}</h3>
                  <p className="text-brand-text-muted text-body font-medium mt-0.5">Chọn khung lịch → dịch vụ → giờ học cụ thể</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-brand-bg border border-brand-border rounded-card text-left">
                  <img
                    src={activeMentor.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                    onError={onAvatarError}
                    alt={activeMentor.displayName}
                    className="w-10 h-10 rounded-field border border-brand-border"
                  />
                  <div>
                    <span className="text-body font-bold text-brand-text block">{activeMentor.displayName}</span>
                    <span className="text-meta text-brand-terracotta font-bold">{activeMentor.specializationName || activeMentor.headline}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="flex items-start gap-2 bg-red-500/5 border border-red-200 text-red-600 p-3 rounded-field text-meta font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Bước 1: chọn slot (khung lịch trống của mentor) */}
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">1. Khung lịch trống</label>
                  {activeSlots.length === 0 ? (
                    <p className="text-meta text-red-600 font-semibold">Mentor hiện chưa mở khung lịch trống nào.</p>
                  ) : (
                    <select
                      required
                      value={selectedSlotId}
                      onChange={(e) => handleSelectSlot(e.target.value)}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                    >
                      <option value="">-- Chọn khung lịch --</option>
                      {activeSlots.map((slot) => (
                        <option key={slot.slotId} value={slot.slotId}>
                          {fmtDateTime(slot.startTime)} - {fmtDateTime(slot.endTime)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Bước 2: chọn dịch vụ gắn vào slot đó */}
                {selectedSlotId && (
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">2. Dịch vụ</label>
                    {slotServices.length === 0 ? (
                      <p className="text-meta text-red-600 font-semibold">Khung lịch này chưa gắn dịch vụ nào.</p>
                    ) : (
                      <select
                        required
                        value={selectedServiceId}
                        onChange={(e) => { setSelectedServiceId(e.target.value); setBookingError(null); }}
                        className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        {slotServices.map((s) => (
                          <option key={s.serviceId} value={s.serviceId}>
                            {s.title} · {s.durationMinutes} phút{s.isFree ? ' · Miễn phí' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Bước 3: chọn khung giờ cụ thể (candidate) */}
                {selectedSlotId && selectedServiceId && (
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">3. Giờ học cụ thể</label>
                    {candidatesLoading ? (
                      <div className="flex items-center gap-2 text-meta text-brand-text-muted font-semibold py-1">
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải khung giờ...
                      </div>
                    ) : candidates.length === 0 ? (
                      <p className="text-meta text-red-600 font-semibold">Không còn khung giờ đặt được cho dịch vụ này.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                        {candidates.map((c) => {
                          const key = `${c.startTime}|${c.endTime}`;
                          const selected = selectedCandidateKey === key;
                          return (
                            <button
                              type="button"
                              key={key}
                              disabled={!c.isSelectable}
                              onClick={() => setSelectedCandidateKey(key)}
                              title={!c.isSelectable ? (c.reasonIfBlocked || 'Không đặt được') : undefined}
                              className={`px-2.5 py-2 rounded-field text-meta font-bold border transition-all text-left ${
                                selected
                                  ? 'bg-brand-terracotta text-white border-brand-terracotta'
                                  : c.isSelectable
                                    ? 'bg-brand-bg/50 border-brand-border text-brand-text hover:border-brand-terracotta cursor-pointer'
                                    : 'bg-brand-bg/30 border-brand-border text-brand-grey opacity-50 cursor-not-allowed'
                              }`}
                            >
                              {fmtDateTime(c.startTime)}
                              {c.isSelectable && c.remainingPendingQuota > 0 && (
                                <span className="block text-[10px] font-semibold opacity-80">còn {c.remainingPendingQuota} chỗ</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Mục tiêu (tiêu đề ngắn)</label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Ví dụ: Học cơ bản về React Hooks"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Mô tả chi tiết</label>
                  <textarea
                    required
                    rows={3}
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Mô tả rõ điều bạn muốn được hỗ trợ trong buổi học này..."
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
      )}

    </div>
  );
};
