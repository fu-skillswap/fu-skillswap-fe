import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { requireAdmin } from '../lib/adminGuard';
import { useAuth } from '../context/AuthContext';
import type { MeResponse } from '../lib/authService';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { activeRole } = useAuth();
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'allowed'; me: MeResponse } | { status: 'forbidden' } | { status: 'unauthenticated' }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    requireAdmin().then((result) => {
      if (cancelled) return;
      if (result.allowed) {
        const allowed = activeRole === 'ADMIN';
        console.log('[AdminGuard] me roles', result.me.roles, 'activeRole', activeRole, 'allowed', allowed);
        setState(allowed ? { status: 'allowed', me: result.me } : { status: 'forbidden' });
      } else {
        setState({ status: result.reason });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeRole]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app text-fg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (state.status === 'forbidden') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
