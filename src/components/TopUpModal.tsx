// =====================================================================
// src/components/TopUpModal.tsx — Nạp SCoin vào ví credit qua PayOS.
// Mentee chọn/nhập số SCoin muốn nạp (1 SCoin = 1 VND), FE gọi BE tạo
// phiên thanh toán rồi redirect sang PayOS. Webhook PayOS sẽ cộng ví.
// =====================================================================
import React, { useState } from 'react';
import { X, Coins, Loader2, ExternalLink, AlertTriangle, Wallet } from 'lucide-react';
import { walletApi } from '../api/payment';

interface TopUpModalProps {
  /** Số dư SCoin hiện tại (để hiển thị). */
  currentScoin?: number | null;
  /** Số SCoin gợi ý nạp (vd phần còn thiếu của một booking). */
  suggestedScoin?: number;
  onClose: () => void;
}

const PRESETS = [100, 200, 500, 1000];
const MIN_SCOIN = 10;
const fmt = (n: number) => n.toLocaleString('vi-VN');

export const TopUpModal: React.FC<TopUpModalProps> = ({ currentScoin, suggestedScoin, onClose }) => {
  const initial = suggestedScoin && suggestedScoin > 0 ? suggestedScoin : 100;
  const [amount, setAmount] = useState<number>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = Number.isFinite(amount) && amount >= MIN_SCOIN;

  const handleTopUp = async () => {
    if (!valid) {
      setError(`Số SCoin nạp tối thiểu là ${fmt(MIN_SCOIN)}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await walletApi.topUp(amount);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setError('Không nhận được liên kết thanh toán từ cổng PayOS. Vui lòng thử lại.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo phiên nạp tiền. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-md rounded-card shadow-2xl border border-line overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-body font-extrabold text-fg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-terracotta" /> Nạp tiền vào ví
          </h3>
          <button onClick={onClose} className="p-1 rounded-field hover:bg-surface-muted text-fg-muted hover:text-fg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {currentScoin != null && (
            <div className="flex items-center gap-2 text-meta font-bold text-brand-text-muted bg-brand-bg/40 border border-brand-border rounded-field px-3 py-2">
              <Coins className="w-4 h-4 text-brand-blue" />
              Số dư hiện tại: <span className="text-brand-text">{fmt(currentScoin)} SCoin</span>
            </div>
          )}

          {/* Preset nhanh */}
          <div>
            <label className="text-meta font-bold text-fg-muted mb-1.5 block">Chọn nhanh số SCoin</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setAmount(p); setError(null); }}
                  className={`py-2.5 rounded-field text-meta font-extrabold border transition-all active:scale-95 ${
                    amount === p
                      ? 'border-brand-terracotta bg-brand-terracotta/10 text-brand-terracotta'
                      : 'border-line bg-surface text-fg-muted hover:border-brand-terracotta/40'
                  }`}
                >
                  {fmt(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Nhập tuỳ ý */}
          <div>
            <label className="text-meta font-bold text-fg-muted mb-1.5 block">Hoặc nhập số SCoin</label>
            <div className="relative">
              <input
                type="number"
                min={MIN_SCOIN}
                value={Number.isFinite(amount) ? amount : ''}
                onChange={(e) => { setAmount(Math.max(0, Math.floor(Number(e.target.value)))); setError(null); }}
                className="w-full px-3 py-2.5 pr-16 rounded-field border border-brand-border bg-surface text-body font-bold text-fg focus:border-brand-terracotta outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-meta font-bold text-fg-faint">SCoin</span>
            </div>
            <p className="text-meta text-fg-faint mt-1">Thanh toán qua PayOS: <span className="font-bold text-fg-muted">≈ {fmt(valid ? amount : 0)}đ</span> (1 SCoin = 1đ).</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-meta font-bold text-danger bg-danger/10 border border-danger/20 rounded-field px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-body font-bold text-fg-muted hover:text-fg px-4 py-2.5 rounded-field disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleTopUp}
            disabled={submitting || !valid}
            className="flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Nạp qua PayOS
          </button>
        </div>
      </div>
    </div>
  );
};
