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
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-brand-purple/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-brand-teal rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-400 font-medium animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but profile is not completed
  if (user && !user.profileCompleted && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // If logged in and profile is already completed, prevent going back to complete-profile page
  if (user && user.profileCompleted && location.pathname === '/complete-profile') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : null;
};
