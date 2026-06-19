import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Paperclip, ShieldCheck, Trash2, UploadCloud, Undo2, AlertCircle } from 'lucide-react';
import { mentorVerificationApi } from '../../api/mentorVerification';
import { mentorProfileApi } from '../../api/mentorProfile';
import { apiFetch } from '../../lib/apiFetch';
import { getMe } from '../../lib/authService';
import type {
  MentorVerificationRequestResponse,
  MentorVerificationChecklist,
  MentorVerificationDocument,
  VerificationDocumentType,
  VerificationStatus,
  TimelineEvent,
  MentorProfileResponse,
  TeachingMode,
  MentorProfileUpdatePayload,
} from '../../api/types';

const DOC_TYPES: Record<VerificationDocumentType, string> = {
  FPTU_AFFILIATION_PROOF: 'Minh chứng thuộc FPTU',
  EXPERTISE_PROOF: 'Minh chứng năng lực',
};

const MAX_FILES: Record<VerificationDocumentType, number> = {
  FPTU_AFFILIATION_PROOF: 1,
  EXPERTISE_PROOF: 3,
};

const STATUS_LABELS: Record<VerificationStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  NEEDS_REVISION: 'Cần chỉnh sửa',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  WITHDRAWN: 'Đã rút',
};

const STATUS_TONES: Record<VerificationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
  NEEDS_REVISION: 'bg-blue-50 text-blue-800 border-blue-200',
  APPROVED: 'bg-green-50 text-green-800 border-green-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
  WITHDRAWN: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatDateTime(value?: string | null): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function normalizeDocuments(value: MentorVerificationRequestResponse['documents'] | undefined): MentorVerificationDocument[] {
  return (value ?? []) as MentorVerificationDocument[];
}

function normalizeTimeline(value: MentorVerificationRequestResponse['timeline'] | undefined): TimelineEvent[] {
  return (value ?? []) as TimelineEvent[];
}

type HelpTopic = { id: string; code?: string; name?: string; title?: string; displayName?: string; description?: string };

function helpTopicLabel(topic: HelpTopic): string {
  const raw = topic.name || topic.displayName || topic.title || topic.code || topic.id;
  const fallbackMap: Record<string, string> = {
    HELP_PROJECT_REVIEW: 'Review project',
    HELP_CV_REVIEW: 'Review CV',
    HELP_QA: 'Hỏi đáp học tập',
    HELP_STUDY_PLAN: 'Lập kế hoạch học tập',
    HELP_INTERVIEW: 'Phỏng vấn/OJT',
    HELP_INTERNSHIP: 'Thực tập',
    HELP_GRADUATION_THESIS: 'Đồ án tốt nghiệp',
    HELP_PRODUCT_FEEDBACK: 'Góp ý sản phẩm',
    HELP_CAREER_PATH: 'Định hướng nghề nghiệp',
  };

  return fallbackMap[raw] || fallbackMap[topic.code || ''] || raw;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

type MentorProfileLike = MentorProfileResponse & {
  headline?: string;
  expertiseDescription?: string;
  supportingSubjects?: string | null;
  isAvailable?: boolean;
  helpTopicIds?: Array<string | { id?: string; value?: string; code?: string; topicId?: string }> | string;
  teachingMode?: TeachingMode;
  sessionDuration?: 15 | 30 | 60 | 90;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
};

function normalizeHelpTopicIds(input: MentorProfileLike['helpTopicIds']): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return uniqueStrings(
      input.map((item) => {
        if (typeof item === 'string') return item;
        return item.id || item.value || item.topicId || item.code || '';
      })
    );
  }
  if (typeof input === 'string') {
    return uniqueStrings(
      input
        .split(',')
        .map((value) => value.trim())
    );
  }
  return [];
}

function normalizeMentorProfileResponse(input: MentorProfileLike): MentorProfileResponse {
  const exists = !!input.exists;
  const profile = input.profile ?? (input.headline || input.expertiseDescription || input.helpTopicIds ? {
    headline: input.headline ?? '',
    expertiseDescription: input.expertiseDescription ?? '',
    supportingSubjects: input.supportingSubjects ?? null,
    isAvailable: input.isAvailable ?? true,
    helpTopicIds: normalizeHelpTopicIds(input.helpTopicIds),
    teachingMode: input.teachingMode ?? 'ONLINE',
    sessionDuration: input.sessionDuration ?? 60,
    linkedinUrl: input.linkedinUrl ?? null,
    githubUrl: input.githubUrl ?? null,
    portfolioUrl: input.portfolioUrl ?? null,
  } : undefined);

  const normalizedProfile = profile
    ? {
        ...profile,
        helpTopicIds: normalizeHelpTopicIds(profile.helpTopicIds),
      }
    : undefined;

  return {
    exists,
    profile: normalizedProfile,
  };
}

function getChecklistSteps(checklist?: MentorVerificationChecklist) {
  return [
    {
      key: 'academicProfileCompleted',
      label: 'Học thuật',
      passed: !!checklist?.academicProfileCompleted,
      note: 'Cần hoàn tất hồ sơ học thuật.',
    },
    {
      key: 'mentorProfileCompleted',
      label: 'Hồ sơ mentor',
      passed: !!checklist?.mentorProfileCompleted,
      note: 'Cần lưu hồ sơ mentor trước.',
    },
    {
      key: 'hasAffiliationProof',
      label: 'Minh chứng FPTU',
      passed: !!checklist?.hasAffiliationProof,
      note: 'Cần có minh chứng liên kết FPTU.',
    },
    {
      key: 'hasExpertiseProof',
      label: 'Minh chứng năng lực',
      passed: !!checklist?.hasExpertiseProof,
      note: 'Cần có ít nhất một minh chứng năng lực.',
    },
    {
      key: 'canSubmit',
      label: 'Nộp hồ sơ',
      passed: !!checklist?.canSubmit,
      note: 'Đủ điều kiện để nộp hồ sơ.',
    },
  ];
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const TWO_MB = 2 * 1024 * 1024;

async function resizeImageToMaxSize(file: File, maxBytes = TWO_MB): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= maxBytes) return file;

  const imageBitmap = await createImageBitmap(file);
  let width = imageBitmap.width;
  let height = imageBitmap.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  const scaleDown = (factor: number) => {
    width = Math.max(1, Math.round(width * factor));
    height = Math.max(1, Math.round(height * factor));
  };

  const targetRatio = Math.sqrt(maxBytes / file.size);
  scaleDown(Math.min(1, targetRatio));

  let output: Blob | null = null;
  let quality = 0.92;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    output = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), file.type === 'image/png' ? 'image/png' : 'image/jpeg', file.type === 'image/png' ? 1 : quality);
    });

    if (output && output.size <= maxBytes) break;

    if (quality > 0.6) {
      quality = Math.max(0.6, quality - 0.12);
    } else {
      scaleDown(0.85);
    }
  }

  imageBitmap.close();

  if (!output) return file;
  if (output.size > maxBytes) return file;

  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([output], `${baseName}.${extension}`, { type: output.type || file.type, lastModified: Date.now() });
}

const FileUploadArea: React.FC<{
  disabled: boolean;
  onPick: (type: VerificationDocumentType, file: File) => Promise<void>;
  documents: MentorVerificationDocument[];
}> = ({ disabled, onPick, documents }) => {
  const handleChange = async (type: VerificationDocumentType, file?: File | null) => {
    if (!file || disabled) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ cho phép JPG, PNG, PDF.');
      return;
    }
    const nextFile = file.type.startsWith('image/') && file.size > TWO_MB
      ? await resizeImageToMaxSize(file, TWO_MB)
      : file;

    if (nextFile.size > TWO_MB && nextFile.type.startsWith('image/')) {
      alert('Ảnh vẫn lớn hơn 2MB sau khi nén. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    await onPick(type, nextFile);
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-text">Tải minh chứng</p>
          <p className="text-xs text-brand-text-muted">Hỗ trợ JPG, PNG, PDF. Ảnh lớn hơn 2MB sẽ được nén tự động trước khi gửi.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {(Object.keys(DOC_TYPES) as VerificationDocumentType[]).map((type) => {
          const activeCount = documents.filter((doc) => doc.documentType === type && doc.isActive !== false).length;
          const maxCount = MAX_FILES[type];
          return (
            <div
              key={type}
              className="flex items-start justify-between gap-4 rounded-2xl border border-brand-border bg-white px-4 py-4 shadow-sm"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-brand-text">{DOC_TYPES[type]}</p>
                <p className="text-xs text-brand-text-muted">
                  {type === 'FPTU_AFFILIATION_PROOF' ? 'Minh chứng thuộc FPTU' : 'Minh chứng năng lực/chuyên môn'}
                </p>
                <p className="text-xs font-medium text-brand-text-muted">
                  Đã tải {activeCount}/{maxCount} file
                </p>
              </div>
              <label className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-field px-3 py-2 text-xs font-semibold transition-all ${disabled ? 'pointer-events-none opacity-50 bg-brand-bg/40 text-brand-text-muted' : 'bg-brand-bg text-brand-text hover:bg-brand-bg/70'}`}>
                <UploadCloud className="h-3.5 w-3.5" />
                Tải lên
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    void handleChange(type, e.target.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RequiredMark: React.FC = () => <span className="ml-1 text-red-500">*</span>;

export const MentorVerification: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState<MentorVerificationRequestResponse | null>(null);
  const [mentorProfile, setMentorProfile] = useState<MentorProfileResponse | null>(null);
  const [mentorProfileLoading, setMentorProfileLoading] = useState(true);
  const [mentorProfileSaving, setMentorProfileSaving] = useState(false);
  const [mentorProfileError, setMentorProfileError] = useState<string | null>(null);
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>([]);
  const [helpTopicsError, setHelpTopicsError] = useState<string | null>(null);
  const [helpTopicsLoading, setHelpTopicsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [profileForm, setProfileForm] = useState({
    headline: '',
    expertiseDescription: '',
    supportingSubjects: '',
    isAvailable: true,
    helpTopicIds: [] as string[],
    teachingMode: 'ONLINE' as TeachingMode,
    sessionDuration: 60 as 15 | 30 | 60 | 90,
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  const status = request?.status ?? 'DRAFT';
  const documents = useMemo(() => normalizeDocuments(request?.documents), [request?.documents]);
  const timeline = useMemo(() => normalizeTimeline(request?.timeline), [request?.timeline]);
  const checklist = request?.checklist as MentorVerificationChecklist | undefined;
  const canUploadDocuments = !!request?.allowedActions?.canUploadDocuments;
  const canSubmit = !!request?.allowedActions?.canSubmit && !!checklist?.canSubmit;
  const canWithdraw = !!request?.allowedActions?.canWithdraw;
  const allowEditing = status === 'DRAFT' || status === 'NEEDS_REVISION' || status === 'WITHDRAWN';

  const refreshVerification = async () => {
    try {
      const current = await mentorVerificationApi.getCurrent();
      setRequest(current as MentorVerificationRequestResponse);
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      if (statusCode === 404) {
        const created = await mentorVerificationApi.createOrGetRequest();
        setRequest(created as MentorVerificationRequestResponse);
      } else {
        throw err;
      }
    }
  };

  const loadRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      if (!me.profileCompleted) {
        navigate('/onboarding/student-profile', { replace: true });
        return;
      }

      console.log('[MentorVerification] fetching current request');
      await refreshVerification();
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      const message = err instanceof Error ? err.message : 'Không thể tải hồ sơ xác thực mentor.';
      console.error('[MentorVerification] load failed', { statusCode, message, err });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequest();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMentorProfile = async () => {
      setMentorProfileLoading(true);
      setMentorProfileError(null);
      try {
        console.log('[MentorProfile] fetching profile');
        const res = await mentorProfileApi.get();
        console.log('[MentorProfile] GET /api/me/mentor-profile', res);
        if (cancelled) return;
        const normalized = normalizeMentorProfileResponse(res as MentorProfileLike);
        console.log('[MentorProfile] normalized form state', normalized.profile);
        setMentorProfile(normalized);
        if (normalized.exists && normalized.profile) {
          console.log('[MentorProfile] helpTopicIds', normalized.profile.helpTopicIds);
          setProfileForm({
            headline: normalized.profile.headline || '',
            expertiseDescription: normalized.profile.expertiseDescription || '',
            supportingSubjects: normalized.profile.supportingSubjects || '',
            isAvailable: normalized.profile.isAvailable ?? true,
            helpTopicIds: normalized.profile.helpTopicIds || [],
            teachingMode: normalized.profile.teachingMode || 'ONLINE',
            sessionDuration: normalized.profile.sessionDuration || 60,
            linkedinUrl: normalized.profile.linkedinUrl || '',
            githubUrl: normalized.profile.githubUrl || '',
            portfolioUrl: normalized.profile.portfolioUrl || '',
          });
        }
      } catch (err) {
        if (cancelled) return;
        const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
        if (statusCode === 404) {
          setMentorProfile({ exists: false });
          setProfileForm({
            headline: '',
            expertiseDescription: '',
            supportingSubjects: '',
            isAvailable: true,
            helpTopicIds: [],
            teachingMode: 'ONLINE',
            sessionDuration: 60,
            linkedinUrl: '',
            githubUrl: '',
            portfolioUrl: '',
          });
        } else {
          setMentorProfileError(err instanceof Error ? err.message : 'Không thể tải hồ sơ mentor.');
        }
      } finally {
        if (!cancelled) setMentorProfileLoading(false);
      }
    };

    void loadMentorProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHelpTopics = async () => {
      setHelpTopicsLoading(true);
      setHelpTopicsError(null);
      try {
        const response = await apiFetch('/api/catalog/help-topics', { method: 'GET', auth: false });
        if (!response.ok) {
          throw new Error(`Help topics unavailable (${response.status})`);
        }
        const json = (await response.json().catch(() => null)) as { data?: HelpTopic[] | { content?: HelpTopic[]; items?: HelpTopic[] } } | null;
        const data = json?.data;
        const items = Array.isArray(data)
          ? data
          : (data && typeof data === 'object' && 'content' in data && Array.isArray((data as { content?: HelpTopic[] }).content))
            ? (data as { content?: HelpTopic[] }).content ?? []
            : (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items?: HelpTopic[] }).items))
              ? (data as { items?: HelpTopic[] }).items ?? []
              : [];
        if (!cancelled) setHelpTopics(items);
      } catch (err) {
        if (!cancelled) {
          setHelpTopics([]);
          setHelpTopicsError('Không tải được danh sách chủ đề hỗ trợ từ backend.');
        }
      } finally {
        if (!cancelled) setHelpTopicsLoading(false);
      }
    };

    void loadHelpTopics();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'PENDING_REVIEW' || !request?.allowedActions?.canUploadDocuments) return;
    const timer = window.setInterval(async () => {
      try {
        await mentorVerificationApi.getTimeline();
      } catch {
        void loadRequest();
      }
    }, 180000);
    return () => window.clearInterval(timer);
  }, [status, request?.allowedActions?.canUploadDocuments]);

  useEffect(() => {
    if (status === 'APPROVED') {
      void getMe();
    }
  }, [status]);

  const checklistSteps = getChecklistSteps(checklist);
  const firstIncompleteStep = checklistSteps.findIndex((step) => !step.passed);

  const handleUpload = async (documentType: VerificationDocumentType, file: File) => {
    if (!request?.allowedActions?.canUploadDocuments || !checklist?.mentorProfileCompleted) return;
    const activeCount = documents.filter((doc) => doc.documentType === documentType && doc.isActive !== false).length;
    if (activeCount >= MAX_FILES[documentType]) {
      setError(`Đã đạt giới hạn ${MAX_FILES[documentType]} file cho ${DOC_TYPES[documentType]}.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await mentorVerificationApi.uploadDocument({ documentType, file });
      if (result && typeof result === 'object' && 'documents' in result) {
        setRequest(result as MentorVerificationRequestResponse);
      } else {
        await loadRequest();
      }
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      const message = err instanceof Error ? err.message : 'Không thể upload tài liệu.';
      setError(statusCode === 409 ? message : message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!request?.allowedActions?.canUploadDocuments) return;
    setBusy(true);
    setError(null);
    try {
      const result = await mentorVerificationApi.deleteDocument(documentId);
      if (result && typeof result === 'object' && 'documents' in result) {
        setRequest(result as MentorVerificationRequestResponse);
      } else {
        await loadRequest();
      }
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      const message = err instanceof Error ? err.message : 'Không thể xoá tài liệu.';
      setError(statusCode === 409 ? message : message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !termsAccepted) return;
    setBusy(true);
    setError(null);
    try {
      const next = await mentorVerificationApi.submit({
        submitNote: submitNote.trim() || undefined,
        termsAccepted: true,
      });
      setRequest(next);
      setSubmitNote(next.submitNote || '');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) return;
    setBusy(true);
    setError(null);
    try {
      const next = await mentorVerificationApi.withdraw();
      setRequest(next);
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      const message = err instanceof Error ? err.message : 'Không thể rút hồ sơ.';
      setError(statusCode === 409 ? message : message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMentorProfile = async () => {
    setMentorProfileSaving(true);
    setMentorProfileError(null);
    try {
      const payload: MentorProfileUpdatePayload = {
        headline: profileForm.headline.trim(),
        expertiseDescription: profileForm.expertiseDescription.trim(),
        supportingSubjects: profileForm.supportingSubjects.trim() || null,
        isAvailable: profileForm.isAvailable,
        helpTopicIds: uniqueStrings(profileForm.helpTopicIds),
        teachingMode: profileForm.teachingMode,
        sessionDuration: profileForm.sessionDuration,
        linkedinUrl: profileForm.linkedinUrl.trim() || null,
        githubUrl: profileForm.githubUrl.trim() || null,
        portfolioUrl: profileForm.portfolioUrl.trim() || null,
      };

      console.log('[MentorProfile] PUT payload', payload);

      if (!payload.headline) throw new Error('Tiêu đề mentor là bắt buộc.');
      if (payload.headline.length > 200) throw new Error('Tiêu đề mentor không được vượt quá 200 ký tự.');
      if (!payload.expertiseDescription) throw new Error('Mô tả chuyên môn là bắt buộc.');
      if (payload.expertiseDescription.length > 1000) throw new Error('Mô tả chuyên môn không được vượt quá 1000 ký tự.');
      if (payload.helpTopicIds.length < 1 || payload.helpTopicIds.length > 20) throw new Error('Chủ đề hỗ trợ phải có từ 1 đến 20 mục.');

      await mentorProfileApi.update(payload);
      const updated = await mentorProfileApi.get();
      console.log('[MentorProfile] GET after PUT', updated);
      await refreshVerification();
      const normalized = normalizeMentorProfileResponse(updated as MentorProfileLike);
      console.log('[MentorProfile] helpTopicIds after PUT', normalized.profile?.helpTopicIds);
      setMentorProfile(normalized);
      if (normalized.exists && normalized.profile) {
        setProfileForm({
          headline: normalized.profile.headline || '',
          expertiseDescription: normalized.profile.expertiseDescription || '',
          supportingSubjects: normalized.profile.supportingSubjects || '',
          isAvailable: normalized.profile.isAvailable ?? true,
          helpTopicIds: normalized.profile.helpTopicIds || [],
          teachingMode: normalized.profile.teachingMode || 'ONLINE',
          sessionDuration: normalized.profile.sessionDuration || 60,
          linkedinUrl: normalized.profile.linkedinUrl || '',
          githubUrl: normalized.profile.githubUrl || '',
          portfolioUrl: normalized.profile.portfolioUrl || '',
        });
      }
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      const message = err instanceof Error ? err.message : 'Không thể lưu hồ sơ mentor.';
      setMentorProfileError(statusCode === 400 ? message : message);
    } finally {
      setMentorProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-terracotta" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-left">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mentor/apply/profile')} className="rounded-field p-2 text-brand-text-muted transition-colors hover:bg-brand-bg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-brand-text">
              <ShieldCheck className="h-8 w-8 text-brand-terracotta" />
              Hồ sơ xác thực Mentor
            </h1>
            <p className="mt-1 text-body font-medium text-brand-text-muted">
              Quản lý minh chứng, checklist và trạng thái hồ sơ.
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_TONES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="rounded-[28px] border border-brand-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-brand-border pb-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-brand-text">Checklist</h2>
            <p className="mt-1 text-sm font-medium text-brand-text-muted">
              Theo dõi tiến độ hoàn tất hồ sơ mentor.
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${checklist?.canSubmit ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
            {checklist?.canSubmit ? 'Có thể nộp' : 'Chưa thể nộp'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {checklistSteps.map((step, index) => {
            const isFirstIncomplete = index === firstIncompleteStep;
            return (
              <button
                key={step.key}
                type="button"
                title={step.note}
                onClick={() => {
                  if (step.key === 'academicProfileCompleted' || step.key === 'mentorProfileCompleted') {
                    scrollToSection('mentor-profile-section');
                    return;
                  }
                  if (step.key === 'hasAffiliationProof' || step.key === 'hasExpertiseProof') {
                    scrollToSection('documents-section');
                    return;
                  }
                  if (step.key === 'canSubmit') {
                    scrollToSection('submit-section');
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                  step.passed
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : isFirstIncomplete
                      ? 'border-brand-terracotta/30 bg-brand-terracotta/10 text-brand-text'
                      : 'border-brand-border bg-brand-bg/20 text-brand-text-muted'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.passed
                      ? 'bg-green-100 text-green-700'
                      : isFirstIncomplete
                        ? 'bg-white text-brand-terracotta'
                        : 'bg-white text-brand-text-muted'
                  }`}
                >
                  {step.passed ? '✓' : '•'}
                </span>
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      <div id="mentor-profile-section" className="rounded-[28px] border border-brand-border bg-white p-6 shadow-sm scroll-mt-24">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-brand-text">1. Hồ sơ mentor</h2>
            <p className="mt-1 text-sm font-medium text-brand-text-muted">
              Hoàn thiện hồ sơ mentor trước khi upload minh chứng và nộp hồ sơ xác thực.
            </p>
          </div>
          <span className="rounded-full border border-brand-border bg-brand-bg/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-text-muted">
            {mentorProfile?.exists ? 'Đã có hồ sơ' : 'Chưa có hồ sơ'}
          </span>
        </div>

        {mentorProfileError && (
          <div className="mt-4 rounded-field border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {mentorProfileError}
          </div>
        )}

        {helpTopicsError && (
          <div className="mt-4 flex items-start gap-2 rounded-field border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{helpTopicsError}</span>
          </div>
        )}

        {mentorProfileLoading ? (
          <div className="mt-4 flex items-center gap-2 text-brand-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải hồ sơ mentor...
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">Tiêu đề mentor<RequiredMark /></span>
                <input
                  type="text"
                  maxLength={200}
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm((current) => ({ ...current, headline: e.target.value }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                  placeholder="Backend Developer | Spring Boot Mentor"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">Trạng thái sẵn sàng</span>
                <select
                  value={profileForm.isAvailable ? 'true' : 'false'}
                  onChange={(e) => setProfileForm((current) => ({ ...current, isAvailable: e.target.value === 'true' }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                >
                  <option value="true">Sẵn sàng nhận booking</option>
                  <option value="false">Tạm ngưng nhận booking</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="block text-sm font-semibold text-brand-text">Mô tả chuyên môn<RequiredMark /></span>
              <textarea
                rows={4}
                maxLength={1000}
                value={profileForm.expertiseDescription}
                onChange={(e) => setProfileForm((current) => ({ ...current, expertiseDescription: e.target.value }))}
                className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                placeholder="Mình có kinh nghiệm xây dựng REST API với Spring Boot, PostgreSQL và Docker."
              />
            </label>

            <label className="block space-y-2">
              <span className="block text-sm font-semibold text-brand-text">Môn / kỹ năng hỗ trợ</span>
              <input
                type="text"
                maxLength={1000}
                value={profileForm.supportingSubjects}
                onChange={(e) => setProfileForm((current) => ({ ...current, supportingSubjects: e.target.value }))}
                className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                placeholder="PRJ301, SWP391, Database, REST API"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">Hình thức mentoring</span>
                <select
                  value={profileForm.teachingMode}
                  onChange={(e) => setProfileForm((current) => ({ ...current, teachingMode: e.target.value as TeachingMode }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="HYBRID">HYBRID</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">Thời lượng mỗi buổi</span>
                <select
                  value={profileForm.sessionDuration}
                  onChange={(e) => setProfileForm((current) => ({ ...current, sessionDuration: Number(e.target.value) as 15 | 30 | 60 | 90 }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                >
                  <option value={15}>15 phút</option>
                  <option value={30}>30 phút</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="block text-sm font-semibold text-brand-text">Chủ đề hỗ trợ<RequiredMark /></span>
                <span className="text-xs text-brand-text-muted">(Có thể chọn nhiều Help Topic)</span>
              </div>
              {helpTopicsLoading ? (
                <div className="flex items-center gap-2 text-brand-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách chủ đề...
                </div>
              ) : helpTopics.length === 0 ? (
                <div className="rounded-field border border-dashed border-brand-border bg-brand-bg/20 px-4 py-3 text-sm text-brand-text-muted">
                  Không tải được danh sách chủ đề từ backend. Hãy thử lại sau.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {helpTopics.map((topic) => {
                    const topicId = topic.id;
                    const checked = profileForm.helpTopicIds.includes(topicId);
                    return (
                      <button
                        key={topicId}
                        type="button"
                        onClick={() => {
                          setProfileForm((current) => {
                            const next = checked
                              ? current.helpTopicIds.filter((id) => id !== topicId)
                              : uniqueStrings([...current.helpTopicIds, topicId]);
                            return { ...current, helpTopicIds: next };
                          });
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${checked ? 'border-brand-terracotta bg-brand-terracotta/10 shadow-sm' : 'border-brand-border bg-brand-bg/20 hover:bg-brand-bg/40'}`}
                      >
                        <span className="block text-sm font-semibold text-brand-text">{helpTopicLabel(topic)}</span>
                        {topic.description ? (
                          <span className="mt-1 block text-xs text-brand-text-muted">{topic.description}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">LinkedIn</span>
                <input
                  type="url"
                  value={profileForm.linkedinUrl}
                  onChange={(e) => setProfileForm((current) => ({ ...current, linkedinUrl: e.target.value }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                  placeholder="https://www.linkedin.com/in/example"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">GitHub</span>
                <input
                  type="url"
                  value={profileForm.githubUrl}
                  onChange={(e) => setProfileForm((current) => ({ ...current, githubUrl: e.target.value }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                  placeholder="https://github.com/example"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-brand-text">Portfolio</span>
                <input
                  type="url"
                  value={profileForm.portfolioUrl}
                  onChange={(e) => setProfileForm((current) => ({ ...current, portfolioUrl: e.target.value }))}
                  className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none focus:border-brand-terracotta"
                  placeholder="https://example.dev"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-4">
              <p className="text-sm font-medium text-brand-text-muted">
                {mentorProfile?.exists ? 'Bạn có thể cập nhật hồ sơ mentor bất cứ lúc nào.' : 'Hãy tạo hồ sơ mentor trước khi upload minh chứng.'}
              </p>
              <button
                type="button"
                disabled={mentorProfileSaving}
                onClick={() => void handleSaveMentorProfile()}
                className="inline-flex items-center gap-2 rounded-field bg-brand-terracotta px-5 py-3 text-body font-bold text-white transition-all hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mentorProfileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Lưu hồ sơ mentor
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-field border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {status === 'PENDING_REVIEW' && (
        <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="font-semibold">Hồ sơ đang chờ duyệt</p>
          <p className="mt-1 text-sm">Upload/delete/submit đã bị khóa theo `allowedActions`.</p>
        </div>
      )}

      {status === 'NEEDS_REVISION' && (
        <div className="rounded-card border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <p className="font-semibold">Admin yêu cầu chỉnh sửa hồ sơ</p>
          <p className="mt-1 text-sm">{request?.reviewNote || timeline[0]?.label || 'Vui lòng cập nhật theo góp ý của admin.'}</p>
        </div>
      )}

      {status === 'REJECTED' && (request?.rejectionReason || request?.reviewNote) && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <p className="font-semibold">Hồ sơ bị từ chối</p>
          <p className="mt-1 text-sm">{request?.rejectionReason || request?.reviewNote}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <div id="documents-section" className="rounded-[28px] border border-brand-border bg-white p-6 shadow-sm scroll-mt-24">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h2 className="text-xl font-bold text-brand-text">Tải minh chứng</h2>
              <span className="text-sm font-semibold text-brand-text-muted">{documents.length} tệp</span>
            </div>

            <div className="mt-4 space-y-3">
              {documents.length === 0 ? (
                <p className="py-8 text-center text-body font-medium text-brand-text-muted">Chưa có tài liệu nào.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.documentId} className="flex items-center justify-between gap-3 rounded-card border border-brand-border bg-brand-bg/30 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-text">{doc.fileName}</p>
                      <p className="text-sm text-brand-text-muted">
                        {DOC_TYPES[doc.documentType]} · {doc.contentType} · {Math.round(doc.sizeBytes / 1024)} KB
                      </p>
                      <p className="text-xs text-brand-text-muted">{formatDateTime(doc.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request?.allowedActions?.canUploadDocuments && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.documentId)}
                          className="inline-flex items-center gap-1 rounded-field border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      )}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-field border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-bg/60"
                      >
                        <Paperclip className="h-4 w-4" />
                        Mở
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-brand-border pt-4">
              {!checklist?.mentorProfileCompleted ? (
                <div className="rounded-field border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                  Vui lòng hoàn tất hồ sơ mentor trước khi upload minh chứng.
                </div>
              ) : (
                <FileUploadArea disabled={busy || !canUploadDocuments || status === 'PENDING_REVIEW'} onPick={handleUpload} documents={documents} />
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h2 className="text-xl font-bold text-brand-text">Lịch sử xử lý</h2>
              <span className="text-sm font-semibold text-brand-text-muted">{timeline.length} sự kiện</span>
            </div>

            <div className="mt-4 space-y-3">
              {timeline.length === 0 ? (
                <p className="py-4 text-center text-body font-medium text-brand-text-muted">Chưa có lịch sử xử lý</p>
              ) : (
                timeline.map((event, index) => (
                  <div key={`${event.event}-${index}`} className="rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3">
                    <p className="font-semibold text-brand-text">{event.label || event.event}</p>
                    <p className="text-sm text-brand-text-muted">{formatDateTime(event.at)}{event.by ? ` · ${event.by}` : ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 self-start">
          <div id="submit-section" className="rounded-[28px] border border-brand-border bg-white p-6 shadow-sm scroll-mt-24">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h2 className="text-xl font-bold text-brand-text">Trạng thái</h2>
            </div>

            <div className="mt-4 space-y-3 text-body">
              <div className="rounded-2xl border border-brand-border bg-brand-bg/20 px-4 py-3">
                <p className="text-sm font-semibold text-brand-text-muted">Trạng thái hồ sơ</p>
                <p className="mt-1 font-semibold text-brand-text">{STATUS_LABELS[status]}</p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-bg/20 px-4 py-3">
                <p className="text-sm font-semibold text-brand-text-muted">Khả năng nộp</p>
                <p className={`mt-1 font-semibold ${checklist?.canSubmit ? 'text-green-700' : 'text-amber-700'}`}>
                  {checklist?.canSubmit ? 'Có thể nộp hồ sơ' : 'Chưa thể nộp hồ sơ'}
                </p>
              </div>
              {request?.reviewNote ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
                  <p className="text-sm font-semibold">Ghi chú từ admin</p>
                  <p className="mt-1 text-brand-text">{request.reviewNote}</p>
                </div>
              ) : null}
              {request?.rejectionReason ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  <p className="text-sm font-semibold">Lý do từ chối</p>
                  <p className="mt-1 text-brand-text">{request.rejectionReason}</p>
                </div>
              ) : null}
              {request?.submitNote ? (
                <div className="rounded-2xl border border-brand-border bg-brand-bg/20 px-4 py-3">
                  <p className="text-sm font-semibold text-brand-text-muted">Ghi chú gửi kèm</p>
                  <p className="mt-1 text-brand-text">{request.submitNote}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-brand-text">Ghi chú gửi kèm</label>
              <textarea
                rows={3}
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                disabled={!allowEditing}
                className="w-full rounded-field border border-brand-border bg-brand-bg/30 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Ghi chú ngắn cho admin..."
              />
              <label className="flex items-start gap-2 rounded-2xl border border-brand-border bg-brand-bg/30 px-4 py-3 text-sm font-medium text-brand-text">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={!allowEditing}
                  className="mt-1"
                />
                <span>
                  Tôi xác nhận thông tin và tài liệu đã tải lên là đúng sự thật, đồng thời đồng ý với điều khoản xác thực mentor.
                </span>
              </label>
              {!checklist?.mentorProfileCompleted ? (
                <p className="text-sm text-amber-700">Vui lòng hoàn tất hồ sơ mentor trước khi nộp hồ sơ.</p>
              ) : !checklist?.canSubmit ? (
                <p className="text-sm text-amber-700">Chưa đủ điều kiện nộp hồ sơ. Hãy kiểm tra checklist ở trên.</p>
              ) : null}
              <button
                type="button"
                disabled={busy || !canSubmit || !termsAccepted || !checklist?.mentorProfileCompleted || status === 'PENDING_REVIEW'}
                onClick={() => void handleSubmit()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-field bg-brand-terracotta px-5 py-3 text-body font-bold text-white transition-all hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Nộp hồ sơ
              </button>
              {canWithdraw && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleWithdraw()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-field border border-red-200 bg-red-50 px-5 py-3 text-body font-bold text-red-700 transition-colors hover:bg-red-100"
                >
                  <Undo2 className="h-4 w-4" />
                  Rút hồ sơ
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {request?.status === 'PENDING_REVIEW' && (
        <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          Hồ sơ đang chờ duyệt. Các thao tác upload và nộp đã được khóa theo quyền hiện tại.
        </div>
      )}
    </div>
  );
};
