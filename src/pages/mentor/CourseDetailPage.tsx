import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, ArrowLeft, Clock, Sparkles, Coins, 
  Pencil, Trash2, ToggleLeft, ToggleRight, X,
  CheckCircle2, AlertTriangle, Calendar
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

export const CourseDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<MentorServiceItem | null>(null);
  const [topics, setTopics] = useState<HelpTopic[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);

  // Edit form states
  const [showEditModal, setShowEditModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [topicId, setTopicId] = useState('');
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [description, setDescription] = useState('');
  const [outcomesText, setOutcomesText] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceScoin, setPriceScoin] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirm delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setToastVisible(true);
  };

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

  const loadData = async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const detail = await mentorServicesApi.getDetail(serviceId);
      setCourse(detail);
    } catch (err: any) {
      console.error(err);
      triggerToast('Không thể lấy chi tiết khóa học từ máy chủ.', 'danger');
      // If fails, redirect to list after a short delay
      setTimeout(() => navigate('/mentor/courses'), 2500);
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
        console.warn('Không tải được help topics từ API.', err);
      }
    };
    loadTopics();
    loadData();
  }, [serviceId]);

  const handleToggleStatus = async () => {
    if (!course) return;
    setLoading(true);
    try {
      const nextState = !course.active;
      await mentorServicesApi.toggleActive(course.serviceId, nextState);
      triggerToast(`Đã ${nextState ? 'kích hoạt' : 'tạm dừng'} hiển thị khóa học.`, 'success');
      await loadData();
    } catch (err) {
      triggerToast('Không thể cập nhật trạng thái.', 'danger');
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!course) return;
    const { subjectCode: sCode, cleanTitle } = parseTitle(course.title);
    const { description: cleanDesc, outcomes } = deserializeDescriptionAndOutcomes(course.description);

    setTitle(cleanTitle);
    setSubjectCode(sCode);
    setTopicId(course.helpTopics && course.helpTopics.length > 0 ? course.helpTopics[0].id : topics[0]?.id || '');
    setSessionDuration(course.durationMinutes);
    setDescription(cleanDesc);
    setOutcomesText(outcomes.join('\n'));
    setIsFree(course.free);
    setPriceScoin(course.priceScoin || 0);
    setErrors({});
    setShowEditModal(true);
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

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !validateForm()) return;

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
      priceScoin: isFree ? 0 : priceScoin,
      helpTopicIds: [topicId],
    };

    setLoading(true);
    try {
      await mentorServicesApi.update(course.serviceId, payload);
      triggerToast('Đã cập nhật thông tin khóa học thành công trên hệ thống', 'success');
      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Lưu khóa học thất bại:', err);
      const serverData = err?.response?.data;
      const detailMsg = serverData 
        ? (serverData.message || JSON.stringify(serverData)) 
        : 'Lưu khóa học thất bại.';
      triggerToast(detailMsg, 'danger');
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    setLoading(true);
    try {
      await mentorServicesApi.delete(course.serviceId);
      // Show static alert in navigate state or alert then navigate
      triggerToast('Đã xóa khóa học thành công!', 'success');
      setShowDeleteConfirm(false);
      setTimeout(() => navigate('/mentor/courses'), 1500);
    } catch (err) {
      triggerToast('Xóa khóa học thất bại.', 'danger');
      setLoading(false);
    }
  };

  if (loading && !course) {
    return (
      <div className="py-24 flex justify-center flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-body text-fg-muted font-bold">Đang tải chi tiết khóa học...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center meetmind-card rounded-card max-w-lg mx-auto mt-10 p-8 space-y-4">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="text-title font-bold text-fg">Không tìm thấy thông tin</h3>
        <button
          onClick={() => navigate('/mentor/courses')}
          className="bg-primary text-white text-body font-bold py-2 px-4 rounded-field"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { subjectCode: sCode, cleanTitle } = parseTitle(course.title);
  const { description: cleanDesc, outcomes } = deserializeDescriptionAndOutcomes(course.description);
  const topicName = course.helpTopics && course.helpTopics.length > 0 ? course.helpTopics[0].nameVi : 'Chủ đề khác';
  const createdDate = (course as any).createdAt 
    ? new Date((course as any).createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '—';

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg p-4 shadow-lg text-white w-96 transition-all duration-300 ease-in-out ${
            toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'
          } ${
            toast.type === 'success' ? 'bg-status-approved' : 'bg-status-rejected'
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

      {/* Navigation Top Header */}
      <div className="flex items-center justify-between border-b border-line-soft pb-4">
        <button
          onClick={() => navigate('/mentor/courses')}
          className="inline-flex items-center gap-2 text-body font-bold text-fg-muted hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" /> Quay lại Quản lý khóa học
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold py-2 px-4.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-gray-500" /> Chỉnh sửa
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border-0 text-sm font-bold py-2 px-4.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-[#DC2626]" /> Xóa khóa học
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: General Info Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="meetmind-card p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white border border-gray-100 space-y-6">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 border-b border-line-soft pb-3.5 leading-none">
              <BookOpen className="w-5 h-5 text-primary" /> Thông tin chung
            </h3>

            {/* Spec items list */}
            <div className="space-y-4 text-sm font-semibold text-fg-muted">
              {/* Subject Code */}
              <div className="flex justify-between items-center py-2.5 border-b border-line-soft">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Mã môn học</span>
                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {sCode}
                </span>
              </div>

              {/* Topic */}
              <div className="flex justify-between items-center py-2.5 border-b border-line-soft">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Chủ đề</span>
                <span className="text-sm font-semibold text-gray-900">{topicName}</span>
              </div>

              {/* Duration */}
              <div className="flex justify-between items-center py-2.5 border-b border-line-soft">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Thời lượng học</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> {course.durationMinutes} phút / buổi
                </span>
              </div>

              {/* Pricing */}
              <div className="flex justify-between items-center py-2.5 border-b border-line-soft">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Chi phí</span>
                <span>
                  {course.free ? (
                    <span className="bg-green-50 text-green-700 border border-green-200/50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-green-600" /> Miễn phí (Dạy chéo)
                    </span>
                  ) : (
                    <span className="bg-[#FFF7ED] text-[#D97706] border border-[#FED7AA] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#D97706]" /> {course.priceScoin} Point
                    </span>
                  )}
                </span>
              </div>

              {/* State */}
              <div className="flex justify-between items-center py-2.5 border-b border-line-soft">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Trạng thái</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                    course.active 
                      ? 'bg-green-50 text-green-700 border-green-200/50' 
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${course.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {course.active ? 'Đang hiển thị' : 'Đang tạm ẩn'}
                  </span>
                  <button
                    onClick={handleToggleStatus}
                    className="cursor-pointer focus:outline-none transition-all active:scale-95 flex items-center"
                    title={course.active ? "Nhấp để tạm ẩn" : "Nhấp để hiển thị"}
                  >
                    {course.active ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex justify-between items-center py-2.5">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Ngày tạo</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> {createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Course Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Title Banner */}
          <div className="meetmind-card p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white border border-gray-100">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight border-l-4 border-primary pl-3 flex items-center gap-2 leading-tight">
              {cleanTitle}
            </h1>
          </div>

          {/* Description Card */}
          <div className="meetmind-card p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white border border-gray-100 space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-l-4 border-primary pl-3 flex items-center gap-2 leading-none">
              <BookOpen className="w-4.5 h-4.5 text-primary" /> Mô tả chi tiết khóa học
            </h3>
            <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-line bg-[#F9FAFB] p-5 rounded-2xl border border-gray-200/80">
              {cleanDesc || 'Không có mô tả nào được thêm cho khóa học này.'}
            </p>
          </div>

          {/* Outcomes Card */}
          {outcomes.length > 0 && (
            <div className="meetmind-card p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white border border-gray-100 space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 border-l-4 border-primary pl-3 flex items-center gap-2 leading-none">
                <Sparkles className="w-4.5 h-4.5 text-primary" /> Kết quả đầu ra đạt được
              </h3>
              <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-gray-200/80">
                <ul className="space-y-3 list-none pl-0">
                  {outcomes.map((outcome, idx) => (
                    <li key={idx} className="text-sm text-gray-600 font-medium flex items-start gap-2.5">
                      <span className="text-green-600 mt-0.5 shrink-0 text-md font-bold leading-none">✓</span>
                      <span className="leading-relaxed">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-card p-6 shadow-xl relative overflow-y-auto max-h-[90vh] text-left">
            <div className="flex justify-between items-center border-b border-line-soft pb-3.5">
              <h3 className="text-lg font-extrabold text-fg flex items-center gap-2">
                <BookOpen className="w-5.5 h-5.5 text-primary" />
                Cấu hình khóa học
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  />
                  {errors.title && <p className="text-meta text-danger font-semibold mt-1">{errors.title}</p>}
                </div>

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
                  />
                  {errors.subjectCode && <p className="text-meta text-danger font-semibold mt-1">{errors.subjectCode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  />
                  {errors.priceScoin && <p className="text-meta text-danger font-semibold mt-1">{errors.priceScoin}</p>}
                </div>
              )}

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
                />
                {errors.description && <p className="text-meta text-danger font-semibold mt-1">{errors.description}</p>}
              </div>

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
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-surface border border-line hover:bg-surface-muted text-fg text-body font-bold py-2.5 px-5 rounded-field cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-danger">
                <AlertTriangle className="w-6.5 h-6.5" />
                <h3 className="text-lg font-extrabold">Xác nhận xóa khóa học</h3>
              </div>
              
              <p className="text-body text-fg-muted font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa khóa học <strong className="text-fg font-bold">"{sCode} - {cleanTitle}"</strong>? Hành động này không thể hoàn tác.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
