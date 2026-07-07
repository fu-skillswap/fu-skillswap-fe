import { BarChart3, Users, FileCheck, Calendar, Star, TrendingUp, ShieldAlert } from 'lucide-react';

export const AdminMetrics: React.FC = () => {
  return (
    <div className="space-y-8 text-left">
      
      {/* Title */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1 bg-brand-terracotta/15 text-brand-terracotta text-body font-bold py-1 px-3 rounded-full border border-brand-terracotta/25">
          <BarChart3 className="w-3.5 h-3.5" /> Quản trị hệ thống
        </span>
        <h1 className="text-3xl font-extrabold text-brand-text font-sans tracking-tight">
          Báo cáo chỉ số hoạt động MVP
        </h1>
        <p className="text-brand-text-muted text-body max-w-2xl font-medium">
          Theo dõi số lượng người dùng, người hướng dẫn, lịch đặt chỗ và đo lường sự phát triển của nền tảng SkillSwap.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="meetmind-card p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-brand-text-muted text-meta font-extrabold uppercase tracking-wider">Tổng người dùng</span>
            <Users className="w-5 h-5 text-brand-blue" />
          </div>
          <div className="text-3xl font-bold text-brand-text mb-0.5">342</div>
          <p className="text-meta text-green-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% tuần này
          </p>
        </div>

        <div className="meetmind-card p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-brand-text-muted text-meta font-extrabold uppercase tracking-wider">Mentor đã duyệt</span>
            <FileCheck className="w-5 h-5 text-brand-terracotta" />
          </div>
          <div className="text-3xl font-bold text-brand-text mb-0.5">48</div>
          <p className="text-meta text-brand-text-muted font-semibold">8 hồ sơ chờ duyệt</p>
        </div>

        <div className="meetmind-card p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-brand-text-muted text-meta font-extrabold uppercase tracking-wider">Tổng buổi đặt lịch</span>
            <Calendar className="w-5 h-5 text-brand-blue" />
          </div>
          <div className="text-3xl font-bold text-brand-text mb-0.5">286</div>
          <p className="text-meta text-green-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% so với tháng trước
          </p>
        </div>

        <div className="meetmind-card p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-brand-text-muted text-meta font-extrabold uppercase tracking-wider">Đánh giá chung</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-brand-text mb-0.5">4.82/5</div>
          <p className="text-meta text-brand-text-muted font-semibold">Tích cực 98.4%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold text-brand-text font-sans mb-4">Phân bổ chuyên môn Mentor phổ biến</h3>
            
            {/* Custom CSS Bar Charts representing data */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-body font-bold text-brand-text-muted">
                  <span>Kỹ thuật phần mềm (Fullstack)</span>
                  <span>42% (20 Mentors)</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-terracotta h-full rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-body font-bold text-brand-text-muted">
                  <span>Trí tuệ nhân tạo (AI/ML)</span>
                  <span>25% (12 Mentors)</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-blue h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-body font-bold text-brand-text-muted">
                  <span>An toàn thông tin</span>
                  <span>16% (8 Mentors)</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-grey h-full rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-body font-bold text-brand-text-muted">
                  <span>Thiết kế đồ họa & UI/UX</span>
                  <span>10% (5 Mentors)</span>
                </div>
                <div className="w-full bg-brand-bg h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-terracotta/60 h-full rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log column */}
        <div className="space-y-6">
          <div className="meetmind-card p-6 rounded-card">
            <h3 className="text-base font-bold text-brand-text font-sans mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-brand-terracotta" /> Nhật ký hệ thống
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 text-body leading-normal">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-brand-text font-bold">Approve Mentor</p>
                  <p className="text-brand-text-muted">Admin duyệt hồ sơ Mentor Trần Hoàng Long</p>
                  <span className="text-meta text-brand-grey">2 giờ trước</span>
                </div>
              </div>

              <div className="flex gap-3 text-body leading-normal">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-brand-text font-bold">New Verification Request</p>
                  <p className="text-brand-text-muted">Mentee Nguyễn Tiến Đạt đã nộp tài liệu xác minh</p>
                  <span className="text-meta text-brand-grey">5 giờ trước</span>
                </div>
              </div>

              <div className="flex gap-3 text-body leading-normal">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-brand-text font-bold">New Booking Scheduled</p>
                  <p className="text-brand-text-muted">Session ID #1203 đã được thiết lập link học</p>
                  <span className="text-meta text-brand-grey">1 ngày trước</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
