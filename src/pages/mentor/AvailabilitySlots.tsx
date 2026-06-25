import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Check, AlertCircle, Loader2, CalendarClock, Info } from 'lucide-react';
import { availabilityApi } from '../../api/availability';
import { mentorsApi } from '../../api/mentors';
import { mentorServicesApi } from '../../api/mentorServices';
import { useAuth } from '../../context/AuthContext';
import type { MentorAvailabilitySlot, MentorServiceItem } from '../../api/types';

/* ---------------------------------------------------------------------------
 * Mô hình mới: mentor KHÔNG tự tạo khung giờ. Hệ thống sinh sẵn các slot hàng
 * tuần; mentor chỉ chọn DỊCH VỤ nào được mở trên từng slot (PUT services).
 * Slot có ≥1 service => mentee đặt được; bỏ hết service => slot đóng.
 * ------------------------------------------------------------------------- */

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
};
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

export const AvailabilitySlots: React.FC = () => {
  const { user } = useAuth();
  const myUserId = user?.publicId;

  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [services, setServices] = useState<MentorServiceItem[]>([]);
  // Map slotId -> danh sách serviceId đang gắn (nguồn hiển thị + optimistic).
  const [attached, setAttached] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const load = useCallback(async () => {
    if (!myUserId) return;
    setLoading(true);
    setError(null);
    try {
      const [slotList, serviceList] = await Promise.all([
        mentorsApi.getAvailabilitySlots(myUserId).catch(() => [] as MentorAvailabilitySlot[]),
        mentorServicesApi.list().catch(() => [] as MentorServiceItem[]),
      ]);
      setSlots(slotList);
      setServices(serviceList.filter((s) => s.active));
      const map: Record<string, string[]> = {};
      slotList.forEach((s) => {
        map[s.slotId] = (s.services || []).map((sv) => sv.serviceId);
      });
      setAttached(map);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được lịch slot. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [myUserId]);

  useEffect(() => { load(); }, [load]);

  // Bật/tắt 1 service trên 1 slot -> tính danh sách mới rồi PUT thay toàn bộ.
  const toggleService = async (slotId: string, serviceId: string) => {
    const current = attached[slotId] || [];
    const next = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];

    const prev = attached;
    setAttached({ ...attached, [slotId]: next }); // optimistic
    setSavingSlotId(slotId);
    try {
      await availabilityApi.replaceSlotServices(slotId, next);
      flash('Đã cập nhật dịch vụ cho khung giờ.');
    } catch (err: any) {
      setAttached(prev); // rollback
      setError(err?.response?.data?.message || 'Cập nhật dịch vụ thất bại.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingSlotId(null);
    }
  };

  // Gom slot theo ngày để dễ nhìn.
  const grouped = slots.reduce<Record<string, MentorAvailabilitySlot[]>>((acc, s) => {
    const k = dayKey(s.startTime);
    (acc[k] = acc[k] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <CalendarClock className="w-8 h-8 text-brand-terracotta" /> Lịch nhận mentoring
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Chọn dịch vụ bạn muốn mở cho từng khung giờ hệ thống đã xếp. Khung có ít nhất một dịch vụ sẽ hiển thị cho mentee đặt lịch.
        </p>
      </div>

      <div className="flex items-start gap-2 bg-brand-blue/5 border border-brand-blue/20 text-brand-text-muted p-3.5 rounded-card text-meta font-medium">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <span>
          Các khung giờ được hệ thống sinh tự động hàng tuần — bạn không cần (và không thể) tự tạo khung giờ.
          Việc của bạn là quyết định mở dịch vụ nào trên mỗi khung.
        </span>
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

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-terracotta" /></div>
      ) : services.length === 0 ? (
        <div className="meetmind-card py-14 text-center rounded-card space-y-2">
          <p className="text-body font-bold text-brand-text">Bạn chưa có dịch vụ nào đang hoạt động.</p>
          <p className="text-meta text-brand-text-muted font-medium">
            Hãy tạo & bật dịch vụ ở mục "Khóa học / Dịch vụ" trước, rồi quay lại gán vào khung giờ.
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="meetmind-card py-14 text-center rounded-card space-y-2">
          <p className="text-body font-bold text-brand-text">Chưa có khung giờ nào.</p>
          <p className="text-meta text-brand-text-muted font-medium">
            Hệ thống sinh slot cho các mentor đã được duyệt và đang nhận booking. Nếu bạn vừa được duyệt, slot sẽ xuất hiện ở đợt tạo lịch kế tiếp.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, daySlots]) => (
            <div key={day} className="space-y-3">
              <h2 className="text-body font-bold text-brand-text flex items-center gap-2 capitalize">
                <Calendar className="w-4 h-4 text-brand-terracotta" /> {day}
              </h2>
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
                          <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ${
                            open ? 'bg-green-50 text-green-700 border-green-200' : 'bg-brand-bg text-brand-text-muted border-brand-border'
                          }`}>
                            {open ? `Mở · ${sel.length} dịch vụ` : 'Đang đóng'}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {services.map((sv) => {
                          const checked = sel.includes(sv.serviceId);
                          return (
                            <button
                              key={sv.serviceId}
                              type="button"
                              disabled={savingSlotId === slot.slotId}
                              onClick={() => toggleService(slot.slotId, sv.serviceId)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-field text-meta font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                                checked
                                  ? 'bg-brand-terracotta text-white border-brand-terracotta'
                                  : 'bg-brand-bg/50 text-brand-text border-brand-border hover:border-brand-terracotta'
                              }`}
                            >
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
    </div>
  );
};
