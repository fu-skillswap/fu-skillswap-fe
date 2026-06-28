import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Check, AlertCircle, Loader2, CalendarClock, Plus, Trash2, CalendarPlus, Pencil, X } from 'lucide-react';
import { availabilityApi } from '../../api/availability';
import { mentorsApi } from '../../api/mentors';
import { mentorServicesApi } from '../../api/mentorServices';
import { useAuth } from '../../context/AuthContext';
import type { MentorAvailabilitySlot, MentorServiceItem } from '../../api/types';

const fmtTime = (iso: string) => {
  const parsed = parseIsoDateTime(iso);
  return parsed.time;
};
const dayKey = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};
const todayStr = () => new Date().toISOString().slice(0, 10);

const parseIsoDateTime = (iso: string) => {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) {
    return { date: match[1], time: match[2] };
  }
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
};

export const AvailabilitySlots: React.FC = () => {
  const { user } = useAuth();
  const myUserId = user?.publicId;

  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>([]);
  const [services, setServices] = useState<MentorServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for creating a new slot
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit slot modal states
  const [editingSlot, setEditingSlot] = useState<MentorAvailabilitySlot | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editSelectedServices, setEditSelectedServices] = useState<Set<string>>(new Set());
  const [editSaving, setEditSaving] = useState(false);

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 2800); };
  const showErr = (msg: string) => { setError(msg); setTimeout(() => setError(null), 3500); };

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
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [myUserId]);

  useEffect(() => { load(); }, [load]);



  const toggleEditService = (serviceId: string) => {
    setEditSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId); else next.add(serviceId);
      return next;
    });
  };

  const handleCreateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { showErr('Vui lòng chọn ngày.'); return; }
    if (!startTime || !endTime || startTime >= endTime) { showErr('Giờ kết thúc phải sau giờ bắt đầu.'); return; }
    
    const activeServiceIds = services.filter((s) => s.active).map((s) => s.serviceId);
    if (activeServiceIds.length === 0) {
      showErr('Bạn chưa kích hoạt (active) môn học nào ở trang Quản lý lớp học. Vui lòng kích hoạt lớp học trước khi tạo lịch rảnh.');
      return;
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;
    const newStart = new Date(startISO).getTime();
    const newEnd = new Date(endISO).getTime();

    const hasOverlap = slots.some(existing => {
      const extStart = new Date(existing.startTime).getTime();
      const extEnd = new Date(existing.endTime).getTime();
      return newStart < extEnd && newEnd > extStart;
    });

    if (hasOverlap) {
      showErr('Khung giờ rảnh này trùng với lịch rảnh đã có của bạn.');
      return;
    }

    setSaving(true);
    try {
      await availabilityApi.createSlot({
        startTime: startISO,
        endTime: endISO,
        note: note.trim() || undefined,
        serviceIds: activeServiceIds,
      });

      flash('Đã tạo khung giờ rảnh thành công.');
      setNote('');
      await load();
    } catch (err: any) {
      showErr(err?.response?.data?.message || 'Không thêm được khung giờ rảnh.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (slot: MentorAvailabilitySlot) => {
    const parsedStart = parseIsoDateTime(slot.startTime);
    const parsedEnd = parseIsoDateTime(slot.endTime);

    setEditingSlot(slot);
    setEditDate(parsedStart.date);
    setEditStartTime(parsedStart.time);
    setEditEndTime(parsedEnd.time);
    setEditNote(slot.note || '');
    setEditSelectedServices(new Set((slot.services || []).map((s) => s.serviceId)));
  };

  const saveEditSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    if (!editDate) { showErr('Vui lòng chọn ngày.'); return; }
    if (!editStartTime || !editEndTime || editStartTime >= editEndTime) { showErr('Giờ kết thúc phải sau giờ bắt đầu.'); return; }
    if (editSelectedServices.size === 0) { showErr('Vui lòng chọn ít nhất một dịch vụ.'); return; }

    setEditSaving(true);
    try {
      const startISO = `${editDate}T${editStartTime}:00`;
      const endISO = `${editDate}T${editEndTime}:00`;

      await availabilityApi.updateSlot(editingSlot.slotId, {
        startTime: startISO,
        endTime: endISO,
        note: editNote.trim() || undefined,
        serviceIds: Array.from(editSelectedServices),
      });

      flash('Cập nhật khung giờ rảnh thành công.');
      setEditingSlot(null);
      await load();
    } catch (err: any) {
      showErr(err?.response?.data?.message || 'Không thể cập nhật khung giờ rảnh.');
    } finally {
      setEditSaving(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!window.confirm('Xoá khung giờ rảnh này? Nếu có yêu cầu đặt lịch đang chờ duyệt (PENDING), hệ thống sẽ tự động hủy chúng.')) return;
    try {
      await availabilityApi.deleteSlot(slotId);
      flash('Đã xoá khung giờ rảnh.');
      await load();
    } catch (err: any) {
      showErr(err?.response?.data?.message || 'Không xoá được khung giờ rảnh.');
    }
  };

  // Group slots by day
  const grouped = slots.reduce<Record<string, MentorAvailabilitySlot[]>>((acc, s) => {
    const k = dayKey(s.startTime);
    (acc[k] = acc[k] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <CalendarClock className="w-8 h-8 text-brand-terracotta" /> Thiết lập lịch rảnh dạy
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Mở một khung giờ rảnh lớn (ví dụ: tối chủ nhật 19:00 - 22:00) và gắn các môn học bạn sẵn sàng hỗ trợ. Sinh viên sẽ chọn các khung giờ nhỏ vừa khít từ đó để đặt lịch với bạn.
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

      {/* ============ PHẦN 1: Tạo slot rảnh lớn trực tiếp ============ */}
      <section className="meetmind-card p-5 rounded-card space-y-4">
        <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-brand-terracotta" /> Tạo khung giờ rảnh mới
        </h2>

        <form onSubmit={handleCreateClick} className="bg-brand-bg/40 border border-brand-border rounded-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Ngày rảnh</label>
              <input type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Giờ bắt đầu</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
            <div>
              <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Giờ kết thúc</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
            </div>
          </div>

          <div>
            <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1.5">Ghi chú (Note)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Rảnh buổi tối để tư vấn CV, Review Code..."
              className="w-full px-3.5 py-2.5 rounded-field border border-brand-border bg-surface text-body font-medium text-brand-text focus:border-brand-terracotta outline-none" />
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-5 rounded-field cursor-pointer transition-all active:scale-95 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Tạo khung giờ rảnh
          </button>
        </form>
      </section>

      {/* ============ PHẦN 2: Danh sách khung giờ rảnh lớn ============ */}
      <section className="space-y-4">
        <h2 className="text-body font-extrabold text-brand-text flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-terracotta" /> Các khung giờ rảnh đã thiết lập
        </h2>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-terracotta" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="meetmind-card py-14 text-center rounded-card text-brand-text-muted text-body font-semibold">
            Chưa có khung giờ rảnh nào được tạo. Hãy sử dụng biểu mẫu phía trên để khai báo lịch trống của bạn.
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
                    const slotServices = slot.services || [];
                    return (
                      <div key={slot.slotId} className="meetmind-card p-4 rounded-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2 text-left flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1.5 text-body font-bold text-brand-text">
                              <Clock className="w-4 h-4 text-brand-blue" />
                              {fmtTime(slot.startTime)} - {fmtTime(slot.endTime)}
                            </span>
                            {slot.note && (
                              <span className="text-meta text-brand-text-muted bg-brand-bg px-2 py-0.5 rounded-lg border border-brand-border truncate max-w-xs" title={slot.note}>
                                {slot.note}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {slotServices.map((sv) => (
                              <span key={sv.serviceId} className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md">
                                {sv.title} ({sv.durationMinutes}p)
                              </span>
                            ))}
                            {slotServices.length === 0 && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                                Chưa gán dịch vụ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEditModal(slot)} title="Chỉnh sửa"
                            className="p-2 rounded-field border border-brand-border text-brand-text-muted hover:text-brand-terracotta hover:bg-surface-muted transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteSlot(slot.slotId)} title="Xoá"
                            className="p-2 rounded-field border border-brand-border text-brand-text-muted hover:text-danger hover:bg-surface-muted transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ============ MODAL CHỈNH SỬA KHUNG GIỜ ============ */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface border border-brand-border rounded-card p-6 relative text-left shadow-2xl space-y-4">
            <button onClick={() => setEditingSlot(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-brand-border pb-3">
              <h3 className="text-xl font-bold font-serif text-brand-text flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brand-terracotta" /> Chỉnh sửa khung giờ rảnh
              </h3>
            </div>

            <form onSubmit={saveEditSlot} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1">Ngày rảnh</label>
                  <input type="date" value={editDate} min={todayStr()} onChange={(e) => setEditDate(e.target.value)} required
                    className="w-full px-3 py-2 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
                </div>
                <div>
                  <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1">Giờ bắt đầu</label>
                  <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} required
                    className="w-full px-3 py-2 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
                </div>
                <div>
                  <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1">Giờ kết thúc</label>
                  <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} required
                    className="w-full px-3 py-2 rounded-field border border-brand-border bg-surface text-body font-semibold text-brand-text focus:border-brand-terracotta outline-none" />
                </div>
              </div>

              <div>
                <label className="text-meta font-bold text-brand-text-muted uppercase block mb-1">Ghi chú (Note)</label>
                <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Ví dụ: Rảnh buổi tối..."
                  className="w-full px-3 py-2.5 rounded-field border border-brand-border bg-surface text-body font-medium text-brand-text focus:border-brand-terracotta outline-none" />
              </div>

              <div>
                <label className="text-meta font-bold text-brand-text-muted uppercase block mb-2">Gán dịch vụ/môn học hỗ trợ <span className="text-danger">*</span></label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {services.map((sv) => {
                    const isChecked = editSelectedServices.has(sv.serviceId);
                    return (
                      <button key={sv.serviceId} type="button" onClick={() => toggleEditService(sv.serviceId)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-field text-[11px] font-bold border transition-all cursor-pointer ${isChecked ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-surface text-brand-text border-brand-border hover:border-brand-terracotta'}`}>
                        {isChecked && <Check className="w-3 h-3" />}
                        {sv.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border/60">
                <button type="button" onClick={() => setEditingSlot(null)}
                  className="bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text text-body font-bold py-2 px-4 rounded-field cursor-pointer transition-all">
                  Hủy
                </button>
                <button type="submit" disabled={editSaving}
                  className="bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2 px-5 rounded-field cursor-pointer transition-all active:scale-95 flex items-center gap-1">
                  {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};