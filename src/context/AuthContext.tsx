import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client';

export interface UserMeResponse {
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  roles: ('MENTEE' | 'MENTOR' | 'ADMIN' | 'SYSTEM_ADMIN')[];
  profileCompleted: boolean;
  hasStudentProfile: boolean;
}

/**
 * Vai trò đang hoạt động ở FE. Một user vừa là MENTOR vừa có thể "đóng vai" MENTEE
 * (vì mentor không được đặt lịch mentor khác — phải chuyển sang chế độ Mentee để đặt).
 */
export type ActiveRole = 'MENTOR' | 'MENTEE';
const ACTIVE_ROLE_KEY = 'activeRole';

interface AuthContextType {
  user: UserMeResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDevBypass: boolean;
  /** Vai trò đang hoạt động (chỉ đổi được khi user có role MENTOR). */
  activeRole: ActiveRole;
  /** Đổi vai trò hoạt động (Mentor ⇄ Mentee). */
  setActiveRole: (role: ActiveRole) => void;
  loginWithGoogle: (idToken: string) => Promise<UserMeResponse>;
  loginWithDevBypass: (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => UserMeResponse;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserMeResponse | null>;
}

/**
 * Quyết định trang đích sau khi đăng nhập / hoàn thiện hồ sơ, dựa trên role
 * và trạng thái hồ sơ của user. ADMIN/SYSTEM_ADMIN luôn được đưa vào khu vực
 * quản trị, bất kể profileCompleted.
 */
export const getPostLoginRedirect = (user: UserMeResponse): string => {
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SYSTEM_ADMIN');
  if (isAdmin) return '/admin';
  if (!user.profileCompleted) return '/complete-profile';
  return '/dashboard';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevBypass, setIsDevBypass] = useState(false);
  const [activeRole, setActiveRoleState] = useState<ActiveRole>('MENTEE');

  // Đồng bộ activeRole theo user: user không có role MENTOR thì luôn là MENTEE;
  // có MENTOR thì khôi phục lựa chọn đã lưu (mặc định MENTOR).
  useEffect(() => {
    if (!user) return;
    if (!user.roles?.includes('MENTOR')) {
      setActiveRoleState('MENTEE');
      return;
    }
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
    setActiveRoleState(stored === 'MENTEE' || stored === 'MENTOR' ? stored : 'MENTOR');
  }, [user]);

  const setActiveRole = (role: ActiveRole) => {
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRoleState(role);
  };

  const checkCurrentUser = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const isBypass = localStorage.getItem('isDevBypass') === 'true';

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (isBypass) {
      // Restore simulated user from localstorage
      const storedUser = localStorage.getItem('demoUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsDevBypass(true);
      }
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Lỗi khôi phục phiên đăng nhập:', error);
      // Clean up state
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentUser();

    // Listen for automatic logout event from API client
    const handleLogoutEvent = () => {
      setUser(null);
      setIsDevBypass(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isDevBypass');
      localStorage.removeItem('demoUser');
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      // refreshToken được BE set vào HttpOnly Cookie (skillswap_refresh_token) —
      // FE chỉ nhận và lưu accessToken, không đọc/lưu refreshToken.
      const response = await apiClient.post('/api/auth/google', { idToken });
      const { accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('isDevBypass', 'false');
      setIsDevBypass(false);

      // Fetch user profile
      const meResponse = await apiClient.get('/api/auth/me');
      const fetchedUser: UserMeResponse = meResponse.data.data;
      setUser(fetchedUser);
      return fetchedUser;
    } catch (error) {
      console.error('Đăng nhập Google thất bại:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDevBypass = (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => {
    setLoading(true);
    // ADMIN demo user được coi là đã hoàn thiện hồ sơ vì khu vực quản trị
    // không yêu cầu hồ sơ học thuật của sinh viên.
    const demoUser: UserMeResponse = {
      publicId: 'e3b0c442-98fc-1c14-9afb-f3557fa39123',
      email: `demo.${role.toLowerCase()}@fpt.edu.vn`,
      fullName: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()} User`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${role}`,
      status: 'ACTIVE',
      roles: [role],
      profileCompleted: role === 'ADMIN', // Non-admin: false để test luồng hoàn thiện hồ sơ.
      hasStudentProfile: role === 'ADMIN',
    };

    localStorage.setItem('accessToken', 'dev-bypass-access-token');
    localStorage.setItem('isDevBypass', 'true');
    localStorage.setItem('demoUser', JSON.stringify(demoUser));

    setUser(demoUser);
    setIsDevBypass(true);
    setLoading(false);
    return demoUser;
  };

  const logout = async () => {
    setLoading(true);
    const isBypass = localStorage.getItem('isDevBypass') === 'true';

    try {
      if (!isBypass) {
        const refreshToken = localStorage.getItem('refreshToken');
        await apiClient.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Đăng xuất API thất bại:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isDevBypass');
      localStorage.removeItem('demoUser');
      localStorage.removeItem(ACTIVE_ROLE_KEY);
      setUser(null);
      setIsDevBypass(false);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const isBypass = localStorage.getItem('isDevBypass') === 'true';
    if (isBypass && user) {
      // For dev bypass, just set profileCompleted to true to simulate submission
      const updatedUser = { ...user, profileCompleted: true, hasStudentProfile: true };
      localStorage.setItem('demoUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      const fetchedUser: UserMeResponse = response.data.data;
      setUser(fetchedUser);
      return fetchedUser;
    } catch (error) {
      console.error('Lỗi cập nhật thông tin user:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        isDevBypass,
        activeRole,
        setActiveRole,
        loginWithGoogle,
        loginWithDevBypass,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
