import { getMe } from '../lib/authService';
import type { MeResponse } from '../lib/authService';

function hasAdminRole(me: MeResponse | null | undefined): boolean {
  return !!me?.roles?.includes('ADMIN');
}

export async function requireAdmin(): Promise<{ allowed: true; me: MeResponse } | { allowed: false; reason: 'forbidden' | 'unauthenticated' }> {
  try {
    const me = await getMe();
    if (!hasAdminRole(me)) {
      return { allowed: false, reason: 'forbidden' };
    }
    return { allowed: true, me };
  } catch {
    return { allowed: false, reason: 'unauthenticated' };
  }
}

export function isAdmin(me: Pick<MeResponse, 'roles'> | null | undefined): boolean {
  if (!me) return false;
  return me.roles.includes('ADMIN');
}
