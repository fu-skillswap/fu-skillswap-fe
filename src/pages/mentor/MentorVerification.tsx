import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, UploadCloud, FileText, Image as ImageIcon, Trash2, Send,
  Clock, CheckCircle2, XCircle, AlertTriangle, Undo2, Plus, ArrowLeft, Paperclip,
  ListChecks, Lock, Inbox, Check, User, Square, CheckSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mentorVerificationApi } from '../../api/mentorVerification';
import type { VerificationRequest, VerificationStatus, DocumentType } from '../../api/types';

// ---------------------------------------------------------------------------
// Cấu hình hiển thị theo trạng thái
// ---------------------------------------------------------------------------
const DOC_TYPES: Record<DocumentType, string> = {
  FPTU_AFFILIATION_PROOF: 'Minh chứng liên kết FPTU',
  EXPERTISE_PROOF: 'Minh chứng chuyên môn',
};

// Pill trạng thái (góc trên phải)
const STATUS_META: Record<VerificationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Bản nháp', cls: 'bg-surface-muted text-fg-muted border-line', icon: <FileText className="w-3.5 h-3.5" /> },
  PENDING_REVIEW: { label: 'Chờ duyệt', cls: 'bg-amber-500/12 text-amber-600 border-amber-500/25', icon: <Clock className="w-3.5 h-3.5" /> },
  NEEDS_REVISION: { label: 'Cần chỉnh sửa', cls: 'bg-accent/12 text-accent border-accent/25', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-danger/10 text-danger border-danger/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  WITHDRAWN: { label: 'Đã rút', cls: 'bg-surface-muted text-fg-muted border-line', icon: <Undo2 className="w-3.5 h-3.5" /> },
};

// Cấu hình hiển thị status hero theo trạng thái
const STATE_UI: Record<VerificationStatus, { bar: string; iconWrap: string; icon: React.ReactNode; title: string; step: number }> = {
  DRAFT:          { bar: 'bg-fg-faint',  iconWrap: 'bg-surface-muted text-fg-muted', icon: <FileText className="w-6 h-6" />,      title: 'Hồ sơ đang ở bản nháp',   step: 0 },
  PENDING_REVIEW: { bar: 'bg-amber-500', iconWrap: 'bg-amber-500/12 text-amber-600', icon: <Clock className="w-6 h-6" />,         title: 'Đang chờ admin duyệt',    step: 1 },
  NEEDS_REVISION: { bar: 'bg-accent',    iconWrap: 'bg-accent/12 text-accent',       icon: <AlertTriangle className="w-6 h-6" />, title: 'Admin yêu cầu chỉnh sửa', step: 0 },
  APPROVED:       { bar: 'bg-success',   iconWrap: 'bg-success/10 text-success',     icon: <CheckCircle2 className="w-6 h-6" />,  title: 'Hồ sơ đã được duyệt',     step: 2 },
  REJECTED:       { bar: 'bg-danger',    iconWrap: 'bg-danger/10 text-danger',       icon: <XCircle className="w-6 h-6" />,       title: 'Hồ sơ bị từ chối',        step: -1 },
  WITHDRAWN:      { bar: 'bg-fg-faint',  iconWrap: 'bg-surface-muted text-fg-muted', icon: <Undo2 className="w-6 h-6" />,         title: 'Bạn đã rút hồ sơ',        step: -1 },
};

// Màu chấm timeline theo loại sự kiện
const EVENT_DOT: Record<string, string> = {
  CREATED: 'bg-fg-faint', SUBMITTED: 'bg-primary', REVISION_REQUESTED: 'bg-accent',
  APPROVED: 'bg-success', REJECTED: 'bg-danger', WITHDRAWN: 'bg-fg-faint',
};

// Checklist hoàn thiện hồ sơ — render đúng theo dữ liệu BE trả về (FE không tự suy luận)
const CHECKLIST_ROWS: { key: 'academicProfileCompleted' | 'mentorProfileCompleted' | 'hasAffiliationProof' | 'hasExpertiseProof'; label: string; hint: string; optional?: boolean }[] = [
  { key: 'academicProfileCompleted', label: 'Hoàn thiện hồ sơ học vấn', hint: 'Cập nhật thông tin học thuật trong trang Cá nhân.' },
  { key: 'mentorProfileCompleted', label: 'Hoàn thiện hồ sơ mentor', hint: 'Headline, mô tả chuyên môn, chủ đề hỗ trợ.' },
  { key: 'hasAffiliationProof', label: 'Minh chứng liên kết FPTU', hint: 'Thẻ sinh viên, bảng điểm hoặc email FPTU — bắt buộc.' },
  { key: 'hasExpertiseProof', label: 'Minh chứng chuyên môn', hint: 'Chứng chỉ, hợp đồng lao động hoặc portfolio — giúp duyệt nhanh hơn.', optional: true },
];

// ---------------------------------------------------------------------------
// Thanh tiến trình "Soạn hồ sơ → Chờ duyệt → Hoàn tất"
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

const RequirementRow: React.FC<{ met: boolean; label: string; hint: string; optional?: boolean; action?: React.ReactNode }> = ({ met, label, hint, optional, action }) => (
  <div className="flex items-start gap-3">
    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${met ? 'bg-success/12 text-success' : optional ? 'bg-surface-muted text-fg-faint' : 'bg-amber-500/12 text-amber-600'}`}>
      {met ? <Check className="w-3.5 h-3.5" /> : optional ? <Plus className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3 h-3" />}
    </span>
    <div>
      <p className="text-body font-bold text-fg leading-snug">{label}{optional && <span className="text-fg-faint font-semibold"> · tuỳ chọn</span>}{action}</p>
      <p className="text-meta text-fg-muted font-medium mt-0.5">{hint}</p>
    </div>
  </div>
);

export const MentorVerification: React.FC = () => {
  const navigate = useNavigate();
  const [req, setReq] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('FPTU_AFFILIATION_PROOF');
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -------------------- load --------------------
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let current: VerificationRequest;
      try {
        current = await mentorVerificationApi.getCurrent();
      } catch (err: any) {
        // Chưa có request nào (404) — tạo mới hoặc lấy lại request active (idempotent).
        if (err?.response?.status === 404) {
          current = await mentorVerificationApi.createOrGetRequest();
        } else {
          throw err;
        }
      }
      try {
        current.timeline = await mentorVerificationApi.getTimeline();
      } catch {
        /* timeline optional */
      }
      setReq(current);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được hồ sơ xác thực mentor.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };
  const status = req?.status ?? 'DRAFT';
  const allowedActions = req?.allowedActions;
  const checklist = req?.checklist;
  const docs = req?.documents ?? [];

  // -------------------- actions --------------------
  const createNew = async () => {
    setBusy(true);
    setError(null);
    try {
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

  const handleUpload = async (file?: File) => {
    if (!req || !file) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await mentorVerificationApi.uploadDocument({ documentType: docType, isPrimary, file });
      setReq({ ...req, documents: [...req.documents, doc] });
      setIsPrimary(false);
      flash('Đã tải lên minh chứng.');
      // checklist/allowedActions có thể thay đổi sau khi upload — đồng bộ lại với BE.
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tải minh chứng thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!req) return;
    setBusy(true);
    setError(null);
    try {
      await mentorVerificationApi.deleteDocument(documentId);
      setReq({ ...req, documents: req.documents.filter((d) => d.documentId !== documentId) });
      flash('Đã xoá minh chứng.');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xoá minh chứng thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!req || !termsAccepted) return;
    setBusy(true);
    setError(null);
    try {
      const r = await mentorVerificationApi.submit({ submitNote, termsAccepted: true });
      setReq(r);
      flash('Đã nộp hồ sơ chờ admin duyệt.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nộp hồ sơ thất bại.');
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
      flash('Đã rút hồ sơ.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rút hồ sơ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  // -------------------- render --------------------
  if (loading) {
    return <div className="py-20 flex justify-center"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (error && !req) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 text-left">
        <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 text-danger p-4 rounded-field text-body font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <button onClick={load} className="bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer">Thử lại</button>
      </div>
    );
  }

  const sm = STATUS_META[status];
  const ui = STATE_UI[status];

  const heroDesc: Record<VerificationStatus, string> = {
    DRAFT: 'Tải tối thiểu 1 minh chứng liên kết FPTU rồi nộp để admin duyệt. Hồ sơ chỉ hiển thị với bạn cho tới khi được duyệt.',
    PENDING_REVIEW: 'Hồ sơ đã được nộp và đang trong hàng chờ. Bạn sẽ nhận thông báo ngay khi có kết quả.',
    NEEDS_REVISION: req?.reviewNote || 'Vui lòng cập nhật theo ghi chú của admin và nộp lại.',
    APPROVED: 'Chúc mừng! Bạn đã chính thức là Mentor và hồ sơ đã hiển thị công khai trong mục Khám phá.',
    REJECTED: req?.reviewNote || 'Hồ sơ chưa đạt yêu cầu. Tạo hồ sơ mới để nộp lại.',
    WITHDRAWN: 'Hồ sơ xác thực đã được rút lại. Bạn có thể tạo hồ sơ mới bất cứ lúc nào.',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mentor/profile-setup')} className="p-2 rounded-field hover:bg-surface-muted text-fg-muted cursor-pointer transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-head font-extrabold text-fg font-serif tracking-tight leading-none flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> Xác thực Mentor</h1>
            {req?.requestId && <p className="text-meta text-fg-muted font-medium mt-1">Hồ sơ #{req.requestId} · Quy trình duyệt bởi đội ngũ FPTU SkillSwap</p>}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-meta font-extrabold uppercase tracking-wide py-1 px-2.5 rounded-lg border ${sm.cls}`}>{sm.icon}{sm.label}</span>
      </div>

      {error && req && (
        <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 text-danger p-4 rounded-field text-body font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {msg && <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success p-3 rounded-field text-body font-semibold"><CheckCircle2 className="w-4 h-4" />{msg}</div>}

      {/* ===== STATUS HERO ===== */}
      <div className="meetmind-card rounded-card overflow-hidden">
        <div className={`h-1 ${ui.bar}`} />
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className={`w-14 h-14 rounded-card flex items-center justify-center shrink-0 ${ui.iconWrap}`}>{ui.icon}</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-title font-extrabold text-fg">{ui.title}{status === 'APPROVED' && ' 🎉'}</h2>
              <p className="text-body text-fg-muted font-medium mt-1 leading-relaxed" style={{ textWrap: 'pretty' }}>{heroDesc[status]}</p>
              {req?.submittedAt && status !== 'DRAFT' && (
                <p className="text-meta text-fg-faint font-medium mt-2 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Nộp lúc {req.submittedAt}</p>
              )}
            </div>
            {status === 'APPROVED' && (
              <button onClick={() => navigate('/mentor/profile-setup')} className="shrink-0 hidden sm:inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-primary/20 transition-all"><User className="w-4 h-4" /> Tới hồ sơ</button>
            )}
          </div>

          {ui.step >= 0 && (
            <div className="mt-6 pt-6 border-t border-line-soft"><JourneyBar step={ui.step} /></div>
          )}

          {(status === 'REJECTED' || status === 'WITHDRAWN') && (
            <div className="mt-6 pt-6 border-t border-line-soft flex items-center justify-between gap-3 flex-wrap">
              <p className="text-meta text-fg-muted font-medium">{status === 'REJECTED' ? 'Theo quy định, hồ sơ bị từ chối cần tạo mới để nộp lại.' : 'Tạo hồ sơ mới để bắt đầu lại quy trình xác thực.'}</p>
              <button disabled={busy} onClick={createNew} className="inline-flex items-center gap-1.5 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Tạo hồ sơ mới</button>
            </div>
          )}
          {status === 'APPROVED' && (
            <button onClick={() => navigate('/mentor/profile-setup')} className="mt-5 w-full sm:hidden inline-flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer"><User className="w-4 h-4" /> Tới hồ sơ</button>
          )}
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid lg:grid-cols-3 gap-7 items-start">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-7">

          {/* Checklist hoàn thiện hồ sơ — render đúng theo dữ liệu BE trả về, không tự suy luận */}
          {checklist && (
            <div className="meetmind-card p-6 rounded-card space-y-4">
              <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5"><ListChecks className="w-5 h-5 text-primary" /> Yêu cầu hồ sơ</h3>
              <div className="space-y-4">
                {CHECKLIST_ROWS.map(({ key, label, hint, optional }) => (
                  <RequirementRow
                    key={key}
                    met={!!checklist[key]}
                    label={label}
                    hint={hint}
                    optional={optional}
                    action={key === 'mentorProfileCompleted' && !checklist[key] ? (
                      <button onClick={() => navigate('/mentor/profile-setup')} className="text-meta font-bold text-primary hover:underline cursor-pointer ml-1.5">Cập nhật ngay</button>
                    ) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="meetmind-card p-6 rounded-card space-y-4">
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
              <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2"><Paperclip className="w-5 h-5 text-primary" /> Minh chứng đã tải</h3>
              <span className="text-meta font-bold text-fg-muted">{docs.length} tệp</span>
            </div>

            <div className="space-y-2.5">
              {docs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-card bg-surface-muted text-fg-faint flex items-center justify-center mx-auto mb-2"><Inbox className="w-5.5 h-5.5" /></div>
                  <p className="text-meta text-fg-muted font-medium">Chưa có minh chứng nào.</p>
                </div>
              ) : docs.map((d) => {
                const isImg = d.mime?.startsWith('image');
                return (
                  <div key={d.documentId} className="flex items-center gap-3.5 bg-surface border border-line rounded-field p-3 transition-all hover:border-primary/30">
                    <div className={`w-12 h-12 rounded-field flex items-center justify-center shrink-0 ${isImg ? 'bg-accent/12 text-accent' : 'bg-danger/10 text-danger'}`}>
                      {isImg ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-bold text-fg truncate">{d.fileName}</p>
                        {d.isPrimary && <span className="text-meta font-extrabold text-primary bg-primary-soft border border-primary/20 px-2 py-0.5 rounded-lg shrink-0">Chính</span>}
                      </div>
                      <p className="text-meta text-fg-muted font-medium mt-0.5">{DOC_TYPES[d.documentType]}{d.sizeKb ? ` · ${d.sizeKb} KB` : ''}</p>
                    </div>
                    {allowedActions?.canUploadDocuments && (
                      <button onClick={() => handleDelete(d.documentId)} className="p-2 rounded-field text-fg-muted hover:text-danger hover:bg-danger/10 cursor-pointer transition-all" title="Xoá"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                );
              })}
            </div>

            {allowedActions?.canUploadDocuments && (
              <div className="space-y-3 pt-1">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase tracking-wide mb-1.5">Loại minh chứng</label>
                    <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold">
                      {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <label className="flex items-end gap-2 text-meta font-bold text-fg-muted cursor-pointer pb-2.5 select-none">
                    <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" /> Đặt làm minh chứng chính
                  </label>
                </div>
                <label className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-line rounded-field py-8 text-fg-muted hover:text-primary hover:border-primary/40 transition-all cursor-pointer group">
                  <span className="w-11 h-11 rounded-card bg-primary-soft text-primary flex items-center justify-center group-hover:scale-105 transition-transform"><UploadCloud className="w-5 h-5" /></span>
                  <span className="text-body font-bold text-fg">Kéo thả tệp vào đây, hoặc <span className="text-primary">chọn từ máy</span></span>
                  <span className="text-meta text-fg-faint font-medium">JPG, PNG hoặc PDF · tối đa 5MB</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              </div>
            )}
          </div>

          {/* Submit / withdraw */}
          {allowedActions?.canSubmit && (
            <div className="meetmind-card p-6 rounded-card space-y-4">
              <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> {status === 'NEEDS_REVISION' ? 'Nộp lại hồ sơ' : 'Nộp hồ sơ'}</h3>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase tracking-wide mb-1.5">Ghi chú gửi admin (tuỳ chọn)</label>
                <textarea rows={2} value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} placeholder="Ví dụ: Em bổ sung lại ảnh thẻ rõ nét và thêm chứng chỉ AWS…" className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none font-medium" />
              </div>
              <label className="flex items-center gap-2 text-meta font-bold text-fg-muted cursor-pointer">
                {termsAccepted ? <CheckSquare className="w-4.5 h-4.5 text-primary shrink-0" /> : <Square className="w-4.5 h-4.5 text-fg-faint shrink-0" />}
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="hidden" />
                Tôi xác nhận thông tin và minh chứng đã cung cấp là chính xác.
              </label>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {allowedActions?.canWithdraw
                  ? <button disabled={busy} onClick={handleWithdraw} className="inline-flex items-center gap-1.5 text-fg-muted hover:text-danger text-body font-bold py-2 px-3 rounded-field cursor-pointer disabled:opacity-50"><Undo2 className="w-4 h-4" /> Rút hồ sơ</button>
                  : <span className="text-meta text-fg-faint font-medium inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Hồ sơ được bảo mật, chỉ admin xem được.</span>}
                <button disabled={busy || !termsAccepted} onClick={handleSubmit} className="ml-auto inline-flex items-center gap-2 bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-5 rounded-field cursor-pointer active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"><Send className="w-4 h-4" /> {status === 'NEEDS_REVISION' ? 'Nộp lại' : 'Nộp hồ sơ duyệt'}</button>
              </div>
            </div>
          )}
          {!allowedActions?.canSubmit && allowedActions?.canWithdraw && (
            <button disabled={busy} onClick={handleWithdraw} className="w-full inline-flex items-center justify-center gap-1.5 bg-danger/10 hover:bg-danger/15 border border-danger/20 text-danger text-body font-bold py-2.5 px-4 rounded-field cursor-pointer disabled:opacity-50 transition-all"><Undo2 className="w-4 h-4" /> Rút hồ sơ đang chờ duyệt</button>
          )}

          {/* Approved info */}
          {status === 'APPROVED' && (
            <div className="meetmind-card p-6 rounded-card flex items-center justify-between gap-4 flex-wrap">
              <p className="text-body font-bold text-fg">Hồ sơ mentor đã kích hoạt. Quản lý mô tả & chuyên môn trong phần cấu hình.</p>
              <button onClick={() => navigate('/mentor/profile-setup')} className="bg-action hover:bg-action-hover text-on-action text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shrink-0">Cấu hình hồ sơ</button>
            </div>
          )}
        </div>

        {/* RIGHT — Timeline */}
        <div className="meetmind-card p-6 rounded-card lg:sticky lg:top-6">
          <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5 mb-4"><Clock className="w-5 h-5 text-primary" /> Lịch sử xử lý</h3>
          <div className="space-y-0">
            {(req?.timeline || []).map((e, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-3 h-3 rounded-full mt-1 ${EVENT_DOT[e.event] || 'bg-primary'}`} />
                  {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-line my-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-body font-bold text-fg leading-tight">{e.label || e.event}</p>
                  <p className="text-meta text-fg-muted font-medium mt-1">{e.at}</p>
                  {e.by && <p className="text-meta text-fg-faint font-medium">{e.by}</p>}
                </div>
              </div>
            ))}
            {(req?.timeline?.length ?? 0) === 0 && <p className="text-meta text-fg-muted font-medium">Chưa có sự kiện nào.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
