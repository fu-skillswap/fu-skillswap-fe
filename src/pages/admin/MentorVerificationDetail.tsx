import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { adminMentorVerificationApi } from '../../api/adminMentorVerification';
import type { AdminMentorVerificationRequestResponse, VerificationStatus } from '../../api/types';

type BannerState =
  | { kind: 'loading' }
  | { kind: 'allowed' }
  | { kind: 'locked'; lockedByAdminEmail: string | null }
  | { kind: 'unavailable' };

type ActionModalState =
  | { kind: 'closed' }
  | { kind: 'approve'; note: string }
  | { kind: 'reject'; note: string }
  | { kind: 'revision'; note: string };

function formatDateTime(value?: string | null): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp';
    case 'PENDING_REVIEW':
      return 'Chờ duyệt';
    case 'NEEDS_REVISION':
      return 'Cần bổ sung';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'REJECTED':
      return 'Từ chối';
    case 'WITHDRAWN':
      return 'Đã rút';
    default:
      return status;
  }
}

function statusTone(status: VerificationStatus): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'NEEDS_REVISION':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'WITHDRAWN':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getFileName(doc: any): string {
  return doc.fileName || doc.name || doc.documentName || 'Tài liệu';
}

function getFileType(doc: any): string {
  return doc.documentType || doc.contentType || doc.mime || 'Không rõ';
}

function getFileSize(doc: any): string {
  const size = doc.sizeBytes ?? doc.sizeKb;
  if (size === undefined || size === null) return 'Chưa rõ';
  if (doc.sizeBytes) return `${Math.round(Number(size) / 1024)} KB`;
  return `${size} KB`;
}

function getFileUrl(doc: any): string | null {
  return doc.fileUrl || doc.url || null;
}

function canOpen(doc: any): boolean {
  return !!getFileUrl(doc);
}

export const MentorVerificationDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const [detail, setDetail] = useState<AdminMentorVerificationRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [banner, setBanner] = useState<BannerState>({ kind: 'loading' });
  const [actionModal, setActionModal] = useState<ActionModalState>({ kind: 'closed' });
  const [noteError, setNoteError] = useState<string | null>(null);
  const [lockDisabled, setLockDisabled] = useState(false);

  const canAction = !!detail && detail.status === 'PENDING_REVIEW' && detail.canReview && !lockDisabled;

  const loadDetail = async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const res = await adminMentorVerificationApi.getVerificationDetail(requestId);
      setDetail(res);
      if (res.canReview) {
        setBanner({ kind: 'allowed' });
      } else if (res.lockedByAdminEmail) {
        setBanner({ kind: 'locked', lockedByAdminEmail: res.lockedByAdminEmail });
      } else {
        setBanner({ kind: 'unavailable' });
      }
      setLockDisabled(false);
    } catch (err) {
      const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      setErrorStatus(statusCode);
      const message =
        statusCode === 404
          ? 'Không tìm thấy hồ sơ.'
          : statusCode === 409
            ? 'Xung đột dữ liệu. Hồ sơ đang được xử lý ở phiên khác.'
            : err instanceof Error
              ? err.message
              : 'Không thể tải chi tiết hồ sơ.';
      setError(message);
      setDetail(null);
      setBanner({ kind: 'unavailable' });
    } finally {
      setLoading(false);
    }
  };

  const refreshLock = async () => {
    if (!requestId || !detail?.canReview) return;
    try {
      const lock = await adminMentorVerificationApi.refreshLock(requestId);
      if (!lock?.locked) {
        setLockDisabled(true);
        await loadDetail();
      }
    } catch (err) {
      setLockDisabled(true);
      await loadDetail();
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    loadDetail();
  }, [requestId]);

  useEffect(() => {
    if (!requestId || !detail?.canReview || detail.status !== 'PENDING_REVIEW') return;
    const interval = window.setInterval(() => {
      refreshLock();
    }, 3 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [requestId, detail?.canReview, detail?.status]);

  const openAction = (kind: 'approve' | 'reject' | 'revision') => {
    setNoteError(null);
    if (kind === 'approve') setActionModal({ kind, note: '' });
    if (kind === 'reject') setActionModal({ kind, note: '' });
    if (kind === 'revision') setActionModal({ kind, note: '' });
  };

  const submitAction = async () => {
    if (!requestId || !detail) return;
    if (actionModal.kind === 'closed') return;

    const note = actionModal.note.trim();
    if ((actionModal.kind === 'reject' || actionModal.kind === 'revision') && !note) {
      setNoteError('Ghi chú không được để trống.');
      return;
    }

    setSaving(true);
    setNoteError(null);
    try {
      const next =
        actionModal.kind === 'approve'
          ? await adminMentorVerificationApi.approveVerification(requestId, note || undefined)
          : actionModal.kind === 'reject'
            ? await adminMentorVerificationApi.rejectVerification(requestId, note)
            : await adminMentorVerificationApi.requestRevision(requestId, note);
      setDetail(next);
      if (next.status !== 'PENDING_REVIEW') {
        setLockDisabled(true);
      }
      setActionModal({ kind: 'closed' });
      await loadDetail();
    } catch (err) {
      const message =
        err instanceof Error && 'status' in err && Number((err as Error & { status?: number }).status) === 409
          ? 'Xung đột dữ liệu. Vui lòng tải lại hồ sơ.'
          : err instanceof Error
            ? err.message
            : 'Không thể thực hiện thao tác.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const checklistItems = useMemo(() => {
    if (!detail?.checklist) return [];
    return Array.isArray(detail.checklist) ? detail.checklist : Object.entries(detail.checklist).map(([key, value]) => ({ key, label: String(key), passed: !!value }));
  }, [detail?.checklist]);

  if (loading && !detail) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-terracotta/20 border-t-brand-terracotta" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/mentor-verification"
          className="inline-flex items-center gap-2 rounded-field border border-brand-border bg-white px-4 py-2.5 text-body font-semibold text-brand-text transition-all hover:bg-brand-bg/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại queue
        </Link>
        <button
          type="button"
          onClick={loadDetail}
          className="inline-flex items-center gap-2 rounded-field border border-brand-border bg-white px-4 py-2.5 text-body font-semibold text-brand-text transition-all hover:bg-brand-bg/60"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="text-body font-medium">{error}</span>
        </div>
      )}

      {errorStatus === 404 && !detail && (
        <div className="rounded-[28px] border border-brand-border bg-white/85 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-brand-text">Không tìm thấy hồ sơ</h2>
          <p className="mt-2 text-body font-medium text-brand-text-muted">Hồ sơ mentor này không còn tồn tại hoặc đã bị ẩn.</p>
        </div>
      )}

      {errorStatus === 409 && !detail && (
        <div className="rounded-[28px] border border-brand-border bg-white/85 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-brand-text">Xung đột dữ liệu</h2>
          <p className="mt-2 text-body font-medium text-brand-text-muted">Hồ sơ đang được xử lý ở phiên khác, vui lòng thử lại.</p>
        </div>
      )}

      {detail && (
        <>
          <div className="rounded-[28px] border border-brand-border bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {detail.mentorAvatarUrl ? (
                  <img src={detail.mentorAvatarUrl} alt={detail.mentorFullName} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-brand-border" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-bg text-brand-text-muted">
                    <UserCircle2 className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-brand-text">{detail.mentorFullName}</h1>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-meta font-bold ${statusTone(detail.status)}`}>
                      {getStatusLabel(detail.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-body font-medium text-brand-text-muted">{detail.mentorEmail}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border bg-brand-bg/60 px-4 py-3 text-sm font-semibold text-brand-text-muted">
                <div>Request ID: <span className="text-brand-text">{detail.requestId}</span></div>
                <div>Revision: <span className="text-brand-text">{detail.revisionCount}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-brand-border bg-white/90 p-4 shadow-sm">
            {banner.kind === 'allowed' && (
              <div className="flex items-center gap-2 text-brand-text">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">Bạn đang xử lý hồ sơ này.</span>
              </div>
            )}
            {banner.kind === 'locked' && (
              <div className="flex items-center gap-2 text-brand-text">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">Hồ sơ đang được admin khác xử lý: {banner.lockedByAdminEmail || 'không rõ'}</span>
              </div>
            )}
            {banner.kind === 'unavailable' && (
              <div className="flex items-center gap-2 text-brand-text-muted">
                <Clock3 className="h-5 w-5" />
                <span className="font-semibold">Hồ sơ hiện chưa sẵn sàng để review.</span>
              </div>
            )}
            {detail && banner.kind === 'loading' && (
              <div className="flex items-center gap-2 text-brand-text-muted">
                <Clock3 className="h-5 w-5" />
                <span className="font-semibold">Đang kiểm tra trạng thái khóa...</span>
              </div>
            )}
            {detail.lockedAt && (
              <p className="mt-2 text-sm text-brand-text-muted">
                Khóa lúc: <span className="font-semibold text-brand-text">{formatDateTime(detail.lockedAt)}</span>
                {detail.lockExpiresAt ? (
                  <>
                    {' '}
                    - Hết hạn: <span className="font-semibold text-brand-text">{formatDateTime(detail.lockExpiresAt)}</span>
                  </>
                ) : null}
              </p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[28px] border border-brand-border bg-white/90 p-5 shadow-sm">
              <h2 className="text-xl font-bold text-brand-text">Hồ sơ học thuật</h2>
              {detail.studentProfile ? (
                <pre className="mt-4 overflow-auto rounded-2xl bg-brand-bg/60 p-4 text-sm text-brand-text-muted">
                  {JSON.stringify(detail.studentProfile, null, 2)}
                </pre>
              ) : (
                <p className="mt-4 text-body font-medium text-brand-text-muted">Chưa có hoặc không lấy được hồ sơ học thuật.</p>
              )}
            </section>

            <section className="rounded-[28px] border border-brand-border bg-white/90 p-5 shadow-sm">
              <h2 className="text-xl font-bold text-brand-text">Hồ sơ mentor</h2>
              {detail.mentorProfile ? (
                <pre className="mt-4 overflow-auto rounded-2xl bg-brand-bg/60 p-4 text-sm text-brand-text-muted">
                  {JSON.stringify(detail.mentorProfile, null, 2)}
                </pre>
              ) : (
                <p className="mt-4 text-body font-medium text-brand-text-muted">Thiếu dữ liệu hồ sơ mentor.</p>
              )}
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[28px] border border-brand-border bg-white/90 p-5 shadow-sm">
              <h2 className="text-xl font-bold text-brand-text">Checklist</h2>
              {checklistItems.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {checklistItems.map((item: any) => (
                    <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-bg/50 p-4">
                      <div className={`mt-0.5 h-5 w-5 rounded-full ${item.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="font-semibold text-brand-text">{item.label || item.key}</p>
                        {item.note ? <p className="mt-1 text-sm text-brand-text-muted">{item.note}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-body font-medium text-brand-text-muted">Chưa có checklist.</p>
              )}
            </section>

            <section className="rounded-[28px] border border-brand-border bg-white/90 p-5 shadow-sm">
              <h2 className="text-xl font-bold text-brand-text">Tài liệu</h2>
              {Array.isArray(detail.documents) && detail.documents.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {detail.documents.map((doc: any, index: number) => (
                    <button
                      key={doc.documentId || index}
                      type="button"
                      onClick={() => {
                        const fileUrl = getFileUrl(doc);
                        if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
                      }}
                      disabled={!canOpen(doc)}
                      className="w-full rounded-2xl border border-brand-border bg-brand-bg/50 p-4 text-left transition-all hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-brand-terracotta" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-brand-text">{getFileName(doc)}</p>
                          <p className="mt-1 text-sm text-brand-text-muted">
                            {getFileType(doc)} · {getFileSize(doc)}
                          </p>
                          {getFileUrl(doc) ? <p className="mt-1 truncate text-sm text-brand-primary">{getFileUrl(doc)}</p> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-body font-medium text-brand-text-muted">Chưa có tài liệu.</p>
              )}
            </section>
          </div>

          <section className="rounded-[28px] border border-brand-border bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-bold text-brand-text">Timeline</h2>
            {Array.isArray(detail.timeline) && detail.timeline.length > 0 ? (
              <div className="mt-4 space-y-4">
                {detail.timeline
                  .slice()
                  .sort((a: any, b: any) => new Date(a.createdAt || a.at || 0).getTime() - new Date(b.createdAt || b.at || 0).getTime())
                  .map((event: any, index: number) => (
                    <div key={`${event.event || index}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-brand-terracotta" />
                        {index !== detail.timeline.length - 1 ? <div className="mt-1 h-full w-px bg-brand-border" /> : null}
                      </div>
                      <div className="flex-1 rounded-2xl border border-brand-border bg-brand-bg/50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-brand-text">{event.label || event.event}</p>
                          <span className="text-sm text-brand-text-muted">{formatDateTime(event.createdAt || event.at)}</span>
                        </div>
                        {event.by ? <p className="mt-1 text-sm text-brand-text-muted">Bởi {event.by}</p> : null}
                        {event.note ? <p className="mt-1 text-sm text-brand-text-muted">{event.note}</p> : null}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-body font-medium text-brand-text-muted">Chưa có timeline.</p>
            )}
          </section>

          <div className="rounded-[28px] border border-brand-border bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-text">Thao tác xử lý</h2>
                <p className="mt-1 text-body font-medium text-brand-text-muted">
                  Chỉ mở khi hồ sơ ở trạng thái chờ duyệt và bạn đang giữ soft lock.
                </p>
              </div>
              <div className="text-sm font-semibold text-brand-text-muted">
                Trạng thái hiện tại: <span className="text-brand-text">{getStatusLabel(detail.status)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!canAction || saving}
                onClick={() => openAction('approve')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-field bg-emerald-600 px-5 py-3.5 text-body font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4.5 w-4.5" />
                Duyệt
              </button>
              <button
                type="button"
                disabled={!canAction || saving}
                onClick={() => openAction('reject')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-field bg-rose-600 px-5 py-3.5 text-body font-bold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4.5 w-4.5" />
                Từ chối
              </button>
              <button
                type="button"
                disabled={!canAction || saving}
                onClick={() => openAction('revision')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-field border border-brand-border bg-white px-5 py-3.5 text-body font-bold text-brand-text transition-all hover:bg-brand-bg/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4.5 w-4.5" />
                Yêu cầu bổ sung
              </button>
            </div>
          </div>
        </>
      )}

      {actionModal.kind !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-brand-border bg-white p-6 shadow-xl">
            <h3 className="text-2xl font-bold text-brand-text">
              {actionModal.kind === 'approve' ? 'Duyệt hồ sơ' : actionModal.kind === 'reject' ? 'Từ chối hồ sơ' : 'Yêu cầu bổ sung'}
            </h3>
            <p className="mt-2 text-body font-medium text-brand-text-muted">
              {actionModal.kind === 'approve'
                ? 'Có thể thêm ghi chú nếu cần.'
                : 'Vui lòng nhập ghi chú trước khi gửi.'}
            </p>

            <textarea
              value={actionModal.note}
              onChange={(e) => {
                if (actionModal.kind === 'approve') setActionModal({ kind: 'approve', note: e.target.value });
                if (actionModal.kind === 'reject') setActionModal({ kind: 'reject', note: e.target.value });
                if (actionModal.kind === 'revision') setActionModal({ kind: 'revision', note: e.target.value });
              }}
              rows={5}
              placeholder={actionModal.kind === 'approve' ? 'Ghi chú tùy chọn...' : 'Nhập ghi chú bắt buộc...'}
              className="mt-4 w-full rounded-2xl border border-brand-border bg-brand-bg/50 p-4 text-body text-brand-text outline-none focus:border-brand-terracotta"
            />

            {noteError && <p className="mt-2 text-sm font-medium text-red-600">{noteError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setActionModal({ kind: 'closed' })}
                className="flex-1 rounded-field border border-brand-border bg-white px-4 py-3 text-body font-bold text-brand-text"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={saving}
                className="flex-1 rounded-field bg-brand-terracotta px-4 py-3 text-body font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
