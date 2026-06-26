// =====================================================================
// src/pages/mentor/MentorPayout.tsx — Ví & Rút tiền của mentor.
// Quản lý payout profile (tài khoản nhận tiền) + tạo/xem payout request.
// =====================================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet, Plus, Pencil, Loader2, Landmark, Star, X, AlertTriangle, CheckCircle2, Clock, Send,
  ArrowDownLeft, ArrowUpRight, History, Coins,
} from 'lucide-react';
import { payoutApi, payoutProfileApi, walletApi } from '../../api/payment';
import type {
  MentorPayoutProfile, MentorPayoutProfilePayload, PayoutRequest, PayoutRequestStatus,
  MentorWallet, WalletTransaction,
} from '../../api/types';

const TX_LABELS: Record<string, string> = {
  ISSUE: 'Cộng credit', RESERVE: 'Tạm giữ', CONSUME: 'Trừ thanh toán', RELEASE: 'Hoàn tạm giữ',
  REFUND: 'Hoàn tiền', ADJUSTMENT: 'Điều chỉnh', HOLD: 'Giữ', PAID_OUT: 'Đã chi trả',
  COMMISSION: 'Hoa hồng', VOID: 'Huỷ bút toán',
};

const txLabel = (t: WalletTransaction) => TX_LABELS[t.entryType] || t.entryType;

const STATUS_META: Record<PayoutRequestStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  REQUESTED: { label: 'Chờ duyệt', cls: 'bg-amber-500/12 text-amber-600 border-amber-500/25', icon: <Clock className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-brand-blue/10 text-brand-blue border-brand-blue/25', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PAID: { label: 'Đã chi trả', cls: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-danger/10 text-danger border-danger/20', icon: <X className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Đã huỷ', cls: 'bg-surface-muted text-fg-muted border-line', icon: <X className="w-3.5 h-3.5" /> },
};

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const fmtScoin = (n?: number) => (n ?? 0).toLocaleString('vi-VN');

const EMPTY_PROFILE: MentorPayoutProfilePayload = {
  accountHolderName: '', bankName: '', bankCode: '', accountNumber: '', isDefault: false, isActive: true,
};

export const MentorPayout: React.FC = () => {
  const [profiles, setProfiles] = useState<MentorPayoutProfile[]>([]);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [wallet, setWallet] = useState<MentorWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form payout profile (tạo/sửa)
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<MentorPayoutProfilePayload>(EMPTY_PROFILE);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form payout request
  const [amountScoin, setAmountScoin] = useState<number>(0);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [note, setNote] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);

  const flash = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r, w] = await Promise.all([
        payoutProfileApi.list(),
        payoutApi.listMine(),
        walletApi.getMentorWallet().catch(() => null),
      ]);
      setProfiles(p ?? []);
      setRequests(r ?? []);
      setWallet(w);
      const def = (p ?? []).find((x) => x.isDefault) ?? (p ?? [])[0];
      if (def) setSelectedProfileId((prev) => prev || def.payoutProfileId);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không tải được dữ liệu rút tiền.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreateProfile = () => {
    setEditingProfileId(null);
    setProfileForm({ ...EMPTY_PROFILE, isDefault: profiles.length === 0 });
    setShowProfileForm(true);
  };

  const openEditProfile = (p: MentorPayoutProfile) => {
    setEditingProfileId(p.payoutProfileId);
    setProfileForm({
      accountHolderName: p.accountHolderName,
      bankName: p.bankName,
      bankCode: p.bankCode ?? '',
      accountNumber: '', // BE chỉ trả số đã mask — nhập lại khi sửa.
      isDefault: p.isDefault ?? false,
      isActive: p.isActive ?? true,
    });
    setShowProfileForm(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.accountHolderName.trim() || !profileForm.bankName.trim() || !profileForm.accountNumber.trim()) {
      flash('Vui lòng nhập đủ chủ tài khoản, ngân hàng và số tài khoản.', false);
      return;
    }
    setSavingProfile(true);
    try {
      if (editingProfileId) {
        await payoutProfileApi.update(editingProfileId, profileForm);
        flash('Đã cập nhật tài khoản nhận tiền.', true);
      } else {
        await payoutProfileApi.create(profileForm);
        flash('Đã thêm tài khoản nhận tiền.', true);
      }
      setShowProfileForm(false);
      await load();
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Không lưu được tài khoản nhận tiền.', false);
    } finally {
      setSavingProfile(false);
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountScoin <= 0) { flash('Số SCoin muốn rút phải lớn hơn 0.', false); return; }
    if (wallet && amountScoin > wallet.availableScoin) {
      flash(`Số dư khả dụng chỉ còn ${fmtScoin(wallet.availableScoin)} SCoin.`, false);
      return;
    }
    if (!selectedProfileId) { flash('Vui lòng chọn tài khoản nhận tiền.', false); return; }
    setCreatingRequest(true);
    try {
      await payoutApi.create({ amountScoin, payoutProfileId: selectedProfileId, note: note.trim() || undefined });
      flash('Đã gửi yêu cầu rút tiền.', true);
      setAmountScoin(0);
      setNote('');
      await load();
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Không tạo được yêu cầu rút tiền.', false);
    } finally {
      setCreatingRequest(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 text-left">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-card bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-head font-extrabold text-brand-text">Ví & Rút tiền</h1>
          <p className="text-body font-medium text-brand-text-muted">Quản lý tài khoản nhận tiền và yêu cầu rút SCoin đã tích luỹ.</p>
        </div>
      </header>

      {toast && (
        <div className={`flex items-center gap-2 text-body font-bold px-4 py-3 rounded-card border ${toast.ok ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center text-brand-text-muted"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : error ? (
        <div className="meetmind-card p-6 rounded-card text-danger font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* ---------- Số dư khả dụng ---------- */}
          <section className="meetmind-card p-6 rounded-card md:col-span-2 bg-brand-terracotta/5 border border-brand-terracotta/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-brand-terracotta/15 flex items-center justify-center text-brand-terracotta">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-meta font-bold text-brand-text-muted uppercase tracking-wide">Số dư khả dụng để rút</p>
                <p className="text-2xl font-extrabold text-brand-text">
                  {wallet ? fmtScoin(wallet.availableScoin) : '—'} <span className="text-body text-brand-text-muted">SCoin</span>
                </p>
              </div>
            </div>
            {!wallet && <span className="text-meta font-semibold text-amber-600">Chưa tải được số dư</span>}
          </section>

          {/* ---------- Payout profiles ---------- */}
          <section className="meetmind-card p-6 rounded-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
                <Landmark className="w-5 h-5 text-brand-blue" /> Tài khoản nhận tiền
              </h2>
              <button
                onClick={openCreateProfile}
                className="flex items-center gap-1.5 text-meta font-bold text-brand-terracotta hover:underline"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </div>

            {profiles.length === 0 ? (
              <p className="text-body font-medium text-brand-text-muted py-6 text-center">Chưa có tài khoản nhận tiền nào. Hãy thêm một tài khoản để có thể rút SCoin.</p>
            ) : (
              <div className="space-y-3">
                {profiles.map((p) => (
                  <div key={p.payoutProfileId} className="border border-brand-border rounded-card p-4 flex items-start justify-between gap-3 bg-brand-bg/40">
                    <div className="space-y-0.5">
                      <p className="text-body font-bold text-brand-text flex items-center gap-2">
                        {p.accountHolderName}
                        {p.isDefault && <span className="inline-flex items-center gap-1 text-meta font-bold text-amber-600"><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Mặc định</span>}
                      </p>
                      <p className="text-meta font-semibold text-brand-text-muted">{p.bankName}{p.bankCode ? ` · ${p.bankCode}` : ''}</p>
                      <p className="text-meta font-mono text-brand-text-muted">{p.accountNumberMasked || '••••'}</p>
                      {p.isActive === false && <p className="text-meta font-bold text-danger">Ngừng hoạt động</p>}
                    </div>
                    <button onClick={() => openEditProfile(p)} className="p-1.5 rounded-field text-brand-text-muted hover:text-brand-text hover:bg-surface-muted">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---------- Tạo payout request ---------- */}
          <section className="meetmind-card p-6 rounded-card space-y-4">
            <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-terracotta" /> Yêu cầu rút tiền
            </h2>
            <form onSubmit={createRequest} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-meta font-bold text-brand-text-muted">Số SCoin muốn rút</label>
                  {wallet && wallet.availableScoin > 0 && (
                    <button type="button" onClick={() => setAmountScoin(wallet.availableScoin)}
                      className="text-meta font-bold text-brand-terracotta hover:underline">
                      Tối đa {fmtScoin(wallet.availableScoin)}
                    </button>
                  )}
                </div>
                <input
                  type="number" min={1} value={amountScoin || ''}
                  onChange={(e) => setAmountScoin(Number(e.target.value))}
                  placeholder="VD: 500"
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-bold text-brand-text focus:border-brand-terracotta outline-none"
                />
                {wallet && amountScoin > wallet.availableScoin && (
                  <p className="text-meta font-bold text-danger mt-1">Vượt quá số dư khả dụng ({fmtScoin(wallet.availableScoin)} SCoin).</p>
                )}
              </div>
              <div>
                <label className="text-meta font-bold text-brand-text-muted block mb-1.5">Tài khoản nhận</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none cursor-pointer"
                >
                  <option value="">— Chọn tài khoản —</option>
                  {profiles.filter((p) => p.isActive !== false).map((p) => (
                    <option key={p.payoutProfileId} value={p.payoutProfileId}>
                      {p.accountHolderName} · {p.bankName} {p.accountNumberMasked || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-meta font-bold text-brand-text-muted block mb-1.5">Ghi chú (tuỳ chọn)</label>
                <input
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú cho admin"
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={creatingRequest || profiles.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {creatingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi yêu cầu
              </button>
              {profiles.length === 0 && (
                <p className="text-meta font-semibold text-amber-600 text-center">Cần thêm tài khoản nhận tiền trước khi rút.</p>
              )}
            </form>
          </section>

          {/* ---------- Lịch sử payout request ---------- */}
          <section className="meetmind-card p-6 rounded-card space-y-4 md:col-span-2">
            <h2 className="text-body font-extrabold text-brand-text">Lịch sử yêu cầu rút tiền</h2>
            {requests.length === 0 ? (
              <p className="text-body font-medium text-brand-text-muted py-6 text-center">Chưa có yêu cầu rút tiền nào.</p>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <div key={r.payoutRequestId} className="border border-brand-border rounded-card p-4 flex flex-wrap items-center justify-between gap-3 bg-brand-bg/40">
                      <div className="space-y-0.5">
                        <p className="text-body font-extrabold text-brand-text">{fmtScoin(r.amountScoin)} SCoin</p>
                        <p className="text-meta font-semibold text-brand-text-muted">
                          {r.bankNameSnapshot || '—'} · {r.bankAccountNumberMaskedSnapshot || '••••'}
                        </p>
                        <p className="text-meta text-brand-text-muted">Tạo: {fmtDate(r.requestedAt)}</p>
                        {r.adminNote && <p className="text-meta text-brand-text-muted">Ghi chú admin: {r.adminNote}</p>}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-meta font-bold py-1 px-2.5 rounded-lg border ${meta.cls}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------- Lịch sử giao dịch ví ---------- */}
          <section className="meetmind-card p-6 rounded-card space-y-4 md:col-span-2">
            <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
              <History className="w-5 h-5 text-brand-blue" /> Giao dịch ví gần đây
            </h2>
            {!wallet || wallet.recentTransactions.length === 0 ? (
              <p className="text-body font-medium text-brand-text-muted py-6 text-center">Chưa có giao dịch nào.</p>
            ) : (
              <div className="divide-y divide-brand-border">
                {wallet.recentTransactions.map((tx) => {
                  const credit = tx.balanceEffectScoin >= 0;
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${credit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-body font-bold text-brand-text truncate">{txLabel(tx)}</p>
                          <p className="text-meta text-brand-text-muted truncate">{tx.memo || fmtDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`text-body font-extrabold shrink-0 ${credit ? 'text-success' : 'text-danger'}`}>
                        {credit ? '+' : '−'}{fmtScoin(Math.abs(tx.balanceEffectScoin))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ---------- Modal payout profile ---------- */}
      {showProfileForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative">
            <button onClick={() => setShowProfileForm(false)} className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-brand-text mb-4">{editingProfileId ? 'Sửa tài khoản nhận tiền' : 'Thêm tài khoản nhận tiền'}</h3>
            <form onSubmit={saveProfile} className="space-y-3">
              <div>
                <label className="text-meta font-bold text-brand-text-muted block mb-1.5">Tên chủ tài khoản *</label>
                <input value={profileForm.accountHolderName} onChange={(e) => setProfileForm({ ...profileForm, accountHolderName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-meta font-bold text-brand-text-muted block mb-1.5">Ngân hàng *</label>
                  <input value={profileForm.bankName} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
                </div>
                <div>
                  <label className="text-meta font-bold text-brand-text-muted block mb-1.5">Mã NH</label>
                  <input value={profileForm.bankCode} onChange={(e) => setProfileForm({ ...profileForm, bankCode: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
                </div>
              </div>
              <div>
                <label className="text-meta font-bold text-brand-text-muted block mb-1.5">Số tài khoản *</label>
                <input value={profileForm.accountNumber} onChange={(e) => setProfileForm({ ...profileForm, accountNumber: e.target.value })}
                  placeholder={editingProfileId ? 'Nhập lại số tài khoản' : ''}
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
              </div>
              <label className="flex items-center gap-2 text-body font-semibold text-brand-text cursor-pointer">
                <input type="checkbox" checked={!!profileForm.isDefault} onChange={(e) => setProfileForm({ ...profileForm, isDefault: e.target.checked })} />
                Đặt làm tài khoản mặc định
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProfileForm(false)} className="text-body font-bold text-brand-text-muted hover:text-brand-text px-4 py-2.5">Huỷ</button>
                <button type="submit" disabled={savingProfile}
                  className="flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field disabled:opacity-50">
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
