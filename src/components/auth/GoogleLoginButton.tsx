'use client';

import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import type { UserMeResponse } from '../../context/AuthContext';
import { getPostLoginRedirectPath } from '../../lib/authRedirect';

interface GoogleLoginButtonProps {
  onSuccess?: (redirectPath: string, me: UserMeResponse) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse: CredentialResponse) => {
        const idToken = credentialResponse.credential;
        if (!idToken) {
          onError?.('Missing Google credential.');
          return;
        }

        try {
          console.log('[GoogleLogin] credential received, exchanging with backend');
          const me = await loginWithGoogle(idToken);
          console.log('[GoogleLogin] login success', {
            email: me.email,
            roles: me.roles,
            profileCompleted: me.profileCompleted,
          });
          await onSuccess?.(getPostLoginRedirectPath(me), me);
        } catch (error) {
          console.error('[GoogleLogin] login failed', error);
          onError?.(error instanceof Error ? error.message : 'Google login failed');
        }
      }}
      onError={() => onError?.('Google login failed')}
      useOneTap={false}
    />
  );
}
