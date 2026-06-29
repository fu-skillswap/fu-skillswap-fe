import React from 'react';
import { Shield, BookOpen, Users, Monitor, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-4">
    <h2 className="flex items-center gap-2.5 text-lg font-bold text-fg font-serif border-b border-line-soft pb-3">
      <span className="text-primary shrink-0">{icon}</span>
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const Rule: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex gap-3">
    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
    <div>
      <span className="text-body font-bold text-fg">{title}: </span>
      <span className="text-body text-fg-muted">{children}</span>
    </div>
  </div>
);

export const Terms: React.FC = () => (
  <div className="max-w-3xl mx-auto py-10 px-4 space-y-10">
    {/* Header */}
    <div className="text-center space-y-2">
      <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto">
        <Shield className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-fg font-serif">Nội quy & Điều khoản sử dụng</h1>
      <p className="text-body text-fg-muted">Áp dụng cho tất cả người dùng nền tảng SkillSwap</p>
    </div>

    {/* 1. Nguyên tắc cốt lõi */}
    <Section icon={<BookOpen className="w-5 h-5" />} title="1. Nguyên tắc cốt lõi">
      <Rule title="Liêm chính học thuật">
        Tuyệt đối nói KHÔNG với các hành vi gian lận như làm hộ bài tập (Assignment), đồ án (Capstone), cung cấp đề thi hoặc đáp án nội bộ.
      </Rule>
      <Rule title="Giúp đỡ cộng đồng">
        Thúc đẩy văn hóa chia sẻ và hỗ trợ lẫn nhau, biến kinh nghiệm, kỹ năng cá nhân thành tri thức cộng đồng.
      </Rule>
      <Rule title="Minh bạch & Xác thực">
        Mọi người dùng phải thực hiện định danh (qua thẻ sinh viên, bảng điểm hoặc email FAP) để xóa bỏ rủi ro từ các tài khoản ảo.
      </Rule>
    </Section>

    {/* 2. Quy định Mentor */}
    <Section icon={<Users className="w-5 h-5" />} title="2. Quy định dành cho Mentor">
      <Rule title="Trách nhiệm chuyên môn">
        Chỉ tập trung vào việc hướng dẫn phương pháp học, giải thích kiến thức, định hướng tư duy và chia sẻ trải nghiệm thực tế.
      </Rule>
      <Rule title="Cam kết chất lượng">
        Phải phản hồi kịp thời các yêu cầu đặt lịch (ticket) và đảm bảo sự hài lòng cho Mentee thông qua các buổi tư vấn chất lượng.
      </Rule>
      <Rule title="Đạo đức cố vấn">
        Không được sao chép hoặc đánh cắp ý tưởng đồ án, mã nguồn của Mentee trong quá trình sửa bài.
      </Rule>
      <Rule title="Hồ sơ minh bạch">
        Cập nhật đầy đủ và trung thực năng lực chuyên môn tương ứng với từng ngành học để hệ thống matching chính xác.
      </Rule>
    </Section>

    {/* 3. Quy định Mentee */}
    <Section icon={<Users className="w-5 h-5" />} title="3. Quy định dành cho Mentee">
      <Rule title="Chủ động tư duy">
        Phải có mục tiêu học tập rõ ràng, tự chuẩn bị bài trước khi gặp Mentor và tuyệt đối không ỷ lại, lệ thuộc vào người giúp đỡ.
      </Rule>
      <Rule title="Tôn trọng Mentor">
        Giữ thái độ cầu thị, đúng giờ trong các buổi hẹn và thực hiện đánh giá (Rating) công tâm sau mỗi phiên học.
      </Rule>
      <Rule title="Bảo mật thông tin">
        Không được ghi hình, phát tán nội dung buổi học hoặc tài liệu độc quyền của Mentor ra bên ngoài nền tảng khi chưa có sự đồng ý.
      </Rule>
    </Section>

    {/* 4. Hệ thống Workspace */}
    <Section icon={<Monitor className="w-5 h-5" />} title="4. Hệ thống Workspace">
      <Rule title="Chống giao dịch ngoài (Off-platform)">
        Tuyệt đối không cung cấp số điện thoại, link chat riêng hoặc sử dụng các nền tảng họp mặt bên ngoài (như Zoom, Google Meet cá nhân).
      </Rule>
      <Rule title="Bắt buộc sử dụng hệ thống">
        Mọi tương tác, phiên làm việc phải diễn ra trực tiếp trong khung làm việc (Workspace) của SkillSwap để hệ thống ghi nhận và bảo vệ quyền lợi đôi bên.
      </Rule>
      <Rule title="Thanh toán an toàn">
        Mọi khoản phí phải được thực hiện thông qua cổng thanh toán của nền tảng để tránh rủi ro lừa đảo tiền cọc.
      </Rule>
    </Section>

    {/* 5. Giám sát & Xử lý vi phạm */}
    <Section icon={<AlertTriangle className="w-5 h-5" />} title="5. Cơ chế Giám sát và Xử lý vi phạm">
      <Rule title="Cảnh báo tự động">
        Hệ thống AI sẽ tự động quét và cảnh báo các nội dung không phù hợp hoặc hành vi lôi kéo giao dịch ngoài.
      </Rule>
      <Rule title="Báo cáo vi phạm">
        Người dùng có quyền báo cáo ngay nếu đối phương vi phạm quy chế học thuật, có thái độ không phù hợp hoặc vi phạm bảo mật.
      </Rule>
      <Rule title="Hình thức xử lý">
        Tùy theo mức độ vi phạm, người dùng có thể bị cảnh báo, "trừ điểm thực chiến" hoặc khóa tài khoản vĩnh viễn trên toàn hệ thống.
      </Rule>
    </Section>

    {/* Tổng kết */}
    <div className="bg-primary-soft border border-primary/20 rounded-card p-5 text-body text-fg font-medium leading-relaxed">
      <span className="font-bold text-primary">Cam kết của SkillSwap: </span>
      Tuyệt đối nghiêm cấm các hành vi gian lận học thuật, tập trung vào việc hướng dẫn phương pháp tư duy và chia sẻ kinh nghiệm thực tế. Mọi tương tác và giao dịch bắt buộc phải diễn ra trong không gian Workspace bảo mật; mọi hành vi cung cấp thông tin liên lạc cá nhân để giao dịch ngoài nền tảng đều bị xử lý nghiêm. Bất kỳ nội dung không phù hợp nào đều sẽ bị hệ thống AI tự động cảnh báo hoặc khóa tài khoản vĩnh viễn.
    </div>
  </div>
);
