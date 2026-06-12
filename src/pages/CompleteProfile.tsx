import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { User, GraduationCap, School, Check, AlertCircle, FileText } from 'lucide-react';

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

export const CompleteProfile: React.FC = () => {
  const { user, refreshUser, isDevBypass } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [studentCode, setStudentCode] = useState('');
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [avatarUrl] = useState(user?.avatarUrl || '');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [semester, setSemester] = useState(1);
  const [intakeYear, setIntakeYear] = useState(new Date().getFullYear() - 2);
  const [isAlumni, setIsAlumni] = useState(false);
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [bio, setBio] = useState('');

  // Dropdown lists
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback demo data if APIs fail or empty
  const fallbackCampuses: Campus[] = [
    { id: 'c1', code: 'HCM', name: 'FPT University TP. Hồ Chí Minh', city: 'TP. HCM' },
    { id: 'c2', code: 'HA_NOI', name: 'FPT University Hà Nội', city: 'Hà Nội' },
    { id: 'c3', code: 'DA_NANG', name: 'FPT University Đà Nẵng', city: 'Đà Nẵng' },
    { id: 'c4', code: 'CAN_THO', name: 'FPT University Cần Thơ', city: 'Cần Thơ' },
  ];

  const fallbackPrograms: AcademicProgram[] = [
    { id: 'p1', code: 'SE', nameVi: 'Kỹ thuật phần mềm', nameEn: 'Software Engineering' },
    { id: 'p2', code: 'IA', nameVi: 'An toàn thông tin', nameEn: 'Information Assurance' },
    { id: 'p3', code: 'GD', nameVi: 'Thiết kế mỹ thuật số', nameEn: 'Digital Art & Design' },
    { id: 'p4', code: 'BA', nameVi: 'Quản trị kinh doanh', nameEn: 'Business Administration' },
  ];

  const fallbackSpecializations: Record<string, Specialization[]> = {
    p1: [
      { id: 's1', programId: 'p1', code: 'SE_JS', nameVi: 'Lập trình Fullstack', nameEn: 'Fullstack Development' },
      { id: 's2', programId: 'p1', code: 'SE_AI', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence' },
    ],
    p2: [
      { id: 's3', programId: 'p2', code: 'IA_NET', nameVi: 'An ninh mạng', nameEn: 'Network Security' },
    ],
    p3: [
      { id: 's4', programId: 'p3', code: 'GD_UIUX', nameVi: 'Thiết kế UI/UX', nameEn: 'UI/UX Design' },
    ],
    p4: [
      { id: 's5', programId: 'p4', code: 'BA_MKT', nameVi: 'Marketing kỹ thuật số', nameEn: 'Digital Marketing' },
    ],
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      setFetchingData(true);
      try {
        const campusRes = await apiClient.get('/api/campuses');
        setCampuses(campusRes.data.data && campusRes.data.data.length ? campusRes.data.data : fallbackCampuses);

        const programRes = await apiClient.get('/api/academic-programs');
        setPrograms(programRes.data.data && programRes.data.data.length ? programRes.data.data : fallbackPrograms);
      } catch (err) {
        console.warn('API fetching failed, using fallback static data.', err);
        setCampuses(fallbackCampuses);
        setPrograms(fallbackPrograms);
      } finally {
        setFetchingData(false);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch specializations when program changes
  useEffect(() => {
    if (!selectedProgram) {
      setSpecializations([]);
      setSelectedSpecialization('');
      return;
    }

    const fetchSpecializations = async () => {
      try {
        const specRes = await apiClient.get(`/api/academic-programs/${selectedProgram}/specializations`);
        setSpecializations(specRes.data.data && specRes.data.data.length ? specRes.data.data : (fallbackSpecializations[selectedProgram] || []));
      } catch (err) {
        console.warn(`Failed to fetch specializations for ${selectedProgram}, using mock fallbacks.`, err);
        setSpecializations(fallbackSpecializations[selectedProgram] || []);
      }
    };

    fetchSpecializations();
  }, [selectedProgram]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Student Code
    const studentCodeRegex = /^[HSDQC][ESA](0[1-9]|1[0-9]|2[0-2])\d{4}$/i;
    if (!studentCodeRegex.test(studentCode)) {
      setError('Mã số sinh viên không đúng định dạng FPT. Ví dụ: SE192621, HA221234');
      return;
    }

    if (!selectedCampus || !selectedProgram || !selectedSpecialization) {
      setError('Vui lòng chọn đầy đủ Cơ sở, Ngành học và Chuyên ngành.');
      return;
    }

    setLoading(true);

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
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-brand-terracotta/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-brand-terracotta rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-brand-text-muted font-bold">Đang tải danh mục học thuật...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brand-bg flex items-center justify-center py-12 px-4 overflow-hidden text-left">
      
      {/* Background Neon Glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full bg-brand-terracotta/4 blur-[130px] pointer-events-none"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-brand-blue/3 blur-[130px] pointer-events-none"></div>

      <div className="relative w-full max-w-2xl bg-white/85 border border-brand-border backdrop-blur-xl rounded-3xl p-8 lg:p-10 z-10 shadow-xl shadow-brand-text/5">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-terracotta flex items-center justify-center shadow-lg shadow-brand-terracotta/20 mb-3">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-brand-text">Hoàn thiện hồ sơ học thuật</h2>
          <p className="text-brand-text-muted text-xs font-semibold mt-1">
            Vui lòng điền thông tin chi tiết để hệ thống đề xuất trao đổi kỹ năng phù hợp
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-2xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-wider text-brand-terracotta uppercase flex items-center gap-2 border-b border-brand-border pb-2">
              <User className="w-4 h-4" /> 1. Thông tin cá nhân
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-4 text-xs text-brand-text focus:outline-none transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Mã số sinh viên (MSSV)</label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-4 text-xs text-brand-text focus:outline-none transition-all placeholder-brand-grey font-bold"
                  placeholder="Ví dụ: SE192621"
                />
              </div>
            </div>
          </div>

          {/* Section: Academic Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-extrabold tracking-wider text-brand-terracotta uppercase flex items-center gap-2 border-b border-brand-border pb-2">
              <School className="w-4 h-4" /> 2. Cơ sở & Ngành học FPT
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Cơ sở học tập</label>
                <select
                  required
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-3 text-xs text-brand-text focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  <option value="">-- Chọn cơ sở --</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Ngành học (Major)</label>
                <select
                  required
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-3 text-xs text-brand-text focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  <option value="">-- Chọn ngành học --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameVi} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Chuyên ngành</label>
                <select
                  required
                  disabled={!selectedProgram}
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-3 text-xs text-brand-text focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold"
                >
                  <option value="">-- Chọn chuyên ngành --</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameVi} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Học kỳ hiện tại</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={12}
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-4 text-xs text-brand-text focus:outline-none transition-all"
                  placeholder="Ví dụ: 5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Năm nhập học</label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={2030}
                  value={intakeYear}
                  onChange={(e) => setIntakeYear(Number(e.target.value))}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-4 text-xs text-brand-text focus:outline-none transition-all"
                  placeholder="Ví dụ: 2022"
                />
              </div>
            </div>

            {/* Alumni toggle */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlumni}
                  onChange={(e) => setIsAlumni(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-terracotta"></div>
                <span className="ml-3 text-xs font-bold text-brand-text-muted">Tôi là Cựu sinh viên (Alumni) đã tốt nghiệp</span>
              </label>
            </div>

            {isAlumni && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Năm tốt nghiệp</label>
                <input
                  type="number"
                  required={isAlumni}
                  min={2000}
                  max={2030}
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-4 text-xs text-brand-text focus:outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Section: Biography */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-extrabold tracking-wider text-brand-terracotta uppercase flex items-center gap-2 border-b border-brand-border pb-2">
              <FileText className="w-4 h-4" /> 3. Giới thiệu bản thân
            </h3>
            <div>
              <label className="block text-xs font-bold text-brand-text-muted mb-1.5">Bio / Kỹ năng nổi bật</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-white border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-xl py-2.5 px-4 text-xs text-brand-text focus:outline-none transition-all resize-none placeholder-brand-grey font-medium"
                placeholder="Giới thiệu bản thân, kỹ năng bạn muốn chia sẻ (Ví dụ: React, Java) hoặc kỹ năng bạn đang tìm kiếm (Ví dụ: Python, UI/UX design)..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-bold py-3 px-6 rounded-2xl cursor-pointer shadow-lg shadow-brand-terracotta/20 active:scale-[0.99] transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5" />
                  <span>Hoàn tất & Tiếp tục</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
