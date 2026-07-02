import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, initTheme, type ThemeId } from '../theme/theme';

/* =====================================================================
   ThemeSwitcher — Nút chuyển đổi chế độ sáng/tối.
   Sáng: Royal Blue ('royal')
   Tối: Aurora ('violet')
   ===================================================================== */
export const ThemeSwitcher: React.FC = () => {
  const [active, setActive] = useState<ThemeId>('royal');

  useEffect(() => {
    setActive(initTheme());
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeId = active === 'royal' ? 'violet' : 'royal';
    applyTheme(nextTheme);
    setActive(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      title={active === 'royal' ? 'Chế độ tối (Aurora)' : 'Chế độ sáng (Royal Blue)'}
      className="p-2.5 bg-surface border border-line text-fg-muted hover:text-fg rounded-full transition-all cursor-pointer hover:bg-surface-muted flex items-center justify-center"
    >
      {active === 'royal' ? (
        <Moon className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
      ) : (
        <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
      )}
    </button>
  );
};
