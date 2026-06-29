// =====================================================================
// src/components/CreditWalletBadge.tsx — Số dư ví SCoin của mentee.
// Lấy từ GET /api/me/credit-wallet (chỉ mentee). Fail-safe: ẩn khi lỗi
// hoặc user không có role MENTEE.
// =====================================================================
import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { walletApi } from '../api/payment';

interface Props {
  /** 'card' cho khối nổi bật (trang hồ sơ), 'row' cho dòng gọn (dropdown tài khoản), 'chip' cho header. */
  variant?: 'card' | 'row' | 'chip';
}

export const CreditWalletBadge: React.FC<Props> = ({ variant = 'card' }) => {
  const { user } = useAuth();
  const isMentee = !!user?.roles?.includes('MENTEE');
  const [scoin, setScoin] = useState<number | null>(null);

  useEffect(() => {
    if (!isMentee) return;
    let alive = true;
    walletApi.getCreditWallet()
      .then((w) => { if (alive) setScoin(w.availableScoin ?? 0); })
      .catch(() => { /* ẩn khi lỗi/403 */ });
    return () => { alive = false; };
  }, [isMentee]);

  if (!isMentee || scoin == null) return null;
  const formatted = scoin.toLocaleString('vi-VN');

  if (variant === 'chip') {
    return (
      <div className="flex items-center gap-1.5 bg-surface border border-line rounded-full px-3 py-1.5 text-meta font-bold text-fg-muted hover:text-fg transition-colors">
        <Coins className="w-4 h-4 text-brand-terracotta shrink-0" />
        <span className="font-extrabold text-fg">{formatted}</span>
        <span className="hidden sm:inline text-fg-faint">SCoin</span>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-fg-muted border-b border-line">
        <Coins className="w-4 h-4 text-brand-terracotta shrink-0" />
        <span>Ví SCoin</span>
        <span className="ml-auto font-extrabold text-fg">{formatted}</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3 bg-brand-terracotta/8 border border-brand-terracotta/20 rounded-card px-4 py-3">
      <div className="w-9 h-9 rounded-field bg-brand-terracotta/15 flex items-center justify-center text-brand-terracotta shrink-0">
        <Coins className="w-5 h-5" />
      </div>
      <div className="text-left">
        <span className="text-meta text-brand-text-muted uppercase font-bold tracking-wider">Ví SCoin</span>
        <p className="text-lg font-extrabold text-brand-text leading-tight">
          {formatted} <span className="text-meta font-bold text-brand-text-muted">SCoin</span>
        </p>
      </div>
    </div>
  );
};
