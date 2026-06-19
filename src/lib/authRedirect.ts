import type { MeResponse } from './authService';

export function getPostLoginRedirectPath(me: Pick<MeResponse, 'profileCompleted' | 'roles'>): string {
  if (me.profileCompleted === false) {
    return '/onboarding/student-profile';
  }

  if (me.roles.includes('ADMIN') || me.roles.includes('SYSTEM_ADMIN')) {
    return '/admin';
  }

  return '/dashboard';
}

export function getSelectedRoleRedirectPath(
  me: Pick<MeResponse, 'profileCompleted' | 'roles'>,
  selectedRole: 'MENTEE' | 'MENTOR' | 'ADMIN',
  activeRole?: 'MENTEE' | 'MENTOR' | 'ADMIN' | null
): string {
  const resolvedRole = activeRole ?? selectedRole;

  console.log('[authRedirect] redirect decision', {
    roles: me.roles,
    profileCompleted: me.profileCompleted,
    selectedRole,
    activeRole,
    resolvedRole,
  });

  if (resolvedRole === 'ADMIN') {
    return '/admin/mentor-verification';
  }

  return me.profileCompleted === false ? '/complete-profile' : '/dashboard';
}
