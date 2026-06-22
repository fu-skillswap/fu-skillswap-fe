// =====================================================================
// src/lib/api/adminMentorVerificationApi.ts — Admin Mentor Verification (4.7)
// =====================================================================
import { apiClient } from '@/api/client';
import type { Paged } from '@/api/types';
import type { AxiosRequestConfig } from 'axios';

async function authFetchWithRefresh<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  // BE bọc mọi response trong ApiResponse { data: ... }. Phải unwrap `.data.data`,
  // nếu không `result.content`/`result.status`... = undefined (trang admin bị trống).
  const response = await apiClient.request<{ data: T }>({
    url,
    method,
    data: body,
    ...config,
  });
  return response.data.data;
}

export type AdminVerificationQueueItem = {
  requestId: string;
  mentorUserId: string;
  mentorEmail: string;
  mentorFullName: string;
  mentorAvatarUrl: string | null;
  status: string;
  revisionCount: number;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VerificationLockStatus = {
  requestId: string;
  canReview: boolean;
  lockedByAdminEmail: string | null;
};

export type AdminVerificationDetail = {
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
  // Khớp MentorVerificationDocumentResponse của BE mới.
  documents: Array<{
    id: string;
    documentType: string;
    status?: string;
    originalFilename: string;
    contentType?: string;
    sizeBytes?: number;
    uploadedAt?: string;
    fileUrl?: string;
    isActive?: boolean;
  }>;
  checklist: {
    academicProfileCompleted: boolean;
    mentorProfileCompleted: boolean;
    hasAffiliationProof: boolean;
    hasExpertiseProof: boolean;
    canSubmit: boolean;
  } | null;
  timeline: Array<{
    event: string;
    label?: string;
    at: string;
    by?: string;
    note?: string;
  }>;
  // Khớp StudentProfileResponse: campus/program/specialization là object lồng.
  studentProfile: {
    studentCode: string;
    displayName: string;
    avatarUrl?: string;
    campus?: { id: string; name: string };
    program?: { id: string; nameVi: string };
    specialization?: { id: string; nameVi: string };
    semester: number;
    intakeYear: number;
    alumni?: boolean;
    graduationYear?: number | null;
    bio?: string;
  } | null;
  // Khớp MentorProfileResponse: helpTopics là mảng tag.
  mentorProfile: {
    headline?: string;
    expertiseDescription?: string;
    supportingSubjects?: string;
    isAvailable?: boolean;
    helpTopics?: Array<{ id: string; nameVi: string }>;
    teachingMode?: string;
    sessionDuration?: number;
    phoneNumber?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  } | null;
};

export async function getVerificationQueue(params: {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
}): Promise<Paged<AdminVerificationQueueItem>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.direction) query.set('direction', params.direction);
  const queryString = query.toString();
  const url = `/api/admin/mentor-verification/requests${queryString ? `?${queryString}` : ''}`;
  return authFetchWithRefresh<Paged<AdminVerificationQueueItem>>(url, 'GET');
}

export async function getVerificationDetail(requestId: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'GET');
}

export async function getLockStatus(requestId: string): Promise<VerificationLockStatus> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/lock`;
  return authFetchWithRefresh<VerificationLockStatus>(url, 'GET');
}

export async function refreshLock(requestId: string): Promise<VerificationLockStatus> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/lock/refresh`;
  return authFetchWithRefresh<VerificationLockStatus>(url, 'POST');
}

export async function requestRevision(requestId: string, note: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/request-revision`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'POST', { note });
}

export async function approveVerification(requestId: string, note?: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/approve`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'POST', { note });
}

export async function rejectVerification(requestId: string, note: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/reject`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'POST', { note });
}
