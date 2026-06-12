import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client';

export interface UserMeResponse {
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  roles: ('MENTEE' | 'MENTOR' | 'ADMIN' | 'STAFF')[];
  profileCompleted: boolean;
  hasStudentProfile: boolean;
}

interface AuthContextType {
  user: UserMeResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDevBypass: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithDevBypass: (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevBypass, setIsDevBypass] = useState(false);

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
      localStorage.removeItem('refreshToken');
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
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/google', { idToken });
      const { accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('isDevBypass', 'false');
      setIsDevBypass(false);

      // Fetch user profile
      const meResponse = await apiClient.get('/api/auth/me');
      setUser(meResponse.data.data);
    } catch (error) {
      console.error('Đăng nhập Google thất bại:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDevBypass = (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => {
    setLoading(true);
    const demoUser: UserMeResponse = {
      publicId: 'e3b0c442-98fc-1c14-9afb-f3557fa39123',
      email: `demo.${role.toLowerCase()}@fpt.edu.vn`,
      fullName: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()} User`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${role}`,
      status: 'ACTIVE',
      roles: [role],
      profileCompleted: false, // Default to false so they can test profile completion!
      hasStudentProfile: false,
    };

    localStorage.setItem('accessToken', 'dev-bypass-access-token');
    localStorage.setItem('refreshToken', 'dev-bypass-refresh-token');
    localStorage.setItem('isDevBypass', 'true');
    localStorage.setItem('demoUser', JSON.stringify(demoUser));

    setUser(demoUser);
    setIsDevBypass(true);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    const refreshToken = localStorage.getItem('refreshToken');
    const isBypass = localStorage.getItem('isDevBypass') === 'true';

    try {
      if (!isBypass && refreshToken) {
        await apiClient.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Đăng xuất API thất bại:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isDevBypass');
      localStorage.removeItem('demoUser');
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
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Lỗi cập nhật thông tin user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        isDevBypass,
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
