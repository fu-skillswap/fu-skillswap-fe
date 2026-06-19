/* =====================================================================
   theme.ts — quản lý theme runtime cho SkillSwap
   Đổi theme = set thuộc tính data-theme trên <html>. Vì index.css dùng
   @theme inline trỏ tới CSS variables, toàn app đổi màu ngay lập tức.
   ===================================================================== */

export const THEMES = [
  { id: 'royal',   label: 'Royal Blue', swatch: '#0038e0' },
  { id: 'navy',    label: 'Navy CTA',   swatch: '#1e293b' },
  { id: 'violet',  label: 'Violet',     swatch: '#6d28d9' },
  { id: 'emerald', label: 'Emerald',    swatch: '#0d9f6e' },
  { id: 'dark',    label: 'Dark',       swatch: '#131c2e' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const STORAGE_KEY = 'skillswap-theme';

/** Áp 1 theme và lưu lựa chọn. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id);
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
}

/** Đọc theme đã lưu (mặc định 'royal') và áp ngay. Gọi 1 lần khi app khởi động. */
export function initTheme(): ThemeId {
  let saved: ThemeId = 'royal';
  try {
    const s = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (s && THEMES.some((t) => t.id === s)) saved = s;
  } catch { /* ignore */ }
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}

/** Theme hiện tại đang áp trên <html>. */
export function getTheme(): ThemeId {
  return (document.documentElement.getAttribute('data-theme') as ThemeId) || 'royal';
}
