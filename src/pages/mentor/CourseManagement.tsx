import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, BookOpen, Pencil, Trash, 
  ToggleLeft, ToggleRight, AlertCircle, Loader2, X, Info
} from 'lucide-react';
import { mentorServicesApi } from '../../api/mentorServices';
import { helpTopicApi } from '../../api/mentorProfile';
import type { HelpTopic, MentorServiceItem } from '../../api/types';

// Fallback topics if helpTopicApi fails to load
const DEFAULT_TOPICS: HelpTopic[] = [
  { id: '00000000-0000-0000-0000-000000000001', nameVi: 'Lập trình Web', nameEn: 'Web Development' },
  { id: '00000000-0000-0000-0000-000000000002', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence' },
  { id: '00000000-0000-0000-0000-000000000003', nameVi: 'Kỹ nghệ phần mềm', nameEn: 'Software Engineering' },
  { id: '00000000-0000-0000-0000-000000000004', nameVi: 'UI/UX & Graphics', nameEn: 'UI/UX & Graphics' },
  { id: '00000000-0000-0000-0000-000000000005', nameVi: 'An toàn thông tin', nameEn: 'Information Security' },
  { id: '00000000-0000-0000-0000-000000000006', nameVi: 'Kinh tế & Marketing', nameEn: 'Business & Marketing' },
];

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
  const [topics, setTopics] = useState<HelpTopic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  // Validation & Notifications
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation Modals
  const [courseToDelete, setCourseToDelete] = useState<MentorServiceItem | null>(null);
  const [courseToHide, setCourseToHide] = useState<MentorServiceItem | null>(null);

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

  // Filter Courses list
  const filteredCourses = courses.filter(c => {
    const { subjectCode: sCode, cleanTitle } = parseTitle(c.title);
    const matchesSearch = 
      cleanTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
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
            <BookOpen className="w-8 h-8 text-primary" /> Quản lý lớp học
          </h1>
          <p className="text-fg-muted text-body font-medium">
            Quản lý các môn học giảng dạy của bạn. Để gán lớp học vào lịch rảnh, vui lòng truy cập trang <strong>Lịch nhận mentoring</strong>.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-body font-bold py-3 px-6 rounded-field cursor-pointer shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Tạo lớp học mới
        </button>
      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 bg-primary-soft/40 border border-primary/10 text-fg-muted p-4 rounded-card text-meta font-medium">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed text-left">
          <p className="font-bold text-fg">💡 Cách sử dụng lịch dạy hiệu quả:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Bước 1:</strong> Tạo các khóa học/lớp dạy mong muốn tại trang này (Ví dụ: SWE201, FER201,...).</li>
            <li><strong>Bước 2:</strong> Vào mục <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => navigate('/mentor/slots')}>Lịch nhận mentoring</span> để khai báo khung giờ rảnh hằng tuần.</li>
            <li><strong>Bước 3:</strong> Tại bảng danh sách khung giờ, tích chọn gán các khóa học bạn muốn dạy cho từng khung giờ rảnh đó. Lúc này Mentee mới có thể đặt lịch học với bạn.</li>
          </ul>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="meetmind-card p-4 rounded-card grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
          <input
            type="text"
            placeholder="Tìm tên lớp, mã môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-line rounded-field py-2.5 pl-9 pr-4 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
          />
        </div>

        {/* Filter Topic selector */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-extrabold text-fg-muted uppercase shrink-0">Chủ đề:</label>
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

        {/* Filter Status selector */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-extrabold text-fg-muted uppercase shrink-0">Trạng thái:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đang ẩn</option>
          </select>
        </div>
      </div>

      {/* Courses Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredCourses.length === 0 ? (
        <div className="meetmind-card py-16 text-center rounded-card space-y-2">
          <p className="text-body font-bold text-fg">Chưa có lớp học nào phù hợp.</p>
          <p className="text-meta text-fg-muted font-medium">Hãy thử thay đổi điều kiện tìm kiếm hoặc nhấn nút "Tạo lớp học mới" ở trên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const { subjectCode: sCode, cleanTitle } = parseTitle(course.title);
            const isFreeCourse = course.free !== undefined ? course.free : (course as any).isFree;
            
            return (
              <div
                key={course.serviceId}
                className={`meetmind-card p-5 rounded-card border-l-4 transition-all duration-300 relative group flex flex-col justify-between ${
                  course.active ? 'border-l-primary shadow-sm hover:shadow-md' : 'border-l-fg-faint opacity-70 shadow-xs'
                }`}
              >
                <div className="space-y-3 text-left">
                  {/* Category and Title */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="inline-block text-[10px] font-black text-primary bg-primary-soft px-2 py-0.5 rounded uppercase tracking-wide">
                      {sCode}
                    </span>
                    
                    {/* Toggle status control */}
                    <button
                      onClick={() => handleToggleClick(course)}
                      className="cursor-pointer text-fg-faint hover:text-primary transition-colors shrink-0"
                      title={course.active ? "Ẩn lớp học" : "Hiện lớp học"}
                    >
                      {course.active ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-fg-faint" />}
                    </button>
                  </div>

                  <h3 
                    onClick={() => navigate(`/mentor/courses/${course.serviceId}`)}
                    className="text-body font-extrabold text-fg leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                  >
                    {cleanTitle}
                  </h3>

                  {/* Badges */}
                  <div className="text-[11px] text-fg-muted font-bold flex items-center gap-3">
                    <span className="bg-surface-muted px-2 py-0.5 rounded-sm">{course.durationMinutes} phút/buổi</span>
                    {isFreeCourse ? (
                      <span className="text-green-600 font-extrabold bg-green-50 px-2 py-0.5 rounded-sm">Miễn phí</span>
                    ) : (
                      <span className="text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded-sm">
                        {course.priceScoin?.toLocaleString('en-US')} Point
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-meta text-fg-muted font-medium line-clamp-3 leading-relaxed">
                    {course.description || 'Chưa có mô tả chi tiết lớp học.'}
                  </p>

                  {/* Expected outcome */}
                  {course.expectedOutcome && (
                    <div className="border-t border-line-soft pt-3 mt-3 space-y-1">
                      <span className="text-[10px] font-bold text-fg-faint uppercase tracking-wider block">Kết quả đầu ra đạt được:</span>
                      <p className="text-meta text-fg font-semibold line-clamp-2 leading-snug">
                        {course.expectedOutcome}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions (Edit & Delete) */}
                <div className="mt-4 pt-3 border-t border-line-soft flex justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(course)}
                    className="flex items-center gap-1.5 py-1.5 px-3.5 text-[11px] text-fg-muted hover:text-primary hover:bg-primary-soft border border-line rounded-field bg-surface font-bold transition-all cursor-pointer"
                    title="Chỉnh sửa lớp"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setCourseToDelete(course)}
                    className="flex items-center gap-1.5 py-1.5 px-3.5 text-[11px] text-fg-muted hover:text-danger hover:bg-danger-soft border border-line rounded-field bg-surface font-bold transition-all cursor-pointer"
                    title="Xóa lớp"
                  >
                    <Trash className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Modal Form (ONLY handles details now) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-card p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line-soft pb-3">
              <h3 className="text-title font-extrabold text-fg flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" /> 
                {isEditing ? 'Cập nhật thông tin lớp dạy' : 'Tạo lớp học / Dịch vụ dạy mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="py-4 space-y-4 text-left">
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
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
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
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
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
                    className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-bold"
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
                  rows={4}
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

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft mt-6">
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
            <p className="text-meta text-fg-muted mt-3 font-semibold leading-relaxed">
              Bạn có chắc chắn muốn xóa lớp học <strong className="text-fg">"{parseTitle(courseToDelete.title).cleanTitle}"</strong> không? 
              <span className="block text-danger font-bold mt-1">Lưu ý: Hành động này không thể hoàn tác và mọi slot lịch rảnh đang liên kết với lớp học này cũng sẽ bị ảnh hưởng.</span>
            </p>
            <div className="flex justify-end gap-3 mt-6 border-t border-line-soft pt-3">
              <button
                onClick={() => setCourseToDelete(null)}
                className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2 px-4 rounded-field cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={loading}
                className="bg-danger hover:bg-danger/90 text-white text-meta font-bold py-2 px-5 rounded-field cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận xóa
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
              <AlertCircle className="w-6 h-6 text-primary" /> Xác nhận ẩn lớp học
            </h3>
            <p className="text-meta text-fg-muted mt-3 font-semibold leading-relaxed">
              Bạn có chắc chắn muốn ẩn lớp học <strong className="text-fg">"{parseTitle(courseToHide.title).cleanTitle}"</strong> không? 
              <span className="block mt-1 font-medium">Khi ẩn, Mentee sẽ tạm thời không thể tìm kiếm hay đăng ký lớp học này nữa.</span>
            </p>
            <div className="flex justify-end gap-3 mt-6 border-t border-line-soft pt-3">
              <button
                onClick={() => setCourseToHide(null)}
                className="bg-surface hover:bg-surface-muted text-fg border border-line text-meta font-bold py-2 px-4 rounded-field cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                onClick={confirmHideCourse}
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2 px-5 rounded-field cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Đồng ý ẩn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
