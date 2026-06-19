import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin, requireAuth } from '../lib/authGuard';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loading, activeRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-fg-faint font-medium animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!isAuthenticated || !requireAuth()) {
    // Redirect to login if not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdminSession = activeRole === 'ADMIN' && !!user?.roles?.includes('ADMIN');

  // If logged in but profile is not completed, only force non-admin users to complete profile
  if (user && !user.profileCompleted && !isAdminSession && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (location.pathname.startsWith('/admin') && (!isAdmin(user) || activeRole !== 'ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  // If logged in and profile is already completed, prevent going back to complete-profile page
  if (user && user.profileCompleted && location.pathname === '/complete-profile') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAdminSession && location.pathname === '/complete-profile') {
    return <Navigate to="/admin/mentor-verification" replace />;
  }

  return children ? <>{children}</> : null;
};
