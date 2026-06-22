import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth, getPostLoginRedirect } from '../context/AuthContext';
import { AlertCircle, Shield, User, HelpCircle, Terminal, ArrowLeftRight } from 'lucide-react';

// Client ID dự án Google Cloud Console, cấu hình qua biến môi trường VITE_GOOGLE_CLIENT_ID.
// Phải khớp với GOOGLE_CLIENT_ID đang cấu hình trên BE (dùng để verify audience của idToken).
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

/** Rút thông điệp lỗi từ ApiResponse của BE, có fallback khi không phải lỗi Axios. */
function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message ?? fallback;
  }
  return fallback;
}

export const Login: React.FC = () => {
  const { user, loginWithGoogle, loginWithDevBypass, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showDevBypass, setShowDevBypass] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginRedirect(user));
    }
  }, [isAuthenticated, user, navigate]);

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;
      setLoadingGoogle(true);
      setError(null);
      try {
        const loggedInUser = await loginWithGoogle(response.credential);
        navigate(getPostLoginRedirect(loggedInUser));
      } catch (err) {
        setError(getErrorMessage(err, 'Đăng nhập Google thất bại. Vui lòng thử lại.'));
      } finally {
        setLoadingGoogle(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  // Khởi tạo nút Google Sign-In thật (Google Identity Services) khi đã có Client ID.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        // Không set "hd" (hosted domain) ở đây: tham số này khiến Google ẩn các tài khoản
        // đã lưu trên máy không thuộc domain đó, buộc người dùng phải tự gõ email thủ công
        // thay vì hiện bảng "Chọn tài khoản". Việc kiểm tra domain @fpt.edu.vn (nếu cần)
        // nên để BE xác thực lại từ email trong idToken sau khi verify.
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'vi',
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      // Script GIS (accounts.google.com/gsi/client) có thể chưa load xong, chờ rồi thử lại.
      const intervalId = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          window.clearInterval(intervalId);
          renderGoogleButton();
        }
      }, 200);
      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }
  }, [handleCredentialResponse]);

  // Fallback thủ công: chỉ dùng khi chưa cấu hình VITE_GOOGLE_CLIENT_ID (môi trường dev/test).
  const handleManualTokenLogin = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      const idToken = prompt('Chưa cấu hình VITE_GOOGLE_CLIENT_ID.\nNhập Google ID Token để test tạm (hoặc Cancel để dùng Dev Bypass bên dưới):');
      if (idToken) {
        const loggedInUser = await loginWithGoogle(idToken);
        navigate(getPostLoginRedirect(loggedInUser));
      } else {
        setLoadingGoogle(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập Google thất bại. Hãy thử lại hoặc sử dụng Dev Bypass.'));
      setLoadingGoogle(false);
    }
  };

  const handleDevLogin = (role: 'MENTEE' | 'MENTOR' | 'ADMIN') => {
    const demoUser = loginWithDevBypass(role);
    navigate(getPostLoginRedirect(demoUser));
  };

  return (
    <div className="relative min-h-screen bg-brand-bg flex items-center justify-center px-4 overflow-hidden">
      
      {/* Background Glowing Blobs (Warm Terracotta & Soft Blue Concept) */}
      <div className="absolute top-[15%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-brand-terracotta/6.5 blur-[130px] animate-float-1 pointer-events-none"></div>
      <div className="absolute bottom-[15%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-brand-blue/6 blur-[130px] pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(21,16,13,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(21,16,13,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none"></div>

      {/* Login Card (Warm Light Glassmorphism) */}
      <div className="relative w-full max-w-md bg-surface/80 border border-brand-border backdrop-blur-xl rounded-card p-8 lg:p-10 z-10 shadow-xl shadow-brand-text/5">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-card bg-brand-terracotta flex items-center justify-center shadow-lg shadow-brand-terracotta/25 mb-4">
            <ArrowLeftRight className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-serif text-brand-text mb-2">
            Skill<span className="text-brand-terracotta">Swap</span>
          </h1>
          <p className="text-brand-text-muted text-body font-medium max-w-xs leading-relaxed">
            Nền tảng trao đổi kỹ năng học thuật dành cho sinh viên đại học
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-card text-body text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Action */}
        <div className="space-y-4">
          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-3">
              {/* Nút Google Sign-In thật, render bởi Google Identity Services SDK */}
              <div ref={googleButtonRef} className={loadingGoogle ? 'opacity-50 pointer-events-none' : ''} />
              {loadingGoogle && (
                <div className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          ) : (
            <button
              onClick={handleManualTokenLogin}
              disabled={loadingGoogle}
              className="w-full flex items-center justify-center gap-3 bg-surface text-brand-text font-bold py-3.5 px-6 rounded-card border border-brand-border hover:bg-brand-bg/50 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-brand-text/2"
            >
              {loadingGoogle ? (
                <div className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Đăng nhập với Google</span>
            </button>
          )}
          {!GOOGLE_CLIENT_ID && (
            <p className="text-meta text-center text-amber-600 leading-normal">
              Chưa cấu hình VITE_GOOGLE_CLIENT_ID — đang dùng chế độ nhập token thủ công để test.
            </p>
          )}

          <p className="text-meta text-center text-brand-text-muted leading-normal">
            Bằng cách đăng nhập, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi.
          </p>
        </div>

        {/* Dev Bypass Section — chỉ hiển thị khi chạy ở môi trường dev, không xuất hiện trên bản production */}
        {import.meta.env.DEV && (
        <>
        {/* Divider */}
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
                <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-terracotta" />
                <span>Chọn vai trò demo bên dưới để đăng nhập trực tiếp mà không cần ID Google Token thực tế. Bạn sẽ được chuyển tới trang thiết lập hồ sơ học thuật.</span>
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
    </div>
  );
};
