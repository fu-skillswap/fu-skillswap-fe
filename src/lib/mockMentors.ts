import type { MentorPortfolioItem } from '../api/types';

// Các hình ảnh minh họa thực tế chất lượng cao thay thế cho hình vẽ SVG
const SVG_AI = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60';
const SVG_WEB = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60';
const SVG_UIUX = 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop&q=60';
const SVG_MKT = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60';

export const getExtendedMentorData = (
  mentorUserId: string,
  displayName: string,
  specializationName?: string
): {
  yearsOfExperience: number;
  company: string;
  projectsCount: number;
  achievements: string[];
  portfolios: MentorPortfolioItem[];
} => {
  // 1. Kiểm tra ghi đè từ localStorage nếu mentor tự cập nhật
  try {
    const overrideStr = localStorage.getItem(`mentor_ext_${mentorUserId}`);
    if (overrideStr) {
      const data = JSON.parse(overrideStr);
      if (data && typeof data === 'object') {
        return {
          yearsOfExperience: Number(data.yearsOfExperience) || 0,
          company: data.company || 'FPT University',
          projectsCount: Number(data.projectsCount) || 0,
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
          portfolios: Array.isArray(data.portfolios) ? data.portfolios : [],
        };
      }
    }
  } catch (e) {
    console.warn('Không tải được ghi đè mentor từ localStorage', e);
  }

  // 2. Mock mẫu dựa trên tên mentor tiêu biểu hoặc Chuyên ngành
  const nameLower = displayName.toLowerCase();
  const specLower = (specializationName || '').toLowerCase();

  // Mẫu 1: Trần Hoàng Long (AI/ML)
  if (nameLower.includes('long') || specLower.includes('ai') || specLower.includes('machine')) {
    return {
      yearsOfExperience: 2,
      company: 'FPT Software (AI Residency)',
      projectsCount: 6,
      achievements: [
        'Giải Nhất Nghiên cứu khoa học cấp Trường FPTU HCM 2025',
        'Top 10 cuộc thi FPT Edu Hackathon 2024 chuyên bảng AI',
        'Chứng chỉ nghiệp vụ TensorFlow Developer Certificate',
        'GPA chuyên ngành đạt xuất sắc 3.85 / 4.0'
      ],
      portfolios: [
        {
          id: 'p1_long',
          title: 'Hệ thống gợi ý môn học thông minh (FPTU SmartLearn)',
          role: 'Lead AI Engineer',
          description: 'Nghiên cứu và phát triển mô hình gợi ý lộ trình học tập, ghép cặp mentor tự động cho sinh viên Đại học FPT dựa trên dữ liệu điểm số và sở thích.',
          outcome: 'Được nghiệm thu cấp trường và thử nghiệm trên 300 sinh viên khóa K19, giúp tăng 40% tỷ lệ kết nối học tập thành công.',
          imageUrl: SVG_AI,
          githubUrl: 'https://github.com/longth/smart-learn',
          figmaUrl: 'https://figma.com/file/smart-learn-mockup'
        },
        {
          id: 'p2_long',
          title: 'Mô hình phát hiện gian lận thi cử qua Camera AI',
          role: 'Deep Learning Developer',
          description: 'Ứng dụng thuật toán YOLOv8 và MediaPipe để theo dõi tư thế đầu, mắt của thí sinh trong phòng thi nhằm phát hiện hành vi bất thường.',
          outcome: 'Độ chính xác nhận diện đạt 94.2% trong môi trường thử nghiệm thực tế phòng máy FPTU.',
          imageUrl: SVG_AI,
          githubUrl: 'https://github.com/longth/camera-cheat-detect'
        }
      ]
    };
  }

  // Mẫu 2: Lê Minh Hương (Fullstack / Web App)
  if (nameLower.includes('hương') || nameLower.includes('huong') || specLower.includes('phần mềm') || specLower.includes('software') || specLower.includes('fullstack')) {
    return {
      yearsOfExperience: 1,
      company: 'VNG Corporation (Freelance Developer)',
      projectsCount: 8,
      achievements: [
        'Hoàn thành 10+ dự án outsourcing cho doanh nghiệp vừa và nhỏ',
        'Top 3 FPT Techday Student Project 2025',
        'Chứng chỉ AWS Certified Cloud Practitioner',
        'Đồng sáng lập CLB Lập trình FPTU CodeClub'
      ],
      portfolios: [
        {
          id: 'p1_huong',
          title: 'Hệ thống Quản lý Ký túc xá FPTU (DormManager)',
          role: 'Fullstack Web Developer',
          description: 'Xây dựng web ứng dụng quản lý phòng ốc, báo cáo sự cố và hóa đơn điện nước cho ký túc xá Đại học FPT bằng Next.js, Spring Boot và PostgreSQL.',
          outcome: 'Giải quyết 500+ phản ánh sửa chữa phòng ốc mỗi tháng, rút ngắn thời gian xử lý sự cố từ 3 ngày xuống còn 8 giờ.',
          imageUrl: SVG_WEB,
          githubUrl: 'https://github.com/leminhhuong/dorm-manager',
          figmaUrl: 'https://figma.com/file/dorm-manager-ui'
        },
        {
          id: 'p2_huong',
          title: 'Cổng thanh toán điện tử sinh viên S-Pay',
          role: 'Backend Architect',
          description: 'Tích hợp hệ thống ví điện tử nội bộ cho phép sinh viên quét mã thanh toán tại căn tin trường qua PayOS và ngân hàng điện tử.',
          outcome: 'Hỗ trợ 15,000+ giao dịch thành công trong tuần đầu chạy thử nghiệm, đảm bảo an toàn tuyệt đối 100%.',
          imageUrl: SVG_WEB,
          githubUrl: 'https://github.com/leminhhuong/s-pay-backend'
        }
      ]
    };
  }

  // Mẫu 3: Phạm Thùy Linh (Digital Marketing / Business)
  if (nameLower.includes('linh') || specLower.includes('marketing') || specLower.includes('kinh doanh') || specLower.includes('business')) {
    return {
      yearsOfExperience: 2,
      company: 'FPT Software Marketing Agency',
      projectsCount: 5,
      achievements: [
        'Trưởng ban Truyền thông FPT Student Choice Awards 2025',
        'Chứng chỉ Google Advanced Data Analytics & SEO Certification',
        'Quản lý chiến dịch quảng cáo với ngân sách trên 200M VNĐ',
        'Sinh viên hoạt động phong trào tiêu biểu kỳ Spring 2025'
      ],
      portfolios: [
        {
          id: 'p1_linh',
          title: 'Chiến dịch truyền thông "FPTU NextGen Leader 2025"',
          role: 'Creative Director & Digital Marketer',
          description: 'Lập kế hoạch nội dung đa kênh (Facebook, TikTok), tổ chức chuỗi bài viết tối ưu SEO và quản lý ngân sách quảng cáo thu hút ứng viên tài năng.',
          outcome: 'Đạt 75,000+ lượt hiển thị tự nhiên, 3,200+ tương tác và tuyển chọn thành công 50 thủ lĩnh sinh viên xuất sắc.',
          imageUrl: SVG_MKT,
          behanceUrl: 'https://behance.net/linhpham/nextgen-leader'
        },
        {
          id: 'p2_linh',
          title: 'Tối ưu phễu chuyển đổi Landing Page Tuyển sinh FPTU',
          role: 'UI/UX Researcher & SEO Specialist',
          description: 'Phân tích bản đồ nhiệt (Hotjar) và thực hiện A/B testing điều chỉnh giao diện, nút đăng ký, cấu trúc thông tin để tăng tỷ lệ điền form đăng ký tư vấn.',
          outcome: 'Nâng tỷ lệ chuyển đổi (Conversion Rate) trên trang đích tuyển sinh lên 18.5% so với kỳ trước.',
          imageUrl: SVG_UIUX,
          figmaUrl: 'https://figma.com/file/fptu-admission-optimize',
          behanceUrl: 'https://behance.net/linhpham/landing-optimization'
        }
      ]
    };
  }

  // Mẫu mặc định cho các mentor khác dựa trên chuyên ngành chung
  const defaultPortfolio: MentorPortfolioItem[] = [];
  if (specLower.includes('thiết kế') || specLower.includes('design') || specLower.includes('ui') || specLower.includes('ux')) {
    defaultPortfolio.push({
      id: `p_def_${mentorUserId}_1`,
      title: 'Thiết kế hệ thống UI Kit & Website Tin tức FPTU',
      role: 'UI Designer',
      description: 'Thiết kế giao diện hiện đại, tối giản và đáp ứng đầy đủ tiêu chuẩn khả dụng (accessibility) cho trang tin tức của Hội sinh viên FPT.',
      outcome: 'Hoàn thiện 80+ màn hình thiết kế responsive, được chuyển giao cho đội phát triển web trường.',
      imageUrl: SVG_UIUX,
      figmaUrl: 'https://figma.com/file/fptu-news-design',
      behanceUrl: 'https://behance.net/design-showcase'
    });
  } else {
    defaultPortfolio.push({
      id: `p_def_${mentorUserId}_2`,
      title: 'Dự án Nghiên cứu & Ứng dụng Quản lý Học tập cá nhân',
      role: 'Team Leader',
      description: 'Xây dựng kế hoạch và quản lý dự án nhỏ hỗ trợ sinh viên lập thời khóa biểu và nhắc nhở làm bài tập về nhà.',
      outcome: 'Dự án thu hút 100+ bạn bè cùng lớp tải và sử dụng trực tiếp hàng ngày.',
      imageUrl: SVG_WEB,
      githubUrl: 'https://github.com/skillswap-user/study-tracker'
    });
  }

  return {
    yearsOfExperience: 1,
    company: 'Đại học FPT HCM',
    projectsCount: 3,
    achievements: [
      'Đạt thành tích học tập tốt tại FPT University',
      'Tham gia tích cực vào các hoạt động học thuật và đồ án nhóm',
      'GPA tích lũy đạt Khá/Giỏi'
    ],
    portfolios: defaultPortfolio
  };
};

export const saveExtendedMentorData = (
  mentorUserId: string,
  data: {
    yearsOfExperience: number;
    company: string;
    projectsCount: number;
    achievements: string[];
    portfolios: MentorPortfolioItem[];
  }
) => {
  try {
    localStorage.setItem(`mentor_ext_${mentorUserId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Không thể lưu ghi đè mentor vào localStorage', e);
  }
};
