import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Calendar, Clock, Check, AlertCircle, Loader2, Repeat, Pencil, X, AlertTriangle } from 'lucide-react';
import { availabilityApi } from '../../api/availability';
import { mentorServicesApi } from '../../api/mentorServices';
import type {
  AvailabilityRule, AvailabilityRuleType, AvailabilityRepeatType, UpsertAvailabilityRulePayload,
  MentorServiceItem,
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

const getErrorMessage = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message || e.defaultMessage || JSON.stringify(e)).join(', ');
    }
    if (typeof data.errors === 'object') {
      return Object.entries(data.errors).map(([key, val]) => `${key}: ${val}`).join(', ');
    }
  }
  return JSON.stringify(data);
};

const friendlyError = (msg: string): string => {
  if (!msg) return 'Có lỗi xảy ra khi lưu lịch rảnh.';
  
  const lower = msg.toLowerCase();
  
  // Rule conflicts
  if (lower.includes('overlap') || lower.includes('conflict') || lower.includes('chồng lấn') || lower.includes('trùng')) {
    return 'Khung giờ này đã bị trùng lặp hoặc chồng chéo với một quy tắc lịch rảnh khác của bạn. Vui lòng chọn thời gian khác hoặc kiểm tra lại các quy tắc đã tạo.';
  }
  
  // Required fields mapped specifically to Vietnamese non-tech instructions
  if (lower.includes('serviceid') || lower.includes('service_id')) {
    return 'Vui lòng chọn khóa học áp dụng cho quy tắc lịch rảnh này (đây là thông tin bắt buộc để học viên có thể đặt lịch đúng lớp).';
  }
  if (lower.includes('ruletype') || lower.includes('rule_type')) {
    return 'Vui lòng chọn loại quy tắc (Mở lịch rảnh để học viên đặt, hoặc Chặn lịch để đánh dấu bận/nghỉ).';
  }
  if (lower.includes('repeattype') || lower.includes('repeat_type')) {
    return 'Vui lòng chọn kiểu lặp lại lịch (Lặp theo thứ hàng tuần, Hằng ngày, hoặc Một ngày cụ thể).';
  }
  if (lower.includes('starttime') || lower.includes('start_time')) {
    return 'Vui lòng nhập giờ bắt đầu hợp lệ cho khung giờ rảnh.';
  }
  if (lower.includes('endtime') || lower.includes('end_time')) {
    return 'Vui lòng nhập giờ kết thúc hợp lệ cho khung giờ rảnh.';
  }
  if (lower.includes('effectivefrom') || lower.includes('effective_from')) {
    return 'Vui lòng chọn ngày bắt đầu áp dụng quy tắc lịch rảnh này.';
  }
  if (lower.includes('effectiveto') || lower.includes('effective_to')) {
    return 'Vui lòng chọn ngày kết thúc áp dụng quy tắc lịch rảnh này.';
  }
  if (lower.includes('daysofweek') || lower.includes('days_of_week') || lower.includes('days of week')) {
    return 'Vui lòng chọn ít nhất một thứ trong tuần (T2 - CN) để áp dụng quy tắc lặp lại.';
  }
  if (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('token') || lower.includes('hết hạn')) {
    return 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (lower.includes('service not found') || lower.includes('khóa học không tồn tại')) {
    return 'Khóa học được chọn không tồn tại hoặc đã bị xóa. Vui lòng tải lại trang và chọn khóa học khác.';
  }
  if (lower.includes('rule not found') || lower.includes('không tìm thấy quy tắc')) {
    return 'Quy tắc lịch rảnh này không tồn tại hoặc đã bị xóa trước đó. Vui lòng làm mới trang.';
  }
  
  return msg;
};


export const AvailabilitySlots: React.FC = () => {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [services, setServices] = useState<MentorServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Editing state
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<AvailabilityRule | null>(null);

  // Form state
  const [ruleType, setRuleType] = useState<AvailabilityRuleType>('OPEN');
  const [serviceId, setServiceId] = useState('');
  const [repeatType, setRepeatType] = useState<AvailabilityRepeatType>('WEEKLY');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const dismissTimer = setTimeout(() => {
        setToastVisible(false);
      }, 4000);
      return () => clearTimeout(dismissTimer);
    }
  }, [toastVisible]);

  useEffect(() => {
    if (!toastVisible && toast) {
      const cleanTimer = setTimeout(() => {
        setToast(null);
      }, 300);
      return () => clearTimeout(cleanTimer);
    }
  }, [toastVisible, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, srvList] = await Promise.all([
        availabilityApi.list(),
        mentorServicesApi.list()
      ]);
      setRules(list ?? []);
      
      const activeServices = (srvList ?? []).filter(s => s.active);
      setServices(activeServices);
      
      // Auto select the first service if not already selected
      if (activeServices.length > 0) {
        setServiceId(prev => prev || activeServices[0].serviceId);
      }
    } catch (err: any) {
      const serverMsg = getErrorMessage(err) || 'Không tải được danh sách lịch rảnh.';
      triggerToast(friendlyError(serverMsg), 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDay = (value: string) => {
    setDaysOfWeek((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const handleStartEdit = (r: AvailabilityRule) => {
    setEditingRuleId(r.ruleId);
    setRuleType(r.ruleType);
    setRepeatType(r.repeatType);
    setDaysOfWeek(r.daysOfWeek ?? []);
    setEffectiveFrom(r.effectiveFrom ?? '');
    setEffectiveTo(r.effectiveTo ?? '');
    setStartTime(r.startTime ? r.startTime.slice(0, 5) : '');
    setEndTime(r.endTime ? r.endTime.slice(0, 5) : '');
    setNote(r.note ?? '');
    setServiceId(r.serviceId || (services.length > 0 ? services[0].serviceId : ''));
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setRuleType('OPEN');
    setRepeatType('WEEKLY');
    setDaysOfWeek([]);
    setEffectiveFrom('');
    setEffectiveTo('');
    setStartTime('');
    setEndTime('');
    setNote('');
    if (services.length > 0) {
      setServiceId(services[0].serviceId);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      triggerToast('Giờ bắt đầu phải trước giờ kết thúc.', 'danger');
      return;
    }
    if (!serviceId) {
      triggerToast('Vui lòng chọn khóa học/dịch vụ áp dụng.', 'danger');
      return;
    }
    if (repeatType === 'WEEKLY' && daysOfWeek.length === 0) {
      triggerToast('Vui lòng chọn ít nhất một thứ trong tuần.', 'danger');
      return;
    }
    if (repeatType === 'NONE' && !effectiveFrom) {
      triggerToast('Vui lòng chọn ngày áp dụng.', 'danger');
      return;
    }

    const payload: UpsertAvailabilityRulePayload = {
      ruleType,
      serviceId: serviceId || undefined,
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
      if (editingRuleId) {
        await availabilityApi.update(editingRuleId, payload);
        triggerToast('Đã cập nhật quy tắc lịch rảnh thành công!', 'success');
        setEditingRuleId(null);
      } else {
        await availabilityApi.create(payload);
        triggerToast('Đã thêm quy tắc lịch rảnh thành công!', 'success');
      }
      setDaysOfWeek([]);
      setEffectiveFrom('');
      setEffectiveTo('');
      setStartTime('');
      setEndTime('');
      setNote('');
      await load();
    } catch (err: any) {
      const serverMsg = getErrorMessage(err) || (editingRuleId ? 'Cập nhật quy tắc thất bại.' : 'Thêm quy tắc lịch rảnh thất bại.');
      triggerToast(friendlyError(serverMsg), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setBusy(true);
    try {
      await availabilityApi.remove(ruleId);
      triggerToast('Đã xoá quy tắc lịch rảnh.', 'success');
      if (editingRuleId === ruleId) {
        handleCancelEdit();
      }
      await load();
    } catch (err: any) {
      const serverMsg = getErrorMessage(err) || 'Xoá quy tắc thất bại.';
      triggerToast(friendlyError(serverMsg), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const getServiceDisplayTitle = (ruleServiceId?: string) => {
    if (!ruleServiceId) return '';
    const s = services.find((x) => x.serviceId === ruleServiceId);
    if (!s) return `Khóa học (#${ruleServiceId.slice(0, 6)})`;
    const match = s.title.match(/^\[(.*?)\]\s*(.*)$/);
    return match ? `${match[1]} - ${match[2]}` : s.title;
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

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg p-4 shadow-lg text-white w-96 transition-all duration-300 ease-in-out ${
            toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'
          } ${
            toast.type === 'success' 
              ? 'bg-success' 
              : 'bg-danger'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="font-bold text-sm leading-none mb-1 text-white">
              {toast.type === 'success' ? 'Thành công' : 'Thất bại'}
            </div>
            <div className="text-xs text-white/90 leading-tight break-words font-medium">{toast.message}</div>
          </div>
          <button
            onClick={() => setToastVisible(false)}
            className="text-white/80 hover:text-white shrink-0 focus:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Rule Creator Form */}
        <div className="lg:col-span-1">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold font-serif text-brand-text mb-4">
              {editingRuleId ? 'Chỉnh sửa quy tắc lịch rảnh' : 'Thêm quy tắc lịch rảnh'}
            </h3>

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

              <div className="animate-fadeIn">
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Khóa học áp dụng</label>
                {services.length === 0 ? (
                  <div className="text-meta text-red-500 font-semibold p-2.5 bg-red-50 rounded-field border border-red-200">
                    Bạn không có khóa học nào đang hoạt động. Vui lòng tạo và kích hoạt ít nhất một khóa học trước.
                  </div>
                ) : (
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                  >
                    {services.map((s) => {
                      const match = s.title.match(/^\[(.*?)\]\s*(.*)$/);
                      const displayTitle = match ? `${match[1]} - ${match[2]}` : s.title;
                      return (
                        <option key={s.serviceId} value={s.serviceId}>
                          {displayTitle}
                        </option>
                      );
                    })}
                  </select>
                )}
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

              {editingRuleId ? (
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Cập nhật
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={busy}
                    className="flex-1 bg-surface border border-brand-border hover:bg-brand-bg text-brand-text text-body font-bold py-3 px-4 rounded-field cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm quy tắc
                </button>
              )}
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
                        {r.ruleType === 'OPEN' && r.serviceId && (
                          <span className="text-meta text-brand-terracotta font-bold block mt-0.5">
                            Áp dụng: {getServiceDisplayTitle(r.serviceId)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-meta font-bold py-0.5 px-2 rounded-lg ${r.ruleType === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {r.ruleType === 'OPEN' ? 'Mở lịch' : 'Chặn lịch'}
                      </span>
                      <button
                        onClick={() => handleStartEdit(r)}
                        disabled={busy}
                        className="p-2 text-brand-text-muted hover:text-brand-terracotta hover:bg-brand-terracotta/10 border border-transparent hover:border-brand-terracotta/20 rounded-field disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Sửa quy tắc"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRuleToDelete(r)}
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

      {/* Delete Confirmation Modal */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6.5 h-6.5 animate-pulse" />
                <h3 className="text-lg font-extrabold text-brand-text">Xác nhận xóa quy tắc</h3>
              </div>
              
              <div className="text-body text-brand-text-muted font-medium leading-relaxed space-y-2">
                <p>Bạn có chắc chắn muốn xóa quy tắc lịch rảnh này không?</p>
                <div className="p-3 bg-brand-bg/40 border border-brand-border rounded-lg text-xs font-semibold">
                  <p className="text-brand-text">
                    Khung giờ: {ruleToDelete.startTime?.slice(0, 5)} - {ruleToDelete.endTime?.slice(0, 5)}
                  </p>
                  <p>
                    Lặp lại: {REPEAT_LABEL[ruleToDelete.repeatType]} · {describeRule(ruleToDelete)}
                  </p>
                  {ruleToDelete.note && <p>Ghi chú: {ruleToDelete.note}</p>}
                </div>
                <p className="text-red-500 font-bold text-xs mt-1">Hành động này không thể hoàn tác.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setRuleToDelete(null)}
                  className="bg-surface border border-brand-border hover:bg-brand-bg text-brand-text text-body font-bold py-2 px-4.5 rounded-field cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const id = ruleToDelete.ruleId;
                    setRuleToDelete(null);
                    handleDeleteRule(id);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white text-body font-bold py-2 px-4.5 rounded-field cursor-pointer transition-all"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
