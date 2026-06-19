import { useState, useEffect, useCallback } from 'react';
import { Search, Ban, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { adminUsersApi } from '../../api/adminUsers';
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
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const paged = await adminUsersApi.listUsers({ size: 100 });
      setUsers(paged?.content ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (u: SystemUser) => {
    const banning = u.status !== 'BANNED';
    const reason = window.prompt(
      banning ? 'Lý do khoá tài khoản này:' : 'Lý do mở khoá tài khoản này:',
      banning ? 'Vi phạm quy định cộng đồng' : 'Đã xác minh lại',
    );
    if (reason === null) return; // huỷ
    setBusyId(u.userId);
    try {
      if (banning) await adminUsersApi.ban(u.userId, reason || 'N/A');
      else await adminUsersApi.unban(u.userId, reason || undefined);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setBusyId(null);
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
    <div className="space-y-6 text-left">

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight">
          Quản lý người dùng
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Xem thông tin cơ bản, vai trò học tập và quản lý trạng thái kích hoạt tài khoản sinh viên.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-card text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

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
                            <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full border border-brand-border object-cover" />
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
                        <span className={`inline-flex items-center gap-1 text-meta font-bold ${
                          u.status === 'ACTIVE' ? 'text-green-600' : isBanned ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-500' : isBanned ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                          {u.status}
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

    </div>
  );
};
