import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Check, AlertCircle, Loader2, CalendarClock, Info, X } from 'lucide-react';
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

const WEEKDAYS = [
  { value: 'MONDAY', label: 'T2' },
  { value: 'TUESDAY', label: 'T3' },
  { value: 'WEDNESDAY', label: 'T4' },
  { value: 'THURSDAY', label: 'T5' },
  { value: 'FRIDAY', label: 'T6' },
  { value: 'SATURDAY', label: 'T7' },
  { value: 'SUNDAY', label: 'CN' },
];

const getWeekDays = (offset = 0) => {
  const start = new Date();
  const day = start.getDay();
  // Monday is 1, Sunday is 0. Adjust so Monday is first day of the week
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
  const monday = new Date(start.setDate(diff));
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
};

const formatDateISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateDisplay = (d: Date) => {
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const getLocalDateStr = (iso: string) => {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const getDayNameLong = (date: Date) => {
  const dayIndex = date.getDay();
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayIndex];
};

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
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activeSlotForConfig, setActiveSlotForConfig] = useState<MentorAvailabilitySlot | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

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
      // Update services in activeSlotForConfig if it's currently open
      if (activeSlotForConfig && activeSlotForConfig.slotId === slotId) {
        // Find selected services from services catalog
        const updatedServices = services.filter(s => next.includes(s.serviceId));
        setActiveSlotForConfig({
          ...activeSlotForConfig,
          services: updatedServices.map(s => ({
            serviceId: s.serviceId,
            title: s.title,
            durationMinutes: s.durationMinutes,
            isFree: s.free,
            priceScoin: s.priceScoin
          }))
        });
      }
    } catch (err: any) {
      setAttached(prev); // rollback
      setError(err?.response?.data?.message || 'Cập nhật dịch vụ thất bại.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingSlotId(null);
    }
  };

  const getDaySlots = (dayDate: Date) => {
    const targetStr = formatDateISO(dayDate);
    return slots.filter(s => getLocalDateStr(s.startTime) === targetStr);
  };

  // Helper to parse subject code from service title
  const getSubjectCode = (fullTitle: string = '') => {
    const match = fullTitle.match(/^\[(.*?)\]/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-fg tracking-tight flex items-center gap-2">
            <CalendarClock className="w-8 h-8 text-primary" /> Lịch nhận mentoring
          </h1>
          <p className="text-fg-muted text-body font-medium">
            Chọn dịch vụ/môn học bạn muốn dạy trên từng khung giờ khả dụng. Khung có ít nhất một dịch vụ được gán sẽ mở để học viên đặt lịch.
          </p>
        </div>
      </div>

      {/* Info Warning */}
      <div className="flex items-start gap-2 bg-brand-blue/5 border border-brand-blue/20 text-fg-muted p-4 rounded-card text-meta font-medium">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <span>
          Các khung giờ được hệ thống tự động thiết lập cố định hàng tuần. Bạn chỉ cần click chọn khung giờ tương ứng để gán hoặc bỏ gán các môn học/dịch vụ của mình.
        </span>
      </div>

      {/* Toast Alert Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-field text-body font-semibold animate-fadeIn">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-red-500/5 border border-red-200 text-red-600 p-3.5 rounded-field text-body font-semibold animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Main Grid Calendar Container */}
      <div className="meetmind-card p-6 rounded-card space-y-4">
        {/* Week navigation control block */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-line-soft pb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary shrink-0" />
            <div className="text-left">
              <h3 className="text-base font-bold text-fg">Lịch rảnh khả dụng của tôi</h3>
              <p className="text-meta text-fg-muted font-semibold">
                {(() => {
                  const weekDays = getWeekDays(weekOffset);
                  return `Từ thứ 2 (${formatDateDisplay(weekDays[0])}) đến Chủ nhật (${formatDateDisplay(weekDays[6])})`;
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex bg-surface-muted p-1 rounded-field gap-1 shrink-0">
            <button
              onClick={() => setWeekOffset(0)}
              className={`px-4 py-1.5 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${weekOffset === 0 ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setWeekOffset(1)}
              className={`px-4 py-1.5 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${weekOffset === 1 ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              Tuần sau
            </button>
          </div>
        </div>

        {/* Loading / Empty / Grid layout rendering */}
        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-body font-bold text-fg">Bạn chưa có dịch vụ nào đang hoạt động.</p>
            <p className="text-meta text-fg-muted font-medium">
              Hãy tạo & bật dịch vụ ở mục "Quản lý khóa học" trước, rồi quay lại gán vào khung giờ.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
            {getWeekDays(weekOffset).map((dayDate, idx) => {
              const dayName = WEEKDAYS[idx].label;
              const dateStr = formatDateISO(dayDate);
              const isToday = formatDateISO(new Date()) === dateStr;
              const daySlots = getDaySlots(dayDate);
              
              return (
                <div key={idx} className={`rounded-xl border p-3 flex flex-col text-left min-h-[350px] transition-all ${isToday ? 'bg-primary-soft/10 border-primary/30' : 'bg-surface/30 border-line-soft'}`}>
                  {/* Day Header */}
                  <div className="text-center pb-2 border-b border-line-soft mb-2 shrink-0">
                    <span className={`text-[11px] font-extrabold block tracking-wide uppercase ${isToday ? 'text-primary' : 'text-fg-faint'}`}>
                      {dayName}
                    </span>
                    <span className={`text-title font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-full mt-1 ${isToday ? 'bg-primary text-white shadow-sm' : 'text-fg'}`}>
                      {dayDate.getDate()}
                    </span>
                  </div>
                  
                  {/* Day Slots List */}
                  <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none pr-0.5">
                    {daySlots.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-8">
                        <span className="text-[10px] text-fg-faint italic font-semibold text-center leading-tight">
                          Không có lịch
                        </span>
                      </div>
                    ) : (
                      daySlots.map(slot => {
                        const sel = attached[slot.slotId] || [];
                        const open = sel.length > 0;
                        const isSaving = savingSlotId === slot.slotId;
                        
                        return (
                          <div
                            key={slot.slotId}
                            onClick={() => setActiveSlotForConfig(slot)}
                            className={`p-2.5 rounded-lg border text-left shadow-xs group/item relative cursor-pointer transition-all hover:-translate-y-[1px] hover:shadow-sm ${
                              open
                                ? 'bg-green-50/70 border-green-200 hover:bg-green-100/70'
                                : 'bg-surface border-line-soft hover:bg-surface-muted/40'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-fg flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-fg-faint shrink-0" />
                                {fmtTime(slot.startTime)} - {fmtTime(slot.endTime)}
                              </span>
                              
                              {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              ) : (
                                <span className={`text-[8px] font-extrabold px-1 rounded uppercase ${open ? 'bg-green-200 text-green-800' : 'bg-fg-muted/20 text-fg-muted'}`}>
                                  {open ? 'Mở' : 'Đóng'}
                                </span>
                              )}
                            </div>
                            
                            {open && (
                              <div className="mt-2 space-y-1.5">
                                {services
                                  .filter(sv => sel.includes(sv.serviceId))
                                  .map(sv => {
                                    const code = getSubjectCode(sv.title);
                                    const displayTitle = code 
                                      ? sv.title.replace(/^\[.*?\]\s*/, '')
                                      : sv.title;
                                      
                                    return (
                                      <div 
                                        key={sv.serviceId} 
                                        className="w-full text-[9px] font-extrabold text-primary bg-primary-soft/80 border border-primary/20 px-2 py-1 rounded truncate block shadow-xs leading-normal"
                                        title={sv.title}
                                      >
                                        {code && (
                                          <span className="bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded mr-1 inline-block uppercase">
                                            {code}
                                          </span>
                                        )}
                                        {displayTitle}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Slot Services Modal */}
      {activeSlotForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 shadow-xl relative text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-line-soft pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Cấu hình khung giờ dạy
                </h3>
                <p className="text-[11px] text-fg-muted font-semibold uppercase tracking-wider">
                  {getDayNameLong(new Date(activeSlotForConfig.startTime))}, {formatDateDisplay(new Date(activeSlotForConfig.startTime))} · {fmtTime(activeSlotForConfig.startTime)} - {fmtTime(activeSlotForConfig.endTime)}
                </p>
              </div>
              <button
                onClick={() => setActiveSlotForConfig(null)}
                className="p-1 rounded-full hover:bg-surface-muted text-fg-muted hover:text-fg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              <p className="text-meta text-fg-muted font-medium">
                Chọn những môn học/dịch vụ bạn sẵn sàng giảng dạy vào khung giờ này. Học viên chỉ có thể đặt lịch của bạn vào khung giờ này nếu bạn chọn ít nhất một môn học.
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {services.map(sv => {
                  const sel = attached[activeSlotForConfig.slotId] || [];
                  const checked = sel.includes(sv.serviceId);
                  
                  return (
                    <button
                      key={sv.serviceId}
                      type="button"
                      onClick={() => toggleService(activeSlotForConfig.slotId, sv.serviceId)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all hover:bg-surface-muted/30 cursor-pointer ${
                        checked 
                          ? 'bg-primary-soft/10 border-primary/40' 
                          : 'bg-surface border-line-soft'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-primary bg-primary-soft px-1.5 py-0.5 rounded uppercase">
                            {getSubjectCode(sv.title) || 'CLASS'}
                          </span>
                          <span className="text-meta font-bold text-fg">
                            {sv.title.replace(/^\[.*?\]\s*/, '')}
                          </span>
                        </div>
                        <p className="text-[10px] text-fg-muted font-semibold">
                          Thời lượng: {sv.durationMinutes} phút · Giá: {sv.priceScoin || 0} Point
                        </p>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        checked 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-line text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-line-soft">
              <button
                onClick={() => setActiveSlotForConfig(null)}
                className="bg-primary hover:bg-primary-hover text-white text-meta font-bold py-2 px-5 rounded-field cursor-pointer transition-all active:scale-[0.98]"
              >
                Xong
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
