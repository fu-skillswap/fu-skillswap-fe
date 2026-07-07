import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, Check, X, Star, Search, SlidersHorizontal, Loader2, AlertCircle, ArrowLeft, Globe, Award, BookOpen, Briefcase, LayoutGrid, Info, ChevronLeft, ChevronRight, Compass, Link2 } from 'lucide-react';
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
import { matchingApi } from '../api/matching';
import type { MatchingQuestionnaire } from '../api/types';



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

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);





const formatDateISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

const getWeekDaysDetailed = (baseDate: Date) => {
  const day = baseDate.getDay();
  const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(baseDate);
  monday.setDate(diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
};

const getDaysInMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const days: Date[] = [];
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLastDay - i));
  }
  
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDay; i++) {
    days.push(new Date(year, month, i));
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
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

  // Detailed scheduler states
  const [isDetailedBookingMode, setIsDetailedBookingMode] = useState(false);
  const [schedulerViewMode, setSchedulerViewMode] = useState<'week' | 'day'>('week');
  const [visibleStartDate, setVisibleStartDate] = useState<Date>(new Date());
  const [allCandidatesMap, setAllCandidatesMap] = useState<{ [slotId: string]: ServiceSlotCandidate[] }>({});
  const [allCandidatesLoading, setAllCandidatesLoading] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateISO(new Date()));
  const [profileReviews, setProfileReviews] = useState<MentorReview[]>([]);
  const [profileReviewsLoading, setProfileReviewsLoading] = useState(false);

  // Review Drawer State
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [drawerMentor, setDrawerMentor] = useState<MentorVM | null>(null);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Custom Portfolio Tabs & Modal

  const [selectedProject, setSelectedProject] = useState<MentorPortfolioItem | null>(null);

  // Matching Profile States
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<MatchingQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [profileExists, setProfileExists] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  const handleOpenMatchingModal = async () => {
    setShowMatchingModal(true);
    setMatchingLoading(true);
    setMatchingError(null);
    try {
      const quest = await matchingApi.getQuestionnaire();
      setQuestionnaire(quest);

      try {
        const prof = await matchingApi.getProfile();
        if (prof && prof.exists && prof.latestAnswerCodes) {
          setProfileExists(true);
          setAnswers(prof.latestAnswerCodes);
        } else {
          setProfileExists(false);
          setAnswers({});
        }
      } catch {
        setProfileExists(false);
        setAnswers({});
      }
    } catch (err: any) {
      setMatchingError(err?.response?.data?.message || 'Không thể tải bộ câu hỏi khảo sát.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSelectMatchingOption = (questionCode: string, optionCode: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionCode]: optionCode,
    }));
  };

  const handleMatchingSubmit = async () => {
    if (!questionnaire) return;
    
    const q1 = questionnaire.questions.find(q => q.code === 'Q1_FOUNDATION_LEVEL');
    const q2 = questionnaire.questions.find(q => q.code === 'Q2_OUTPUT_REVIEW_LEVEL');
    const q3 = questionnaire.questions.find(q => q.code === 'Q3_DIRECTION_LEVEL');
    const q4 = questionnaire.questions.find(q => q.code === 'Q4_MENTOR_FIT');
    const q5 = questionnaire.questions.find(q => q.code === 'Q5_DURATION_PREFERENCE');

    if (!q1 || !q2 || !q3 || !q4 || !q5) {
      alert('Dữ liệu bộ câu hỏi không đồng bộ. Vui lòng thử lại sau.');
      return;
    }

    const a1 = answers[q1.code];
    const a2 = answers[q2.code];
    const a3 = answers[q3.code];
    const a4 = answers[q4.code];
    const a5 = answers[q5.code];

    if (!a1 || !a2 || !a3 || !a4 || !a5) {
      alert('Vui lòng trả lời đầy đủ cả 5 câu hỏi trước khi lưu.');
      return;
    }

    setMatchingLoading(true);
    setMatchingError(null);
    try {
      await matchingApi.submit({
        phase: 'ACTIVE',
        question1AnswerCode: a1,
        question2AnswerCode: a2,
        question3AnswerCode: a3,
        question4AnswerCode: a4,
        question5AnswerCode: a5,
      });

      const recs = await mentorsApi.getRecommendations(12);
      const m = new Map<string, MentorRecommendation>();
      recs.forEach((r) => r.mentor && m.set(r.mentor.mentorUserId, r));
      recMapRef.current = m;

      await loadMentors(searchQuery.trim());
      setShowMatchingModal(false);
      
      window.dispatchEvent(new CustomEvent('push-toast', {
        detail: {
          title: 'Khảo sát thành công',
          message: '🎉 Cập nhật nhu cầu tương hợp thành công. Các mentor phù hợp nhất đã được đề xuất hàng đầu!',
          type: 'INFO'
        }
      }));
    } catch (err: any) {
      setMatchingError(err?.response?.data?.message || 'Không thể lưu câu trả lời khảo sát.');
    } finally {
      setMatchingLoading(false);
    }
  };

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


    try {
      // Lấy cờ canRequestBooking (BE mới) song song với slots để gate sớm.
      const detail = await mentorsApi.getDetail(mentor.mentorUserId);
      const ext = getExtendedMentorData(detail.mentorUserId, detail.displayName, detail.specializationName);
      
      // Map backend featuredProjects to portfolios format
      const rawProjects = detail.featuredProjects || [];
      const mappedPortfolios = rawProjects.length > 0
        ? rawProjects.map(p => ({
            id: p.id,
            title: p.title,
            role: p.content || '',
            description: p.projectDescription || '',
            imageUrl: p.pictureUrl || '',
            figmaUrl: p.liveDemoUrl || '',
          }))
        : ext.portfolios;

      const mergedDetail: MentorDetail = {
        ...detail,
        // achievements nay là object v2 do BE trả trực tiếp (không còn lấy từ mock).
        achievements: detail.achievements ?? [],
        yearsOfExperience: detail.yearsOfExperience ?? ext.yearsOfExperience,
        company: detail.company ?? ext.company,
        projectsCount: detail.projectsCount ?? ext.projectsCount,
        portfolios: mappedPortfolios,
      };
      setSelectedMentorDetail(mergedDetail);
      
      // Load recent reviews for the details page
      setProfileReviews([]);
      setProfileReviewsLoading(true);
      mentorsApi.getReviews(mentor.mentorUserId, 0, 3)
        .then((paged) => setProfileReviews(paged?.content ?? []))
        .catch(() => setProfileReviews([]))
        .finally(() => setProfileReviewsLoading(false));

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
        if (detail.services && detail.services.length > 0) {
          setSelectedServiceId(detail.services[0].serviceId);
        }
      }

      if (shouldScrollToBooking) {
        setTimeout(() => {
          bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || 'Không tải được thông tin đặt lịch của mentor.');
    } finally {

    }
  };



  // Khi đổi slot: reset candidate (giữ service nếu hợp lệ, nếu không chọn service đầu tiên của slot mới).
  const handleSelectSlot = (slotId: string) => {
    setSelectedSlotId(slotId);
    setCandidates([]);
    setSelectedCandidateKey('');
    setBookingError(null);
    const slot = activeSlots.find((s) => s.slotId === slotId);
    if (slot?.services && slot.services.length > 0) {
      const hasCurrent = slot.services.some((s) => s.serviceId === selectedServiceId);
      if (!hasCurrent) {
        setSelectedServiceId(slot.services[0].serviceId);
      }
    } else {
      setSelectedServiceId('');
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

  // Load all candidates for the visible week/day grid in detailed scheduler mode
  useEffect(() => {
    if (!isDetailedBookingMode || !selectedMentorDetail || !selectedServiceId || activeSlots.length === 0) {
      setAllCandidatesMap({});
      return;
    }

    let active = true;
    const fetchAll = async () => {
      setAllCandidatesLoading(true);
      try {
        const promises = activeSlots.map(slot =>
          mentorsApi.getSlotCandidates(selectedMentorDetail.mentorUserId, slot.slotId, selectedServiceId)
            .then(res => ({
              slotId: slot.slotId,
              candidates: res.candidateServiceSlots || []
            }))
            .catch(() => ({ slotId: slot.slotId, candidates: [] }))
        );
        const results = await Promise.all(promises);
        if (!active) return;
        const candidateMap: { [slotId: string]: ServiceSlotCandidate[] } = {};
        results.forEach(r => {
          candidateMap[r.slotId] = r.candidates;
        });
        setAllCandidatesMap(candidateMap);
      } catch (err) {
        console.warn('Failed to load candidate slots in detailed mode', err);
      } finally {
        if (active) setAllCandidatesLoading(false);
      }
    };

    fetchAll();
  }, [isDetailedBookingMode, selectedMentorDetail, selectedServiceId, activeSlots, visibleStartDate, schedulerViewMode]);

  // Load availability slots dynamically when month picker changes, matching Swagger API flow
  useEffect(() => {
    if (!selectedMentorDetail) return;

    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    
    // Clamp fromDate to today's date if selected month is current/past to avoid querying past dates which causes 400 Bad Request
    const today = new Date();
    const todayStr = formatDateISO(today);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const isCurrentMonthOrPast = (year < currentYear) || (year === currentYear && month <= currentMonth);
    const firstDay = isCurrentMonthOrPast ? todayStr : formatDateISO(new Date(year, month, 1));
    const lastDay = formatDateISO(new Date(year, month + 1, 0));

    let active = true;
    mentorsApi.getAvailabilitySlots(selectedMentorDetail.mentorUserId, firstDay, lastDay)
      .then(slots => {
        if (active) {
          setActiveSlots(slots);
        }
      })
      .catch(err => {
        console.warn('Failed to load slots for selected month', err);
      });

    return () => {
      active = false;
    };
  }, [selectedMentorDetail, currentCalendarMonth]);

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
      setShowGoalModal(false);
      setTimeout(() => {
        setSelectedMentorDetail(null);
        setActiveMentor(null);
        setIsDetailedBookingMode(false);
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

  const renderDetailedBookingCalendar = () => {
    if (!selectedMentorDetail) return null;

    const selectedService = selectedMentorDetail.services?.find(s => s.serviceId === selectedServiceId) || selectedMentorDetail.services?.[0] || null;
    const serviceCode = selectedService ? selectedService.title.match(/^\[(.*?)\]/)?.[1] || 'Môn học' : 'Môn học';

    const visibleDays = schedulerViewMode === 'week' ? getWeekDaysDetailed(visibleStartDate) : [visibleStartDate];

    const getVisibleHours = () => {
      const hoursSet = new Set<string>();
      visibleDays.forEach(dayDate => {
        const dateStr = formatDateISO(dayDate);
        const daySlots = activeSlots.filter(s => getLocalDateStr(s.startTime) === dateStr);
        daySlots.forEach(slot => {
          const slotCandidates = allCandidatesMap[slot.slotId] || [];
          slotCandidates.forEach(c => {
            const startHour = new Date(c.startTime).getHours();
            hoursSet.add(`${startHour.toString().padStart(2, '0')}:00`);
            const endHour = new Date(c.endTime).getHours();
            hoursSet.add(`${endHour.toString().padStart(2, '0')}:00`);
          });
        });
      });

      if (hoursSet.size === 0) {
        return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
      }

      const sortedHours = Array.from(hoursSet).sort();
      const minHour = parseInt(sortedHours[0].split(':')[0], 10);
      const maxHour = parseInt(sortedHours[sortedHours.length - 1].split(':')[0], 10);
      
      const filledHours = [];
      for (let h = minHour; h <= maxHour; h++) {
        filledHours.push(`${h.toString().padStart(2, '0')}:00`);
      }
      return filledHours;
    };

    const visibleHours = getVisibleHours();

    const getMonthYearLabel = () => {
      const months = visibleDays.map(d => d.getMonth() + 1);
      const uniqueMonths = Array.from(new Set(months));
      const year = visibleStartDate.getFullYear();
      if (uniqueMonths.length > 1) {
        return `Tháng ${uniqueMonths[0]} - ${uniqueMonths[1]}, ${year}`;
      }
      return `Tháng ${uniqueMonths[0]}, ${year}`;
    };

    const getSelectedDateDisplay = () => {
      if (!selectedCandidateKey) return 'Chưa chọn';
      const [selStart] = selectedCandidateKey.split('|');
      const dateObj = new Date(selStart);
      return `${dateObj.getDate()} Tháng ${dateObj.getMonth() + 1}, ${dateObj.getFullYear()}`;
    };

    const getSelectedTimeDisplay = () => {
      if (!selectedCandidateKey) return 'Chưa chọn';
      const [selStart, selEnd] = selectedCandidateKey.split('|');
      return `${fmtTime(selStart)} - ${fmtTime(selEnd)}`;
    };

    const priceDisplay = selectedService
      ? selectedService.free
        ? 'Miễn phí'
        : `${selectedService.priceScoin?.toLocaleString('en-US')} SCoin`
      : '0 SCoin';

    const handlePrevRange = () => {
      setVisibleStartDate(prev => {
        const next = new Date(prev);
        if (schedulerViewMode === 'week') {
          next.setDate(prev.getDate() - 7);
        } else {
          next.setDate(prev.getDate() - 1);
        }
        return next;
      });
    };

    const handleNextRange = () => {
      setVisibleStartDate(prev => {
        const next = new Date(prev);
        if (schedulerViewMode === 'week') {
          next.setDate(prev.getDate() + 7);
        } else {
          next.setDate(prev.getDate() + 1);
        }
        return next;
      });
    };

    if (bookingSuccess) {
      return (
        <div className="space-y-6 animate-fadeIn text-center py-24 bg-white border border-[#e8eeff] rounded-3xl p-8 max-w-md mx-auto shadow-sm my-12 font-sans">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-slate-800 font-extrabold text-xl font-sans">Gửi yêu cầu đặt lịch thành công!</h3>
          <p className="text-slate-500 text-sm font-semibold max-w-xs mx-auto leading-relaxed">
            Hệ thống đã gửi yêu cầu tới {selectedMentorDetail.displayName}. Đang chuyển hướng...
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn text-left font-sans">
        {/* Back navigation header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsDetailedBookingMode(false);
              setSelectedCandidateKey('');
              setSelectedSlotId('');
            }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 transition-colors shadow-xs cursor-pointer active:scale-95"
            title="Quay lại hồ sơ mentor"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-headline-md text-[#151c29] font-bold leading-tight font-sans">
              Chi tiết lịch hẹn – Mentor {selectedMentorDetail.displayName}
            </h2>
            <p className="text-sm font-bold text-primary block mt-0.5 font-sans">
              Lịch rảnh môn: {selectedService ? selectedService.title : 'Chưa chọn'}
            </p>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Scheduler Grid (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#e8eeff] rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* Header: month and view toggler */}
            <div className="flex justify-between items-center pb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevRange}
                  className="p-1.5 hover:bg-slate-100 border border-slate-100 rounded-full cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <span className="text-sm font-extrabold text-[#151c29] uppercase tracking-wide min-w-[120px] text-center font-sans">
                  {getMonthYearLabel()}
                </span>
                <button
                  onClick={handleNextRange}
                  className="p-1.5 hover:bg-slate-100 border border-slate-100 rounded-full cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-100">
                <button
                  onClick={() => setSchedulerViewMode('day')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer font-sans ${
                    schedulerViewMode === 'day'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ngày
                </button>
                <button
                  onClick={() => setSchedulerViewMode('week')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer font-sans ${
                    schedulerViewMode === 'week'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tuần
                </button>
              </div>
            </div>

            {/* Grid Schedule */}
            {allCandidatesLoading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <span className="text-xs text-slate-400 font-semibold block font-sans">Đang tải lịch rảnh mentor...</span>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                
                {/* Day Columns Header */}
                <div
                  className="grid border-b border-slate-100 bg-[#f9f9ff]"
                  style={{
                    gridTemplateColumns: schedulerViewMode === 'week' 
                      ? '80px repeat(7, minmax(0, 1fr))' 
                      : '80px minmax(0, 1fr)'
                  }}
                >
                  <div className="p-3 text-center border-r border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center font-sans">
                    Giờ
                  </div>
                  {visibleDays.map((dayDate, idx) => {
                    const isToday = formatDateISO(new Date()) === formatDateISO(dayDate);
                    const weekdayLabel = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayDate.getDay()];
                    return (
                      <div
                        key={idx}
                        className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}
                      >
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide block font-sans">{weekdayLabel}</span>
                        <span className={`text-base font-black block mt-0.5 font-sans ${isToday ? 'text-primary' : 'text-slate-800'}`}>{dayDate.getDate()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Rows by Hours */}
                <div className="divide-y divide-slate-100">
                  {visibleHours.map((hour) => {
                    return (
                      <div
                        key={hour}
                        className="grid min-h-[96px]"
                        style={{
                          gridTemplateColumns: schedulerViewMode === 'week' 
                            ? '80px repeat(7, minmax(0, 1fr))' 
                            : '80px minmax(0, 1fr)'
                        }}
                      >
                        {/* Hour Label Column */}
                        <div className="p-2 flex items-center justify-center border-r border-slate-100 bg-slate-50/50 text-[11px] font-extrabold text-[#717786] font-sans">
                          {hour}
                        </div>
                        
                        {/* Slots for each visible day at this hour */}
                        {visibleDays.map((dayDate, idx) => {
                          const dateStr = formatDateISO(dayDate);
                          const daySlots = activeSlots.filter(s => getLocalDateStr(s.startTime) === dateStr);
                          
                          return (
                            <div
                              key={idx}
                              className="p-2 border-r border-slate-100 last:border-r-0 relative flex flex-col gap-2 justify-center bg-white min-h-[96px] hover:bg-slate-50/20 transition-colors"
                            >
                              {daySlots.map(slot => {
                                const slotCandidates = allCandidatesMap[slot.slotId] || [];
                                const hourCandidates = slotCandidates.filter(c => {
                                  const cStartHour = new Date(c.startTime).getHours().toString().padStart(2, '0') + ':00';
                                  return cStartHour === hour;
                                });
                                
                                return hourCandidates.map(c => {
                                  const cStartStr = fmtTime(c.startTime);
                                  const cEndStr = fmtTime(c.endTime);
                                  const isSelected = selectedCandidateKey === `${c.startTime}|${c.endTime}`;
                                  const isBlocked = !!c.reasonIfBlocked;
                                  
                                  if (isBlocked) {
                                    return (
                                      <div
                                        key={`${c.startTime}|${c.endTime}`}
                                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center h-full min-h-[72px] text-center select-none"
                                      >
                                        <span className="text-[10px] font-bold text-slate-400 block font-sans">{cStartStr} - {cEndStr}</span>
                                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5 font-sans">Số lượng: 1/1</span>
                                        <span className="text-xs font-black text-slate-400 mt-1 block uppercase tracking-wider font-sans">Đã đầy</span>
                                      </div>
                                    );
                                  }
                                  
                                  if (isSelected) {
                                    return (
                                      <div
                                        key={`${c.startTime}|${c.endTime}`}
                                        className="p-2.5 rounded-xl bg-primary text-white border border-primary flex flex-col justify-center items-center h-full min-h-[72px] text-center cursor-pointer transition-all duration-200 shadow-md shadow-primary/20 active:scale-[0.98] select-none animate-scaleUp font-sans"
                                        onClick={() => {
                                          setSelectedCandidateKey('');
                                          setSelectedSlotId('');
                                        }}
                                      >
                                        <div className="flex items-center justify-center gap-1">
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          <span className="text-[10px] font-bold block font-sans">{cStartStr} - {cEndStr}</span>
                                        </div>
                                        <span className="text-[9px] text-blue-100 font-semibold mt-0.5 font-sans">Số lượng: 0/1</span>
                                        <span className="text-xs font-black mt-1 block uppercase tracking-wider font-sans">Đang chọn</span>
                                      </div>
                                    );
                                  }
                                  
                                  // Available
                                  return (
                                    <div
                                      key={`${c.startTime}|${c.endTime}`}
                                      className="p-2.5 rounded-xl bg-blue-50/70 border border-primary/20 hover:bg-primary/10 text-primary hover:border-primary/40 flex flex-col justify-center items-center h-full min-h-[72px] text-center cursor-pointer transition-all duration-200 hover:shadow-xs active:scale-[0.98] select-none font-sans"
                                      onClick={() => {
                                        setSelectedSlotId(slot.slotId);
                                        setSelectedCandidateKey(`${c.startTime}|${c.endTime}`);
                                      }}
                                    >
                                      <span className="text-[10px] font-bold block font-sans">{cStartStr} - {cEndStr}</span>
                                      <span className="text-[9px] text-primary/80 font-semibold mt-0.5 font-sans">Số lượng: 0/1</span>
                                      <span className="text-xs font-black mt-1 block uppercase tracking-wider font-sans">Trống</span>
                                    </div>
                                  );
                                });
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Booking Info Sidebar (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Guide Card */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-body font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
                <Info className="w-5 h-5 text-primary" />
                <span>Hướng dẫn đặt lịch</span>
              </h3>
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-sans font-semibold">
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">1</span>
                  <p>Chọn ngày rảnh cho môn <span className="font-extrabold text-slate-800">[{serviceCode}]</span> (ô màu xanh nhạt).</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">2</span>
                  <p>Chọn khung giờ phù hợp.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">3</span>
                  <p>Xác nhận thông tin và thanh toán bằng SCoin.</p>
                </div>
              </div>
            </div>

            {/* Booking Details Card */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-5 font-sans">
              <h3 className="text-body font-bold text-slate-800 border-b border-slate-100 pb-3 font-sans">
                Thông tin đặt lịch
              </h3>

              <div className="space-y-4 font-sans font-semibold">
                {/* Service */}
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-300" /> Môn học
                  </span>
                  <span className="text-slate-800 font-extrabold text-right max-w-[200px]">
                    {selectedService ? selectedService.title : 'Chưa chọn'}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-300" /> Ngày
                  </span>
                  <span className="text-slate-800 font-extrabold">
                    {getSelectedDateDisplay()}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-300" /> Thời gian
                  </span>
                  {selectedCandidateKey ? (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-[10px]">
                      {getSelectedTimeDisplay()}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold font-sans">Chưa chọn</span>
                  )}
                </div>

                {/* Separator */}
                <div className="border-t border-slate-100 my-2" />

                {/* SCoin Price */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-bold text-xs font-sans">Tổng chi phí</span>
                  <div className="flex items-center gap-1.5">
                    {/* SCoin Blue Icon */}
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                      S
                    </div>
                    <span className="text-primary text-base font-black font-sans">{priceDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!selectedCandidateKey}
                onClick={() => {
                  setGoalTitle('');
                  setGoalDescription('');
                  setShowGoalModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl cursor-pointer hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/25 font-sans"
              >
                <span>Xác nhận đặt lịch</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-slate-400 text-center font-medium font-sans leading-relaxed">
                Bằng việc xác nhận, bạn đồng ý với chính sách hủy lịch của chúng tôi.
              </p>
            </div>

          </div>

        </div>
      </div>
    );
  };
  const renderMentorProfile = () => {
    if (!selectedMentorDetail) return null;

    if (isDetailedBookingMode) {
      return renderDetailedBookingCalendar();
    }

    const selectedService = selectedMentorDetail.services?.find(s => s.serviceId === selectedServiceId) || selectedMentorDetail.services?.[0] || null;
    const priceDisplay = selectedService
      ? selectedService.free
        ? 'Miễn phí'
        : `${selectedService.priceScoin?.toLocaleString('en-US')} SCoin`
      : '0 SCoin';



    return (
      <div className="space-y-8 animate-fadeIn text-left font-sans">

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

        {/* Top Banner (New Premium Layout) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#e8eeff] shadow-sm">
          {/* Cover gradient layer (Brushed network pattern) */}
          <div
            className="h-44 bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
            style={{ 
              backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
            }}
          >
            {/* Mesh overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-white/50 tracking-[0.3em] uppercase block">SkillSwap Platform</span>
              <h2 className="text-sm font-black text-white/90 tracking-widest uppercase flex items-center justify-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Mentor Profile Detail
              </h2>
            </div>
          </div>

          {/* Info Area (Aligned Left Avatar & Details) */}
          <div className="px-8 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-14 relative z-10">
            <img
              src={selectedMentorDetail.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
              onError={onAvatarError}
              alt={selectedMentorDetail.displayName}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white object-cover border-4 border-white shadow-md hover:scale-[1.02] transition-transform duration-300"
            />
            
            <div className="flex-1 text-center md:text-left space-y-2 pb-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-800 leading-tight">
                  {selectedMentorDetail.displayName}
                </h1>
                <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mx-auto md:mx-0 ${
                  selectedMentorDetail.isAvailable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/40'
                    : 'bg-rose-100 text-rose-800 border border-rose-200/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedMentorDetail.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {selectedMentorDetail.isAvailable ? 'Sẵn sàng ngay' : 'Bận'}
                </span>
              </div>
              <p className="text-xs font-bold text-primary bg-[#f0f4ff]/70 border border-primary/10 px-3 py-1 rounded-full inline-block">
                {selectedMentorDetail.headline || 'Chuyên gia chia sẻ kỹ năng'}
              </p>
            </div>
          </div>

          {/* Stats Bar (Row of light background column statistics) */}
          <div className="border-t border-[#e8eeff] bg-slate-50/50 grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-center py-4 gap-2 md:gap-0">
            <div className="py-2 md:py-0 space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Đánh giá</span>
              <span className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1">
                ★ {(selectedMentorDetail.ratingAverage ?? 5.0).toFixed(1)}
                <span className="text-[10px] text-slate-400 font-semibold">({selectedMentorDetail.reviewCount || 0})</span>
              </span>
            </div>
            <div className="py-2 md:py-0 space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Mentoring</span>
              <span className="text-sm font-extrabold text-slate-800">
                {selectedMentorDetail.completedSessions || 0} buổi
              </span>
            </div>
            <div className="py-2 md:py-0 space-y-0.5 px-2 truncate">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Chuyên ngành</span>
              <span className="text-xs font-extrabold text-slate-800 block truncate" title={selectedMentorDetail.specializationName}>
                {selectedMentorDetail.specializationName || 'Kỹ năng'}
              </span>
            </div>
            <div className="py-2 md:py-0 space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Dự án</span>
              <span className="text-sm font-extrabold text-slate-800">
                {selectedMentorDetail.portfolios?.length || 0}+ dự án
              </span>
            </div>
            <div className="py-2 md:py-0 space-y-0.5 px-2 truncate">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Cơ sở đào tạo</span>
              <span className="text-xs font-extrabold text-slate-800 block truncate" title={selectedMentorDetail.campusName}>
                {selectedMentorDetail.campusName || 'FPT University'}
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-column details & courses layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Bio, Skills, Projects, Education, etc. (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 1: Giới thiệu bản thân */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-body font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Info className="w-5 h-5 text-primary" />
                <span>Giới thiệu bản thân</span>
              </h3>
              <p className="text-body text-slate-600 leading-relaxed font-medium whitespace-pre-line text-justify">
                {selectedMentorDetail.bio || 'Chưa cấu hình thông tin giới thiệu.'}
              </p>
            </div>

            {/* Card 2: Kỹ năng chuyên môn */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-body font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Compass className="w-5 h-5 text-primary" />
                <span>Kỹ năng chuyên môn</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedMentorDetail.helpTopicTags && selectedMentorDetail.helpTopicTags.length > 0 ? (
                  selectedMentorDetail.helpTopicTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f0f4ff]/50 border border-primary/15 text-primary hover:bg-[#f0f4ff] transition-colors"
                    >
                      {tag.nameVi}
                    </span>
                  ))
                ) : (
                  <span className="text-meta text-slate-400 italic">Chưa cấu hình kỹ năng chuyên môn.</span>
                )}
              </div>

              {/* Support Levels Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs font-semibold">
                {selectedMentorDetail.foundationSupportLevel != null && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-meta text-slate-400 block mb-0.5">Hỗ trợ nền tảng</span>
                    <span className="text-slate-800 font-bold">{levelLabel(profileOptions?.foundationSupportLevels, selectedMentorDetail.foundationSupportLevel)}</span>
                  </div>
                )}
                {selectedMentorDetail.outputReviewSupportLevel != null && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-meta text-slate-400 block mb-0.5">Review sản phẩm</span>
                    <span className="text-slate-800 font-bold">{levelLabel(profileOptions?.outputReviewSupportLevels, selectedMentorDetail.outputReviewSupportLevel)}</span>
                  </div>
                )}
                {selectedMentorDetail.directionSupportLevel != null && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-meta text-slate-400 block mb-0.5">Định hướng sự nghiệp</span>
                    <span className="text-slate-800 font-bold">{levelLabel(profileOptions?.directionSupportLevels, selectedMentorDetail.directionSupportLevel)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Dự án tiêu biểu & Portfolio */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-body font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>Dự án tiêu biểu &amp; Portfolio</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(selectedMentorDetail.portfolios ?? []).map((project) => (
                  <div key={project.id} className="bg-white border border-[#e8eeff] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-[1px]">
                    <div>
                      {project.imageUrl && (
                        <div className="h-40 overflow-hidden bg-slate-100 border-b border-slate-100 flex items-center justify-center">
                          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block">
                          {project.role}
                        </span>
                        <h4 className="text-body font-bold text-slate-800 line-clamp-1">
                          {project.title}
                        </h4>
                        <p className="text-meta text-slate-500 line-clamp-2 leading-relaxed font-semibold">
                          {project.description}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 border-t border-slate-50 mt-3 flex items-center justify-between">
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
                  <div className="col-span-2 py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-meta text-slate-400 font-semibold">
                    Mentor này chưa cấu hình danh sách Portfolio dự án.
                  </div>
                )}
              </div>

              {/* Môn học thế mạnh (subjectResults) */}
              {selectedMentorDetail.subjectResults && selectedMentorDetail.subjectResults.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">Môn học thế mạnh</h4>
                  <div className="flex flex-wrap gap-2">
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
            </div>

            {/* Card 4: Học vấn & Giải thưởng */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-body font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-primary" />
                <span>Học vấn &amp; Giải thưởng</span>
              </h3>
              {selectedMentorDetail.achievements && selectedMentorDetail.achievements.length > 0 ? (
                <div className="relative pl-6 border-l border-primary/20 space-y-5">
                  {selectedMentorDetail.achievements.map((ach) => (
                    <div key={ach.id} className="relative group text-left">
                      {/* Dot decoration */}
                      <span className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary flex items-center justify-center transition-all group-hover:scale-110">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-snug">
                        {ach.title}
                      </h4>
                      {ach.awardDescription && (
                        <p className="text-meta text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                          {ach.awardDescription}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-meta text-slate-400 italic font-semibold text-center py-4">Mentor chưa cấu hình học vấn &amp; giải thưởng.</p>
              )}
            </div>

            {/* Card 5: Các buổi chia sẻ khác */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-body font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Các buổi chia sẻ khác</span>
              </h3>
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {!selectedMentorDetail.services || selectedMentorDetail.services.length === 0 ? (
                  <p className="text-meta text-slate-400 italic text-center py-8">Mentor chưa cập nhật môn học hỗ trợ nào.</p>
                ) : (
                  selectedMentorDetail.services.map((srv) => {
                    const isCurrent = srv.serviceId === selectedServiceId;
                    return (
                      <div
                        key={srv.serviceId}
                        className={`p-4.5 border rounded-2xl space-y-3 transition-all text-left relative overflow-hidden group flex flex-col justify-between sm:flex-row sm:items-center sm:gap-4 ${
                          isCurrent
                            ? 'bg-primary/5 border-primary/30 shadow-xs'
                            : 'bg-slate-50/50 border-[#e8eeff] hover:bg-slate-50 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800 leading-snug group-hover:text-primary transition-colors">
                              {srv.title}
                            </span>
                            <span className="text-[9px] font-black text-teal-700 whitespace-nowrap bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                              {srv.free ? 'Miễn phí' : `${srv.priceScoin?.toLocaleString('en-US')} SCoin / giờ`}
                            </span>
                          </div>
                          <p className="text-meta text-slate-500 leading-relaxed font-semibold line-clamp-2 pr-4">
                            {srv.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 pt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            <span>Thời lượng: {srv.durationMinutes} phút</span>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceId(srv.serviceId);
                            bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                            
                            window.dispatchEvent(new CustomEvent('push-toast', {
                              detail: {
                                title: 'Chọn gói thành công',
                                message: `Đã chọn gói: ${srv.title}. Bạn có thể chọn ngày giờ học ở cột bên phải.`,
                                type: 'INFO'
                              }
                            }));
                          }}
                          className={`py-2 px-4 rounded-xl text-meta font-extrabold cursor-pointer transition-all shrink-0 mt-3 sm:mt-0 ${
                            isCurrent
                              ? 'bg-primary text-white border border-primary shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/50'
                          }`}
                        >
                          {isCurrent ? 'Đang chọn' : 'Xem chi tiết'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Outstanding Service Booking Widget & Social Links & Recent Reviews (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Booking Card */}
            <div
              ref={bookingSectionRef}
              className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-5 text-left relative overflow-hidden"
            >
              {bookingSuccess ? (
                <div className="py-16 text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg font-sans">Gửi yêu cầu đặt lịch thành công!</h3>
                  <p className="text-slate-500 text-body-md font-medium max-w-xs mx-auto leading-relaxed">
                    Hệ thống đã gửi yêu cầu tới {selectedMentorDetail.displayName}. Đang chuyển hướng...
                  </p>
                </div>
              ) : (
                <div className="space-y-4.5">
                  <div className="space-y-2 border-b border-slate-100 pb-3">
                    <span className="inline-block text-[9px] font-black text-white bg-primary px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Gói nổi bật
                    </span>
                    <h3 className="text-body-lg font-black text-slate-900 leading-tight">
                      {selectedService ? selectedService.title : 'Chưa chọn gói'}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-primary text-2xl font-black">{priceDisplay}</span>
                      <span className="text-meta text-slate-400 font-bold">/ giờ</span>
                    </div>
                    {selectedService?.description && (
                      <div className="text-meta text-slate-500 font-semibold leading-relaxed pt-1.5 space-y-1 pr-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                        {selectedService.description.split('\n').map((line, idx) => (
                          <p key={idx} className="flex items-start gap-1">
                            <span className="text-primary font-bold shrink-0">✓</span>
                            <span>{line}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {bookingError && (
                    <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-semibold text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Monthly Calendar View */}
                  <div className="bg-[#f0f4ff]/30 p-4.5 rounded-2xl border border-[#e8eeff] space-y-3">
                    {/* Month Picker Header */}
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-extrabold text-[#151c29] uppercase tracking-wide">
                        {`Tháng ${currentCalendarMonth.getMonth() + 1}, ${currentCalendarMonth.getFullYear()}`}
                      </span>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                          }}
                          className="p-1 hover:bg-slate-200/55 rounded-full cursor-pointer text-[#717786] hover:text-[#151c29] transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                          }}
                          className="p-1 hover:bg-slate-200/55 rounded-full cursor-pointer text-[#717786] hover:text-[#151c29] transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLabel, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {dayLabel}
                        </span>
                      ))}
                    </div>

                    {/* Monthly Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {getDaysInMonthGrid(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth()).map((dayDate, idx) => {
                        const dateStr = formatDateISO(dayDate);
                        const isSelected = selectedDateStr === dateStr;
                        const isCurrentMonth = dayDate.getMonth() === currentCalendarMonth.getMonth();
                        const isToday = formatDateISO(new Date()) === dateStr;
                        const daySlots = activeSlots.filter(s => getLocalDateStr(s.startTime) === dateStr);
                        const hasSlots = daySlots.some(s => s.services && s.services.length > 0);

                        let cellClass = "w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-semibold transition-all relative border ";
                        
                        if (!isCurrentMonth) {
                          cellClass += "border-transparent text-slate-300 pointer-events-none";
                        } else if (isSelected) {
                          cellClass += "bg-primary border-primary text-white font-bold shadow-sm cursor-pointer";
                        } else if (hasSlots) {
                          cellClass += "bg-[#e8eeff] border-primary/20 text-primary hover:bg-primary/10 cursor-pointer";
                        } else {
                          cellClass += "border-transparent text-slate-500 hover:bg-slate-50 cursor-pointer";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedDateStr(dateStr);
                              if (daySlots.length > 0) {
                                handleSelectSlot(daySlots[0].slotId);
                              } else {
                                setSelectedSlotId('');
                                setCandidates([]);
                                setSelectedCandidateKey('');
                              }
                            }}
                            className={cellClass}
                          >
                            <span>{dayDate.getDate()}</span>
                            {hasSlots && !isSelected && (
                              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                            {isToday && !isSelected && !hasSlots && (
                              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Status & Booking Flow */}
                  {(() => {
                    const daySlots = activeSlots.filter(s => getLocalDateStr(s.startTime) === selectedDateStr);
                    
                    return (
                      <div className="space-y-4 pt-1">
                        {/* Chọn khung giờ */}
                        <div className="space-y-1.5 text-left">
                          <label className="block text-[10px] font-extrabold text-[#414754] uppercase tracking-wider font-sans">Chọn khung giờ học</label>
                          {daySlots.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 border border-slate-100 rounded-xl font-sans">
                              Không có lịch rảnh nào trong ngày này.
                            </p>
                          ) : !selectedServiceId ? (
                            <p className="text-xs text-slate-400 italic py-1 font-sans">Vui lòng chọn môn học ở cột bên trái.</p>
                          ) : candidatesLoading ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold py-2">
                              <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" /> Đang kiểm tra slot...
                            </div>
                          ) : candidates.length === 0 ? (
                            <p className="text-xs text-rose-600 font-semibold py-1 font-sans">Khung lịch này hiện đã kín, vui lòng chọn lại.</p>
                          ) : (
                            <select
                              value={selectedCandidateKey}
                              onChange={(e) => setSelectedCandidateKey(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 font-semibold cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%23717786%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat font-sans"
                            >
                              <option value="" disabled className="text-slate-400">-- Chọn khung giờ học --</option>
                              {candidates.map((c) => {
                                const key = `${c.startTime}|${c.endTime}`;
                                const dateObj = parseCandidateTime(c.startTime);
                                const startStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                return (
                                  <option key={key} value={key} className="text-slate-800 font-semibold font-sans">
                                    {startStr}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>

                        {/* Booking Form Details */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          {/* "Xem chi tiết các khung giờ" Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsDetailedBookingMode(true);
                              setVisibleStartDate(selectedDateStr ? new Date(selectedDateStr) : new Date());
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#414754] hover:bg-slate-50 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer hover:shadow-xs transition-all active:scale-[0.99] font-sans"
                          >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Xem chi tiết các khung giờ</span>
                          </button>

                          {/* "Đặt lịch học ngay" Button */}
                          <button
                            type="button"
                            disabled={!selectedSlotId || !selectedServiceId || !selectedCandidateKey}
                            onClick={() => {
                              setGoalTitle('');
                              setGoalDescription('');
                              setShowGoalModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 px-4 rounded-xl cursor-pointer hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/20 font-sans"
                          >
                            <span>Đặt lịch học ngay</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Social Links Connections Card */}
            {(selectedMentorDetail.linkedinUrl || selectedMentorDetail.githubUrl || selectedMentorDetail.portfolioUrl) && (
              <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm text-center space-y-4">
                <h4 className="text-xs text-slate-400 font-extrabold uppercase tracking-widest font-sans">
                  Kết nối với {selectedMentorDetail.displayName}
                </h4>
                <div className="flex gap-4 justify-center">
                  {selectedMentorDetail.linkedinUrl && (
                    <a
                      href={selectedMentorDetail.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-primary/10 border border-slate-100 text-slate-700 hover:text-primary transition-all duration-300 shadow-sm"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {selectedMentorDetail.githubUrl && (
                    <a
                      href={selectedMentorDetail.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-900/10 border border-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-300 shadow-sm"
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
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 hover:bg-teal-500/10 border border-slate-100 text-slate-700 hover:text-teal-600 transition-all duration-300 shadow-sm"
                      title="Portfolio Website"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Đánh giá gần đây */}
            <div className="bg-white border border-[#e8eeff] p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-[#151c29] uppercase tracking-wider font-headline">Đánh giá gần đây</h4>
                <button
                  type="button"
                  onClick={() => handleOpenReviews(selectedMentorDetail)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {profileReviewsLoading ? (
                  <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : profileReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center font-sans">Chưa có đánh giá nào.</p>
                ) : (
                  profileReviews.map((rev) => (
                    <div key={rev.reviewId} className="p-3 border border-slate-100 rounded-xl space-y-2 bg-slate-50/30 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.reviewerAvatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                            onError={onAvatarError}
                            alt={rev.reviewerDisplayName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block leading-tight">{rev.reviewerDisplayName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block font-sans">{fmtDateTime(rev.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold font-sans text-justify">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  };  return (
    <div className="space-y-8 text-left relative min-h-screen pb-16">

      {selectedMentorDetail ? (
        renderMentorProfile()
      ) : (
        <>
          {/* Title */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 bg-brand-terracotta/15 text-brand-terracotta text-body font-bold py-1 px-3 rounded-full border border-brand-terracotta/25">
              <Link2 className="w-3.5 h-3.5" /> Kết nối kỹ năng FPT
            </span>
            <h1 className="text-3xl font-extrabold text-brand-text font-sans tracking-tight">
              Tìm kiếm Mentor & Bạn cùng tiến
            </h1>
            <p className="text-brand-text-muted text-body max-w-2xl font-medium">
              Lọc và ghép cặp với các sinh viên khóa trên hoặc các bạn cùng ngành để bắt đầu phiên trao đổi kỹ năng học thuật.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="bg-surface border border-brand-border p-5 rounded-card shadow-sm space-y-4">
            {/* Search row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
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
              <button
                type="button"
                onClick={handleOpenMatchingModal}
                className="bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-body py-3 px-5 rounded-field flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
              >
                <Compass className="w-4 h-4" /> Khám phá Mentor phù hợp
              </button>
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
                  <h3 className="text-lg font-bold font-sans text-brand-text">Đánh giá từ sinh viên</h3>
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
                  <span className="text-3xl font-extrabold text-brand-text font-sans">{(drawerMentor.ratingAverage ?? 0).toFixed(1)}</span>
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

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp text-left font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-body-lg font-bold text-slate-900 font-sans">Mục tiêu học tập của bạn</h3>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400 hover:text-slate-700"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {bookingError && (
              <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-semibold text-left font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#414754] uppercase tracking-wide">Tiêu đề mục tiêu ngắn</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Ví dụ: Cần support cấu trúc database bài Lab 3"
                  className="w-full bg-[#f9f9ff] border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 font-semibold placeholder-slate-400 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#414754] uppercase tracking-wide">Mô tả chi tiết vướng mắc</label>
                <textarea
                  required
                  rows={4}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Mô tả rõ lỗi gặp phải hoặc kiến thức cần mentor hỗ trợ..."
                  className="w-full bg-[#f9f9ff] border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 resize-none placeholder-slate-400 font-sans"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl cursor-pointer transition-all font-sans"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="w-1/2 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 rounded-xl cursor-pointer hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm font-sans"
                >
                  {bookingSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Xác nhận đặt</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questionnaire Modal */}
      {showMatchingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl space-y-4 text-left flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowMatchingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:opacity-80 text-brand-text-muted cursor-pointer transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1 pr-6">
              <h3 className="text-xl font-bold font-sans text-brand-text flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-terracotta" />
                Khám phá Mentor phù hợp
              </h3>
              <p className="text-meta text-brand-text-muted leading-relaxed font-semibold">
                Trả lời nhanh 5 câu hỏi trắc nghiệm dưới đây để hệ thống tự động tính toán mức độ tương hợp và đề xuất những Mentor phù hợp nhất lên hàng đầu.
              </p>
            </div>

            {matchingLoading && !questionnaire ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-brand-terracotta animate-spin" />
                <p className="text-meta text-brand-text-muted font-bold">Đang tải bộ câu hỏi khảo sát...</p>
              </div>
            ) : matchingError && !questionnaire ? (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-brand-terracotta mx-auto" />
                <p className="text-meta text-brand-terracotta font-bold">{matchingError}</p>
                <button
                  onClick={handleOpenMatchingModal}
                  className="bg-brand-terracotta text-white text-meta font-bold py-2 px-4 rounded-field hover:opacity-90"
                >
                  Thử lại
                </button>
              </div>
            ) : questionnaire ? (
              <>
                {profileExists && (
                  <div className="p-3 bg-brand-bg/80 border border-brand-border/60 rounded-xl text-meta text-brand-text-muted font-semibold">
                    💡 Bạn đã thực hiện khảo sát trước đó. Bạn có thể thay đổi các câu trả lời dưới đây để cập nhật bộ lọc đề xuất.
                  </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                  {questionnaire.questions
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((q, idx) => {
                      return (
                        <div key={q.code} className="p-5 bg-brand-bg/40 border border-brand-border rounded-xl space-y-3 text-left">
                          <p className="text-body font-extrabold text-brand-text flex items-start gap-2 leading-snug">
                            <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-brand-terracotta text-[10px] font-black text-white shrink-0 mt-0.5 shadow-sm">
                              {idx + 1}
                            </span>
                            {q.questionText}
                          </p>
                          <div className="space-y-2 pl-7.5">
                            {q.options
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map((opt) => {
                                const isSelected = answers[q.code] === opt.code;
                                return (
                                  <label
                                    key={opt.code}
                                    onClick={() => handleSelectMatchingOption(q.code, opt.code)}
                                    className={`flex items-center gap-3 p-3.5 rounded-field border text-meta font-bold cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-brand-terracotta/10 border-brand-terracotta text-brand-terracotta shadow-sm font-extrabold'
                                        : 'bg-surface border-brand-border text-brand-text-muted hover:border-brand-text/30 hover:bg-brand-bg/30'
                                    }`}
                                  >
                                    <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                      isSelected ? 'border-brand-terracotta bg-brand-terracotta/20' : 'border-brand-border bg-transparent'
                                    }`}>
                                      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand-terracotta" />}
                                    </span>
                                    <span className="leading-snug">{opt.label}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {matchingError && (
                  <p className="text-meta text-brand-terracotta font-bold text-center mt-2">{matchingError}</p>
                )}

                <div className="pt-3 border-t border-brand-border flex gap-3 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMatchingModal(false)}
                    className="py-2.5 px-5 bg-brand-bg border border-brand-border rounded-field text-meta font-bold text-brand-text-muted hover:bg-brand-bg/80 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={matchingLoading}
                    onClick={handleMatchingSubmit}
                    className="py-2.5 px-6 bg-brand-terracotta hover:bg-brand-terracotta/95 disabled:opacity-50 text-white rounded-field text-meta font-bold cursor-pointer active:scale-98 transition-all flex items-center gap-2"
                  >
                    {matchingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>Hoàn thành & Gợi ý Mentor</span>
                    )}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};
