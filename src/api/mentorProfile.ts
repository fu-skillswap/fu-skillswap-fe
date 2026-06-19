import { authFetchWithRefresh } from '../lib/apiFetch';
import type { ApiResponse, MentorProfileResponse, MentorProfileUpdatePayload } from './types';

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | { data?: T; message?: string } | null;
  if (!response.ok) {
    const message =
      (json as ApiResponse<T> | null)?.message ??
      (json as { message?: string } | null)?.message ??
      `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status?: number; data?: unknown };
    error.status = response.status;
    error.data = (json as ApiResponse<T> | null)?.data;
    throw error;
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export const mentorProfileApi = {
  get: async () => {
    const response = await authFetchWithRefresh('/api/me/mentor-profile', { method: 'GET' });
    return parseResponse<MentorProfileResponse>(response);
  },

  update: async (payload: MentorProfileUpdatePayload) => {
    const response = await authFetchWithRefresh('/api/me/mentor-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return parseResponse<MentorProfileResponse>(response);
  },
};
