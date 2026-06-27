// =====================================================================
// src/pages/admin/mentor-verification/page.tsx — Admin Verification Queue
// =====================================================================
"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { getVerificationQueue, type AdminVerificationQueueItem } from '@/lib/api/adminMentorVerificationApi';

export default function AdminMentorVerificationQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SYSTEM_ADMIN') || false;

  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<AdminVerificationQueueItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filters for API query
  const [filters, setFilters] = useState({
    status: 'PENDING_REVIEW',
    page: 0,
    size: 20,
    sortBy: 'submittedAt',
    direction: 'DESC',
  });

  // Client-side search and date filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Stats overview numbers
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    revision: 0
  });

  // Dynamically load Material Symbols Outlined stylesheet
  useEffect(() => {
    const linkSymbols = document.createElement('link');
    linkSymbols.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    linkSymbols.rel = 'stylesheet';
    document.head.appendChild(linkSymbols);

    return () => {
      document.head.removeChild(linkSymbols);
    };
  }, []);

  // Fetch counts on mount/update to show in the stats overview cards
  useEffect(() => {
    if (!isAdmin) return;

    const loadStats = async () => {
      try {
        const [totalRes, pendingRes, revisionRes] = await Promise.all([
          getVerificationQueue({ size: 1 }),
          getVerificationQueue({ status: 'PENDING_REVIEW', size: 1 }),
          getVerificationQueue({ status: 'NEEDS_REVISION', size: 1 })
        ]);
        setStats({
          total: totalRes.totalElements,
          pending: pendingRes.totalElements,
          revision: revisionRes.totalElements
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    loadStats();
  }, [isAdmin]);

  // Main data fetch
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    const loadQueue = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getVerificationQueue({
          status: filters.status || undefined,
          page: filters.page,
          size: filters.size,
          sortBy: filters.sortBy,
          direction: filters.direction,
        });

        setQueue(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error(err);
        let errMsg = 'Không thể tải danh sách hàng đợi xét duyệt.';
        if (isAxiosError<{ message?: string; error?: string }>(err)) {
          errMsg = err.response?.data?.message || err.response?.data?.error || errMsg;
        }
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    loadQueue();
  }, [isAdmin, navigate, filters]);

  const handleRowClick = (requestId: string) => {
    navigate(`/admin/mentor-verification/${requestId}`);
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? (typeof value === 'number' ? value : prev.page) : 0,
    }));
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN');
  };

  // Local client-side filtering on the fetched data
  const filteredQueue = queue.filter(item => {
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword =
      item.mentorFullName.toLowerCase().includes(keyword) ||
      item.mentorEmail.toLowerCase().includes(keyword) ||
      item.requestId.toLowerCase().includes(keyword);

    let matchesFromDate = true;
    if (fromDate && item.submittedAt) {
      const itemDate = new Date(item.submittedAt);
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      matchesFromDate = itemDate >= start;
    }

    let matchesToDate = true;
    if (toDate && item.submittedAt) {
      const itemDate = new Date(item.submittedAt);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      matchesToDate = itemDate <= end;
    }

    return matchesKeyword && matchesFromDate && matchesToDate;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-pending/10 text-status-pending border border-status-pending/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-pending"></span>
            Chờ duyệt
          </span>
        );
      case 'NEEDS_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-revision/10 text-status-revision border border-status-revision/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-revision"></span>
            Cần chỉnh sửa
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-approved/10 text-status-approved border border-status-approved/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-approved"></span>
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-rejected/10 text-status-rejected border border-status-rejected/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-rejected"></span>
            Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {status}
          </span>
        );
    }
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(0, filters.page - 2);
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    if (start > 0) {
      buttons.push(
        <button
          key={0}
          onClick={() => handleFilterChange('page', 0)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${filters.page === 0
            ? 'bg-primary text-white font-semibold'
            : 'hover:bg-surface-background text-text-muted hover:text-text-main'
            }`}
        >
          1
        </button>
      );
      if (start > 1) {
        buttons.push(<span key="ellipsis-start" className="text-text-muted px-1">...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handleFilterChange('page', i)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${filters.page === i
            ? 'bg-primary text-white font-semibold'
            : 'hover:bg-surface-background text-text-muted hover:text-text-main'
            }`}
        >
          {i + 1}
        </button>
      );
    }

    if (end < totalPages - 1) {
      if (end < totalPages - 2) {
        buttons.push(<span key="ellipsis-end" className="text-text-muted px-1">...</span>);
      }
      buttons.push(
        <button
          key={totalPages - 1}
          onClick={() => handleFilterChange('page', totalPages - 1)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${filters.page === totalPages - 1
            ? 'bg-primary text-white font-semibold'
            : 'hover:bg-surface-background text-text-muted hover:text-text-main'
            }`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="verification-page space-y-6 text-left">
      {/* Header Section */}
      <div className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-text-main font-extrabold mb-2">Danh sách Mentor đang chờ duyệt</h2>
        <p className="font-body-md text-body-md text-text-muted">Quản lý và xét duyệt các yêu cầu trở thành Mentor trên hệ thống.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-lg">
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-stack-md flex flex-col gap-2 shadow-xs">
          <span className="font-label-md text-label-md text-text-muted uppercase tracking-wider font-bold">Tổng yêu cầu</span>
          <span className="font-headline-lg text-headline-lg text-text-main">{stats.total}</span>
        </div>
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-stack-md flex flex-col gap-2 border-l-4 border-l-status-pending shadow-xs">
          <span className="font-label-md text-label-md text-text-muted uppercase tracking-wider font-bold">Chờ duyệt</span>
          <span className="font-headline-lg text-headline-lg text-text-main">{stats.pending}</span>
        </div>
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-stack-md flex flex-col gap-2 border-l-4 border-l-status-revision shadow-xs">
          <span className="font-label-md text-label-md text-text-muted uppercase tracking-wider font-bold">Cần chỉnh sửa</span>
          <span className="font-headline-lg text-headline-lg text-text-main">{stats.revision}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-stack-md mb-stack-lg flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
          <input
            className="w-full bg-surface-background border border-surface-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-text-main placeholder:text-text-muted"
            placeholder="Tìm kiếm tên, email hoặc ID..."
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <div className="w-px h-8 bg-surface-border hidden lg:block"></div>
        <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto items-center">
          <div className="relative w-full lg:w-48">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-surface-background border border-surface-border rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-text-main appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center] bg-[length:16px] hover:bg-surface-container transition-colors cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING_REVIEW">Chờ duyệt</option>
              <option value="NEEDS_REVISION">Cần chỉnh sửa</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-surface-background border border-surface-border rounded-lg px-3 py-1">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Từ</span>
            <input
              className="bg-transparent border-0 border-transparent p-1 focus:ring-0 font-body-md text-body-md text-text-main w-32 focus:outline-none"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <div className="w-px h-4 bg-surface-border"></div>
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Đến</span>
            <input
              className="bg-transparent border-0 border-transparent p-1 focus:ring-0 font-body-md text-body-md text-text-main w-32 focus:outline-none"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-field font-semibold">
          {error}
        </div>
      )}

      {/* Verification Queue Table */}
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-background border-b border-surface-border font-label-md text-label-md text-text-muted uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Người đăng ký</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Ngày gửi</th>
                <th className="px-6 py-4 font-semibold text-center">Số lần sửa</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-text-muted font-semibold">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted font-semibold">
                    Không tìm thấy yêu cầu phê duyệt nào.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const initial = item.mentorFullName ? item.mentorFullName.charAt(0).toUpperCase() : '?';
                  return (
                    <tr key={item.requestId} className="hover:bg-surface-background/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-soft border border-surface-border flex items-center justify-center font-bold text-primary shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-text-main">{item.mentorFullName}</div>
                            <div className="text-xs text-text-muted">{item.mentorEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-3 text-text-main">
                        {formatDateTime(item.submittedAt)}
                      </td>
                      <td className="px-6 py-3 text-center text-text-main font-semibold">
                        {item.revisionCount}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleRowClick(item.requestId)}
                          className="px-4 py-1.5 bg-surface-container-lowest border border-surface-border text-text-main rounded-lg hover:bg-surface-background font-label-md text-label-md transition-colors cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-surface-background border-t border-surface-border px-6 py-4 flex items-center justify-between">
          <span className="font-body-md text-body-md text-text-muted">
            {totalElements === 0
              ? "Hiển thị 0 kết quả"
              : `Hiển thị ${filters.page * filters.size + 1}-${Math.min((filters.page + 1) * filters.size, totalElements)} trên ${totalElements} kết quả`}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={filters.page === 0}
              onClick={() => handleFilterChange('page', filters.page - 1)}
              className="px-3 py-1.5 border border-surface-border bg-surface-container-lowest text-text-muted rounded-lg hover:bg-surface-background hover:text-text-main transition-colors font-body-md text-body-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px] align-middle mr-1">chevron_left</span>
              Trang trước
            </button>
            <div className="flex items-center gap-1 px-2 font-body-md text-body-md text-text-main">
              {renderPageButtons()}
            </div>
            <button
              disabled={filters.page + 1 >= totalPages}
              onClick={() => handleFilterChange('page', filters.page + 1)}
              className="px-3 py-1.5 border border-surface-border bg-surface-container-lowest text-text-main rounded-lg hover:bg-surface-background transition-colors font-body-md text-body-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              Trang sau
              <span className="material-symbols-outlined text-[18px] align-middle ml-1">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
