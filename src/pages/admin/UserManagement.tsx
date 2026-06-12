import { useState } from 'react';
import { Search, Ban, CheckCircle } from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  campus: string;
  role: 'MENTEE' | 'MENTOR' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
  profileCompleted: boolean;
}

export const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [users, setUsers] = useState<ManagedUser[]>([
    { id: '1', name: 'Trần Hoàng Long', email: 'longth.se18@fpt.edu.vn', campus: 'HCM', role: 'MENTOR', status: 'ACTIVE', profileCompleted: true },
    { id: '2', name: 'Lê Minh Hương', email: 'huonglm.se19@fpt.edu.vn', campus: 'HCM', role: 'MENTOR', status: 'ACTIVE', profileCompleted: true },
    { id: '3', name: 'Nguyễn Tiến Đạt', email: 'datnt.ia19@fpt.edu.vn', campus: 'HCM', role: 'MENTEE', status: 'ACTIVE', profileCompleted: true },
    { id: '4', name: 'Phạm Thùy Linh', email: 'linhpt.ba18@fpt.edu.vn', campus: 'HA_NOI', role: 'MENTOR', status: 'ACTIVE', profileCompleted: true },
    { id: '5', name: 'Nguyễn Hoàng Nam', email: 'namnh.gd19@fpt.edu.vn', campus: 'HCM', role: 'MENTEE', status: 'ACTIVE', profileCompleted: true },
    { id: '6', name: 'Nguyễn Văn Hùng', email: 'hungnv.se18@fpt.edu.vn', campus: 'DA_NANG', role: 'MENTEE', status: 'BANNED', profileCompleted: false },
  ]);

  const handleToggleStatus = (userId: string) => {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

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

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface border border-brand-border p-4 rounded-card shadow-sm">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-grey" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email học sinh..."
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
                <th className="py-4 px-4">Email sinh viên</th>
                <th className="py-4 px-4">Cơ sở FPT</th>
                <th className="py-4 px-4">Vai trò</th>
                <th className="py-4 px-4">Hồ sơ</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y divide-brand-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-text-muted font-semibold">
                    Không tìm thấy tài khoản sinh viên nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-bg/20 transition-colors">
                    
                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-brand-text flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center font-bold text-meta text-brand-terracotta">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 font-semibold text-brand-text-muted">{u.email}</td>

                    {/* Campus */}
                    <td className="py-4 px-4 font-bold text-brand-blue">{u.campus}</td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span className={`inline-block text-meta font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                        u.role === 'ADMIN'
                          ? 'bg-brand-sidebar/10 text-brand-sidebar border-brand-sidebar/20'
                          : u.role === 'MENTOR'
                          ? 'bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20'
                          : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Profile completed */}
                    <td className="py-4 px-4">
                      <span className={`font-semibold ${u.profileCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                        {u.profileCompleted ? 'Đã xong' : 'Thiếu'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-meta font-bold ${
                        u.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {u.status === 'ACTIVE' ? 'Active' : 'Banned'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-field border text-meta font-bold transition-all cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <Ban className="w-3 h-3" /> Khóa
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" /> Kích hoạt
                          </>
                        )}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};
