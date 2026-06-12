import React, { useState } from 'react';
import { Trash2, Check, AlertCircle, Briefcase, Sliders, Tags, Settings } from 'lucide-react';

interface Experience {
  id: string;
  companyName: string;
  positionTitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface MentoringService {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export const MentorSetupProfile: React.FC = () => {
  // Profile settings
  const [headline, setHeadline] = useState('Chuyên gia phát triển Web Fullstack | Hỗ trợ đồ án K18/K19');
  const [description, setDescription] = useState('Mình đã làm việc với React, Node.js trong hơn 2 năm và thực hiện nhiều đồ án thực tế. Sẵn sàng giúp đỡ các bạn gỡ rối code và thiết kế hệ thống.');
  const [mentoringStyle, setMentoringStyle] = useState('Thực chiến, code-along, review code chi tiết.');
  const [targetMentees, setTargetMentees] = useState('Sinh viên K18, K19 muốn làm quen với dự án thực tế.');

  // Tags
  const [availableTags] = useState(['React', 'Node.js', 'TypeScript', 'Python', 'AI/ML', 'Figma', 'UI/UX', 'SEO', 'Docker']);
  const [selectedTags, setSelectedTags] = useState<string[]>(['React', 'Node.js', 'TypeScript']);

  // Experience state
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: 'exp1', companyName: 'FPT Software', positionTitle: 'Front-end Intern', startDate: '2025-01', endDate: '2025-05', isCurrent: false },
    { id: 'exp2', companyName: 'Freelancer Startup', positionTitle: 'Web Developer', startDate: '2025-06', endDate: '', isCurrent: true },
  ]);

  // Form Experience input
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);

  // Services state
  const [services, setServices] = useState<MentoringService[]>([
    { id: 'ser1', title: 'Gỡ rối đồ án tốt nghiệp Web React/Node.js', description: 'Review cấu trúc thư mục, tối ưu hóa database query và kết nối API.', durationMinutes: 60 },
    { id: 'ser2', title: 'Học ReactJS căn bản trong 1 tiếng', description: 'Giới thiệu State, Effect, Custom Hook và mô hình luồng dữ liệu.', durationMinutes: 60 },
  ]);

  // Form Service input
  const [serTitle, setSerTitle] = useState('');
  const [serDesc, setSerDesc] = useState('');
  const [serDuration, setSerDuration] = useState(60);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!company || !position || !expStart) {
      setError('Vui lòng điền đủ Tên công ty, Vị trí và Ngày bắt đầu.');
      return;
    }

    const newExp: Experience = {
      id: `exp_${Date.now()}`,
      companyName: company,
      positionTitle: position,
      startDate: expStart,
      endDate: isCurrent ? '' : expEnd,
      isCurrent,
    };

    setExperiences([...experiences, newExp]);
    setCompany('');
    setPosition('');
    setExpStart('');
    setExpEnd('');
    setIsCurrent(false);
    setSuccess('Đã thêm kinh nghiệm làm việc.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serTitle || !serDesc) return;

    const newSer: MentoringService = {
      id: `ser_${Date.now()}`,
      title: serTitle,
      description: serDesc,
      durationMinutes: Number(serDuration),
    };

    setServices([...services, newSer]);
    setSerTitle('');
    setSerDesc('');
    setSerDuration(60);
    setSuccess('Đã thêm dịch vụ mentoring (miễn phí).');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const handleSaveProfile = () => {
    setSuccess('Hồ sơ năng lực Mentor đã được cập nhật thành công!');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-brand-terracotta" /> Cấu hình hồ sơ chuyên môn
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Tối ưu hóa các thông số kỹ năng, lịch sử làm việc và các gói hỗ trợ để tăng độ uy tín với sinh viên.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-field text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-green-500/5 border border-green-200 text-green-600 p-4 rounded-field text-body font-semibold">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card & Tech Tags */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Info */}
          <div className="meetmind-card p-6 rounded-card space-y-4">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Sliders className="w-4.5 h-4.5 text-brand-terracotta" /> 1. Mô tả năng lực
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Headline ngắn</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                />
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Giới thiệu chi tiết</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Phong cách mentoring</label>
                  <input
                    type="text"
                    value={mentoringStyle}
                    onChange={(e) => setMentoringStyle(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Đối tượng hỗ trợ</label>
                  <input
                    type="text"
                    value={targetMentees}
                    onChange={(e) => setTargetMentees(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all"
            >
              Lưu thông tin mô tả
            </button>
          </div>

          {/* Expert Tags */}
          <div className="meetmind-card p-6 rounded-card space-y-3">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Tags className="w-4.5 h-4.5 text-brand-blue" /> 2. Kỹ năng chuyên môn
            </h3>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-meta font-bold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-terracotta/15 text-brand-terracotta border-brand-terracotta/20'
                        : 'bg-brand-bg border-brand-border text-brand-text-muted hover:bg-brand-bg/80'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            
            <p className="text-meta text-brand-text-muted font-semibold leading-normal pt-1">
              * Vui lòng chọn ít nhất 1 kỹ năng chủ đạo (Primary tag) trùng khớp với chuyên ngành của bạn.
            </p>
          </div>

        </div>

        {/* Right Column: Work History & Mentoring Packages */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Work experiences */}
          <div className="meetmind-card p-6 rounded-card space-y-4">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Briefcase className="w-4.5 h-4.5 text-brand-terracotta" /> 3. Lịch sử kinh nghiệm & Học vấn
            </h3>

            {/* List experiences */}
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center bg-brand-bg/40 border border-brand-border p-3.5 rounded-card">
                  <div className="text-left">
                    <span className="text-body font-bold text-brand-text block">{exp.positionTitle}</span>
                    <span className="text-meta text-brand-text-muted font-bold block">{exp.companyName}</span>
                    <span className="text-meta text-brand-grey font-semibold">
                      {exp.startDate} - {exp.isCurrent ? 'Hiện tại' : exp.endDate}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="p-1.5 hover:bg-red-50 text-brand-text-muted hover:text-red-600 rounded-field transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Exp Form */}
            <form onSubmit={handleAddExperience} className="bg-brand-bg/30 border border-brand-border p-4 rounded-card space-y-3">
              <span className="text-meta font-bold text-brand-text uppercase block mb-1">Thêm kinh nghiệm mới</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tên công ty (Ví dụ: FPT Software)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-surface border border-brand-border rounded-field py-2 px-3 text-body focus:outline-none focus:border-brand-terracotta"
                />
                <input
                  type="text"
                  placeholder="Vị trí (Ví dụ: React Developer)"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="bg-surface border border-brand-border rounded-field py-2 px-3 text-body focus:outline-none focus:border-brand-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="month"
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    className="bg-surface border border-brand-border rounded-field py-2 px-2 text-body focus:outline-none focus:border-brand-terracotta cursor-pointer"
                    title="Bắt đầu"
                  />
                  <input
                    type="month"
                    disabled={isCurrent}
                    value={expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    className="bg-surface border border-brand-border rounded-field py-2 px-2 text-body focus:outline-none focus:border-brand-terracotta disabled:opacity-40 cursor-pointer"
                    title="Kết thúc"
                  />
                </div>
                <div className="flex items-center gap-2 pl-2">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="isCurrent" className="text-meta font-bold text-brand-text-muted cursor-pointer">
                    Đang làm việc tại đây
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-bg hover:bg-brand-terracotta hover:text-white border border-brand-border hover:border-brand-terracotta text-brand-text text-meta font-bold py-2 rounded-field transition-all cursor-pointer"
              >
                + Lưu kinh nghiệm
              </button>
            </form>
          </div>

          {/* Mentoring services */}
          <div className="meetmind-card p-6 rounded-card space-y-4">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Sliders className="w-4.5 h-4.5 text-brand-blue" /> 4. Thiết lập Gói dịch vụ hỗ trợ (Miễn phí cho MVP)
            </h3>

            <div className="space-y-3">
              {services.map((ser) => (
                <div key={ser.id} className="flex justify-between items-start bg-brand-bg/40 border border-brand-border p-4 rounded-card">
                  <div className="text-left space-y-1">
                    <span className="text-body font-bold text-brand-text block">{ser.title}</span>
                    <p className="text-meta text-brand-text-muted font-medium">{ser.description}</p>
                    <span className="inline-block text-meta font-extrabold text-brand-blue bg-brand-blue/15 border border-brand-blue/20 px-2 py-0.5 rounded-lg">
                      Thời lượng: {ser.durationMinutes} phút
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteService(ser.id)}
                    className="p-1.5 hover:bg-red-50 text-brand-text-muted hover:text-red-600 rounded-field transition-all cursor-pointer shrink-0 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Service Form */}
            <form onSubmit={handleAddService} className="bg-brand-bg/30 border border-brand-border p-4 rounded-card space-y-3">
              <span className="text-meta font-bold text-brand-text uppercase block mb-1">Thêm dịch vụ hỗ trợ mới</span>
              
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Tên gói hỗ trợ (Ví dụ: Mock Interview SE)"
                  value={serTitle}
                  onChange={(e) => setSerTitle(e.target.value)}
                  className="col-span-2 bg-surface border border-brand-border rounded-field py-2 px-3 text-body focus:outline-none focus:border-brand-terracotta"
                />
                <select
                  value={serDuration}
                  onChange={(e) => setSerDuration(Number(e.target.value))}
                  className="col-span-1 bg-surface border border-brand-border rounded-field py-2 px-2 text-body focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
                >
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                </select>
              </div>

              <textarea
                required
                rows={2}
                placeholder="Mô tả nội dung chi tiết buổi học và những gì mentee cần chuẩn bị trước..."
                value={serDesc}
                onChange={(e) => setSerDesc(e.target.value)}
                className="w-full bg-surface border border-brand-border rounded-field p-3 text-body focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
              />

              <button
                type="submit"
                className="w-full bg-brand-bg hover:bg-brand-terracotta hover:text-white border border-brand-border hover:border-brand-terracotta text-brand-text text-meta font-bold py-2 rounded-field transition-all cursor-pointer"
              >
                + Thêm gói hỗ trợ
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
