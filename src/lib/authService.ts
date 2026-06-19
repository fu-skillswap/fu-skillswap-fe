import { apiFetch, authFetchWithRefresh } from './apiFetch';
import { tokenStore } from './tokenStore';

export interface AuthTokensResponse {
  accessToken: string;
}

export interface MeResponse {
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  status: string;
  roles: string[];
  profileCompleted: boolean;
  hasStudentProfile: boolean;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? 'Request failed');
  }
  return response.json() as Promise<T>;
}

export async function loginWithGoogle(idToken: string): Promise<AuthTokensResponse> {
  const response = await apiFetch('/api/auth/google', {
    method: 'POST',
    auth: false,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const data = await parseJsonResponse<{ data?: AuthTokensResponse; accessToken?: string }>(response);
  const accessToken = data.data?.accessToken ?? data.accessToken;

  if (!accessToken) {
    throw new Error('Missing accessToken in login response');
  }

  tokenStore.setAccessToken(accessToken);
  return { accessToken };
}

export async function getMe(): Promise<MeResponse> {
  const response = await authFetchWithRefresh('/api/auth/me', {
    method: 'GET',
  });

  const data = await parseJsonResponse<{ data?: MeResponse } & MeResponse>(response);
  const me = data.data ?? (data as MeResponse);
  return me;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    tokenStore.clearAccessToken();
  }
}
