import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Calendar, Clock, Check, AlertCircle, Loader2, Repeat } from 'lucide-react';
import { availabilityApi } from '../../api/availability';
import type {
  AvailabilityRule, AvailabilityRuleType, AvailabilityRepeatType, UpsertAvailabilityRulePayload,
} from '../../api/types';

// BE quản lý lịch rảnh theo "rule" lặp (OPEN/CLOSED + repeat NONE/DAILY/WEEKLY),
// không phải từng slot ngày riêng lẻ. Trang này thao tác trực tiếp trên rule thật.
const WEEKDAYS: { value: string; label: string }[] = [
  { value: 'MONDAY', label: 'T2' },
  { value: 'TUESDAY', label: 'T3' },
  { value: 'WEDNESDAY', label: 'T4' },
  { value: 'THURSDAY', label: 'T5' },
  { value: 'FRIDAY', label: 'T6' },
  { value: 'SATURDAY', label: 'T7' },
  { value: 'SUNDAY', label: 'CN' },
];
const DAY_LABEL: Record<string, string> = Object.fromEntries(WEEKDAYS.map((d) => [d.value, d.label]));

const REPEAT_LABEL: Record<AvailabilityRepeatType, string> = {
  NONE: 'Một ngày cụ thể',
  DAILY: 'Hằng ngày',
  WEEKLY: 'Theo thứ trong tuần',
};

export const AvailabilitySlots: React.FC = () => {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Form state
  const [ruleType, setRuleType] = useState<AvailabilityRuleType>('OPEN');
  const [repeatType, setRepeatType] = useState<AvailabilityRepeatType>('WEEKLY');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const flashSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await availabilityApi.list();
      setRules(list ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được danh sách lịch rảnh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDay = (value: string) => {
    setDaysOfWeek((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (startTime >= endTime) {
      setError('Giờ bắt đầu phải trước giờ kết thúc.');
      return;
    }
    if (repeatType === 'WEEKLY' && daysOfWeek.length === 0) {
      setError('Vui lòng chọn ít nhất một thứ trong tuần.');
      return;
    }
    if (repeatType === 'NONE' && !effectiveFrom) {
      setError('Vui lòng chọn ngày áp dụng.');
      return;
    }

    const payload: UpsertAvailabilityRulePayload = {
      ruleType,
      repeatType,
      daysOfWeek: repeatType === 'WEEKLY' ? daysOfWeek : undefined,
      effectiveFrom: effectiveFrom || undefined,
      effectiveTo: repeatType === 'NONE' ? (effectiveFrom || undefined) : (effectiveTo || undefined),
      startTime,
      endTime,
      note: note || undefined,
    };

    setBusy(true);
    try {
      await availabilityApi.create(payload);
      flashSuccess('Đã thêm quy tắc lịch rảnh thành công!');
      setDaysOfWeek([]);
      setEffectiveFrom('');
      setEffectiveTo('');
      setStartTime('');
      setEndTime('');
      setNote('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Thêm quy tắc lịch rảnh thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setBusy(true);
    try {
      await availabilityApi.remove(ruleId);
      flashSuccess('Đã xoá quy tắc lịch rảnh.');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Xoá quy tắc thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const describeRule = (r: AvailabilityRule) => {
    if (r.repeatType === 'WEEKLY' && r.daysOfWeek?.length) {
      return r.daysOfWeek.map((d) => DAY_LABEL[d] || d).join(', ');
    }
    if (r.repeatType === 'NONE') return r.effectiveFrom || 'Ngày cụ thể';
    return REPEAT_LABEL[r.repeatType];
  };

  return (
    <div className="space-y-6 text-left">

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <Calendar className="w-8 h-8 text-brand-terracotta" /> Quản lý khung giờ rảnh
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Thiết lập quy tắc lịch rảnh lặp lại để hệ thống tự sinh khung giờ cho sinh viên (mentee) đặt lịch.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-500/5 border border-red-200 text-red-600 p-4 rounded-field text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-green-500/5 border border-green-200 text-green-600 p-4 rounded-field text-body font-semibold">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Rule Creator Form */}
        <div className="lg:col-span-1">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold font-serif text-brand-text mb-4">Thêm quy tắc lịch rảnh</h3>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Loại quy tắc</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as AvailabilityRuleType)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                >
                  <option value="OPEN">Mở lịch rảnh (nhận đặt)</option>
                  <option value="CLOSED">Chặn lịch (không nhận đặt)</option>
                </select>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Lặp lại</label>
                <select
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as AvailabilityRepeatType)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                >
                  <option value="WEEKLY">Theo thứ trong tuần</option>
                  <option value="DAILY">Hằng ngày</option>
                  <option value="NONE">Một ngày cụ thể</option>
                </select>
              </div>

              {repeatType === 'WEEKLY' && (
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Các thứ áp dụng</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => {
                      const on = daysOfWeek.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={`text-meta font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${on ? 'bg-brand-terracotta/15 text-brand-terracotta border-brand-terracotta/30' : 'bg-surface border-brand-border text-brand-text-muted hover:bg-brand-bg'}`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {repeatType === 'NONE' && (
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Ngày áp dụng</label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                  />
                </div>
              )}

              {(repeatType === 'WEEKLY' || repeatType === 'DAILY') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Đến ngày</label>
                    <input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Ghi chú (tuỳ chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Ưu tiên hỗ trợ đồ án"
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm quy tắc
              </button>
            </form>
          </div>
        </div>

        {/* Rule List */}
        <div className="lg:col-span-2">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold font-serif text-brand-text mb-4">Danh sách quy tắc lịch rảnh</h3>

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-terracotta" /></div>
            ) : rules.length === 0 ? (
              <div className="py-12 text-center text-brand-text-muted font-semibold text-body">
                Bạn chưa có quy tắc lịch rảnh nào. Vui lòng thiết lập ở form bên cạnh.
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((r) => (
                  <div
                    key={r.ruleId}
                    className="flex items-center justify-between p-4 bg-brand-bg/40 border border-brand-border rounded-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-field bg-surface border border-brand-border flex items-center justify-center shadow-sm ${r.ruleType === 'OPEN' ? 'text-brand-terracotta' : 'text-red-500'}`}>
                        {r.repeatType === 'NONE' ? <Clock className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <span className="text-body font-bold text-brand-text block">
                          {r.startTime?.slice(0, 5)} - {r.endTime?.slice(0, 5)}
                        </span>
                        <span className="text-meta text-brand-text-muted font-semibold">
                          {REPEAT_LABEL[r.repeatType]} · {describeRule(r)}
                        </span>
                        {r.note && <span className="text-meta text-brand-text-muted font-medium block">{r.note}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-meta font-bold py-0.5 px-2 rounded-lg ${r.ruleType === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {r.ruleType === 'OPEN' ? 'Mở lịch' : 'Chặn lịch'}
                      </span>
                      <button
                        onClick={() => handleDeleteRule(r.ruleId)}
                        disabled={busy}
                        className="p-2 text-brand-text-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-field disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Xoá quy tắc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
