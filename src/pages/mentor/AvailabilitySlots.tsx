import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, Check, AlertCircle } from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export const AvailabilitySlots: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([
    { id: 's1', date: '2026-06-15', startTime: '09:00', endTime: '10:30', isBooked: false },
    { id: 's2', date: '2026-06-15', startTime: '14:00', endTime: '15:30', isBooked: true },
    { id: 's3', date: '2026-06-17', startTime: '10:00', endTime: '11:30', isBooked: false },
  ]);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validations
    const selectedDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    if (selectedDateTime < now) {
      setError('Không thể tạo khung giờ rảnh trong quá khứ.');
      return;
    }

    if (startTime >= endTime) {
      setError('Giờ bắt đầu phải trước giờ kết thúc.');
      return;
    }

    // Check overlap
    const hasOverlap = slots.some(
      (s) =>
        s.date === date &&
        ((startTime >= s.startTime && startTime < s.endTime) ||
          (endTime > s.startTime && endTime <= s.endTime) ||
          (startTime <= s.startTime && endTime >= s.endTime))
    );

    if (hasOverlap) {
      setError('Khung giờ này đã bị trùng lặp với một khung giờ hiện tại.');
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: `s_${Date.now()}`,
      date,
      startTime,
      endTime,
      isBooked: false,
    };

    setSlots([...slots, newSlot].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)));
    setSuccess('Đã thêm khung giờ rảnh thành công!');
    setDate('');
    setStartTime('');
    setEndTime('');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteSlot = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id));
    setSuccess('Đã xóa khung giờ rảnh.');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <Calendar className="w-8 h-8 text-brand-terracotta" /> Quản lý khung giờ rảnh
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Thiết lập lịch rảnh của bạn trong tuần để sinh viên (mentee) có thể tìm thấy và đặt lịch học phù hợp.
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
        
        {/* Slot Creator Form */}
        <div className="lg:col-span-1">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold font-serif text-brand-text mb-4">Thêm giờ rảnh mới</h3>
            
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Ngày rảnh</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                />
              </div>

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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-[0.98] mt-2"
              >
                <Plus className="w-4 h-4" /> Thêm khung giờ
              </button>
            </form>
          </div>
        </div>

        {/* Slot List */}
        <div className="lg:col-span-2">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold font-serif text-brand-text mb-4">Danh sách giờ rảnh của bạn</h3>
            
            {slots.length === 0 ? (
              <div className="py-12 text-center text-brand-text-muted font-semibold text-body">
                Bạn chưa thêm khung giờ rảnh nào. Vui lòng thiết lập ở form bên cạnh.
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-brand-bg/40 border border-brand-border rounded-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-field bg-surface border border-brand-border flex items-center justify-center text-brand-terracotta shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-body font-bold text-brand-text block">
                          {s.startTime} - {s.endTime}
                        </span>
                        <span className="text-meta text-brand-text-muted font-semibold">
                          Ngày: {s.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-meta font-bold py-0.5 px-2 rounded-lg ${
                        s.isBooked
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {s.isBooked ? 'Đã được đặt' : 'Đang trống'}
                      </span>
                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        disabled={s.isBooked}
                        className="p-2 text-brand-text-muted hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-field disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Xóa slot"
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
