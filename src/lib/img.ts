// =====================================================================
// src/lib/img.ts — fallback ảnh đại diện khi URL từ BE không tải được
// (vd: avatar trỏ host nội bộ storage.skillswap.local -> ERR_NAME_NOT_RESOLVED).
// =====================================================================
import type { SyntheticEvent } from 'react';

export const AVATAR_FALLBACK = 'https://api.dicebear.com/7.x/bottts/svg';

/** Gắn vào <img onError={onAvatarError}> để tự thay ảnh hỏng bằng avatar mặc định. */
export const onAvatarError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src !== AVATAR_FALLBACK) img.src = AVATAR_FALLBACK;
};
