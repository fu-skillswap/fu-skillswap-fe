import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, UploadCloud, FileText, Image as ImageIcon, Trash2, Send,
  Clock, CheckCircle2, XCircle, AlertTriangle, Undo2, Plus, ArrowLeft, Paperclip,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mentorVerificationApi } from '../../api/mentorVerification';
import type { VerificationRequest, VerificationStatus, DocumentType, TimelineEvent } from '../../api/types';

// ---------------------------------------------------------------------------
// Cấu hình hiển thị theo trạng thái
// ---------------------------------------------------------------------------
const DOC_TYPES: Record<DocumentType, string> = {
  FPTU_AFFILIATION_PROOF: 'Minh chứng liên kết FPTU',
  EXPERTISE_PROOF: 'Minh chứng chuyên môn',
};

const STATUS_META: Record<VerificationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Bản nháp', cls: 'bg-brand-bg text-brand-text-muted border-brand-border', icon: <FileText className="w-3.5 h-3.5" /> },
  PENDING_REVIEW: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  NEEDS_REVISION: { label: 'Cần chỉnh sửa', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  WITHDRAWN: { label: 'Đã rút', cls: 'bg-brand-bg text-brand-text-muted border-brand-border', icon: <Undo2 className="w-3.5 h-3.5" /> },
};

// Mock fallback khi BE chưa kết nối (giữ trải nghiệm dev giống các page khác)
const buildMock = (status: VerificationStatus): VerificationRequest => ({
  requestId: 'mock-mv',
  status,
  reviewNote:
    status === 'NEEDS_REVISION' ? 'Ảnh thẻ sinh viên bị mờ, vui lòng chụp lại rõ nét và bổ sung minh chứng kinh nghiệm.'
      : status === 'REJECTED' ? 'Minh chứng chưa đủ căn cứ xác nhận quan hệ với FPTU.' : '',
  submittedAt: status === 'DRAFT' ? null : '2026-06-12 14:30',
  documents: [
    { documentId: 'd1', documentType: 'FPTU_AFFILIATION_PROOF', isPrimary: true, fileName: 'the-sinh-vien.jpg', mime: 'image/jpeg', sizeKb: 842 },
    { documentId: 'd2', documentType: 'EXPERTISE_PROOF', isPrimary: false, fileName: 'chung-chi-aws.pdf', mime: 'application/pdf', sizeKb: 1240 },
  ],
  timeline: [
    { event: 'CREATED', label: 'Khởi tạo hồ sơ', at: '2026-06-10 09:12', by: 'Bạn' },
    ...(status !== 'DRAFT' ? [{ event: 'SUBMITTED', label: 'Nộp hồ sơ chờ duyệt', at: '2026-06-12 14:30', by: 'Bạn' }] : []),
    ...(status === 'NEEDS_REVISION' ? [{ event: 'REVISION_REQUESTED', label: 'Admin yêu cầu chỉnh sửa', at: '2026-06-13 10:05', by: 'Admin' }] : []),
    ...(status === 'APPROVED' ? [{ event: 'APPROVED', label: 'Hồ sơ được duyệt', at: '2026-06-13 16:40', by: 'Admin' }] : []),
    ...(status === 'REJECTED' ? [{ event: 'REJECTED', label: 'Hồ sơ bị từ chối', at: '2026-06-13 16:40', by: 'Admin' }] : []),
  ] as TimelineEvent[],
});

interface BannerProps {
  status: VerificationStatus;
  reviewNote: string | null;
}

const Banner: React.FC<BannerProps> = ({ status, reviewNote }) => {
  const map: Record<VerificationStatus, { title: string; desc: string; cls: string; icon: React.ReactNode }> = {
    DRAFT: { title: 'Hồ sơ đang ở bản nháp', desc: 'Tải tối thiểu 1 minh chứng liên kết FPTU rồi nộp để admin duyệt.', cls: 'bg-brand-bg border-brand-border text-brand-text', icon: <FileText className="w-5 h-5" /> },
    PENDING_REVIEW: { title: 'Đang chờ admin duyệt', desc: 'Hồ sơ đã nộp. Bạn sẽ nhận thông báo khi có kết quả.', cls: 'bg-amber-50 border-amber-200 text-amber-700', icon: <Clock className="w-5 h-5" /> },
    NEEDS_REVISION: { title: 'Admin yêu cầu chỉnh sửa', desc: reviewNote || 'Vui lòng cập nhật theo ghi chú của admin và nộp lại.', cls: 'bg-blue-50 border-blue-200 text-blue-700', icon: <AlertTriangle className="w-5 h-5" /> },
    APPROVED: { title: 'Hồ sơ đã được duyệt 🎉', desc: 'Bạn đã chính thức là Mentor. Hồ sơ đã hiển thị công khai.', cls: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle2 className="w-5 h-5" /> },
    REJECTED: { title: 'Hồ sơ bị từ chối', desc: reviewNote || 'Hồ sơ chưa đạt yêu cầu. Tạo hồ sơ mới để nộp lại.', cls: 'bg-red-50 border-red-200 text-red-700', icon: <XCircle className="w-5 h-5" /> },
    WITHDRAWN: { title: 'Bạn đã rút hồ sơ', desc: 'Hồ sơ xác thực đã được rút. Bạn có thể tạo hồ sơ mới bất cứ lúc nào.', cls: 'bg-brand-bg border-brand-border text-brand-text-muted', icon: <Undo2 className="w-5 h-5" /> },
  };
  const b = map[status];
  return (
    <div className={`flex items-start gap-3 border rounded-card p-4 ${b.cls}`}>
      <span className="shrink-0 mt-0.5">{b.icon}</span>
      <div>
        <p className="text-body font-extrabold">{b.title}</p>
        <p className="text-meta font-medium mt-0.5 opacity-90">{b.desc}</p>
      </div>
    </div>
  );
};

export const MentorVerification: React.FC = () => {
  const navigate = useNavigate();
  const [req, setReq] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('FPTU_AFFILIATION_PROOF');
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // -------------------- load --------------------
  const load = async () => {
    setLoading(true);
    try {
      const current = await mentorVerificationApi.getCurrent();
      // ghép timeline nếu API tách riêng
      try { current.timeline = await mentorVerificationApi.getTimeline(); } catch { /* optional */ }
      setReq(current);
      setUsingMock(false);
    } catch {
      setReq(buildMock('DRAFT'));
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };
  const status = req?.status ?? 'DRAFT';
  const editable = status === 'DRAFT' || status === 'NEEDS_REVISION';

  // -------------------- actions --------------------
  const createNew = async () => {
    setBusy(true);
    try {
      if (usingMock) setReq(buildMock('DRAFT'));
      else { const r = await mentorVerificationApi.createOrGetRequest(); setReq(r); }
      flash('Đã tạo hồ sơ xác thực mới.');
    } finally { setBusy(false); }
  };

  const handleUpload = async (file?: File) => {
    if (!req) return;
    setBusy(true);
    try {
      if (usingMock || !file) {
        const fake = {
          documentId: 'd' + Date.now(), documentType: docType, isPrimary,
          fileName: file?.name || (docType === 'FPTU_AFFILIATION_PROOF' ? 'minh-chung-fptu.jpg' : 'minh-chung-chuyen-mon.pdf'),
          mime: file?.type || 'image/jpeg', sizeKb: file ? Math.round(file.size / 1024) : 700,
        };
        setReq({ ...req, documents: [...req.documents, fake] });
      } else {
        const doc = await mentorVerificationApi.uploadDocument({ documentType: docType, isPrimary, file });
        setReq({ ...req, documents: [...req.documents, doc] });
      }
      setIsPrimary(false);
      flash('Đã tải lên minh chứng.');
    } finally { setBusy(false); }
  };

  const handleDelete = async (documentId: string) => {
    if (!req) return;
    setBusy(true);
    try {
      if (!usingMock) await mentorVerificationApi.deleteDocument(documentId);
      setReq({ ...req, documents: req.documents.filter((d) => d.documentId !== documentId) });
      flash('Đã xoá minh chứng.');
    } finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    if (!req) return;
    setBusy(true);
    try {
      if (usingMock) setReq({ ...req, status: 'PENDING_REVIEW', submittedAt: new Date().toISOString() });
      else { const r = await mentorVerificationApi.submit(submitNote); setReq(r); }
      flash('Đã nộp hồ sơ chờ admin duyệt.');
    } finally { setBusy(false); }
  };

  const handleWithdraw = async () => {
    if (!req) return;
    setBusy(true);
    try {
      if (usingMock) setReq({ ...req, status: 'WITHDRAWN' });
      else { const r = await mentorVerificationApi.withdraw(); setReq(r); }
      flash('Đã rút hồ sơ.');
    } finally { setBusy(false); }
  };

  if (loading) {
    return <div className="py-20 flex justify-center"><div className="w-7 h-7 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" /></div>;
  }

  const sm = STATUS_META[status];

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mentor/profile-setup')} className="p-2 rounded-field hover:bg-brand-bg text-brand-text-muted cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-brand-terracotta" /> Xác thực Mentor</h1>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-meta font-extrabold uppercase tracking-wide py-1 px-2.5 rounded-lg border ${sm.cls}`}>{sm.icon}{sm.label}</span>
      </div>

      {usingMock && (
        <div className="text-meta font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-field px-3 py-2">
          Đang dùng dữ liệu mẫu (chưa kết nối backend). Khi đăng nhập thật, trang sẽ tự gọi API <code>/api/me/mentor-verification</code>.
        </div>
      )}
      {msg && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-field text-body font-semibold"><CheckCircle2 className="w-4 h-4" />{msg}</div>}

      <Banner status={status} reviewNote={req?.reviewNote ?? null} />

      {/* Approved / Rejected / Withdrawn actions */}
      {status === 'APPROVED' && (
        <div className="meetmind-card p-6 rounded-card flex items-center justify-between gap-4">
          <p className="text-body font-bold text-brand-text">Hồ sơ mentor đã kích hoạt. Quản lý mô tả & chuyên môn trong phần cấu hình.</p>
          <button onClick={() => navigate('/mentor/profile-setup')} className="bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shrink-0">Cấu hình hồ sơ</button>
        </div>
      )}
      {(status === 'REJECTED' || status === 'WITHDRAWN') && (
        <div className="meetmind-card p-6 rounded-card flex items-center justify-between gap-4">
          <p className="text-body text-brand-text-muted font-medium">{status === 'REJECTED' ? 'Theo quy định, hồ sơ bị từ chối cần tạo mới để nộp lại.' : 'Tạo hồ sơ mới để bắt đầu lại quy trình xác thực.'}</p>
          <button disabled={busy} onClick={createNew} className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shrink-0 disabled:opacity-50"><Plus className="w-4 h-4" /> Tạo hồ sơ mới</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Documents */}
        <div className="md:col-span-2 space-y-5">
          <div className="meetmind-card p-6 rounded-card space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
              <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2"><Paperclip className="w-4.5 h-4.5 text-brand-terracotta" /> Minh chứng</h3>
              <span className="text-meta font-bold text-brand-text-muted">{req?.documents.length || 0} tệp</span>
            </div>

            <div className="space-y-2">
              {(req?.documents.length ?? 0) === 0 ? (
                <p className="text-meta text-brand-text-muted py-3 text-center font-medium">Chưa có minh chứng nào.</p>
              ) : req!.documents.map((d) => {
                const isImg = d.mime?.startsWith('image');
                return (
                  <div key={d.documentId} className="flex items-center gap-3 bg-brand-bg/40 border border-brand-border rounded-card p-3">
                    <div className={`w-10 h-10 rounded-field flex items-center justify-center shrink-0 ${isImg ? 'bg-brand-blue/15 text-brand-blue' : 'bg-brand-terracotta/15 text-brand-terracotta'}`}>
                      {isImg ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-bold text-brand-text truncate">{d.fileName}</p>
                      <p className="text-meta text-brand-text-muted font-medium">{DOC_TYPES[d.documentType]}{d.sizeKb ? ` · ${d.sizeKb} KB` : ''}</p>
                    </div>
                    {d.isPrimary && <span className="text-meta font-extrabold text-brand-terracotta bg-brand-terracotta/10 border border-brand-terracotta/20 px-2 py-0.5 rounded-lg">Chính</span>}
                    {editable && <button onClick={() => handleDelete(d.documentId)} className="p-1.5 rounded-field text-brand-text-muted hover:text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                );
              })}
            </div>

            {editable && (
              <div className="bg-brand-bg/30 border border-dashed border-brand-border rounded-card p-4 space-y-3">
                <span className="text-meta font-bold text-brand-text uppercase block">Tải minh chứng mới</span>
                <div className="grid sm:grid-cols-2 gap-3">
                  <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="bg-surface border border-brand-border rounded-field py-2 px-3 text-body focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold">
                    {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-meta font-bold text-brand-text-muted cursor-pointer pl-1">
                    <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} /> Đặt làm minh chứng chính
                  </label>
                </div>
                <label className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-field py-4 text-brand-text-muted hover:text-brand-terracotta hover:border-brand-terracotta/40 transition-all cursor-pointer font-bold text-body">
                  <UploadCloud className="w-5 h-5" /> Chọn tệp (jpg / png / pdf)
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              </div>
            )}
          </div>

          {/* Submit / withdraw */}
          {editable && (
            <div className="meetmind-card p-5 rounded-card space-y-3">
              <label className="block text-meta font-bold text-brand-text-muted uppercase">Ghi chú gửi admin (tuỳ chọn)</label>
              <textarea rows={2} value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} placeholder="Em gửi hồ sơ xác thực mentor, mong thầy cô duyệt." className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body focus:outline-none focus:border-brand-terracotta resize-none font-medium" />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {status === 'NEEDS_REVISION' && <button disabled={busy} onClick={handleWithdraw} className="flex items-center gap-1.5 text-brand-text-muted hover:text-red-600 text-body font-bold py-2 px-3 rounded-field cursor-pointer disabled:opacity-50"><Undo2 className="w-4 h-4" /> Rút hồ sơ</button>}
                <button disabled={busy || (req?.documents.length ?? 0) === 0} onClick={handleSubmit} className="ml-auto flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-4 h-4" /> {status === 'NEEDS_REVISION' ? 'Nộp lại' : 'Nộp hồ sơ'}</button>
              </div>
            </div>
          )}
          {status === 'PENDING_REVIEW' && (
            <button disabled={busy} onClick={handleWithdraw} className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-body font-bold py-2.5 px-4 rounded-field cursor-pointer disabled:opacity-50"><Undo2 className="w-4 h-4" /> Rút hồ sơ đang chờ duyệt</button>
          )}
        </div>

        {/* Timeline */}
        <div className="meetmind-card p-6 rounded-card">
          <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2.5 mb-4"><Clock className="w-4.5 h-4.5 text-brand-blue" /> Lịch sử xử lý</h3>
          <div className="space-y-0">
            {(req?.timeline || []).map((e, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-terracotta mt-1.5" />
                  {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-brand-border my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-body font-bold text-brand-text leading-tight">{e.label || e.event}</p>
                  <p className="text-meta text-brand-text-muted font-medium mt-0.5">{e.at}{e.by ? ` · ${e.by}` : ''}</p>
                </div>
              </div>
            ))}
            {(req?.timeline?.length ?? 0) === 0 && <p className="text-meta text-brand-text-muted font-medium">Chưa có sự kiện nào.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
