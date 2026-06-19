import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
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
import { VerificationQueue } from './pages/admin/VerificationQueue';
import AdminMentorVerificationQueuePage from './app/admin/mentor-verification/page';
import AdminMentorVerificationDetailPage from './app/admin/mentor-verification/[requestId]/page';

// Mentor Pages
import { AvailabilitySlots } from './pages/mentor/AvailabilitySlots';
import { MentorBookings } from './pages/mentor/MentorBookings';
import { MentorSetupProfile } from './pages/mentor/MentorSetupProfile';
import { MentorVerification } from './pages/mentor/MentorVerification';

// Mentee Pages
import { MenteeBookings } from './pages/MenteeBookings';

// Forum & Chat Pages
import { Forum } from './pages/Forum';
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

{/* Admin Workspaces */}
             <Route path="/admin" element={<Navigate to="/admin/metrics" replace />} />
             <Route path="/admin/metrics" element={<AdminMetrics />} />
             <Route path="/admin/users" element={<UserManagement />} />
             <Route path="/admin/verifications" element={<VerificationQueue />} />
             <Route path="/admin/mentor-verification" element={<AdminMentorVerificationQueuePage />} />
             <Route path="/admin/mentor-verification/:requestId" element={<AdminMentorVerificationDetailPage />} />

            {/* Mentor Workspaces */}
            <Route path="/mentor/slots" element={<AvailabilitySlots />} />
            <Route path="/mentor/bookings" element={<MentorBookings />} />
            <Route path="/mentor/profile-setup" element={<MentorSetupProfile />} />
            <Route path="/mentor/verification" element={<MentorVerification />} />

            {/* Mentee Workspaces */}
            <Route path="/mentee/bookings" element={<MenteeBookings />} />

            {/* Forum & Chat */}
            <Route path="/forum" element={<Forum />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
