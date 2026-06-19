import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LogoutButton() {
  const navigate = useNavigate();
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-field border border-brand-border px-4 py-2 text-body font-semibold text-brand-text transition-all hover:bg-brand-bg/50 disabled:opacity-60"
    >
      Dang xuat
    </button>
  );
}
