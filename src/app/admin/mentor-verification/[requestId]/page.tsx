// =====================================================================
// src/app/admin/mentor-verification/[requestId]/page.tsx — Admin Verification Detail
// =====================================================================
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getVerificationDetail, refreshLock, approveVerification, rejectVerification, requestRevision } from "@/lib/api/adminMentorVerificationApi";

interface AdminMentorProfile {
  headline: string;
  currentPosition?: string;
  currentCompany?: string;
  avatarUrl?: string;
  bio?: string;
  isAvailable: boolean;
  expertiseTagIds: string[];
  helpTopicIds: string[];
  yearsOfExperience: number;
  industry?: string;
  expertiseSummary?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  teachingMode?: string;
}

interface AdminStudentProfile {
  studentCode: string;
  displayName: string;
  avatarUrl?: string;
  campusId: string;
  programId: string;
  specializationId: string;
  semester: number;
  intakeYear: number;
  isAlumni: boolean;
  graduationYear?: number | null;
  bio?: string;
}

interface AdminDocument {
  documentId: string;
  documentType: string;
  isPrimary: boolean;
  fileName: string;
  mime?: string;
  sizeKb?: number;
  uploadedAt?: string;
  fileUrl?: string;
}

interface AdminTimelineEvent {
  event: string;
  label?: string;
  at: string;
  by?: string;
  note?: string;
}

interface AdminChecklistItem {
  checkId: string;
  label: string;
  passed: boolean;
  evidence?: string;
}

interface AdminVerificationDetail {
  requestId: string;
  status: string;
  mentorFullName: string;
  mentorEmail: string;
  revisionCount: number;
  submittedAt: string | null;
  updatedAt: string | null;
  submitNote: string | null;
  reviewNote: string | null;
  canReview: boolean;
  lockedByAdminEmail: string | null;
  documents: AdminDocument[];
  checklist: AdminChecklistItem[];
  timeline: AdminTimelineEvent[];
  studentProfile: AdminStudentProfile | null;
  mentorProfile: AdminMentorProfile | null;
}

export default function AdminMentorVerificationDetailPage() {
  const params = useParams();
  const requestId = params.requestId as string;
  const navigate = useRouter();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = async () => {
    try {
      setError(null);
      const data = await getVerificationDetail(requestId);
      setDetail(data);
      setProcessing(data.status === "PENDING_REVIEW" && data.canReview);
    } catch (err) {
      setError("Failed to load verification detail.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLock = async () => {
    try {
      setRefreshing(true);
      await refreshLock(requestId);
    } catch (err) {
      console.error("Failed to refresh lock, fetching detail again:", err);
      await fetchDetail();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!requestId) return;

    fetchDetail();

    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        if (detail && detail.canReview && detail.status === "PENDING_REVIEW") {
          refreshLock();
        }
      }, 3 * 60 * 1000);
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [requestId]);

  useEffect(() => {
    if (!detail) return;

    if (!(detail.canReview && detail.status === "PENDING_REVIEW")) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      refreshLock();
    }, 3 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [detail]);

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString();
  };

  const canAct = detail && detail.status === "PENDING_REVIEW" && detail.canReview;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-brand-text-muted font-semibold">Loading...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-field font-semibold">
          {error || "Verification request not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Lock Banners */}
      {processing && (
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
                {detail.studentProfile.isAlumni ? "Yes" : "No"}
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
        </div>
        {detail.checklist && detail.checklist.length > 0 ? (
          <div className="space-y-3">
            {detail.checklist.map((item) => (
              <div key={item.checkId} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${item.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {item.passed ? "Y" : "N"}
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
        <div className="flex items-center gap-3 pt-4 border-t border-brand-border">
          <button
            onClick={() => approveVerification(requestId)}
            className="px-4 py-2 bg-green-600 text-white font-bold rounded-field hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => rejectVerification(requestId, note)}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-field hover:bg-red-700"
          >
            Reject
          </button>
          <button
            onClick={() => requestRevision(requestId, note)}
            className="px-4 py-2 bg-brand-terracotta text-white font-bold rounded-field hover:bg-brand-terracotta-hover"
          >
            Request Revision
          </button>
        </div>
      )}
    </div>
  );
}
