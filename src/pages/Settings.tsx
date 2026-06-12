import React, { useEffect, useState } from 'react';
import { Check, Palette, Monitor } from 'lucide-react';
import { THEMES, applyTheme, initTheme, getTheme, type ThemeId } from '../theme/theme';

/* Màu preview cho từng theme (khớp giá trị trong index.css).
   Chỉ dùng để vẽ thumbnail — không phải logic màu của app. */
const PREVIEW: Record<ThemeId, { bg: string; surface: string; primary: string; accent: string; action: string }> = {
  royal:   { bg: '#eef2f7', surface: '#ffffff', primary: '#0038e0', accent: '#00a2ff', action: '#0038e0' },
  navy:    { bg: '#eef2f7', surface: '#ffffff', primary: '#0038e0', accent: '#00a2ff', action: '#1e293b' },
  violet:  { bg: '#eef2f7', surface: '#ffffff', primary: '#6d28d9', accent: '#a855f7', action: '#6d28d9' },
  emerald: { bg: '#eef2f7', surface: '#ffffff', primary: '#0d9f6e', accent: '#34d399', action: '#0d9f6e' },
  dark:    { bg: '#0b1220', surface: '#131c2e', primary: '#5b8cff', accent: '#38bdf8', action: '#5b8cff' },
};

export const Settings: React.FC = () => {
  const [active, setActive] = useState<ThemeId>('royal');

  useEffect(() => { setActive(getTheme() || initTheme()); }, []);

  const pick = (id: ThemeId) => { applyTheme(id); setActive(id); };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-head font-extrabold text-fg tracking-tight">Cài đặt</h1>
        <p className="text-body text-fg-muted font-medium mt-1">Tùy chỉnh trải nghiệm SkillSwap của bạn.</p>
      </div>

      {/* Appearance section */}
      <section className="ss-card rounded-card p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-line-soft pb-4">
          <span className="w-11 h-11 rounded-field bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-title font-extrabold text-fg">Giao diện</h2>
            <p className="text-meta text-fg-muted font-semibold mt-0.5">Chọn bảng màu — áp dụng ngay cho toàn bộ ứng dụng.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {THEMES.map((t) => {
            const p = PREVIEW[t.id];
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                className={`group text-left rounded-card border-2 p-3 transition-all cursor-pointer ${
                  isActive ? 'border-primary shadow-card' : 'border-line hover:border-primary/40'
                }`}
              >
                {/* Mini preview */}
                <div className="rounded-field h-24 p-2.5 flex flex-col justify-between overflow-hidden" style={{ background: p.bg }}>
                  <div className="rounded-lg p-2 shadow-sm" style={{ background: p.surface }}>
                    <div className="h-1.5 w-10 rounded-full mb-1.5" style={{ background: p.primary }} />
                    <div className="flex gap-1">
                      <span className="h-3 w-7 rounded-md" style={{ background: p.action }} />
                      <span className="h-3 w-3 rounded-full" style={{ background: p.accent }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 pl-0.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.primary }} />
                    <span className="h-2 w-2 rounded-full" style={{ background: p.accent }} />
                    <span className="h-2 w-2 rounded-full" style={{ background: p.action }} />
                  </div>
                </div>

                {/* Label */}
                <div className="flex items-center justify-between mt-3 px-0.5">
                  <span className="text-body font-bold text-fg">{t.label}</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary text-on-action' : 'border border-line text-transparent group-hover:border-primary/40'
                  }`}>
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-meta text-fg-faint font-semibold pt-1">
          <Monitor className="w-4 h-4" />
          <span>Lựa chọn được lưu trên thiết bị này và giữ nguyên khi bạn quay lại.</span>
        </div>
      </section>
    </div>
  );
};
