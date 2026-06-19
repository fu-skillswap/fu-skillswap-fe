import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Shield, User, Terminal, ArrowLeftRight } from 'lucide-react';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { useAuth } from '../context/AuthContext';
import { getSelectedRoleRedirectPath } from '../lib/authRedirect';
import type { UserMeResponse } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithDevBypass, setActiveRole, activeRole } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showDevBypass, setShowDevBypass] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserMeResponse | null>(null);

  const handleSuccess = (_redirectPath: string, me: UserMeResponse) => {
    console.log('[Login] /api/auth/me roles', me.roles);
    const nonAdminRoles = me.roles.filter((role) => role !== 'ADMIN') as Array<'MENTEE' | 'MENTOR'>;
    const canChooseRole = me.roles.includes('ADMIN') && nonAdminRoles.length > 0;

    if (canChooseRole) {
      setPendingUser(me);
      return;
    }

    const primaryRole = me.roles.includes('ADMIN') ? 'ADMIN' : (me.roles[0] as 'MENTEE' | 'MENTOR' | 'ADMIN' | undefined);
    if (primaryRole) {
      setActiveRole(primaryRole);
    }
    const nextPath = getSelectedRoleRedirectPath(me, primaryRole || 'MENTEE', primaryRole || 'MENTEE');
    console.log('[Login] redirect path', { primaryRole, activeRole: primaryRole, nextPath });
    navigate(nextPath);
  };

  const chooseRole = (role: 'ADMIN' | 'MENTEE' | 'MENTOR') => {
    if (!pendingUser) return;
    console.log('[Login] selected role from modal', { role, pendingRoles: pendingUser.roles });
    setActiveRole(role);
    const nextPath = getSelectedRoleRedirectPath(pendingUser, role, role);
    console.log('[Login] redirect path', { role, activeRole, nextPath });
    navigate(nextPath);
    setPendingUser(null);
  };

  const handleDevLogin = (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => {
    loginWithDevBypass(role);
    navigate('/complete-profile');
  };

  return (
    <div className="relative min-h-screen bg-brand-bg flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute top-[15%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-brand-terracotta/6.5 blur-[130px] animate-float-1 pointer-events-none"></div>
      <div className="absolute bottom-[15%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-brand-blue/6 blur-[130px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(21,16,13,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(21,16,13,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-surface/80 border border-brand-border backdrop-blur-xl rounded-card p-8 lg:p-10 z-10 shadow-xl shadow-brand-text/5">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-card bg-brand-terracotta flex items-center justify-center shadow-lg shadow-brand-terracotta/25 mb-4">
            <ArrowLeftRight className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-serif text-brand-text mb-2">
            Skill<span className="text-brand-terracotta">Swap</span>
          </h1>
          <p className="text-brand-text-muted text-body font-medium max-w-xs leading-relaxed">
            Nền tảng trao đổi kỹ năng học thuật dành riêng cho sinh viên FPT University
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-card text-body text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-center">
            <GoogleLoginButton
              onSuccess={handleSuccess}
              onError={setError}
            />
          </div>
          <p className="text-meta text-center text-brand-text-muted leading-normal">
            Bằng cách đăng nhập, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi.
          </p>
        </div>

        {import.meta.env.DEV && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border"></div>
              </div>
              <div className="relative flex justify-center text-body">
                <span className="bg-surface px-3 text-brand-text-muted uppercase tracking-widest font-bold text-meta">
                  Hoặc thử nghiệm
                </span>
              </div>
            </div>

            <div className="mt-4 text-left">
              <button
                onClick={() => setShowDevBypass(!showDevBypass)}
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-field bg-brand-bg/50 hover:bg-brand-bg text-brand-text-muted hover:text-brand-text border border-brand-border transition-all text-body font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-brand-terracotta" />
                  Chế độ nhà phát triển (Bypass)
                </span>
                <span className="text-brand-text-muted text-meta bg-surface border border-brand-border px-2 py-0.5 rounded-md font-bold">
                  {showDevBypass ? 'Đóng' : 'Mở'}
                </span>
              </button>

              {showDevBypass && (
                <div className="mt-3 bg-brand-bg/30 border border-brand-border rounded-card p-4 space-y-3">
                  <div className="flex items-start gap-2 text-meta text-brand-text-muted">
                    <User className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-terracotta" />
                    <span>Chọn vai trò demo bên dưới để đăng nhập trực tiếp mà không cần Google credential thực tế.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleDevLogin('MENTEE')}
                      className="flex flex-col items-center gap-1.5 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/20 py-2.5 px-2 rounded-field text-meta font-bold text-brand-blue transition-all cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sinh viên</span>
                    </button>
                    <button
                      onClick={() => handleDevLogin('MENTOR')}
                      className="flex flex-col items-center gap-1.5 bg-brand-terracotta/10 hover:bg-brand-terracotta/20 border border-brand-terracotta/20 py-2.5 px-2 rounded-field text-meta font-bold text-brand-terracotta transition-all cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Mentor</span>
                    </button>
                    <button
                      onClick={() => handleDevLogin('ADMIN')}
                      className="flex flex-col items-center gap-1.5 bg-brand-sidebar/10 hover:bg-brand-sidebar/20 border border-brand-sidebar/20 py-2.5 px-2 rounded-field text-meta font-bold text-brand-sidebar/80 transition-all cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {pendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-[24px] border border-brand-border bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-extrabold tracking-tight text-brand-text">Chọn vai trò</h2>
            <p className="mt-1.5 text-sm font-medium leading-5 text-brand-text-muted">
              Bạn muốn tiếp tục với vai trò nào?
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {pendingUser.roles.includes('ADMIN') && (
                <button
                  type="button"
                  onClick={() => chooseRole('ADMIN')}
                  className="rounded-2xl border border-brand-border bg-brand-bg/60 px-4 py-3 text-left transition-all hover:border-brand-terracotta/50 hover:bg-brand-terracotta/8 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4 text-brand-terracotta" />
                    <div>
                      <p className="font-bold text-brand-text">Admin</p>
                      <p className="text-xs text-brand-text-muted">Quản trị hệ thống</p>
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const userRole = (pendingUser.roles.find((role) => role !== 'ADMIN') || 'MENTEE') as 'MENTEE' | 'MENTOR';
                  chooseRole(userRole);
                }}
                className="rounded-2xl border border-brand-border bg-brand-bg/60 px-4 py-3 text-left transition-all hover:border-brand-terracotta/50 hover:bg-brand-terracotta/8 hover:shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-brand-blue" />
                  <div>
                    <p className="font-bold text-brand-text">Người dùng</p>
                    <p className="text-xs text-brand-text-muted">Học tập & mentoring</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPendingUser(null)}
                className="rounded-md px-2 py-1 text-sm font-semibold text-brand-text-muted transition-colors hover:text-brand-text"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
