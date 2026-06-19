const ACCESS_TOKEN_KEY = 'accessToken';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (!canUseStorage()) return null;
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(accessToken: string): void {
    if (!canUseStorage()) return;
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  clearAccessToken(): void {
    if (!canUseStorage()) return;
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
