import type { MeResponse } from './authService';
import { tokenStore } from './tokenStore';

export function requireAuth(): boolean {
  return !!tokenStore.getAccessToken();
}

export function isAdmin(me: Pick<MeResponse, 'roles'> | null | undefined): boolean {
  if (!me) return false;
  return me.roles.includes('ADMIN') || me.roles.includes('SYSTEM_ADMIN');
}
