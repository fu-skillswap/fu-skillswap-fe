import { authFetchWithRefresh } from '../lib/apiFetch';
import type {
  AdminMentorVerificationQueueItemResponse,
  AdminMentorVerificationQueueParams,
  AdminMentorVerificationRequestResponse,
  ApiResponse,
  Paged,
} from './types';

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok) {
    const message = json?.message ?? `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status?: number; code?: string; data?: unknown };
    error.status = response.status;
    error.code = json?.code;
    error.data = json?.data;
    throw error;
  }
  return (json?.data ?? null) as T;
}

async function parseQueueResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | { data?: T } | T | null;
  if (!response.ok) {
    const message =
      (json as ApiResponse<T> | null)?.message ??
      `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status?: number; code?: string; data?: unknown };
    error.status = response.status;
    error.code = (json as ApiResponse<T> | null)?.code;
    error.data = (json as ApiResponse<T> | null)?.data;
    throw error;
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

function buildQuery(params?: AdminMentorVerificationQueueParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const adminMentorVerificationApi = {
  getVerificationQueue: async (params?: AdminMentorVerificationQueueParams) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests${buildQuery(params)}`, {
      method: 'GET',
    });
    return parseQueueResponse<Paged<AdminMentorVerificationQueueItemResponse> | AdminMentorVerificationQueueItemResponse[]>(response);
  },

  getVerificationDetail: async (requestId: string) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests/${requestId}`, {
      method: 'GET',
    });
    return parseResponse<AdminMentorVerificationRequestResponse>(response);
  },

  getLockStatus: async (requestId: string) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests/${requestId}/lock`, {
      method: 'GET',
    });
    return parseResponse<{ locked: boolean; lockedByAdminEmail: string | null; lockedAt: string | null; lockExpiresAt: string | null }>(response);
  },

  refreshLock: async (requestId: string) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests/${requestId}/lock/refresh`, {
      method: 'POST',
    });
    return parseResponse<{ locked: boolean; lockedByAdminEmail: string | null; lockedAt: string | null; lockExpiresAt: string | null }>(response);
  },

  approveVerification: async (requestId: string, note?: string) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note ? { note } : {}),
    });
    return parseResponse<AdminMentorVerificationRequestResponse>(response);
  },

  rejectVerification: async (requestId: string, note: string) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note }),
    });
    return parseResponse<AdminMentorVerificationRequestResponse>(response);
  },

  requestRevision: async (requestId: string, note: string) => {
    const response = await authFetchWithRefresh(`/api/admin/mentor-verification/requests/${requestId}/revision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note }),
    });
    return parseResponse<AdminMentorVerificationRequestResponse>(response);
  },
};
