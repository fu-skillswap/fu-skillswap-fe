// =====================================================================
// src/pages/PaymentReturn.tsx — Landing sau khi PayOS redirect về.
// PayOS đính kèm query (?code, status, orderCode, cancel). Webhook mới là
// nguồn chốt PAID, nên trang này chỉ báo trạng thái và đưa user về Lịch.
// =====================================================================
import React from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';

export const PaymentReturn: React.FC = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const cancelled =
    location.pathname.includes('cancel') ||
    params.get('cancel') === 'true' ||
    params.get('status') === 'CANCELLED';
  const success = !cancelled && (params.get('code') === '00' || params.get('status') === 'PAID');

  const view = cancelled
    ? { icon: <XCircle className="w-14 h-14 text-danger" />, title: 'Thanh toán đã huỷ', desc: 'Bạn đã huỷ phiên thanh toán. Có thể thử lại bất cứ lúc nào trong mục Lịch của tôi.' }
    : success
      ? { icon: <CheckCircle2 className="w-14 h-14 text-success" />, title: 'Thanh toán thành công', desc: 'Cảm ơn bạn! Hệ thống đang xác nhận giao dịch. Trạng thái buổi học sẽ được cập nhật trong giây lát.' }
      : { icon: <Clock className="w-14 h-14 text-brand-blue" />, title: 'Đang xử lý thanh toán', desc: 'Giao dịch của bạn đang được xác nhận. Vui lòng kiểm tra lại trạng thái trong mục Lịch của tôi.' };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="meetmind-card max-w-md w-full text-center p-8 rounded-card space-y-4">
        <div className="flex justify-center">{view.icon}</div>
        <h1 className="text-head font-extrabold text-brand-text">{view.title}</h1>
        <p className="text-body font-medium text-brand-text-muted leading-relaxed">{view.desc}</p>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field transition-all active:scale-95"
        >
          Về Lịch của tôi <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
