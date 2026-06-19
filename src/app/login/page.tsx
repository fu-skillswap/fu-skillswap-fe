'use client';

import { useState } from 'react';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <main>
      <GoogleLoginButton
        onSuccess={() => {
          window.location.href = '/dashboard';
        }}
        onError={setError}
      />
      {error ? <p>{error}</p> : null}
    </main>
  );
}
