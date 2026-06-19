import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Check, AlertCircle, User, Award, UploadCloud, FileText, ChevronRight, Clock, X, Camera, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
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

interface MentorRequestState {
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  specialization?: string;
  documentName?: string;
  submittedAt?: string;
  rejectionReason?: string;
}

export const Profile: React.FC = () => {
  const { user, refreshUser, isDevBypass } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'ACADEMIC' | 'BECOME_MENTOR'>('ACADEMIC');

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

  // Become a Mentor states
  const [mentorSpecialization, setMentorSpecialization] = useState('');
  const [mentorNote, setMentorNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [mentorRequest, setMentorRequest] = useState<MentorRequestState>({ status: 'NOT_SUBMITTED' });

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

      // Load mentor request status from localStorage
      const storedRequest = localStorage.getItem('mockMentorRequest');
      if (storedRequest) {
        try {
          setMentorRequest(JSON.parse(storedRequest));
        } catch (e) {
          console.error('Failed to parse mentor request', e);
        }
      } else if (user?.roles?.includes('MENTOR')) {
        setMentorRequest({ status: 'APPROVED' });
      } else {
        setMentorRequest({ status: 'NOT_SUBMITTED' });
      }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        setError('Tệp đính kèm không hợp lệ. Chỉ nhận tệp PDF, PNG, JPG, JPEG.');
        return;
      }

      setUploadedFileName(file.name);
      setUploadProgress(0);

      // Simulate file upload progress indicator
      let prog = 0;
      const interval = setInterval(() => {
        prog += 20;
        setUploadProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
        }
      }, 150);
    }
  };

  const handleMentorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!mentorSpecialization) {
      setError('Vui lòng chọn chuyên ngành đăng ký Mentor.');
      return;
    }
    if (!uploadedFileName) {
      setError('Vui lòng tải lên tài liệu minh chứng.');
      return;
    }

    // Find specialization name
    const specObj = specializations.find(s => s.id === mentorSpecialization) || 
                    fallbackSpecializations.find(s => s.id === mentorSpecialization);
    const specName = specObj ? specObj.nameVi : 'Chuyên môn khác';

    const newRequest: MentorRequestState = {
      status: 'PENDING',
      specialization: specName,
      documentName: uploadedFileName,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    // Save student application locally
    localStorage.setItem('mockMentorRequest', JSON.stringify(newRequest));
    setMentorRequest(newRequest);

    // Save to the admin requests queue
    const adminReqsStr = localStorage.getItem('mockMentorRequests');
    let adminReqs = [];
    if (adminReqsStr) {
      try {
        adminReqs = JSON.parse(adminReqsStr);
      } catch (err) {
        adminReqs = [];
      }
    }
    
    // Remove duplicates from same user email
    adminReqs = adminReqs.filter((r: any) => r.email !== user?.email);

    adminReqs.unshift({
      id: 'req_' + Date.now(),
      applicantName: displayName || user?.fullName || 'Demo User',
      email: user?.email || 'demo.mentee@fpt.edu.vn',
      campus: campuses.find(c => c.id === selectedCampus)?.code || 'HCM',
      specialization: specName,
      documentName: uploadedFileName,
      submittedAt: newRequest.submittedAt,
      status: 'PENDING'
    });

    localStorage.setItem('mockMentorRequests', JSON.stringify(adminReqs));

    setSuccess('Đã gửi yêu cầu đăng ký làm Mentor thành công!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleReapply = () => {
    const freshState: MentorRequestState = { status: 'NOT_SUBMITTED' };
    localStorage.setItem('mockMentorRequest', JSON.stringify(freshState));
    setMentorRequest(freshState);
    setMentorSpecialization('');
    setMentorNote('');
    setUploadedFileName('');
    setUploadProgress(null);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      
      {/* Card Sidebar Info */}
      <div className="space-y-6">
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
      </div>

      {/* Tabs Layout & Form Editors */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-brand-border gap-2">
          <button
            onClick={() => setActiveTab('ACADEMIC')}
            className={`py-3 px-4 text-body font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ACADEMIC'
                ? 'border-brand-terracotta text-brand-terracotta font-extrabold'
                : 'border-transparent text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ sơ học thuật</span>
          </button>
          
          <button
            onClick={() => setActiveTab('BECOME_MENTOR')}
            className={`py-3 px-4 text-body font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BECOME_MENTOR'
                ? 'border-brand-terracotta text-brand-terracotta font-extrabold'
                : 'border-transparent text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Trở thành Mentor</span>
          </button>
        </div>

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

        {/* Tab 1: Academic Profile Form */}
        {activeTab === 'ACADEMIC' && (
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
        )}

        {/* Tab 2: Become a Mentor Tab */}
        {activeTab === 'BECOME_MENTOR' && (
          <div className="space-y-6">
            
            {/* View 1: User is already Approved / is Mentor */}
            {mentorRequest.status === 'APPROVED' && (
              <div className="meetmind-card p-8 text-center space-y-4 rounded-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-serif text-brand-text">Bạn đã là Mentor chính thức!</h3>
                  <p className="text-brand-text-muted text-body font-semibold max-w-md mx-auto leading-relaxed">
                    Hồ sơ của bạn đã được xác thực thành công. Bạn đã có quyền tạo lịch hẹn và nhận các yêu cầu trao đổi học tập từ Mentees khác.
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-4">
                  <Link
                    to="/mentor/profile-setup"
                    className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-6 rounded-card cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/20"
                  >
                    <span>Cấu hình Chuyên môn</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/mentor/slots"
                    className="flex items-center gap-1 bg-surface hover:bg-brand-bg border border-brand-border text-brand-text text-body font-bold py-3 px-6 rounded-card cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <span>Tạo Khung giờ rảnh</span>
                  </Link>
                </div>
              </div>
            )}

            {/* View 2: Application is Pending approval */}
            {mentorRequest.status === 'PENDING' && (
              <div className="meetmind-card p-8 space-y-5 rounded-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-field bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-serif text-brand-text">Đơn ứng tuyển đang được xét duyệt</h3>
                    <p className="text-brand-text-muted text-body font-semibold">
                      Phòng Công tác Sinh viên FPTU (Admin) đang xác minh chứng chỉ của bạn.
                    </p>
                  </div>
                </div>

                <div className="bg-brand-bg border border-brand-border p-4 rounded-card text-body font-semibold space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-brand-text-muted">Chuyên ngành đăng ký:</span>
                    <span className="col-span-2 text-brand-text font-bold">{mentorRequest.specialization}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-brand-text-muted">Tài liệu đính kèm:</span>
                    <span className="col-span-2 text-brand-blue font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {mentorRequest.documentName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-brand-text-muted">Thời gian gửi đơn:</span>
                    <span className="col-span-2 text-brand-text font-bold">{mentorRequest.submittedAt}</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 text-amber-800 rounded-card text-meta font-semibold leading-relaxed">
                  💡 Bạn có thể dùng <strong>Dev Bypass (Role selector)</strong> ở trang Đăng nhập để chuyển sang vai trò <strong>ADMIN</strong> để tự phê duyệt yêu cầu này trong <strong>"Hàng chờ duyệt"</strong>.
                </div>
              </div>
            )}

            {/* View 3: Application is Rejected */}
            {mentorRequest.status === 'REJECTED' && (
              <div className="meetmind-card p-8 space-y-5 rounded-card relative overflow-hidden border-red-200 bg-red-50/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-field bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-serif text-brand-text">Đơn ứng tuyển không được phê duyệt</h3>
                    <p className="text-brand-text-muted text-body font-semibold text-red-600">
                      Rất tiếc, yêu cầu bị từ chối bởi Phòng Công tác Sinh viên.
                    </p>
                  </div>
                </div>

                {mentorRequest.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-card text-body text-red-800 font-bold">
                    Lý do từ chối: {mentorRequest.rejectionReason}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleReapply}
                    className="bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-6 rounded-card cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/20"
                  >
                    Nộp đơn ứng tuyển mới
                  </button>
                </div>
              </div>
            )}

            {/* View 4: Submit New Application Form */}
            {mentorRequest.status === 'NOT_SUBMITTED' && (
              <div className="meetmind-card p-6 lg:p-8 rounded-card">
                <h2 className="text-lg font-bold text-brand-text font-serif tracking-tight border-b border-brand-border pb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-terracotta" /> Đăng ký trở thành Mentor học thuật
                </h2>
                
                <p className="text-brand-text-muted text-body font-semibold mt-3 leading-relaxed">
                  Để trở thành Mentor chính thức, bạn cần đạt học lực khá trở lên trong chuyên ngành, hoặc có các chứng chỉ chuyên môn liên quan. Hãy tải lên tài liệu minh chứng (bảng điểm, chứng chỉ ngoại ngữ, chứng chỉ IT...) để được phê duyệt.
                </p>

                <form onSubmit={handleMentorSubmit} className="space-y-6 mt-6">
                  
                  {/* Select Mentor Specialization */}
                  <div>
                    <label className="block text-body font-bold text-brand-text-muted mb-1.5">Chuyên ngành muốn dạy học / chia sẻ</label>
                    <select
                      required
                      value={mentorSpecialization}
                      onChange={(e) => setMentorSpecialization(e.target.value)}
                      className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none transition-all cursor-pointer font-semibold"
                    >
                      <option value="">Chọn chuyên ngành Mentor</option>
                      {specializations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameVi}
                        </option>
                      ))}
                      {/* Fallbacks if program not selected yet */}
                      {specializations.length === 0 && fallbackSpecializations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameVi}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mentor Motivation note */}
                  <div>
                    <label className="block text-body font-bold text-brand-text-muted mb-1.5">Mục tiêu & Điểm mạnh (Giới thiệu ngắn gọn để xét duyệt)</label>
                    <textarea
                      required
                      value={mentorNote}
                      onChange={(e) => setMentorNote(e.target.value)}
                      rows={3}
                      className="w-full bg-surface border border-brand-border focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta rounded-field py-2.5 px-4 text-body text-brand-text focus:outline-none transition-all resize-none placeholder-brand-grey font-medium"
                      placeholder="Ví dụ: Đã hoàn thành môn PRF192 và PRO192 điểm 9.0+, đạt chứng chỉ IELTS 7.0..."
                    />
                  </div>

                  {/* File Upload Simulation */}
                  <div>
                    <label className="block text-body font-bold text-brand-text-muted mb-2">Tài liệu minh chứng (Bảng điểm / Chứng chỉ - PDF/PNG/JPG)</label>
                    
                    <div className="border-2 border-dashed border-brand-border hover:border-brand-terracotta rounded-card p-6 text-center cursor-pointer transition-colors relative bg-brand-bg/20">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      
                      <div className="space-y-2">
                        <UploadCloud className="w-8 h-8 text-brand-terracotta mx-auto" />
                        <div>
                          <p className="text-body font-bold text-brand-text">Kéo thả tệp hoặc click để tải lên</p>
                          <p className="text-meta text-brand-text-muted mt-1">Hỗ trợ tệp PDF, PNG, JPG, JPEG tối đa 10MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress upload indicator */}
                    {uploadProgress !== null && (
                      <div className="mt-4 p-3 bg-brand-bg border border-brand-border rounded-field flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-brand-terracotta shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-meta text-brand-text font-bold block truncate">{uploadedFileName}</span>
                            <div className="w-full bg-brand-border h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-brand-terracotta h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-body font-bold text-brand-terracotta shrink-0">{uploadProgress}%</span>
                      </div>
                    )}

                    {uploadProgress === 100 && (
                      <div className="mt-2 text-meta text-green-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Tải lên thành công! Tài liệu sẵn sàng gửi.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-bold py-3 px-6 rounded-card cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-brand-terracotta/25"
                  >
                    <Check className="w-4 h-4" />
                    <span>Nộp đơn Đăng ký</span>
                  </button>

                </form>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
