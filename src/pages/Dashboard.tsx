import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, GraduationCap, UserPlus, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { studentProfileApi } from '../api/studentProfile';
import { onboardingApi } from '../api/matching';
import type { StudentProfile } from '../api/types';
import { ForumFeed } from '../components/ForumFeed';
import { AdCarousel } from '../components/AdCarousel';

/* ---------------------------------------------------------------------------
 * Trang chủ = Diễn đàn (đã gộp). Cột chính là feed thảo luận thật (forum API);
 * cột phải gom gọn widget campus/mentor + banner tài trợ + tóm tắt hồ sơ.
 * ------------------------------------------------------------------------- */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [needsMentoring, setNeedsMentoring] = useState(false);
  const campusName = profile?.campus?.name || '';
  const programName = profile?.program?.nameVi || '';

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setNeedsMentoring(false);
      return;
    }

    let active = true;
    studentProfileApi.get()
      .then((p) => { if (active) setProfile(p); })
      .catch((err) => console.warn('Không tải được hồ sơ học viên', err));
    // Cờ nhu cầu mentoring: chưa trả lời 5 câu -> hiện banner nhắc.
    onboardingApi.getStatus()
      .then((s) => { if (active) setNeedsMentoring(s.mentoringNeedsCompleted === false); })
      .catch(() => { /* ẩn banner nếu lỗi/không có quyền */ });
    return () => { active = false; };
  }, [user]);

  return (
    <div className="space-y-6 text-left relative">
      {needsMentoring && (
        <Link
          to="/mentoring-needs"
          className="flex items-center gap-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-card px-5 py-4 shadow-md shadow-brand-primary/20 hover:opacity-95 transition-all group"
        >
          <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-extrabold leading-tight">Cá nhân hoá gợi ý mentor cho bạn</p>
            <p className="text-white/85 text-meta font-semibold mt-0.5">Trả lời nhanh 5 câu để hệ thống tìm mentor hợp với nhu cầu của bạn.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-meta font-bold py-2 px-3.5 rounded-full shrink-0 group-hover:gap-2.5 transition-all">
            Bắt đầu <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ===== Feed diễn đàn (gộp vào trang chủ) ===== */}
        <div className="lg:col-span-2">
          <ForumFeed />
        </div>

        {/* ===== Cột widget (đã gom gọn) ===== */}
        <div className="lg:col-span-1 space-y-5">
          {/* Card campus + mentor gộp làm 1 */}
          <div className="ss-card rounded-card p-5 space-y-3">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-full border border-line flex items-center justify-center bg-surface-muted shrink-0 text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="text-body font-bold text-fg leading-tight truncate">{campusName || 'Cơ sở FPT University'}</h4>
                <span className="text-meta text-fg-faint font-semibold block mt-0.5">SkillSwap Campus</span>
              </div>
            </div>
            <Link to="/mentors" className="flex justify-between items-center pt-3 border-t border-line-soft text-body font-bold text-fg hover:text-primary group transition-colors">
              <span className="flex items-center gap-2"><GraduationCap className="w-4.5 h-4.5 text-fg-muted" /> Khám phá Mentor cùng cơ sở</span>
              <ChevronRight className="w-4.5 h-4.5 text-fg-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link to="/profile" className="flex justify-between items-center pt-3 border-t border-line-soft text-body font-bold text-fg hover:text-primary group transition-colors">
              <span className="flex items-center gap-2"><UserPlus className="w-4.5 h-4.5 text-fg-muted" /> Đăng ký trở thành Mentor</span>
              <ChevronRight className="w-4.5 h-4.5 text-fg-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Banner quảng cáo lướt tự động (nguồn thu phụ — mock, API sau) */}
          <AdCarousel />

          {/* Tóm tắt hồ sơ học viên (dữ liệu thật) */}
          <div className="ss-card rounded-card p-5 space-y-4">
            <h3 className="text-fg font-bold text-body border-b border-line-soft pb-3 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-fg-muted" /> Tóm tắt thông tin học viên
            </h3>
            <div className="space-y-3">
              {[
                ['MSSV', profile?.studentCode || 'Chưa cập nhật'],
                ['Ngành học', programName || 'Chưa cập nhật'],
                ['Cơ sở FPT', campusName || 'Chưa cập nhật'],
                ['Học kỳ', profile?.semester ? `Học kỳ ${profile.semester}` : 'Chưa cập nhật'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-body">
                  <span className="text-fg-muted font-semibold">{k}</span>
                  <span className="font-bold text-fg">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-body">
                <span className="text-fg-muted font-semibold">Vai trò chính</span>
                <span className="bg-surface-muted text-fg-muted text-meta font-extrabold uppercase px-2.5 py-1 rounded-md border border-line">
                  {user?.roles?.[0] || 'MENTEE'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-line-soft">
              <Link to="/profile" className="w-full flex items-center justify-center py-3 rounded-field bg-surface-muted hover:opacity-80 text-fg border border-line text-body font-bold transition-all">
                Cập nhật thông tin học tập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
