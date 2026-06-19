import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, Loader2, Settings } from 'lucide-react';
import { mentorProfileApi } from '../../api/mentorProfile';
import { getMe } from '../../lib/authService';
import type { TeachingMode } from '../../api/types';

type FormState = {
  headline: string;
  expertiseDescription: string;
  supportingSubjects: string;
  isAvailable: boolean;
  helpTopicIds: string;
  teachingMode: TeachingMode;
  sessionDuration: 15 | 30 | 60 | 90;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
};

const DEFAULT_STATE: FormState = {
  headline: '',
  expertiseDescription: '',
  supportingSubjects: '',
  isAvailable: true,
  helpTopicIds: '',
  teachingMode: 'ONLINE',
  sessionDuration: 60,
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
};

export const MentorSetupProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [helpTopicsNotice, setHelpTopicsNotice] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);

  const canSubmit = useMemo(() => {
    const helpTopicIds = form.helpTopicIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    return !!form.headline.trim() && !!form.expertiseDescription.trim() && helpTopicIds.length > 0;
  }, [form]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getMe();
        console.log('[MentorProfile] /api/auth/me', me);
        if (!me.profileCompleted) {
          navigate('/onboarding/student-profile', { replace: true });
          return;
        }

        const response = await mentorProfileApi.get();
        console.log('[MentorProfile] GET /api/me/mentor-profile', response);
        if (cancelled) return;

        if (response.exists && response.profile) {
          setForm({
            headline: response.profile.headline ?? '',
            expertiseDescription: response.profile.expertiseDescription ?? '',
            supportingSubjects: response.profile.supportingSubjects ?? '',
            isAvailable: response.profile.isAvailable ?? true,
            helpTopicIds: response.profile.helpTopicIds?.join(', ') ?? '',
            teachingMode: response.profile.teachingMode ?? 'ONLINE',
            sessionDuration: response.profile.sessionDuration ?? 60,
            linkedinUrl: response.profile.linkedinUrl ?? '',
            githubUrl: response.profile.githubUrl ?? '',
            portfolioUrl: response.profile.portfolioUrl ?? '',
          });
        } else {
          setForm(DEFAULT_STATE);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Không thể tải hồ sơ mentor.';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHelpTopicsNotice('Chưa thấy endpoint /api/catalog/help-topics trong codebase hiện tại.');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = (key: keyof FormState, value: string | boolean | TeachingMode | 15 | 30 | 60 | 90) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const helpTopicIds = Array.from(
      new Set(
        form.helpTopicIds
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );

    if (!form.headline.trim()) {
      setError('Headline là bắt buộc.');
      setSaving(false);
      return;
    }

    if (form.headline.trim().length > 200) {
      setError('Headline không được vượt quá 200 ký tự.');
      setSaving(false);
      return;
    }

    if (!form.expertiseDescription.trim()) {
      setError('Mô tả chuyên môn là bắt buộc.');
      setSaving(false);
      return;
    }

    if (form.expertiseDescription.trim().length > 1000) {
      setError('Mô tả chuyên môn không được vượt quá 1000 ký tự.');
      setSaving(false);
      return;
    }

    if (helpTopicIds.length < 1 || helpTopicIds.length > 20) {
      setError('helpTopicIds phải có từ 1 đến 20 giá trị.');
      setSaving(false);
      return;
    }

    try {
      await mentorProfileApi.update({
        headline: form.headline.trim(),
        expertiseDescription: form.expertiseDescription.trim(),
        supportingSubjects: form.supportingSubjects.trim() || null,
        isAvailable: form.isAvailable,
        helpTopicIds,
        teachingMode: form.teachingMode,
        sessionDuration: form.sessionDuration,
        linkedinUrl: form.linkedinUrl.trim() || null,
        githubUrl: form.githubUrl.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
      });
      setSuccess('Đã lưu hồ sơ mentor. Đang chuyển sang bước xác thực...');
      window.setTimeout(() => {
        navigate('/mentor/verification', { replace: true });
      }, 700);
    } catch (err) {
      const status = err instanceof Error && 'status' in err ? Number((err as Error & { status?: number }).status) : null;
      const message = err instanceof Error ? err.message : 'Không thể lưu hồ sơ mentor.';
      setError(status === 400 ? message : message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-terracotta" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-left">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-brand-text">
          <Settings className="h-8 w-8 text-brand-terracotta" />
          Hồ sơ Mentor
        </h1>
        <p className="text-body font-medium text-brand-text-muted">
          Hoàn thiện thông tin cơ bản trước khi tạo yêu cầu xác thực mentor.
        </p>
      </div>

      {helpTopicsNotice && (
        <div className="rounded-field border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {helpTopicsNotice} Tạm thời nhập `helpTopicIds` bằng mã topic, phân tách bằng dấu phẩy.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-field border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="text-body font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-field border border-green-200 bg-green-50 p-4 text-green-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="text-body font-medium">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-brand-border bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">Headline</span>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => update('headline', e.target.value)}
              maxLength={200}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
              placeholder="Backend Developer | Spring Boot Mentor"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">Mức độ sẵn sàng</span>
            <select
              value={form.isAvailable ? 'true' : 'false'}
              onChange={(e) => update('isAvailable', e.target.value === 'true')}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
            >
              <option value="true">Sẵn sàng mentoring</option>
              <option value="false">Tạm ngưng nhận mentee</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="block text-sm font-semibold text-brand-text">Mô tả chuyên môn</span>
          <textarea
            value={form.expertiseDescription}
            onChange={(e) => update('expertiseDescription', e.target.value)}
            maxLength={1000}
            rows={5}
            className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
            placeholder="Mình có kinh nghiệm xây dựng REST API với Spring Boot, PostgreSQL và Docker."
          />
        </label>

        <label className="block space-y-2">
          <span className="block text-sm font-semibold text-brand-text">Môn / chủ đề hỗ trợ</span>
          <input
            type="text"
            value={form.supportingSubjects}
            onChange={(e) => update('supportingSubjects', e.target.value)}
            className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
            placeholder="PRJ301, SWP391, Database, REST API"
          />
        </label>

        <label className="block space-y-2">
          <span className="block text-sm font-semibold text-brand-text">helpTopicIds</span>
          <textarea
            value={form.helpTopicIds}
            onChange={(e) => update('helpTopicIds', e.target.value)}
            rows={3}
            className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
            placeholder="uuid-topic-1, uuid-topic-2"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">Teaching mode</span>
            <select
              value={form.teachingMode}
              onChange={(e) => update('teachingMode', e.target.value as TeachingMode)}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
            >
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="HYBRID">HYBRID</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">Session duration</span>
            <select
              value={form.sessionDuration}
              onChange={(e) => update('sessionDuration', Number(e.target.value) as 15 | 30 | 60 | 90)}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={60}>60 phút</option>
              <option value={90}>90 phút</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">Liên hệ</span>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => update('linkedinUrl', e.target.value)}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
              placeholder="https://www.linkedin.com/in/example"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">GitHub</span>
            <input
              type="url"
              value={form.githubUrl}
              onChange={(e) => update('githubUrl', e.target.value)}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
              placeholder="https://github.com/example"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-brand-text">Portfolio</span>
            <input
              type="url"
              value={form.portfolioUrl}
              onChange={(e) => update('portfolioUrl', e.target.value)}
              className="w-full rounded-field border border-brand-border bg-brand-bg/40 px-4 py-3 text-body text-brand-text outline-none transition-all focus:border-brand-terracotta"
              placeholder="https://example.dev"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-4">
          <p className="text-sm font-medium text-brand-text-muted">
            Sau khi lưu, bạn sẽ chuyển sang bước tạo yêu cầu xác thực mentor.
          </p>
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="inline-flex items-center gap-2 rounded-field bg-brand-terracotta px-5 py-3 text-body font-bold text-white transition-all hover:bg-brand-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Lưu và tiếp tục
          </button>
        </div>
      </form>
    </div>
  );
};
