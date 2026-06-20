import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, UploadCloud, FileText, Image as ImageIcon, Trash2, Send,
  Clock, CheckCircle2, XCircle, AlertTriangle, Undo2, Plus, Paperclip,
  ListChecks, Lock, Inbox, Check, Square, CheckSquare, Settings, Tags, Link2,
  Pencil, Award, Briefcase, Monitor, ExternalLink, Lightbulb, UserPlus,
  ArrowRight, ArrowLeft,
} from 'lucide-react';
import { mentorVerificationApi } from '../../api/mentorVerification';
import { mentorProfileApi, helpTopicApi } from '../../api/mentorProfile';
import type {
  VerificationRequest, VerificationStatus, DocumentType,
  HelpTopic, TeachingMode, SessionDuration, MentorProfileResponse,
} from '../../api/types';

// SĐT VN — BE bắt buộc field này khi lưu hồ sơ mentor.
const PHONE_RE = /^(0)(3|5|7|8|9)[0-9]{8}$/;

// ---------------------------------------------------------------------------
// Cấu hình hiển thị
// ---------------------------------------------------------------------------
const DOC_TYPES: Record<DocumentType, string> = {
  FPTU_AFFILIATION_PROOF: 'Minh chứng liên kết FPTU',
  EXPERTISE_PROOF: 'Minh chứng chuyên môn',
};

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
  { key: 'hasExpertiseProof', label: 'Minh chứng chuyên môn', hint: 'Chứng chỉ, hợp đồng lao động hoặc portfolio — giúp duyệt nhanh hơn.', optional: true },
];

const SESSION_DURATIONS: SessionDuration[] = [15, 30, 60, 90];
const TEACHING_MODES: { value: TeachingMode; label: string }[] = [
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'OFFLINE', label: 'Trực tiếp' },
  { value: 'HYBRID', label: 'Kết hợp' },
];
const TEACHING_MODE_LABELS: Record<TeachingMode, string> = { ONLINE: 'Trực tuyến', OFFLINE: 'Trực tiếp', HYBRID: 'Kết hợp' };

const HEADLINE_MAX = 200;
const EXPERTISE_MAX = 1000;
const SUPPORTING_MAX = 1000;
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
      <p className="text-body font-bold text-fg leading-snug">{label}{optional && <span className="text-fg-faint font-semibold"> · tuỳ chọn</span>}</p>
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

// Chỉ báo các bước soạn hồ sơ (wizard): Hồ sơ -> Minh chứng -> Nộp.
const WizardSteps: React.FC<{ step: 1 | 2 | 3 }> = ({ step }) => {
  const items = [
    { n: 1, label: 'Hồ sơ chuyên môn' },
    { n: 2, label: 'Minh chứng' },
    { n: 3, label: 'Nộp hồ sơ' },
  ];
  return (
    <div className="meetmind-card p-5 rounded-card">
      <div className="flex items-center">
        {items.map((it, i) => {
          const done = it.n < step, active = it.n === step;
          return (
            <React.Fragment key={it.n}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-meta font-extrabold shrink-0 ${done ? 'bg-primary text-on-action' : active ? 'bg-primary-soft text-primary ring-2 ring-primary/30' : 'bg-surface-muted text-fg-faint'}`}>
                  {done ? <Check className="w-4 h-4" /> : it.n}
                </span>
                <span className={`text-body font-bold truncate ${active || done ? 'text-fg' : 'text-fg-faint'}`}>{it.label}</span>
              </div>
              {i < items.length - 1 && <div className={`flex-1 h-0.5 mx-3 rounded ${it.n < step ? 'bg-primary' : 'bg-surface-muted'}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
export const MentorPanel: React.FC = () => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [req, setReq] = useState<VerificationRequest | null>(null);

  // Mentor profile form (đúng field thật của MentorProfilePayload)
  const [headline, setHeadline] = useState('');
  const [expertiseDescription, setExpertiseDescription] = useState('');
  const [supportingSubjects, setSupportingSubjects] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [helpTopicIds, setHelpTopicIds] = useState<string[]>([]);
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('ONLINE');
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(60);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [helpTopicsCatalog, setHelpTopicsCatalog] = useState<HelpTopic[]>([]);
  const [hydrated, setHydrated] = useState(false); // đã tải xong để bật tự lưu nháp
  const [uploading, setUploading] = useState(false); // đang upload minh chứng

  // Document upload controls
  const [docType, setDocType] = useState<DocumentType>('FPTU_AFFILIATION_PROOF');
  const [submitNote, setSubmitNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Edit mode dành cho mentor đã APPROVED muốn cập nhật lại hồ sơ
  const [editingApproved, setEditingApproved] = useState(false);

  // Wizard soạn hồ sơ (DRAFT/NEEDS_REVISION): 1=Hồ sơ → 2=Minh chứng → 3=Nộp
  const [composeStep, setComposeStep] = useState<1 | 2 | 3>(1);
  // Xem trước hồ sơ đã nộp (ở trạng thái Chờ duyệt)
  const [showPreview, setShowPreview] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flash = (m: string, ms = 3000) => { setMsg(m); setTimeout(() => setMsg(null), ms); };

  const fillProfileForm = (p: MentorProfileResponse) => {
    setHeadline(p.headline ?? '');
    setExpertiseDescription(p.expertiseDescription ?? '');
    setSupportingSubjects(p.supportingSubjects ?? '');
    setIsAvailable(p.isAvailable ?? true);
    // BE trả helpTopics (mảng tag), map về danh sách id để binding chip.
    setHelpTopicIds((p.helpTopics ?? []).map((t) => t.id));
    setTeachingMode(p.teachingMode ?? 'ONLINE');
    setSessionDuration(p.sessionDuration ?? 60);
    setPhoneNumber(p.phoneNumber ?? '');
    setLinkedinUrl(p.linkedinUrl ?? '');
    setGithubUrl(p.githubUrl ?? '');
    setPortfolioUrl(p.portfolioUrl ?? '');
  };

  // Khôi phục nháp đã lưu ở localStorage (giữ thông tin chưa lưu khi reload).
  const applyDraft = (d: Record<string, unknown>) => {
    if (!d || typeof d !== 'object') return;
    if (typeof d.headline === 'string') setHeadline(d.headline);
    if (typeof d.expertiseDescription === 'string') setExpertiseDescription(d.expertiseDescription);
    if (typeof d.supportingSubjects === 'string') setSupportingSubjects(d.supportingSubjects);
    if (typeof d.isAvailable === 'boolean') setIsAvailable(d.isAvailable);
    if (Array.isArray(d.helpTopicIds)) setHelpTopicIds(d.helpTopicIds as string[]);
    if (d.teachingMode) setTeachingMode(d.teachingMode as TeachingMode);
    if (d.sessionDuration) setSessionDuration(d.sessionDuration as SessionDuration);
    if (typeof d.phoneNumber === 'string') setPhoneNumber(d.phoneNumber);
    if (typeof d.linkedinUrl === 'string') setLinkedinUrl(d.linkedinUrl);
    if (typeof d.githubUrl === 'string') setGithubUrl(d.githubUrl);
    if (typeof d.portfolioUrl === 'string') setPortfolioUrl(d.portfolioUrl);
  };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        const topics = await helpTopicApi.list();
        setHelpTopicsCatalog(topics || []);
      } catch (err) {
        console.warn('Không tải được danh sách help topics.', err);
      }

      let current: VerificationRequest | null = null;
      try {
        current = await mentorVerificationApi.getCurrent();
        try { current.timeline = await mentorVerificationApi.getTimeline(); } catch { /* optional */ }
      } catch (err: any) {
        if (err?.response?.status !== 404) throw err;
        current = null;
      }
      setReq(current);

      if (current) {
        try {
          const profile = await mentorProfileApi.get();
          if (profile) fillProfileForm(profile);
        } catch (err) {
          console.warn('Chưa có hồ sơ mentor, dùng form trống.', err);
        }
        // Khôi phục nháp chưa lưu (chỉ khi hồ sơ còn đang soạn).
        if (current.status === 'DRAFT' || current.status === 'NEEDS_REVISION') {
          try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) applyDraft(JSON.parse(raw));
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được hồ sơ mentor.');
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
        headline, expertiseDescription, supportingSubjects, isAvailable, helpTopicIds,
        teachingMode, sessionDuration, phoneNumber, linkedinUrl, githubUrl, portfolioUrl,
      }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, req?.status, headline, expertiseDescription, supportingSubjects, isAvailable, helpTopicIds, teachingMode, sessionDuration, phoneNumber, linkedinUrl, githubUrl, portfolioUrl]);

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

  const validateProfile = (): string | null => {
    if (!headline.trim()) return 'Vui lòng điền Headline.';
    if (headline.length > HEADLINE_MAX) return `Headline tối đa ${HEADLINE_MAX} ký tự.`;
    if (!expertiseDescription.trim()) return 'Vui lòng điền Mô tả chuyên môn.';
    if (expertiseDescription.length > EXPERTISE_MAX) return `Mô tả chuyên môn tối đa ${EXPERTISE_MAX} ký tự.`;
    if (supportingSubjects.length > SUPPORTING_MAX) return `Môn học hỗ trợ tối đa ${SUPPORTING_MAX} ký tự.`;
    if (helpTopicIds.length === 0) return 'Vui lòng chọn ít nhất 1 chủ đề hỗ trợ.';
    if (helpTopicIds.length > HELP_TOPICS_MAX) return `Chỉ được chọn tối đa ${HELP_TOPICS_MAX} chủ đề.`;
    if (!PHONE_RE.test(phoneNumber.trim())) return 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (VD: 0901234567).';
    return null;
  };

  const buildPayload = () => ({
    headline,
    expertiseDescription,
    supportingSubjects: supportingSubjects || undefined,
    isAvailable,
    helpTopicIds,
    teachingMode,
    sessionDuration,
    phoneNumber: phoneNumber.trim(),
    linkedinUrl: linkedinUrl || undefined,
    githubUrl: githubUrl || undefined,
    portfolioUrl: portfolioUrl || undefined,
  });

  const toggleHelpTopic = (id: string) => {
    setHelpTopicIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= HELP_TOPICS_MAX) return prev;
      return [...prev, id];
    });
  };

  // -------------------- actions --------------------
  const registerAsMentor = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await mentorVerificationApi.createOrGetRequest();
      setReq(r);
      flash('Đã tạo hồ sơ — hãy hoàn thiện thông tin bên dưới.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đăng ký làm mentor lúc này.');
    } finally {
      setBusy(false);
    }
  };

  const createNew = async () => {
    setBusy(true);
    setError(null);
    try {
      clearDraft();
      const r = await mentorVerificationApi.createOrGetRequest();
      setReq(r);
      flash('Đã tạo hồ sơ xác thực mới.');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo hồ sơ mới thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    const v = validateProfile();
    if (v) { setError(v); return; }
    setBusy(true);
    setError(null);
    try {
      await mentorProfileApi.update(buildPayload());
      flash('Đã lưu bản nháp.');
      // checklist (mentorProfileCompleted) có thể đổi sau khi lưu — đồng bộ lại với BE.
      try {
        const r = await mentorVerificationApi.getCurrent();
        r.timeline = req?.timeline;
        setReq(r);
      } catch { /* giữ req hiện tại nếu fetch lỗi */ }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu bản nháp thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const submitVerification = async () => {
    if (!termsAccepted) return;
    const v = validateProfile();
    if (v) { setError(v); return; }
    setBusy(true);
    setError(null);
    try {
      await mentorProfileApi.update(buildPayload());
      const r = await mentorVerificationApi.submit({ submitNote, termsAccepted: true });
      setReq(r);
      clearDraft();
      flash('🎉 Đã nộp hồ sơ thành công! Hồ sơ đang chờ admin duyệt.', 6000);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nộp hồ sơ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  // Wizard: B1 (Hồ sơ) -> B2 (Minh chứng). Kiểm tra hợp lệ + lưu nháp 1 lần rồi sang bước sau.
  const goToDocuments = async () => {
    const v = validateProfile();
    if (v) { setError(v); return; }
    await saveDraft();
    setComposeStep(2);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToReview = () => {
    setComposeStep(3);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (file?: File) => {
    if (!req || !file) return;
    setUploading(true);
    setError(null);
    try {
      const doc = await mentorVerificationApi.uploadDocument({ documentType: docType, file });
      // cập nhật lạc quan + làm mới ngầm (giữ nguyên vị trí cuộn, không remount panel)
      setReq((prev) => (prev ? { ...prev, documents: [...prev.documents, doc] } : prev));
      flash('Đã tải lên minh chứng.');
      await refreshRequest();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tải minh chứng thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!req) return;
    setBusy(true);
    setError(null);
    try {
      await mentorVerificationApi.deleteDocument(documentId);
      setReq((prev) => (prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== documentId) } : prev));
      flash('Đã xoá minh chứng.');
      await refreshRequest();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xoá minh chứng thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!req) return;
    setBusy(true);
    setError(null);
    try {
      const r = await mentorVerificationApi.withdraw();
      setReq(r);
      clearDraft();
      flash('Đã rút hồ sơ.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rút hồ sơ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const saveApprovedProfile = async () => {
    const v = validateProfile();
    if (v) { setError(v); return; }
    setBusy(true);
    setError(null);
    try {
      await mentorProfileApi.update(buildPayload());
      flash('Đã lưu thay đổi hồ sơ mentor.');
      setEditingApproved(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu thay đổi thất bại.');
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
      {error && (
        <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 text-danger p-4 rounded-field text-body font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {msg && <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success p-3 rounded-field text-body font-semibold"><CheckCircle2 className="w-4 h-4" />{msg}</div>}
    </>
  );

  // ---------- Chưa từng đăng ký làm mentor ----------
  if (checked && !req) {
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

  if (!req) return null;
  const sm = STATUS_META[req.status];
  const ui = STATE_UI[req.status];

  const heroDesc: Record<VerificationStatus, string> = {
    DRAFT: 'Hoàn thiện hồ sơ chuyên môn và tải tối thiểu 1 minh chứng liên kết FPTU rồi nộp để admin duyệt.',
    PENDING_REVIEW: 'Hồ sơ đã được nộp và đang trong hàng chờ. Bạn sẽ nhận thông báo ngay khi có kết quả.',
    NEEDS_REVISION: req.reviewNote || 'Vui lòng cập nhật theo ghi chú của admin và nộp lại.',
    APPROVED: 'Chúc mừng! Bạn đã chính thức là Mentor và hồ sơ đã hiển thị công khai trong mục Khám phá.',
    REJECTED: req.reviewNote || 'Hồ sơ chưa đạt yêu cầu. Tạo hồ sơ mới để nộp lại.',
    WITHDRAWN: 'Hồ sơ xác thực đã được rút lại. Bạn có thể tạo hồ sơ mới bất cứ lúc nào.',
  };

  const resolvedHelpTopics = helpTopicIds.map((id) => helpTopicsCatalog.find((t) => t.id === id)).filter((t): t is HelpTopic => !!t);
  const supportingTags = supportingSubjects.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  // Số tối đa hiển thị = min(giới hạn BE, số chủ đề thực có) để không hiện "/20" khi catalog ít hơn.
  const helpMax = Math.min(HELP_TOPICS_MAX, helpTopicsCatalog.length || HELP_TOPICS_MAX);

  // ---------- Form chỉnh sửa hồ sơ chuyên môn (dùng chung cho mọi trạng thái cần soạn) ----------
  const ProfileFields = (
    <>
      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><Settings className="w-5 h-5 text-primary" /> Mô tả năng lực</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Headline ({headline.length}/{HEADLINE_MAX})</label>
            <input type="text" maxLength={HEADLINE_MAX} value={headline} onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ví dụ: Chuyên gia phát triển Web Fullstack | Hỗ trợ đồ án"
              className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-semibold" />
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Mô tả chuyên môn ({expertiseDescription.length}/{EXPERTISE_MAX})</label>
            <textarea rows={4} maxLength={EXPERTISE_MAX} value={expertiseDescription} onChange={(e) => setExpertiseDescription(e.target.value)}
              placeholder="Giới thiệu kinh nghiệm, kỹ năng và cách bạn hỗ trợ mentee."
              className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium" />
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Môn học hỗ trợ ({supportingSubjects.length}/{SUPPORTING_MAX}, không bắt buộc)</label>
            <textarea rows={2} maxLength={SUPPORTING_MAX} value={supportingSubjects} onChange={(e) => setSupportingSubjects(e.target.value)}
              placeholder="Ví dụ: PRJ301, SWP391, EXE101..."
              className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium" />
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Số điện thoại liên hệ <span className="text-danger">*</span></label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="VD: 0901234567"
              className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-semibold" />
          </div>
          {/* Toggle trạng thái sẵn sàng — to, rõ, có chú thích có thể tắt đi */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-field border border-line bg-surface-muted/40">
            <div className="min-w-0">
              <p className="text-body font-bold text-fg">Sẵn sàng nhận mentee</p>
              <p className="text-meta text-fg-muted font-medium mt-0.5">
                {isAvailable
                  ? 'Hồ sơ đang hiển thị công khai và nhận lịch hẹn mới.'
                  : 'Đang tạm ngưng — bạn sẽ không nhận lịch hẹn mới. Có thể bật lại bất cứ lúc nào.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              onClick={() => setIsAvailable((v) => !v)}
              className={`relative shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer ${isAvailable ? 'bg-success' : 'bg-line'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-surface shadow transition-transform ${isAvailable ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="meetmind-card p-6 rounded-card space-y-3">
        <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><Link2 className="w-5 h-5 text-primary" /> Liên kết (không bắt buộc)</h3>
        <div className="space-y-3">
          <input type="url" placeholder="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-medium" />
          <input type="url" placeholder="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-medium" />
          <input type="url" placeholder="Portfolio URL" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-medium" />
        </div>
      </div>

      <div className="meetmind-card p-6 rounded-card space-y-3">
        <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><Tags className="w-5 h-5 text-primary" /> Chủ đề hỗ trợ ({helpTopicIds.length}/{helpMax})</h3>
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
      </div>

      <div className="meetmind-card p-6 rounded-card space-y-4">
        <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><Monitor className="w-5 h-5 text-primary" /> Hình thức & thời lượng buổi học</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Hình thức</label>
            <select value={teachingMode} onChange={(e) => setTeachingMode(e.target.value as TeachingMode)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold">
              {TEACHING_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-meta font-bold text-fg-muted uppercase mb-1">Thời lượng (phút)</label>
            <select value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value) as SessionDuration)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold">
              {SESSION_DURATIONS.map((d) => <option key={d} value={d}>{d} phút</option>)}
            </select>
          </div>
        </div>
      </div>
    </>
  );

  // ---------- Xem trước hồ sơ (read-only) — dùng cho bước Nộp & trạng thái Chờ duyệt ----------
  const ProfileSummary = (
    <div className="meetmind-card p-7 rounded-card space-y-6">
      <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><ShieldCheck className="w-5 h-5 text-primary" /> Hồ sơ chuyên môn</h3>
      <div>
        <p className="text-body font-bold text-fg leading-snug">{headline || 'Chưa có headline'}</p>
        <p className="text-body text-fg-muted font-medium mt-2 leading-relaxed" style={{ textWrap: 'pretty' }}>{expertiseDescription || 'Chưa có mô tả chuyên môn.'}</p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-body">
        <span><span className="text-fg-muted font-semibold">Hình thức:</span> <span className="font-bold text-fg">{TEACHING_MODE_LABELS[teachingMode]}</span></span>
        <span><span className="text-fg-muted font-semibold">Thời lượng:</span> <span className="font-bold text-fg">{sessionDuration} phút/buổi</span></span>
        <span><span className="text-fg-muted font-semibold">Trạng thái:</span> <span className="font-bold text-fg">{isAvailable ? 'Đang nhận mentee' : 'Tạm ngưng'}</span></span>
        {phoneNumber && <span><span className="text-fg-muted font-semibold">SĐT:</span> <span className="font-bold text-fg">{phoneNumber}</span></span>}
      </div>
      {supportingTags.length > 0 && (
        <div>
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-2">Môn học hỗ trợ</p>
          <div className="flex flex-wrap gap-2">{supportingTags.map((t) => (<span key={t} className="py-1.5 px-3 rounded-pill bg-primary-soft text-primary border border-primary/15 text-meta font-extrabold">{t}</span>))}</div>
        </div>
      )}
      {resolvedHelpTopics.length > 0 && (
        <div>
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-2">Chủ đề hỗ trợ</p>
          <div className="flex flex-wrap gap-2">{resolvedHelpTopics.map((t) => (<span key={t.id} className="py-1.5 px-3 rounded-lg bg-surface border border-line text-fg-muted text-meta font-bold">{t.nameVi}</span>))}</div>
        </div>
      )}
      {(linkedinUrl || githubUrl || portfolioUrl) && (
        <div>
          <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-2">Liên kết</p>
          <div className="flex flex-wrap gap-2.5">
            {[{ label: 'LinkedIn', url: linkedinUrl }, { label: 'GitHub', url: githubUrl }, { label: 'Portfolio', url: portfolioUrl }].filter((l) => l.url).map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 px-3.5 rounded-field border border-line bg-surface text-body font-bold text-fg-muted hover:text-primary transition-all">{l.label}<ExternalLink className="w-3 h-3" /></a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ---------- APPROVED: hồ sơ mentor đã kích hoạt ----------
  if (req.status === 'APPROVED' && !editingApproved) {
    return (
      <div className="space-y-7">
        {Notices}
        <div className="grid sm:grid-cols-3 gap-4">
          <FactStat icon={<Monitor className="w-4.5 h-4.5" />} label="Hình thức" value={TEACHING_MODE_LABELS[teachingMode]} />
          <FactStat icon={<Clock className="w-4.5 h-4.5" />} label="Thời lượng" value={`${sessionDuration} phút/buổi`} />
          <FactStat icon={<Briefcase className="w-4.5 h-4.5" />} label="Trạng thái" value={isAvailable ? 'Đang nhận mentee' : 'Tạm ngưng'} tone={isAvailable ? 'success' : 'primary'} />
        </div>

        <div className="meetmind-card p-7 rounded-card space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-2.5">
            <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-success" /> Hồ sơ Mentor <span className={`ml-2 inline-flex items-center gap-1 text-meta font-extrabold py-0.5 px-2 rounded-lg border ${sm.cls}`}>{sm.icon}{sm.label}</span></h3>
            <button onClick={() => setEditingApproved(true)} className="inline-flex items-center gap-1.5 bg-primary-soft text-primary hover:bg-primary/15 text-meta font-bold py-2 px-3 rounded-field cursor-pointer transition-all"><Pencil className="w-3.5 h-3.5" /> Cấu hình</button>
          </div>

          <div>
            <p className="text-body font-bold text-fg leading-snug">{headline}</p>
            <p className="text-body text-fg-muted font-medium mt-2 leading-relaxed" style={{ textWrap: 'pretty' }}>{expertiseDescription}</p>
          </div>

          {supportingTags.length > 0 && (
            <div>
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-3">Môn học hỗ trợ</p>
              <div className="flex flex-wrap gap-2">
                {supportingTags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-2 py-2 px-3.5 rounded-pill bg-primary-soft text-primary border border-primary/15 text-meta font-extrabold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resolvedHelpTopics.length > 0 && (
            <div>
              <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-3">Chủ đề có thể hỗ trợ</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {resolvedHelpTopics.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-field border border-line bg-surface-muted/40">
                    <div className="w-9 h-9 rounded-field bg-accent/12 text-accent flex items-center justify-center shrink-0"><Lightbulb className="w-4 h-4" /></div>
                    <p className="text-body font-bold text-fg">{t.nameVi}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-5 border-t border-line-soft">
            <p className="text-meta font-bold uppercase tracking-wide text-fg-faint mb-3">Liên kết</p>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: 'LinkedIn', url: linkedinUrl },
                { label: 'GitHub', url: githubUrl },
                { label: 'Portfolio', url: portfolioUrl },
              ].filter((l) => l.url).map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 px-3.5 rounded-field border border-line bg-surface text-body font-bold text-fg-muted hover:text-primary hover:border-primary/40 transition-all">
                  {l.label}<ExternalLink className="w-3 h-3 text-fg-faint" />
                </a>
              ))}
              {!linkedinUrl && !githubUrl && !portfolioUrl && <p className="text-meta text-fg-faint font-medium">Chưa cập nhật liên kết.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- APPROVED + đang chỉnh sửa: chỉ sửa field hồ sơ, không qua bước nộp duyệt ----------
  if (req.status === 'APPROVED' && editingApproved) {
    return (
      <div className="space-y-6">
        {Notices}
        <div className="flex items-center justify-between">
          <h3 className="text-title font-bold font-serif text-fg">Cấu hình hồ sơ Mentor</h3>
          <button onClick={() => { setEditingApproved(false); setError(null); }} className="text-meta font-bold text-fg-muted hover:text-fg cursor-pointer">Huỷ</button>
        </div>
        {ProfileFields}
        <button disabled={busy} onClick={saveApprovedProfile} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-3 px-6 rounded-field cursor-pointer disabled:opacity-50 transition-all">
          <Check className="w-4 h-4" /> Lưu thay đổi
        </button>
      </div>
    );
  }

  // ---------- PENDING_REVIEW: chỉ hiển thị trạng thái + nút xem trước & rút hồ sơ (KHÔNG cho sửa) ----------
  if (req.status === 'PENDING_REVIEW') {
    return (
      <div className="space-y-7">
        {Notices}
        <StatusHero req={req} sm={sm} ui={ui} heroDesc={heroDesc} extra={
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
          <TimelinePanel req={req} />
        </div>
      </div>
    );
  }

  // ---------- REJECTED / WITHDRAWN: xem + tạo mới ----------
  if (req.status === 'REJECTED' || req.status === 'WITHDRAWN') {
    return (
      <div className="space-y-7">
        {Notices}
        <StatusHero req={req} sm={sm} ui={ui} heroDesc={heroDesc} extra={
          <div className="mt-6 pt-6 border-t border-line-soft flex items-center justify-between gap-3 flex-wrap">
            <p className="text-meta text-fg-muted font-medium">{req.status === 'REJECTED' ? 'Theo quy định, hồ sơ bị từ chối cần tạo mới để nộp lại.' : 'Tạo hồ sơ mới để bắt đầu lại quy trình xác thực.'}</p>
            <button disabled={busy} onClick={createNew} className="inline-flex items-center gap-1.5 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Tạo hồ sơ mới</button>
          </div>
        } />
        <div className="grid lg:grid-cols-3 gap-7 items-start">
          <div className="lg:col-span-2"><DocumentsCard docs={docs} canUpload={false} /></div>
          <TimelinePanel req={req} />
        </div>
      </div>
    );
  }

  // ---------- DRAFT / NEEDS_REVISION: wizard 3 bước (Hồ sơ -> Minh chứng -> Nộp) ----------
  return (
    <div className="space-y-7">
      {Notices}
      <StatusHero req={req} sm={sm} ui={ui} heroDesc={heroDesc} />

      <div className="grid lg:grid-cols-3 gap-7 items-start">
        <div className="lg:col-span-2 space-y-7">
          <WizardSteps step={composeStep} />

          {/* ===== Bước 1: Hồ sơ chuyên môn ===== */}
          {composeStep === 1 && (
            <>
              {checklist && (
                <div className="meetmind-card p-6 rounded-card space-y-4">
                  <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><ListChecks className="w-5 h-5 text-primary" /> Yêu cầu hồ sơ</h3>
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
                docType={docType} setDocType={setDocType}
                uploading={uploading}
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
                <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> {req.status === 'NEEDS_REVISION' ? 'Nộp lại hồ sơ' : 'Hoàn tất & nộp hồ sơ'}</h3>
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
                  <button disabled={busy || !termsAccepted || !allowedActions?.canSubmit} onClick={submitVerification} className="inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"><Send className="w-4 h-4" /> {req.status === 'NEEDS_REVISION' ? 'Nộp lại' : 'Nộp hồ sơ duyệt'}</button>
                </div>
              </div>
            </>
          )}
        </div>

        <TimelinePanel req={req} />
      </div>
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
  docType?: DocumentType; setDocType?: (v: DocumentType) => void;
  onUpload?: (file?: File) => void; onDelete?: (id: string) => void;
}> = ({ docs, canUpload, uploading, docType, setDocType, onUpload, onDelete }) => (
  <div className="meetmind-card p-6 rounded-card space-y-4">
    <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
      <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2"><Paperclip className="w-5 h-5 text-primary" /> Minh chứng</h3>
      <span className="text-meta font-bold text-fg-muted">{docs.length} tệp</span>
    </div>

    {/* Khu vực tải lên đặt LÊN TRÊN; danh sách/empty hiển thị bên dưới */}
    {canUpload && setDocType && onUpload && (
      <div className="space-y-3">
        <div>
          <label className="block text-meta font-bold text-fg-muted uppercase tracking-wide mb-1.5">Loại minh chứng</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} disabled={uploading} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold disabled:opacity-60">
            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <label className={`w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-field py-8 transition-all group ${uploading ? 'border-primary/40 text-primary cursor-wait' : 'border-line text-fg-muted hover:text-primary hover:border-primary/40 cursor-pointer'}`}>
          {uploading ? (
            <>
              <span className="w-11 h-11 rounded-card bg-primary-soft text-primary flex items-center justify-center"><UploadCloud className="w-5 h-5 animate-pulse" /></span>
              <span className="text-body font-bold text-fg">Đang tải lên minh chứng...</span>
              <span className="w-40 h-1.5 rounded-full bg-surface-muted overflow-hidden mt-1">
                <span className="block h-full w-2/3 bg-primary rounded-full animate-pulse" />
              </span>
            </>
          ) : (
            <>
              <span className="w-11 h-11 rounded-card bg-primary-soft text-primary flex items-center justify-center group-hover:scale-105 transition-transform"><UploadCloud className="w-5 h-5" /></span>
              <span className="text-body font-bold text-fg">Kéo thả tệp vào đây, hoặc <span className="text-primary">chọn từ máy</span></span>
              <span className="text-meta text-fg-faint font-medium">JPG, PNG hoặc PDF · tối đa 5MB</span>
            </>
          )}
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; onUpload(f); }} />
        </label>
      </div>
    )}

    <div className="space-y-2.5">
      {docs.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-line rounded-field">
          <div className="w-11 h-11 rounded-card bg-surface-muted text-fg-faint flex items-center justify-center mx-auto mb-2"><Inbox className="w-5 h-5" /></div>
          <p className="text-meta text-fg-muted font-medium">Chưa có minh chứng nào.</p>
        </div>
      ) : docs.map((d) => {
        const isImg = d.contentType?.startsWith('image');
        const sizeKb = d.sizeBytes ? Math.max(1, Math.round(d.sizeBytes / 1024)) : undefined;
        return (
          <div key={d.id} className="flex items-center gap-3.5 bg-surface border border-line rounded-field p-3 transition-all hover:border-primary/30">
            {isImg && d.fileUrl ? (
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-field overflow-hidden shrink-0 border border-line bg-surface-muted">
                <img src={d.fileUrl} alt={d.originalFilename} className="w-full h-full object-cover" />
              </a>
            ) : (
              <div className={`w-12 h-12 rounded-field flex items-center justify-center shrink-0 ${isImg ? 'bg-accent/12 text-accent' : 'bg-danger/10 text-danger'}`}>
                {isImg ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {d.fileUrl
                  ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-body font-bold text-fg truncate hover:text-primary hover:underline">{d.originalFilename}</a>
                  : <p className="text-body font-bold text-fg truncate">{d.originalFilename}</p>}
              </div>
              <p className="text-meta text-fg-muted font-medium mt-0.5">{DOC_TYPES[d.documentType]}{sizeKb ? ` · ${sizeKb} KB` : ''}</p>
            </div>
            {canUpload && onDelete && (
              <button onClick={() => onDelete(d.id)} className="p-2 rounded-field text-fg-muted hover:text-danger hover:bg-danger/10 cursor-pointer transition-all" title="Xoá"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const TimelinePanel: React.FC<{ req: VerificationRequest }> = ({ req }) => (
  <div className="meetmind-card p-6 rounded-card lg:sticky lg:top-6">
    <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5 mb-4"><Clock className="w-5 h-5 text-primary" /> Lịch sử xử lý</h3>
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
