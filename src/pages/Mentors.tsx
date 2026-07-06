import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Send, Calendar, Clock, Check, X, Star, Search, SlidersHorizontal, Loader2, AlertCircle, ArrowLeft, Globe, Award, BookOpen, Heart, ChevronDown, Briefcase, LayoutGrid } from 'lucide-react';
import { mentorsApi } from '../api/mentors';
import { catalogApi } from '../api/catalog';
import type {
  MentorCard, MentorRecommendation, MentorReview,
  MentorAvailabilitySlot, ServiceSlotCandidate, MentorDetail,
  MentorPortfolioItem, MentorProfileOptions, SupportLevelOption,
} from '../api/types';
import { bookingsApi } from '../api/bookings';
import { onAvatarError } from '../lib/img';
import { getExtendedMentorData } from '../lib/mockMentors';



const Figma = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 9h3.5a3.5 3.5 0 1 1 0 7H12V9z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5a3.5 3.5 0 0 1-3.5-3.5z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
  </svg>
);

const Behance = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M8.22 5.38c1.36 0 2.45.31 3.26.94.8.63 1.21 1.54 1.21 2.73 0 1.05-.33 1.9-.99 2.54-.66.65-1.57.97-2.73.97H3.94v-7.18h4.28zm-3.32 2.82h3.07c.88 0 1.32-.34 1.32-1.02 0-.67-.44-1.01-1.32-1.01H4.9v2.03zm3.17 6.47c1.47 0 2.62.33 3.44 1 .83.67 1.24 1.62 1.24 2.86 0 1.25-.43 2.22-1.28 2.9-.86.68-2.03 1.02-3.52 1.02H3.94v-7.78h4.13zm-3.17 3.32h3.09c.92 0 1.38-.37 1.38-1.12 0-.74-.46-1.11-1.38-1.11H4.9v2.23zm17.06-2.19c0 1.83-.51 3.24-1.53 4.23-1.02 1-2.45 1.5-4.28 1.5-1.92 0-3.37-.52-4.37-1.55S13.3 17.52 13.3 15.65c0-1.89.51-3.35 1.53-4.38 1.02-1.03 2.41-1.55 4.19-1.55 1.76 0 3.12.51 4.09 1.52.97 1.01 1.45 2.44 1.45 4.29v.27h-8.23c.06.87.35 1.52.88 1.95.53.43 1.2.65 2.01.65 1.31 0 2.11-.53 2.39-1.58h1.86zm-1.84-1.74c-.05-.8-.32-1.4-.81-1.81-.49-.41-1.12-.61-1.89-.61-.75 0-1.37.21-1.85.64s-.78 1.03-.89 1.78h5.44zm-5.74-5.26h6.05V10.2h-6.05V8.8z" />
  </svg>
);

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

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
  yearsOfExperience?: number;
  company?: string;
  projectsCount?: number;
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
  const [selectedExperience, setSelectedExperience] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [selectedPrice, setSelectedPrice] = useState('ALL');
  const [mentors, setMentors] = useState<MentorVM[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // chỉ hiện skeleton lần đầu
  const [searching, setSearching] = useState(false);          // các lần tìm sau: giữ list cũ + spinner nhẹ
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileOptions, setProfileOptions] = useState<MentorProfileOptions | null>(null);
  const recMapRef = useRef<Map<string, MentorRecommendation>>(new Map());
  const didInitRef = useRef(false);


  const [activeMentor, setActiveMentor] = useState<MentorVM | null>(null);
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<MentorDetail | null>(null);
  const bookingSectionRef = useRef<HTMLDivElement | null>(null);
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

  // Custom Portfolio Tabs & Modal
  const [activeDetailTab, setActiveDetailTab] = useState<'about' | 'portfolio'>('about');
  const [selectedProject, setSelectedProject] = useState<MentorPortfolioItem | null>(null);

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

  // Nhãn 3 nhóm support level (không hard-code — lấy từ catalog). Fail-safe: ẩn nhãn nếu lỗi.
  useEffect(() => {
    let alive = true;
    catalogApi.getMentorProfileOptions()
      .then((o) => { if (alive) setProfileOptions(o); })
      .catch(() => { /* fallback: hiển thị "Mức X/4" */ });
    return () => { alive = false; };
  }, []);

  // Tra nhãn theo value trong 1 nhóm support level.
  const levelLabel = (list: SupportLevelOption[] | undefined, value?: number): string | null => {
    if (value == null) return null;
    return list?.find((o) => o.value === value)?.label ?? null;
  };

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
        const ext = getExtendedMentorData(c.mentorUserId, c.displayName, c.specializationName);
        return {
          ...c,
          matchScore: c.matchScore ?? rec?.matchScore,
          matchReasons: c.matchReasons ?? rec?.matchReasons,
          yearsOfExperience: ext.yearsOfExperience,
          company: ext.company,
          projectsCount: ext.projectsCount,
        };
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

  const campuses = Array.from(
    new Set(mentors.map((m) => m.campusName).filter((c): c is string => !!c)),
  );

  // Lọc phía client cho chuyên ngành, trạng thái, kinh nghiệm, rating, cơ sở và mức giá (Point 7)
  const filteredMentors = mentors.filter((m) => {
    const matchesSpecialization = selectedSpecialization === 'ALL' || m.specializationName === selectedSpecialization;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'AVAILABLE' && m.isAvailable) ||
      (selectedStatus === 'BUSY' && !m.isAvailable);

    // Lọc theo số năm kinh nghiệm
    let matchesExperience = true;
    if (selectedExperience === '<1') {
      matchesExperience = m.yearsOfExperience !== undefined && m.yearsOfExperience < 1;
    } else if (selectedExperience === '1-3') {
      matchesExperience = m.yearsOfExperience !== undefined && m.yearsOfExperience >= 1 && m.yearsOfExperience <= 3;
    } else if (selectedExperience === '3+') {
      matchesExperience = m.yearsOfExperience !== undefined && m.yearsOfExperience >= 3;
    }

    // Lọc theo điểm đánh giá trung bình
    let matchesRating = true;
    if (selectedRating === '4.5') {
      matchesRating = (m.ratingAverage ?? 0) >= 4.5;
    } else if (selectedRating === '4.8') {
      matchesRating = (m.ratingAverage ?? 0) >= 4.8;
    }

    // Lọc theo cơ sở campus
    const matchesCampus = selectedCampus === 'ALL' || m.campusName === selectedCampus;

    // Lọc theo mức giá (Nền tảng chủ yếu là miễn phí)
    const matchesPrice = selectedPrice === 'ALL' || selectedPrice === 'FREE';

    return matchesSpecialization && matchesStatus && matchesExperience && matchesRating && matchesCampus && matchesPrice;
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

  const handleViewProfile = async (mentor: MentorVM, shouldScrollToBooking = false) => {
    setActiveMentor(mentor);
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
    setActiveDetailTab('about');
    try {
      // Lấy cờ canRequestBooking (BE mới) song song với slots để gate sớm.
      const detail = await mentorsApi.getDetail(mentor.mentorUserId);
      const ext = getExtendedMentorData(detail.mentorUserId, detail.displayName, detail.specializationName);
      const mergedDetail: MentorDetail = {
        ...detail,
        // achievements nay là object v2 do BE trả trực tiếp (không còn lấy từ mock).
        achievements: detail.achievements ?? [],
        yearsOfExperience: detail.yearsOfExperience ?? ext.yearsOfExperience,
        company: detail.company ?? ext.company,
        projectsCount: detail.projectsCount ?? ext.projectsCount,
        portfolios: detail.portfolios ?? ext.portfolios,
      };
      setSelectedMentorDetail(mergedDetail);
      if (detail && detail.canRequestBooking === false) {
        setActiveSlots([]);
        setBookingError(
          detail.hasActiveServices === false
            ? 'Mentor này hiện chưa mở dịch vụ nào để đặt lịch.'
            : 'Mentor này hiện chưa nhận yêu cầu đặt lịch. Vui lòng quay lại sau.',
        );
      } else {
        const slots = await mentorsApi.getAvailabilitySlots(mentor.mentorUserId).catch(() => [] as MentorAvailabilitySlot[]);
        setActiveSlots(slots);
        if (slots.length === 1) setSelectedSlotId(slots[0].slotId);
      }

      if (shouldScrollToBooking) {
        setTimeout(() => {
          bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || 'Không tải được thông tin đặt lịch của mentor.');
    } finally {
      setBookingLoading(false);
    }
  };



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
      setTimeout(() => {
        setSelectedMentorDetail(null);
        setActiveMentor(null);
        setBookingSuccess(false);
      }, 3000);
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

  const renderMentorProfile = () => {
    if (!selectedMentorDetail) return null;
    const selectedSlot = activeSlots.find((s) => s.slotId === selectedSlotId) || null;
    const slotServices = selectedSlot?.services || [];

    return (
      <div className="space-y-8 animate-fadeIn text-left">

        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedMentorDetail(null);
            setActiveMentor(null);
          }}
          className="relative z-10 flex items-center gap-2 text-body font-bold text-slate-400 hover:text-primary cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách mentor</span>
        </button>

        {/* Cover Banner & Main Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100/80 shadow-md">
          {/* Subtle brushed material texture / micro-mesh overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:4px_4px] opacity-60 pointer-events-none" />

          {/* Cover gradient layer */}
          <div
            className="h-40 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: "url('/background-mentor-profile.jpg')" }}
          >
            {/* Soft overlay blend to keep it polished */}
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
          </div>

          {/* Info Area (Centered avatar & text) */}
          <div className="p-8 pt-0 flex flex-col items-center justify-center -mt-20 relative z-10 text-center">
            {/* Centered Avatar with thick borders, shadow, and ring */}
            <div className="relative group mb-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-50 group-hover:opacity-85 transition duration-500 pointer-events-none" />
              <img
                src={selectedMentorDetail.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                onError={onAvatarError}
                alt={selectedMentorDetail.displayName}
                className="relative w-32 h-32 rounded-full bg-white object-cover border-4 border-white shadow-xl transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-slate-800 font-serif leading-tight tracking-tight">
                  {selectedMentorDetail.displayName}
                </h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${selectedMentorDetail.isAvailable
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
                  : 'bg-rose-100 text-rose-800 border border-rose-200/50'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedMentorDetail.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {selectedMentorDetail.isAvailable ? 'Sẵn sàng' : 'Bận'}
                </span>
              </div>

              <div className="text-body font-bold text-primary bg-primary-soft/80 border border-primary/20 px-4 py-1.5 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] inline-block">
                {selectedMentorDetail.headline || 'Mentor chia sẻ kỹ năng'}
              </div>

              <p className="text-meta text-slate-500 font-bold flex items-center justify-center gap-2 flex-wrap">
                <span className="bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">{selectedMentorDetail.programName}</span>
                <span className="text-slate-300 font-normal">•</span>
                <span className="bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">{selectedMentorDetail.specializationName}</span>
                <span className="text-slate-300 font-normal">•</span>
                <span className="bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">Học kỳ {selectedMentorDetail.semester}</span>
                {selectedMentorDetail.alumni && (
                  <>
                    <span className="text-slate-300 font-normal">•</span>
                    <span className="text-brand-terracotta font-black bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/50">[Cựu sinh viên]</span>
                  </>
                )}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6 justify-center shrink-0">
              {selectedMentorDetail.githubUrl && (
                <a
                  href={selectedMentorDetail.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {selectedMentorDetail.portfolioUrl && (
                <a
                  href={selectedMentorDetail.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-teal-600 transition-all duration-200 shadow-sm"
                  title="Portfolio Website"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="border-t border-slate-100 bg-slate-50/50 grid grid-cols-3 divide-x divide-slate-100 text-center py-6 shadow-[inset_0_4px_8px_rgba(0,0,0,0.015)]">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Đánh giá trung bình</span>
              <span className="text-xl font-black text-slate-800 flex items-center justify-center gap-1.5 leading-none">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500 drop-shadow-[0_1.5px_3px_rgba(245,158,11,0.4)] stroke-[1.8]" />
                {(selectedMentorDetail.ratingAverage ?? 0).toFixed(1)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Số lượt đánh giá</span>
              <span className="text-xl font-black text-slate-800 leading-none">
                {selectedMentorDetail.reviewCount || 0}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Số buổi mentoring</span>
              <span className="text-xl font-black text-slate-800 leading-none">
                {selectedMentorDetail.completedSessions || 0}
              </span>
            </div>
          </div>

          {/* Detailed Mentor Info Badges (Point 1) */}
          <div className="border-t border-slate-100 bg-surface grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center py-4.5">
            <div className="py-2.5 sm:py-0 space-y-1.5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Kinh nghiệm làm việc</span>
              <span className="text-body font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                <Briefcase className="w-4 h-4 text-primary" />
                {selectedMentorDetail.yearsOfExperience ? `${selectedMentorDetail.yearsOfExperience} Năm` : 'Chưa cập nhật'}
              </span>
            </div>
            <div className="py-2.5 sm:py-0 space-y-1.5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Công ty / Tổ chức</span>
              <span className="text-body font-bold text-slate-800 flex items-center gap-1.5 leading-none px-4 truncate max-w-full">
                <Globe className="w-4 h-4 text-teal-600" />
                {selectedMentorDetail.company || 'Đại học FPT'}
              </span>
            </div>
            <div className="py-2.5 sm:py-0 space-y-1.5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Dự án đã tham gia</span>
              <span className="text-body font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                <Award className="w-4 h-4 text-rose-500" />
                {selectedMentorDetail.projectsCount ? `${selectedMentorDetail.projectsCount}+ Dự án` : 'Chưa cập nhật'}
              </span>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="flex flex-col items-center justify-center py-2.5">
          <button
            onClick={() => {
              bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1.5 text-xs font-black text-primary hover:text-primary-hover animate-bounce cursor-pointer group transition-all duration-300"
          >
            <span>Đặt lịch học phía dưới</span>
            <ChevronDown className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[3.5]" />
          </button>
        </div>

        {/* Tab Navigator (Point 2) */}
        <div className="flex border-b border-line-soft gap-6">
          <button
            onClick={() => setActiveDetailTab('about')}
            className={`pb-4 text-body font-extrabold transition-all relative cursor-pointer ${
              activeDetailTab === 'about'
                ? 'text-primary'
                : 'text-fg-faint hover:text-fg-muted'
            }`}
          >
            Thông tin giới thiệu
            {activeDetailTab === 'about' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
            )}
          </button>
          <button
            onClick={() => setActiveDetailTab('portfolio')}
            className={`pb-4 text-body font-extrabold transition-all relative cursor-pointer ${
              activeDetailTab === 'portfolio'
                ? 'text-primary'
                : 'text-fg-faint hover:text-fg-muted'
            }`}
          >
            Dự án &amp; Portfolio ({selectedMentorDetail.portfolios?.length || 0})
            {activeDetailTab === 'portfolio' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full animate-fadeIn" />
            )}
          </button>
        </div>

        {/* Main 2-column details & courses layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Bio & Information (col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {activeDetailTab === 'about' ? (
              <>
                {/* Bio Box */}
                {selectedMentorDetail.bio && (
                  <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:-translate-y-[1px] transition-all duration-300 relative overflow-hidden bg-[radial-gradient(rgba(0,56,224,0.012)_1px,transparent_1px)] [background-size:12px_12px] space-y-4">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                      <Award className="w-5 h-5 text-teal-600" />
                      <span>Giới thiệu bản thân</span>
                    </h3>
                    <p className="text-body text-slate-600 leading-relaxed font-medium whitespace-pre-line text-justify">
                      {selectedMentorDetail.bio}
                    </p>
                  </div>
                )}

                {/* Achievements Box (Point 1) */}
                {selectedMentorDetail.achievements && selectedMentorDetail.achievements.length > 0 && (
                  <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all duration-300 space-y-4">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                      <Award className="w-5 h-5 text-amber-500 fill-amber-500/10" />
                      <span>Giải thưởng &amp; Thành tích</span>
                    </h3>
                    <ul className="space-y-3">
                      {selectedMentorDetail.achievements.map((ach) => (
                        <li key={ach.id} className="flex items-start gap-3 text-body text-slate-600 font-medium leading-relaxed">
                          <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-bold text-slate-800">{ach.title}</span>
                            {ach.awardDescription && <span className="text-slate-500"> — {ach.awardDescription}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expertise box */}
                {selectedMentorDetail.expertiseDescription && (
                  <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:-translate-y-[1px] transition-all duration-300 relative overflow-hidden bg-[radial-gradient(rgba(0,56,224,0.012)_1px,transparent_1px)] [background-size:12px_12px] space-y-4">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                      <BookOpen className="w-5 h-5 text-teal-600" />
                      <span>Kinh nghiệm &amp; Chuyên môn</span>
                    </h3>
                    <p className="text-body text-slate-600 leading-relaxed font-medium whitespace-pre-line text-justify">
                      {selectedMentorDetail.expertiseDescription}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Portfolios Tab View (Point 2) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(selectedMentorDetail.portfolios ?? []).map((project) => (
                    <div key={project.id} className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-[1px]">
                      <div>
                        {project.imageUrl && (
                          <div className="h-40 overflow-hidden bg-slate-100 border-b border-line flex items-center justify-center">
                            <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 space-y-2.5">
                          <span className="text-[10px] font-extrabold text-primary bg-primary-soft/80 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                            {project.role}
                          </span>
                          <h4 className="text-body font-bold text-slate-800 line-clamp-1">
                            {project.title}
                          </h4>
                          <p className="text-meta text-slate-500 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                      </div>
                      <div className="p-5 pt-0 border-t border-slate-50 mt-3 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="text-meta text-primary hover:text-primary-hover font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                        <div className="flex gap-2">
                          {project.figmaUrl && (
                            <a href={project.figmaUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500" title="Figma Prototype">
                              <Figma className="w-4 h-4" />
                            </a>
                          )}
                          {project.githubUrl && (
                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900" title="GitHub Code">
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {project.behanceUrl && (
                            <a href={project.behanceUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600" title="Behance Project">
                              <Behance className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedMentorDetail.portfolios || selectedMentorDetail.portfolios.length === 0) && (
                    <div className="col-span-1 md:col-span-2 py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-body font-bold text-slate-400">Mentor này chưa cấu hình danh sách Portfolio dự án.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic Information */}
            <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:-translate-y-[1px] transition-all duration-300 relative overflow-hidden bg-[radial-gradient(rgba(0,56,224,0.012)_1px,transparent_1px)] [background-size:12px_12px] space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Globe className="w-5 h-5 text-teal-600" />
                <span>Thông tin đào tạo &amp; Hỗ trợ</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-body font-semibold">
                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                  <span className="text-meta text-slate-400">Cơ sở học tập</span>
                  <span className="text-slate-800">{selectedMentorDetail.campusName}</span>
                </div>
                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                  <span className="text-meta text-slate-400">Chuyên ngành chính</span>
                  <span className="text-slate-800">{selectedMentorDetail.specializationName}</span>
                </div>
                {selectedMentorDetail.foundationSupportLevel != null && (
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                    <span className="text-meta text-slate-400">Hỗ trợ nền tảng · Mức {selectedMentorDetail.foundationSupportLevel}/4</span>
                    <span className="text-slate-800">{levelLabel(profileOptions?.foundationSupportLevels, selectedMentorDetail.foundationSupportLevel) ?? `Mức ${selectedMentorDetail.foundationSupportLevel}/4`}</span>
                  </div>
                )}
                {selectedMentorDetail.outputReviewSupportLevel != null && (
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                    <span className="text-meta text-slate-400">Review sản phẩm · Mức {selectedMentorDetail.outputReviewSupportLevel}/4</span>
                    <span className="text-slate-800">{levelLabel(profileOptions?.outputReviewSupportLevels, selectedMentorDetail.outputReviewSupportLevel) ?? `Mức ${selectedMentorDetail.outputReviewSupportLevel}/4`}</span>
                  </div>
                )}
                {selectedMentorDetail.directionSupportLevel != null && (
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                    <span className="text-meta text-slate-400">Định hướng · Mức {selectedMentorDetail.directionSupportLevel}/4</span>
                    <span className="text-slate-800">{levelLabel(profileOptions?.directionSupportLevels, selectedMentorDetail.directionSupportLevel) ?? `Mức ${selectedMentorDetail.directionSupportLevel}/4`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Môn học thế mạnh (contract v2: subjectResults) */}
            {selectedMentorDetail.subjectResults && selectedMentorDetail.subjectResults.length > 0 && (
              <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02)] space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <span>Môn học thế mạnh</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {selectedMentorDetail.subjectResults
                    .slice()
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                    .map((s) => (
                      <span
                        key={s.id ?? s.subjectCode}
                        className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-meta font-bold px-3 py-1.5 rounded-lg"
                        title={s.subjectName}
                      >
                        {s.subjectCode}
                        <span className="text-brand-terracotta font-extrabold">{s.scoreValue.toFixed(1)}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Lĩnh vực hỗ trợ */}
            {selectedMentorDetail.helpTopicTags && selectedMentorDetail.helpTopicTags.length > 0 && (
              <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:-translate-y-[1px] transition-all duration-300 relative overflow-hidden bg-[radial-gradient(rgba(0,56,224,0.012)_1px,transparent_1px)] [background-size:12px_12px] space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Heart className="w-5 h-5 text-teal-600" />
                  <span>Lĩnh vực hỗ trợ chủ đạo</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {selectedMentorDetail.helpTopicTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-4 py-1.5 rounded-full text-body font-bold bg-slate-50 border border-slate-200/60 text-slate-700 shadow-sm shadow-slate-100 hover:border-teal-500/40 hover:text-teal-600 transition-colors"
                    >
                      {tag.nameVi}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Services / Courses List (col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-100/80 p-8 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:-translate-y-[1px] transition-all duration-300 relative overflow-hidden bg-[radial-gradient(rgba(0,56,224,0.012)_1px,transparent_1px)] [background-size:12px_12px] space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <span>Các môn hỗ trợ của Mentor</span>
              </h3>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {!selectedMentorDetail.services || selectedMentorDetail.services.length === 0 ? (
                  <p className="text-body text-slate-400 italic text-center py-8">Mentor chưa cập nhật môn học hỗ trợ nào.</p>
                ) : (
                  selectedMentorDetail.services.map((srv) => (
                    <div key={srv.serviceId} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3 hover:shadow-sm hover:border-slate-200/80 transition-all text-left relative overflow-hidden group">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-body font-black text-slate-800 leading-snug group-hover:text-primary transition-colors">{srv.title}</span>
                        <span className="text-meta font-black text-teal-700 whitespace-nowrap bg-teal-50 border border-teal-200/50 px-3 py-1 rounded-full shrink-0 shadow-2xs">
                          {srv.free ? 'Miễn phí' : `${srv.priceScoin?.toLocaleString('en-US')} P`}
                        </span>
                      </div>
                      <p className="text-meta text-slate-500 leading-relaxed font-semibold line-clamp-2">{srv.description}</p>
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          Thời gian: {srv.durationMinutes} phút
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inline Booking Grid (Scrolled to when clicking schedule) */}
        <div
          ref={bookingSectionRef}
          className="bg-white border border-slate-100 p-8 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,0.95)] mt-8 text-left relative overflow-hidden bg-[radial-gradient(rgba(0,56,224,0.01)_1px,transparent_1px)] [background-size:12px_12px]"
        >
          {bookingSuccess ? (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg font-serif">Gửi yêu cầu đặt lịch thành công!</h3>
              <p className="text-slate-500 text-body font-semibold max-w-md mx-auto">Hệ thống đã gửi yêu cầu tới {activeMentor?.displayName}. Đang chuyển hướng quay lại danh sách mentor...</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-black text-slate-800 font-serif">Đặt lịch hẹn hỗ trợ cùng {selectedMentorDetail.displayName}</h3>
                <p className="text-body text-slate-500 font-medium mt-1">Chọn khung giờ trống trên lịch → Chọn môn học hỗ trợ → Điền mục tiêu học tập</p>
              </div>

              {bookingError && (
                <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-200 text-rose-600 p-3.5 rounded-xl text-meta font-semibold text-left mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Booking 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Calendar Grid (col-span-8) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      <h4 className="text-body font-extrabold text-slate-800">Chọn khung lịch rảnh của mentor</h4>
                    </div>

                    {/* Week switcher */}
                    <div className="flex bg-slate-100 border border-slate-200/60 p-1 rounded-full gap-1 shrink-0 shadow-inner-soft">
                      <button
                        type="button"
                        onClick={() => handleSwitchWeek(0)}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${bookingWeekOffset === 0
                          ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        Tuần này
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchWeek(1)}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${bookingWeekOffset === 1
                          ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        Tuần sau
                      </button>
                    </div>
                  </div>

                  {/* Week calendar grid */}
                  {bookingLoading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                      <p className="text-slate-400 text-body font-semibold animate-pulse">Đang tải lịch trống của mentor...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pt-1.5">
                      {getWeekDays(bookingWeekOffset).map((dayDate, idx) => {
                        const dayName = WEEKDAYS[idx].label;
                        const dateStr = formatDateISO(dayDate);
                        const isToday = formatDateISO(new Date()) === dateStr;
                        const daySlots = getBookingDaySlots(dayDate);

                        return (
                          <div key={idx} className={`rounded-2xl border p-3 flex flex-col text-left min-h-[270px] transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] ${isToday ? 'bg-teal-50/20 border-teal-500/30 ring-1 ring-teal-500/10' : 'bg-slate-50/30 border-slate-100/80 hover:bg-slate-50/50'}`}>
                            {/* Day Header */}
                            <div className="text-center pb-2 border-b border-slate-100 mb-3 shrink-0">
                              <span className={`text-[10px] font-extrabold block tracking-wide uppercase ${isToday ? 'text-teal-600' : 'text-slate-400'}`}>
                                {dayName}
                              </span>
                              <span className={`text-meta font-black inline-flex items-center justify-center w-7 h-7 rounded-full mt-1 transition-all ${isToday ? 'bg-teal-600 text-white shadow-md shadow-teal-500/15' : 'text-slate-700 bg-slate-100/50 border border-slate-200/30'}`}>
                                {dayDate.getDate()}
                              </span>
                            </div>

                            {/* Day Slots List */}
                            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none pr-0.5">
                              {daySlots.length === 0 ? (
                                <div className="h-full flex items-center justify-center py-8">
                                  <span className="text-[10px] text-slate-400/60 italic font-semibold text-center leading-tight">
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
                                      className={`p-2.5 rounded-xl border text-left shadow-[0_2px_4px_rgba(0,0,0,0.01),inset_0_2px_3px_rgba(255,255,255,0.9)] group/item relative cursor-pointer transition-all duration-200 hover:-translate-y-[1.5px] ${selected
                                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/30 scale-[1.02]'
                                        : hasServices
                                          ? 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50/90 text-emerald-800 hover:border-emerald-300'
                                          : 'bg-slate-100/40 border-slate-200/30 text-slate-400/50 opacity-40 cursor-not-allowed'
                                        }`}
                                    >
                                      <div className="text-[9px] font-extrabold flex items-center justify-between">
                                        <span className="flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5 shrink-0" />
                                          {fmtTime(slot.startTime)} - {fmtTime(slot.endTime)}
                                        </span>
                                      </div>

                                      {hasServices && (
                                        <div className="mt-1.5 space-y-1">
                                          {slot.services?.map(sv => {
                                            const code = getSubjectCode(sv.title);
                                            return (
                                              <span
                                                key={sv.serviceId}
                                                className={`block text-[8px] font-black tracking-wide truncate border px-1.5 py-0.5 rounded text-center leading-normal ${selected ? 'bg-white/15 border-white/20 text-white' : 'bg-white/80 border-slate-200/50 text-slate-700'}`}
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
                  )}
                </div>

                <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 text-left">
                  {!selectedSlotId ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl min-h-[300px] shadow-[inset_0_4px_10px_rgba(0,0,0,0.01)] bg-[radial-gradient(rgba(0,0,0,0.015)_1px,transparent_1px)] [background-size:10px_10px]">
                      <Calendar className="w-12 h-12 text-slate-300 mb-3.5" />
                      <h4 className="text-body font-black text-slate-700">Cấu hình Đăng ký</h4>
                      <p className="text-meta text-slate-400 font-bold mt-2.5 max-w-[260px] leading-relaxed">
                        👉 <span className="text-primary font-black">Hướng dẫn:</span> Bạn cần <span className="text-slate-800 font-extrabold">bấm chọn một khung lịch rảnh (màu xanh lá)</span> ở bảng lịch bên trái, hệ thống mới tải các giờ cụ thể tại đây để bạn chọn.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-5">
                      <div className="border-b border-slate-100 pb-3.5 mb-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Khung giờ đã chọn</span>
                        <span className="text-body font-black text-slate-800 block mt-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                          {selectedSlot ? (
                            <>
                              {getDayNameLong(new Date(selectedSlot.startTime))}, {formatDateDisplay(new Date(selectedSlot.startTime))}
                              <span className="text-primary ml-1.5 font-black block sm:inline mt-0.5 sm:mt-0">
                                ({fmtTime(selectedSlot.startTime)} - {fmtTime(selectedSlot.endTime)})
                              </span>
                            </>
                          ) : 'Chưa chọn'}
                        </span>
                      </div>

                      {/* Service selector */}
                      <div className="space-y-1.5">
                        <label className="block text-meta font-extrabold text-slate-400 uppercase tracking-wide">Môn học / Dịch vụ</label>
                        {slotServices.length === 0 ? (
                          <p className="text-meta text-rose-600 font-semibold">Khung lịch này chưa được gán dịch vụ nào.</p>
                        ) : slotServices.length === 1 ? (
                          <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-body font-bold text-slate-800 flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                            <span>{slotServices[0].title}</span>
                            <span className="text-meta font-black text-teal-700 bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded-full">{slotServices[0].isFree ? 'Miễn phí' : `${slotServices[0].priceScoin?.toLocaleString('en-US') || 0} Point`}</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {slotServices.map(s => {
                              const sId = s.serviceId || (s as any).id;
                              const selected = selectedServiceId === sId;
                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  onClick={() => {
                                    setSelectedServiceId(sId);
                                    setBookingError(null);
                                  }}
                                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all duration-200 ${selected
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs shadow-primary/5'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                >
                                  <span className="text-meta font-bold">{s.title}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${selected ? 'bg-primary text-white border-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200/50'}`}>{s.isFree ? 'FREE' : `${s.priceScoin?.toLocaleString('en-US')} P`}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Precise segment candidate selector */}
                      <div className="space-y-1.5">
                        <label className="block text-meta font-extrabold text-slate-400 uppercase tracking-wide">Giờ học cụ thể</label>
                        {!selectedServiceId ? (
                          <p className="text-meta text-slate-400 italic py-1">Vui lòng bấm chọn khung lịch rảnh (màu xanh lá) ở bên trái để tải giờ học.</p>
                        ) : candidatesLoading ? (
                          <div className="flex items-center gap-2 text-meta text-slate-400 font-semibold py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Đang kiểm tra slot trống...
                          </div>
                        ) : candidates.length === 0 ? (
                          <p className="text-meta text-rose-600 font-semibold">Hiện tại khung giờ này đã không còn trống, vui lòng chọn lại khung giờ khác.</p>
                        ) : (
                          <select
                            value={selectedCandidateKey}
                            onChange={(e) => setSelectedCandidateKey(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-body text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 font-semibold cursor-pointer shadow-sm shadow-slate-100"
                          >
                            <option value="" disabled className="text-slate-400">-- Chọn giờ học --</option>
                            {candidates.map((c) => {
                              const key = `${c.startTime}|${c.endTime}`;
                              const dateObj = parseCandidateTime(c.startTime);
                              const endObj = parseCandidateTime(c.endTime);
                              const startStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                              const endStr = endObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                              return (
                                <option key={key} value={key} className="text-slate-800 font-semibold">
                                  {startStr} - {endStr}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>

                      {/* Goal Title */}
                      <div className="space-y-1.5">
                        <label className="block text-meta font-extrabold text-slate-400 uppercase tracking-wide">Mục tiêu (tiêu đề ngắn)</label>
                        <input
                          type="text"
                          required
                          value={goalTitle}
                          onChange={(e) => setGoalTitle(e.target.value)}
                          placeholder="Ví dụ: Cần support bài Lab 3 Java Web"
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-body text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 font-semibold placeholder-slate-400/60 shadow-sm shadow-slate-100 transition-all"
                        />
                      </div>

                      {/* Goal Description */}
                      <div className="space-y-1.5">
                        <label className="block text-meta font-extrabold text-slate-400 uppercase tracking-wide">Mô tả chi tiết</label>
                        <textarea
                          required
                          rows={3}
                          value={goalDescription}
                          onChange={(e) => setGoalDescription(e.target.value)}
                          placeholder="Mô tả rõ lỗi gặp phải hoặc phần kiến thức cần mentor hỗ trợ..."
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-body text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 resize-none placeholder-slate-400/60 font-medium shadow-sm shadow-slate-100 transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={bookingSubmitting || !selectedSlotId || !selectedServiceId || !selectedCandidateKey}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-600 text-white text-body font-black py-3 px-4 rounded-xl cursor-pointer hover:opacity-95 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
            </>
          )}
        </div>
      </div>
    );
  };

  const getBookingDaySlots = (dayDate: Date) => {
    const targetStr = formatDateISO(dayDate);
    return activeSlots.filter(s => getLocalDateStr(s.startTime) === targetStr);
  };

  return (
    <div className="space-y-8 text-left relative min-h-screen pb-16">

      {selectedMentorDetail ? (
        renderMentorProfile()
      ) : (
        <>
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
          <div className="bg-surface border border-brand-border p-5 rounded-card shadow-sm space-y-4">
            {/* Search row */}
            <div className="relative w-full">
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

            {/* Dropdowns Row (Point 7) */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {/* Specialization Filter */}
              <div className="relative col-span-2 md:col-span-1">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold text-xs"
                >
                  <option value="ALL">Tất cả ngành</option>
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
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold text-xs"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="AVAILABLE">Sẵn sàng (Available)</option>
                  <option value="BUSY">Đang bận (Busy)</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div className="relative">
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold text-xs"
                >
                  <option value="ALL">Tất cả kinh nghiệm</option>
                  <option value="<1">&lt; 1 năm</option>
                  <option value="1-3">1 - 3 năm</option>
                  <option value="3+">3+ năm</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="relative">
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold text-xs"
                >
                  <option value="ALL">Tất cả điểm số</option>
                  <option value="4.5">★ 4.5+ sao</option>
                  <option value="4.8">★ 4.8+ sao</option>
                </select>
              </div>

              {/* Campus Filter */}
              <div className="relative">
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold text-xs"
                >
                  <option value="ALL">Tất cả cơ sở</option>
                  {campuses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="relative">
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold text-xs"
                >
                  <option value="ALL">Tất cả mức giá</option>
                  <option value="FREE">Miễn phí (Free)</option>
                  <option value="PAID">Có phí (SCoin)</option>
                </select>
              </div>
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
                          onClick={() => handleViewProfile(m, false)}
                          className="w-14 h-14 rounded-card bg-brand-bg object-cover border border-brand-border cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        <div className="space-y-1 text-left">
                          <h3
                            onClick={() => handleViewProfile(m, false)}
                            className="text-brand-text font-bold text-base leading-tight hover:text-brand-terracotta transition-colors cursor-pointer"
                          >
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
                              Độ hợp gu:{' '}
                              <span className="text-brand-terracotta font-extrabold">{Math.round(m.matchScore)}%</span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Match Rationale reasons */}
                      {m.matchReasons && m.matchReasons.length > 0 && (
                        <div className="bg-brand-bg/50 border border-brand-border/60 p-3 rounded-card text-left space-y-1">
                          <span className="text-meta font-bold text-brand-terracotta uppercase tracking-wider block">Gợi ý hợp gu</span>
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
                        onClick={() => handleViewProfile(m, true)}
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
        </>
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
                  handleViewProfile(drawerMentor, true);
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

      {/* Project Detail Dialog Modal (Point 2) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-slideUp max-h-[90vh] flex flex-col border border-line">
            {/* Header Image */}
            {selectedProject.imageUrl && (
              <div className="h-56 bg-surface-muted flex items-center justify-center relative shrink-0">
                <img src={selectedProject.imageUrl} alt={selectedProject.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute right-4 top-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {/* Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-left">
              {!selectedProject.imageUrl && (
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold text-primary bg-primary-soft/80 border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {selectedProject.role}
                  </span>
                  <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-full hover:bg-surface-muted text-fg-faint flex items-center justify-center transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <div className="space-y-2">
                {selectedProject.imageUrl && (
                  <span className="text-[10px] font-extrabold text-primary bg-primary-soft/80 border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                    {selectedProject.role}
                  </span>
                )}
                <h3 className="text-xl font-black text-fg leading-tight">
                  {selectedProject.title}
                </h3>
              </div>

              <div className="space-y-4 text-body text-fg-muted leading-relaxed font-semibold">
                <div className="space-y-1.5">
                  <span className="text-meta text-fg-faint block uppercase tracking-wider font-extrabold">Mô tả dự án</span>
                  <p className="whitespace-pre-line text-justify">{selectedProject.description}</p>
                </div>

                {selectedProject.outcome && (
                  <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                    <span className="text-meta text-emerald-600 block uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> Kết quả đạt được
                    </span>
                    <p className="text-emerald-800 text-justify">{selectedProject.outcome}</p>
                  </div>
                )}
              </div>

              {/* Project Links */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-line-soft">
                {selectedProject.figmaUrl && (
                  <a
                    href={selectedProject.figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-body font-bold transition-colors cursor-pointer"
                  >
                    <Figma className="w-4 h-4" /> Figma prototype
                  </a>
                )}
                {selectedProject.githubUrl && (
                  <a
                    href={selectedProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-body font-bold transition-colors cursor-pointer"
                  >
                    <Github className="w-4 h-4" /> Source code GitHub
                  </a>
                )}
                {selectedProject.behanceUrl && (
                  <a
                    href={selectedProject.behanceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 text-body font-bold transition-colors cursor-pointer"
                  >
                    <Behance className="w-4 h-4" /> Project Behance
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
