// =====================================================================
// src/components/AdCarousel.tsx — Banner quảng cáo lướt ngang tự động.
// Nguồn thu phụ: chỗ muốn book/quảng bá. Hiện MOCK 2-3 banner tự quẹt;
// API thật làm sau (chỉ cần thay mảng ADS bằng dữ liệu từ BE).
// =====================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href?: string;
  /** Lớp nền gradient/màu cho banner (theme-token để hợp dark mode). */
  tone: string;
}

const ADS: Ad[] = [
  { id: 'ad1', title: 'Khóa luyện phỏng vấn IT 1-1', subtitle: 'Mentor senior FAANG · giảm 30% tuần này', cta: 'Đặt lịch ngay', tone: 'from-brand-blue/15 to-brand-blue/5 border-brand-blue/25' },
  { id: 'ad2', title: 'Review CV miễn phí cho sinh viên', subtitle: 'Đặt slot với mentor để tăng tỉ lệ pass CV', cta: 'Nhận review', tone: 'from-brand-terracotta/15 to-brand-terracotta/5 border-brand-terracotta/25' },
  { id: 'ad3', title: 'Bootcamp đồ án tốt nghiệp', subtitle: 'Kèm 1-1 từ ý tưởng tới bảo vệ · slot giới hạn', cta: 'Tìm hiểu', tone: 'from-success/15 to-success/5 border-success/25' },
];

const INTERVAL_MS = 4000;

export const AdCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  // Tự quẹt sang phải liên tục; tạm dừng khi hover (đọc qua ref nên effect chạy 1 lần).
  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % ADS.length);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const go = (i: number) => setIndex((i + ADS.length) % ADS.length);

  return (
    <div
      className="ss-card rounded-card overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      role="region"
      aria-label="Quảng cáo"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 text-meta font-extrabold uppercase tracking-wider text-fg-faint">
          <Megaphone className="w-3.5 h-3.5" /> Tài trợ
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => go(index - 1)} aria-label="Trước" className="p-1 rounded-full text-fg-faint hover:text-fg hover:bg-surface-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => go(index + 1)} aria-label="Sau" className="p-1 rounded-full text-fg-faint hover:text-fg hover:bg-surface-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Khung trượt: dịch translateX theo index */}
      <div className="px-4 py-3 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {ADS.map((a) => (
            <a
              key={a.id}
              href={a.href || '#'}
              onClick={(e) => { if (!a.href) e.preventDefault(); }}
              className={`shrink-0 w-full bg-gradient-to-br ${a.tone} border rounded-field p-4 flex flex-col gap-2 min-h-[120px] justify-between`}
            >
              <div className="space-y-1 text-left">
                <h4 className="text-body font-extrabold text-fg leading-snug">{a.title}</h4>
                <p className="text-meta text-fg-muted font-medium leading-relaxed">{a.subtitle}</p>
              </div>
              <span className="self-start text-meta font-bold text-primary">{a.cta} →</span>
            </a>
          ))}
        </div>
      </div>

      {/* Chấm chỉ vị trí */}
      <div className="flex justify-center gap-1.5 pb-3">
        {ADS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => go(i)}
            aria-label={`Banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-primary' : 'w-1.5 bg-line'}`}
          />
        ))}
      </div>
    </div>
  );
};
