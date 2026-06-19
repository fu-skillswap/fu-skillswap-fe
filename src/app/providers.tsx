'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const clientId = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
