// =====================================================================
// src/app/admin/mentor-verification/[requestId]/page.tsx — Admin Verification Detail
// =====================================================================
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getVerificationDetail,
  refreshLock as refreshLockApi,
  approveVerification,
  rejectVerification,
  requestRevision,
  type AdminVerificationDetail,
} from '../../../../lib/api/adminMentorVerificationApi';

export default function AdminMentorVerificationDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId as string;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);
      const data = await getVerificationDetail(requestId);
      setDetail(data);
    } catch (err) {
      setError('Failed to load verification detail.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const refreshLock = useCallback(async () => {
    try {
      await refreshLockApi(requestId);
    } catch (err) {
      console.error('Failed to refresh lock, fetching detail again:', err);
      await fetchDetail();
    }
  }, [requestId, fetchDetail]);

  useEffect(() => {
    if (!requestId) return;
    fetchDetail();
  }, [requestId, fetchDetail]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!detail || !(detail.canReview && detail.status === 'PENDING_REVIEW')) {
      return;
    }

    intervalRef.current = setInterval(() => {
      refreshLock();
    }, 3 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [detail, refreshLock]);

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString();
  };

  const canAct = !!detail && detail.status === 'PENDING_REVIEW' && detail.canReview;

  const handleApprove = async () => {
    if (!requestId) return;
    setProcessing(true);
    try {
      await approveVerification(requestId, note || undefined);
      await fetchDetail();
      setNote('');
    } catch (err) {
      console.error(err);
      setError('Failed to approve request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!requestId || !note.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setProcessing(true);
    try {
      await rejectVerification(requestId, note);
      await fetchDetail();
      setNote('');
    } catch (err) {
      console.error(err);
      setError('Failed to reject request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!requestId || !note.trim()) {
      setError('Vui lòng nhập nội dung cần chỉnh sửa.');
      return;
    }
    setProcessing(true);
    try {
      await requestRevision(requestId, note);
      await fetchDetail();
      setNote('');
    } catch (err) {
      console.error(err);
      setError('Failed to request revision.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-brand-text-muted font-semibold">Loading...</div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-field font-semibold">
          {error}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-field font-semibold">
          Verification request not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/mentor-verification')}
        className="text-meta font-bold text-brand-text-muted hover:text-brand-text"
      >
        ← Back to queue
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight">
          {detail.mentorFullName}
        </h1>
        <p className="text-brand-text-muted text-body font-medium mt-1">
          {detail.mentorEmail}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="inline-block text-meta font-bold py-0.5 px-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            {detail.status}
          </span>
          <span className="text-meta text-brand-text-muted font-semibold">
            Revision Count: {detail.revisionCount}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-field font-semibold">
          {error}
        </div>
      )}

      {/* Lock Banners */}
      {canAct && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-field font-semibold">
          You are currently processing this request.
        </div>
      )}
      {!detail.canReview && detail.lockedByAdminEmail && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-field font-semibold">
          This request is being processed by another admin: {detail.lockedByAdminEmail}
        </div>
      )}

      {/* Student Profile */}
      <div className="meetmind-card rounded-card shadow-sm">
        <h2 className="text-xl font-bold text-brand-text font-serif mb-4">
          Student Profile
        </h2>
        {detail.studentProfile ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-body">
            <div>
              <span className="text-brand-text-muted font-bold">Student Code:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.studentCode}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Display Name:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.displayName}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Campus ID:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.campusId}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Program ID:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.programId}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Specialization ID:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.specializationId}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Semester:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.semester}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Intake Year:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.intakeYear}
              </span>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Is Alumni:</span>
              <span className="ml-2 text-brand-text font-semibold">
                {detail.studentProfile.isAlumni ? 'Yes' : 'No'}
              </span>
            </div>
            {detail.studentProfile.graduationYear !== null && detail.studentProfile.graduationYear !== undefined && (
              <div>
                <span className="text-brand-text-muted font-bold">Graduation Year:</span>
                <span className="ml-2 text-brand-text font-semibold">
                  {detail.studentProfile.graduationYear}
                </span>
              </div>
            )}
            {detail.studentProfile.bio && (
              <div className="col-span-2">
                <span className="text-brand-text-muted font-bold">Bio:</span>
                <p className="text-body text-brand-text">{detail.studentProfile.bio}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-brand-text-muted font-semibold">No student profile available.</p>
        )}
      </div>

      {/* Mentor Profile */}
      <div className="meetmind-card rounded-card shadow-sm">
        <h2 className="text-xl font-bold text-brand-text font-serif mb-4">
          Mentor Profile
        </h2>
        {detail.mentorProfile ? (
          <div className="space-y-4 text-body">
            <div>
              <span className="text-brand-text-muted font-bold">Headline:</span>
              <p className="mt-1 text-brand-text font-semibold">{detail.mentorProfile.headline}</p>
            </div>
            {detail.mentorProfile.currentPosition && (
              <div>
                <span className="text-brand-text-muted font-bold">Current Position:</span>
                <span className="ml-2 text-brand-text font-semibold">{detail.mentorProfile.currentPosition}</span>
              </div>
            )}
            {detail.mentorProfile.currentCompany && (
              <div>
                <span className="text-brand-text-muted font-bold">Current Company:</span>
                <span className="ml-2 text-brand-text font-semibold">{detail.mentorProfile.currentCompany}</span>
              </div>
            )}
            {detail.mentorProfile.industry && (
              <div>
                <span className="text-brand-text-muted font-bold">Industry:</span>
                <span className="ml-2 text-brand-text font-semibold">{detail.mentorProfile.industry}</span>
              </div>
            )}
            {detail.mentorProfile.yearsOfExperience !== undefined && (
              <div>
                <span className="text-brand-text-muted font-bold">Years of Experience:</span>
                <span className="ml-2 text-brand-text font-semibold">{detail.mentorProfile.yearsOfExperience}</span>
              </div>
            )}
            {detail.mentorProfile.teachingMode && (
              <div>
                <span className="text-brand-text-muted font-bold">Teaching Mode:</span>
                <span className="ml-2 text-brand-text font-semibold">{detail.mentorProfile.teachingMode}</span>
              </div>
            )}
            {detail.mentorProfile.expertiseSummary && (
              <div>
                <span className="text-brand-text-muted font-bold">Expertise Summary:</span>
                <p className="mt-1 text-brand-text">{detail.mentorProfile.expertiseSummary}</p>
              </div>
            )}
            {detail.mentorProfile.bio && (
              <div>
                <span className="text-brand-text-muted font-bold">Bio:</span>
                <p className="mt-1 text-brand-text">{detail.mentorProfile.bio}</p>
              </div>
            )}
            <div>
              <span className="text-brand-text-muted font-bold">Expertise Tags:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {detail.mentorProfile.expertiseTagIds.map((tag) => (
                  <span key={tag} className="bg-brand-bg border border-brand-border px-2 py-1 rounded-lg text-meta font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-brand-text-muted font-bold">Help Topics:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {detail.mentorProfile.helpTopicIds.map((topic) => (
                  <span key={topic} className="bg-brand-bg border border-brand-border px-2 py-1 rounded-lg text-meta font-bold">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              {detail.mentorProfile.linkedinUrl && (
                <a href={detail.mentorProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold hover:underline">
                  LinkedIn
                </a>
              )}
              {detail.mentorProfile.githubUrl && (
                <a href={detail.mentorProfile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold hover:underline">
                  GitHub
                </a>
              )}
              {detail.mentorProfile.portfolioUrl && (
                <a href={detail.mentorProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-brand-text-muted font-semibold">No mentor profile available.</p>
        )}
      </div>

      {/* Documents */}
      <div className="meetmind-card rounded-card shadow-sm">
        <h2 className="text-xl font-bold text-brand-text font-serif mb-4">
          Documents
        </h2>
        {detail.documents && detail.documents.length > 0 ? (
          <div className="space-y-3">
            {detail.documents.map((doc) => (
              <div key={doc.documentId} className="flex items-center justify-between bg-brand-bg border border-brand-border rounded-card p-3">
                <div>
                  <span className="text-brand-text font-bold">{doc.fileName}</span>
                  <span className="ml-2 text-meta text-brand-text-muted font-semibold">({doc.documentType})</span>
                  {doc.sizeKb && (
                    <span className="ml-2 text-meta text-brand-text-muted font-semibold">• {(doc.sizeKb / 1024).toFixed(2)} MB</span>
                  )}
                </div>
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-brand-blue text-white text-meta font-bold rounded-field hover:bg-brand-blue-hover"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-muted font-semibold">No documents available.</p>
        )}
      </div>

      {/* Timeline */}
      <div className="meetmind-card rounded-card shadow-sm">
        <h2 className="text-xl font-bold text-brand-text font-serif mb-4">
          Timeline
        </h2>
        {detail.timeline && detail.timeline.length > 0 ? (
          <div className="space-y-4">
            {detail.timeline.map((event, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-brand-terracotta shrink-0" />
                <div>
                  <p className="text-brand-text font-bold">{event.label || event.event}</p>
                  <p className="text-meta text-brand-text-muted font-semibold">
                    {formatDateTime(event.at)}
                    {event.by && ` • by ${event.by}`}
                  </p>
                  {event.note && <p className="mt-1 text-brand-text">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-muted font-semibold">No timeline events.</p>
        )}
      </div>

      {/* Checklist */}
      <div className="meetmind-card rounded-card shadow-sm">
        <h2 className="text-xl font-bold text-brand-text font-serif mb-4">
          Checklist
        </h2>
        {detail.checklist && detail.checklist.length > 0 ? (
          <div className="space-y-3">
            {detail.checklist.map((item) => (
              <div key={item.checkId} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.passed ? 'Y' : 'N'}
                </span>
                <div>
                  <p className="text-brand-text font-bold">{item.label}</p>
                  {item.evidence && <p className="text-meta text-brand-text-muted font-semibold mt-0.5">{item.evidence}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-muted font-semibold">No checklist items.</p>
        )}
      </div>

      {/* Action Buttons */}
      {canAct && (
        <div className="meetmind-card rounded-card shadow-sm space-y-3">
          <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">
            Ghi chú (bắt buộc khi từ chối / yêu cầu chỉnh sửa)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú/lý do..."
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none font-medium"
          />
          <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
            <button
              disabled={processing}
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-field hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={processing}
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-field hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              disabled={processing}
              onClick={handleRequestRevision}
              className="px-4 py-2 bg-brand-terracotta text-white font-bold rounded-field hover:bg-brand-terracotta-hover disabled:opacity-50"
            >
              Request Revision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
