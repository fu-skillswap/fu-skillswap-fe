import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Search, RefreshCw, ShieldCheck, UserCircle2 } from 'lucide-react';
import { adminMentorVerificationApi } from '../../api/adminMentorVerification';
import type {
  AdminMentorVerificationQueueItemResponse,
  AdminMentorVerificationQueueParams,
  VerificationStatus,
  Paged,
} from '../../api/types';

const DEFAULT_FILTERS: AdminMentorVerificationQueueParams = {
  status: 'PENDING_REVIEW',
  page: 0,
  size: 20,
  sortBy: 'submittedAt',
  direction: 'DESC',
};

const STATUS_OPTIONS: VerificationStatus[] = [
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'DRAFT',
  'WITHDRAWN',
];

const STATUS_LABELS: Record<VerificationStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  NEEDS_REVISION: 'Cần bổ sung',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  WITHDRAWN: 'Đã rút',
};

function formatDateTime(value?: string | null): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getName(item: AdminMentorVerificationQueueItemResponse): string {
  return item.mentorFullName;
}

function getEmail(item: AdminMentorVerificationQueueItemResponse): string {
  return item.mentorEmail;
}

function getAvatar(item: AdminMentorVerificationQueueItemResponse): string | null {
  return item.mentorAvatarUrl ?? null;
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

export const MentorVerificationQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminMentorVerificationQueueItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<VerificationStatus | ''>(DEFAULT_FILTERS.status ?? 'PENDING_REVIEW');

  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      keyword: keyword.trim() || undefined,
      status: status || undefined,
    }),
    [keyword, status]
  );

  useEffect(() => {
    let cancelled = false;

    const loadQueue = async () => {
      setLoading(true);
      setError(null);
      setErrorStatus(null);
      try {
        console.log('[AdminVerification] fetching queue');
        console.log('[AdminVerification] query params', filters);
        const response = await adminMentorVerificationApi.getVerificationQueue(filters);
        console.log('[AdminVerification] response data', response);
        if (!cancelled) {
          if (Array.isArray(response)) {
            setItems(response);
          } else {
            const normalizedItems =
              (response as Paged<AdminMentorVerificationQueueItemResponse>).content ??
              (response as { items?: AdminMentorVerificationQueueItemResponse[] }).items ??
              (Array.isArray(response) ? response : []);
            console.log('[AdminVerification] normalized items', normalizedItems);
            setItems(normalizedItems);
          }
        }
      } catch (err) {
        if (cancelled) return;
        const statusCode = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
        console.error('[AdminVerification] queue load failed', {
          statusCode,
          message: err instanceof Error ? err.message : String(err),
          error: err,
        });
        setErrorStatus(statusCode);
        const message =
          statusCode === 404
            ? 'Không tìm thấy dữ liệu.'
            : statusCode === 409
              ? 'Xung đột dữ liệu. Vui lòng tải lại trang.'
              : err instanceof Error
                ? err.message
                : 'Không thể tải danh sách hồ sơ mentor chờ duyệt.';
        setError(message);
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadQueue();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-meta font-bold uppercase tracking-[0.18em] text-brand-text-muted">
            <ShieldCheck className="h-4 w-4 text-brand-terracotta" />
            Mentor Verification Queue
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text">Hồ sơ mentor chờ duyệt</h1>
          <p className="max-w-2xl text-body font-medium leading-6 text-brand-text-muted">
            Xem danh sách hồ sơ mentor đang chờ xử lý, tìm nhanh theo từ khóa và lọc theo trạng thái.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-field border border-brand-border bg-white px-4 py-2.5 text-body font-semibold text-brand-text transition-all hover:bg-brand-bg/60"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      <div className="grid gap-3 rounded-[28px] border border-brand-border bg-white/85 p-4 shadow-sm lg:grid-cols-[1fr_220px] lg:items-center">
        <label className="flex items-center gap-3 rounded-field border border-brand-border bg-brand-bg/60 px-4 py-3">
          <Search className="h-4 w-4 text-brand-text-muted" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, email, chuyên ngành..."
            className="w-full bg-transparent text-body font-medium text-brand-text outline-none placeholder:text-brand-text-muted"
          />
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VerificationStatus | '')}
          className="w-full rounded-field border border-brand-border bg-brand-bg/60 px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="rounded-[28px] border border-brand-border bg-white/85 p-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-terracotta/20 border-t-brand-terracotta" />
          <p className="mt-4 text-body font-semibold text-brand-text-muted">Đang tải danh sách hồ sơ...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="text-body font-medium">{error}</span>
        </div>
      )}

      {!loading && errorStatus === 404 && (
        <div className="rounded-[28px] border border-brand-border bg-white/85 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-brand-text">Không tìm thấy hồ sơ</h2>
          <p className="mt-2 text-body font-medium text-brand-text-muted">
            Dữ liệu admin mentor verification hiện chưa có hoặc đã thay đổi.
          </p>
        </div>
      )}

      {!loading && errorStatus === 409 && (
        <div className="rounded-[28px] border border-brand-border bg-white/85 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-brand-text">Đang có xung đột dữ liệu</h2>
          <p className="mt-2 text-body font-medium text-brand-text-muted">
            Vui lòng tải lại trang và thử lại sau khi hệ thống đồng bộ xong.
          </p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-[28px] border border-brand-border bg-white/85 p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg text-brand-text-muted">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-brand-text">Không có hồ sơ phù hợp</h2>
          <p className="mt-2 text-body font-medium text-brand-text-muted">
            Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm để xem các hồ sơ khác.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-hidden rounded-[28px] border border-brand-border bg-white/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-brand-bg/70">
                <tr className="text-meta font-bold uppercase tracking-wider text-brand-text-muted">
                  <th className="px-6 py-4">Mentor</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Trạng thái</th>
                  <th className="px-4 py-4">Revision</th>
                  <th className="px-4 py-4">Submitted</th>
                  <th className="px-4 py-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {items.map((item) => (
                  <tr
                    key={item.requestId}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/mentor-verification/${item.requestId}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/mentor-verification/${item.requestId}`);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-brand-bg/40 focus:bg-brand-bg/40 focus:outline-none"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getAvatar(item) ? (
                          <img
                            src={getAvatar(item) || undefined}
                            alt={getName(item)}
                            className="h-11 w-11 rounded-2xl object-cover ring-1 ring-brand-border"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-bg text-brand-text-muted">
                            <UserCircle2 className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-brand-text">{getName(item)}</p>
                          <p className="truncate text-sm font-medium text-brand-text-muted">ID: {item.mentorUserId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="block max-w-[280px] truncate text-body font-medium text-brand-text-muted">
                        {getEmail(item)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-meta font-bold ${statusTone(item.status)}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-body font-semibold text-brand-text">{item.revisionCount ?? 0}</td>
                    <td className="px-4 py-4 text-body font-medium text-brand-text-muted">{formatDateTime(item.submittedAt)}</td>
                    <td className="px-4 py-4 text-body font-medium text-brand-text-muted">{formatDateTime(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
