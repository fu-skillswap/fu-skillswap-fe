import React, { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES, applyTheme, initTheme, type ThemeId } from '../theme/theme';

/* =====================================================================
   ThemeSwitcher — popover chọn theme. Đặt vào header Layout (cạnh chuông).
   Sau này có thể chuyển nguyên logic này vào trang Cài đặt cho người dùng.
   ===================================================================== */
export const ThemeSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeId>('royal');

  useEffect(() => { setActive(initTheme()); }, []);

  const pick = (id: ThemeId) => { applyTheme(id); setActive(id); setOpen(false); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Đổi giao diện"
        className="p-2.5 bg-surface border border-line text-fg-muted hover:text-fg rounded-full transition-all cursor-pointer"
      >
        <Palette className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-surface border border-line rounded-card shadow-xl p-2 z-50 animate-fadeIn">
            <p className="text-xs font-bold text-fg-muted uppercase tracking-wider px-2.5 py-1.5">Giao diện</p>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-field hover:bg-surface-muted transition-colors text-left cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full border border-line shrink-0" style={{ background: t.swatch }} />
                <span className="text-sm font-semibold text-fg flex-1">{t.label}</span>
                {active === t.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
