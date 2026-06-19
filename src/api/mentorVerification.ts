import { authFetchWithRefresh } from '../lib/apiFetch';
import type {
  ApiResponse,
  MentorVerificationRequestResponse,
  MentorVerificationDocument,
  TimelineEvent,
  VerificationDocumentType,
  VerificationRequest,
} from './types';

type RequestLike = MentorVerificationRequestResponse | VerificationRequest;

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | { data?: T; message?: string } | T | null;
  if (!response.ok) {
    const message =
      (json as ApiResponse<T> | null)?.message ??
      (json as { message?: string } | null)?.message ??
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

async function parseFlexible<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | { data?: T; message?: string }
    | { documents?: unknown[]; timeline?: unknown[]; checklist?: unknown; allowedActions?: unknown }
    | T
    | null;

  if (!response.ok) {
    const message =
      (json as ApiResponse<T> | null)?.message ??
      (json as { message?: string } | null)?.message ??
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

export const mentorVerificationApi = {
  createOrGetRequest: async () => {
    const response = await authFetchWithRefresh('/api/me/mentor-verification/request', {
      method: 'POST',
    });
    return parseResponse<RequestLike>(response);
  },

  getCurrent: async () => {
    const response = await authFetchWithRefresh('/api/me/mentor-verification', {
      method: 'GET',
    });
    return parseResponse<RequestLike>(response);
  },

  getTimeline: async () => {
    const response = await authFetchWithRefresh('/api/me/mentor-verification/timeline', {
      method: 'GET',
    });
    return parseResponse<TimelineEvent[]>(response);
  },

  uploadDocument: async (params: { documentType: VerificationDocumentType; file: File }) => {
    const formData = new FormData();
    formData.append('documentType', params.documentType);
    formData.append('file', params.file);
    const response = await authFetchWithRefresh('/api/me/mentor-verification/documents', {
      method: 'POST',
      body: formData,
    });
    return parseFlexible<MentorVerificationRequestResponse | MentorVerificationDocument>(response);
  },

  deleteDocument: async (documentId: string) => {
    const response = await authFetchWithRefresh(`/api/me/mentor-verification/documents/${documentId}`, {
      method: 'DELETE',
    });
    return parseFlexible<MentorVerificationRequestResponse | void>(response);
  },

  submit: async (payload: { submitNote?: string; termsAccepted: boolean }) => {
    const response = await authFetchWithRefresh('/api/me/mentor-verification/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return parseResponse<MentorVerificationRequestResponse>(response);
  },

  withdraw: async () => {
    const response = await authFetchWithRefresh('/api/me/mentor-verification/withdraw', {
      method: 'POST',
    });
    return parseResponse<MentorVerificationRequestResponse>(response);
  },
};
