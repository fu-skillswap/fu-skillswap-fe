import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { Login } from './pages/Login';
import { CompleteProfile } from './pages/CompleteProfile';
import { Dashboard } from './pages/Dashboard';
import { Mentors } from './pages/Mentors';
import { Profile } from './pages/Profile';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// Admin Pages
import { AdminMetrics } from './pages/admin/AdminMetrics';
import { UserManagement } from './pages/admin/UserManagement';
import { MentorList } from './pages/admin/MentorList';
import AdminMentorVerificationQueuePage from './pages/admin/mentor-verification/page';
import AdminMentorVerificationDetailPage from './pages/admin/mentor-verification/[requestId]/page';

// Mentor Pages
import { CourseManagement } from './pages/mentor/CourseManagement';
import { CourseDetailPage } from './pages/mentor/CourseDetailPage';
import { MentorPayout } from './pages/mentor/MentorPayout';

// Payment landing (PayOS redirect)
import { PaymentReturn } from './pages/PaymentReturn';

// Lịch của tôi (hợp nhất mentor + mentee)
import { MyBookings } from './pages/MyBookings';

// Chat Page (Diễn đàn đã gộp vào Trang chủ — Dashboard)
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Profile Setup (forces login, redirects if already completed) */}
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />

          {/* Fully Protected Routes (requires login and completed profile) wrapped in Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Mentor Workspaces */}
            {/* Lịch rảnh đã gộp vào trang "Quản lý lớp học" (/mentor/courses) */}
            <Route path="/mentor/slots" element={<Navigate to="/mentor/courses" replace />} />
            <Route path="/mentor/courses" element={<CourseManagement />} />
            <Route path="/mentor/courses/:serviceId" element={<CourseDetailPage />} />
            <Route path="/mentor/payout" element={<MentorPayout />} />

            {/* Payment landing sau khi PayOS redirect về */}
            <Route path="/payment/return" element={<PaymentReturn />} />
            <Route path="/payment/cancel" element={<PaymentReturn />} />
            {/* Hồ sơ + xác thực mentor đã gộp vào tab "Hồ sơ Mentor" trong /profile */}
            <Route path="/mentor/profile-setup" element={<Navigate to="/profile" replace />} />
            <Route path="/mentor/verification" element={<Navigate to="/profile" replace />} />

            {/* Lịch của tôi (hợp nhất mentor + mentee) */}
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/mentor/bookings" element={<Navigate to="/bookings" replace />} />
            <Route path="/mentee/bookings" element={<Navigate to="/bookings" replace />} />

            {/* Diễn đàn đã gộp vào Trang chủ; giữ /forum để deep-link ?post= từ notification vẫn chạy */}
            <Route path="/forum" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Admin Routes wrapped in AdminLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/mentor-verification" replace />} />
            <Route path="/admin/metrics" element={<AdminMetrics />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/mentor-list" element={<MentorList />} />
            {/* Hàng đợi duyệt mentor đã hợp nhất vào trang dùng API thật bên dưới;
                route cũ /admin/verifications (mock localStorage) redirect sang đây. */}
            <Route path="/admin/verifications" element={<Navigate to="/admin/mentor-verification" replace />} />
            <Route path="/admin/mentor-verification" element={<AdminMentorVerificationQueuePage />} />
            <Route path="/admin/mentor-verification/:requestId" element={<AdminMentorVerificationDetailPage />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
