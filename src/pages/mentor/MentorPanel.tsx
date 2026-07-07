import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, UploadCloud, FileText, Image as ImageIcon, Trash2, Send,
  Clock, CheckCircle2, XCircle, AlertTriangle, Undo2, Plus, Paperclip,
  ListChecks, Lock, Check, Square, CheckSquare, Settings, Tags, Link2,
  Pencil, Award, Briefcase, Monitor, ExternalLink, UserPlus,
  ArrowRight, ArrowLeft, X,
} from 'lucide-react';
import { mentorVerificationApi } from '../../api/mentorVerification';
import { mentorProfileApi, helpTopicApi, mentorProjectsApi, mentorAchievementsApi } from '../../api/mentorProfile';
import { catalogApi } from '../../api/catalog';
import { useAuth } from '../../context/AuthContext';
import { forumApi } from '../../api/forum';
import type {
  VerificationRequest, VerificationStatus, DocumentType, TimelineEvent,
  HelpTopic, MentorProfileResponse,
  MentorPortfolioItem, MentorAchievement,
  MentorSubjectResult, MentorProfileOptions, SupportLevelOption, ForumPost,
} from '../../api/types';

// SĐT VN — BE bắt buộc field này khi lưu hồ sơ mentor.
const PHONE_RE = /^(0)(3|5|7|8|9)[0-9]{8}$/;

// ---------------------------------------------------------------------------
// Cấu hình hiển thị
// ---------------------------------------------------------------------------

const STATUS_META: Record<VerificationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Bản nháp', cls: 'bg-surface-muted text-fg-muted border-line', icon: <FileText className="w-3.5 h-3.5" /> },
  PENDING_REVIEW: { label: 'Chờ duyệt', cls: 'bg-amber-500/12 text-amber-600 border-amber-500/25', icon: <Clock className="w-3.5 h-3.5" /> },
  NEEDS_REVISION: { label: 'Cần chỉnh sửa', cls: 'bg-accent/12 text-accent border-accent/25', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-danger/10 text-danger border-danger/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  WITHDRAWN: { label: 'Đã rút', cls: 'bg-surface-muted text-fg-muted border-line', icon: <Undo2 className="w-3.5 h-3.5" /> },
};

const STATE_UI: Record<VerificationStatus, { bar: string; iconWrap: string; icon: React.ReactNode; title: string; step: number }> = {
  DRAFT:          { bar: 'bg-fg-faint',  iconWrap: 'bg-surface-muted text-fg-muted', icon: <FileText className="w-6 h-6" />,      title: 'Hồ sơ đang ở bản nháp',   step: 0 },
  PENDING_REVIEW: { bar: 'bg-amber-500', iconWrap: 'bg-amber-500/12 text-amber-600', icon: <Clock className="w-6 h-6" />,         title: 'Đang chờ admin duyệt',    step: 1 },
  NEEDS_REVISION: { bar: 'bg-accent',    iconWrap: 'bg-accent/12 text-accent',       icon: <AlertTriangle className="w-6 h-6" />, title: 'Admin yêu cầu chỉnh sửa', step: 0 },
  APPROVED:       { bar: 'bg-success',   iconWrap: 'bg-success/10 text-success',     icon: <CheckCircle2 className="w-6 h-6" />,  title: 'Hồ sơ đã được duyệt',     step: 2 },
  REJECTED:       { bar: 'bg-danger',    iconWrap: 'bg-danger/10 text-danger',       icon: <XCircle className="w-6 h-6" />,       title: 'Hồ sơ bị từ chối',        step: -1 },
  WITHDRAWN:      { bar: 'bg-fg-faint',  iconWrap: 'bg-surface-muted text-fg-muted', icon: <Undo2 className="w-6 h-6" />,         title: 'Bạn đã rút hồ sơ',        step: -1 },
};

const EVENT_DOT: Record<string, string> = {
  REQUEST_CREATED: 'bg-fg-faint', SUBMITTED: 'bg-primary', RESUBMITTED: 'bg-primary',
  REVISION_REQUESTED: 'bg-accent', APPROVED: 'bg-success', REJECTED: 'bg-danger', WITHDRAWN: 'bg-fg-faint',
};

// Nhãn tiếng Việt cho eventType của timeline (khớp enum MentorVerificationEventType của BE).
const EVENT_LABELS: Record<string, string> = {
  REQUEST_CREATED: 'Tạo hồ sơ',
  SUBMITTED: 'Đã nộp hồ sơ',
  RESUBMITTED: 'Nộp lại hồ sơ',
  REVISION_REQUESTED: 'Admin yêu cầu chỉnh sửa',
  APPROVED: 'Đã được duyệt',
  REJECTED: 'Bị từ chối',
  WITHDRAWN: 'Đã rút hồ sơ',
};
const eventLabel = (t?: string) =>
  t ? EVENT_LABELS[t] || t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Sự kiện';

// Định dạng timestamp ISO -> giờ/ngày Việt Nam.
const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Key lưu nháp hồ sơ mentor ở localStorage (chống mất dữ liệu khi reload).
const DRAFT_KEY = 'mentorProfileDraft';

// Checklist hoàn thiện hồ sơ — render đúng theo dữ liệu BE trả về (FE không tự suy luận)
const CHECKLIST_ROWS: { key: 'academicProfileCompleted' | 'mentorProfileCompleted' | 'hasAffiliationProof' | 'hasExpertiseProof'; label: string; hint: string; optional?: boolean }[] = [
  { key: 'academicProfileCompleted', label: 'Hoàn thiện hồ sơ học vấn', hint: 'Cập nhật thông tin học thuật ở tab "Hồ sơ cá nhân".' },
  { key: 'mentorProfileCompleted', label: 'Hoàn thiện hồ sơ mentor', hint: 'Headline, mô tả chuyên môn, chủ đề hỗ trợ ở bên dưới.' },
  { key: 'hasAffiliationProof', label: 'Minh chứng liên kết FPTU', hint: 'Thẻ sinh viên, bảng điểm hoặc email FPTU — bắt buộc.' },
  { key: 'hasExpertiseProof', label: 'Minh chứng chuyên môn', hint: 'Chứng chỉ, hợp đồng lao động hoặc portfolio — bắt buộc.' },
];


const HEADLINE_MAX = 200;
const EXPERTISE_MAX = 1000;
const HELP_TOPICS_MAX = 20;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------
const JourneyBar: React.FC<{ step: number }> = ({ step }) => {
  const labels = ['Soạn hồ sơ', 'Chờ duyệt', 'Hoàn tất'];
  return (
    <div className="flex items-center">
      {labels.map((l, i) => {
        const done = i < step, active = i === step;
        return (
          <React.Fragment key={l}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-meta font-extrabold transition-all ${done ? 'bg-primary text-on-action' : active ? 'bg-primary-soft text-primary ring-2 ring-primary/30' : 'bg-surface-muted text-fg-faint'}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-meta font-bold ${active || done ? 'text-fg' : 'text-fg-faint'}`}>{l}</span>
            </div>
            {i < labels.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${i < step ? 'bg-primary' : 'bg-surface-muted'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const RequirementRow: React.FC<{ met: boolean; label: string; hint: string; optional?: boolean }> = ({ met, label, hint, optional }) => (
  <div className="flex items-start gap-3">
    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${met ? 'bg-success/12 text-success' : optional ? 'bg-surface-muted text-fg-faint' : 'bg-amber-500/12 text-amber-600'}`}>
      {met ? <Check className="w-3.5 h-3.5" /> : optional ? <Plus className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3 h-3" />}
    </span>
    <div>
      <p className="text-body font-bold text-fg leading-snug">{label}</p>
      <p className="text-meta text-fg-muted font-medium mt-0.5">{hint}</p>
    </div>
  </div>
);

const FactStat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'primary' | 'success' }> = ({ icon, label, value, tone = 'primary' }) => (
  <div className="meetmind-card p-5 rounded-card">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-field flex items-center justify-center shrink-0 ${tone === 'success' ? 'bg-success/10 text-success' : 'bg-primary-soft text-primary'}`}>{icon}</div>
      <div>
        <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">{label}</p>
        <p className="text-title font-extrabold text-fg leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  </div>
);

// Box báo lỗi kiểu "callout" nổi (ô vuông đỏ dấu !, đuôi nhọn chỉ lên) — hiện ngay dưới ô nhập sai.
const ErrorBubble: React.FC<{ msg?: string | null }> = ({ msg }) =>
  msg ? (
    <div className="relative inline-flex items-center gap-2.5 mt-2.5 max-w-full bg-surface border border-line rounded-xl py-2 px-3 shadow-lg">
      <span className="absolute -top-1.5 left-5 w-3 h-3 bg-surface border-l border-t border-line rotate-45" />
      <span className="w-5 h-5 rounded-[5px] bg-danger text-white flex items-center justify-center shrink-0 text-sm font-black leading-none">!</span>
      <span className="text-meta font-semibold text-fg leading-snug">{msg}</span>
    </div>
  ) : null;

// Chỉ báo các bước soạn hồ sơ (wizard): Hồ sơ -> Minh chứng -> Nộp.
const WizardSteps: React.FC<{ step: 1 | 2 | 3 }> = ({ step }) => {
  const items = [
    { n: 1, label: 'Hồ sơ chuyên môn' },
    { n: 2, label: 'Minh chứng' },
    { n: 3, label: 'Nộp hồ sơ' },
  ];
  return (
    <div className="meetmind-card p-4 sm:p-5 rounded-card">
      <div className="flex items-center">
        {items.map((it, i) => {
          const done = it.n < step, active = it.n === step;
          return (
            <React.Fragment key={it.n}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-meta font-extrabold shrink-0 ${done ? 'bg-primary text-on-action' : active ? 'bg-primary-soft text-primary ring-2 ring-primary/30' : 'bg-surface-muted text-fg-faint'}`}>
                  {done ? <Check className="w-4 h-4" /> : it.n}
                </span>
                <span className={`text-body font-bold hidden sm:block truncate ${active || done ? 'text-fg' : 'text-fg-faint'}`}>{it.label}</span>
              </div>
              {i < items.length - 1 && <div className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded ${it.n < step ? 'bg-primary' : 'bg-surface-muted'}`} />}
            </React.Fragment>
          );
        })}
      </div>
      {/* Label bước hiện tại — chỉ hiện trên mobile */}
      <p className="sm:hidden text-meta font-bold text-primary mt-2 text-center">
        Bước {step}: {items[step - 1].label}
      </p>
    </div>
  );
};

// Trích xuất thông báo lỗi từ API và ánh xạ thông báo lỗi gây hiểu nhầm
const getErrorMessage = (err: any, fallback: string): string => {
  const msg = err.response?.data?.message || err.message;
  if (msg === 'Tài khoản của bạn đã bị khóa') {
    return 'Hồ sơ đang trong quá trình phê duyệt';
  }
  return msg || fallback;
};

// ---------------------------------------------------------------------------
export const MentorPanel: React.FC = () => {
  const { user } = useAuth();
  const getLevelLabel = (opts: SupportLevelOption[] | undefined, val: number | undefined) => {
    if (val === undefined) return '';
    return opts?.find((o) => o.value === val)?.label ?? `Mức ${val}/4`;
  };
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [req, setReq] = useState<VerificationRequest | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<TimelineEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const handleViewTimelineHistory = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await mentorVerificationApi.getTimeline();
      setHistoryEvents(data);
    } catch (err: any) {
      setHistoryError(err?.response?.data?.message || 'Không thể tải lịch sử chỉnh sửa.');
    } finally {
      setHistoryLoading(false);
    }
  };
  const activeReq = req || (user?.roles?.includes('MENTOR') ? { status: 'APPROVED', timeline: [] } as any : null);

  // Mentor profile form
  const [headline, setHeadline] = useState('');
  const [expertiseDescription, setExpertiseDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [helpTopicIds, setHelpTopicIds] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // New API fields:
  const [subjectResults, setSubjectResults] = useState<MentorSubjectResult[]>([]);
  const [foundationSupportLevel, setFoundationSupportLevel] = useState<number>(1);
  const [outputReviewSupportLevel, setOutputReviewSupportLevel] = useState<number>(1);
  const [directionSupportLevel, setDirectionSupportLevel] = useState<number>(1);
  const [achievements, setAchievements] = useState<MentorAchievement[]>([]);
  const [supportOptions, setSupportOptions] = useState<MentorProfileOptions | null>(null);

  // States for adding subject result
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectScore, setNewSubjectScore] = useState('');

  // States for adding achievement
  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchDesc, setNewAchDesc] = useState('');
  const [newAchDate, setNewAchDate] = useState('2026-01-01');
  const [showAddAchForm, setShowAddAchForm] = useState(false);

  // States for projects list (portfolios in frontend state)
  const [portfolios, setPortfolios] = useState<MentorPortfolioItem[]>([]);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjRole, setNewProjRole] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjFigma, setNewProjFigma] = useState('');
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [showAddProjForm, setShowAddProjForm] = useState(false);

  // Real-time blogs state
  const [blogs, setBlogs] = useState<ForumPost[]>([]);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogHelpTopicId, setNewBlogHelpTopicId] = useState('');
  const [activeAddModal, setActiveAddModal] = useState<'project' | 'achievement' | 'blog' | null>(null);

  const [helpTopicsCatalog, setHelpTopicsCatalog] = useState<HelpTopic[]>([]);
  const [hydrated, setHydrated] = useState(false); // đã tải xong để bật tự lưu nháp
  const [uploading, setUploading] = useState(false); // đang upload minh chứng
  const [uploadError, setUploadError] = useState<string | null>(null); // lỗi upload — hiện ngay dưới nút tải
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({}); // lỗi validate hồ sơ — hiện tại từng ô
  const clearPErr = (k: string) => setProfileErrors((prev) => (prev[k] ? { ...prev, [k]: '' } : prev));

  // Document upload controls
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Edit mode dành cho mentor đã APPROVED muốn cập nhật lại hồ sơ
  const [editingApproved, setEditingApproved] = useState(false);

  // Wizard soạn hồ sơ (DRAFT/NEEDS_REVISION): 1=Hồ sơ → 2=Minh chứng → 3=Nộp
  const [composeStep, setComposeStep] = useState<1 | 2 | 3>(1);
  // Xem trước hồ sơ đã nộp (ở trạng thái Chờ duyệt)
  const [showPreview, setShowPreview] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string, ms = 3000) => { setMsg(m); setTimeout(() => setMsg(null), ms); };

  const fillProfileForm = (p: MentorProfileResponse) => {
    setHeadline(p.headline ?? '');
    setExpertiseDescription(p.expertiseDescription ?? '');
    setIsAvailable(p.isAvailable ?? true);
    setHelpTopicIds((p.helpTopics ?? []).map((t) => t.id));
    setPhoneNumber(p.phoneNumber ?? '');
    setGithubUrl(p.githubUrl ?? '');
    setPortfolioUrl(p.portfolioUrl ?? '');

    // new fields:
    setSubjectResults(p.subjectResults ?? []);
    setFoundationSupportLevel(p.foundationSupportLevel ?? 1);
    setOutputReviewSupportLevel(p.outputReviewSupportLevel ?? 1);
    setDirectionSupportLevel(p.directionSupportLevel ?? 1);
  };

  // Khôi phục nháp đã lưu ở localStorage (giữ thông tin chưa lưu khi reload).
  const applyDraft = (d: Record<string, unknown>) => {
    if (!d || typeof d !== 'object') return;
    if (typeof d.headline === 'string') setHeadline(d.headline);
    if (typeof d.expertiseDescription === 'string') setExpertiseDescription(d.expertiseDescription);
    if (typeof d.isAvailable === 'boolean') setIsAvailable(d.isAvailable);
    if (Array.isArray(d.helpTopicIds)) setHelpTopicIds(d.helpTopicIds as string[]);
    if (typeof d.phoneNumber === 'string') setPhoneNumber(d.phoneNumber);
    if (typeof d.githubUrl === 'string') setGithubUrl(d.githubUrl);
    if (typeof d.portfolioUrl === 'string') setPortfolioUrl(d.portfolioUrl);
    if (Array.isArray(d.subjectResults)) setSubjectResults(d.subjectResults as MentorSubjectResult[]);
    if (typeof d.foundationSupportLevel === 'number') setFoundationSupportLevel(d.foundationSupportLevel);
    if (typeof d.outputReviewSupportLevel === 'number') setOutputReviewSupportLevel(d.outputReviewSupportLevel);
    if (typeof d.directionSupportLevel === 'number') setDirectionSupportLevel(d.directionSupportLevel);
  };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

  const load = async () => {
    setLoading(true);
    try {
      try {
        const topics = await helpTopicApi.list();
        setHelpTopicsCatalog(topics || []);
      } catch (err) {
        console.warn('Không tải được danh sách help topics.', err);
      }

      try {
        const opts = await catalogApi.getMentorProfileOptions();
        setSupportOptions(opts);
      } catch (err) {
        console.warn('Lỗi load support options', err);
      }

      // Lấy hồ sơ xác thực hiện tại.
      const current = await mentorVerificationApi.getCurrent();
      try { current.timeline = await mentorVerificationApi.getTimeline(); } catch { /* optional */ }
      setReq(current);

      if (current || user?.roles?.includes('MENTOR')) {
        let prof: MentorProfileResponse | null = null;
        try {
          prof = await mentorProfileApi.get();
          if (prof) fillProfileForm(prof);
        } catch (err) {
          console.warn('Chưa có hồ sơ mentor, dùng form trống.', err);
        }
        // Khôi phục nháp chưa lưu (chỉ khi hồ sơ còn đang soạn).
        if (current && (current.status === 'DRAFT' || current.status === 'NEEDS_REVISION')) {
          try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) applyDraft(JSON.parse(raw));
          } catch { /* ignore */ }
        }

        // Load achievements & projects from backend
        try {
          const achs = await mentorAchievementsApi.list();
          setAchievements(achs || []);
        } catch (err) {
          console.warn('Failed to load achievements', err);
        }

        try {
          const projs = await mentorProjectsApi.list();
          setPortfolios(projs.map(p => ({
            id: p.id,
            title: p.title,
            role: p.content || '',
            description: p.projectDescription || '',
            imageUrl: p.pictureUrl || '',
            figmaUrl: p.liveDemoUrl || '',
          })));
        } catch (err) {
          console.warn('Failed to load projects', err);
        }
      }
    } catch (err: any) {
      console.error(getErrorMessage(err, 'Không tải được hồ sơ mentor.'));
    } finally {
      setChecked(true);
      setLoading(false);
      setHydrated(true);
    }
  };
  useEffect(() => { load(); }, []);

  // Tự lưu nháp khi đang soạn hồ sơ — chống mất dữ liệu khi reload trang.
  useEffect(() => {
    if (!hydrated || !req) return;
    if (req.status !== 'DRAFT' && req.status !== 'NEEDS_REVISION') return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        headline, expertiseDescription, isAvailable, helpTopicIds,
        phoneNumber, githubUrl, portfolioUrl,
        foundationSupportLevel, outputReviewSupportLevel, directionSupportLevel,
        subjectResults,
      }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, req?.status, headline, expertiseDescription, isAvailable, helpTopicIds, phoneNumber, githubUrl, portfolioUrl, foundationSupportLevel, outputReviewSupportLevel, directionSupportLevel, subjectResults]);

  /**
   * Làm mới request (checklist/allowedActions/documents) NGẦM — KHÔNG bật `loading`
   * để tránh remount cả panel (gây nhảy về đầu trang sau khi upload/xoá minh chứng).
   */
  const refreshRequest = async () => {
    try {
      const r = await mentorVerificationApi.getCurrent();
      try { r.timeline = await mentorVerificationApi.getTimeline(); } catch { /* optional */ }
      setReq(r);
    } catch (err) {
      console.warn('Không làm mới được hồ sơ xác thực.', err);
    }
  };

  const allowedActions = req?.allowedActions;
  const checklist = req?.checklist;
  // BE trả về cả document đã soft-delete (isActive=false) — chỉ hiển thị tài liệu còn hiệu lực,
  // nếu không user thấy "doc ma" và bấm xoá lại sẽ bị 400 "đã bị xóa".
  const docs = (req?.documents ?? []).filter((d) => d.isActive !== false);

  // Trả về true nếu hợp lệ; nếu sai thì gắn lỗi vào từng ô (profileErrors) thay vì báo ở đầu trang.
  const validateProfile = (): boolean => {
    const e: Record<string, string> = {};
    if (!headline.trim()) e.headline = 'Vui lòng điền Headline.';
    else if (headline.length > HEADLINE_MAX) e.headline = `Headline tối đa ${HEADLINE_MAX} ký tự.`;
    if (!expertiseDescription.trim()) e.expertiseDescription = 'Vui lòng điền Mô tả chuyên môn.';
    else if (expertiseDescription.length > EXPERTISE_MAX) e.expertiseDescription = `Mô tả chuyên môn tối đa ${EXPERTISE_MAX} ký tự.`;
    if (helpTopicIds.length === 0) e.helpTopics = 'Vui lòng chọn ít nhất 1 chủ đề hỗ trợ.';
    else if (helpTopicIds.length > HELP_TOPICS_MAX) e.helpTopics = `Chỉ được chọn tối đa ${HELP_TOPICS_MAX} chủ đề.`;
    if (!PHONE_RE.test(phoneNumber.trim())) e.phoneNumber = 'Số điện thoại Việt Nam không hợp lệ (VD: 0901234567).';
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    headline,
    expertiseDescription,
    isAvailable,
    helpTopicIds,
    phoneNumber: phoneNumber.trim(),
    githubUrl: githubUrl || undefined,
    portfolioUrl: portfolioUrl || undefined,
    foundationSupportLevel,
    outputReviewSupportLevel,
    directionSupportLevel,
    subjectResults: subjectResults.map((s) => ({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName || undefined,
      scoreValue: s.scoreValue,
    })),
  });

  const handleAddSubjectResult = () => {
    if (!newSubjectCode.trim()) {
      alert('Vui lòng điền mã môn học.');
      return;
    }
    const score = parseFloat(newSubjectScore);
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Điểm số phải từ 0.0 đến 10.0.');
      return;
    }
    if (subjectResults.some(s => s.subjectCode.toUpperCase() === newSubjectCode.toUpperCase())) {
      alert('Môn học này đã được thêm.');
      return;
    }

    const newItem: MentorSubjectResult = {
      subjectCode: newSubjectCode.toUpperCase(),
      subjectName: newSubjectName.trim() || undefined,
      scoreValue: score,
    };
    setSubjectResults(prev => [...prev, newItem]);
    setNewSubjectCode('');
    setNewSubjectName('');
    setNewSubjectScore('');
  };

  const handleAddProject = async () => {
    if (!newProjTitle.trim() || !newProjRole.trim() || !newProjDesc.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }
    setBusy(true);
    try {
      const created = await mentorProjectsApi.create({
        title: newProjTitle.trim(),
        content: newProjRole.trim(),
        projectDescription: newProjDesc.trim(),
        liveDemoUrl: newProjFigma.trim() || undefined,
      });

      let finalProject = created;
      if (projectImageFile) {
        finalProject = await mentorProjectsApi.uploadPicture(created.id, projectImageFile);
      }

      setPortfolios(prev => [...prev, {
        id: finalProject.id,
        title: finalProject.title,
        role: finalProject.content || '',
        description: finalProject.projectDescription || '',
        imageUrl: finalProject.pictureUrl || '',
        figmaUrl: finalProject.liveDemoUrl || '',
      }]);

      setNewProjTitle('');
      setNewProjRole('');
      setNewProjDesc('');
      setNewProjFigma('');
      setProjectImageFile(null);
      setShowAddProjForm(false);
      flash('Đã thêm dự án mới.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tạo dự án tiêu biểu.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (id.startsWith('p_user_')) {
      setPortfolios(prev => prev.filter(p => p.id !== id));
      return;
    }
    setBusy(true);
    try {
      await mentorProjectsApi.delete(id);
      setPortfolios(prev => prev.filter(p => p.id !== id));
      flash('Đã xóa dự án.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa dự án.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddAchievement = async () => {
    if (!newAchTitle.trim() || !newAchDesc.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và mô tả.');
      return;
    }
    setBusy(true);
    try {
      const created = await mentorAchievementsApi.create({
        title: newAchTitle.trim(),
        awardDescription: newAchDesc.trim(),
        achievedAt: newAchDate,
      });
      setAchievements(prev => [...prev, created]);
      setNewAchTitle('');
      setNewAchDesc('');
      setNewAchDate('2026-01-01');
      setShowAddAchForm(false);
      flash('Đã thêm học vấn/giải thưởng.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tạo học vấn/giải thưởng.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    setBusy(true);
    try {
      await mentorAchievementsApi.delete(id);
      setAchievements(prev => prev.filter(a => a.id !== id));
      flash('Đã xóa học vấn/giải thưởng.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa học vấn/giải thưởng.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddBlog = async () => {
    if (!newBlogTitle.trim() || !newBlogContent.trim() || !newBlogHelpTopicId) {
      alert('Vui lòng điền đầy đủ thông tin bài viết và chọn chủ đề.');
      return;
    }
    setBusy(true);
    try {
      const created = await forumApi.createPost({
        title: newBlogTitle.trim(),
        content: newBlogContent.trim(),
        helpTopicId: newBlogHelpTopicId,
      });
      setBlogs(prev => [created, ...prev]);
      setNewBlogTitle('');
      setNewBlogContent('');
      setNewBlogHelpTopicId('');
      flash('Đã đăng bài viết/blog thành công.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tạo bài viết.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBlog = async (postId: string) => {
    setBusy(true);
    try {
      await forumApi.deletePost(postId);
      setBlogs(prev => prev.filter(b => b.postId !== postId));
      flash('Đã xóa bài viết.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa bài viết.');
    } finally {
      setBusy(false);
    }
  };

  const toggleHelpTopic = (id: string) => {
    clearPErr('helpTopics');
    setHelpTopicIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= HELP_TOPICS_MAX) return prev;
      return [...prev, id];
    });
  };

  // -------------------- actions --------------------
  const registerAsMentor = async () => {
    setBusy(true);
    try {
      const r = await mentorVerificationApi.createOrGetRequest();
      setReq(r);
      flash('Đã tạo hồ sơ — hãy hoàn thiện thông tin bên dưới.');
    } catch (err: any) {
      alert(getErrorMessage(err, 'Không thể đăng ký làm mentor lúc này.'));
    } finally {
      setBusy(false);
    }
  };

  const createNew = async () => {
    setBusy(true);
    try {
      clearDraft();
      const r = await mentorVerificationApi.createOrGetRequest();
      setReq(r);
      flash('Đã tạo hồ sơ xác thực mới.');
      load();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Tạo hồ sơ mới thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!validateProfile()) return;
    setBusy(true);
    try {
      await mentorProfileApi.update(buildPayload());
      flash('Đã lưu bản nháp.');
      try {
        const r = await mentorVerificationApi.getCurrent();
        r.timeline = req?.timeline;
        setReq(r);
      } catch { /* giữ req hiện tại */ }
    } catch (err: any) {
      alert(getErrorMessage(err, 'Lưu bản nháp thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  const submitVerification = async () => {
    if (!termsAccepted) return;
    if (!validateProfile()) return;
    setBusy(true);
    try {
      await mentorProfileApi.update(buildPayload());
      const r = await mentorVerificationApi.submit({ submitNote, termsAccepted: true });
      setReq(r);
      clearDraft();
      window.dispatchEvent(new CustomEvent('push-toast', {
        detail: {
          title: 'Nộp hồ sơ thành công',
          message: '🎉 Hồ sơ của bạn đã được nộp thành công và đang chờ admin duyệt.',
          type: 'BOOKING_ACCEPTED'
        }
      }));
      window.dispatchEvent(new Event('refresh-notifications'));
      flash('🎉 Đã nộp hồ sơ thành công! Hồ sơ đang chờ admin duyệt.', 6000);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(getErrorMessage(err, 'Nộp hồ sơ thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  // Wizard: B1 (Hồ sơ) -> B2 (Minh chứng). Kiểm tra hợp lệ + lưu nháp 1 lần rồi sang bước sau.
  const goToDocuments = async () => {
    if (!validateProfile()) return;
    await saveDraft();
    setComposeStep(2);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToReview = () => {
    setComposeStep(3);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (type: DocumentType, file?: File) => {
    if (!req || !file) return;
    setUploadError(null);

    // Kiểm tra ngay phía client để báo đúng nguyên nhân (định dạng / dung lượng).
    const isImage = ['image/jpeg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    const okType = isImage || file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!okType) {
      setUploadError('Định dạng không được hỗ trợ. Chỉ nhận tệp JPG, PNG hoặc PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`Tệp ${(file.size / 1024 / 1024).toFixed(1)}MB vượt quá giới hạn 10MB.`);
      return;
    }

    // Resize ảnh xuống tối đa 1920px và nén trước khi upload
    let fileToUpload = file;
    if (isImage) {
      fileToUpload = await new Promise<File>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1920;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file);
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      });
    }

    setUploading(true);
    setUploadingType(type);
    try {
      const updatedReq = await mentorVerificationApi.uploadDocument({ documentType: type, file: fileToUpload });
      // cập nhật lạc quan + làm mới ngầm (giữ nguyên vị trí cuộn, không remount panel)
      setReq(updatedReq);
      flash('Đã tải lên minh chứng.');
      await refreshRequest();
    } catch (err: any) {
      // Ưu tiên message thật từ BE (err.response.data.message) hoặc từ Cloudinary (err.message).
      setUploadError(
        err?.response?.data?.message || err?.message || 'Tải minh chứng thất bại. Vui lòng thử lại.'
      );
    } finally {
      setUploading(false);
      setUploadingType(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!req) return;
    setBusy(true);
    setUploadError(null);
    try {
      const updatedReq = await mentorVerificationApi.deleteDocument(documentId);
      setReq(updatedReq);
      flash('Đã xoá minh chứng.');
      await refreshRequest();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Xoá minh chứng thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!req) return;
    setBusy(true);
    try {
      const r = await mentorVerificationApi.withdraw();
      setReq(r);
      clearDraft();
      flash('Đã rút hồ sơ.');
    } catch (err: any) {
      alert(getErrorMessage(err, 'Rút hồ sơ thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  const saveApprovedProfile = async () => {
    if (!validateProfile()) return;
    setBusy(true);
    try {
      await mentorProfileApi.update(buildPayload());
      flash('Đã lưu thay đổi hồ sơ mentor.');
      setEditingApproved(false);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Lưu thay đổi thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  // -------------------- render --------------------
  if (loading) {
    return <div className="py-16 flex justify-center"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const Notices = (
    <>
      {msg && <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success p-3 rounded-field text-body font-semibold"><CheckCircle2 className="w-4 h-4" />{msg}</div>}
    </>
  );

  // ---------- Chưa từng đăng ký làm mentor ----------
  if (checked && !activeReq) {
    return (
      <div className="space-y-5">
        {Notices}
        <div className="meetmind-card p-8 rounded-card text-center space-y-4">
          <div className="w-14 h-14 rounded-card bg-primary-soft text-primary flex items-center justify-center mx-auto"><Award className="w-6 h-6" /></div>
          <div>
            <h3 className="text-title font-bold text-fg">Bạn chưa đăng ký làm Mentor</h3>
            <p className="text-body text-fg-muted font-medium mt-1.5 max-w-md mx-auto" style={{ textWrap: 'pretty' }}>
              Đăng ký để chia sẻ chuyên môn, hỗ trợ các bạn sinh viên khác và nhận lịch hẹn trao đổi 1:1.
            </p>
          </div>
          <button disabled={busy} onClick={registerAsMentor} className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 transition-all">
            <UserPlus className="w-4 h-4" /> Đăng ký làm Mentor
          </button>
        </div>
      </div>
    );
  }

  if (!activeReq) return null;
  const sm = STATUS_META[activeReq.status as VerificationStatus];
  const ui = STATE_UI[activeReq.status as VerificationStatus];

  const heroDesc: Record<VerificationStatus, string> = {
    DRAFT: 'Hoàn thiện hồ sơ chuyên môn và tải tối thiểu 1 minh chứng liên kết FPTU rồi nộp để admin duyệt.',
    PENDING_REVIEW: 'Hồ sơ đã được nộp và đang trong hàng chờ. Bạn sẽ nhận thông báo ngay khi có kết quả.',
    NEEDS_REVISION: activeReq.reviewNote || 'Vui lòng cập nhật theo ghi chú của admin và nộp lại.',
    APPROVED: 'Chúc mừng! Bạn đã chính thức là Mentor và hồ sơ đã hiển thị công khai trong mục Khám phá.',
    REJECTED: activeReq.reviewNote || 'Hồ sơ chưa đạt yêu cầu. Tạo hồ sơ mới để nộp lại.',
    WITHDRAWN: 'Hồ sơ xác thực đã được rút lại. Bạn có thể tạo hồ sơ mới bất cứ lúc nào.',
  };

  const resolvedHelpTopics = helpTopicIds.map((id) => helpTopicsCatalog.find((t) => t.id === id)).filter((t): t is HelpTopic => !!t);
  // Số tối đa hiển thị = min(giới hạn BE, số chủ đề thực có) để không hiện "/20" khi catalog ít hơn.
  const helpMax = Math.min(HELP_TOPICS_MAX, helpTopicsCatalog.length || HELP_TOPICS_MAX);

  // ---------- Form chỉnh sửa hồ sơ chuyên môn (dùng chung cho mọi trạng thái cần soạn) ----------
  const ProfileFields = (
    <>
      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
          <Settings className="w-5 h-5 text-primary" /> Mô tả năng lực
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Headline ({headline.length}/{HEADLINE_MAX})</label>
            <input type="text" maxLength={HEADLINE_MAX} value={headline} onChange={(e) => { setHeadline(e.target.value); clearPErr('headline'); }}
              placeholder="Ví dụ: Chuyên gia phát triển Web Fullstack | Hỗ trợ đồ án"
              className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none font-semibold ${profileErrors.headline ? 'border-danger/60 focus:border-danger' : 'border-line focus:border-primary/50'}`} />
            <ErrorBubble msg={profileErrors.headline} />
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mô tả chuyên môn ({expertiseDescription.length}/{EXPERTISE_MAX})</label>
            <textarea rows={4} maxLength={EXPERTISE_MAX} value={expertiseDescription} onChange={(e) => { setExpertiseDescription(e.target.value); clearPErr('expertiseDescription'); }}
              placeholder="Giới thiệu kinh nghiệm, kỹ năng và cách bạn hỗ trợ mentee."
              className={`w-full bg-surface border rounded-field p-3 text-body text-fg focus:outline-none resize-none font-medium ${profileErrors.expertiseDescription ? 'border-danger/60 focus:border-danger' : 'border-line focus:border-primary/50'}`} />
            <ErrorBubble msg={profileErrors.expertiseDescription} />
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Số điện thoại liên hệ <span className="text-danger">*</span></label>
            <input type="tel" value={phoneNumber} onChange={(e) => { setPhoneNumber(e.target.value); clearPErr('phoneNumber'); }}
              placeholder="VD: 0901234567"
              className={`w-full bg-surface border rounded-field py-2.5 px-3 text-body text-fg focus:outline-none font-semibold ${profileErrors.phoneNumber ? 'border-danger/60 focus:border-danger' : 'border-line focus:border-primary/50'}`} />
            <ErrorBubble msg={profileErrors.phoneNumber} />
          </div>
        </div>
      </div>

      {/* Điểm số các môn hỗ trợ (Peer Matching) */}
      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
          <Award className="w-5 h-5 text-primary" /> Điểm số các môn hỗ trợ (Peer Matching)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mã môn học *</label>
            <input
              type="text"
              placeholder="Ví dụ: PRJ301"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
              className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
            />
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Tên môn học (Tùy chọn)</label>
            <input
              type="text"
              placeholder="Ví dụ: Java Web Application"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Điểm số *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0 - 10.0"
                value={newSubjectScore}
                onChange={(e) => setNewSubjectScore(e.target.value)}
                className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSubjectResult}
              className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2 px-4 rounded-field cursor-pointer h-[38px] transition-all flex items-center justify-center shrink-0"
            >
              Thêm
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {subjectResults.map((sub, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-surface-muted/40 border border-line rounded-xl">
              <div>
                <span className="text-meta font-black text-primary bg-primary-soft/80 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wider text-[8px] inline-block mr-2">
                  {sub.scoreValue.toFixed(1)} / 10
                </span>
                <span className="text-body font-bold text-fg">{sub.subjectCode}</span>
                {sub.subjectName && <p className="text-meta text-fg-muted font-medium mt-0.5">{sub.subjectName}</p>}
              </div>
              <button
                type="button"
                onClick={() => setSubjectResults(prev => prev.filter((_, i) => i !== idx))}
                className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {subjectResults.length === 0 && (
            <p className="text-meta text-fg-faint font-semibold py-2">Chưa có môn học hỗ trợ nào được nhập.</p>
          )}
        </div>
      </div>

      {/* Mức độ hỗ trợ kỹ năng chuyên sâu */}
      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
          <Award className="w-5 h-5 text-primary" /> Mức độ hỗ trợ kỹ năng chuyên sâu
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mức hỗ trợ lấy gốc</label>
            <select
              value={foundationSupportLevel}
              onChange={(e) => setFoundationSupportLevel(Number(e.target.value))}
              className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
            >
              {supportOptions?.foundationSupportLevels?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )) || [
                <option key={1} value={1}>Cơ bản</option>,
                <option key={2} value={2}>Trung bình</option>,
                <option key={3} value={3}>Khá</option>,
                <option key={4} value={4}>Chuyên sâu</option>
              ]}
            </select>
          </div>

          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mức review bài/CV</label>
            <select
              value={outputReviewSupportLevel}
              onChange={(e) => setOutputReviewSupportLevel(Number(e.target.value))}
              className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
            >
              {supportOptions?.outputReviewSupportLevels?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )) || [
                <option key={1} value={1}>Cơ bản</option>,
                <option key={2} value={2}>Trung bình</option>,
                <option key={3} value={3}>Khá</option>,
                <option key={4} value={4}>Chuyên sâu</option>
              ]}
            </select>
          </div>

          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mức định hướng career</label>
            <select
              value={directionSupportLevel}
              onChange={(e) => setDirectionSupportLevel(Number(e.target.value))}
              className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
            >
              {supportOptions?.directionSupportLevels?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )) || [
                <option key={1} value={1}>Cơ bản</option>,
                <option key={2} value={2}>Trung bình</option>,
                <option key={3} value={3}>Khá</option>,
                <option key={4} value={4}>Chuyên sâu</option>
              ]}
            </select>
          </div>
        </div>
      </div>

      <div className="meetmind-card p-6 rounded-card space-y-3">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
          <Link2 className="w-5 h-5 text-primary" /> Liên kết (không bắt buộc)
        </h3>
        <div className="space-y-3">
          <input type="url" placeholder="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-medium" />
          <input type="url" placeholder="Portfolio URL" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-medium" />
        </div>
      </div>

      {/* Giải thưởng & Học vấn (Achievements) */}
      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
          <Award className="w-5 h-5 text-primary" /> Học vấn & Giải thưởng
        </h3>
        
        {/* Achievements list */}
        <div className="space-y-3">
          {achievements.map((ach) => (
            <div key={ach.id} className="flex items-center justify-between p-3.5 bg-surface border border-line rounded-xl">
              <div>
                <h4 className="text-body font-bold text-fg">{ach.title}</h4>
                <p className="text-meta text-fg-muted font-medium mt-0.5">{ach.awardDescription}</p>
                {ach.achievedAt && <span className="text-meta font-semibold text-fg-faint mt-1 block">Ngày đạt: {ach.achievedAt}</span>}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAchievement(ach.id)}
                className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {achievements.length === 0 && (
            <p className="text-meta text-fg-faint font-semibold py-2">Chưa cấu hình học vấn & giải thưởng.</p>
          )}
        </div>

        {/* Add achievement form */}
        {showAddAchForm ? (
          <div className="p-5 border border-dashed border-line rounded-2xl space-y-4 bg-surface-muted/20">
            <h4 className="text-body font-bold text-fg">Thêm học vấn/giải thưởng mới</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  placeholder="VD: Thủ khoa ngành Kỹ thuật Phần mềm"
                  value={newAchTitle}
                  onChange={(e) => setNewAchTitle(e.target.value)}
                  className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
                />
              </div>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Ngày đạt *</label>
                <input
                  type="date"
                  value={newAchDate}
                  onChange={(e) => setNewAchDate(e.target.value)}
                  className="w-full bg-surface border border-line rounded-field py-1.5 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mô tả chi tiết *</label>
              <textarea
                rows={3}
                placeholder="Mô tả cụ thể về thành tích này..."
                value={newAchDesc}
                onChange={(e) => setNewAchDesc(e.target.value)}
                className="w-full bg-surface border border-line rounded-field p-2.5 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddAchForm(false)} className="py-1.5 px-4 bg-surface border border-line rounded-field text-meta font-bold text-fg hover:bg-surface-muted cursor-pointer">Hủy</button>
              <button
                type="button"
                onClick={handleAddAchievement}
                className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-field text-meta font-bold cursor-pointer"
              >
                Lưu thành tích
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddAchForm(true)}
            className="inline-flex items-center gap-1.5 text-meta text-primary hover:text-primary-hover font-bold border border-primary/25 border-dashed rounded-xl p-3 justify-center w-full bg-primary-soft/5 hover:bg-primary-soft/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm giải thưởng/học vấn
          </button>
        )}
      </div>

      {/* Portfolio dự án (Featured Projects) */}
      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
          <Monitor className="w-5 h-5 text-primary" /> Quản lý danh sách Portfolio dự án
        </h3>

        {/* Project List */}
        <div className="space-y-3">
          {portfolios.map((proj, idx) => (
            <div key={proj.id || idx} className="flex items-center justify-between p-3.5 bg-surface border border-line rounded-xl">
              <div>
                <span className="text-meta font-black text-primary bg-primary-soft/80 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wider text-[8px] inline-block mr-2">{proj.role}</span>
                <span className="text-body font-bold text-fg">{proj.title}</span>
              </div>
              <button type="button" onClick={() => handleDeleteProject(proj.id)} className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer">
                <Trash2 className="w-4 h-4" /> Xóa
              </button>
            </div>
          ))}
          {portfolios.length === 0 && (
            <p className="text-meta text-fg-faint font-semibold py-2">Chưa có dự án nào trong portfolio của bạn.</p>
          )}
        </div>

        {/* Add Project Sub-form */}
        {showAddProjForm ? (
          <div className="p-5 border border-dashed border-line rounded-2xl space-y-4 bg-surface-muted/20">
            <h4 className="text-body font-bold text-fg">Thêm dự án mới</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Tên dự án *</label>
                <input type="text" placeholder="VD: App FinVibe" value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
              </div>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Vai trò trong dự án *</label>
                <input type="text" placeholder="VD: UI/UX Designer, Lead Developer" value={newProjRole} onChange={(e) => setNewProjRole(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
              </div>
            </div>

            <div>
              <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mô tả dự án *</label>
              <textarea rows={3} placeholder="Mô tả mục tiêu, cách thực hiện dự án của bạn..." value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} className="w-full bg-surface border border-line rounded-field p-2.5 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Đường dẫn liên kết dự án (Tùy chọn)</label>
                <input type="url" placeholder="GitHub hoặc Figma Link..." value={newProjFigma} onChange={(e) => setNewProjFigma(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
              </div>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Ảnh minh họa dự án (Tệp JPG/PNG, tùy chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProjectImageFile(file);
                  }}
                  className="w-full bg-surface border border-line rounded-field py-1.5 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddProjForm(false)} className="py-1.5 px-4 bg-surface border border-line rounded-field text-meta font-bold text-fg hover:bg-surface-muted cursor-pointer">Hủy</button>
              <button
                type="button"
                onClick={handleAddProject}
                className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-field text-meta font-bold cursor-pointer"
              >
                Thêm dự án
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowAddProjForm(true)} className="inline-flex items-center gap-1.5 text-meta text-primary hover:text-primary-hover font-bold border border-primary/25 border-dashed rounded-xl p-3 justify-center w-full bg-primary-soft/5 hover:bg-primary-soft/10 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Thêm dự án vào Portfolio
          </button>
        )}
      </div>

      <div className="meetmind-card p-6 rounded-card space-y-3">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><Tags className="w-5 h-5 text-primary" /> Chủ đề hỗ trợ ({helpTopicIds.length}/{helpMax})</h3>
        {helpTopicsCatalog.length === 0 ? (
          <p className="text-meta text-fg-muted font-medium py-2">Không tải được danh sách chủ đề. Vui lòng thử lại sau.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {helpTopicsCatalog.map((topic) => {
              const isSelected = helpTopicIds.includes(topic.id);
              return (
                <button key={topic.id} onClick={() => toggleHelpTopic(topic.id)}
                  className={`text-meta font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-primary-soft text-primary border-primary/25' : 'bg-surface border-line text-fg-muted hover:bg-surface-muted'}`}>
                  {topic.nameVi}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-meta text-fg-faint font-semibold pt-1">* Chọn từ 1 đến {helpMax} chủ đề bạn có thể hỗ trợ.</p>
        <ErrorBubble msg={profileErrors.helpTopics} />
      </div>
    </>
  );
  // ---------- Xem trước hồ sơ (read-only) — dùng cho bước Nộp & trạng thái Chờ duyệt ----------
  const ProfileSummary = (
    <div className="meetmind-card p-7 rounded-card space-y-6 text-left">
      <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5">
        <ShieldCheck className="w-5 h-5 text-primary" /> Hồ sơ chuyên môn
      </h3>
      
      <div>
        <p className="text-body font-bold text-fg leading-snug">{headline || 'Chưa có headline'}</p>
        <p className="text-body text-fg-muted font-medium mt-2 leading-relaxed" style={{ textWrap: 'pretty' }}>{expertiseDescription || 'Chưa có mô tả chuyên môn.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-line-soft py-4">
        <div>
          <span className="text-meta text-fg-muted block">Hỗ trợ lấy gốc:</span>
          <span className="text-body font-extrabold text-primary">
            {getLevelLabel(supportOptions?.foundationSupportLevels, foundationSupportLevel)}
          </span>
        </div>
        <div>
          <span className="text-meta text-fg-muted block">Review bài nộp / CV:</span>
          <span className="text-body font-extrabold text-primary">
            {getLevelLabel(supportOptions?.outputReviewSupportLevels, outputReviewSupportLevel)}
          </span>
        </div>
        <div>
          <span className="text-meta text-fg-muted block">Định hướng career / OJT:</span>
          <span className="text-body font-extrabold text-primary">
            {getLevelLabel(supportOptions?.directionSupportLevels, directionSupportLevel)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-body">
        <span><span className="text-fg-muted font-semibold">Trạng thái:</span> <span className="font-bold text-fg">{isAvailable ? 'Đang nhận mentee' : 'Tạm ngưng'}</span></span>
        {phoneNumber && <span><span className="text-fg-muted font-semibold">SĐT:</span> <span className="font-bold text-fg">{phoneNumber}</span></span>}
      </div>

      {subjectResults.length > 0 && (
        <div>
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-2">Môn học & điểm số hỗ trợ (Peer Matching)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subjectResults.map((sub, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1 px-3.5 rounded-lg border border-line bg-surface text-fg-muted text-meta font-semibold">
                <span className="text-[10px] font-black text-primary bg-primary-soft/80 border border-primary/20 px-1.5 py-0.5 rounded">
                  {sub.scoreValue.toFixed(1)}
                </span>
                <span>{sub.subjectCode} - {sub.subjectName || 'Môn học hỗ trợ'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolvedHelpTopics.length > 0 && (
        <div>
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-2">Chủ đề hỗ trợ</p>
          <div className="flex flex-wrap gap-2">
            {resolvedHelpTopics.map((t) => (
              <span key={t.id} className="py-1.5 px-3 rounded-lg bg-surface border border-line text-fg-muted text-meta font-bold">
                {t.nameVi}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Học vấn & Giải thưởng */}
      <div>
        <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-2">
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">Học vấn & Giải thưởng</p>
          <button
            type="button"
            onClick={() => setActiveAddModal('achievement')}
            className="text-meta font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer bg-transparent border-0"
          >
            <Plus className="w-4 h-4" /> Thêm giải thưởng
          </button>
        </div>
        <div className="space-y-2">
          {achievements.map((ach) => (
            <div key={ach.id} className="p-3 bg-surface-muted/30 border border-line rounded-lg text-meta flex items-center justify-between">
              <div>
                <div className="flex justify-between font-bold text-fg">
                  <span>{ach.title}</span>
                  {ach.achievedAt && <span className="text-fg-faint font-semibold ml-2">{ach.achievedAt}</span>}
                </div>
                <p className="text-fg-muted font-medium mt-1">{ach.awardDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAchievement(ach.id)}
                className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {achievements.length === 0 && (
            <p className="text-meta text-fg-faint font-semibold py-2">Chưa cấu hình học vấn & giải thưởng.</p>
          )}
        </div>
      </div>

      {/* Dự án & Portfolio */}
      <div>
        <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-2">
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">Dự án & Portfolio</p>
          <button
            type="button"
            onClick={() => setActiveAddModal('project')}
            className="text-meta font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer bg-transparent border-0"
          >
            <Plus className="w-4 h-4" /> Thêm dự án
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portfolios.map((proj) => (
            <div key={proj.id} className="p-3 bg-surface border border-line rounded-lg text-meta flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-primary bg-primary-soft/80 border border-primary/20 px-1 rounded uppercase tracking-wider">{proj.role}</span>
                  <span className="font-bold text-fg">{proj.title}</span>
                </div>
                <p className="text-fg-muted font-medium mt-1 line-clamp-2">{proj.description}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                {proj.figmaUrl ? (
                  <a href={proj.figmaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                    Xem chi tiết <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {portfolios.length === 0 && (
            <p className="text-meta text-fg-faint font-semibold py-2">Chưa có dự án nào trong portfolio.</p>
          )}
        </div>
      </div>

      {/* Bài viết & Blog */}
      <div>
        <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-2">
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">Bài viết & Blog</p>
          <button
            type="button"
            onClick={() => setActiveAddModal('blog')}
            className="text-meta font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer bg-transparent border-0"
          >
            <Plus className="w-4 h-4" /> Thêm bài viết
          </button>
        </div>
        <div className="space-y-3">
          {blogs.map((b) => (
            <div key={b.postId} className="p-4 bg-surface border border-line rounded-xl flex items-center justify-between text-meta">
              <div className="space-y-1">
                <h4 className="font-bold text-fg">{b.title}</h4>
                <p className="text-fg-muted font-medium line-clamp-2">{b.content}</p>
                {b.helpTopic && (
                  <span className="text-[9px] font-black text-primary bg-primary-soft/80 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                    {b.helpTopic.nameVi}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlog(b.postId)}
                className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {blogs.length === 0 && (
            <p className="text-meta text-fg-faint font-semibold py-2">Chưa có bài viết hay blog nào.</p>
          )}
        </div>
      </div>

      {(githubUrl || portfolioUrl) && (
        <div>
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-2">Liên kết</p>
          <div className="flex flex-wrap gap-2.5">
            {[{ label: 'GitHub', url: githubUrl }, { label: 'Portfolio', url: portfolioUrl }].filter((l) => l.url).map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 px-3.5 rounded-field border border-line bg-surface text-body font-bold text-fg-muted hover:text-primary transition-all">
                {l.label}<ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // ---------- APPROVED: hồ sơ mentor đã kích hoạt ----------
  if (activeReq.status === 'APPROVED' && !editingApproved) {
    return (
      <div className="space-y-7">
        {Notices}
        <div className="grid sm:grid-cols-2 gap-4">
          <FactStat icon={<Briefcase className="w-4.5 h-4.5" />} label="Trạng thái" value={isAvailable ? 'Đang nhận mentee' : 'Tạm ngưng'} tone={isAvailable ? 'success' : 'primary'} />
          <FactStat icon={<ShieldCheck className="w-4.5 h-4.5" />} label="Mức độ tin cậy" value="Đã xác thực" tone="success" />
        </div>

        <div className="meetmind-card p-7 rounded-card space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-2.5">
            <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" /> Hồ sơ Mentor 
              <span className={`ml-2 inline-flex items-center gap-1 text-meta font-extrabold py-0.5 px-2 rounded-lg border ${sm.cls}`}>
                {sm.icon}{sm.label}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleViewTimelineHistory}
                className="inline-flex items-center gap-1.5 bg-surface-muted hover:bg-line/45 text-fg-muted hover:text-fg text-meta font-bold py-2 px-3.5 rounded-field cursor-pointer border border-line transition-all"
              >
                <Clock className="w-3.5 h-3.5" /> Lịch sử
              </button>
              <button onClick={() => setEditingApproved(true)} className="inline-flex items-center gap-1.5 bg-primary-soft text-primary hover:bg-primary/15 text-meta font-bold py-2 px-3 rounded-field cursor-pointer transition-all">
                <Pencil className="w-3.5 h-3.5" /> Cấu hình
              </button>
            </div>
          </div>

          <div>
            <p className="text-body font-bold text-fg leading-snug">{headline}</p>
            <p className="text-body text-fg-muted font-medium mt-2 leading-relaxed" style={{ textWrap: 'pretty' }}>{expertiseDescription}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-line-soft py-4">
            <div>
              <span className="text-meta text-fg-muted block">Hỗ trợ lấy gốc:</span>
              <span className="text-body font-extrabold text-primary">
                {getLevelLabel(supportOptions?.foundationSupportLevels, foundationSupportLevel)}
              </span>
            </div>
            <div>
              <span className="text-meta text-fg-muted block">Review bài nộp / CV:</span>
              <span className="text-body font-extrabold text-primary">
                {getLevelLabel(supportOptions?.outputReviewSupportLevels, outputReviewSupportLevel)}
              </span>
            </div>
            <div>
              <span className="text-meta text-fg-muted block">Định hướng career / OJT:</span>
              <span className="text-body font-extrabold text-primary">
                {getLevelLabel(supportOptions?.directionSupportLevels, directionSupportLevel)}
              </span>
            </div>
          </div>

          {subjectResults.length > 0 && (
            <div>
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-3">Môn học & điểm số hỗ trợ (Peer Matching)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {subjectResults.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1.5 px-3.5 rounded-lg border border-line bg-surface text-fg-muted text-meta font-semibold">
                    <span className="text-[10px] font-black text-primary bg-primary-soft/80 border border-primary/20 px-1.5 py-0.5 rounded">
                      {sub.scoreValue.toFixed(1)}
                    </span>
                    <span>{sub.subjectCode} - {sub.subjectName || 'Môn học hỗ trợ'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolvedHelpTopics.length > 0 && (
            <div>
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-3">Chủ đề hỗ trợ</p>
              <div className="flex flex-wrap gap-2">
                {resolvedHelpTopics.map((t) => (
                  <span key={t.id} className="py-1.5 px-3 rounded-lg bg-surface border border-line text-fg-muted text-meta font-bold">
                    {t.nameVi}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Học vấn & Giải thưởng */}
          <div>
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5 mb-3">
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">Học vấn & Giải thưởng</p>
              <button
                type="button"
                onClick={() => setActiveAddModal('achievement')}
                className="inline-flex items-center gap-1 text-meta font-bold text-primary hover:text-primary-hover bg-transparent border-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm giải thưởng
              </button>
            </div>
            <div className="space-y-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="p-4 bg-surface-muted/30 border border-line rounded-xl text-meta flex items-center justify-between">
                  <div>
                    <div className="flex justify-between font-bold text-fg">
                      <span>{ach.title}</span>
                      {ach.achievedAt && <span className="text-fg-faint font-semibold ml-2">{ach.achievedAt}</span>}
                    </div>
                    <p className="text-fg-muted font-medium mt-1">{ach.awardDescription}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAchievement(ach.id)}
                    className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {achievements.length === 0 && (
                <p className="text-meta text-fg-faint font-semibold py-2">Chưa cấu hình học vấn & giải thưởng.</p>
              )}
            </div>
          </div>

          {/* Dự án & Portfolio */}
          <div>
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5 mb-3">
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">Dự án & Portfolio</p>
              <button
                type="button"
                onClick={() => setActiveAddModal('project')}
                className="inline-flex items-center gap-1 text-meta font-bold text-primary hover:text-primary-hover bg-transparent border-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm dự án
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolios.map((proj) => (
                <div key={proj.id} className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  {proj.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-surface-muted border-b border-line relative">
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-meta">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-primary bg-primary-soft/80 border border-primary/20 px-1 py-0.5 rounded uppercase tracking-wider">{proj.role}</span>
                        <span className="font-bold text-fg">{proj.title}</span>
                      </div>
                      <p className="text-fg-muted font-medium line-clamp-2 mt-1">{proj.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-line-soft">
                      {proj.figmaUrl ? (
                        <a href={proj.figmaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                          Xem chi tiết <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : <span />}
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {portfolios.length === 0 && (
                <p className="text-meta text-fg-faint font-semibold py-2">Chưa có dự án nào trong portfolio.</p>
              )}
            </div>
          </div>

          {/* Bài viết & Blog */}
          <div>
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5 mb-3">
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">Bài viết & Blog</p>
              <button
                type="button"
                onClick={() => setActiveAddModal('blog')}
                className="inline-flex items-center gap-1 text-meta font-bold text-primary hover:text-primary-hover bg-transparent border-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm bài viết
              </button>
            </div>
            <div className="space-y-3">
              {blogs.map((b) => (
                <div key={b.postId} className="p-4 bg-surface border border-line rounded-xl flex items-center justify-between text-meta">
                  <div className="space-y-1">
                    <h4 className="font-bold text-fg">{b.title}</h4>
                    <p className="text-fg-muted font-medium line-clamp-2">{b.content}</p>
                    {b.helpTopic && (
                      <span className="text-[9px] font-black text-primary bg-primary-soft/80 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                        {b.helpTopic.nameVi}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlog(b.postId)}
                    className="text-meta text-danger hover:text-danger/80 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {blogs.length === 0 && (
                <p className="text-meta text-fg-faint font-semibold py-2">Chưa có bài viết hay blog nào.</p>
              )}
            </div>
          </div>

          {(githubUrl || portfolioUrl) && (
            <div>
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-3">Liên kết</p>
              <div className="flex flex-wrap gap-2.5">
                {[{ label: 'GitHub', url: githubUrl }, { label: 'Portfolio', url: portfolioUrl }].filter((l) => l.url).map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 px-3.5 rounded-field border border-line bg-surface text-body font-bold text-fg-muted hover:text-primary transition-all">
                    {l.label}<ExternalLink className="w-3 h-3 text-fg-faint" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // ---------- APPROVED + đang chỉnh sửa: chỉ sửa field hồ sơ, không qua bước nộp duyệt ----------
  if (activeReq.status === 'APPROVED' && editingApproved) {
    return (
      <div className="space-y-6">
        {Notices}
        <div className="flex items-center justify-between">
          <h3 className="text-title font-bold font-sans text-fg">Cấu hình hồ sơ Mentor</h3>
        </div>
        {ProfileFields}
        <button disabled={busy} onClick={saveApprovedProfile} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-3 px-6 rounded-field cursor-pointer disabled:opacity-50 transition-all">
          <Check className="w-4 h-4" /> Lưu thay đổi
        </button>
      </div>
    );
  }

  // ---------- PENDING_REVIEW: chỉ hiển thị trạng thái + nút xem trước & rút hồ sơ (KHÔNG cho sửa) ----------
  if (activeReq.status === 'PENDING_REVIEW') {
    return (
      <div className="space-y-7">
        {Notices}
        <StatusHero req={activeReq} sm={sm} ui={ui} heroDesc={heroDesc} extra={
          <div className="mt-6 pt-6 border-t border-line-soft flex items-center gap-3 flex-wrap">
            <button onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-2 bg-primary-soft text-primary hover:bg-primary/15 text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all">
              <FileText className="w-4 h-4" /> {showPreview ? 'Ẩn hồ sơ đã nộp' : 'Xem hồ sơ đã nộp'}
            </button>
            {allowedActions?.canWithdraw && (
              <button disabled={busy} onClick={handleWithdraw} className="inline-flex items-center gap-1.5 bg-danger/10 hover:bg-danger/15 border border-danger/20 text-danger text-body font-bold py-2.5 px-4 rounded-field cursor-pointer disabled:opacity-50 transition-all"><Undo2 className="w-4 h-4" /> Rút hồ sơ</button>
            )}
          </div>
        } />
        <div className="grid lg:grid-cols-3 gap-7 items-start">
          <div className="lg:col-span-2 space-y-7">
            {showPreview && ProfileSummary}
            {showPreview && <DocumentsCard docs={docs} canUpload={false} />}
            {!showPreview && (
              <div className="meetmind-card p-7 rounded-card text-center space-y-2">
                <div className="w-12 h-12 rounded-card bg-amber-500/12 text-amber-600 flex items-center justify-center mx-auto"><Clock className="w-6 h-6" /></div>
                <p className="text-body font-bold text-fg">Hồ sơ đang chờ admin duyệt</p>
                <p className="text-meta text-fg-muted font-medium">Bạn sẽ nhận thông báo ngay khi có kết quả. Bấm "Xem hồ sơ đã nộp" để xem lại nội dung.</p>
              </div>
            )}
          </div>
          <TimelinePanel req={activeReq} />
        </div>
      </div>
    );
  }

  // ---------- REJECTED / WITHDRAWN: xem + tạo mới ----------
  if (activeReq.status === 'REJECTED' || activeReq.status === 'WITHDRAWN') {
    return (
      <div className="space-y-7">
        {Notices}
        <StatusHero req={activeReq} sm={sm} ui={ui} heroDesc={heroDesc} extra={
          <div className="mt-6 pt-6 border-t border-line-soft flex items-center justify-between gap-3 flex-wrap">
            <p className="text-meta text-fg-muted font-medium">{activeReq.status === 'REJECTED' ? 'Theo quy định, hồ sơ bị từ chối cần tạo mới để nộp lại.' : 'Tạo hồ sơ mới để bắt đầu lại quy trình xác thực.'}</p>
            <button disabled={busy} onClick={createNew} className="inline-flex items-center gap-1.5 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Tạo hồ sơ mới</button>
          </div>
        } />
        <div className="grid lg:grid-cols-3 gap-7 items-start">
          <div className="lg:col-span-2"><DocumentsCard docs={docs} canUpload={false} /></div>
          <TimelinePanel req={activeReq} />
        </div>
      </div>
    );
  }

  // ---------- DRAFT / NEEDS_REVISION: wizard 3 bước (Hồ sơ -> Minh chứng -> Nộp) ----------
  return (
    <div className="space-y-7">
      {Notices}
      <StatusHero req={activeReq} sm={sm} ui={ui} heroDesc={heroDesc} />

      <div className="grid lg:grid-cols-3 gap-7 items-start">
        <div className="lg:col-span-2 space-y-7">
          <WizardSteps step={composeStep} />

          {/* ===== Bước 1: Hồ sơ chuyên môn ===== */}
          {composeStep === 1 && (
            <>
              {checklist && (
                <div className="meetmind-card p-6 rounded-card space-y-4">
                  <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><ListChecks className="w-5 h-5 text-primary" /> Yêu cầu hồ sơ</h3>
                  <div className="space-y-4">
                    {CHECKLIST_ROWS.map(({ key, label, hint, optional }) => (
                      <RequirementRow key={key} met={!!checklist[key]} label={label} hint={hint} optional={optional} />
                    ))}
                  </div>
                </div>
              )}

              {ProfileFields}

              <div className="flex items-center justify-end">
                <button disabled={busy} onClick={goToDocuments} className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50">
                  Lưu & Tiếp tục <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ===== Bước 2: Minh chứng ===== */}
          {composeStep === 2 && (
            <>
              <DocumentsCard
                docs={docs}
                canUpload={!!allowedActions?.canUploadDocuments}
                uploading={uploading}
                uploadingType={uploadingType}
                uploadError={uploadError}
                onUpload={handleUpload} onDelete={handleDelete}
              />
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setComposeStep(1)} className="inline-flex items-center gap-2 bg-surface-muted hover:bg-line/40 text-fg text-body font-bold py-2.5 px-4 rounded-field cursor-pointer border border-line transition-all"><ArrowLeft className="w-4 h-4" /> Quay lại</button>
                <button onClick={goToReview} className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer active:scale-95 transition-all shadow-md shadow-primary/20">Tiếp tục <ArrowRight className="w-4 h-4" /></button>
              </div>
            </>
          )}

          {/* ===== Bước 3: Xem lại & Nộp ===== */}
          {composeStep === 3 && (
            <>
              {ProfileSummary}
              <DocumentsCard docs={docs} canUpload={false} />

              <div className="meetmind-card p-6 rounded-card space-y-4">
                <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> {activeReq.status === 'NEEDS_REVISION' ? 'Nộp lại hồ sơ' : 'Hoàn tất & nộp hồ sơ'}</h3>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase tracking-wide mb-1.5">Ghi chú gửi admin (tuỳ chọn)</label>
                  <textarea rows={2} value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} placeholder="Ví dụ: Em bổ sung lại ảnh thẻ rõ nét và thêm chứng chỉ AWS…" className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium" />
                </div>
                <label className="flex items-center gap-2 text-meta font-bold text-fg-muted cursor-pointer">
                  {termsAccepted ? <CheckSquare className="w-4.5 h-4.5 text-primary shrink-0" /> : <Square className="w-4.5 h-4.5 text-fg-faint shrink-0" />}
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="hidden" />
                  Tôi xác nhận thông tin và minh chứng đã cung cấp là chính xác.
                </label>
                {!allowedActions?.canSubmit && (
                  <p className="text-meta text-fg-faint font-medium inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Hoàn thiện đủ các yêu cầu bắt buộc (xem bước 1 & 2) để có thể nộp hồ sơ.</p>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                  <button onClick={() => setComposeStep(2)} className="inline-flex items-center gap-2 bg-surface-muted hover:bg-line/40 text-fg text-body font-bold py-2.5 px-4 rounded-field cursor-pointer border border-line transition-all"><ArrowLeft className="w-4 h-4" /> Quay lại</button>
                  <button disabled={busy || !termsAccepted || !allowedActions?.canSubmit} onClick={submitVerification} className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"><Send className="w-4 h-4" /> {activeReq.status === 'NEEDS_REVISION' ? 'Nộp lại' : 'Nộp hồ sơ duyệt'}</button>
                </div>
              </div>
            </>
          )}
        </div>

        <TimelinePanel req={activeReq} />
      </div>

      {/* Edit History Timeline Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 relative shadow-2xl space-y-4 text-left flex flex-col max-h-[85vh]">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-muted hover:opacity-85 text-fg-muted cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pr-6">
              <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Lịch sử chỉnh sửa hồ sơ
              </h3>
              <p className="text-meta text-fg-muted leading-relaxed font-semibold">
                Nhật ký các lần thay đổi trạng thái và phản hồi từ quản trị viên hệ thống.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-0 pt-2 custom-scrollbar">
              {historyLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : historyError ? (
                <p className="text-meta text-danger font-bold text-center py-6">{historyError}</p>
              ) : historyEvents.length === 0 ? (
                <p className="text-meta text-fg-muted font-medium text-center py-8">Chưa có lịch sử chỉnh sửa nào.</p>
              ) : (
                <div className="space-y-0 pl-1">
                  {historyEvents.map((e, i, arr) => (
                    <div key={e.id || i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`w-3 h-3 rounded-full mt-1 ${EVENT_DOT[e.eventType] || 'bg-primary'}`} />
                        {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-line my-1" />}
                      </div>
                      <div className="pb-5">
                        <p className="text-body font-bold text-fg leading-tight">{eventLabel(e.eventType)}</p>
                        <p className="text-meta text-fg-muted font-medium mt-1">{fmtDateTime(e.createdAt)}</p>
                        {e.actorFullName && <p className="text-meta text-fg-faint font-medium">{e.actorFullName}</p>}
                        {e.note && <p className="text-meta text-fg-muted font-medium mt-0.5 italic">"${e.note}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-line-soft flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="py-2.5 px-5 bg-surface-muted hover:opacity-85 rounded-field text-meta font-bold text-fg-muted border border-line cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {activeAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 relative shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setActiveAddModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-muted hover:opacity-80 text-fg-muted cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            {activeAddModal === 'project' && (
              <div className="space-y-4">
                <h3 className="text-title font-bold text-fg">Thêm dự án mới</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Tên dự án *</label>
                    <input type="text" placeholder="VD: App FinVibe" value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Vai trò trong dự án *</label>
                    <input type="text" placeholder="VD: Lead Developer" value={newProjRole} onChange={(e) => setNewProjRole(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mô tả dự án *</label>
                  <textarea rows={3} placeholder="Mô tả mục tiêu, cách thực hiện dự án..." value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} className="w-full bg-surface border border-line rounded-field p-2.5 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Link demo (Tùy chọn)</label>
                    <input type="url" placeholder="GitHub hoặc Figma Link..." value={newProjFigma} onChange={(e) => setNewProjFigma(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Ảnh minh họa (Tệp ảnh, tùy chọn)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setProjectImageFile(file);
                      }}
                      className="w-full bg-surface border border-line rounded-field py-1.5 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setActiveAddModal(null)} className="py-2 px-4 bg-surface border border-line rounded-field text-meta font-bold text-fg hover:bg-surface-muted cursor-pointer">Hủy</button>
                  <button type="button" onClick={async () => {
                    await handleAddProject();
                    setActiveAddModal(null);
                  }} className="py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-field text-meta font-bold cursor-pointer">Thêm dự án</button>
                </div>
              </div>
            )}

            {activeAddModal === 'achievement' && (
              <div className="space-y-4">
                <h3 className="text-title font-bold text-fg">Thêm học vấn/giải thưởng mới</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Tiêu đề *</label>
                    <input type="text" placeholder="VD: Thủ khoa FPTU" value={newAchTitle} onChange={(e) => setNewAchTitle(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Ngày đạt *</label>
                    <input type="date" value={newAchDate} onChange={(e) => setNewAchDate(e.target.value)} className="w-full bg-surface border border-line rounded-field py-1.5 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mô tả chi tiết *</label>
                  <textarea rows={3} placeholder="Mô tả cụ thể..." value={newAchDesc} onChange={(e) => setNewAchDesc(e.target.value)} className="w-full bg-surface border border-line rounded-field p-2.5 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold resize-none" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setActiveAddModal(null)} className="py-2 px-4 bg-surface border border-line rounded-field text-meta font-bold text-fg hover:bg-surface-muted cursor-pointer">Hủy</button>
                  <button type="button" onClick={async () => {
                    await handleAddAchievement();
                    setActiveAddModal(null);
                  }} className="py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-field text-meta font-bold cursor-pointer">Lưu thành tích</button>
                </div>
              </div>
            )}

            {activeAddModal === 'blog' && (
              <div className="space-y-4">
                <h3 className="text-title font-bold text-fg">Thêm bài viết / Blog mới</h3>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Tiêu đề bài viết *</label>
                  <input type="text" placeholder="VD: Kinh nghiệm làm đồ án tốt nghiệp" value={newBlogTitle} onChange={(e) => setNewBlogTitle(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold" />
                </div>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Chủ đề bài viết *</label>
                  <select
                    value={newBlogHelpTopicId}
                    onChange={(e) => setNewBlogHelpTopicId(e.target.value)}
                    className="w-full bg-surface border border-line rounded-field py-2 px-3 text-meta text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                  >
                    <option value="">Chọn chủ đề</option>
                    {helpTopicsCatalog.map((topic) => (
                      <option key={topic.id} value={topic.id}>{topic.nameVi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Nội dung bài viết *</label>
                  <textarea rows={5} placeholder="Nhập nội dung chia sẻ hoặc kinh nghiệm của bạn ở đây..." value={newBlogContent} onChange={(e) => setNewBlogContent(e.target.value)} className="w-full bg-surface border border-line rounded-field p-2.5 text-meta text-fg focus:outline-none focus:border-primary/50 font-semibold resize-none" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setActiveAddModal(null)} className="py-2 px-4 bg-surface border border-line rounded-field text-meta font-bold text-fg hover:bg-surface-muted cursor-pointer">Hủy</button>
                  <button type="button" onClick={async () => {
                    await handleAddBlog();
                    setActiveAddModal(null);
                  }} className="py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-field text-meta font-bold cursor-pointer">Đăng bài viết</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components dùng chung
// ---------------------------------------------------------------------------
const StatusHero: React.FC<{ req: VerificationRequest; sm: typeof STATUS_META[VerificationStatus]; ui: typeof STATE_UI[VerificationStatus]; heroDesc: Record<VerificationStatus, string>; extra?: React.ReactNode }> = ({ req, sm, ui, heroDesc, extra }) => (
  <div className="meetmind-card rounded-card overflow-hidden">
    <div className={`h-1 ${ui.bar}`} />
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <span className={`inline-flex items-center gap-1.5 text-meta font-extrabold uppercase tracking-wide py-1 px-2.5 rounded-lg border ${sm.cls}`}>{sm.icon}{sm.label}</span>
        {req.requestId && <span className="text-meta text-fg-faint font-medium">Hồ sơ #{req.requestId}</span>}
      </div>
      <div className="flex items-start gap-4 sm:gap-5 mt-3">
        <div className={`w-14 h-14 rounded-card flex items-center justify-center shrink-0 ${ui.iconWrap}`}>{ui.icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-title font-extrabold text-fg">{ui.title}{req.status === 'APPROVED' && ' 🎉'}</h2>
          <p className="text-body text-fg-muted font-medium mt-1 leading-relaxed" style={{ textWrap: 'pretty' }}>{heroDesc[req.status]}</p>
          {req.submittedAt && req.status !== 'DRAFT' && (
            <p className="text-meta text-fg-faint font-medium mt-2 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Nộp lúc {fmtDateTime(req.submittedAt)}</p>
          )}
        </div>
      </div>
      {ui.step >= 0 && <div className="mt-6 pt-6 border-t border-line-soft"><JourneyBar step={ui.step} /></div>}
      {extra}
    </div>
  </div>
);

const DocumentsCard: React.FC<{
  docs: VerificationRequest['documents'];
  canUpload: boolean;
  uploading?: boolean;
  uploadingType?: DocumentType | null;
  uploadError?: string | null;
  onUpload?: (type: DocumentType, file?: File) => void;
  onDelete?: (id: string) => void;
}> = ({ docs, canUpload, uploading, uploadingType, uploadError, onUpload, onDelete }) => {
  const cardConfigs: {
    type: DocumentType;
    title: string;
    desc: string;
    required: boolean;
  }[] = [
    {
      type: 'FPTU_AFFILIATION_PROOF',
      title: 'Minh chứng liên kết FPTU',
      desc: 'Thẻ sinh viên, bảng điểm hoặc email FPTU — bắt buộc.',
      required: true,
    },
    {
      type: 'EXPERTISE_PROOF',
      title: 'Minh chứng chuyên môn',
      desc: 'Chứng chỉ, hợp đồng lao động hoặc portfolio — bắt buộc.',
      required: true,
    },
  ];

  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleView = async (docId: string) => {
    if (viewingId) return;
    setViewingId(docId);
    try {
      const docDetail = await mentorVerificationApi.getDocument(docId);
      if (docDetail?.fileUrl) {
        window.open(docDetail.fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Tệp tin không có URL tải về.');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tải thông tin tệp tin.');
    } finally {
      setViewingId(null);
    }
  };

  return (
    <div className="meetmind-card p-6 rounded-card space-y-5">
      <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
        <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-primary" /> Minh chứng xác thực
        </h3>
        <span className="text-meta font-bold text-fg-muted">{docs.length} tệp đã tải lên</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cardConfigs.map(({ type, title, desc, required }) => {
          const typeDocs = docs.filter((d) => d.documentType === type);
          const hasDoc = typeDocs.length > 0;
          const isUploadingThis = uploading && uploadingType === type;

          return (
            <div
              key={type}
              className={`border rounded-card p-5 flex flex-col justify-between transition-all duration-300 ${
                hasDoc
                  ? 'border-success/30 bg-success/5 shadow-sm'
                  : required
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-line bg-surface'
              }`}
            >
              {/* Header của thẻ minh chứng */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Ô check hiển thị trạng thái đã nộp */}
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      hasDoc
                        ? 'bg-success border-success text-white'
                        : required
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-600'
                        : 'border-line bg-surface-muted text-fg-faint'
                    }`}
                  >
                    {hasDoc && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-body font-bold text-fg leading-snug">{title}</h4>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded mt-1.5 inline-block ${
                        hasDoc
                          ? 'bg-success/15 text-success'
                          : required
                          ? 'bg-amber-500/15 text-amber-700'
                          : 'bg-surface-muted text-fg-muted border border-line-soft'
                      }`}
                    >
                      {hasDoc ? 'Đã tải lên' : required ? 'Bắt buộc' : 'Tùy chọn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết về loại minh chứng */}
              <p className="text-meta text-fg-muted font-medium mt-3.5 leading-relaxed min-h-[40px]">
                {desc}
              </p>

              {/* Danh sách tệp đã tải lên thuộc loại này */}
              {typeDocs.length > 0 && (
                <div className="mt-4 pt-3 border-t border-line-soft space-y-2">
                  {typeDocs.map((d) => {
                    const isImg = d.contentType?.startsWith('image');
                    const sizeKb = d.sizeBytes ? Math.max(1, Math.round(d.sizeBytes / 1024)) : undefined;
                    return (
                      <div
                        key={d.id}
                        className="flex items-center gap-2.5 bg-surface border border-line rounded-field p-2 transition-all hover:border-primary/30"
                      >
                        {isImg && d.fileUrl ? (
                          <button
                            type="button"
                            onClick={() => handleView(d.id)}
                            disabled={viewingId === d.id}
                            className="w-10 h-10 rounded-field overflow-hidden shrink-0 border border-line bg-surface-muted cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                          >
                            <img src={d.fileUrl} alt={d.originalFilename} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-field flex items-center justify-center shrink-0 ${
                              isImg ? 'bg-accent/12 text-accent' : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {isImg ? <ImageIcon className="w-4.5 h-4.5" /> : <FileText className="w-4.5 h-4.5" />}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex flex-col justify-start items-start">
                          <button
                            type="button"
                            onClick={() => handleView(d.id)}
                            disabled={viewingId === d.id}
                            className="text-meta font-bold text-fg truncate block hover:text-primary hover:underline text-left w-full cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          >
                            {viewingId === d.id ? 'Đang tải tệp...' : d.originalFilename}
                          </button>
                          <p className="text-[10px] text-fg-muted font-medium">
                            {sizeKb ? `${sizeKb} KB` : ''}
                          </p>
                        </div>
                        {canUpload && onDelete && (
                          <button
                            onClick={() => onDelete(d.id)}
                            className="p-1.5 rounded-field text-fg-muted hover:text-danger hover:bg-danger/10 cursor-pointer transition-all shrink-0"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Nút/Khu vực tải lên riêng cho loại này */}
              {canUpload && onUpload && (
                <div className="mt-4">
                  <label
                    className={`w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-field py-4 transition-all group ${
                      isUploadingThis
                        ? 'border-primary/40 text-primary cursor-wait bg-primary-soft'
                        : 'border-line text-fg-muted hover:text-primary hover:border-primary/40 hover:bg-primary-soft/10 cursor-pointer'
                    }`}
                  >
                    {isUploadingThis ? (
                      <>
                        <UploadCloud className="w-5 h-5 animate-pulse text-primary" />
                        <span className="text-meta font-bold text-fg">Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-fg-faint group-hover:text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-meta font-bold text-fg">
                          Kéo thả hoặc <span className="text-primary">chọn tệp</span>
                        </span>
                        <span className="text-[10px] text-fg-faint font-medium">Tối đa 10MB (ảnh tự nén)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) onUpload(type, f);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lỗi tải lên — hiển thị ở dưới cùng của DocumentsCard */}
      {uploadError && <ErrorBubble msg={uploadError} />}
    </div>
  );
};

const TimelinePanel: React.FC<{ req: VerificationRequest }> = ({ req }) => (
  <div className="meetmind-card p-6 rounded-card lg:sticky lg:top-6">
    <h3 className="text-title font-bold font-sans text-fg flex items-center gap-2 border-b border-line-soft pb-2.5 mb-4"><Clock className="w-5 h-5 text-primary" /> Lịch sử xử lý</h3>
    <div className="space-y-0">
      {(req.timeline || []).map((e, i, arr) => (
        <div key={e.id || i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`w-3 h-3 rounded-full mt-1 ${EVENT_DOT[e.eventType] || 'bg-primary'}`} />
            {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-line my-1" />}
          </div>
          <div className="pb-5">
            <p className="text-body font-bold text-fg leading-tight">{eventLabel(e.eventType)}</p>
            <p className="text-meta text-fg-muted font-medium mt-1">{fmtDateTime(e.createdAt)}</p>
            {e.actorFullName && <p className="text-meta text-fg-faint font-medium">{e.actorFullName}</p>}
            {e.note && <p className="text-meta text-fg-muted font-medium mt-0.5 italic">"{e.note}"</p>}
          </div>
        </div>
      ))}
      {(req.timeline?.length ?? 0) === 0 && <p className="text-meta text-fg-muted font-medium">Chưa có hoạt động nào.</p>}
    </div>
  </div>
);
