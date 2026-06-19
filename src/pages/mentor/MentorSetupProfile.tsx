import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Tags, Settings, Link2 } from 'lucide-react';
import { mentorProfileApi, helpTopicApi } from '../../api/mentorProfile';
import type { HelpTopic, TeachingMode, SessionDuration } from '../../api/types';

const SESSION_DURATIONS: SessionDuration[] = [15, 30, 60, 90];
const TEACHING_MODES: { value: TeachingMode; label: string }[] = [
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'OFFLINE', label: 'Trực tiếp' },
  { value: 'HYBRID', label: 'Kết hợp' },
];

const HEADLINE_MAX = 200;
const EXPERTISE_MAX = 1000;
const SUPPORTING_MAX = 1000;
const HELP_TOPICS_MAX = 20;

export const MentorSetupProfile: React.FC = () => {
  // Form fields — đúng theo contract GET/PUT /api/me/mentor-profile
  const [headline, setHeadline] = useState('');
  const [expertiseDescription, setExpertiseDescription] = useState('');
  const [supportingSubjects, setSupportingSubjects] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [helpTopicIds, setHelpTopicIds] = useState<string[]>([]);
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('ONLINE');
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(60);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Catalog
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>([]);

  // Status
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const topics = await helpTopicApi.list();
        setHelpTopics(topics || []);
      } catch (err) {
        console.warn('Không tải được danh sách help topics.', err);
      }

      try {
        const profile = await mentorProfileApi.get();
        if (profile) {
          setHeadline(profile.headline ?? '');
          setExpertiseDescription(profile.expertiseDescription ?? '');
          setSupportingSubjects(profile.supportingSubjects ?? '');
          setIsAvailable(profile.isAvailable ?? true);
          setHelpTopicIds(profile.helpTopicIds ?? []);
          setTeachingMode(profile.teachingMode ?? 'ONLINE');
          setSessionDuration(profile.sessionDuration ?? 60);
          setLinkedinUrl(profile.linkedinUrl ?? '');
          setGithubUrl(profile.githubUrl ?? '');
          setPortfolioUrl(profile.portfolioUrl ?? '');
        }
      } catch (err) {
        console.warn('Chưa có mentor profile, dùng form trống.', err);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  const toggleHelpTopic = (id: string) => {
    setHelpTopicIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= HELP_TOPICS_MAX) return prev;
      return [...prev, id];
    });
  };

  const validate = (): string | null => {
    if (!headline.trim()) return 'Vui lòng điền Headline.';
    if (headline.length > HEADLINE_MAX) return `Headline tối đa ${HEADLINE_MAX} ký tự.`;
    if (!expertiseDescription.trim()) return 'Vui lòng điền Mô tả chuyên môn.';
    if (expertiseDescription.length > EXPERTISE_MAX) return `Mô tả chuyên môn tối đa ${EXPERTISE_MAX} ký tự.`;
    if (supportingSubjects.length > SUPPORTING_MAX) return `Môn học hỗ trợ tối đa ${SUPPORTING_MAX} ký tự.`;
    if (helpTopicIds.length === 0) return 'Vui lòng chọn ít nhất 1 chủ đề hỗ trợ.';
    if (helpTopicIds.length > HELP_TOPICS_MAX) return `Chỉ được chọn tối đa ${HELP_TOPICS_MAX} chủ đề.`;
    return null;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await mentorProfileApi.update({
        headline,
        expertiseDescription,
        supportingSubjects: supportingSubjects || undefined,
        isAvailable,
        helpTopicIds,
        teachingMode,
        sessionDuration,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      });
      setSuccess('Lưu hồ sơ mentor thành công!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ mentor.');
    } finally {
      setLoading(false);
    }
    setTimeout(() => setSuccess(null), 3000);
  };

  if (initialLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-7 h-7 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-brand-terracotta" /> Cấu hình hồ sơ mentor
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Hoàn thiện thông tin chuyên môn để hệ thống gợi ý bạn cho các mentee phù hợp.
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
        {/* Left Column: Description */}
        <div className="lg:col-span-1 space-y-6">
          <div className="meetmind-card p-6 rounded-card space-y-4">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Settings className="w-4.5 h-4.5 text-brand-terracotta" /> 1. Mô tả năng lực
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">
                  Headline ({headline.length}/{HEADLINE_MAX})
                </label>
                <input
                  type="text"
                  maxLength={HEADLINE_MAX}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ví dụ: Chuyên gia phát triển Web Fullstack | Hỗ trợ đồ án"
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                />
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">
                  Mô tả chuyên môn ({expertiseDescription.length}/{EXPERTISE_MAX})
                </label>
                <textarea
                  rows={4}
                  maxLength={EXPERTISE_MAX}
                  value={expertiseDescription}
                  onChange={(e) => setExpertiseDescription(e.target.value)}
                  placeholder="Giới thiệu kinh nghiệm, kỹ năng và cách bạn hỗ trợ mentee."
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">
                  Môn học hỗ trợ ({supportingSubjects.length}/{SUPPORTING_MAX}, không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  maxLength={SUPPORTING_MAX}
                  value={supportingSubjects}
                  onChange={(e) => setSupportingSubjects(e.target.value)}
                  placeholder="Ví dụ: PRJ301, SWP391, EXE101..."
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none font-medium"
                />
              </div>

              <label className="flex items-center gap-2 text-meta font-bold text-brand-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="cursor-pointer"
                />
                Đang nhận mentee mới
              </label>
            </div>
          </div>

          {/* Links */}
          <div className="meetmind-card p-6 rounded-card space-y-3">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Link2 className="w-4.5 h-4.5 text-brand-blue" /> 2. Liên kết (không bắt buộc)
            </h3>
            <div className="space-y-3">
              <input
                type="url"
                placeholder="LinkedIn URL"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-medium"
              />
              <input
                type="url"
                placeholder="GitHub URL"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-medium"
              />
              <input
                type="url"
                placeholder="Portfolio URL"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-medium"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Help topics + teaching mode/duration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="meetmind-card p-6 rounded-card space-y-3">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Tags className="w-4.5 h-4.5 text-brand-blue" /> 3. Chủ đề hỗ trợ ({helpTopicIds.length}/{HELP_TOPICS_MAX})
            </h3>

            {helpTopics.length === 0 ? (
              <p className="text-meta text-brand-text-muted font-medium py-2">Không tải được danh sách chủ đề. Vui lòng thử lại sau.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {helpTopics.map((topic) => {
                  const isSelected = helpTopicIds.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleHelpTopic(topic.id)}
                      className={`text-meta font-bold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-terracotta/15 text-brand-terracotta border-brand-terracotta/20'
                          : 'bg-brand-bg border-brand-border text-brand-text-muted hover:bg-brand-bg/80'
                      }`}
                    >
                      {topic.name}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-meta text-brand-text-muted font-semibold leading-normal pt-1">
              * Chọn từ 1 đến {HELP_TOPICS_MAX} chủ đề bạn có thể hỗ trợ.
            </p>
          </div>

          <div className="meetmind-card p-6 rounded-card space-y-4">
            <h3 className="text-body font-bold font-serif text-brand-text flex items-center gap-2 border-b border-brand-border pb-2">
              <Settings className="w-4.5 h-4.5 text-brand-terracotta" /> 4. Hình thức & thời lượng buổi học
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Hình thức</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}
                  className="w-full bg-surface border border-brand-border rounded-field py-2 px-3 text-body focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                >
                  {TEACHING_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Thời lượng (phút)</label>
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value) as SessionDuration)}
                  className="w-full bg-surface border border-brand-border rounded-field py-2 px-3 text-body focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                >
                  {SESSION_DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} phút</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleSave}
              className="w-full bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu hồ sơ mentor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
