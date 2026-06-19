import React, { createContext, useState, useEffect, useContext } from 'react';
import { tokenStore } from '../lib/tokenStore';
import { loginWithGoogle as loginWithGoogleApi, getMe, logout as logoutApi } from '../lib/authService';

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
  activeRole: 'MENTEE' | 'MENTOR' | 'ADMIN' | null;
  loginWithGoogle: (idToken: string) => Promise<UserMeResponse>;
  loginWithDevBypass: (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => void;
  setActiveRole: (role: 'MENTEE' | 'MENTOR' | 'ADMIN' | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevBypass, setIsDevBypass] = useState(false);
  const [activeRole, setActiveRoleState] = useState<'MENTEE' | 'MENTOR' | 'ADMIN' | null>(
    () => (localStorage.getItem('activeRole') as 'MENTEE' | 'MENTOR' | 'ADMIN' | null) || null
  );

  useEffect(() => {
    console.log('[AuthContext] activeRole changed', activeRole);
  }, [activeRole]);

  const checkCurrentUser = async () => {
    const accessToken = tokenStore.getAccessToken();
    const isBypass = localStorage.getItem('isDevBypass') === 'true';

    if (!accessToken) {
      setUser(null);
      setLoading(false);
      setActiveRoleState(null);
      localStorage.removeItem('activeRole');
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
      setActiveRoleState(null);
      localStorage.removeItem('activeRole');
      return;
    }

    try {
      const response = await getMe();
      setUser(response as UserMeResponse);
    } catch (error) {
      console.error('Lỗi khôi phục phiên đăng nhập:', error);
      // Clean up state
      tokenStore.clearAccessToken();
      setUser(null);
      setActiveRoleState(null);
      localStorage.removeItem('activeRole');
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
      tokenStore.clearAccessToken();
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
      await loginWithGoogleApi(idToken);
      localStorage.setItem('isDevBypass', 'false');
      setIsDevBypass(false);

      // Fetch user profile
      const meResponse = await getMe();
      const nextUser = meResponse as UserMeResponse;
      setUser(nextUser);
      console.log('[AuthContext] loginWithGoogle me', {
        roles: nextUser.roles,
        profileCompleted: nextUser.profileCompleted,
        activeRole: localStorage.getItem('activeRole'),
      });
      return nextUser;
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

    tokenStore.setAccessToken('dev-bypass-access-token');
    localStorage.setItem('isDevBypass', 'true');
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    localStorage.setItem('activeRole', role);

    setUser(demoUser);
    setIsDevBypass(true);
    setActiveRoleState(role);
    setLoading(false);
  };

  const setActiveRole = (role: 'MENTEE' | 'MENTOR' | 'ADMIN' | null) => {
    setActiveRoleState(role);
    if (role) {
      localStorage.setItem('activeRole', role);
    } else {
      localStorage.removeItem('activeRole');
    }
  };

  const logout = async () => {
    setLoading(true);
    const isBypass = localStorage.getItem('isDevBypass') === 'true';

    try {
      if (!isBypass) {
        await logoutApi();
      }
    } catch (error) {
      console.error('Đăng xuất API thất bại:', error);
    } finally {
      tokenStore.clearAccessToken();
      localStorage.removeItem('isDevBypass');
      localStorage.removeItem('demoUser');
      localStorage.removeItem('activeRole');
      setUser(null);
      setIsDevBypass(false);
      setActiveRoleState(null);
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
      const response = await getMe();
      setUser(response as UserMeResponse);
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
      activeRole,
      loginWithGoogle,
      loginWithDevBypass,
      setActiveRole,
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
