// =====================================================================
// src/pages/admin/mentor-verification/[requestId]/page.tsx — Admin Verification Detail
// =====================================================================
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  getVerificationDetail,
  refreshLock as refreshLockApi,
  approveVerification,
  rejectVerification,
  requestRevision,
  type AdminVerificationDetail,
} from '@/lib/api/adminMentorVerificationApi';

export default function AdminMentorVerificationDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNote, setApproveNote] = useState('Hồ sơ đã đạt yêu cầu');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  
  // Custom states for visual perfection
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 countdown for soft lock

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);
      const data = await getVerificationDetail(requestId);
      setDetail(data);
    } catch (err) {
      console.error(err);
      let errMsg = 'Không thể tải chi tiết yêu cầu xét duyệt.';
      if (isAxiosError<{ message?: string; error?: string }>(err)) {
        errMsg = err.response?.data?.message || err.response?.data?.error || errMsg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const handleRefreshLock = useCallback(async () => {
    try {
      await refreshLockApi(requestId);
      setTimeLeft(900); // Reset timer on successful refresh
    } catch (err) {
      console.error('Failed to refresh lock, fetching detail again:', err);
      await fetchDetail();
    }
  }, [requestId, fetchDetail]);

  useEffect(() => {
    if (!requestId) return;
    fetchDetail();
  }, [requestId, fetchDetail]);

  // Lock refreshing in background
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!detail || !(detail.canReview && detail.status === 'PENDING_REVIEW')) {
      return;
    }

    intervalRef.current = setInterval(() => {
      handleRefreshLock();
    }, 3 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [detail, handleRefreshLock]);

  const canAct = !!detail && detail.status === 'PENDING_REVIEW' && detail.canReview;

  // 15-minute countdown clock tick logic (resets or calls refresh on completion)
  useEffect(() => {
    if (!detail || !canAct) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRefreshLock();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [detail, canAct, handleRefreshLock]);

  // Reset lock timer when detail changes
  useEffect(() => {
    setTimeLeft(900);
  }, [detail]);

  // Toast triggers & smooth entry/exit transition
  const triggerToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const dismissTimer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return () => clearTimeout(dismissTimer);
    }
  }, [toastVisible]);

  useEffect(() => {
    if (!toastVisible && toast) {
      const cleanTimer = setTimeout(() => {
        setToast(null);
      }, 300); // Wait for transition duration
      return () => clearTimeout(cleanTimer);
    }
  }, [toastVisible, toast]);

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleApproveClick = () => {
    setApproveNote('Hồ sơ đã đạt yêu cầu');
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!approveNote.trim()) return;
    setShowApproveModal(false);
    setProcessing(true);
    try {
      await approveVerification(requestId, approveNote);
      triggerToast('Đã phê duyệt hồ sơ thành công', 'success');
      await fetchDetail();
    } catch (err) {
      console.error(err);
      let errMsg = 'Phê duyệt yêu cầu thất bại.';
      if (isAxiosError<{ message?: string; error?: string }>(err)) {
        errMsg = err.response?.data?.message || err.response?.data?.error || errMsg;
      }
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    try {
      await rejectVerification(requestId, rejectReason);
      setShowRejectModal(false);
      triggerToast('Đã gửi từ chối hồ sơ thành công đến mentor', 'success');
      await fetchDetail();
    } catch (err) {
      console.error(err);
      let errMsg = 'Từ chối yêu cầu thất bại.';
      if (isAxiosError<{ message?: string; error?: string }>(err)) {
        errMsg = err.response?.data?.message || err.response?.data?.error || errMsg;
      }
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevisionClick = () => {
    setRevisionNote('');
    setShowRevisionModal(true);
  };

  const handleConfirmRevision = async () => {
    if (!revisionNote.trim()) return;
    setProcessing(true);
    try {
      await requestRevision(requestId, revisionNote);
      setShowRevisionModal(false);
      triggerToast('Đã gửi yêu cầu chỉnh sửa thành công', 'warning');
      await fetchDetail();
    } catch (err) {
      console.error(err);
      let errMsg = 'Yêu cầu chỉnh sửa thất bại.';
      if (isAxiosError<{ message?: string; error?: string }>(err)) {
        errMsg = err.response?.data?.message || err.response?.data?.error || errMsg;
      }
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-muted font-semibold">Đang tải chi tiết hồ sơ...</span>
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold">
          {error}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold">
          Không tìm thấy yêu cầu xét duyệt.
        </div>
      </div>
    );
  }

  const initials = detail.mentorFullName
    ? detail.mentorFullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 3)
    : 'M';

  const affiliationProofs = detail.documents?.filter(doc => doc.documentType === 'FPTU_AFFILIATION_PROOF') ?? [];
  const expertiseProofs = detail.documents?.filter(doc => doc.documentType === 'EXPERTISE_PROOF') ?? [];

  const getTimelineEventLabel = (event: NonNullable<AdminVerificationDetail['timeline']>[number]) => {
    if (event.label) return event.label;
    const type = event.eventType || event.event || '';
    switch (type) {
      case 'REQUEST_CREATED':
        return 'Tạo yêu cầu';
      case 'SUBMITTED':
        return 'Nộp hồ sơ';
      case 'UNDER_REVIEW':
        return 'Đang đánh giá';
      case 'APPROVED':
        return 'Phê duyệt';
      case 'REJECTED':
        return 'Từ chối';
      case 'REVISION_REQUESTED':
        return 'Yêu cầu chỉnh sửa';
      case 'RESUBMITTED':
        return 'Nộp lại hồ sơ';
      case 'WITHDRAWN':
        return 'Rút hồ sơ';
      case 'LOCK_ACQUIRED':
        return 'Khóa xét duyệt';
      case 'LOCK_RELEASED':
        return 'Mở khóa';
      default:
        return type || 'Hành động khác';
    }
  };


  return (
    <div className="max-w-[1200px] mx-auto space-y-6 relative text-left">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg p-4 shadow-lg text-white w-96 transition-all duration-300 ease-in-out ${
            toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'
          } ${
            toast.type === 'success' 
              ? 'bg-status-approved' 
              : toast.type === 'warning' 
                ? 'bg-status-revision' 
                : 'bg-status-rejected'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 select-none text-white">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'cancel'}
          </span>
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-sm leading-none mb-1 text-white">
              {toast.type === 'success' ? 'Thành công' : toast.type === 'warning' ? 'Yêu cầu sửa' : 'Từ chối'}
            </div>
            <div className="text-xs text-white/90 leading-tight break-words font-medium">{toast.message}</div>
          </div>
          <button
            onClick={() => setToastVisible(false)}
            className="text-white/80 hover:text-white shrink-0 focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-body-md text-text-muted gap-2">
        <Link to="/admin/mentor-verification" className="hover:text-primary transition-colors">Admin</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link to="/admin/mentor-verification" className="hover:text-primary transition-colors">Verification</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-main font-medium">Detailed Profile</span>
      </nav>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold">
          {error}
        </div>
      )}

      {/* Header & Actions Section */}
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          {(detail.mentorAvatarUrl || detail.mentorProfile?.avatarUrl || detail.studentProfile?.avatarUrl) ? (
            <img 
              src={detail.mentorAvatarUrl || detail.mentorProfile?.avatarUrl || detail.studentProfile?.avatarUrl} 
              alt={detail.mentorFullName} 
              className="w-16 h-16 rounded-full object-cover border border-surface-border shrink-0" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-soft/80 border border-surface-border flex items-center justify-center text-primary font-headline-md font-bold shrink-0 select-none">
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-headline-md text-headline-md text-text-main flex items-center gap-3 flex-wrap">
              {detail.mentorFullName}
              {detail.status === 'PENDING_REVIEW' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-pending/10 text-status-pending font-label-md text-label-md border border-status-pending/20">
                  <span className="w-2 h-2 rounded-full bg-status-pending"></span>
                  CHỜ DUYỆT
                </span>
              )}
              {detail.status === 'NEEDS_REVISION' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-revision/10 text-status-revision font-label-md text-label-md border border-status-revision/20">
                  <span className="w-2 h-2 rounded-full bg-status-revision"></span>
                  CẦN CHỈNH SỬA
                </span>
              )}
              {detail.status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-approved/10 text-status-approved font-label-md text-label-md border border-status-approved/20">
                  <span className="w-2 h-2 rounded-full bg-status-approved"></span>
                  ĐÃ DUYỆT
                </span>
              )}
              {detail.status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-rejected/10 text-status-rejected font-label-md text-label-md border border-status-rejected/20">
                  <span className="w-2 h-2 rounded-full bg-status-rejected"></span>
                  TỪ CHỐI
                </span>
              )}
            </h2>
            <p className="font-body-md text-text-muted mt-1 flex flex-wrap items-center gap-2">
              <span className="material-symbols-outlined text-[16px] align-middle">mail</span>
              {detail.mentorEmail}
              <span className="text-surface-border">|</span>
              <span className="material-symbols-outlined text-[16px] align-middle">schedule</span>
              Nộp: {formatDateTime(detail.submittedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-full lg:w-auto">
          {/* Soft Lock Timer (if active) */}
          {canAct && detail.status === 'PENDING_REVIEW' && (
            <div className="flex items-center gap-2 text-status-revision font-label-md text-label-md bg-status-revision/10 px-3 py-1.5 rounded border border-status-revision/20 select-none">
              <span className="material-symbols-outlined text-[16px] align-middle">lock_clock</span>
              Khóa Đánh Giá: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          )}
          {!detail.canReview && detail.lockedByAdminEmail && (
            <div className="flex items-center gap-2 text-status-rejected font-label-md text-label-md bg-status-rejected/10 px-3 py-1.5 rounded border border-status-rejected/20">
              <span className="material-symbols-outlined text-[16px] align-middle">lock</span>
              Đang đánh giá bởi: {detail.lockedByAdminEmail}
            </div>
          )}

          {canAct && (
            <div className="flex items-center gap-3 flex-wrap mt-1">
              <button
                disabled={processing}
                onClick={handleRequestRevisionClick}
                className="px-4 py-2 rounded-lg font-label-md text-label-md border border-surface-border bg-surface text-text-main hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
              >
                Yêu Cầu Chỉnh Sửa
              </button>
              <button
                disabled={processing}
                onClick={handleRejectClick}
                className="px-4 py-2 rounded-lg font-label-md text-label-md bg-status-rejected text-on-error hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                Từ Chối
              </button>
              <button
                disabled={processing}
                onClick={handleApproveClick}
                className="px-4 py-2 rounded-lg font-label-md text-label-md bg-status-approved text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Phê Duyệt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid (Bento Style) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Identity & Student Info */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Identity Verification Card */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6">
            <h3 className="font-headline-sm text-headline-sm text-text-main border-b border-surface-border pb-3 mb-4 flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-primary align-middle">badge</span>
              Xác Minh Liên Kết FPTU
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">HỌ VÀ TÊN</span>
                <span className="block font-body-md text-text-main font-medium">{detail.mentorFullName}</span>
              </div>
              
              <div className="space-y-3 mt-4 pt-4 border-t border-surface-border">
                <span className="block font-label-md text-text-muted text-xs uppercase">MINH CHỨNG LIÊN KẾT FPTU</span>
                {affiliationProofs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {affiliationProofs.map((doc) => {
                      const isImage = doc.fileUrl && (
                        doc.contentType?.startsWith('image/') ||
                        doc.originalFilename.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
                      );
                      
                      return (
                        <div key={doc.id} className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-surface-container-low border border-surface-border rounded gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                                {isImage ? 'image' : 'description'}
                              </span>
                              <div className="truncate text-left">
                                <span className="font-body-md text-text-main font-semibold block truncate text-sm" title={doc.originalFilename}>
                                  {doc.originalFilename}
                                </span>
                                {doc.sizeBytes !== undefined && (
                                  <span className="text-[11px] text-text-muted block">
                                    {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                )}
                              </div>
                            </div>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-primary text-white rounded font-label-md text-xs hover:opacity-90 whitespace-nowrap"
                              >
                                Xem file
                              </a>
                            )}
                          </div>
                          {isImage && doc.fileUrl && (
                            <div 
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              className="aspect-[3/2] bg-surface-container-low rounded border border-surface-border relative group overflow-hidden cursor-pointer w-full"
                            >
                              <img
                                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                src={doc.fileUrl}
                                alt={doc.originalFilename}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white">zoom_in</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-surface-border rounded text-text-muted font-body-md italic text-sm justify-center">
                    <span className="material-symbols-outlined text-[18px] align-middle">info</span>
                    Chưa cung cấp minh chứng liên kết FPTU.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6">
            <h3 className="font-headline-sm text-headline-sm text-text-main border-b border-surface-border pb-3 mb-4 flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-primary align-middle">local_library</span>
              Hồ Sơ Sinh Viên
            </h3>
            {detail.studentProfile ? (
              <div className="space-y-4">
                <div>
                  <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">TRƯỜNG ĐẠI HỌC</span>
                  <span className="block font-body-md text-text-main font-semibold">
                    {detail.studentProfile.campus?.name || 'FPT University'}
                  </span>
                </div>
                <div>
                  <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">CHUYÊN NGÀNH</span>
                  <span className="block font-body-md text-text-main font-semibold">
                    {detail.studentProfile.specialization?.nameVi || detail.studentProfile.program?.nameVi || 'Chưa cung cấp'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">MÃ SINH VIÊN</span>
                    <span className="block font-body-md text-text-main font-mono text-sm font-semibold">
                      {detail.studentProfile.studentCode || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">NĂM NHẬP HỌC</span>
                    <span className="block font-body-md text-text-main font-semibold">
                      {detail.studentProfile.intakeYear || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-surface-border">
                  <div>
                    <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">HỌC KỲ</span>
                    <span className="block font-body-md text-text-main font-semibold">
                      {detail.studentProfile.semester ? `Học kỳ ${detail.studentProfile.semester}` : 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-label-md text-text-muted mb-1 text-xs uppercase">CỰU SINH VIÊN</span>
                    <span className="block font-body-md text-text-main font-semibold">
                      {detail.studentProfile.alumni ? 'Đúng' : 'Không'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-muted font-medium italic">Không có hồ sơ sinh viên.</p>
            )}
          </div>

          {/* Checklist Card */}
          {detail.checklist && (
            <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6">
              <h3 className="font-headline-sm text-headline-sm text-text-main border-b border-surface-border pb-3 mb-4 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-primary align-middle">fact_check</span>
                Điều kiện xét duyệt
              </h3>
              <div className="space-y-3">
                {([
                  ['academicProfileCompleted', 'Hồ sơ học vấn hoàn thiện'],
                  ['mentorProfileCompleted', 'Hồ sơ mentor hoàn thiện'],
                  ['hasAffiliationProof', 'Có minh chứng liên kết FPTU'],
                  ['hasExpertiseProof', 'Có minh chứng chuyên môn'],
                  ['canSubmit', 'Đủ điều kiện nộp'],
                ] as const).map(([key, label]) => {
                  const passed = detail.checklist![key];
                  return (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-surface-border/50 last:border-0 text-sm">
                      <span className="font-body-md text-text-main font-medium">{label}</span>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        passed ? 'bg-status-approved/10 text-status-approved' : 'bg-status-rejected/10 text-status-rejected'
                      }`}>
                        {passed ? (
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Mentor Profile & Review */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Mentor Profile Details */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6">
            <h3 className="font-headline-sm text-headline-sm text-text-main border-b border-surface-border pb-3 mb-4 flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-primary align-middle">psychology</span>
              Chi Tiết Hồ Sơ Cố Vấn
            </h3>
            <div className="space-y-6">
              <div>
                <span className="block font-label-md text-text-muted mb-2 text-xs uppercase">TIỂU SỬ BẢN THÂN</span>
                <p className="font-body-md text-text-main leading-relaxed bg-surface-container-low p-4 rounded border border-surface-border">
                  {detail.mentorProfile?.expertiseDescription || detail.studentProfile?.bio || 'Chưa cung cấp thông tin tiểu sử.'}
                </p>
              </div>

              <div>
                <span className="block font-label-md text-text-muted mb-2 text-xs uppercase">KINH NGHIỆM &amp; CHUYÊN MÔN THỰC TẾ</span>
                <div className="font-body-md text-text-main space-y-1.5 text-sm bg-surface-container-low p-4 rounded border border-surface-border leading-relaxed">
                  <div className="font-bold text-text-main mb-1 text-[15px]">
                    {detail.mentorProfile?.headline || 'Chưa cung cấp tiêu đề.'}
                  </div>
                  {detail.mentorProfile?.supportingSubjects && (
                    <div>
                      <span className="text-text-muted font-semibold">Môn học hỗ trợ:</span> {detail.mentorProfile.supportingSubjects}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2.5 pt-2 border-t border-surface-border/50 text-xs text-text-muted">
                    {detail.mentorProfile?.teachingMode && (
                      <span>Hình thức dạy: <strong className="text-text-main font-semibold">{detail.mentorProfile.teachingMode}</strong></span>
                    )}
                    {detail.mentorProfile?.sessionDuration && (
                      <span>Thời lượng slot: <strong className="text-text-main font-semibold">{detail.mentorProfile.sessionDuration} phút</strong></span>
                    )}
                    {detail.mentorProfile?.phoneNumber && (
                      <span>Số điện thoại: <strong className="text-text-main font-semibold">{detail.mentorProfile.phoneNumber}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="block font-label-md text-text-muted mb-2 text-xs uppercase">KỸ NĂNG (TAGS)</span>
                <div className="flex flex-wrap gap-2">
                  {detail.mentorProfile?.helpTopics && detail.mentorProfile.helpTopics.length > 0 ? (
                    detail.mentorProfile.helpTopics.map((topic) => (
                      <span key={topic.id} className="px-3 py-1 rounded bg-secondary-container/20 text-on-secondary-container font-body-md text-sm border border-secondary-container/30">
                        {topic.nameVi}
                      </span>
                    ))
                  ) : (
                    <span className="text-text-muted italic text-sm">Chưa cung cấp kỹ năng.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block font-label-md text-text-muted mb-2 text-xs uppercase">CHỨNG CHỈ &amp; THÀNH TÍCH</span>
                {expertiseProofs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expertiseProofs.map((doc) => {
                      const isImage = doc.fileUrl && (
                        doc.contentType?.startsWith('image/') ||
                        doc.originalFilename.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
                      );

                      return (
                        <div key={doc.id} className="space-y-2 border border-surface-border rounded-lg p-3 bg-surface-container-low">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                                {isImage ? 'image' : 'description'}
                              </span>
                              <div className="truncate text-left">
                                <span className="font-body-md text-text-main font-semibold block truncate text-sm" title={doc.originalFilename}>
                                  {doc.originalFilename}
                                </span>
                                {doc.sizeBytes !== undefined && (
                                  <span className="text-[11px] text-text-muted block">
                                    {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                )}
                              </div>
                            </div>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-primary text-white rounded font-label-md text-xs hover:opacity-90 whitespace-nowrap"
                              >
                                Xem file
                              </a>
                            )}
                          </div>
                          {isImage && doc.fileUrl && (
                            <div 
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              className="aspect-[3/2] bg-surface-container-low rounded border border-surface-border relative group overflow-hidden cursor-pointer w-full"
                            >
                              <img
                                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                src={doc.fileUrl}
                                alt={doc.originalFilename}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white">zoom_in</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-surface-border rounded text-text-muted font-body-md italic text-sm justify-center">
                    <span className="material-symbols-outlined text-[18px] align-middle">info</span>
                    Chưa cung cấp thông tin chứng chỉ.
                  </div>
                )}
              </div>

              {/* External Links */}
              {(detail.mentorProfile?.linkedinUrl || detail.mentorProfile?.githubUrl || detail.mentorProfile?.portfolioUrl) && (
                <div className="pt-2 border-t border-surface-border/50">
                  <span className="block font-label-md text-text-muted mb-2 text-xs uppercase">Liên kết bên ngoài</span>
                  <div className="flex flex-wrap gap-4">
                    {detail.mentorProfile.linkedinUrl && (
                      <a href={detail.mentorProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-semibold text-sm">
                        <span className="material-symbols-outlined text-[16px] align-middle">link</span> LinkedIn
                      </a>
                    )}
                    {detail.mentorProfile.githubUrl && (
                      <a href={detail.mentorProfile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-semibold text-sm">
                        <span className="material-symbols-outlined text-[16px] align-middle">link</span> GitHub
                      </a>
                    )}
                    {detail.mentorProfile.portfolioUrl && (
                      <a href={detail.mentorProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-semibold text-sm">
                        <span className="material-symbols-outlined text-[16px] align-middle">link</span> Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review History Table */}
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-surface-border bg-surface-background">
              <h3 className="font-headline-sm text-headline-sm text-text-main flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-text-muted align-middle">history</span>
                Lịch Sử Xét Duyệt
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-md text-sm border-collapse">
                <thead className="bg-surface-background border-b border-surface-border text-text-muted font-label-md uppercase">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold text-xs">Thời Gian</th>
                    <th className="px-4 py-3.5 font-semibold text-xs">Hành Động</th>
                    <th className="px-4 py-3.5 font-semibold text-xs">Người Xử Lý</th>
                    <th className="px-4 py-3.5 font-semibold text-xs w-1/2">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-body-md text-sm text-text-main">
                  {detail.timeline && detail.timeline.length > 0 ? (
                    detail.timeline.map((event, index) => {
                      const eventTypeStr = event.eventType || event.event || '';
                      let badgeClass = 'bg-surface-container text-text-main border border-surface-border';
                      if (eventTypeStr.includes('REJECT') || eventTypeStr.includes('TU_CHOI')) {
                        badgeClass = 'bg-status-rejected/10 text-status-rejected border border-status-rejected/20';
                      } else if (eventTypeStr.includes('APPROVE') || eventTypeStr.includes('PHE_DUYET')) {
                        badgeClass = 'bg-status-approved/10 text-status-approved border border-status-approved/20';
                      } else if (eventTypeStr.includes('REVISION') || eventTypeStr.includes('CHINH_SUA')) {
                        badgeClass = 'bg-status-revision/10 text-status-revision border border-status-revision/20';
                      } else if (eventTypeStr.includes('SUBMIT') || eventTypeStr.includes('CREATE') || eventTypeStr.includes('NOUP')) {
                        badgeClass = 'bg-primary-soft/30 text-primary border border-primary/20';
                      }

                      const labelText = getTimelineEventLabel(event);
                      const actorName = event.actorFullName || event.by || (event.actorEmail ? event.actorEmail.split('@')[0] : 'Hệ thống');
                      const eventTime = event.createdAt || event.at || null;

                      return (
                        <tr key={index} className="hover:bg-surface-background/50 transition-colors">
                          <td className="px-4 py-3 text-text-muted whitespace-nowrap">{formatDateTime(eventTime)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>
                              {labelText}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{actorName}</td>
                          <td className="px-4 py-3 text-text-muted whitespace-pre-wrap max-w-xs break-words font-medium">
                            {event.note ? event.note : <span className="italic text-text-muted/60 font-normal">-</span>}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-text-muted italic font-medium">
                        Chưa có lịch sử xét duyệt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>

      </div>
      <div className="h-8"></div>

      {/* Custom Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div 
            className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">
                Xác nhận phê duyệt hồ sơ
              </h3>
              <button 
                onClick={() => setShowApproveModal(false)}
                className="text-text-muted hover:text-text-main transition-colors focus:outline-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-left space-y-4">
              <p className="font-body-md text-text-muted leading-relaxed text-sm">
                Bạn có chắc chắn muốn phê duyệt hồ sơ của <strong className="text-text-main font-semibold">{detail.mentorFullName}</strong> trở thành Mentor?
              </p>
              
              <div>
                <label htmlFor="approve-note" className="block font-label-md text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">
                  Ghi chú phê duyệt <span className="text-status-rejected font-bold">*</span>
                </label>
                <textarea
                  id="approve-note"
                  rows={3}
                  className="w-full bg-white border border-surface-border rounded-lg p-3 text-text-main font-body-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Nhập ghi chú phê duyệt tại đây..."
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-container-low border-t border-surface-border">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-surface-border rounded-lg bg-surface text-text-main hover:bg-surface-container transition-colors font-label-md text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={processing || !approveNote.trim()}
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm font-label-md text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div 
            className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">
                Xác nhận từ chối hồ sơ
              </h3>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="text-text-muted hover:text-text-main transition-colors focus:outline-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-left space-y-4">
              <p className="font-body-md text-text-muted leading-relaxed text-sm">
                Bạn có chắc chắn muốn từ chối hồ sơ của <strong className="text-text-main font-semibold">{detail.mentorFullName}</strong>? Vui lòng cung cấp lý do cụ thể để người dùng có thể cải thiện.
              </p>
              
              <div>
                <label htmlFor="reject-reason" className="block font-label-md text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">
                  LÝ DO TỪ CHỐI <span className="text-status-rejected font-bold">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  rows={4}
                  className="w-full bg-white border border-surface-border rounded-lg p-3 text-text-main font-body-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-status-rejected focus:border-transparent resize-none"
                  placeholder="Nhập lý do từ chối tại đây..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-container-low border-t border-surface-border">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-surface-border rounded-lg bg-surface text-text-main hover:bg-surface-container transition-colors font-label-md text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={processing || !rejectReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-status-rejected text-on-error rounded-lg hover:opacity-90 transition-opacity shadow-sm font-label-md text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Đang từ chối...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Revision Confirmation Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div 
            className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">
                Yêu cầu chỉnh sửa hồ sơ
              </h3>
              <button 
                onClick={() => setShowRevisionModal(false)}
                className="text-text-muted hover:text-text-main transition-colors focus:outline-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-left space-y-4">
              <p className="font-body-md text-text-muted leading-relaxed text-sm">
                Vui lòng mô tả chi tiết những nội dung Mentor cần cập nhật hoặc bổ sung để hoàn thiện hồ sơ.
              </p>
              
              <div>
                <label htmlFor="revision-note" className="block font-label-md text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">
                  NỘI DUNG CẦN BỔ SUNG <span className="text-status-rejected font-bold">*</span>
                </label>
                <textarea
                  id="revision-note"
                  rows={4}
                  className="w-full bg-white border border-surface-border rounded-lg p-3 text-text-main font-body-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Nhập nội dung yêu cầu chỉnh sửa tại đây..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-container-low border-t border-surface-border">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 border border-surface-border rounded-lg bg-surface text-text-main hover:bg-surface-container transition-colors font-label-md text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={processing || !revisionNote.trim()}
                onClick={handleConfirmRevision}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm font-label-md text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
