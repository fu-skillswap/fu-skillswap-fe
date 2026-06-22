import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
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

  if (!isAuthenticated) {
    // Redirect to login if not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('ADMIN') || roles.includes('SYSTEM_ADMIN');

  // If logged in but profile is not completed (only check for non-admin)
  if (user && !isAdmin && !user.profileCompleted && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // If logged in and profile is already completed (or user is admin), prevent going back to complete-profile page
  if (user && (isAdmin || user.profileCompleted) && location.pathname === '/complete-profile') {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // Role-based route guards
  if (user) {
    if (isAdmin) {
      if (location.pathname === '/settings') {
        return <Navigate to="/admin/settings" replace />;
      }
      // Admin can only access routes starting with /admin
      const isAdminRoute = location.pathname.startsWith('/admin');
      if (!isAdminRoute) {
        return <Navigate to="/admin" replace />;
      }
    } else {
      // Non-admin cannot access routes starting with /admin
      const isAdminRoute = location.pathname.startsWith('/admin');
      if (isAdminRoute) {
        return <Navigate to={user.profileCompleted ? "/dashboard" : "/complete-profile"} replace />;
      }
    }
  }

  return children ? <>{children}</> : null;
};
