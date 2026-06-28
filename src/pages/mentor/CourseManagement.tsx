import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Plus, Search, BookOpen, Pencil, Trash, 
  ToggleLeft, ToggleRight, AlertCircle, Loader2, X
} from 'lucide-react';
import { mentorServicesApi } from '../../api/mentorServices';
import { helpTopicApi } from '../../api/mentorProfile';
import { availabilityApi } from '../../api/availability';
import type { HelpTopic, MentorServiceItem, AvailabilityRule } from '../../api/types';

// Fallback topics if helpTopicApi fails to load
const DEFAULT_TOPICS: HelpTopic[] = [
  { id: '00000000-0000-0000-0000-000000000001', nameVi: 'Lập trình Web', nameEn: 'Web Development' },
  { id: '00000000-0000-0000-0000-000000000002', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence' },
  { id: '00000000-0000-0000-0000-000000000003', nameVi: 'Kỹ nghệ phần mềm', nameEn: 'Software Engineering' },
  { id: '00000000-0000-0000-0000-000000000004', nameVi: 'UI/UX & Graphics', nameEn: 'UI/UX & Graphics' },
  { id: '00000000-0000-0000-0000-000000000005', nameVi: 'An toàn thông tin', nameEn: 'Information Security' },
  { id: '00000000-0000-0000-0000-000000000006', nameVi: 'Kinh tế & Marketing', nameEn: 'Business & Marketing' },
];

const WEEKDAYS = [
  { value: 'MONDAY', label: 'T2' },
  { value: 'TUESDAY', label: 'T3' },
  { value: 'WEDNESDAY', label: 'T4' },
  { value: 'THURSDAY', label: 'T5' },
  { value: 'FRIDAY', label: 'T6' },
  { value: 'SATURDAY', label: 'T7' },
  { value: 'SUNDAY', label: 'CN' },
];

const getDayOfWeekName = (date: Date) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
};

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

const getErrorMessage = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message || e.defaultMessage || JSON.stringify(e)).join(', ');
    }
    if (typeof data.errors === 'object') {
      return Object.entries(data.errors).map(([key, val]) => `${key}: ${val}`).join(', ');
    }
  }
  return JSON.stringify(data);
};

const parseTitle = (fullTitle: string = '') => {
  const match = fullTitle.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return {
      subjectCode: match[1],
      cleanTitle: match[2]
    };
  }
  return {
    subjectCode: 'CLASS',
    cleanTitle: fullTitle
  };
};

export const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MentorServiceItem[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [topics, setTopics] = useState<HelpTopic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);
  const [loadingRules, setLoadingRules] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const selectedStatus = 'all';

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  // Form Fields - Course Info
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [topicId, setTopicId] = useState('');
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [description, setDescription] = useState('');
  const [outcomesText, setOutcomesText] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceScoin, setPriceScoin] = useState<string | number>('0');

  // Form Fields - Availability Schedule Config
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [ruleNote, setRuleNote] = useState('');

  // Calendar parameters
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Validation & Notifications
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Confirmation Delete Modals
  const [courseToDelete, setCourseToDelete] = useState<MentorServiceItem | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<AvailabilityRule | null>(null);
  const [courseToHide, setCourseToHide] = useState<MentorServiceItem | null>(null);

  // Edit Rule states
  const [ruleToEdit, setRuleToEdit] = useState<AvailabilityRule | null>(null);
  const [editRuleDays, setEditRuleDays] = useState<string[]>([]);
  const [editRuleStartTime, setEditRuleStartTime] = useState('08:00');
  const [editRuleEndTime, setEditRuleEndTime] = useState('09:00');
  const [editRuleNote, setEditRuleNote] = useState('');
  const [editRuleErrors, setEditRuleErrors] = useState<Record<string, string>>({});

  // Create Rule states are removed as createRule flows through Course Creation

  const triggerToast = (message: string, type: 'success' | 'danger') => {
    window.dispatchEvent(new CustomEvent('push-toast', {
      detail: {
        title: type === 'success' ? 'Thành công' : 'Lỗi hệ thống',
        message,
        type: type === 'success' ? 'BOOKING_ACCEPTED' : 'BOOKING_REJECTED'
      }
    }));
    window.dispatchEvent(new Event('refresh-notifications'));
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await mentorServicesApi.list();
      setCourses(data || []);
    } catch (err: any) {
      console.error('Lấy danh sách dịch vụ thất bại:', err);
      triggerToast('Không thể đồng bộ danh sách khóa học với máy chủ.', 'danger');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const data = await availabilityApi.listRules();
      setRules(data || []);
    } catch (err: any) {
      console.error('Lấy danh sách luật rảnh thất bại:', err);
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const list = await helpTopicApi.list();
        if (list && list.length > 0) {
          setTopics(list);
        }
      } catch (err) {
        console.warn('Không tải được help topics từ API, sử dụng danh sách mặc định.', err);
      }
    };
    loadTopics();
    fetchServices();
    fetchRules();
  }, []);

  useEffect(() => {
    if (toastVisible) {
      const dismissTimer = setTimeout(() => {
        setToastVisible(false);
      }, 4000);
      return () => clearTimeout(dismissTimer);
    }
  }, [toastVisible]);

  useEffect(() => {
    if (!toastVisible && toast) {
      const cleanTimer = setTimeout(() => {
        setToast(null);
      }, 300);
      return () => clearTimeout(cleanTimer);
    }
  }, [toastVisible, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Vui lòng nhập tên khóa học.';
    if (!subjectCode.trim()) newErrors.subjectCode = 'Vui lòng nhập mã môn học.';
    if (!topicId) newErrors.topicId = 'Vui lòng chọn chủ đề.';
    if (!description.trim()) newErrors.description = 'Vui lòng nhập mô tả khóa học.';
    if (!isFree && (Number(priceScoin) <= 0 || !priceScoin)) newErrors.priceScoin = 'Vui lòng nhập số Point lớn hơn 0.';
    
    // Time format validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (selectedDays.length > 0) {
      if (!startTime || !timeRegex.test(startTime)) {
        newErrors.startTime = 'Giờ bắt đầu không đúng định dạng HH:mm';
      } else if (startTime < '09:00' || startTime > '21:00') {
        newErrors.startTime = 'Giờ bắt đầu làm việc chỉ cho phép từ 09:00 đến 21:00';
      }
      
      if (!endTime || !timeRegex.test(endTime)) {
        newErrors.endTime = 'Giờ kết thúc không đúng định dạng HH:mm';
      } else if (endTime < '09:00' || endTime > '21:00') {
        newErrors.endTime = 'Giờ kết thúc làm việc chỉ cho phép từ 09:00 đến 21:00';
      }
      
      if (startTime && endTime && startTime >= endTime) {
        newErrors.endTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentServiceId(null);
    setTitle('');
    setSubjectCode('');
    setTopicId(topics[0]?.id || '');
    setSessionDuration(60);
    setDescription('');
    setOutcomesText('');
    setIsFree(true);
    setPriceScoin('');
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:00');
    setRuleNote('');
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (course: MentorServiceItem) => {
    setIsEditing(true);
    setCurrentServiceId(course.serviceId);
    
    const { subjectCode: sCode, cleanTitle } = parseTitle(course.title);

    setTitle(cleanTitle);
    setSubjectCode(sCode);
    setTopicId(course.helpTopics && course.helpTopics.length > 0 ? course.helpTopics[0].id : topics[0]?.id || '');
    setSessionDuration(course.durationMinutes);
    setDescription(course.description || '');
    setOutcomesText(course.expectedOutcome || '');
    setIsFree(course.free !== undefined ? course.free : (course as any).isFree);
    setPriceScoin(course.priceScoin !== undefined ? String(course.priceScoin) : '');
    
    // Default schedule config empty for edit
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:00');
    setRuleNote('');
    
    setErrors({});
    setShowModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fullTitle = `[${subjectCode.trim().toUpperCase()}] ${title.trim()}`;

    const payload = {
      title: fullTitle,
      description: description.trim(),
      expectedOutcome: outcomesText.trim(),
      durationMinutes: sessionDuration,
      isFree: isFree,
      free: isFree,
      priceScoin: isFree ? 0 : (Number(priceScoin) || 0),
      helpTopicIds: [topicId],
    };

    setLoading(true);
    try {
      if (isEditing && currentServiceId) {
        await mentorServicesApi.update(currentServiceId, payload);
        triggerToast('Đã cập nhật thông tin lớp học thành công.', 'success');
      } else {
        await mentorServicesApi.create(payload);
        triggerToast('Tạo lớp học mới thành công!', 'success');
      }

      // Simultaneously create availability rules if days are checked
      if (selectedDays.length > 0) {
        const today = new Date();
        const endRange = new Date();
        endRange.setDate(today.getDate() + 30); // Active for 30 days

        const formatTime = (t: string) => t.slice(0, 5);
        
        const rulePayload = {
          ruleType: 'OPEN' as const,
          repeatType: 'WEEKLY' as const,
          daysOfWeek: selectedDays,
          effectiveFrom: formatDateISO(today),
          effectiveTo: formatDateISO(endRange),
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          note: ruleNote.trim() || `Lịch khả dụng: ${fullTitle}`,
        };
        
        await availabilityApi.createRule(rulePayload);
        triggerToast('Đã tạo lớp và thiết lập lịch rảnh thành công.', 'success');
        await fetchRules();
      }

      setShowModal(false);
      await fetchServices();
    } catch (err: any) {
      console.error('Lưu lớp học thất bại:', err);
      const detailMsg = getErrorMessage(err) || 'Có lỗi xảy ra khi lưu thông tin lớp học.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (course: MentorServiceItem) => {
    setLoading(true);
    try {
      const nextState = !course.active;
      await mentorServicesApi.toggleActive(course.serviceId, nextState);
      triggerToast(`Đã ${nextState ? 'kích hoạt' : 'tạm dừng'} hiển thị lớp học.`, 'success');
      await fetchServices();
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Thay đổi trạng thái thất bại.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = (course: MentorServiceItem) => {
    if (course.active) {
      setCourseToHide(course);
    } else {
      handleToggleStatus(course);
    }
  };

  const confirmHideCourse = async () => {
    if (!courseToHide) return;
    const currentCourse = courseToHide;
    setCourseToHide(null);
    await handleToggleStatus(currentCourse);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    const deletedId = courseToDelete.serviceId;
    setLoading(true);
    try {
      await mentorServicesApi.delete(deletedId);
      triggerToast(`Đã xóa lớp học "${parseTitle(courseToDelete.title).cleanTitle}" thành công.`, 'success');
      setCourseToDelete(null);
      setCourses(prev => prev.filter(c => c.serviceId !== deletedId));
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Không thể xóa khóa học này.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setCourseToDelete(null);
      setLoading(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    const deletedId = ruleToDelete.ruleId;
    setSavingRuleId(deletedId);
    try {
      await availabilityApi.deleteRule(deletedId);
      triggerToast('Đã xóa thời gian rảnh thành công.', 'success');
      setRules(prev => prev.filter(r => r.ruleId !== deletedId));
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Không thể xóa thời gian rảnh này.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setRuleToDelete(null);
      setSavingRuleId(null);
    }
  };

  const handleOpenEditRuleModal = (rule: AvailabilityRule) => {
    setRuleToEdit(rule);
    setEditRuleDays(rule.daysOfWeek || []);
    setEditRuleStartTime(rule.startTime || '09:00');
    setEditRuleEndTime(rule.endTime || '10:00');
    setEditRuleNote(rule.note || '');
    setEditRuleErrors({});
  };

  const validateEditRuleForm = () => {
    const newErrors: Record<string, string> = {};
    if (editRuleDays.length === 0) newErrors.days = 'Vui lòng chọn ít nhất một thứ trong tuần.';
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!editRuleStartTime || !timeRegex.test(editRuleStartTime)) {
      newErrors.startTime = 'Giờ bắt đầu không đúng định dạng HH:mm';
    } else if (editRuleStartTime < '09:00' || editRuleStartTime > '21:00') {
      newErrors.startTime = 'Giờ bắt đầu làm việc chỉ cho phép từ 09:00 đến 21:00';
    }
    
    if (!editRuleEndTime || !timeRegex.test(editRuleEndTime)) {
      newErrors.endTime = 'Giờ kết thúc không đúng định dạng HH:mm';
    } else if (editRuleEndTime < '09:00' || editRuleEndTime > '21:00') {
      newErrors.endTime = 'Giờ kết thúc làm việc chỉ cho phép từ 09:00 đến 21:00';
    }
    
    if (editRuleStartTime && editRuleEndTime && editRuleStartTime >= editRuleEndTime) {
      newErrors.endTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
    }

    setEditRuleErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEditRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleToEdit || !validateEditRuleForm()) return;

    setLoadingRules(true);
    try {
      const formatTime = (t: string) => t.slice(0, 5);

      const payload = {
        ruleType: ruleToEdit.ruleType,
        repeatType: ruleToEdit.repeatType,
        daysOfWeek: editRuleDays,
        effectiveFrom: ruleToEdit.effectiveFrom,
        effectiveTo: ruleToEdit.effectiveTo,
        startTime: formatTime(editRuleStartTime),
        endTime: formatTime(editRuleEndTime),
        note: editRuleNote.trim(),
      };
      
      const updated = await availabilityApi.updateRule(ruleToEdit.ruleId, payload);
      triggerToast('Đã cập nhật lịch rảnh thành công.', 'success');
      setRules(prev => prev.map(r => r.ruleId === ruleToEdit.ruleId ? { ...r, ...updated } : r));
      setRuleToEdit(null);
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Cập nhật lịch rảnh thất bại.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setLoadingRules(false);
    }
  };

  // createRule helpers removed as createRule flows through Course Creation

  const toggleEditDaySelection = (dayValue: string) => {
    setEditRuleDays(prev => 
      prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
    );
  };

  const toggleDaySelection = (dayValue: string) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
    );
  };

  // Filter Rules applying to a specific day
  const getRulesForDay = (dayDate: Date) => {
    const dateStr = formatDateISO(dayDate);
    const weekdayName = getDayOfWeekName(dayDate);
    
    return rules.filter(r => {
      const startRange = r.effectiveFrom;
      const endRange = r.effectiveTo;
      const isWithinRange = dateStr >= startRange && (!endRange || dateStr <= endRange);
      const isWeekdayMatch = !!(r.daysOfWeek && r.daysOfWeek.includes(weekdayName));
      return isWithinRange && isWeekdayMatch;
    });
  };

  // Filter Courses list
  const filteredCourses = courses.filter(c => {
    const { subjectCode, cleanTitle } = parseTitle(c.title);
    const matchesSearch = 
      cleanTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTopic = selectedTopic === 'all' || (c.helpTopics && c.helpTopics.some(t => t.id === selectedTopic));
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'active' && c.active) || 
      (selectedStatus === 'inactive' && !c.active);

    return matchesSearch && matchesTopic && matchesStatus;
  });

  // Keep only unique courses by clean title to prevent sidebar duplicates
  const uniqueFilteredCourses: MentorServiceItem[] = [];
  const seenTitles = new Set<string>();
  for (const c of filteredCourses) {
    const titleKey = parseTitle(c.title).cleanTitle.trim().toLowerCase();
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      uniqueFilteredCourses.push(c);
    }
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-fg tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Quản lý lớp học
          </h1>
          <p className="text-fg-muted text-body font-medium">
            Quản lý các môn học giảng dạy và thiết lập lịch rảnh khả dụng của bạn theo dạng lưới thời khóa biểu.
          </p>
        </div>
      </div>

      {/* Main Grid: Google Calendar layout (Sidebar on left, Calendar on right) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left column: Courses lists & Search */}
        <div className="xl:col-span-1 space-y-4">
          <button
            onClick={handleOpenCreateModal}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-body font-bold py-3 px-5 rounded-field cursor-pointer shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Tạo lớp học mới
          </button>

          {/* Search Card */}
          <div className="meetmind-card p-4 rounded-card space-y-3">
            <h3 className="text-meta font-extrabold text-fg uppercase tracking-wider">Danh sách lớp dạy</h3>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
              <input
                type="text"
                placeholder="Tìm tên lớp, mã môn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-muted/50 border border-line rounded-field py-2 pl-9 pr-4 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
              />
            </div>

            {/* Filter Topic selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-fg-muted uppercase">Chủ đề</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
              >
                <option value="all">Tất cả chủ đề</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.nameVi}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Classes Cards list */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : uniqueFilteredCourses.length === 0 ? (
              <div className="meetmind-card py-10 text-center text-meta text-fg-faint font-semibold">
                Không tìm thấy lớp học nào.
              </div>
            ) : (
              uniqueFilteredCourses.map(course => {
                const { subjectCode, cleanTitle } = parseTitle(course.title);
                const isFreeCourse = course.free !== undefined ? course.free : (course as any).isFree;
                
                return (
                  <div
                    key={course.serviceId}
                    className={`meetmind-card p-4 rounded-card border-l-4 transition-all duration-300 relative group ${
                      course.active ? 'border-l-primary shadow-sm hover:shadow-md' : 'border-l-fg-faint opacity-70 shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 text-left min-w-0 flex-1">
                        <span className="inline-block text-[9px] font-black text-primary bg-primary-soft px-1.5 py-0.5 rounded uppercase tracking-wide">
                          {subjectCode}
                        </span>
                        <h4 className="text-meta font-extrabold text-fg truncate hover:text-clip leading-snug cursor-pointer" onClick={() => navigate(`/mentor/courses/${course.serviceId}`)}>
                          {cleanTitle}
                        </h4>
                        <div className="text-[10px] text-fg-muted font-bold flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                          <span>{course.durationMinutes} phút</span>
                          <span>•</span>
                          {isFreeCourse ? (
                            <span className="text-green-600 font-extrabold">Miễn phí</span>
                          ) : (
                            <span className="text-amber-600 font-extrabold">{course.priceScoin?.toLocaleString('en-US')} Pt</span>
                          )}
                        </div>
                      </div>

                      {/* Toggle status control */}
                      <button
                        onClick={() => handleToggleClick(course)}
                        className="cursor-pointer text-fg-faint hover:text-primary transition-colors mt-0.5 shrink-0"
                        title={course.active ? "Ẩn lớp học" : "Hiện lớp học"}
                      >
                        {course.active ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-fg-faint" />}
                      </button>
                    </div>

                    {/* Footer Actions (Edit & Delete) */}
                    <div className="mt-3 pt-2.5 border-t border-line-soft flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(course)}
                        className="p-1.5 text-fg-muted hover:text-primary hover:bg-primary-soft border border-line rounded-lg bg-surface transition-all cursor-pointer text-meta font-semibold"
                        title="Chỉnh sửa lớp"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCourseToDelete(course)}
                        className="p-1.5 text-fg-muted hover:text-danger hover:bg-danger-soft border border-line rounded-lg bg-surface transition-all cursor-pointer text-meta font-semibold"
                        title="Xóa lớp"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Google Calendar Grid */}
        <div className="xl:col-span-3">
          <div className="meetmind-card p-6 rounded-card space-y-4">
            
            {/* Week Selection & Nav block */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-line-soft pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary shrink-0" />
                <div className="text-left">
                  <h3 className="text-base font-bold text-fg">Thời khóa biểu / Lịch rảnh dạy</h3>
                  <p className="text-meta text-fg-muted font-semibold">
                    {(() => {
                      const weekDays = getWeekDays(weekOffset);
                      return `Từ thứ 2 (${formatDateDisplay(weekDays[0])}) đến Chủ nhật (${formatDateDisplay(weekDays[6])})`;
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="flex bg-surface-muted p-1 rounded-field gap-1 shrink-0">
                <button
                  onClick={() => setWeekOffset(0)}
                  className={`px-4 py-1.5 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${weekOffset === 0 ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
                >
                  Tuần này
                </button>
                <button
                  onClick={() => setWeekOffset(1)}
                  className={`px-4 py-1.5 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${weekOffset === 1 ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
                >
                  Tuần sau
                </button>
              </div>
            </div>

            {/* Google Calendar-style Vertical Timeline View */}
            {loadingRules ? (
              <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-xs mt-4">
                
                {/* 1. Header Row (Day names and dates) */}
                <div className="flex border-b border-line bg-surface-muted/50 select-none">
                  {/* Spacer for Time Sidebar column */}
                  <div className="w-14 border-r border-line shrink-0" />
                  
                  {/* 7 Columns Day Headers */}
                  <div className="flex-1 grid grid-cols-7">
                    {getWeekDays(weekOffset).map((dayDate, idx) => {
                      const dayName = WEEKDAYS[idx].label;
                      const dateStr = formatDateISO(dayDate);
                      const isToday = formatDateISO(new Date()) === dateStr;
                      return (
                        <div
                          key={idx}
                          className={`py-3 text-center border-r border-line last:border-r-0 ${
                            isToday ? 'bg-primary-soft/10' : ''
                          }`}
                        >
                          <span className={`text-[10px] font-extrabold block tracking-wide uppercase ${isToday ? 'text-primary' : 'text-fg-faint'}`}>
                            {dayName}
                          </span>
                          <span className={`text-base font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-full mt-0.5 ${
                            isToday ? 'bg-primary text-white shadow-sm' : 'text-fg'
                          }`}>
                            {dayDate.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Scrollable Timeline Area */}
                <div className="max-h-[500px] overflow-y-auto relative scrollbar-thin flex">
                  
                  {/* Time Sidebar Column */}
                  <div className="w-14 border-r border-line shrink-0 relative bg-surface select-none" style={{ height: '600px' }}>
                    {Array.from({ length: 21 - 9 + 1 }).map((_, idx) => {
                      const hour = 9 + idx;
                      const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                      return (
                        <div
                          key={hour}
                          className="absolute right-2 text-[10px] font-bold text-fg-faint text-right"
                          style={{ top: `${(hour - 9) * 50 - 7}px` }}
                        >
                          {displayHour}
                        </div>
                      );
                    })}
                  </div>

                  {/* 7 Columns Timeline Grid */}
                  <div className="flex-1 relative" style={{ height: '600px' }}>
                    
                    {/* Horizontal Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 21 - 9 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border-b border-line-soft/40"
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: `${(idx + 1) * 50}px`,
                            height: '1px'
                          }}
                        />
                      ))}
                    </div>

                    {/* Columns containing Events */}
                    <div className="absolute inset-0 grid grid-cols-7 h-full">
                      {getWeekDays(weekOffset).map((dayDate, dayIdx) => {
                        const dayRules = getRulesForDay(dayDate);
                        const dateStr = formatDateISO(dayDate);
                        const isToday = formatDateISO(new Date()) === dateStr;

                        return (
                          <div
                            key={dayIdx}
                            className={`relative h-full border-r border-line last:border-r-0 ${
                              isToday ? 'bg-primary-soft/5' : ''
                            }`}
                          >
                            {/* Absolute Event blocks for this day */}
                            {dayRules.map((rule) => {
                              const isSaving = savingRuleId === rule.ruleId;
                              
                              // Calculate position
                              const START_HOUR = 9;
                              const END_HOUR = 21;
                              const HOUR_HEIGHT = 50;

                              const parseTimeToDecimal = (timeStr: string): number => {
                                if (!timeStr) return START_HOUR;
                                const parts = timeStr.split(':');
                                const hours = parseInt(parts[0], 10) || 0;
                                const minutes = parseInt(parts[1], 10) || 0;
                                return hours + minutes / 60;
                              };

                              const startDec = Math.max(START_HOUR, Math.min(END_HOUR, parseTimeToDecimal(rule.startTime || '')));
                              const endDec = Math.max(START_HOUR, Math.min(END_HOUR, parseTimeToDecimal(rule.endTime || '')));
                              
                              const top = (startDec - START_HOUR) * HOUR_HEIGHT;
                              const height = Math.max(25, (endDec - startDec) * HOUR_HEIGHT); // Min height 25px

                              return (
                                <div
                                  key={rule.ruleId}
                                  className="absolute left-1 right-1 rounded-md border border-primary/20 bg-primary-soft/85 hover:bg-primary-soft shadow-xs p-1.5 overflow-hidden group/rule transition-all hover:z-10 hover:shadow-md text-left"
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`
                                  }}
                                >
                                  {/* Time & actions */}
                                  <div className="flex items-center justify-between text-[9px] font-extrabold text-primary leading-tight">
                                    <span className="truncate">
                                      {rule.startTime} - {rule.endTime}
                                    </span>
                                    
                                    {isSaving ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin text-primary shrink-0" />
                                    ) : (
                                      <div className="hidden group-hover/rule:flex items-center gap-1 shrink-0 bg-primary-soft rounded px-0.5 ml-1">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleOpenEditRuleModal(rule); }}
                                          className="text-primary hover:text-primary-hover cursor-pointer"
                                          title="Sửa"
                                        >
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setRuleToDelete(rule); }}
                                          className="text-danger hover:text-danger-hover cursor-pointer"
                                          title="Xóa"
                                        >
                                          <Trash className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Note */}
                                  <div
                                    className="text-[10px] font-bold text-fg truncate mt-0.5 leading-normal"
                                    title={rule.note}
                                  >
                                    {rule.note || 'Lịch khả dụng'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Create / Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-5xl bg-surface border border-line rounded-card p-6 shadow-xl relative text-left my-8 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-line-soft pb-3">
              <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" /> {isEditing ? 'Cập nhật thông tin lớp học' : 'Tạo lớp học / Dịch vụ dạy mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="py-4 space-y-5">
              
              <div className={`grid grid-cols-1 ${isEditing ? '' : 'lg:grid-cols-2'} gap-8`}>
                {/* Column 1: SECTION 1: Class details */}
                <div className="space-y-4 text-left">
                  <h4 className="text-meta font-extrabold text-primary uppercase border-b border-line-soft pb-1">1. Thông tin chi tiết lớp dạy</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Mã môn học <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="VD: FER201, PRN211"
                        value={subjectCode}
                        onChange={(e) => { setSubjectCode(e.target.value); if(errors.subjectCode) setErrors({...errors, subjectCode: ''}); }}
                        className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-bold uppercase ${
                          errors.subjectCode ? 'border-danger/60 focus:border-danger' : 'border-line'
                        }`}
                      />
                      {errors.subjectCode && <p className="text-meta text-danger font-semibold mt-1">{errors.subjectCode}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Tên lớp học / Dịch vụ <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Hướng dẫn ReactJS cơ bản"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); if(errors.title) setErrors({...errors, title: ''}); }}
                        className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                          errors.title ? 'border-danger/60 focus:border-danger' : 'border-line'
                        }`}
                      />
                      {errors.title && <p className="text-meta text-danger font-semibold mt-1">{errors.title}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-meta font-bold text-fg-muted uppercase min-h-[2.25rem] flex items-end mb-1.5">Chủ đề <span className="text-danger">*</span></label>
                      <select
                        value={topicId}
                        onChange={(e) => { setTopicId(e.target.value); if(errors.topicId) setErrors({...errors, topicId: ''}); }}
                        className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold font-bold"
                      >
                        {topics.map(t => (
                          <option key={t.id} value={t.id}>{t.nameVi}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-meta font-bold text-fg-muted uppercase min-h-[2.25rem] flex items-end mb-1.5">Thời lượng học (phút/buổi)</label>
                      <select
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(Number(e.target.value))}
                        className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold font-bold"
                      >
                        <option value={15}>15 phút</option>
                        <option value={30}>30 phút</option>
                        <option value={45}>45 phút</option>
                        <option value={60}>60 phút</option>
                        <option value={90}>90 phút</option>
                        <option value={120}>120 phút</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-meta font-bold text-fg-muted uppercase min-h-[2.25rem] flex items-end mb-1.5">Chi phí lớp học</label>
                      <select
                        value={isFree ? 'free' : 'point'}
                        onChange={(e) => {
                          const val = e.target.value === 'free';
                          setIsFree(val);
                          if (val) setPriceScoin('');
                        }}
                        className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold font-bold"
                      >
                        <option value="free">Miễn phí (Trao đổi chéo)</option>
                        <option value="point">Tính phí (Point)</option>
                      </select>
                    </div>
                  </div>

                  {!isFree && (
                    <div className="animate-fadeIn text-left">
                      <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Số Point yêu cầu <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={priceScoin}
                        onChange={(e) => { setPriceScoin(e.target.value); if(errors.priceScoin) setErrors({...errors, priceScoin: ''}); }}
                        className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                          errors.priceScoin ? 'border-danger/60 focus:border-danger' : 'border-line'
                        }`}
                      />
                      {errors.priceScoin && <p className="text-meta text-danger font-semibold mt-1">{errors.priceScoin}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Mô tả lớp học <span className="text-danger">*</span></label>
                    <textarea
                      required
                      rows={3}
                      placeholder="VD: Cung cấp kiến thức cơ bản về React component, state, effect..."
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); if(errors.description) setErrors({...errors, description: ''}); }}
                      className={`w-full bg-surface border rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium ${
                        errors.description ? 'border-danger/60 focus:border-danger' : 'border-line'
                      }`}
                    />
                    {errors.description && <p className="text-meta text-danger font-semibold mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1 flex justify-between">
                      <span>Kết quả đầu ra đạt được</span>
                      <span className="text-fg-faint font-semibold normal-case">Mỗi dòng là một kết quả</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="VD: Có thể tự tạo project React cơ bản&#10;Hiểu và dùng thành thạo các Hook thông dụng"
                      value={outcomesText}
                      onChange={(e) => setOutcomesText(e.target.value)}
                      className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium"
                    />
                  </div>
                </div>

                {/* Column 2: SECTION 2: Schedule configuration */}
                {!isEditing && (
                  <div className="space-y-4 lg:border-l lg:border-line-soft lg:pl-8 text-left">
                    <h4 className="text-meta font-extrabold text-primary uppercase border-b border-line-soft pb-1">
                      2. Cấu hình lịch rảnh khả dụng
                    </h4>
                    
                    <p className="text-[11px] text-fg-muted font-medium leading-relaxed">
                      Tích chọn các thứ và <strong className="text-primary font-extrabold">nhập khung giờ bất kỳ bạn rảnh</strong> trong khoảng từ 09:00 đến 21:00 (Ví dụ: 11:00 - 13:00). Hệ thống sẽ tự động sinh các slot tương ứng từ hôm nay đến 2 tuần tiếp theo.
                    </p>

                    <div className="space-y-4">
                      {/* Days checkbox group */}
                      <div>
                        <label className="block text-[11px] font-bold text-fg-muted uppercase mb-2">Thứ trong tuần</label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map(day => {
                            const checked = selectedDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDaySelection(day.value)}
                                className={`px-4 py-2 text-meta font-bold border rounded-field transition-all cursor-pointer ${
                                  checked 
                                    ? 'bg-primary text-white border-primary shadow-xs' 
                                    : 'bg-surface text-fg border-line hover:bg-surface-muted/40'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time selection group */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ bắt đầu rảnh (từ 09:00) <span className="text-danger">*</span></label>
                          <input
                            type="time"
                            min="09:00"
                            max="21:00"
                            value={startTime}
                            onChange={(e) => { setStartTime(e.target.value); if(errors.startTime) setErrors({...errors, startTime: ''}); }}
                            className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                              errors.startTime ? 'border-danger/60 focus:border-danger' : 'border-line'
                            }`}
                          />
                          {errors.startTime && <p className="text-meta text-danger font-semibold mt-1">{errors.startTime}</p>}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ kết thúc rảnh (đến 21:00) <span className="text-danger">*</span></label>
                          <input
                            type="time"
                            min="09:00"
                            max="21:00"
                            value={endTime}
                            onChange={(e) => { setEndTime(e.target.value); if(errors.endTime) setErrors({...errors, endTime: ''}); }}
                            className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                              errors.endTime ? 'border-danger/60 focus:border-danger' : 'border-line'
                            }`}
                          />
                          {errors.endTime && <p className="text-meta text-danger font-semibold mt-1">{errors.endTime}</p>}
                        </div>
                      </div>

                      <div className="text-[10px] text-primary bg-primary-soft/50 border border-primary/20 rounded-field p-2.5 font-bold leading-normal">
                        💡 Mentor có thể nhập bất cứ khung giờ dạy mong muốn nào (Ví dụ: 10:00 - 12:00, 14:00 - 16:00,...), miễn là nằm trong khoảng từ 09:00 sáng đến 21:00 tối.
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Ghi chú lịch rảnh</label>
                        <input
                          type="text"
                          placeholder="VD: Rảnh buổi tối sau giờ làm"
                          value={ruleNote}
                          onChange={(e) => setRuleNote(e.target.value)}
                          className="w-full bg-surface border border-line rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? 'Lưu cập nhật' : 'Xác nhận tạo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Delete Course Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-danger" /> Xác nhận xóa lớp học
            </h3>
            <p className="text-body text-fg-muted mt-3 font-medium">
              Bạn có chắc chắn muốn xóa lớp học <strong>"{parseTitle(courseToDelete.title).cleanTitle}"</strong>? Hành động này không thể hoàn tác và tất cả lịch dạy liên quan sẽ bị ảnh hưởng.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCourseToDelete(null)}
                className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCourse}
                className="bg-danger hover:bg-danger-hover text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all"
              >
                Xóa lớp học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Hide Course Modal */}
      {courseToHide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-500" /> Xác nhận ẩn lớp học
            </h3>
            <p className="text-body text-fg-muted mt-3 font-medium">
              Bạn có chắc chắn muốn ẩn lớp học <strong>"{parseTitle(courseToHide.title).cleanTitle}"</strong>? Mentee sẽ không tìm thấy hoặc đặt lịch mới cho lớp này nữa.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCourseToHide(null)}
                className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={confirmHideCourse}
                className="bg-amber-500 hover:bg-amber-600 text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all"
              >
                Xác nhận ẩn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Rule Modal */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-danger" /> Xác nhận xóa lịch rảnh
            </h3>
            <p className="text-body text-fg-muted mt-3 font-medium">
              Bạn có chắc chắn muốn xóa lịch rảnh dạy từ <strong>{ruleToDelete.startTime}</strong> đến <strong>{ruleToDelete.endTime}</strong>?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRuleToDelete(null)}
                className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteRule}
                className="bg-danger hover:bg-danger-hover text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all"
              >
                Xóa lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {ruleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="flex justify-between items-center border-b border-line-soft pb-3">
              <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" /> Chỉnh sửa lịch rảnh khả dụng
              </h3>
              <button
                onClick={() => setRuleToEdit(null)}
                className="p-1 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRule} className="py-4 space-y-4">
              {/* Days checkbox group */}
              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-2">Thứ trong tuần</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => {
                    const checked = editRuleDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleEditDaySelection(day.value)}
                        className={`px-4 py-2 text-meta font-bold border rounded-field transition-all cursor-pointer ${
                          checked 
                            ? 'bg-primary text-white border-primary shadow-xs' 
                            : 'bg-surface text-fg border-line hover:bg-surface-muted/40'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {editRuleErrors.days && <p className="text-meta text-danger font-semibold mt-1">{editRuleErrors.days}</p>}
              </div>

              {/* Time selection group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ bắt đầu rảnh (từ 09:00) <span className="text-danger">*</span></label>
                  <input
                    type="time"
                    required
                    min="09:00"
                    max="21:00"
                    value={editRuleStartTime}
                    onChange={(e) => { setEditRuleStartTime(e.target.value); if(editRuleErrors.startTime) setEditRuleErrors({...editRuleErrors, startTime: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                      editRuleErrors.startTime ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                  />
                  {editRuleErrors.startTime && <p className="text-meta text-danger font-semibold mt-1">{editRuleErrors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ kết thúc rảnh (đến 21:00) <span className="text-danger">*</span></label>
                  <input
                    type="time"
                    required
                    min="09:00"
                    max="21:00"
                    value={editRuleEndTime}
                    onChange={(e) => { setEditRuleEndTime(e.target.value); if(editRuleErrors.endTime) setEditRuleErrors({...editRuleErrors, endTime: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                      editRuleErrors.endTime ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                  />
                  {editRuleErrors.endTime && <p className="text-meta text-danger font-semibold mt-1">{editRuleErrors.endTime}</p>}
                </div>
              </div>

              <div className="text-[10px] text-primary bg-primary-soft/50 border border-primary/20 rounded-field p-2.5 font-bold leading-normal text-left">
                💡 Mentor có thể nhập bất cứ khung giờ dạy mong muốn nào (Ví dụ: 10:00 - 12:00, 14:00 - 16:00,...), miễn là nằm trong khoảng từ 09:00 sáng đến 21:00 tối.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Ghi chú lịch rảnh</label>
                <input
                  type="text"
                  placeholder="VD: Rảnh buổi tối sau giờ làm"
                  value={editRuleNote}
                  onChange={(e) => setEditRuleNote(e.target.value)}
                  className="w-full bg-surface border border-line rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setRuleToEdit(null)}
                  className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Rule Modal has been removed */}

    </div>
  );
};
