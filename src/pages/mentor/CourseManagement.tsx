import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Plus, Search, BookOpen, Pencil, Trash, 
  ToggleLeft, ToggleRight, AlertCircle, Loader2, X
} from 'lucide-react';
import { mentorServicesApi } from '../../api/mentorServices';
import { helpTopicApi } from '../../api/mentorProfile';
import { availabilityApi } from '../../api/availability';
import { mentorsApi } from '../../api/mentors';
import { useAuth } from '../../context/AuthContext';
import type { HelpTopic, MentorServiceItem, AvailabilityRule, MentorAvailabilitySlot } from '../../api/types';

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

const getLocalTimeStr = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getLocalWeekday = (iso: string) => {
  const d = new Date(iso);
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[d.getDay()];
};

export const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myUserId = user?.publicId || '';

  const [courses, setCourses] = useState<MentorServiceItem[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [topics, setTopics] = useState<HelpTopic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);
  const [loadingRules, setLoadingRules] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const selectedStatus = 'all';

  // Modal / Form state - Course Modal
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

  // Modal / Form state - Create Rule Modal
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [ruleDays, setRuleDays] = useState<string[]>([]);
  const [ruleStartTime, setRuleStartTime] = useState('09:00');
  const [ruleEndTime, setRuleEndTime] = useState('10:00');
  const [ruleNoteField, setRuleNoteField] = useState('');
  const [ruleServiceIds, setRuleServiceIds] = useState<string[]>([]);
  const [ruleErrors, setRuleErrors] = useState<Record<string, string>>({});
  const [ruleSubmitting, setRuleSubmitting] = useState(false);

  // Modal / Form state - Assign Slot Services Modal
  const [slotToAssign, setSlotToAssign] = useState<MentorAvailabilitySlot | null>(null);
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
  const [savingSlotServices, setSavingSlotServices] = useState(false);

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
  const [editRuleStartTime, setEditRuleStartTime] = useState('09:00');
  const [editRuleEndTime, setEditRuleEndTime] = useState('10:00');
  const [editRuleNote, setEditRuleNote] = useState('');
  const [editRuleServiceIds, setEditRuleServiceIds] = useState<string[]>([]);
  const [editRuleErrors, setEditRuleErrors] = useState<Record<string, string>>({});

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

  const fetchRulesAndSlots = async () => {
    if (!myUserId) return;
    setLoadingRules(true);
    try {
      const weekDays = getWeekDays(weekOffset);
      const fromDate = formatDateISO(weekDays[0]);
      const toDate = formatDateISO(weekDays[6]);

      const [rulesData, slotsData] = await Promise.all([
        availabilityApi.listRules().catch(() => [] as AvailabilityRule[]),
        mentorsApi.getAvailabilitySlots(myUserId, fromDate, toDate).catch(() => [] as MentorAvailabilitySlot[]),
      ]);
      setRules(rulesData || []);
      setSlots(slotsData || []);
    } catch (err: any) {
      console.error('Lấy danh sách luật và slot rảnh thất bại:', err);
      setRules([]);
      setSlots([]);
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
  }, []);

  useEffect(() => {
    fetchRulesAndSlots();
  }, [myUserId, weekOffset]);

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
      await fetchRulesAndSlots();
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
      const today = new Date();
      const endRange = new Date();
      endRange.setDate(today.getDate() + 30);
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
      
      await availabilityApi.updateRule(ruleToEdit.ruleId, payload);

      // Auto-assign course(s) selected in the edit rule modal
      if (editRuleServiceIds.length > 0) {
        try {
          const updatedSlots = await mentorsApi.getAvailabilitySlots(
            myUserId, 
            formatDateISO(today), 
            formatDateISO(endRange)
          ).catch(() => [] as MentorAvailabilitySlot[]);
          
          const ruleDaysSet = new Set(editRuleDays);
          const targetStart = formatTime(editRuleStartTime);
          const targetEnd = formatTime(editRuleEndTime);
          
          const matchedSlots = updatedSlots.filter(slot => {
            const slotStartStr = getLocalTimeStr(slot.startTime);
            const slotEndStr = getLocalTimeStr(slot.endTime);
            const slotWeekday = getLocalWeekday(slot.startTime);
            return ruleDaysSet.has(slotWeekday) && slotStartStr === targetStart && slotEndStr === targetEnd;
          });
          
          if (matchedSlots.length > 0) {
            await Promise.all(
              matchedSlots.map(slot => 
                availabilityApi.replaceSlotServices(slot.slotId, editRuleServiceIds).catch(err => {
                  console.error(`Failed to assign services to slot ${slot.slotId}:`, err);
                })
              )
            );
          }
        } catch (assignErr) {
          console.error('Failed to auto-assign edited rule services:', assignErr);
        }
      }

      triggerToast('Đã cập nhật lịch rảnh và gán lớp dạy thành công.', 'success');
      setRuleToEdit(null);
      await fetchRulesAndSlots();
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Cập nhật lịch rảnh thất bại.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setLoadingRules(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (ruleDays.length === 0) newErrors.days = 'Vui lòng chọn ít nhất một thứ trong tuần.';
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!ruleStartTime || !timeRegex.test(ruleStartTime)) {
      newErrors.startTime = 'Giờ bắt đầu không đúng định dạng HH:mm';
    } else if (ruleStartTime < '09:00' || ruleStartTime > '21:00') {
      newErrors.startTime = 'Giờ bắt đầu làm việc chỉ cho phép từ 09:00 đến 21:00';
    }
    
    if (!ruleEndTime || !timeRegex.test(ruleEndTime)) {
      newErrors.endTime = 'Giờ kết thúc không đúng định dạng HH:mm';
    } else if (ruleEndTime < '09:00' || ruleEndTime > '21:00') {
      newErrors.endTime = 'Giờ kết thúc làm việc chỉ cho phép từ 09:00 đến 21:00';
    }
    
    if (ruleStartTime && ruleEndTime && ruleStartTime >= ruleEndTime) {
      newErrors.endTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
    }

    if (Object.keys(newErrors).length > 0) {
      setRuleErrors(newErrors);
      return;
    }

    setRuleSubmitting(true);
    try {
      const today = new Date();
      const endRange = new Date();
      endRange.setDate(today.getDate() + 30); // Active for 30 days

      const formatTime = (t: string) => t.slice(0, 5);
      
      const payload = {
        ruleType: 'OPEN' as const,
        repeatType: 'WEEKLY' as const,
        daysOfWeek: ruleDays as any,
        effectiveFrom: formatDateISO(today),
        effectiveTo: formatDateISO(endRange),
        startTime: formatTime(ruleStartTime),
        endTime: formatTime(ruleEndTime),
        note: ruleNoteField.trim() || 'Lịch khả dụng',
      };

      await availabilityApi.createRule(payload);

      // Auto-assign course(s) selected in the repeating rule modal
      if (ruleServiceIds.length > 0) {
        try {
          const updatedSlots = await mentorsApi.getAvailabilitySlots(
            myUserId, 
            formatDateISO(today), 
            formatDateISO(endRange)
          ).catch(() => [] as MentorAvailabilitySlot[]);
          
          const ruleDaysSet = new Set(ruleDays);
          const targetStart = formatTime(ruleStartTime);
          const targetEnd = formatTime(ruleEndTime);
          
          const matchedSlots = updatedSlots.filter(slot => {
            const slotStartStr = getLocalTimeStr(slot.startTime);
            const slotEndStr = getLocalTimeStr(slot.endTime);
            const slotWeekday = getLocalWeekday(slot.startTime);
            return ruleDaysSet.has(slotWeekday) && slotStartStr === targetStart && slotEndStr === targetEnd;
          });
          
          if (matchedSlots.length > 0) {
            await Promise.all(
              matchedSlots.map(slot => 
                availabilityApi.replaceSlotServices(slot.slotId, ruleServiceIds).catch(err => {
                  console.error(`Failed to assign services to slot ${slot.slotId}:`, err);
                })
              )
            );
          }
        } catch (assignErr) {
          console.error('Failed to auto-assign rule services:', assignErr);
        }
      }

      triggerToast('Đã thiết lập lịch rảnh và gán lớp dạy thành công.', 'success');
      setShowCreateRuleModal(false);
      setRuleDays([]);
      setRuleStartTime('09:00');
      setRuleEndTime('10:00');
      setRuleNoteField('');
      setRuleServiceIds([]);
      setRuleErrors({});
      await fetchRulesAndSlots();
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Không thể lưu lịch rảnh.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleSaveSlotServices = async () => {
    if (!slotToAssign) return;
    setSavingSlotServices(true);
    try {
      await availabilityApi.replaceSlotServices(slotToAssign.slotId, assignedServiceIds);
      triggerToast('Đã gán lớp học vào khung giờ thành công.', 'success');
      setSlotToAssign(null);
      await fetchRulesAndSlots();
    } catch (err: any) {
      console.error(err);
      const detailMsg = getErrorMessage(err) || 'Gán lớp học thất bại.';
      triggerToast(detailMsg, 'danger');
    } finally {
      setSavingSlotServices(false);
    }
  };

  const toggleEditDaySelection = (dayValue: string) => {
    setEditRuleDays(prev => 
      prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
    );
  };

  const getLocalDateStr = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getSlotsForDay = (dayDate: Date) => {
    const dateStr = formatDateISO(dayDate);
    return slots.filter(s => getLocalDateStr(s.startTime) === dateStr);
  };

  const handleOpenAssignModal = (slot: MentorAvailabilitySlot) => {
    setSlotToAssign(slot);
    const currentServices = slot.services || [];
    setAssignedServiceIds(currentServices.map(s => s.serviceId));
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
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 border-b border-line-soft pb-4">
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
              
              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRuleDays([]);
                    setRuleStartTime('09:00');
                    setRuleEndTime('10:00');
                    setRuleNoteField('');
                    setRuleErrors({});
                    setShowCreateRuleModal(true);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-1.5 px-3 rounded-field cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm khung giờ dạy khả dụng
                </button>

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
                  <div className="flex-1 grid grid-cols-7 divide-x divide-line text-center py-2.5">
                    {getWeekDays(weekOffset).map((dayDate, idx) => {
                      const dateStr = formatDateISO(dayDate);
                      const isToday = formatDateISO(new Date()) === dateStr;
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">
                            {WEEKDAYS[idx].label}
                          </span>
                          <span className={`text-[13px] font-black w-6 h-6 flex items-center justify-center rounded-full mt-0.5 ${
                            isToday ? 'bg-primary text-white' : 'text-fg'
                          }`}>
                            {dayDate.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Grid Body Area (Scrollable Timeline Grid) */}
                <div className="flex relative overflow-y-auto" style={{ maxHeight: '600px' }}>
                  
                  {/* Time Sidebar grid indicators */}
                  <div className="w-14 border-r border-line bg-surface-muted/10 select-none flex flex-col shrink-0" style={{ height: '600px' }}>
                    {Array.from({ length: 21 - 9 }).map((_, idx) => {
                      const hourNum = 9 + idx;
                      const displayHour = hourNum <= 12 ? `${hourNum} AM` : `${hourNum - 12} PM`;
                      return (
                        <div
                          key={idx}
                          className="text-[9px] font-bold text-fg-muted/65 text-center flex items-start justify-center pt-1"
                          style={{
                            height: '50px',
                            borderBottom: '1px solid var(--color-line-soft)'
                          }}
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
                        const daySlots = getSlotsForDay(dayDate);
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
                            {daySlots.map((slot) => {
                              // Calculate position
                              const START_HOUR = 9;
                              const END_HOUR = 21;
                              const HOUR_HEIGHT = 50;

                              const parseTimeToDecimal = (timeStr: string): number => {
                                if (!timeStr) return START_HOUR;
                                const d = new Date(timeStr);
                                return d.getHours() + d.getMinutes() / 60;
                              };

                              const startDec = Math.max(START_HOUR, Math.min(END_HOUR, parseTimeToDecimal(slot.startTime)));
                              const endDec = Math.max(START_HOUR, Math.min(END_HOUR, parseTimeToDecimal(slot.endTime)));
                              
                              const top = (startDec - START_HOUR) * HOUR_HEIGHT;
                              const height = Math.max(35, (endDec - startDec) * HOUR_HEIGHT); // Min height 35px

                              const formatLocalTime = (iso: string) => {
                                const d = new Date(iso);
                                return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
                              };

                              const slotServices = slot.services || [];

                              return (
                                <div
                                  key={slot.slotId}
                                  onClick={() => handleOpenAssignModal(slot)}
                                  className="absolute left-1 right-1 rounded-md border border-primary/20 bg-primary-soft/85 hover:bg-primary-soft shadow-xs p-1.5 overflow-hidden group/rule transition-all hover:z-10 hover:shadow-md text-left cursor-pointer"
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`
                                  }}
                                >
                                  {/* Time & status */}
                                  <div className="flex items-center justify-between text-[9px] font-extrabold text-primary leading-tight">
                                    <span className="truncate">
                                      {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
                                    </span>
                                    
                                    <span className={`text-[8px] px-1 rounded-sm ${
                                      slotServices.length > 0 ? 'bg-success/15 text-success' : 'bg-fg-muted/15 text-fg-muted font-bold'
                                    }`}>
                                      {slotServices.length > 0 ? `${slotServices.length} lớp` : 'Chưa gán'}
                                    </span>
                                  </div>
                                  
                                  {/* Assigned Courses Badges */}
                                  <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[calc(100%-14px)] scrollbar-thin">
                                    {slotServices.length > 0 ? (
                                      slotServices.map(srv => {
                                        const { subjectCode, cleanTitle } = parseTitle(srv.title);
                                        return (
                                          <div 
                                            key={srv.serviceId} 
                                            className="text-[9px] font-bold bg-white/70 text-fg rounded px-1 py-0.5 border border-line-soft truncate"
                                            title={cleanTitle}
                                          >
                                            <span className="text-primary font-extrabold mr-1">[{subjectCode}]</span>
                                            {cleanTitle}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="text-[9px] font-medium text-fg-muted italic">
                                        Click để gán lớp dạy
                                      </div>
                                    )}
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

            {/* List of Repeating Rules to allow deletion */}
            <div className="border-t border-line-soft pt-4 mt-6 text-left">
              <h4 className="text-sm font-bold text-fg mb-3 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-primary" /> Khung giờ rảnh lặp lại đã thiết lập
              </h4>
              
              {rules.length === 0 ? (
                <p className="text-meta text-fg-muted italic">Chưa thiết lập khung giờ lặp lại nào. Nhấp "+ Thiết lập lịch rảnh lặp lại" ở trên để tạo.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {rules.map(rule => {
                    const formatRuleDays = (days?: string[]) => {
                      if (!days || days.length === 0) return '';
                      return days.map(d => {
                        const found = WEEKDAYS.find(w => w.value === d);
                        return found ? found.label : d;
                      }).join(', ');
                    };
                    
                    return (
                      <div 
                        key={rule.ruleId} 
                        className="p-3 border border-line rounded-lg bg-surface-muted/30 flex items-center justify-between gap-3 group/rule-item"
                      >
                        <div className="text-left leading-snug">
                          <div className="text-meta font-extrabold text-fg flex items-center gap-1.5">
                            <span className="text-primary">{rule.startTime} - {rule.endTime}</span>
                            <span className="text-fg-muted font-normal">•</span>
                            <span className="text-fg">{formatRuleDays(rule.daysOfWeek)}</span>
                          </div>
                          <div className="text-[10px] text-fg-muted font-bold mt-1">
                            Hiệu lực từ {new Date(rule.effectiveFrom).toLocaleDateString('vi-VN')}
                            {rule.note && ` (${rule.note})`}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {savingRuleId === rule.ruleId ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRuleModal(rule)}
                                className="p-1.5 text-fg-muted hover:text-primary hover:bg-primary-soft rounded-md transition-all opacity-60 hover:opacity-100 cursor-pointer"
                                title="Sửa lịch rảnh"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRuleToDelete(rule)}
                                className="p-1.5 text-fg-muted hover:text-danger hover:bg-danger-soft rounded-md transition-all opacity-60 hover:opacity-100 cursor-pointer"
                                title="Xóa lịch rảnh"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </>
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
              
              <div className="space-y-4 text-left">
                  
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
                <Calendar className="w-6 h-6 text-primary" /> Chỉnh sửa khung giờ dạy khả dụng
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
                  <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ bắt đầu dạy (từ 09:00) <span className="text-danger">*</span></label>
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
                  <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ kết thúc dạy (đến 21:00) <span className="text-danger">*</span></label>
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

              {/* Courses list checkbox group */}
              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-2">
                  Môn học áp dụng trong khung giờ này <span className="text-danger">*</span>
                </label>
                {courses.length === 0 ? (
                  <p className="text-meta text-fg-muted italic">Bạn chưa tạo lớp học nào. Hãy lưu lịch này sau khi đã tạo lớp học ở danh sách bên trái.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-line rounded-lg p-2.5 scrollbar-thin">
                    {courses.map(srv => {
                      const checked = editRuleServiceIds.includes(srv.serviceId);
                      const { subjectCode, cleanTitle } = parseTitle(srv.title);
                      return (
                        <label 
                          key={srv.serviceId}
                          className={`flex items-center gap-2.5 p-2 rounded-md border cursor-pointer select-none transition-all ${
                            checked 
                              ? 'bg-primary-soft/30 border-primary text-fg font-bold' 
                              : 'bg-surface border-line hover:bg-surface-muted/40 text-fg-muted font-bold'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setEditRuleServiceIds(prev => 
                                prev.includes(srv.serviceId) 
                                  ? prev.filter(id => id !== srv.serviceId) 
                                  : [...prev, srv.serviceId]
                              );
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-opacity-20 cursor-pointer shadow-xs"
                          />
                          <div className="text-left font-bold text-meta leading-tight">
                            <span className="text-primary font-black uppercase mr-1">[{subjectCode}]</span>
                            {cleanTitle}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Ghi chú lịch dạy</label>
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

      {/* Create Rule Modal */}
      {showCreateRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="flex justify-between items-center border-b border-line-soft pb-3">
              <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" /> Thêm khung giờ dạy khả dụng
              </h3>
              <button
                onClick={() => setShowCreateRuleModal(false)}
                className="p-1 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="py-4 space-y-4">
              {/* Days checkbox group */}
              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-2">Thứ trong tuần</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => {
                    const checked = ruleDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setRuleDays(prev => prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value])}
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
                {ruleErrors.days && <p className="text-meta text-danger font-semibold mt-1">{ruleErrors.days}</p>}
              </div>

              {/* Time selection group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ bắt đầu dạy (từ 09:00) <span className="text-danger">*</span></label>
                  <input
                    type="time"
                    required
                    min="09:00"
                    max="21:00"
                    value={ruleStartTime}
                    onChange={(e) => { setRuleStartTime(e.target.value); if(ruleErrors.startTime) setRuleErrors({...ruleErrors, startTime: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                      ruleErrors.startTime ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                  />
                  {ruleErrors.startTime && <p className="text-meta text-danger font-semibold mt-1">{ruleErrors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Giờ kết thúc dạy (đến 21:00) <span className="text-danger">*</span></label>
                  <input
                    type="time"
                    required
                    min="09:00"
                    max="21:00"
                    value={ruleEndTime}
                    onChange={(e) => { setRuleEndTime(e.target.value); if(ruleErrors.endTime) setRuleErrors({...ruleErrors, endTime: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                      ruleErrors.endTime ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                  />
                  {ruleErrors.endTime && <p className="text-meta text-danger font-semibold mt-1">{ruleErrors.endTime}</p>}
                </div>
              </div>

              <div className="text-[10px] text-primary bg-primary-soft/50 border border-primary/20 rounded-field p-2.5 font-bold leading-normal text-left">
                💡 Mentor có thể nhập bất cứ khung giờ dạy mong muốn nào (Ví dụ: 10:00 - 12:00, 14:00 - 16:00,...), miễn là nằm trong khoảng từ 09:00 sáng đến 21:00 tối.
              </div>

              {/* Courses list checkbox group */}
              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-2">
                  Môn học áp dụng trong khung giờ này <span className="text-danger">*</span>
                </label>
                {courses.length === 0 ? (
                  <p className="text-meta text-fg-muted italic">Bạn chưa tạo lớp học nào. Hãy lưu lịch này sau khi đã tạo lớp học ở danh sách bên trái.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-line rounded-lg p-2.5 scrollbar-thin">
                    {courses.map(srv => {
                      const checked = ruleServiceIds.includes(srv.serviceId);
                      const { subjectCode, cleanTitle } = parseTitle(srv.title);
                      return (
                        <label 
                          key={srv.serviceId}
                          className={`flex items-center gap-2.5 p-2 rounded-md border cursor-pointer select-none transition-all ${
                            checked 
                              ? 'bg-primary-soft/30 border-primary text-fg font-bold' 
                              : 'bg-surface border-line hover:bg-surface-muted/40 text-fg-muted font-bold'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setRuleServiceIds(prev => 
                                prev.includes(srv.serviceId) 
                                  ? prev.filter(id => id !== srv.serviceId) 
                                  : [...prev, srv.serviceId]
                              );
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-opacity-20 cursor-pointer shadow-xs"
                          />
                          <div className="text-left font-bold text-meta leading-tight">
                            <span className="text-primary font-black uppercase mr-1">[{subjectCode}]</span>
                            {cleanTitle}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-1.5">Ghi chú lịch dạy</label>
                <input
                  type="text"
                  placeholder="VD: Rảnh buổi tối sau giờ làm"
                  value={ruleNoteField}
                  onChange={(e) => setRuleNoteField(e.target.value)}
                  className="w-full bg-surface border border-line rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowCreateRuleModal(false)}
                  className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={ruleSubmitting}
                  className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
                >
                  {ruleSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu thiết lập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Course to Slot Modal */}
      {slotToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="flex justify-between items-center border-b border-line-soft pb-3">
              <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" /> Gán lớp dạy vào khung giờ
              </h3>
              <button
                onClick={() => setSlotToAssign(null)}
                className="p-1 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-surface-muted/50 rounded-lg p-3 text-meta font-bold text-fg border border-line-soft space-y-1">
                <div className="flex justify-between">
                  <span className="text-fg-muted">Thời gian:</span>
                  <span>
                    {(() => {
                      const dStart = new Date(slotToAssign.startTime);
                      const dEnd = new Date(slotToAssign.endTime);
                      const dateStr = dStart.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                      const timeStr = `${dStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${dEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                      return `${dateStr} (${timeStr})`;
                    })()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-fg-muted uppercase mb-2">
                  Danh sách lớp học dạy trong khung giờ này
                </label>
                
                {courses.length === 0 ? (
                  <p className="text-meta text-fg-muted italic">Bạn chưa tạo lớp học nào. Hãy đóng modal này và tạo lớp học mới ở danh sách bên trái trước.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 border border-line rounded-lg p-3 scrollbar-thin">
                    {courses.map(srv => {
                      const checked = assignedServiceIds.includes(srv.serviceId);
                      const { subjectCode, cleanTitle } = parseTitle(srv.title);
                      return (
                        <label 
                          key={srv.serviceId}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                            checked 
                              ? 'bg-primary-soft/30 border-primary text-fg font-bold' 
                              : 'bg-surface border-line hover:bg-surface-muted/40 text-fg-muted font-bold'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setAssignedServiceIds(prev => 
                                prev.includes(srv.serviceId) 
                                  ? prev.filter(id => id !== srv.serviceId) 
                                  : [...prev, srv.serviceId]
                              );
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-opacity-20 cursor-pointer shadow-xs"
                          />
                          <div className="text-left font-bold text-meta leading-tight">
                            <span className="text-primary font-black uppercase mr-1">[{subjectCode}]</span>
                            {cleanTitle}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
              <button
                type="button"
                onClick={() => setSlotToAssign(null)}
                className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98]"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSlotServices}
                disabled={savingSlotServices}
                className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
              >
                {savingSlotServices && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
