import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Check, AlertCircle, User, Camera, Loader2 } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';

interface Campus {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface AcademicProgram {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
}

interface Specialization {
  id: string;
  programId: string;
  code: string;
  nameVi: string;
  nameEn: string;
}

export const Profile: React.FC = () => {
  const { user, refreshUser, isDevBypass } = useAuth();

  // Academic Profile Form states
  const [studentCode, setStudentCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [semester, setSemester] = useState(1);
  const [intakeYear, setIntakeYear] = useState(2022);
  const [isAlumni, setIsAlumni] = useState(false);
  const [graduationYear, setGraduationYear] = useState(2026);
  const [bio, setBio] = useState('');

  // Dropdown lists
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  // UI States
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload ảnh đại diện: FE upload trực tiếp lên Cloudinary, rồi lưu fileUrl vào avatarUrl.
  const avatarUpload = useImageUpload({ usage: 'AVATAR' });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await avatarUpload.upload(file);
    if (uploaded) {
      setAvatarUrl(uploaded.fileUrl);
    }
  };

  // Fallback demo data
  const fallbackCampuses = [
    { id: 'c1', code: 'HCM', name: 'FPT University TP. Hồ Chí Minh', city: 'TP. HCM' },
    { id: 'c2', code: 'HA_NOI', name: 'FPT University Hà Nội', city: 'Hà Nội' },
  ];
  const fallbackPrograms = [
    { id: 'p1', code: 'SE', nameVi: 'Kỹ thuật phần mềm', nameEn: 'Software Engineering' },
  ];
  const fallbackSpecializations = [
    { id: 's1', programId: 'p1', code: 'SE_JS', nameVi: 'Lập trình Fullstack', nameEn: 'Fullstack Development' },
    { id: 's2', programId: 'p1', code: 'SE_AI', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence' },
    { id: 's3', programId: 'p1', code: 'SE_IS', nameVi: 'An toàn thông tin', nameEn: 'Information Security' },
  ];

  // Load profile data and mentor request status
  useEffect(() => {
    const loadProfileData = async () => {
      setFetching(true);
      setError(null);

      try {
        const campusRes = await apiClient.get('/api/campuses');
        setCampuses(campusRes.data.data?.length ? campusRes.data.data : fallbackCampuses);

        const programRes = await apiClient.get('/api/academic-programs');
        setPrograms(programRes.data.data?.length ? programRes.data.data : fallbackPrograms);

        if (isDevBypass) {
          setStudentCode('SE192621');
          setDisplayName(user?.fullName || 'Demo User');
          setAvatarUrl(user?.avatarUrl || '');
          setSelectedCampus('c1');
          setSelectedProgram('p1');
          setSelectedSpecialization('s1');
          setSemester(5);
          setIntakeYear(2022);
          setIsAlumni(false);
          setBio('Mình là sinh viên SE năm 3, mạnh về React. Muốn học thêm Python.');
          setFetching(false);
          return;
        }

        // Fetch user profile
        try {
          const profileRes = await apiClient.get('/api/me/student-profile');
          const data = profileRes.data.data;
          
          if (data) {
            setStudentCode(data.studentCode || '');
            setDisplayName(data.displayName || user?.fullName || '');
            setAvatarUrl(data.avatarUrl || user?.avatarUrl || '');
            setSelectedCampus(data.campus?.id || '');
            setSelectedProgram(data.program?.id || '');
            setSelectedSpecialization(data.specialization?.id || '');
            setSemester(data.semester || 1);
            setIntakeYear(data.intakeYear || 2022);
            setIsAlumni(data.alumni || false);
            setGraduationYear(data.graduationYear || 2026);
            setBio(data.bio || '');
          }
        } catch (profileErr: any) {
          if (profileErr.response?.status !== 404) {
            throw profileErr;
          }
          setDisplayName(user?.fullName || '');
          setAvatarUrl(user?.avatarUrl || '');
        }
      } catch (err: any) {
        console.error('Failed to load profile data', err);
        setError('Không thể kết nối với server để lấy dữ liệu. Đang hiển thị bản nháp.');
        setCampuses(fallbackCampuses);
        setPrograms(fallbackPrograms);
        setSpecializations(fallbackSpecializations);
      } finally {
        setFetching(false);
      }
    };

    loadProfileData();
  }, [user, isDevBypass]);

  // Load specializations when program changes
  useEffect(() => {
    if (!selectedProgram) {
      setSpecializations([]);
      return;
    }

    const fetchSpecializations = async () => {
      try {
        const specRes = await apiClient.get(`/api/academic-programs/${selectedProgram}/specializations`);
        setSpecializations(specRes.data.data?.length ? specRes.data.data : fallbackSpecializations);
      } catch (err) {
        console.warn('Failed to load specializations, using mock.', err);
        setSpecializations(fallbackSpecializations);
      }
    };

    fetchSpecializations();
  }, [selectedProgram]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate Student Code
    const studentCodeRegex = /^[HSDQC][ESA](0[1-9]|1[0-9]|2[0-2])\d{4}$/i;
    if (!studentCodeRegex.test(studentCode)) {
      setError('Mã số sinh viên không đúng định dạng FPT. Ví dụ: SE192621, HA221234');
      return;
    }

    setSaving(true);

    const payload = {
      studentCode: studentCode.toUpperCase(),
      displayName,
      avatarUrl,
      campusId: selectedCampus,
      programId: selectedProgram,
      specializationId: selectedSpecialization,
      semester: Number(semester),
      intakeYear: Number(intakeYear),
      isAlumni,
      graduationYear: isAlumni ? Number(graduationYear) : null,
      bio,
    };

    try {
      if (!isDevBypass) {
        await apiClient.put('/api/me/student-profile', payload);
      }
      await refreshUser();
      setSuccess('Cập nhật hồ sơ học thuật thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Lưu thông tin thất bại. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-brand-terracotta/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-brand-terracotta rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-brand-text-muted font-bold">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">

      {/* Card Sidebar Info */}
      <div className="meetmind-card p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-brand-terracotta/5 rounded-full blur-2xl"></div>
          
          <div className="relative inline-block mt-4 mb-4">
            <img
              src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
              alt={displayName}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white ring-4 ring-brand-terracotta/15"
            />
            <label
              htmlFor="avatar-upload-input"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-terracotta text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-brand-terracotta/90 transition-all"
              title="Đổi ảnh đại diện"
            >
              {avatarUpload.uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={avatarUpload.uploading}
              onChange={handleAvatarChange}
            />
          </div>

          {avatarUpload.error && (
            <p className="text-meta font-semibold text-red-600 mb-2">{avatarUpload.error}</p>
          )}

          <h2 className="text-xl font-bold text-brand-text tracking-tight">{displayName || user?.fullName}</h2>
          <p className="text-brand-text-muted text-body font-semibold mt-1">{user?.email}</p>

          {/* Roles Badge */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {user?.roles?.map((role, index) => (
              <span
                key={index}
                className="text-meta font-extrabold tracking-wider bg-brand-terracotta/15 text-brand-terracotta border border-brand-terracotta/25 py-1 px-3 rounded-lg uppercase"
              >
                {role}
              </span>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-brand-border grid grid-cols-2 gap-4 text-center">
            <div className="space-y-0.5">
              <span className="text-meta text-brand-text-muted uppercase font-bold tracking-wider">Cơ sở</span>
              <p className="text-body font-bold text-brand-blue">
                {campuses.find(c => c.id === selectedCampus)?.name.split(' ').pop() || 'TP. HCM'}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-meta text-brand-text-muted uppercase font-bold tracking-wider">Mã số</span>
              <p className="text-body font-bold text-brand-text">{studentCode || 'Chưa cập nhật'}</p>
            </div>
          </div>

      </div>

      {/* Form Editors */}
      <div className="space-y-6">

        {/* Global Notifications */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-field text-body">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 bg-green-500/5 border border-green-200 text-green-700 p-4 rounded-field text-body">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Academic Profile Form */}
        <div className="meetmind-card p-6 lg:p-8 rounded-card">
            <h2 className="text-lg font-bold text-brand-text font-serif tracking-tight border-b border-brand-border pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-terracotta" /> Thông tin học tập chuyên sâu
            </h2>

            <form onSubmit={handleUpdate} className="space-y-6 mt-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Tên hiển thị</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Mã số sinh viên (MSSV)</label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all font-semibold"
                    placeholder="SE192621"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Cơ sở</label>
                  <select
                    required
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none transition-all cursor-pointer font-semibold"
                  >
                    <option value="">Chọn cơ sở</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Ngành học</label>
                  <select
                    required
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none transition-all cursor-pointer font-semibold"
                  >
                    <option value="">Chọn ngành học</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameVi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Chuyên ngành</label>
                  <select
                    required
                    disabled={!selectedProgram}
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none transition-all cursor-pointer disabled:opacity-50 font-semibold"
                  >
                    <option value="">Chọn chuyên ngành</option>
                    {specializations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameVi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Học kỳ hiện tại</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Năm nhập học</label>
                  <input
                    type="number"
                    required
                    value={intakeYear}
                    onChange={(e) => setIntakeYear(Number(e.target.value))}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAlumni}
                    onChange={(e) => setIsAlumni(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-terracotta"></div>
                  <span className="ml-3 text-body font-bold text-brand-text-muted">Đã tốt nghiệp (Alumni)</span>
                </label>
              </div>

              {isAlumni && (
                <div>
                  <label className="block text-body font-bold text-brand-text-muted mb-1.5">Năm tốt nghiệp</label>
                  <input
                    type="number"
                    required={isAlumni}
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-body font-bold text-brand-text-muted mb-1.5">Bio giới thiệu bản thân & kỹ năng trao đổi</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all resize-none placeholder-brand-grey font-medium"
                  placeholder="Mô tả kỹ năng của bạn..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-bold py-3 px-6 rounded-card cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-brand-terracotta/25"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>

            </form>
        </div>

      </div>

    </div>
  );
};
