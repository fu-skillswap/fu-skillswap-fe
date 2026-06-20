import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getPostLoginRedirect } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { User, School, Check, AlertCircle, FileText, Sparkles, Hash, CalendarDays } from 'lucide-react';
import { onAvatarError } from '../lib/img';

// input/select dùng chung 1 style để đồng nhất
const fieldCls =
  'w-full bg-brand-bg/40 border border-brand-border focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 rounded-field py-2.5 px-3.5 text-body text-brand-text focus:outline-none transition-all font-semibold placeholder-brand-grey';

const SectionTitle: React.FC<{ n: number; icon: React.ReactNode; title: string; hint?: string }> = ({ n, icon, title, hint }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="w-8 h-8 shrink-0 rounded-field bg-brand-terracotta text-white flex items-center justify-center font-extrabold text-body shadow-sm shadow-brand-terracotta/25">{n}</span>
    <div className="flex-1">
      <h3 className="text-body font-extrabold text-brand-text flex items-center gap-1.5">{icon}{title}</h3>
      {hint && <p className="text-meta text-brand-text-muted font-medium">{hint}</p>}
    </div>
  </div>
);

// Báo lỗi thuần Việt — box callout nổi (ô vuông đỏ dấu !, đuôi chỉ lên) ngay dưới ô nhập sai.
const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <div className="relative inline-flex items-center gap-2.5 mt-2.5 max-w-full bg-surface border border-red-200 rounded-xl py-2 px-3 shadow-lg">
      <span className="absolute -top-1.5 left-5 w-3 h-3 bg-surface border-l border-t border-red-200 rotate-45" />
      <span className="w-5 h-5 rounded-[5px] bg-red-600 text-white flex items-center justify-center shrink-0 text-sm font-black leading-none">!</span>
      <span className="text-meta font-semibold text-brand-text leading-snug">{msg}</span>
    </div>
  ) : null;

// Viền đỏ khi ô có lỗi.
const errCls = (has?: string) => (has ? ' !border-red-400 focus:!border-red-400 focus:!ring-red-200' : '');

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const currentYear = new Date().getFullYear();
  const clearErr = (k: string) => setFieldErrors((prev) => (prev[k] ? { ...prev, [k]: '' } : prev));

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

    // ----- Validate, báo lỗi thuần Việt ngay tại từng ô -----
    const errs: Record<string, string> = {};
    const studentCodeRegex = /^[HSDQC][ESA](0[1-9]|1[0-9]|2[0-2])\d{4}$/i;

    if (!displayName.trim()) errs.displayName = 'Vui lòng nhập tên hiển thị.';
    if (!studentCode.trim()) errs.studentCode = 'Vui lòng nhập mã số sinh viên.';
    else if (!studentCodeRegex.test(studentCode)) errs.studentCode = 'MSSV không đúng định dạng FPT (VD: SE192621, HA221234).';

    if (!selectedCampus) errs.campus = 'Vui lòng chọn cơ sở.';
    if (!selectedProgram) errs.program = 'Vui lòng chọn ngành học.';
    if (!selectedSpecialization) errs.specialization = 'Vui lòng chọn chuyên ngành.';

    // Cựu sinh viên thì bỏ qua học kỳ hiện tại.
    if (!isAlumni) {
      if (!semester || semester < 1 || semester > 9) errs.semester = 'Học kỳ hiện tại phải từ 1 đến 9.';
    }

    if (!intakeYear || intakeYear < 2000) errs.intakeYear = 'Năm nhập học không hợp lệ.';
    else if (intakeYear > currentYear) errs.intakeYear = 'Năm nhập học phải bé hơn hoặc bằng năm hiện tại.';

    if (isAlumni) {
      if (!graduationYear || graduationYear < 2000) errs.graduationYear = 'Năm tốt nghiệp không hợp lệ.';
      else if (graduationYear <= intakeYear) errs.graduationYear = 'Năm tốt nghiệp phải lớn hơn năm nhập học.';
    }

    if (!bio.trim()) errs.bio = 'Vui lòng nhập phần giới thiệu bản thân.';

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    const payload = {
      studentCode: studentCode.toUpperCase(),
      displayName,
      avatarUrl,
      campusId: selectedCampus,
      programId: selectedProgram,
      specializationId: selectedSpecialization,
      // Cựu sinh viên không còn học kỳ hiện tại — gửi giá trị an toàn cho BE (bắt buộc).
      semester: isAlumni ? (semester || 9) : Number(semester),
      intakeYear: Number(intakeYear),
      isAlumni,
      graduationYear: isAlumni ? Number(graduationYear) : null,
      bio,
    };

    try {
      if (!isDevBypass) {
        await apiClient.put('/api/me/student-profile', payload);
      }
      const updatedUser = await refreshUser();
      navigate(updatedUser ? getPostLoginRedirect(updatedUser) : '/dashboard');
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
    <div className="relative min-h-screen bg-brand-bg flex items-center justify-center py-10 px-4 overflow-hidden text-left">

      {/* Background Neon Glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full bg-brand-terracotta/5 blur-[130px] pointer-events-none"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-brand-blue/4 blur-[130px] pointer-events-none"></div>

      <div className="relative w-full max-w-3xl bg-surface border border-brand-border backdrop-blur-xl rounded-card z-10 shadow-2xl shadow-brand-text/10 overflow-hidden">

        {/* ===== Header banner ===== */}
        <div className="relative h-28" style={{ background: 'linear-gradient(110deg, var(--brand-terracotta, #c1654f) 0%, #c97b63 45%, var(--brand-blue, #3b6ea5) 130%)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 1px, transparent 1.4px)', backgroundSize: '14px 14px' }} />
          <span className="absolute top-4 right-5 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white text-meta font-bold py-1 px-3 rounded-full border border-white/25">
            <Sparkles className="w-3.5 h-3.5" /> Bước cuối để bắt đầu
          </span>
        </div>

        <div className="px-6 sm:px-9 pb-9">
          {/* Avatar overlapping banner */}
          <div className="-mt-11 mb-4">
            <div className="relative w-[84px] h-[84px] rounded-card ring-4 ring-surface bg-surface-muted overflow-hidden shadow-lg">
              <img
                src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                onError={onAvatarError}
                alt={displayName || user?.fullName || ''}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Greeting — đặt dưới banner để không bị đè/cắt chữ */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold font-serif text-brand-text tracking-tight leading-tight">
              Hoàn thiện hồ sơ học thuật
            </h2>
            <p className="text-brand-text-muted text-body font-semibold mt-1">
              Xin chào{user?.fullName ? `, ${user.fullName}` : ''} — điền thông tin để nhận gợi ý trao đổi phù hợp.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-card text-body font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ===== Section 1: Personal ===== */}
            <section className="bg-brand-bg/30 border border-brand-border rounded-card p-5">
              <SectionTitle n={1} icon={<User className="w-4 h-4 text-brand-terracotta" />} title="Thông tin cá nhân" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Tên hiển thị</label>
                  <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); clearErr('displayName'); }} className={fieldCls + errCls(fieldErrors.displayName)} placeholder="Nguyễn Văn A" />
                  <FieldError msg={fieldErrors.displayName} />
                </div>
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Mã số sinh viên</label>
                  <input type="text" value={studentCode} onChange={(e) => { setStudentCode(e.target.value); clearErr('studentCode'); }} className={`${fieldCls} font-bold tracking-wide` + errCls(fieldErrors.studentCode)} placeholder="Ví dụ: SE192621" />
                  <FieldError msg={fieldErrors.studentCode} />
                </div>
              </div>
            </section>

            {/* ===== Section 2: Academic ===== */}
            <section className="bg-brand-bg/30 border border-brand-border rounded-card p-5">
              <SectionTitle n={2} icon={<School className="w-4 h-4 text-brand-terracotta" />} title="Cơ sở & Ngành học FPT" hint="Chọn ngành trước để mở danh sách chuyên ngành." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Cơ sở học tập</label>
                  <select value={selectedCampus} onChange={(e) => { setSelectedCampus(e.target.value); clearErr('campus'); }} className={`${fieldCls} cursor-pointer` + errCls(fieldErrors.campus)}>
                    <option value="">-- Chọn cơ sở --</option>
                    {campuses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <FieldError msg={fieldErrors.campus} />
                </div>
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Ngành học (Major)</label>
                  <select value={selectedProgram} onChange={(e) => { setSelectedProgram(e.target.value); clearErr('program'); }} className={`${fieldCls} cursor-pointer` + errCls(fieldErrors.program)}>
                    <option value="">-- Chọn ngành học --</option>
                    {programs.map((p) => (<option key={p.id} value={p.id}>{p.nameVi}</option>))}
                  </select>
                  <FieldError msg={fieldErrors.program} />
                </div>
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Chuyên ngành</label>
                  <select disabled={!selectedProgram} value={selectedSpecialization} onChange={(e) => { setSelectedSpecialization(e.target.value); clearErr('specialization'); }} className={`${fieldCls} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed` + errCls(fieldErrors.specialization)}>
                    <option value="">-- Chọn chuyên ngành --</option>
                    {specializations.map((s) => (<option key={s.id} value={s.id}>{s.nameVi}</option>))}
                  </select>
                  <FieldError msg={fieldErrors.specialization} />
                </div>
              </div>

              {/* Chọn đối tượng: 2 ô loại trừ nhau — chọn 1 ô sẽ bỏ chọn ô kia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { alumni: false, label: 'Tôi là sinh viên', desc: 'Đang theo học tại FPT' },
                  { alumni: true, label: 'Tôi là cựu sinh viên', desc: 'Đã tốt nghiệp (Alumni)' },
                ].map((opt) => {
                  const sel = isAlumni === opt.alumni;
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => { setIsAlumni(opt.alumni); clearErr('semester'); clearErr('graduationYear'); }}
                      className={`flex items-start gap-3 p-3.5 rounded-field border text-left transition-all cursor-pointer ${sel ? 'border-brand-terracotta bg-brand-terracotta/5 ring-1 ring-brand-terracotta/30' : 'border-brand-border bg-brand-bg/30 hover:border-brand-terracotta/40'}`}
                    >
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${sel ? 'bg-brand-terracotta border-brand-terracotta text-white' : 'border-brand-border'}`}>{sel && <Check className="w-3.5 h-3.5" />}</span>
                      <span className="min-w-0">
                        <span className="block text-body font-bold text-brand-text">{opt.label}</span>
                        <span className="block text-meta text-brand-text-muted font-medium">{opt.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sinh viên: Học kỳ + Năm nhập học · Cựu sinh viên: Năm nhập học + Năm tốt nghiệp */}
              {!isAlumni ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Học kỳ hiện tại</label>
                    <input type="number" value={semester} onChange={(e) => { setSemester(Number(e.target.value)); clearErr('semester'); }} className={fieldCls + errCls(fieldErrors.semester)} placeholder="Ví dụ: 5 (1–9)" />
                    <FieldError msg={fieldErrors.semester} />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Năm nhập học</label>
                    <input type="number" value={intakeYear} onChange={(e) => { setIntakeYear(Number(e.target.value)); clearErr('intakeYear'); }} className={fieldCls + errCls(fieldErrors.intakeYear)} placeholder="Ví dụ: 2022" />
                    <FieldError msg={fieldErrors.intakeYear} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Năm nhập học</label>
                    <input type="number" value={intakeYear} onChange={(e) => { setIntakeYear(Number(e.target.value)); clearErr('intakeYear'); }} className={fieldCls + errCls(fieldErrors.intakeYear)} placeholder="Ví dụ: 2018" />
                    <FieldError msg={fieldErrors.intakeYear} />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Năm tốt nghiệp</label>
                    <input type="number" value={graduationYear} onChange={(e) => { setGraduationYear(Number(e.target.value)); clearErr('graduationYear'); }} className={fieldCls + errCls(fieldErrors.graduationYear)} placeholder="Ví dụ: 2022" />
                    <FieldError msg={fieldErrors.graduationYear} />
                  </div>
                </div>
              )}
            </section>

            {/* ===== Section 3: Bio ===== */}
            <section className="bg-brand-bg/30 border border-brand-border rounded-card p-5">
              <SectionTitle n={3} icon={<FileText className="w-4 h-4 text-brand-terracotta" />} title="Giới thiệu bản thân" hint="Bắt buộc — giúp hệ thống gợi ý trao đổi phù hợp." />
              <textarea
                value={bio}
                onChange={(e) => { setBio(e.target.value); clearErr('bio'); }}
                rows={3}
                className={`${fieldCls} resize-none font-medium` + errCls(fieldErrors.bio)}
                placeholder="Giới thiệu bản thân, kỹ năng bạn muốn chia sẻ (Ví dụ: React, Java) hoặc kỹ năng bạn đang tìm kiếm (Ví dụ: Python, UI/UX design)..."
              />
              <FieldError msg={fieldErrors.bio} />
            </section>

            {/* ===== Submit ===== */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-bold py-3.5 px-6 rounded-card cursor-pointer shadow-lg shadow-brand-terracotta/25 active:scale-[0.99] transition-all disabled:opacity-60"
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

          </form>
        </div>
      </div>
    </div>
  );
};
