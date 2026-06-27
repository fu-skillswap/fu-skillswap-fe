import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, Search, Pencil, Trash2, 
  X, CheckCircle2, AlertTriangle, 
  BookOpenCheck, ToggleLeft, ToggleRight,
  Calendar, Loader2
} from 'lucide-react';
import { helpTopicApi } from '../../api/mentorProfile';
import { mentorServicesApi } from '../../api/mentorServices';
import { availabilityApi } from '../../api/availability';
import type { 
  HelpTopic, MentorServiceItem, AvailabilityRule, AvailabilityRuleType, AvailabilityRepeatType, UpsertAvailabilityRulePayload 
} from '../../api/types';

// Fallback topics if helpTopicApi fails to load
const DEFAULT_TOPICS: HelpTopic[] = [
  { id: '1', nameVi: 'Lập trình Web', nameEn: 'Web Development' },
  { id: '2', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence' },
  { id: '3', nameVi: 'Kỹ nghệ phần mềm', nameEn: 'Software Engineering' },
  { id: '4', nameVi: 'UI/UX & Graphics', nameEn: 'UI/UX & Graphics' },
  { id: '5', nameVi: 'An toàn thông tin', nameEn: 'Information Security' },
  { id: '6', nameVi: 'Kinh tế & Marketing', nameEn: 'Business & Marketing' },
];



// Helpers to unpack/pack fields inside backend fields to support design elements
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

const serializeDescriptionAndOutcomes = (desc: string, outcomes: string[]) => {
  if (outcomes.length === 0) return desc;
  return `${desc}\n\n=== OUTCOMES ===\n${outcomes.join('\n')}`;
};

const deserializeDescriptionAndOutcomes = (fullDesc: string = '') => {
  const parts = fullDesc.split('\n\n=== OUTCOMES ===\n');
  if (parts.length > 1) {
    return {
      description: parts[0],
      outcomes: parts[1].split('\n').filter(Boolean)
    };
  }
  return {
    description: fullDesc,
    outcomes: []
  };
};
const WEEKDAYS: { value: string; label: string }[] = [
  { value: 'MONDAY', label: 'T2' },
  { value: 'TUESDAY', label: 'T3' },
  { value: 'WEDNESDAY', label: 'T4' },
  { value: 'THURSDAY', label: 'T5' },
  { value: 'FRIDAY', label: 'T6' },
  { value: 'SATURDAY', label: 'T7' },
  { value: 'SUNDAY', label: 'CN' },
];

const DAY_LABEL: Record<string, string> = Object.fromEntries(WEEKDAYS.map((d) => [d.value, d.label]));

const REPEAT_LABEL: Record<AvailabilityRepeatType, string> = {
  NONE: 'Một ngày cụ thể',
  DAILY: 'Hằng ngày',
  WEEKLY: 'Theo thứ trong tuần',
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

const friendlyError = (msg: string): string => {
  if (!msg) return 'Có lỗi xảy ra khi lưu lịch rảnh.';
  const lower = msg.toLowerCase();
  
  if (lower.includes('overlap') || lower.includes('conflict') || lower.includes('chồng lấn') || lower.includes('trùng')) {
    return 'Khung giờ này đã bị trùng lặp hoặc chồng chéo với một quy tắc lịch rảnh khác của bạn. Vui lòng chọn thời gian khác hoặc kiểm tra lại các quy tắc đã tạo.';
  }
  
  if (lower.includes('serviceid') || lower.includes('service_id')) {
    return 'Vui lòng chọn khóa học áp dụng cho quy tắc lịch rảnh này (đây là thông tin bắt buộc để học viên có thể đặt lịch đúng lớp).';
  }
  if (lower.includes('ruletype') || lower.includes('rule_type')) {
    return 'Vui lòng chọn loại quy tắc (Mở lịch rảnh để học viên đặt, hoặc Chặn lịch để đánh dấu bận/nghỉ).';
  }
  if (lower.includes('repeattype') || lower.includes('repeat_type')) {
    return 'Vui lòng chọn kiểu lặp lại lịch (Lặp theo thứ hàng tuần, Hằng ngày, hoặc Một ngày cụ thể).';
  }
  if (lower.includes('starttime') || lower.includes('start_time')) {
    return 'Vui lòng nhập giờ bắt đầu hợp lệ cho khung giờ rảnh.';
  }
  if (lower.includes('endtime') || lower.includes('end_time')) {
    return 'Vui lòng nhập giờ kết thúc hợp lệ cho khung giờ rảnh.';
  }
  if (lower.includes('effectivefrom') || lower.includes('effective_from')) {
    return 'Vui lòng chọn ngày bắt đầu áp dụng quy tắc lịch rảnh này.';
  }
  if (lower.includes('effectiveto') || lower.includes('effective_to')) {
    return 'Vui lòng chọn ngày kết thúc áp dụng quy tắc lịch rảnh này.';
  }
  if (lower.includes('daysofweek') || lower.includes('days_of_week') || lower.includes('days of week')) {
    return 'Vui lòng chọn ít nhất một thứ trong tuần (T2 - CN) để áp dụng quy tắc lặp lại.';
  }
  if (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('token') || lower.includes('hết hạn')) {
    return 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (lower.includes('service not found') || lower.includes('khóa học không tồn tại')) {
    return 'Khóa học được chọn không tồn tại hoặc đã bị xóa. Vui lòng tải lại trang và chọn khóa học khác.';
  }
  if (lower.includes('rule not found') || lower.includes('không tìm thấy quy tắc')) {
    return 'Quy tắc lịch rảnh này không tồn tại hoặc đã bị xóa trước đó. Vui lòng làm mới trang.';
  }
  return msg;
};

const getWeekDays = (offsetWeeks: number = 0) => {
  const current = new Date();
  const day = current.getDay();
  const distance = (day === 0 ? -6 : 1) - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distance + (offsetWeeks * 7));
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

const formatDateISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MentorServiceItem[]>([]);
  const [topics, setTopics] = useState<HelpTopic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const selectedTopic: string = 'all';
  const selectedStatus: string = 'active';

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [topicId, setTopicId] = useState('');
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [description, setDescription] = useState('');
  const [outcomesText, setOutcomesText] = useState(''); // newline separated
  const [isFree, setIsFree] = useState(true);
  const [priceAmount, setPriceAmount] = useState<number>(0);

  // Validation & Notifications
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  // Confirmation Delete Modal
  const [courseToDelete, setCourseToDelete] = useState<MentorServiceItem | null>(null);

  // Availability Slots states
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [slotBusy, setSlotBusy] = useState(false);
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = this week, 1 = next week

  // Slot creation/editing form states
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [ruleType, setRuleType] = useState<AvailabilityRuleType>('OPEN');
  const [slotServiceId, setSlotServiceId] = useState('');
  const [repeatType, setRepeatType] = useState<AvailabilityRepeatType>('WEEKLY');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotNote, setSlotNote] = useState('');

  // Confirmation Delete Modal for Slots
  const [slotToDelete, setSlotToDelete] = useState<AvailabilityRule | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [srvList, slotList] = await Promise.all([
        mentorServicesApi.list(),
        availabilityApi.list()
      ]);
      setCourses(srvList || []);
      setRules(slotList || []);
      
      const activeServices = (srvList ?? []).filter(s => s.active);
      if (activeServices.length > 0) {
        setSlotServiceId(prev => prev || activeServices[0].serviceId);
      }
    } catch (err: any) {
      console.error('Không tải được dữ liệu:', err);
      showAlert('danger', 'Không thể đồng bộ danh sách khóa học và lịch rảnh từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load topics from API
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
    loadData();
  }, [loadData]);

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

  const showAlert = (type: 'success' | 'danger', text: string) => {
    triggerToast(text, type);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Vui lòng nhập tên khóa học.';
    if (!subjectCode.trim()) newErrors.subjectCode = 'Vui lòng nhập mã môn học.';
    if (!topicId) newErrors.topicId = 'Vui lòng chọn chủ đề.';
    if (!description.trim()) newErrors.description = 'Vui lòng nhập mô tả khóa học.';
    if (!isFree && priceAmount <= 0) newErrors.priceAmount = 'Vui lòng nhập số Point lớn hơn 0.';
    
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
    setPriceAmount(0);
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (course: MentorServiceItem) => {
    setIsEditing(true);
    setCurrentServiceId(course.serviceId);
    
    const { subjectCode: sCode, cleanTitle } = parseTitle(course.title);
    const { description: cleanDesc, outcomes } = deserializeDescriptionAndOutcomes(course.description);
    
    setTitle(cleanTitle);
    setSubjectCode(sCode);
    setTopicId(course.helpTopics && course.helpTopics.length > 0 ? course.helpTopics[0].id : topics[0]?.id || '');
    setSessionDuration(course.durationMinutes);
    setDescription(cleanDesc);
    setOutcomesText(outcomes.join('\n'));
    setIsFree(course.free !== undefined ? course.free : (course as any).isFree);
    setPriceAmount(course.priceAmount || 0);
    setErrors({});
    setShowModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const outcomes = outcomesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const fullDescription = serializeDescriptionAndOutcomes(description.trim(), outcomes);
    const fullTitle = `[${subjectCode.trim().toUpperCase()}] ${title.trim()}`;

    const payload = {
      title: fullTitle,
      description: fullDescription,
      durationMinutes: sessionDuration,
      isFree: isFree,
      priceAmount: isFree ? 0 : priceAmount,
      helpTopicIds: [topicId],
    };

    setLoading(true);
    try {
      if (isEditing && currentServiceId) {
        await mentorServicesApi.update(currentServiceId, payload);
        showAlert('success', 'Đã cập nhật thông tin khóa học thành công trên hệ thống');
      } else {
        await mentorServicesApi.create(payload);
        showAlert('success', 'Tạo khóa học mới trên máy chủ thành công!');
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Lưu khóa học thất bại:', err);
      const serverData = err?.response?.data;
      const detailMsg = serverData 
        ? (serverData.message || JSON.stringify(serverData)) 
        : 'Có lỗi xảy ra khi lưu khóa học.';
      showAlert('danger', detailMsg);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (course: MentorServiceItem) => {
    setLoading(true);
    try {
      const nextState = !course.active;
      await mentorServicesApi.toggleActive(course.serviceId, nextState);
      showAlert('success', `Đã ${nextState ? 'kích hoạt' : 'tạm dừng'} hiển thị khóa học: ${parseTitle(course.title).cleanTitle}`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      showAlert('danger', 'Thay đổi trạng thái thất bại.');
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    const deletedId = courseToDelete.serviceId;
    setLoading(true);
    try {
      await mentorServicesApi.delete(deletedId);
      showAlert('success', `Đã xóa khóa học "${parseTitle(courseToDelete.title).cleanTitle}" thành công.`);
      setCourseToDelete(null);
      setCourses(prev => prev.filter(c => c.serviceId !== deletedId));
      await loadData();
    } catch (err: any) {
      console.error(err);
      showAlert('danger', 'Không thể xóa khóa học này.');
      setCourseToDelete(null);
      setLoading(false);
    }
  };

  // Filtering Logic
  const filteredCourses = courses.filter(c => {
    const { subjectCode, cleanTitle } = parseTitle(c.title);
    const { description: cleanDesc } = deserializeDescriptionAndOutcomes(c.description);

    const matchesSearch = 
      cleanTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleanDesc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTopic = selectedTopic === 'all' || (c.helpTopics && c.helpTopics.some(t => t.id === selectedTopic));
    
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'active' && c.active) || 
      (selectedStatus === 'inactive' && !c.active);

    return matchesSearch && matchesTopic && matchesStatus;
  });

  const formatDateDisplay = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  };

  const getServiceDisplayTitle = (ruleServiceId?: string) => {
    if (!ruleServiceId) return '';
    const s = courses.find((x) => x.serviceId === ruleServiceId);
    if (!s) return `Khóa học (#${ruleServiceId.slice(0, 6)})`;
    const match = s.title.match(/^\[(.*?)\]\s*(.*)$/);
    return match ? `${match[1]} - ${match[2]}` : s.title;
  };

  const getRulesForDate = (date: Date) => {
    const dateStr = formatDateISO(date);
    const dayOfWeekIndex = date.getDay();
    const weekdaysMap: Record<number, string> = {
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
      0: 'SUNDAY'
    };
    const dayName = weekdaysMap[dayOfWeekIndex];
    
    return rules.filter(r => {
      if (r.effectiveFrom && dateStr < r.effectiveFrom) return false;
      if (r.effectiveTo && dateStr > r.effectiveTo) return false;
      
      if (r.repeatType === 'NONE') {
        return r.effectiveFrom === dateStr;
      }
      if (r.repeatType === 'DAILY') {
        return true;
      }
      if (r.repeatType === 'WEEKLY') {
        return r.daysOfWeek?.includes(dayName);
      }
      return false;
    }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const handleStartEditSlot = (r: AvailabilityRule) => {
    setEditingSlotId(r.ruleId);
    setRuleType(r.ruleType);
    setRepeatType(r.repeatType);
    setDaysOfWeek(r.daysOfWeek ?? []);
    setEffectiveFrom(r.effectiveFrom ?? '');
    setEffectiveTo(r.effectiveTo ?? '');
    setStartTime(r.startTime ? r.startTime.slice(0, 5) : '');
    setEndTime(r.endTime ? r.endTime.slice(0, 5) : '');
    setSlotNote(r.note ?? '');
    setSlotServiceId(r.serviceId || (courses.length > 0 ? courses[0].serviceId : ''));
    setShowSlotModal(true);
  };

  const handleOpenSlotCreateModal = () => {
    setEditingSlotId(null);
    setRuleType('OPEN');
    setRepeatType('WEEKLY');
    setDaysOfWeek([]);
    setEffectiveFrom(formatDateISO(new Date()));
    setEffectiveTo(formatDateISO(new Date()));
    setStartTime('08:00');
    setEndTime('10:00');
    setSlotNote('');
    setSlotServiceId(courses.length > 0 ? courses[0].serviceId : '');
    setShowSlotModal(true);
  };

  const handleCancelSlotEdit = () => {
    setShowSlotModal(false);
    setEditingSlotId(null);
    setRuleType('OPEN');
    setRepeatType('WEEKLY');
    setDaysOfWeek([]);
    setEffectiveFrom('');
    setEffectiveTo('');
    setStartTime('');
    setEndTime('');
    setSlotNote('');
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (startTime >= endTime) {
      triggerToast('Giờ bắt đầu phải trước giờ kết thúc.', 'danger');
      return;
    }
    if (!slotServiceId) {
      triggerToast('Vui lòng chọn khóa học áp dụng.', 'danger');
      return;
    }
    if (repeatType === 'WEEKLY' && daysOfWeek.length === 0) {
      triggerToast('Vui lòng chọn ít nhất một thứ trong tuần.', 'danger');
      return;
    }
    if (repeatType === 'NONE' && !effectiveFrom) {
      triggerToast('Vui lòng chọn ngày áp dụng.', 'danger');
      return;
    }
    
    if (effectiveFrom && effectiveTo && repeatType !== 'NONE') {
      const from = new Date(effectiveFrom);
      const to = new Date(effectiveTo);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 14) {
        triggerToast('Thời gian áp dụng khung giờ rảnh tối đa là 2 tuần (14 ngày).', 'danger');
        return;
      }
    }

    const payload: UpsertAvailabilityRulePayload = {
      ruleType,
      serviceId: slotServiceId,
      repeatType,
      daysOfWeek: repeatType === 'WEEKLY' ? daysOfWeek : undefined,
      effectiveFrom: effectiveFrom || undefined,
      effectiveTo: repeatType === 'NONE' ? (effectiveFrom || undefined) : (effectiveTo || undefined),
      startTime,
      endTime,
      note: slotNote || undefined,
    };

    setSlotBusy(true);
    try {
      if (editingSlotId) {
        await availabilityApi.update(editingSlotId, payload);
        triggerToast('Cập nhật khung giờ rảnh thành công!', 'success');
      } else {
        await availabilityApi.create(payload);
        triggerToast('Thêm khung giờ rảnh thành công!', 'success');
      }
      handleCancelSlotEdit();
      await loadData();
    } catch (err: any) {
      const serverMsg = getErrorMessage(err) || (editingSlotId ? 'Cập nhật khung giờ thất bại.' : 'Thêm khung giờ thất bại.');
      triggerToast(friendlyError(serverMsg), 'danger');
    } finally {
      setSlotBusy(false);
    }
  };

  const handleDeleteSlot = async (ruleId: string) => {
    setSlotBusy(true);
    try {
      await availabilityApi.remove(ruleId);
      triggerToast('Đã xoá quy tắc lịch rảnh.', 'success');
      if (editingSlotId === ruleId) {
        handleCancelSlotEdit();
      }
      await loadData();
    } catch (err: any) {
      const serverMsg = getErrorMessage(err) || 'Xoá khung giờ thất bại.';
      triggerToast(friendlyError(serverMsg), 'danger');
    } finally {
      setSlotBusy(false);
    }
  };

  const toggleDay = (value: string) => {
    setDaysOfWeek((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const describeRule = (r: AvailabilityRule) => {
    if (r.repeatType === 'WEEKLY' && r.daysOfWeek?.length) {
      return r.daysOfWeek.map((d) => DAY_LABEL[d] || d).join(', ');
    }
    if (r.repeatType === 'NONE') return r.effectiveFrom || 'Ngày cụ thể';
    return REPEAT_LABEL[r.repeatType];
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-fg tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Lịch biểu & Quản lý khóa học
          </h1>
          <p className="text-fg-muted text-body font-medium">
            Quản lý các khóa học và sắp xếp lịch rảnh khả dụng của bạn trực quan theo dạng tuần (tối đa trong vòng 2 tuần).
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" /> Tạo khóa học mới
          </button>
          
          <button
            onClick={handleOpenSlotCreateModal}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
          >
            <Calendar className="w-5 h-5" /> Thêm khung giờ rảnh
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg p-4 shadow-lg text-white w-96 transition-all duration-300 ease-in-out ${
            toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'
          } ${
            toast.type === 'success' 
              ? 'bg-status-approved' 
              : 'bg-status-rejected'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-sm leading-none mb-1 text-white">
              {toast.type === 'success' ? 'Thành công' : 'Thất bại'}
            </div>
            <div className="text-xs text-white/90 leading-tight break-words font-medium">{toast.message}</div>
          </div>
          <button
            onClick={() => setToastVisible(false)}
            className="text-white/80 hover:text-white shrink-0 focus:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Split Layout Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT SIDEBAR: Courses Management List */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="meetmind-card p-4 rounded-card space-y-4">
            <h3 className="text-base font-bold font-serif text-fg flex items-center gap-1.5 border-b border-line-soft pb-2">
              <BookOpenCheck className="w-5 h-5 text-primary" /> Khóa học của tôi
            </h3>
            
            {/* Simple Compact Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
              <input
                type="text"
                placeholder="Tìm khóa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-muted border border-line rounded-field py-2 pl-9 pr-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-medium"
              />
            </div>

            {/* Courses list */}
            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredCourses.length === 0 ? (
              <div className="py-8 text-center text-meta text-fg-muted font-semibold">
                Không tìm thấy khóa học nào.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredCourses.map(course => {
                  const { subjectCode, cleanTitle } = parseTitle(course.title);
                  return (
                    <div key={course.serviceId} className={`p-3 rounded-lg border transition-all ${course.active ? 'bg-surface border-line shadow-sm' : 'bg-surface-muted/50 border-line-soft opacity-70'}`}>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-extrabold text-primary bg-primary-soft px-1.5 py-0.5 rounded uppercase">
                          {subjectCode}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(course)}
                          className="text-fg-muted hover:text-primary transition-all cursor-pointer font-bold"
                          title={course.active ? "Tạm ẩn" : "Hiển thị"}
                        >
                          {course.active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-fg-faint" />}
                        </button>
                      </div>
                      
                      <h4
                        onClick={() => navigate(`/mentor/courses/${course.serviceId}`)}
                        className="text-meta font-bold text-fg line-clamp-1 mt-1.5 hover:text-primary cursor-pointer hover:underline"
                        title={cleanTitle}
                      >
                        {cleanTitle}
                      </h4>
                      
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-line-soft">
                        <span className="text-[10px] font-semibold text-fg-muted">
                          {course.durationMinutes} phút · {course.priceAmount || 0} P
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(course)}
                            className="p-1 text-fg-muted hover:text-primary hover:bg-primary-soft/40 rounded transition-all cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(course)}
                            className="p-1 text-fg-muted hover:text-danger hover:bg-danger/10 rounded transition-all cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Weekly Calendar View (Google Calendar Style) */}
        <div className="flex-1 w-full space-y-4">
          <div className="meetmind-card p-6 rounded-card space-y-4">
            
            {/* Week navigation control block */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-line-soft pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary shrink-0" />
                <div className="text-left">
                  <h3 className="text-base font-bold text-fg">Lịch rảnh khả dụng của tôi</h3>
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

            {/* Loading / Empty / Grid layout rendering */}
            {loading ? (
              <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
                {getWeekDays(weekOffset).map((dayDate, idx) => {
                  const dayName = WEEKDAYS[idx].label;
                  const dateStr = formatDateISO(dayDate);
                  const isToday = formatDateISO(new Date()) === dateStr;
                  const dayRules = getRulesForDate(dayDate);
                  
                  return (
                    <div key={idx} className={`rounded-xl border p-3 flex flex-col text-left min-h-[300px] transition-all ${isToday ? 'bg-primary-soft/10 border-primary/30' : 'bg-surface/30 border-line-soft'}`}>
                      {/* Day Header */}
                      <div className="text-center pb-2 border-b border-line-soft mb-2 shrink-0">
                        <span className={`text-[11px] font-extrabold block tracking-wide uppercase ${isToday ? 'text-primary' : 'text-fg-faint'}`}>
                          {dayName}
                        </span>
                        <span className={`text-title font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-full mt-1 ${isToday ? 'bg-primary text-white shadow-sm' : 'text-fg'}`}>
                          {dayDate.getDate()}
                        </span>
                      </div>
                      
                      {/* Day Slots List */}
                      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none pr-0.5">
                        {dayRules.length === 0 ? (
                          <div className="h-full flex items-center justify-center py-8">
                            <span className="text-[10px] text-fg-faint italic font-semibold text-center leading-tight">
                              Không có lịch
                            </span>
                          </div>
                        ) : (
                          dayRules.map(rule => {
                            const isSlotOpen = rule.ruleType === 'OPEN';
                            return (
                              <div
                                key={rule.ruleId}
                                className={`p-2.5 rounded-lg border text-left shadow-xs group/item relative transition-all ${isSlotOpen ? 'bg-green-50/70 border-green-200/60 hover:bg-green-100/70' : 'bg-red-50/70 border-red-200/60 hover:bg-red-100/70'}`}
                              >
                                <div className="text-[10px] font-bold text-fg flex items-center justify-between">
                                  <span>{rule.startTime?.slice(0, 5)} - {rule.endTime?.slice(0, 5)}</span>
                                  
                                  <span className={`text-[8px] font-extrabold px-1 rounded uppercase ${isSlotOpen ? 'bg-green-200/60 text-green-800' : 'bg-red-200/60 text-red-800'}`}>
                                    {isSlotOpen ? 'Mở' : 'Chặn'}
                                  </span>
                                </div>
                                
                                {rule.serviceId && (
                                  <p className="text-[11px] font-extrabold text-fg line-clamp-2 mt-1 leading-snug">
                                    {getServiceDisplayTitle(rule.serviceId)}
                                  </p>
                                )}
                                
                                {rule.note && (
                                  <p className="text-[9px] text-fg-muted italic font-medium mt-1 leading-tight break-words">
                                    "{rule.note}"
                                  </p>
                                )}
                                
                                <div className="absolute right-1 bottom-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex bg-white/90 border border-line-soft rounded shadow-xs p-0.5">
                                  <button
                                    onClick={() => handleStartEditSlot(rule)}
                                    className="p-0.5 text-fg-muted hover:text-primary transition-all cursor-pointer"
                                    title="Sửa lịch"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setSlotToDelete(rule)}
                                    className="p-0.5 text-fg-muted hover:text-danger transition-all cursor-pointer"
                                    title="Xóa lịch"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
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
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-card p-6 shadow-xl relative overflow-y-auto max-h-[90vh] text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-line-soft pb-3.5">
              <h3 className="text-lg font-extrabold text-fg flex items-center gap-2">
                <BookOpen className="w-5.5 h-5.5 text-primary" />
                {isEditing ? 'Cấu hình khóa học' : 'Thiết kế khóa học mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCourse} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Tên lớp học / khóa học <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if(errors.title) setErrors({...errors, title: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-semibold ${
                      errors.title ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                    placeholder="Ví dụ: Lập trình ReactJS nâng cao"
                  />
                  {errors.title && <p className="text-meta text-danger font-semibold mt-1">{errors.title}</p>}
                </div>

                {/* Subject Code */}
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Mã môn học <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => { setSubjectCode(e.target.value); if(errors.subjectCode) setErrors({...errors, subjectCode: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-bold uppercase ${
                      errors.subjectCode ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                    placeholder="Ví dụ: FER201M"
                  />
                  {errors.subjectCode && <p className="text-meta text-danger font-semibold mt-1">{errors.subjectCode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Topic / Category */}
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Chủ đề / Chuyên mục <span className="text-danger">*</span></label>
                  <select
                    value={topicId}
                    onChange={(e) => { setTopicId(e.target.value); if(errors.topicId) setErrors({...errors, topicId: ''}); }}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.nameVi}</option>
                    ))}
                  </select>
                </div>

                {/* Session Duration */}
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Thời lượng học (phút/buổi)</label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  >
                    <option value={15}>15 phút</option>
                    <option value={30}>30 phút</option>
                    <option value={45}>45 phút</option>
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút</option>
                    <option value={120}>120 phút</option>
                  </select>
                </div>

                {/* Free vs Point Select */}
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Chi phí buổi học</label>
                  <select
                    value={isFree ? 'free' : 'point'}
                    onChange={(e) => {
                      const val = e.target.value === 'free';
                      setIsFree(val);
                      if (val) setPriceAmount(0);
                    }}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  >
                    <option value="free">Miễn phí (Trao đổi chéo)</option>
                    <option value="point">Tính phí (Point)</option>
                  </select>
                </div>
              </div>

              {/* Point Amount (Conditional) */}
              {!isFree && (
                <div className="animate-fadeIn">
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Số Point yêu cầu cho buổi học <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={priceAmount}
                    onChange={(e) => { setPriceAmount(Number(e.target.value)); if(errors.priceAmount) setErrors({...errors, priceAmount: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                      errors.priceAmount ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                    placeholder="Nhập số Point (VD: 10)"
                  />
                  {errors.priceAmount && <p className="text-meta text-danger font-semibold mt-1">{errors.priceAmount}</p>}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Mô tả chi tiết khóa học <span className="text-danger">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); if(errors.description) setErrors({...errors, description: ''}); }}
                  className={`w-full bg-surface border rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium ${
                    errors.description ? 'border-danger/60 focus:border-danger' : 'border-line'
                  }`}
                  placeholder="Mô tả nội dung đào tạo chính, điều kiện tiên quyết và mục tiêu của lớp học này..."
                />
                  {errors.description && <p className="text-meta text-danger font-semibold mt-1">{errors.description}</p>}
              </div>

              {/* Learning Outcomes */}
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1 flex justify-between">
                  <span>Kết quả đầu ra đạt được</span>
                  <span className="text-fg-faint font-semibold normal-case">Mỗi dòng là một kết quả</span>
                </label>
                <textarea
                  rows={3}
                  value={outcomesText}
                  onChange={(e) => setOutcomesText(e.target.value)}
                  className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium"
                  placeholder="Ví dụ:&#13;Thành thạo xây dựng RESTful API&#13;Biết cách deploy ứng dụng lên AWS Cloud&#13;Hiểu sâu kiến trúc cơ sở dữ liệu"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-surface border border-line hover:bg-surface-muted text-fg text-body font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
                >
                  {isEditing ? 'Lưu thay đổi' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-danger">
                <AlertTriangle className="w-6.5 h-6.5" />
                <h3 className="text-lg font-extrabold">Xác nhận xóa khóa học</h3>
              </div>
              
              <p className="text-body text-fg-muted font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa khóa học <strong className="text-fg font-bold">"{parseTitle(courseToDelete.title).cleanTitle}"</strong> ({parseTitle(courseToDelete.title).subjectCode})? Hành động này không thể hoàn tác.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setCourseToDelete(null)}
                  className="bg-surface border border-line hover:bg-surface-muted text-fg text-body font-bold py-2 px-4.5 rounded-field cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="bg-danger text-white hover:bg-danger/90 text-body font-bold py-2 px-4.5 rounded-field cursor-pointer transition-all"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Availability Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 shadow-xl relative overflow-y-auto max-h-[90vh] text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-line-soft pb-3.5">
              <h3 className="text-lg font-extrabold text-fg flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-primary" />
                {editingSlotId ? 'Cấu hình khung giờ rảnh' : 'Thêm khung giờ rảnh mới'}
              </h3>
              <button
                onClick={handleCancelSlotEdit}
                className="p-1.5 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSlot} className="space-y-4 pt-4">
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Loại quy tắc</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as AvailabilityRuleType)}
                  className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                >
                  <option value="OPEN">Mở lịch rảnh (nhận đặt)</option>
                  <option value="CLOSED">Chặn lịch (không nhận đặt)</option>
                </select>
              </div>

              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Khóa học áp dụng</label>
                {courses.length === 0 ? (
                  <div className="text-meta text-danger font-semibold p-2.5 bg-danger/10 rounded-field border border-danger/20">
                    Bạn không có khóa học nào đang hoạt động. Vui lòng tạo khóa học trước.
                  </div>
                ) : (
                  <select
                    value={slotServiceId}
                    onChange={(e) => setSlotServiceId(e.target.value)}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  >
                    {courses.map((s) => {
                      const match = s.title.match(/^\[(.*?)\]\s*(.*)$/);
                      const displayTitle = match ? `${match[1]} - ${match[2]}` : s.title;
                      return (
                        <option key={s.serviceId} value={s.serviceId}>
                          {displayTitle}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Lặp lại</label>
                <select
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as AvailabilityRepeatType)}
                  className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                >
                  <option value="WEEKLY">Theo thứ trong tuần</option>
                  <option value="DAILY">Hằng ngày</option>
                  <option value="NONE">Một ngày cụ thể</option>
                </select>
              </div>

              {repeatType === 'WEEKLY' && (
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Các thứ áp dụng</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => {
                      const on = daysOfWeek.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={`text-meta font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${on ? 'bg-primary-soft text-primary border-primary/30' : 'bg-surface border-line text-fg-muted hover:bg-surface-muted'}`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {repeatType === 'NONE' && (
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Ngày áp dụng</label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  />
                </div>
              )}

              {(repeatType === 'WEEKLY' || repeatType === 'DAILY') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Đến ngày <span className="text-[10px] text-primary lowercase normal-case">(Tối đa 2 tuần)</span></label>
                    <input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                      className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Ghi chú (tuỳ chọn)</label>
                <input
                  type="text"
                  value={slotNote}
                  onChange={(e) => setSlotNote(e.target.value)}
                  placeholder="Ví dụ: Hỗ trợ làm đồ án tốt nghiệp"
                  className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-semibold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={handleCancelSlotEdit}
                  disabled={slotBusy}
                  className="bg-surface border border-line hover:bg-surface-muted text-fg text-body font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={slotBusy || courses.length === 0}
                  className="bg-primary hover:bg-primary-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {slotBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSlotId ? 'Cập nhật' : 'Thêm lịch rảnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Slots */}
      {slotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-danger">
                <AlertTriangle className="w-6.5 h-6.5" />
                <h3 className="text-lg font-extrabold text-brand-text">Xác nhận xóa khung giờ</h3>
              </div>
              
              <div className="text-body text-brand-text-muted font-medium leading-relaxed space-y-2">
                <p>Bạn có chắc chắn muốn xóa khung giờ rảnh này không?</p>
                <div className="p-3 bg-surface-muted rounded-lg text-xs font-semibold">
                  <p className="text-fg font-bold">
                    Khung giờ: {slotToDelete.startTime?.slice(0, 5)} - {slotToDelete.endTime?.slice(0, 5)}
                  </p>
                  <p>
                    Lặp lại: {REPEAT_LABEL[slotToDelete.repeatType]} · {describeRule(slotToDelete)}
                  </p>
                  {slotToDelete.note && <p>Ghi chú: {slotToDelete.note}</p>}
                </div>
                <p className="text-danger font-bold text-xs mt-1">Hành động này không thể hoàn tác.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setSlotToDelete(null)}
                  className="bg-surface border border-line hover:bg-surface-muted text-fg text-body font-bold py-2 px-4.5 rounded-field cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const id = slotToDelete.ruleId;
                    setSlotToDelete(null);
                    handleDeleteSlot(id);
                  }}
                  className="bg-danger text-white hover:bg-danger/90 text-body font-bold py-2 px-4.5 rounded-field cursor-pointer transition-all"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
