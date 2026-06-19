import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Calendar, Check, X, Star, Search, SlidersHorizontal, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Mentor {
  id: string;
  name: string;
  avatarUrl: string;
  major: string;
  specialization: string;
  skills: string[];
  rating: number;
  matchScore: number;
  bio: string;
  status: 'AVAILABLE' | 'BUSY';
  matchingReasons: string[];
  reviews: Review[];
}

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
  swappedSkill: string;
}

export const Mentors: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review Drawer State
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [drawerMentor, setDrawerMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    // Simulated fetch
    const timer = setTimeout(() => {
      // Mock Mentors with dynamic reviews & matching reasons
      const mockMentors: Mentor[] = [
        {
          id: 'm1',
          name: 'Trần Hoàng Long',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
          major: 'Kỹ thuật phần mềm',
          specialization: 'Trí tuệ nhân tạo',
          skills: ['Python', 'PyTorch', 'Machine Learning', 'SQL'],
          rating: 4.9,
          matchScore: 98,
          status: 'AVAILABLE',
          bio: 'Sinh viên năm 4 K18, đạt giải nghiên cứu khoa học cấp trường. Sẵn sàng chia sẻ kiến thức AI/ML và muốn trao đổi thêm kỹ năng thiết kế UI/UX.',
          matchingReasons: [
            'Cùng cơ sở FPTU HCM',
            'Sở hữu kỹ năng Python bạn đang cần tìm',
            'Chuyên môn AI bổ trợ cho định hướng lập trình Fullstack của bạn'
          ],
          reviews: [
            {
              id: 'r1_1',
              reviewerName: 'Nguyễn Hoàng Nam',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
              rating: 5,
              comment: 'Anh Long giảng bài AI rất dễ hiểu. Chỉ sau một buổi trao đổi mình đã biết cấu hình PyTorch cơ bản và tự train model nhỏ.',
              date: '2026-06-08',
              swappedSkill: 'Python ⇄ Figma UI'
            },
            {
              id: 'r1_2',
              reviewerName: 'Lê Minh Hương',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
              rating: 4.8,
              comment: 'Mentor siêu nhiệt tình, giải đáp tất cả thắc mắc và còn chia sẻ thêm tài liệu nghiên cứu khoa học hữu ích.',
              date: '2026-06-04',
              swappedSkill: 'Machine Learning ⇄ React'
            }
          ]
        },
        {
          id: 'm2',
          name: 'Lê Minh Hương',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
          major: 'Kỹ thuật phần mềm',
          specialization: 'Lập trình Fullstack',
          skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
          rating: 4.8,
          matchScore: 92,
          status: 'AVAILABLE',
          bio: 'Chuyên về web app, có 1 năm kinh nghiệm làm freelancer. Muốn học hỏi thêm về DevOps và bảo mật mạng.',
          matchingReasons: [
            'Cùng ngành học Kỹ thuật phần mềm',
            'Sẵn sàng trao đổi kỹ năng React/TypeScript',
            'Học tập cùng cơ sở HCM giúp dễ dàng gặp mặt trực tiếp (Offline swap)'
          ],
          reviews: [
            {
              id: 'r2_1',
              reviewerName: 'Nguyễn Tiến Đạt',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
              rating: 5,
              comment: 'Chị Hương chỉ lỗi re-render React cực nhanh. Tiết kiệm cho mình cả tuần tự debug.',
              date: '2026-06-05',
              swappedSkill: 'React Hook ⇄ Kali Linux'
            },
            {
              id: 'r2_2',
              reviewerName: 'Trần Hoàng Long',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
              rating: 4.6,
              comment: 'Nền tảng Node.js vững, giải thích cặn kẽ cách kết nối DB và cấu trúc API.',
              date: '2026-06-01',
              swappedSkill: 'Backend ⇄ PyTorch'
            }
          ]
        },
        {
          id: 'm3',
          name: 'Nguyễn Tiến Đạt',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
          major: 'An toàn thông tin',
          specialization: 'An ninh mạng',
          skills: ['Linux', 'Network Pentesting', 'Docker'],
          rating: 4.7,
          matchScore: 85,
          status: 'BUSY',
          bio: 'Đam mê hacking và an ninh hệ thống. Muốn học lập trình React Native hoặc Flutter để làm app mobile.',
          matchingReasons: [
            'Mentor có chung mối quan tâm về phát triển Mobile App',
            'Sở hữu kỹ năng Docker & Linux bổ trợ tốt cho đồ án tốt nghiệp',
            'Thường xuyên hoạt động tích cực trên cộng đồng học tập'
          ],
          reviews: [
            {
              id: 'r3_1',
              reviewerName: 'Nguyễn Hoàng Nam',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
              rating: 4.7,
              comment: 'Hướng dẫn cài đặt Kali Linux song song rất chi tiết, có kèm tài liệu cấu hình chi tiết.',
              date: '2026-05-28',
              swappedSkill: 'Network Pentest ⇄ Flutter UI'
            }
          ]
        },
        {
          id: 'm4',
          name: 'Phạm Thùy Linh',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linh',
          major: 'Quản trị kinh doanh',
          specialization: 'Marketing số',
          skills: ['SEO', 'Content Strategy', 'Google Ads', 'Figma'],
          rating: 4.9,
          matchScore: 78,
          status: 'AVAILABLE',
          bio: 'Sinh viên K17. Có kinh nghiệm chạy chiến dịch marketing thực chiến. Muốn học lập trình Python cơ bản để làm phân tích dữ liệu.',
          matchingReasons: [
            'Chuyên môn Marketing bổ trợ cho kỹ năng bán hàng của bạn',
            'Phù hợp swap chéo kỹ năng: Marketing ⇄ Lập trình Python cơ bản'
          ],
          reviews: [
            {
              id: 'r4_1',
              reviewerName: 'Lê Minh Hương',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
              rating: 5,
              comment: 'Chiến dịch marketing số của nhóm mình đạt KPI vượt mong đợi nhờ chị Linh tư vấn tối ưu SEO và phễu khách hàng.',
              date: '2026-06-02',
              swappedSkill: 'Digital Marketing ⇄ Python Data Analysis'
            }
          ]
        },
        {
          id: 'm5',
          name: 'Nguyễn Hoàng Nam',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
          major: 'Thiết kế mỹ thuật số',
          specialization: 'Thiết kế đồ họa',
          skills: ['Photoshop', 'Illustrator', 'Figma', 'UI Design'],
          rating: 4.6,
          matchScore: 75,
          status: 'AVAILABLE',
          bio: 'Thích vẽ vời và sáng tạo giao diện. Muốn tìm bạn hỗ trợ học lập trình HTML/CSS/JS để tự code portfolio cá nhân.',
          matchingReasons: [
            'Kỹ năng thiết kế UI Design bằng Figma cực kỳ xuất sắc',
            'Muốn học trao đổi Front-end cơ bản (HTML/CSS/JS) - thế mạnh của bạn!'
          ],
          reviews: [
            {
              id: 'r5_1',
              reviewerName: 'Trần Hoàng Long',
              reviewerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
              rating: 4.6,
              comment: 'Góp ý Auto Layout Figma rất bổ ích, giúp mình xây dựng UI thống nhất và khoa học hơn.',
              date: '2026-06-09',
              swappedSkill: 'UI Figma ⇄ Code HTML/CSS'
            }
          ]
        },
      ];

      // Dynamically refine matching reasons based on active profile campus
      setMentors(mockMentors);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [user]);

  // Filter logic
  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialization =
      selectedSpecialization === 'ALL' || m.specialization === selectedSpecialization;

    const matchesStatus =
      selectedStatus === 'ALL' || m.status === selectedStatus;

    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  const handleOpenBooking = (mentor: Mentor) => {
    setActiveMentor(mentor);
    setShowBookingModal(true);
    setBookingSuccess(false);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBookingSuccess(true);
      
      // Save request to localStorage so user can see in MenteeBookings
      const currentBookingsStr = localStorage.getItem('mockMenteeBookings');
      let currentBookings: any[] = [];
      if (currentBookingsStr) {
        try {
          currentBookings = JSON.parse(currentBookingsStr);
        } catch (err) {
          currentBookings = [];
        }
      }
      
      if (activeMentor) {
        const newMenteeBooking = {
          id: 'b_custom_' + Date.now(),
          mentorName: activeMentor.name,
          avatarUrl: activeMentor.avatarUrl,
          skill: activeMentor.specialization,
          date: bookingDate,
          time: bookingTime,
          status: 'PENDING' as const,
          learningGoal: message,
        };
        currentBookings.unshift(newMenteeBooking);
        localStorage.setItem('mockMenteeBookings', JSON.stringify(currentBookings));

        // Also save to active mentor's booking queue to mock interactions
        const mentorBookingsStr = localStorage.getItem('mockMentorBookings');
        let mentorBookings = [];
        if (mentorBookingsStr) {
          try {
            mentorBookings = JSON.parse(mentorBookingsStr);
          } catch (err) {
            mentorBookings = [];
          }
        }
        
        const newBooking = {
          id: 'b_custom_' + Date.now(),
          menteeName: user?.fullName || 'Demo Mentee User',
          avatarUrl: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentee',
          specialization: user?.email ? 'Kỹ thuật phần mềm' : 'An toàn thông tin',
          learningGoalTitle: message.slice(0, 40) + '...',
          learningGoalDescription: message,
          date: bookingDate,
          time: bookingTime,
          status: 'PENDING'
        };
        
        mentorBookings.unshift(newBooking);
        localStorage.setItem('mockMentorBookings', JSON.stringify(mentorBookings));
      }

      setTimeout(() => {
        setShowBookingModal(false);
        setBookingDate('');
        setBookingTime('');
        setMessage('');
      }, 1500);
    }, 800);
  };

  const handleOpenReviews = (mentor: Mentor) => {
    setDrawerMentor(mentor);
    setShowReviewDrawer(true);
  };

  const specializations = Array.from(new Set(mentors.map((m) => m.specialization)));

  return (
    <div className="space-y-8 text-left relative min-h-screen pb-16">
      
      {/* Title */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1 bg-brand-terracotta/15 text-brand-terracotta text-body font-bold py-1 px-3 rounded-full border border-brand-terracotta/25">
          <Sparkles className="w-3.5 h-3.5" /> Kết nối kỹ năng FPT
        </span>
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight">
          Tìm kiếm Mentor & Bạn cùng tiến
        </h1>
        <p className="text-brand-text-muted text-body max-w-2xl font-medium">
          Lọc và ghép cặp với các sinh viên khóa trên hoặc các bạn cùng ngành để bắt đầu phiên trao đổi kỹ năng học thuật.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface border border-brand-border p-4 rounded-card shadow-sm">
        
        {/* Search bar */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-grey" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc từ khóa kỹ năng (React, Python...)..."
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-3 pl-10 pr-4 text-body text-brand-text focus:outline-none focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta transition-all font-semibold"
          />
        </div>

        {/* Specialization Filter */}
        <div className="relative">
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-3 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
          >
            <option value="ALL">Tất cả chuyên ngành</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-3 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-bold"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng (Available)</option>
            <option value="BUSY">Đang bận (Busy)</option>
          </select>
        </div>

      </div>

      {/* Grid Mentors */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="meetmind-card h-64 animate-pulse"></div>
          ))}
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="meetmind-card py-16 text-center space-y-3 rounded-card">
          <SlidersHorizontal className="w-10 h-10 text-brand-grey mx-auto" />
          <p className="text-brand-text font-bold text-body">Không tìm thấy Mentor phù hợp</p>
          <p className="text-brand-text-muted text-body font-semibold">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((m) => (
            <div
              key={m.id}
              className="meetmind-card meetmind-card-hover p-6 flex flex-col justify-between gap-5 relative overflow-hidden group rounded-card"
            >
              <div className="space-y-4">
                
                {/* Avatar & Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-14 h-14 rounded-card bg-brand-bg object-cover border border-brand-border"
                  />
                  <div className="space-y-1 text-left">
                    <h3 className="text-brand-text font-bold text-base leading-tight group-hover:text-brand-terracotta transition-colors">
                      {m.name}
                    </h3>
                    <p className="text-brand-text-muted text-body font-semibold">
                      {m.major}
                    </p>
                    <span className="inline-block text-meta font-extrabold text-brand-terracotta bg-brand-terracotta/15 border border-brand-terracotta/25 px-2 py-0.5 rounded-lg">
                      {m.specialization}
                    </span>
                  </div>
                </div>

                {/* Rating & Action to open drawer */}
                <div className="flex items-center gap-4 text-body font-bold">
                  <button
                    onClick={() => handleOpenReviews(m)}
                    className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors font-bold cursor-pointer"
                    title="Click để xem nhận xét chi tiết"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500" /> {m.rating}{' '}
                    <span className="text-brand-text-muted text-meta underline font-semibold ml-1">
                      ({m.reviews.length} đánh giá)
                    </span>
                  </button>
                  <span className="text-brand-border font-normal">|</span>
                  <span className="text-brand-text-muted font-semibold">
                    Tương hợp:{' '}
                    <span className="text-brand-terracotta font-extrabold">{m.matchScore}%</span>
                  </span>
                </div>

                {/* Match Rationale reasons */}
                <div className="bg-brand-bg/50 border border-brand-border/60 p-3 rounded-card text-left space-y-1">
                  <span className="text-meta font-bold text-brand-terracotta uppercase tracking-wider block">Gợi ý tương hợp</span>
                  <ul className="space-y-1">
                    {m.matchingReasons.map((reason, idx) => (
                      <li key={idx} className="text-meta text-brand-text font-medium flex items-start gap-1">
                        <Check className="w-3.5 h-3.5 text-brand-terracotta shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bio */}
                <p className="text-brand-text-muted text-body leading-relaxed font-medium line-clamp-3">
                  {m.bio}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5">
                  {m.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-meta bg-brand-bg border border-brand-border text-brand-text-muted py-0.5 px-2 rounded-lg font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>

              </div>

              {/* Footer status & button */}
              <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${m.status === 'AVAILABLE' ? 'bg-green-500 dot-glow-green' : 'bg-red-500'}`}></span>
                  <span className="text-meta text-brand-text-muted uppercase tracking-wider font-extrabold">
                    {m.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bận'}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenBooking(m)}
                  disabled={m.status === 'BUSY'}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold shadow-md shadow-brand-terracotta/20 hover:opacity-90 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-3.5 h-3.5" /> Lên lịch
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Review Drawer component */}
      {showReviewDrawer && drawerMentor && (
        <>
          {/* Drawer backdrop */}
          <div
            onClick={() => setShowReviewDrawer(false)}
            className="fixed inset-0 z-45 bg-black/35 backdrop-blur-sm transition-all duration-300"
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-surface border-l border-brand-border shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slideLeft text-left">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div>
                  <h3 className="text-lg font-bold font-serif text-brand-text">Đánh giá từ sinh viên</h3>
                  <p className="text-body text-brand-text-muted font-medium mt-0.5">Phản hồi công khai cho Mentor {drawerMentor.name}</p>
                </div>
                <button
                  onClick={() => setShowReviewDrawer(false)}
                  className="p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="flex items-center gap-4 bg-brand-bg/40 border border-brand-border p-4 rounded-card">
                <div className="text-center shrink-0 pr-4 border-r border-brand-border">
                  <span className="text-3xl font-extrabold text-brand-text font-serif">{drawerMentor.rating}</span>
                  <div className="flex justify-center gap-0.5 text-amber-500 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(drawerMentor.rating) ? 'fill-amber-500' : 'text-brand-border'}`} />
                    ))}
                  </div>
                  <span className="text-meta text-brand-text-muted font-bold block mt-1.5">{drawerMentor.reviews.length} đánh giá</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-meta font-semibold text-brand-text">
                    <span>Thái độ:</span>
                    <span className="text-brand-terracotta font-bold">Cực kỳ nhiệt tình ⭐⭐⭐⭐⭐</span>
                  </div>
                  <div className="flex items-center gap-2 text-meta font-semibold text-brand-text">
                    <span>Chuyên môn:</span>
                    <span className="text-brand-blue font-bold">Giải thích sâu, dễ hiểu ⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {drawerMentor.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 border border-brand-border rounded-card space-y-3 bg-surface hover:shadow-sm transition-shadow">
                    
                    {/* Header: Reviewer info, date */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.reviewerAvatar}
                          alt={rev.reviewerName}
                          className="w-8 h-8 rounded-lg border border-brand-border"
                        />
                        <div>
                          <span className="text-body font-bold text-brand-text block">{rev.reviewerName}</span>
                          <span className="text-meta text-brand-text-muted font-semibold block">{rev.date}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-body text-brand-text leading-relaxed font-medium">
                      "{rev.comment}"
                    </p>

                    {/* Skill swapped pill */}
                    <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-meta font-bold text-brand-text-muted">
                      <span>Nội dung học:</span>
                      <span className="bg-brand-bg border border-brand-border px-2 py-0.5 rounded-md text-brand-terracotta font-extrabold flex items-center gap-1">
                        <Heart className="w-3 h-3 text-brand-terracotta fill-brand-terracotta" /> {rev.swappedSkill}
                      </span>
                    </div>

                  </div>
                ))}
              </div>

            </div>

            {/* Book scheduling trigger */}
            <div className="pt-4 border-t border-brand-border">
              <button
                onClick={() => {
                  setShowReviewDrawer(false);
                  handleOpenBooking(drawerMentor);
                }}
                disabled={drawerMentor.status === 'BUSY'}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold cursor-pointer disabled:opacity-40 shadow-md shadow-brand-terracotta/25 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt lịch học cùng {drawerMentor.name}</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* Booking Scheduler Modal */}
      {showBookingModal && activeMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl">
            
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto border border-green-200">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-brand-text font-bold text-base">Yêu cầu đã được gửi!</h3>
                <p className="text-brand-text-muted text-body font-semibold">Hệ thống đã gửi đề xuất trao đổi tới {activeMentor.name}. Theo dõi lịch hẹn ở mục "Lịch hẹn của tôi".</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="text-left">
                  <h3 className="text-brand-text font-bold text-lg font-serif">Đặt lịch với {activeMentor.name}</h3>
                  <p className="text-brand-text-muted text-body font-medium mt-0.5">Thỏa thuận môn học / kỹ năng cần trao đổi của bạn</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-brand-bg border border-brand-border rounded-card text-left">
                  <img
                    src={activeMentor.avatarUrl}
                    alt={activeMentor.name}
                    className="w-10 h-10 rounded-field border border-brand-border"
                  />
                  <div>
                    <span className="text-body font-bold text-brand-text block">{activeMentor.name}</span>
                    <span className="text-meta text-brand-terracotta font-bold">{activeMentor.specialization}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Ngày hẹn</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Giờ hẹn</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta cursor-pointer font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1">Đề xuất trao đổi kỹ năng</label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ví dụ: Mình có thể hỗ trợ bạn làm quen với HTML/CSS/JS, đổi lại bạn có thể hướng dẫn mình phần cơ bản của Python không?"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-field py-2.5 px-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium animate-fadeIn"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/20"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi lời mời Swap</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
