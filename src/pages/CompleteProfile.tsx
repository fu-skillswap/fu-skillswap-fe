import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, FileText, GraduationCap, School, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

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

interface FormErrors {
  studentCode?: string;
  displayName?: string;
  campusId?: string;
  programId?: string;
  specializationId?: string;
  semester?: string;
  intakeYear?: string;
  graduationYear?: string;
  bio?: string;
  form?: string;
}

const CURRENT_YEAR = new Date().getFullYear();

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm font-medium text-red-600">{message}</p>;
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-brand-border bg-white/80 p-5 shadow-[0_20px_50px_rgba(39,28,20,0.06)] backdrop-blur-sm">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-brand-text">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-brand-text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export const CompleteProfile: React.FC = () => {
  const { user, refreshUser, isDevBypass } = useAuth();
  const navigate = useNavigate();

  const [studentCode, setStudentCode] = useState('');
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [avatarUrl] = useState(user?.avatarUrl || '');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [semester, setSemester] = useState('1');
  const [intakeYear, setIntakeYear] = useState(String(CURRENT_YEAR - 2));
  const [isAlumni, setIsAlumni] = useState(false);
  const [graduationYear, setGraduationYear] = useState(String(CURRENT_YEAR));
  const [bio, setBio] = useState('');

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

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
    p2: [{ id: 's3', programId: 'p2', code: 'IA_NET', nameVi: 'An ninh mạng', nameEn: 'Network Security' }],
    p3: [{ id: 's4', programId: 'p3', code: 'GD_UIUX', nameVi: 'Thiết kế UI/UX', nameEn: 'UI/UX Design' }],
    p4: [{ id: 's5', programId: 'p4', code: 'BA_MKT', nameVi: 'Marketing kỹ thuật số', nameEn: 'Digital Marketing' }],
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      setFetchingData(true);
      try {
        const [campusRes, programRes] = await Promise.all([
          apiClient.get('/api/campuses'),
          apiClient.get('/api/academic-programs'),
        ]);

        setCampuses(campusRes.data.data?.length ? campusRes.data.data : fallbackCampuses);
        setPrograms(programRes.data.data?.length ? programRes.data.data : fallbackPrograms);
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

  useEffect(() => {
    if (!selectedProgram) {
      setSpecializations([]);
      setSelectedSpecialization('');
      return;
    }

    const fetchSpecializations = async () => {
      try {
        const specRes = await apiClient.get(`/api/academic-programs/${selectedProgram}/specializations`);
        setSpecializations(
          specRes.data.data?.length ? specRes.data.data : (fallbackSpecializations[selectedProgram] || [])
        );
      } catch (err) {
        console.warn(`Failed to fetch specializations for ${selectedProgram}, using mock fallbacks.`, err);
        setSpecializations(fallbackSpecializations[selectedProgram] || []);
      }
    };

    fetchSpecializations();
  }, [selectedProgram]);

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const studentCodeRegex = /^[HSDQC][ESA](0[1-9]|1[0-9]|2[0-2])\d{4}$/i;

    if (!displayName.trim()) {
      nextErrors.displayName = 'Vui lòng nhập tên hiển thị.';
    }

    if (!studentCodeRegex.test(studentCode.trim())) {
      nextErrors.studentCode = 'Mã số sinh viên chưa đúng định dạng FPT. Ví dụ: SE192621, HA221234.';
    }

    if (!selectedCampus) {
      nextErrors.campusId = 'Vui lòng chọn cơ sở học tập.';
    }

    if (!selectedProgram) {
      nextErrors.programId = 'Vui lòng chọn ngành học.';
    }

    if (!selectedSpecialization) {
      nextErrors.specializationId = 'Vui lòng chọn chuyên ngành.';
    }

    const semesterValue = Number(semester);
    if (!semester.trim()) {
      nextErrors.semester = 'Vui lòng nhập học kỳ hiện tại.';
    } else if (!Number.isInteger(semesterValue) || semesterValue < 1 || semesterValue > 12) {
      nextErrors.semester = 'Học kỳ phải là số nguyên từ 1 đến 12.';
    }

    const intakeYearValue = Number(intakeYear);
    if (!intakeYear.trim()) {
      nextErrors.intakeYear = 'Vui lòng nhập năm nhập học.';
    } else if (!Number.isInteger(intakeYearValue) || intakeYearValue < 2000 || intakeYearValue > CURRENT_YEAR + 1) {
      nextErrors.intakeYear = `Năm nhập học phải trong khoảng 2000 - ${CURRENT_YEAR + 1}.`;
    }

    if (isAlumni) {
      const graduationYearValue = Number(graduationYear);
      if (!graduationYear.trim()) {
        nextErrors.graduationYear = 'Vui lòng nhập năm tốt nghiệp.';
      } else if (
        !Number.isInteger(graduationYearValue) ||
        graduationYearValue < intakeYearValue ||
        graduationYearValue > CURRENT_YEAR + 5
      ) {
        nextErrors.graduationYear = `Năm tốt nghiệp phải từ ${intakeYearValue || 2000} đến ${CURRENT_YEAR + 5}.`;
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    const payload = {
      studentCode: studentCode.trim().toUpperCase(),
      displayName: displayName.trim(),
      avatarUrl,
      campusId: selectedCampus,
      programId: selectedProgram,
      specializationId: selectedSpecialization,
      semester: Number(semester),
      intakeYear: Number(intakeYear),
      isAlumni,
      graduationYear: isAlumni ? Number(graduationYear) : null,
      bio: bio.trim(),
    };

    try {
      if (!isDevBypass) {
        await apiClient.put('/api/me/student-profile', payload, {
          withCredentials: true,
        });
      }
      await refreshUser();
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data &&
        'message' in err.response.data
          ? String(err.response.data.message)
          : 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.';

      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-brand-terracotta/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-terracotta animate-spin"></div>
        </div>
        <p className="mt-4 text-brand-text-muted font-bold">Đang tải danh mục học thuật...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(217,119,87,0.13),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(67,114,162,0.10),transparent_30%),linear-gradient(180deg,#fbf7f2_0%,#f6efe8_100%)] px-4 py-10 text-left">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,92,73,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(120,92,73,0.05)_1px,transparent_1px)] bg-[size:34px_34px] opacity-30 pointer-events-none"></div>

      <div className="relative mx-auto w-full max-w-4xl">
        <div className="mb-6 rounded-[32px] border border-white/70 bg-white/72 p-6 shadow-[0_24px_80px_rgba(63,39,23,0.08)] backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-brand-text">Hoàn thiện hồ sơ học thuật</h1>
              <p className="mt-2 text-sm font-medium leading-6 text-brand-text-muted lg:text-base">
                Điền thông tin học tập cốt lõi để hệ thống mở khóa dashboard và gợi ý kết nối phù hợp hơn.
              </p>
            </div>
            <div className="rounded-3xl border border-brand-border/80 bg-brand-bg/70 px-4 py-3 text-sm font-semibold text-brand-text-muted">
              {user?.email || 'Tài khoản FPT'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50/90 p-4 text-body text-red-700 shadow-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="font-medium">{errors.form}</span>
            </div>
          )}

          <SectionCard
            icon={<User className="h-5 w-5" />}
            title="Thông tin cá nhân"
            description="Thông tin này sẽ hiển thị trên hồ sơ và được dùng để đồng bộ với hệ thống."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                  placeholder="Nguyễn Văn A"
                />
                <FieldError message={errors.displayName} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Mã số sinh viên</label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold uppercase tracking-wide text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                  placeholder="SE192621"
                />
                <FieldError message={errors.studentCode} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<School className="h-5 w-5" />}
            title="Thông tin học tập"
            description="Chọn cơ sở, ngành và các mốc học tập chính để hoàn tất hồ sơ sinh viên."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Cơ sở học tập</label>
                <select
                  required
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                >
                  <option value="">Chọn cơ sở</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.campusId} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Ngành học</label>
                <select
                  required
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                >
                  <option value="">Chọn ngành học</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.nameVi}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.programId} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Chuyên ngành</label>
                <select
                  required
                  disabled={!selectedProgram}
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10 disabled:cursor-not-allowed disabled:bg-brand-bg/60 disabled:text-brand-text-muted"
                >
                  <option value="">Chọn chuyên ngành</option>
                  {specializations.map((specialization) => (
                    <option key={specialization.id} value={specialization.id}>
                      {specialization.nameVi}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.specializationId} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Học kỳ hiện tại</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={semester}
                  onChange={(e) => setSemester(normalizeDigits(e.target.value))}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                  placeholder="Ví dụ: 5"
                />
                <FieldError message={errors.semester} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-text">Năm nhập học</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={intakeYear}
                  onChange={(e) => setIntakeYear(normalizeDigits(e.target.value))}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                  placeholder="Ví dụ: 2022"
                />
                <FieldError message={errors.intakeYear} />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-brand-border bg-brand-bg/70 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAlumni}
                  onChange={(e) => setIsAlumni(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-border text-brand-terracotta focus:ring-brand-terracotta"
                />
                <span className="text-sm font-semibold text-brand-text">Tôi là cựu sinh viên đã tốt nghiệp</span>
              </label>

              {isAlumni && (
                <div className="mt-4 max-w-sm">
                  <label className="mb-2 block text-sm font-bold text-brand-text">Năm tốt nghiệp</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required={isAlumni}
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(normalizeDigits(e.target.value))}
                    className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-semibold text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                    placeholder="Ví dụ: 2026"
                  />
                  <FieldError message={errors.graduationYear} />
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon={<FileText className="h-5 w-5" />}
            title="Giới thiệu ngắn"
            description="Thêm vài dòng mô tả để mentor và hệ thống hiểu rõ hơn về định hướng học tập của bạn."
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-brand-text">Bio / Kỹ năng nổi bật</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-brand-border bg-white px-4 py-3 text-body font-medium leading-6 text-brand-text outline-none transition-all focus:border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/10"
                placeholder="Giới thiệu ngắn về bản thân, môn học đã học tốt, kỹ năng muốn chia sẻ hoặc kỹ năng đang tìm kiếm..."
              />
              <FieldError message={errors.bio} />
            </div>
          </SectionCard>

          <div className="sticky bottom-4 rounded-[28px] border border-white/80 bg-white/85 p-4 shadow-[0_20px_60px_rgba(53,35,24,0.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium leading-6 text-brand-text-muted">
                Thông tin này giúp SkillSwap đề xuất mentor phù hợp hơn cho bạn.
              </p>
              <button
                type="submit"
                disabled={loading || fetchingData}
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-brand-terracotta px-6 py-3.5 text-body font-bold text-white shadow-lg shadow-brand-terracotta/25 transition-all hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 rounded-full border-2 border-white/35 border-t-white animate-spin"></span>
                    <span>Đang lưu hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5" />
                    <span>Hoàn tất và vào Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
