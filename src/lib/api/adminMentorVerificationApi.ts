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
  const response = await apiClient.request<T>({
    url,
    method,
    data: body,
    ...config,
  });
  return response.data;
}

export type AdminVerificationQueueItem = {
  requestId: string;
  mentorFullName: string;
  mentorEmail: string;
  status: string;
  revisionCount: number;
  submittedAt: string | null;
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
  documents: Array<{
    documentId: string;
    documentType: string;
    isPrimary: boolean;
    fileName: string;
    mime?: string;
    sizeKb?: number;
    uploadedAt?: string;
    fileUrl?: string;
  }>;
  checklist: Array<{
    checkId: string;
    label: string;
    passed: boolean;
    evidence?: string;
  }>;
  timeline: Array<{
    event: string;
    label?: string;
    at: string;
    by?: string;
    note?: string;
  }>;
  studentProfile: {
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
  } | null;
  mentorProfile: {
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
