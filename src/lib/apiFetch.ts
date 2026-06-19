import { tokenStore } from './tokenStore';

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.skillswap.asia';

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch(input: string, init: ApiFetchOptions = {}) {
  const { auth = false, headers, credentials, ...rest } = init;
  const resolvedHeaders = new Headers(headers);

  if (auth) {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) {
      resolvedHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return fetch(`${API_URL}${input}`, {
    ...rest,
    headers: resolvedHeaders,
    credentials: auth ? 'include' : credentials,
  });
}

export async function refreshAccessToken(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    tokenStore.clearAccessToken();
    throw new Error('Refresh access token failed');
  }

  const json = (await response.json()) as { data?: { accessToken?: string } };
  const accessToken = json.data?.accessToken;

  if (!accessToken) {
    tokenStore.clearAccessToken();
    throw new Error('Missing accessToken in refresh response');
  }

  tokenStore.setAccessToken(accessToken);
  return accessToken;
}

export async function authFetchWithRefresh(input: string, init: ApiFetchOptions = {}) {
  const response = await apiFetch(input, { ...init, auth: true });
  if (response.status !== 401) {
    return response;
  }

  try {
    await refreshAccessToken();
  } catch (error) {
    tokenStore.clearAccessToken();
    throw error;
  }

  return apiFetch(input, { ...init, auth: true });
}
