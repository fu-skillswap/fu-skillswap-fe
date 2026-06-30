// =====================================================================
// src/api/payment.ts — Payment checkout (PayOS), mentor payout & profiles
// Module payment BE mới: SCoin + PayOS Hosted Payment Link.
// =====================================================================
import { http } from './http';
import type {
  PaymentCheckout,
  MentorPayoutProfile,
  MentorPayoutProfilePayload,
  PayoutRequest,
  PayoutRequestPayload,
  CreditWallet,
  MentorWallet,
  WalletTopUp,
} from './types';

export const paymentApi = {
  /**
   * POST /api/me/payment-orders/checkout — tạo payment order cho booking đã sẵn sàng
   * thanh toán. BE tự áp coupon/credit rồi trả `checkoutUrl` PayOS để FE redirect.
   */
  checkout: (bookingId: string, couponCode?: string) =>
    http.post<PaymentCheckout>('/api/me/payment-orders/checkout', {
      bookingId,
      couponCode: couponCode?.trim() || undefined,
    }),

  /**
   * GET /api/me/payment-orders/{bookingId} — poll trạng thái payment order theo booking.
   * Trả 404 nếu booking chưa từng được checkout (FE coi như chưa có order).
   */
  getByBooking: (bookingId: string) =>
    http.get<PaymentCheckout>(`/api/me/payment-orders/${bookingId}`),
};

export const walletApi = {
  /** GET /api/me/credit-wallet — số dư ví Scoin của mentee + 15 giao dịch gần nhất. */
  getCreditWallet: () => http.get<CreditWallet>('/api/me/credit-wallet'),

  /** GET /api/me/mentor-wallet — settlement earnings của mentor + 15 giao dịch gần nhất. */
  getMentorWallet: () => http.get<MentorWallet>('/api/me/mentor-wallet'),

  /**
   * POST /api/me/credit-wallet/top-up — tạo phiên nạp SCoin vào ví qua PayOS.
   * BE tạo Hosted Payment Link, trả `checkoutUrl` để FE redirect; webhook PayOS
   * cộng SCoin vào ví khi thanh toán thành công. (1 SCoin = 1 VND)
   * Lưu ý: endpoint này là contract FE — chờ BE hiện thực.
   */
  topUp: (amountScoin: number) =>
    http.post<WalletTopUp>('/api/me/credit-wallet/top-up', { amountScoin }),
};

export const payoutProfileApi = {
  /** GET /api/mentor/payout-profiles — danh sách tài khoản nhận tiền của mentor. */
  list: () => http.get<MentorPayoutProfile[]>('/api/mentor/payout-profiles'),

  /** POST /api/mentor/payout-profiles — tạo tài khoản nhận tiền mới. */
  create: (payload: MentorPayoutProfilePayload) =>
    http.post<MentorPayoutProfile>('/api/mentor/payout-profiles', payload),

  /** PUT /api/mentor/payout-profiles/{payoutProfileId} — cập nhật tài khoản nhận tiền. */
  update: (payoutProfileId: string, payload: MentorPayoutProfilePayload) =>
    http.put<MentorPayoutProfile>(`/api/mentor/payout-profiles/${payoutProfileId}`, payload),
};

export const payoutApi = {
  /** GET /api/mentor/payout-requests — lịch sử yêu cầu rút tiền của mentor. */
  listMine: () => http.get<PayoutRequest[]>('/api/mentor/payout-requests'),

  /** POST /api/mentor/payout-requests — tạo yêu cầu rút settlement balance. */
  create: (payload: PayoutRequestPayload) =>
    http.post<PayoutRequest>('/api/mentor/payout-requests', payload),
};
