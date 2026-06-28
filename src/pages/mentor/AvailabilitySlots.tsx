import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Check, AlertCircle, Loader2, CalendarClock, Info, Plus, Trash2, CalendarPlus } from 'lucide-react';
import { availabilityApi, availabilityRulesApi } from '../../api/availability';
import { mentorsApi } from '../../api/mentors';
import { mentorServicesApi } from '../../api/mentorServices';
import { useAuth } from '../../context/AuthContext';
import type {
  MentorAvailabilitySlot, MentorServiceItem, AvailabilityRule, DayOfWeekCode,
} from '../../api/types';

/* ---------------------------------------------------------------------------
 * Lịch nhận mentoring (2 phần):
 *  1. Mentor tạo "lịch rảnh theo tuần" (rule OPEN, chọn thứ + giờ) -> BE sinh
 *     ra các khung giờ (slot) cụ thể.
 *  2. Mentor gán dịch vụ nào được mở trên mỗi khung -> mentee đặt được.
 * ------------------------------------------------------------------------- */

const DAYS: { code: DayOfWeekCode; label: string }[] = [
  { code: 'MONDAY', label: 'T2' }, { code: 'TUESDAY', label: 'T3' }, { code: 'WEDNESDAY', label: 'T4' },
  { code: 'THURSDAY', label: 'T5' }, { code: 'FRIDAY', label: 'T6' }, { code: 'SATURDAY', label: 'T7' },
  { code: 'SUNDAY', label: 'CN' },
];
const DAY_LABEL: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.code, d.label]));

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDay = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
const todayStr = () => new Date().toISOString().slice(0, 10);

export const AvailabilitySlots: React.FC = () => {
  const { user } = useAuth();
  const myUserId = user?.publicId;

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [services, setServices] = useState<MentorServiceItem[]>([]);
  const [attached, setAttached] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form tạo rule rảnh theo tuần
  const [days, setDays] = useState<Set<DayOfWeekCode>>(new Set());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [effectiveTo, setEffectiveTo] = useState('');
  const [savingRule, setSavingRule] = useState(false);

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 2800); };
  const showErr = (msg: string) => { setError(msg); setTimeout(() => setError(null), 3500); };

  const load = useCallback(async () => {
    if (!myUserId) return;
    setLoading(true);
    setError(null);
    try {
      const [ruleList, slotList, serviceList] = await Promise.all([
        availabilityRulesApi.list().catch(() => [] as AvailabilityRule[]),
        mentorsApi.getAvailabilitySlots(myUserId).catch(() => [] as MentorAvailabilitySlot[]),
        mentorServicesApi.list().catch(() => [] as MentorServiceItem[]),
      ]);
      setRules(ruleList);
      setSlots(slotList);
      setServices(serviceList.filter((s) => s.active));
      const map: Record<string, string[]> = {};
      slotList.forEach((s) => { map[s.slotId] = (s.services || []).map((sv) => sv.serviceId); });
      setAttached(map);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [myUserId]);

  useEffect(() => { load(); }, [load]);

  const toggleDay = (d: DayOfWeekCode) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  const addRule = async () => {
    if (days.size === 0) { showErr('Vui lòng chọn ít nhất một ngày trong tuần.'); return; }
    if (!startTime || !endTime || startTime >= endTime) { showErr('Giờ kết thúc phải sau giờ bắt đầu.'); return; }
    if (effectiveTo && effectiveTo < effectiveFrom) { showErr('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'); return; }
    setSavingRule(true);
    try {
      await availabilityRulesApi.create({
        ruleType: 'OPEN',
        repeatType: 'WEEKLY',
        daysOfWeek: Array.from(days),
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
        startTime,
        endTime,
      });
      flash('Đã thêm lịch rảnh. Hệ thống đã sinh các khung giờ tương ứng.');
      setDays(new Set());
      await load();
    } catch (err: any) {
      showErr(err?.response?.data?.message || 'Không thêm được lịch rảnh.');
    } finally {
      setSavingRule(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Xoá lịch rảnh này? Các khung giờ tương lai chưa có người đặt sẽ bị gỡ.')) return;
    try {
      await availabilityRulesApi.remove(ruleId);
      flash('Đã xoá lịch rảnh.');
      await load();
    } catch (err: any) {
      showErr(err?.response?.data?.message || 'Không xoá được lịch rảnh.');
    }
  };

  // Bật/tắt 1 service trên 1 slot -> PUT thay toàn bộ.
  const toggleService = async (slotId: string, serviceId: string) => {
    const current = attached[slotId] || [];
    const next = current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId];
    const prev = attached;
    setAttached({ ...attached, [slotId]: next });
    setSavingSlotId(slotId);
    try {
      await availabilityApi.replaceSlotServices(slotId, next);
      flash('Đã cập nhật dịch vụ cho khung giờ.');
    } catch (err: any) {
      setAttached(prev);
      showErr(err?.response?.data?.message || 'Cập nhật dịch vụ thất bại.');
    } finally {
      setSavingSlotId(null);
    }
  };

  const grouped = slots.reduce<Record<string, MentorAvailabilitySlot[]>>((acc, s) => {
    const k = dayKey(s.startTime);
    (acc[k] = acc[k] || []).push(s);
    return acc;
  }, {});

  const openRules = rules.filter((r) => r.ruleType === 'OPEN');

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <CalendarClock className="w-8 h-8 text-brand-terracotta" /> Lịch nhận mentoring
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Khai báo khung giờ rảnh theo tuần — hệ thống sẽ sinh các khung giờ cụ thể để mentee đặt lịch, sau đó bạn chọn dịch vụ mở trên từng khung.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-field text-body font-semibold animate-fadeIn">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-red-500/5 border border-red-200 text-red-600 p-3.5 rounded-field text-body font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ============ PHẦN 1: Lịch rảnh theo tuần ============ */}
      <section className="meetmind-card p-5 rounded-card space-y-4">
        <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-brand-terracotta" /> Khung giờ rảnh hằng tuần
        </h2>

        {/* Form thêm rule */}
        <div className="bg-brand-bg/40 border border-brand-border rounded-card p-4 space-y-4">
          <div>
            <label className="text-meta font-bold text-brand-text-muted uppercase block mb-2">Chọn các ngày trong tuần</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const on = days.has(d.code);
                return (
                  <button key={d.code} type="button" onClick={() => toggleDay(d.code)}
                    className={`w-12 h-10 rounded-field text-body font-bold border transition-all cursor-pointer ${on ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-surface text-brand-text border-brand-border hover:border-brand-terracotta'}`}>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Giờ bắt đầu</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Giờ kết thúc</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Áp dụng từ</label>
              <input type="date" value={effectiveFrom} min={todayStr()} onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Đến (tuỳ chọn)</label>
              <input type="date" value={effectiveTo} min={effectiveFrom} onChange={(e) => setEffectiveTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
          </div>

          <button onClick={addRule} disabled={savingRule}
            className="flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50">
            {savingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm lịch rảnh
          </button>
        </div>

        {/* Danh sách rule hiện có */}
        {openRules.length === 0 ? (
          <p className="text-meta text-brand-text-muted font-medium">Chưa có khung giờ rảnh nào. Hãy thêm ở trên để mentee có thể đặt lịch với bạn.</p>
        ) : (
          <div className="space-y-2">
            {openRules.map((r) => (
              <div key={r.ruleId} className="flex items-center justify-between gap-3 border border-brand-border rounded-card p-3.5 bg-surface">
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="w-4 h-4 text-brand-blue shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body font-bold text-brand-text">
                      {(r.daysOfWeek || []).map((d) => DAY_LABEL[d] || d).join(', ')} · {r.startTime?.slice(0, 5)}–{r.endTime?.slice(0, 5)}
                    </p>
                    <p className="text-meta text-brand-text-muted font-medium">
                      Từ {fmtDay(r.effectiveFrom)}{r.effectiveTo ? ` đến ${fmtDay(r.effectiveTo)}` : ' (không thời hạn)'}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteRule(r.ruleId)} title="Xoá" className="p-2 rounded-field text-brand-text-muted hover:text-danger hover:bg-surface-muted shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ PHẦN 2: Gán dịch vụ vào khung giờ ============ */}
      <section className="space-y-4">
        <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-terracotta" /> Mở dịch vụ trên từng khung giờ
        </h2>
        <div className="flex items-start gap-2 bg-brand-blue/5 border border-brand-blue/20 text-brand-text-muted p-3.5 rounded-card text-meta font-medium">
          <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
          <span>Các khung giờ dưới đây sinh ra từ lịch rảnh ở trên. Khung có ít nhất một dịch vụ sẽ hiển thị cho mentee đặt lịch.</span>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-terracotta" /></div>
        ) : services.length === 0 ? (
          <div className="meetmind-card py-14 text-center rounded-card space-y-2">
            <p className="text-body font-bold text-brand-text">Bạn chưa có dịch vụ nào đang hoạt động.</p>
            <p className="text-meta text-brand-text-muted font-medium">Hãy tạo & bật dịch vụ ở mục "Quản lý khóa học" trước, rồi quay lại gán vào khung giờ.</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="meetmind-card py-14 text-center rounded-card space-y-2">
            <p className="text-body font-bold text-brand-text">Chưa có khung giờ nào.</p>
            <p className="text-meta text-brand-text-muted font-medium">Thêm lịch rảnh ở phần trên để hệ thống sinh khung giờ cho bạn.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, daySlots]) => (
              <div key={day} className="space-y-3">
                <h3 className="text-body font-bold text-brand-text flex items-center gap-2 capitalize">
                  <Calendar className="w-4 h-4 text-brand-terracotta" /> {day}
                </h3>
                <div className="grid gap-3">
                  {daySlots.map((slot) => {
                    const sel = attached[slot.slotId] || [];
                    const open = sel.length > 0;
                    return (
                      <div key={slot.slotId} className="meetmind-card p-4 rounded-card">
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-2 text-body font-bold text-brand-text">
                            <Clock className="w-4 h-4 text-brand-blue" />
                            {fmtTime(slot.startTime)} - {fmtTime(slot.endTime)}
                            <span className="text-meta text-brand-text-muted font-semibold">({fmtDate(slot.startTime)})</span>
                          </span>
                          <span className="flex items-center gap-2">
                            {savingSlotId === slot.slotId && <Loader2 className="w-4 h-4 animate-spin text-brand-terracotta" />}
                            <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ${open ? 'bg-green-50 text-green-700 border-green-200' : 'bg-brand-bg text-brand-text-muted border-brand-border'}`}>
                              {open ? `Mở · ${sel.length} dịch vụ` : 'Đang đóng'}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {services.map((sv) => {
                            const checked = sel.includes(sv.serviceId);
                            return (
                              <button key={sv.serviceId} type="button" disabled={savingSlotId === slot.slotId}
                                onClick={() => toggleService(slot.slotId, sv.serviceId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-field text-meta font-bold border transition-all cursor-pointer disabled:opacity-50 ${checked ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-brand-bg/50 text-brand-text border-brand-border hover:border-brand-terracotta'}`}>
                                {checked && <Check className="w-3 h-3" />}
                                {sv.title}
                                <span className="opacity-75 font-semibold">· {sv.durationMinutes}p</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
