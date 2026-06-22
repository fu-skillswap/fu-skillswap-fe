import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentProfileApi } from '../api/studentProfile';
import { mentorProfileApi } from '../api/mentorProfile';
import { catalogApi } from '../api/catalog';
import type { Campus, AcademicProgram, Specialization, MentorProfileResponse, SessionDuration } from '../api/types';
import {
  Check, AlertCircle, User, Camera, Loader2,
  Hash, GraduationCap, MapPin, Building2, BookOpen, CalendarDays, Clock, Award,
  Pencil, ShieldCheck, X, Power,
} from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';
import { MentorPanel } from './mentor/MentorPanel';

// ---------- building blocks (view mode) ----------
const MetaItem: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 text-meta font-semibold text-fg-muted">
    <span className="text-fg-faint">{icon}</span>{children}
  </span>
);

const FactRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-field bg-primary-soft text-primary flex items-center justify-center shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-meta font-bold uppercase tracking-wide text-fg-faint">{label}</p>
      <p className="text-body font-bold text-fg leading-snug mt-0.5">{value}</p>
    </div>
  </div>
);

export const Profile: React.FC = () => {
  const { user, refreshUser, isDevBypass } = useAuth();

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [viewTab, setViewTab] = useState<'academic' | 'mentor'>('academic');

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

  // Badge "Mentor đã xác thực" trên hero — phần còn lại của lifecycle mentor (đăng ký,
  // soạn hồ sơ, nộp duyệt, chờ phê duyệt, đã duyệt) nằm trọn trong <MentorPanel /> ở tab riêng.
  const isMentor = !!user?.roles?.includes('MENTOR');

  // UI States
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hồ sơ mentor + bật/tắt nhận booking (chỉ cho mentor đã có hồ sơ)
  const [mentorProfile, setMentorProfile] = useState<MentorProfileResponse | null>(null);
  const [availOpen, setAvailOpen] = useState(false);      // modal xác nhận
  const [availTarget, setAvailTarget] = useState(false);  // trạng thái muốn đặt
  const [availConfirmText, setAvailConfirmText] = useState('');
  const [availBusy, setAvailBusy] = useState(false);
  const isAvailable = mentorProfile?.isAvailable ?? false;

  // Tải hồ sơ mentor để biết trạng thái nhận booking
  useEffect(() => {
    if (!isMentor || isDevBypass) return;
    let active = true;
    mentorProfileApi.get().then((p) => { if (active) setMentorProfile(p); }).catch(() => {});
    return () => { active = false; };
  }, [isMentor, isDevBypass]);

  const openAvailModal = () => {
    if (!mentorProfile) return;
    setAvailTarget(!isAvailable);
    setAvailConfirmText('');
    setError(null);
    setAvailOpen(true);
  };

  const confirmToggleAvailability = async () => {
    if (!mentorProfile || availConfirmText.trim().toLowerCase() !== 'confirm') return;
    setAvailBusy(true);
    try {
      const updated = await mentorProfileApi.update({
        headline: mentorProfile.headline || '',
        expertiseDescription: mentorProfile.expertiseDescription || '',
        supportingSubjects: mentorProfile.supportingSubjects || undefined,
        isAvailable: availTarget,
        helpTopicIds: (mentorProfile.helpTopics || []).map((t) => t.id),
        teachingMode: mentorProfile.teachingMode || 'ONLINE',
        sessionDuration: (mentorProfile.sessionDuration || 60) as SessionDuration,
        phoneNumber: mentorProfile.phoneNumber || '',
        linkedinUrl: mentorProfile.linkedinUrl || undefined,
        githubUrl: mentorProfile.githubUrl || undefined,
        portfolioUrl: mentorProfile.portfolioUrl || undefined,
      });
      setMentorProfile(updated);
      setAvailOpen(false);
      setSuccess(availTarget ? 'Đã bật nhận booking.' : 'Đã tắt nhận booking.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật trạng thái nhận booking thất bại.');
    } finally {
      setAvailBusy(false);
    }
  };

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
  const fallbackCampuses: Campus[] = [
    { id: 'c1', code: 'HCM', name: 'FPT University TP. Hồ Chí Minh' },
    { id: 'c2', code: 'HA_NOI', name: 'FPT University Hà Nội' },
  ];
  const fallbackPrograms: AcademicProgram[] = [
    { id: 'p1', code: 'SE', nameVi: 'Kỹ thuật phần mềm', nameEn: 'Software Engineering' },
  ];
  const fallbackSpecializations: Specialization[] = [
    { id: 's1', programId: 'p1', code: 'SE_JS', nameVi: 'Lập trình Fullstack', nameEn: 'Fullstack Development' },
    { id: 's2', programId: 'p1', code: 'SE_AI', nameVi: 'Trí tuệ nhân tạo', nameEn: 'Artificial Intelligence' },
    { id: 's3', programId: 'p1', code: 'SE_IS', nameVi: 'An toàn thông tin', nameEn: 'Information Security' },
  ];

  // Load profile data (học thuật + mentor nếu có)
  useEffect(() => {
    const loadProfileData = async () => {
      setFetching(true);
      setError(null);

      try {
        const campusList = await catalogApi.getCampuses();
        setCampuses(campusList?.length ? campusList : fallbackCampuses);

        const programList = await catalogApi.getPrograms();
        setPrograms(programList?.length ? programList : fallbackPrograms);

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

        // Fetch học thuật
        try {
          const data = await studentProfileApi.get();
          if (data) {
            // BE trả campus/program/specialization là object lồng (StudentProfileResponse).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDevBypass, isMentor]);

  // Load specializations when program changes
  useEffect(() => {
    if (!selectedProgram) {
      setSpecializations([]);
      return;
    }

    const fetchSpecializations = async () => {
      try {
        const specList = await catalogApi.getSpecializationsByProgram(selectedProgram);
        setSpecializations(specList?.length ? specList : fallbackSpecializations);
      } catch (err) {
        console.warn('Failed to load specializations, using mock.', err);
        setSpecializations(fallbackSpecializations);
      }
    };

    fetchSpecializations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        await studentProfileApi.upsert(payload);
      }
      await refreshUser();
      setSuccess('Cập nhật hồ sơ học thuật thành công!');
      setMode('view');
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

  // ---------- view-model cho phần hiển thị ----------
  const campusName = campuses.find((c) => c.id === selectedCampus)?.name || 'Chưa cập nhật';
  const programName = programs.find((p) => p.id === selectedProgram)?.nameVi || 'Chưa cập nhật';
  const specializationName = specializations.find((s) => s.id === selectedSpecialization)?.nameVi || 'Chưa cập nhật';

  // 2 tab cố định: Hồ sơ cá nhân & Hồ sơ Mentor. Tab Mentor tự thân quyết định hiển thị gì
  // (nút đăng ký, form soạn hồ sơ, hay trạng thái chờ/đã duyệt) bên trong <MentorPanel />.
  const SEG: { id: 'academic' | 'mentor'; label: string; icon: React.ReactNode }[] = [
    { id: 'academic', label: 'Hồ sơ cá nhân', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'mentor', label: 'Hồ sơ Mentor', icon: <Award className="w-4 h-4" /> },
  ];

  // ===========================================================================
  // EDIT MODE — giữ nguyên form chỉnh sửa hồ sơ học thuật hiện có
  // ===========================================================================
  if (mode === 'edit') {
    return (
      <div className="space-y-6 text-left">
        <button
          onClick={() => setMode('view')}
          className="text-meta font-bold text-brand-text-muted hover:text-brand-terracotta cursor-pointer"
        >
          ← Quay lại hồ sơ
        </button>

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
                {campuses.find((c) => c.id === selectedCampus)?.name.split(' ').pop() || 'TP. HCM'}
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
  }

  // ===========================================================================
  // VIEW MODE — hero + segmented Học thuật / Hồ sơ Mentor
  // ===========================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-7 text-left">

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

      {/* ============ HERO ============ */}
      <div className="meetmind-card rounded-card overflow-hidden">
        <div className="h-24 relative" style={{ background: 'linear-gradient(110deg, var(--primary-hover) 0%, var(--primary) 48%, var(--accent) 130%)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 1px, transparent 1.4px)', backgroundSize: '15px 15px' }} />
        </div>

        <div className="px-7 pb-6">
          <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap -mt-8">
            <div className="relative overflow-hidden rounded-card ring-4 ring-surface bg-surface shrink-0" style={{ width: 96, height: 96 }}>
              <img src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'} alt="" className="w-full h-full object-cover object-top rounded-card bg-surface-muted" />
            </div>
            <div className="shrink-0 mb-1 flex flex-col items-stretch gap-2">
              <button onClick={() => setMode('edit')} className="inline-flex items-center justify-center gap-2 bg-surface border border-line text-fg hover:bg-surface-muted text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all">
                <Pencil className="w-4 h-4" /> Chỉnh sửa
              </button>
              {/* Nút TO bật/tắt nhận booking — chỉ cho mentor đã có hồ sơ */}
              {isMentor && mentorProfile && (
                <button
                  onClick={openAvailModal}
                  className={`inline-flex items-center justify-between gap-3 py-2.5 px-4 rounded-field border font-bold text-body cursor-pointer transition-all ${isAvailable ? 'bg-success/10 border-success/30 text-success hover:bg-success/15' : 'bg-surface-muted border-line text-fg-muted hover:bg-line/30'}`}
                >
                  <span className="inline-flex items-center gap-2"><Power className="w-4 h-4" /> {isAvailable ? 'Đang nhận booking' : 'Tạm ngưng booking'}</span>
                  <span className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${isAvailable ? 'bg-success' : 'bg-line'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow transition-transform ${isAvailable ? 'translate-x-4' : ''}`} />
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-display font-extrabold text-fg tracking-tight leading-none">{displayName || user?.fullName}</h1>
              {isMentor
                ? <span className="inline-flex items-center gap-1 text-meta font-extrabold py-0.5 px-2 rounded-lg border bg-success/10 text-success border-success/20"><ShieldCheck className="w-3.5 h-3.5" /> Mentor đã xác thực</span>
                : <span className="inline-flex items-center gap-1 text-meta font-extrabold py-0.5 px-2 rounded-lg border bg-surface-muted text-fg-muted border-line"><User className="w-3.5 h-3.5" /> Mentee</span>}
            </div>
            <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap mt-2.5">
              <MetaItem icon={<Hash className="w-3.5 h-3.5" />}>{studentCode || 'Chưa cập nhật'}</MetaItem>
              <MetaItem icon={<GraduationCap className="w-3.5 h-3.5" />}>{programName}</MetaItem>
              <MetaItem icon={<MapPin className="w-3.5 h-3.5" />}>{campusName}</MetaItem>
            </div>
          </div>

        </div>
      </div>

      {/* ============ SEGMENTED SWITCH ============ */}
      <div className="flex p-1 bg-surface-muted rounded-pill w-full sm:w-fit gap-1">
        {SEG.map((s) => (
          <button key={s.id} onClick={() => setViewTab(s.id)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-pill text-body font-bold transition-all cursor-pointer ${viewTab === s.id ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}>
            <span className={viewTab === s.id ? 'text-primary' : ''}>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {/* ============ ACADEMIC ============ */}
      {viewTab === 'academic' && (
        <div className="space-y-7">
          <div className="meetmind-card p-7 rounded-card">
            <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5 mb-4"><GraduationCap className="w-5 h-5 text-primary" /> Thông tin học thuật</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-6">
              <FactRow icon={<Hash className="w-4 h-4" />} label="Mã sinh viên" value={studentCode || 'Chưa cập nhật'} />
              <FactRow icon={<Building2 className="w-4 h-4" />} label="Cơ sở" value={campusName} />
              <FactRow icon={<GraduationCap className="w-4 h-4" />} label="Ngành học" value={programName} />
              <FactRow icon={<BookOpen className="w-4 h-4" />} label="Chuyên ngành" value={specializationName} />
              <FactRow icon={<CalendarDays className="w-4 h-4" />} label="Học kỳ hiện tại" value={`Kỳ ${semester}`} />
              <FactRow icon={<Clock className="w-4 h-4" />} label="Năm nhập học" value={intakeYear} />
              <FactRow icon={<Award className="w-4 h-4" />} label="Cựu sinh viên" value={isAlumni ? 'Có' : 'Không'} />
            </div>
          </div>

          <div className="meetmind-card p-7 rounded-card">
            <h3 className="text-title font-bold font-serif text-fg flex items-center gap-2 border-b border-line-soft pb-2.5 mb-4"><User className="w-5 h-5 text-primary" /> Giới thiệu</h3>
            <p className="text-body text-fg-muted font-medium leading-relaxed" style={{ textWrap: 'pretty' }}>{bio || 'Chưa có giới thiệu.'}</p>
          </div>
        </div>
      )}

      {/* ============ MENTOR ============ */}
      {/* Toàn bộ lifecycle (đăng ký → soạn hồ sơ + minh chứng → nộp duyệt → chờ duyệt →
          đã duyệt/từ chối) do BE quyết định qua status/checklist/allowedActions thật,
          MentorPanel chỉ render đúng theo đó — không tự suy luận ở FE. */}
      {viewTab === 'mentor' && <MentorPanel />}

      {/* ===== Modal xác nhận bật/tắt nhận booking (gõ "confirm" như xoá repo GitHub) ===== */}
      {availOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setAvailOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-muted hover:opacity-80 text-fg-muted cursor-pointer transition-all"><X className="w-4 h-4" /></button>
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-card flex items-center justify-center shrink-0 ${availTarget ? 'bg-success/10 text-success' : 'bg-amber-500/12 text-amber-600'}`}><Power className="w-5 h-5" /></div>
              <div>
                <h3 className="text-title font-bold text-fg">{availTarget ? 'Bật nhận booking?' : 'Tạm ngưng nhận booking?'}</h3>
                <p className="text-meta text-fg-muted font-medium mt-1" style={{ textWrap: 'pretty' }}>
                  {availTarget
                    ? 'Hồ sơ của bạn sẽ hiển thị công khai và mentee có thể đặt lịch hẹn mới.'
                    : 'Hồ sơ sẽ tạm ẩn khỏi tìm kiếm và bạn sẽ không nhận lịch hẹn mới (các lịch đã nhận không bị ảnh hưởng).'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-meta font-bold text-fg-muted mb-1.5">Gõ <span className="font-extrabold text-fg">confirm</span> để xác nhận</label>
              <input
                type="text"
                value={availConfirmText}
                onChange={(e) => setAvailConfirmText(e.target.value)}
                placeholder="confirm"
                className="w-full bg-surface border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 font-semibold"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={() => setAvailOpen(false)} className="py-2.5 px-4 rounded-field border border-line text-fg text-body font-bold hover:bg-surface-muted cursor-pointer transition-all">Huỷ</button>
              <button
                onClick={confirmToggleAvailability}
                disabled={availBusy || availConfirmText.trim().toLowerCase() !== 'confirm'}
                className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-field text-on-action text-body font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${availTarget ? 'bg-success hover:opacity-90' : 'bg-amber-600 hover:opacity-90'}`}
              >
                {availBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {availTarget ? 'Bật nhận booking' : 'Tạm ngưng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
