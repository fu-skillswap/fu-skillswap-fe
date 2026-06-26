// =====================================================================
// src/components/PaymentModal.tsx — Mentee thanh toán booking qua PayOS.
// Hiển thị bảng giá (SCoin), nhập coupon, redirect sang PayOS hoặc báo
// đã thanh toán khi credit/campaign phủ hết.
// =====================================================================
import React, { useEffect, useState } from 'react';
import { X, Coins, Ticket, Loader2, CheckCircle2, AlertTriangle, ExternalLink, Wallet } from 'lucide-react';
import { paymentApi, walletApi } from '../api/payment';
import type { PaymentCheckout } from '../api/types';

interface PaymentModalProps {
  bookingId: string;
  serviceTitle?: string;
  /** Giá snapshot của service (SCoin) để hiển thị khi chưa có payment order. */
  basePriceScoin?: number;
  onClose: () => void;
  /** Gọi khi order đã PAID (được credit/campaign phủ hết) để parent refresh. */
  onPaid: () => void;
}

const fmtScoin = (n?: number) => (n ?? 0).toLocaleString('vi-VN');
const fmtVnd = (n?: number) => (n ?? 0).toLocaleString('vi-VN');

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bookingId, serviceTitle, basePriceScoin, onClose, onPaid,
}) => {
  const [order, setOrder] = useState<PaymentCheckout | null>(null);
  const [walletScoin, setWalletScoin] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Nạp trạng thái order hiện tại (nếu đã từng checkout) + số dư ví credit.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const existing = await paymentApi.getByBooking(bookingId);
        if (alive) setOrder(existing);
      } catch {
        // 404 = chưa có order — bỏ qua, sẽ tạo khi bấm thanh toán.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    // Ví credit chỉ dùng để hiển thị; lỗi (vd không có role MENTEE) thì ẩn.
    walletApi.getCreditWallet()
      .then((w) => { if (alive) setWalletScoin(w.availableScoin); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bookingId]);

  const handlePay = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await paymentApi.checkout(bookingId, coupon);
      setOrder(result);
      if (result.status === 'PAID') {
        onPaid();
        return;
      }
      if (result.checkoutUrl) {
        // Redirect sang trang thanh toán PayOS.
        window.location.href = result.checkoutUrl;
        return;
      }
      setError('Không nhận được liên kết thanh toán từ cổng PayOS. Vui lòng thử lại.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tạo phiên thanh toán. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const base = order?.basePriceScoin ?? basePriceScoin ?? 0;
  const couponDiscount = order?.couponDiscountScoin ?? 0;
  const campaignCredit = order?.campaignCreditAppliedScoin ?? 0;
  const userCredit = order?.userCreditAppliedScoin ?? 0;
  const remainingScoin = order?.remainingPayableScoin ?? base;
  const remainingVnd = order?.remainingPayableVnd;
  const isPaid = order?.status === 'PAID';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-md rounded-card shadow-2xl border border-line overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-body font-extrabold text-fg flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-terracotta" /> Thanh toán buổi học
          </h3>
          <button onClick={onClose} className="p-1 rounded-field hover:bg-surface-muted text-fg-muted hover:text-fg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {serviceTitle && (
            <p className="text-meta font-bold text-brand-terracotta">{serviceTitle}</p>
          )}

          {walletScoin != null && (
            <div className="flex items-center gap-2 text-meta font-bold text-brand-text-muted bg-brand-bg/40 border border-brand-border rounded-field px-3 py-2">
              <Wallet className="w-4 h-4 text-brand-blue" />
              Ví credit của bạn: <span className="text-brand-text">{walletScoin.toLocaleString('vi-VN')} SCoin</span>
              <span className="text-fg-faint font-semibold">(tự động trừ khi thanh toán)</span>
            </div>
          )}

          {loading ? (
            <div className="py-10 flex justify-center text-fg-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : isPaid ? (
            <div className="py-8 flex flex-col items-center gap-2 text-success">
              <CheckCircle2 className="w-12 h-12" />
              <p className="text-body font-bold">Buổi học đã được thanh toán</p>
            </div>
          ) : (
            <>
              {/* Bảng giá */}
              <div className="space-y-2 bg-brand-bg/40 border border-brand-border rounded-card p-4 text-meta font-semibold">
                <div className="flex justify-between text-brand-text">
                  <span>Giá dịch vụ</span>
                  <span className="font-bold">{fmtScoin(base)} SCoin</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Giảm giá coupon</span>
                    <span className="font-bold">- {fmtScoin(couponDiscount)} SCoin</span>
                  </div>
                )}
                {campaignCredit > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Khuyến mãi (campaign)</span>
                    <span className="font-bold">- {fmtScoin(campaignCredit)} SCoin</span>
                  </div>
                )}
                {userCredit > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Trừ vào ví SCoin</span>
                    <span className="font-bold">- {fmtScoin(userCredit)} SCoin</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-text pt-2 mt-1 border-t border-brand-border">
                  <span className="font-extrabold">Còn phải trả</span>
                  <span className="font-extrabold text-brand-terracotta">
                    {fmtScoin(remainingScoin)} SCoin
                    {remainingVnd != null && remainingVnd > 0 && (
                      <span className="text-fg-muted font-bold"> (≈ {fmtVnd(remainingVnd)}đ)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              <div>
                <label className="text-meta font-bold text-fg-muted flex items-center gap-1.5 mb-1.5">
                  <Ticket className="w-3.5 h-3.5" /> Mã giảm giá (nếu có)
                </label>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Nhập mã coupon"
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-fg focus:border-brand-terracotta outline-none uppercase"
                />
                <p className="text-meta text-fg-faint mt-1">Coupon sẽ được áp khi tạo phiên thanh toán.</p>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 text-meta font-bold text-danger bg-danger/10 border border-danger/20 rounded-field px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          {isPaid ? (
            <button
              onClick={() => { onPaid(); }}
              className="bg-success hover:opacity-90 text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-95"
            >
              Hoàn tất
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={submitting}
                className="text-body font-bold text-fg-muted hover:text-fg px-4 py-2.5 rounded-field disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handlePay}
                disabled={loading || submitting}
                className="flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Thanh toán qua PayOS
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
