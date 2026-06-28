import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, Search, Filter, Pencil, Trash2, 
  X, CheckCircle2, AlertTriangle, 
  Clock, BookOpenCheck, ToggleLeft, ToggleRight,
  Coins, Sparkles
} from 'lucide-react';
import { helpTopicApi } from '../../api/mentorProfile';
import { mentorServicesApi } from '../../api/mentorServices';
import type { HelpTopic, MentorServiceItem } from '../../api/types';

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

export const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MentorServiceItem[]>([]);
  const [topics, setTopics] = useState<HelpTopic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');

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
  const [priceScoin, setPriceScoin] = useState<number>(0);

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

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await mentorServicesApi.list();
      setCourses(data || []);
    } catch (err: any) {
      console.error('Lấy danh sách dịch vụ thất bại:', err);
      showAlert('danger', 'Không thể đồng bộ danh sách khóa học với máy chủ.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

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
    fetchServices();
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

  const showAlert = (type: 'success' | 'danger', text: string) => {
    triggerToast(text, type);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Vui lòng nhập tên khóa học.';
    if (!subjectCode.trim()) newErrors.subjectCode = 'Vui lòng nhập mã môn học.';
    if (!topicId) newErrors.topicId = 'Vui lòng chọn chủ đề.';
    if (!description.trim()) newErrors.description = 'Vui lòng nhập mô tả khóa học.';
    if (!isFree && priceScoin <= 0) newErrors.priceScoin = 'Vui lòng nhập số Point lớn hơn 0.';
    
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
    setPriceScoin(0);
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
    setPriceScoin(course.priceScoin || 0);
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
      expectedOutcome: outcomes.length > 0 ? outcomes.join('\n') : description.trim(),
      durationMinutes: sessionDuration,
      isFree: isFree,
      priceScoin: isFree ? 0 : priceScoin,
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
      await fetchServices();
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
      await fetchServices();
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
      await fetchServices();
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

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-fg tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Quản lý khóa học
          </h1>
          <p className="text-fg-muted text-body font-medium">
            Tự thiết kế các lớp học chuyên môn của bạn, cấu hình chủ đề và quản lý danh sách các lớp đang cung cấp cho sinh viên.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" /> Tạo khóa học mới
        </button>
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

      {/* Filter and Search Bar */}
      <div className="meetmind-card p-4 rounded-card flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:flex-1 md:max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fg-faint" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, mã môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-muted border border-line rounded-field py-2.5 pl-10 pr-4 text-body text-fg focus:outline-none focus:border-primary/50 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* Topic filter */}
          <div className="inline-flex items-center gap-1.5 bg-surface-muted border border-line px-3 py-1.5 rounded-field">
            <Filter className="w-3.5 h-3.5 text-fg-muted" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-transparent border-none text-meta font-bold text-fg-muted focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Tất cả chủ đề</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.nameVi}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="inline-flex items-center gap-1.5 bg-surface-muted border border-line px-3 py-1.5 rounded-field">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-meta font-bold text-fg-muted focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="inactive">Đang tạm ẩn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="py-16 flex justify-center flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-meta text-fg-muted font-bold">Đang đồng bộ dữ liệu...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="meetmind-card py-20 text-center rounded-card space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-title font-bold text-fg">Không tìm thấy khóa học nào</h3>
            <p className="text-meta text-fg-muted font-medium max-w-sm">
              {courses.length === 0 
                ? 'Bạn chưa tạo khóa học nào. Hãy bắt đầu bằng cách nhấn vào nút "Tạo khóa học mới".' 
                : 'Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa của bạn.'}
            </p>
          </div>
          {courses.length === 0 && (
            <button
              onClick={handleOpenCreateModal}
              className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2 px-4 rounded-field cursor-pointer transition-all"
            >
              Tạo khóa học ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const { subjectCode, cleanTitle } = parseTitle(course.title);
            const { description: cleanDesc, outcomes } = deserializeDescriptionAndOutcomes(course.description);
            const topicName = course.helpTopics && course.helpTopics.length > 0 ? course.helpTopics[0].nameVi : 'Chủ đề khác';

            return (
              <div
                key={course.serviceId}
                className={`meetmind-card rounded-card overflow-hidden flex flex-col justify-between transition-all duration-300 border-t-4 ${
                  course.active 
                    ? 'border-t-primary shadow-card meetmind-card-hover' 
                    : 'border-t-fg-faint opacity-75 shadow-sm'
                }`}
              >
                {/* Card Header & Content */}
                <div 
                  className="p-6 space-y-4 text-left cursor-pointer hover:bg-surface-muted/20 transition-all duration-200" 
                  onClick={() => navigate(`/mentor/courses/${course.serviceId}`)}
                >
                  {/* Subject Code & Topic Badge */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-meta font-extrabold text-primary bg-primary-soft px-2.5 py-1 rounded-pill uppercase tracking-wide">
                      {subjectCode}
                    </span>
                    <span className="text-meta font-semibold text-fg-muted bg-surface-muted px-2.5 py-1 rounded-pill max-w-[150px] truncate" title={topicName}>
                      {topicName}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-title font-bold text-fg line-clamp-2 min-h-[2.5rem]" title={cleanTitle}>
                    {cleanTitle}
                  </h3>

                  {/* Description */}
                  <p className="text-meta text-fg-muted font-medium line-clamp-3 leading-relaxed">
                    {cleanDesc}
                  </p>

                  {/* Teaching specifications */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-line-soft text-meta text-fg-muted font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-fg-faint" />
                      {course.durationMinutes} phút/buổi
                    </span>

                    <span className="flex items-center gap-1 text-primary">
                      {(course.free !== undefined ? course.free : (course as any).isFree) ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-success" />
                          <span className="text-success font-bold">Miễn phí (Dạy chéo)</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-amber-600 font-bold">{course.priceScoin} Point</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Learning Outcomes preview */}
                  {outcomes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-meta font-bold text-fg">Kết quả đạt được:</p>
                      <ul className="space-y-1 list-none pl-0">
                        {outcomes.slice(0, 2).map((outcome, idx) => (
                          <li key={idx} className="text-meta text-fg-muted font-medium flex items-start gap-1.5">
                            <span className="text-success mt-0.5 shrink-0">✓</span>
                            <span className="truncate">{outcome}</span>
                          </li>
                        ))}
                        {outcomes.length > 2 && (
                          <li className="text-meta text-fg-faint font-semibold italic pl-4">
                            + {outcomes.length - 2} kết quả khác...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-4 bg-surface-muted/40 border-t border-line-soft flex items-center justify-between">
                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleStatus(course)}
                    className="flex items-center gap-2 group cursor-pointer"
                    title={course.active ? "Nhấp để tạm ẩn khỏi danh sách" : "Nhấp để hiển thị công khai"}
                  >
                    {course.active ? (
                      <ToggleRight className="w-8 h-8 text-primary transition-all group-hover:scale-105" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-fg-faint transition-all group-hover:scale-105" />
                    )}
                    <span className={`text-meta font-bold ${course.active ? 'text-fg' : 'text-fg-faint'}`}>
                      {course.active ? 'Đang hiển thị' : 'Đang tạm ẩn'}
                    </span>
                  </button>

                  {/* Edit & Delete Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(course)}
                      className="p-2 text-fg-muted hover:text-primary hover:bg-primary-soft/40 border border-line rounded-lg bg-surface transition-all cursor-pointer"
                      title="Chỉnh sửa khóa học"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCourseToDelete(course)}
                      className="p-2 text-fg-muted hover:text-danger hover:bg-danger/10 border border-line rounded-lg bg-surface transition-all cursor-pointer"
                      title="Xóa khóa học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                      if (val) setPriceScoin(0);
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
                    value={priceScoin}
                    onChange={(e) => { setPriceScoin(Number(e.target.value)); if(errors.priceScoin) setErrors({...errors, priceScoin: ''}); }}
                    className={`w-full bg-surface border rounded-field py-2.5 px-3.5 text-body text-fg focus:outline-none focus:border-primary/50 font-bold ${
                      errors.priceScoin ? 'border-danger/60 focus:border-danger' : 'border-line'
                    }`}
                    placeholder="Nhập số Point (VD: 10)"
                  />
                  {errors.priceScoin && <p className="text-meta text-danger font-semibold mt-1">{errors.priceScoin}</p>}
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
    </div>
  );
};
