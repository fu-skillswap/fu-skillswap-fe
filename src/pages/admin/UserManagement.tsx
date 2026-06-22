import { useState, useEffect, useCallback } from 'react';
import { Search, Ban, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { adminUsersApi } from '../../api/adminUsers';
import { onAvatarError } from '../../lib/img';
import type { SystemUser } from '../../api/types';

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

export const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Custom modal states
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [lockReason, setLockReason] = useState('Vi phạm quy định cộng đồng');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const dismissTimer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return () => clearTimeout(dismissTimer);
    }
  }, [toastVisible]);

  useEffect(() => {
    if (!toastVisible && toast) {
      const cleanTimer = setTimeout(() => {
        setToast(null);
      }, 300);
      return () => clearTimeout(cleanTimer);
    }
  }, [toastVisible, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const paged = await adminUsersApi.listUsers({ size: 100 });
      setUsers(paged?.content ?? []);
    } catch (err: any) {
      triggerToast(err?.response?.data?.message || 'Không tải được danh sách người dùng.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = (u: SystemUser) => {
    setSelectedUser(u);
    const banning = u.status !== 'BANNED';
    if (banning) {
      setLockReason('Vi phạm quy định cộng đồng');
      setShowLockModal(true);
    } else {
      setShowUnlockModal(true);
    }
  };

  const handleConfirmLock = async () => {
    if (!selectedUser || !lockReason.trim()) return;
    setBusyId(selectedUser.userId);
    setShowLockModal(false);
    try {
      await adminUsersApi.ban(selectedUser.userId, lockReason);
      triggerToast('Đã khóa tài khoản thành công', 'success');
      await load();
    } catch (err: any) {
      triggerToast(err?.response?.data?.message || 'Thao tác thất bại.', 'error');
    } finally {
      setBusyId(null);
      setSelectedUser(null);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!selectedUser) return;
    setBusyId(selectedUser.userId);
    setShowUnlockModal(false);
    try {
      await adminUsersApi.unban(selectedUser.userId, 'Đã xác minh lại');
      triggerToast('Đã kích hoạt tài khoản thành công', 'success');
      await load();
    } catch (err: any) {
      triggerToast(err?.response?.data?.message || 'Thao tác thất bại.', 'error');
    } finally {
      setBusyId(null);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || (u.roles || []).includes(selectedRole);
    const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const primaryRole = (u: SystemUser) => {
    const r = u.roles || [];
    if (r.includes('ADMIN') || r.includes('SYSTEM_ADMIN')) return 'ADMIN';
    if (r.includes('MENTOR')) return 'MENTOR';
    return 'MENTEE';
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg p-4 shadow-lg text-white w-96 transition-all duration-300 ease-in-out ${
            toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'
          } ${
            toast.type === 'success' 
              ? 'bg-status-approved' 
              : toast.type === 'warning' 
                ? 'bg-status-revision' 
                : 'bg-status-rejected'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-sm leading-none mb-1 text-white">
              {toast.type === 'success' ? 'Thành công' : toast.type === 'warning' ? 'Thông báo' : 'Thất bại'}
            </div>
            <div className="text-xs text-white/90 leading-tight break-words font-medium">{toast.message}</div>
          </div>
          <button
            onClick={() => setToastVisible(false)}
            className="text-white/80 hover:text-white shrink-0 focus:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight">
          Quản lý người dùng
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Xem thông tin cơ bản, vai trò học tập và quản lý trạng thái kích hoạt tài khoản sinh viên.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface border border-brand-border p-4 rounded-card shadow-sm">

        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-grey" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 pl-10 pr-4 text-body text-brand-text focus:outline-none focus:border-brand-terracotta transition-all"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="MENTEE">Sinh viên (Mentee)</option>
            <option value="MENTOR">Người hướng dẫn (Mentor)</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="BANNED">Đang khóa (Banned)</option>
            <option value="INACTIVE">Chưa kích hoạt</option>
          </select>
        </div>

      </div>

      {/* User Table Card */}
      <div className="meetmind-card rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-body text-left border-collapse">

            {/* Headers */}
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-brand-text-muted font-bold text-meta uppercase tracking-wider">
                <th className="py-4 px-6">Họ và tên</th>
                <th className="py-4 px-4">Email</th>
                <th className="py-4 px-4">Vai trò</th>
                <th className="py-4 px-4">Đăng nhập gần nhất</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-7 h-7 animate-spin text-brand-terracotta mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-text-muted font-semibold">
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const role = primaryRole(u);
                  const isBanned = u.status === 'BANNED';
                  return (
                    <tr key={u.userId} className="hover:bg-brand-bg/20 transition-colors">

                      {/* Name */}
                      <td className="py-4 px-6 font-bold text-brand-text">
                        <div className="flex items-center gap-2">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} onError={onAvatarError} alt={u.fullName} className="w-8 h-8 rounded-full border border-brand-border object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center font-bold text-meta text-brand-terracotta">
                              {u.fullName?.charAt(0) || '?'}
                            </div>
                          )}
                          <span>{u.fullName}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 font-semibold text-brand-text-muted">{u.email}</td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span className={`inline-block text-meta font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                          role === 'ADMIN'
                            ? 'bg-brand-sidebar/10 text-brand-sidebar border-brand-sidebar/20'
                            : role === 'MENTOR'
                            ? 'bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20'
                            : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                        }`}>
                          {role}
                        </span>
                      </td>

                      {/* Last login */}
                      <td className="py-4 px-4 font-semibold text-brand-text-muted">{fmtDate(u.lastLoginAt)}</td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          u.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : isBanned
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-500' : isBanned ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                          {u.status === 'ACTIVE'
                            ? 'Đang hoạt động'
                            : isBanned
                            ? 'Đã khóa'
                            : u.status === 'INACTIVE'
                            ? 'Chưa kích hoạt'
                            : u.status === 'DELETED'
                            ? 'Đã xóa'
                            : u.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={busyId === u.userId}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-field border text-meta font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            isBanned
                              ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {busyId === u.userId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isBanned ? (
                            <><CheckCircle className="w-3 h-3" /> Kích hoạt</>
                          ) : (
                            <><Ban className="w-3 h-3" /> Khóa</>
                          )}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Custom Lock User Modal */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div 
            className="bg-surface border border-brand-border rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="font-headline-sm text-headline-sm text-fg font-bold">
                Khóa tài khoản người dùng
              </h3>
              <button 
                onClick={() => { setShowLockModal(false); setSelectedUser(null); }}
                className="text-fg-muted hover:text-fg transition-colors focus:outline-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-left space-y-4">
              <p className="font-body-md text-fg-muted leading-relaxed text-sm">
                Bạn có chắc chắn muốn khóa tài khoản của người dùng <strong className="text-fg font-semibold">{selectedUser.fullName}</strong>?
              </p>
              
              <div>
                <label htmlFor="lock-reason" className="block font-label-md text-fg-muted text-xs uppercase tracking-wider mb-2 font-semibold">
                  Lý do khóa <span className="text-danger font-bold">*</span>
                </label>
                <textarea
                  id="lock-reason"
                  rows={3}
                  className="w-full bg-white border border-brand-border rounded-lg p-3 text-fg font-body-md text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent resize-none"
                  placeholder="Nhập lý do khóa tài khoản tại đây..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-muted border-t border-brand-border">
              <button
                onClick={() => { setShowLockModal(false); setSelectedUser(null); }}
                className="px-4 py-2 border border-brand-border rounded-lg bg-surface text-fg hover:bg-surface-muted transition-colors font-label-md text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={busyId === selectedUser.userId || !lockReason.trim()}
                onClick={handleConfirmLock}
                className="px-4 py-2 bg-danger text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm font-label-md text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {busyId === selectedUser.userId ? 'Đang xử lý...' : 'Khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Unlock User Modal */}
      {showUnlockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div 
            className="bg-surface border border-brand-border rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="font-headline-sm text-headline-sm text-fg font-bold">
                Kích hoạt lại tài khoản
              </h3>
              <button 
                onClick={() => { setShowUnlockModal(false); setSelectedUser(null); }}
                className="text-fg-muted hover:text-fg transition-colors focus:outline-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-left">
              <p className="font-body-md text-fg-muted leading-relaxed text-sm">
                Bạn có chắc chắn muốn kích hoạt lại tài khoản của người dùng <strong className="text-fg font-semibold">{selectedUser.fullName}</strong>?
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-muted border-t border-brand-border">
              <button
                onClick={() => { setShowUnlockModal(false); setSelectedUser(null); }}
                className="px-4 py-2 border border-brand-border rounded-lg bg-surface text-fg hover:bg-surface-muted transition-colors font-label-md text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={busyId === selectedUser.userId}
                onClick={handleConfirmUnlock}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm font-label-md text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {busyId === selectedUser.userId ? 'Đang xử lý...' : 'Kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
