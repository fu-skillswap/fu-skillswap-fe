import { useState } from 'react';
import { Bookmark, Calendar, Clock, Video, Check, X, Star, MessageSquare, Smile } from 'lucide-react';

interface MenteeBooking {
  id: string;
  mentorName: string;
  avatarUrl: string;
  skill: string;
  date: string;
  time: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  meetingLink?: string;
  rejectReason?: string;
  learningGoal: string;
  isReviewed?: boolean;
  reviewRating?: number;
  reviewComment?: string;
}

export const MenteeBookings: React.FC = () => {
  const [bookings, setBookings] = useState<MenteeBooking[]>([
    {
      id: 'b1',
      mentorName: 'Trần Hoàng Long',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
      skill: 'Python & Machine Learning',
      date: '2026-06-15',
      time: '14:00 - 15:30',
      status: 'PENDING',
      learningGoal: 'Học cơ bản về PyTorch và xây dựng mạng neural đơn giản',
    },
    {
      id: 'b2',
      mentorName: 'Lê Minh Hương',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      skill: 'React & Node.js',
      date: '2026-06-12',
      time: '09:30 - 11:00',
      status: 'ACCEPTED',
      meetingLink: 'https://meet.google.com/xyz-pdq-abc',
      learningGoal: 'Sửa lỗi re-render vô hạn trong React Context & Hook',
    },
    {
      id: 'b3',
      mentorName: 'Nguyễn Hoàng Nam',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
      skill: 'UI Design & Figma',
      date: '2026-06-08',
      time: '15:00 - 16:30',
      status: 'COMPLETED',
      meetingLink: 'https://meet.google.com/tuv-wxyz-qrs',
      learningGoal: 'Góp ý layout portfolio cá nhân và căn lề Auto Layout trong Figma',
      isReviewed: false,
    },
    {
      id: 'b4',
      mentorName: 'Nguyễn Tiến Đạt',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
      skill: 'An ninh mạng',
      date: '2026-06-05',
      time: '10:00 - 11:30',
      status: 'REJECTED',
      rejectReason: 'Khoảng thời gian này mình có lịch thi tại trường.',
      learningGoal: 'Hướng dẫn cài đặt Kali Linux song song trên Windows',
    },
  ]);

  const [activeBooking, setActiveBooking] = useState<MenteeBooking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [satisfactionNote, setSatisfactionNote] = useState('');
  const [publicComment, setPublicComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenReview = (booking: MenteeBooking) => {
    setActiveBooking(booking);
    setRating(5);
    setSatisfactionNote('');
    setPublicComment('');
    setIsPublic(true);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;

    // Simulate review save to state
    setBookings(
      bookings.map((b) => {
        if (b.id === activeBooking.id) {
          return {
            ...b,
            isReviewed: true,
            reviewRating: rating,
            reviewComment: publicComment,
          };
        }
        return b;
      })
    );

    setShowReviewModal(false);
    setSuccessMsg(`Cảm ơn bạn đã gửi đánh giá cho Mentor ${activeBooking.mentorName}!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSimulateComplete = (bookingId: string) => {
    setBookings(
      bookings.map((b) => {
        if (b.id === bookingId) {
          return { ...b, status: 'COMPLETED', isReviewed: false };
        }
        return b;
      })
    );
    setSuccessMsg('Đã kết thúc buổi học! Bạn có thể gửi phản hồi để giúp Mentor hoàn thiện hơn.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <Bookmark className="w-8 h-8 text-brand-terracotta" /> Lịch hẹn của tôi
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Quản lý các lời mời trao đổi kỹ năng đã gửi, truy cập phòng học trực tuyến, hoặc gửi phản hồi & đánh giá.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-field text-body font-semibold animate-fadeIn">
          <Check className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid Bookings */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="meetmind-card py-16 text-center text-brand-text-muted text-body font-semibold rounded-card">
            Bạn chưa gửi yêu cầu đặt lịch nào.
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="meetmind-card p-6 rounded-card relative overflow-hidden flex flex-col md:flex-row justify-between gap-6"
            >
              {/* Mentor detail, goal, dates */}
              <div className="space-y-3 flex-1 text-left">
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatarUrl}
                    alt={b.mentorName}
                    className="w-10 h-10 rounded-field object-cover border border-brand-border"
                  />
                  <div>
                    <span className="text-body font-bold text-brand-text block">{b.mentorName}</span>
                    <span className="text-meta text-brand-terracotta font-bold">{b.skill}</span>
                  </div>
                  <span className={`text-meta font-bold py-0.5 px-2 rounded-lg border ml-2 ${
                    b.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : b.status === 'ACCEPTED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : b.status === 'COMPLETED'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {b.status === 'PENDING' ? 'Chờ duyệt' : b.status === 'ACCEPTED' ? 'Đã nhận' : b.status === 'COMPLETED' ? 'Đã học xong' : 'Từ chối'}
                  </span>
                </div>

                <div className="space-y-1 bg-brand-bg/40 border border-brand-border p-3.5 rounded-card">
                  <p className="text-body font-bold text-brand-text flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-terracotta" /> Mục tiêu của bạn:
                  </p>
                  <p className="text-meta text-brand-text-muted font-medium pl-5 leading-relaxed">
                    {b.learningGoal}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-meta text-brand-text-muted font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-terracotta" /> Ngày: {b.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-blue" /> Thời gian: {b.time}
                  </span>
                  {b.meetingLink && b.status === 'ACCEPTED' && (
                    <span className="flex items-center gap-1 text-brand-blue">
                      <Video className="w-3.5 h-3.5 animate-pulse" /> Link phòng: <a href={b.meetingLink} target="_blank" rel="noreferrer" className="hover:underline font-bold text-brand-blue">{b.meetingLink}</a>
                    </span>
                  )}
                  {b.status === 'REJECTED' && b.rejectReason && (
                    <span className="text-red-500 font-bold">Lý do từ chối: {b.rejectReason}</span>
                  )}
                </div>
              </div>

              {/* Actions side */}
              <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                {b.status === 'PENDING' && (
                  <span className="text-meta text-brand-text-muted font-bold bg-brand-bg border border-brand-border px-3.5 py-2 rounded-field">
                    Đang chờ Mentor phản hồi
                  </span>
                )}

                {b.status === 'ACCEPTED' && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-blue/20 transition-all active:scale-95"
                    >
                      <Video className="w-3.5 h-3.5" /> Vào lớp học
                    </a>
                    <button
                      onClick={() => handleSimulateComplete(b.id)}
                      className="flex items-center gap-1 bg-surface hover:bg-brand-bg border border-brand-border text-brand-text text-body font-bold py-2.5 px-3.5 rounded-field cursor-pointer transition-all active:scale-95"
                    >
                      Kết thúc buổi học
                    </button>
                  </div>
                )}

                {b.status === 'COMPLETED' && (
                  <div className="space-y-1.5 text-right">
                    {b.isReviewed ? (
                      <div className="space-y-1 text-right">
                        <span className="text-meta text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-field block">
                          Đã gửi đánh giá
                        </span>
                        <div className="flex justify-end gap-0.5 text-amber-500">
                          {Array.from({ length: b.reviewRating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenReview(b)}
                        className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-95 animate-bounce"
                      >
                        <Smile className="w-3.5 h-3.5" /> Đánh giá buổi học
                      </button>
                    )}
                  </div>
                )}

                {b.status === 'REJECTED' && (
                  <span className="text-meta text-red-600 font-bold bg-red-50 border border-red-100 px-3.5 py-2 rounded-field">
                    Đã từ chối lịch hẹn
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Review & Feedback Modal */}
      {showReviewModal && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl text-left space-y-4">
            
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-left space-y-1 border-b border-brand-border pb-3">
              <h3 className="text-xl font-bold font-serif text-brand-text">Đánh giá & Góp ý buổi học</h3>
              <p className="text-brand-text-muted text-body font-medium">
                Chia sẻ trải nghiệm học tập cùng Mentor <span className="font-bold text-brand-text">{activeBooking.mentorName}</span>
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              
              {/* Star Rating */}
              <div className="text-center py-2 bg-brand-bg/40 border border-brand-border rounded-card space-y-1.5">
                <span className="text-meta font-bold text-brand-text-muted uppercase tracking-wider block">Độ hài lòng chung</span>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredRating !== null ? hoveredRating : rating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-brand-border fill-transparent'
                        } transition-colors duration-150`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-body font-bold text-brand-terracotta block">
                  {rating === 5 && 'Tuyệt vời, vượt mong đợi! ⭐'}
                  {rating === 4 && 'Rất tốt, rất nhiệt tình! 👍'}
                  {rating === 3 && 'Tạm ổn, cần cải thiện thêm 🤝'}
                  {rating === 2 && 'Chưa thực sự tốt 😕'}
                  {rating === 1 && 'Rất không hài lòng 😞'}
                </span>
              </div>

              {/* Private Satisfaction Notes */}
              <div>
                <label className="block text-body font-bold text-brand-text-muted mb-1.5">Góp ý riêng cho Mentor (Bảo mật, chỉ Mentor xem)</label>
                <textarea
                  value={satisfactionNote}
                  onChange={(e) => setSatisfactionNote(e.target.value)}
                  rows={2}
                  placeholder="Gợi ý: Cách truyền đạt của mentor có nhanh quá không? Cách chọn ví dụ thực tế đã dễ hiểu chưa?..."
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              {/* Public Review */}
              <div>
                <label className="block text-body font-bold text-brand-text-muted mb-1.5 flex items-center gap-1">
                  Đánh giá công khai (Hiển thị trên hồ sơ Mentor)
                </label>
                <textarea
                  required
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Anh Long hỗ trợ support phần neural network cực kỳ dễ hiểu. Cảm ơn anh rất nhiều!"
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              {/* Public toggle */}
              <div className="flex items-center gap-3">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-terracotta"></div>
                  <span className="ml-3 text-body font-bold text-brand-text-muted">Đồng ý hiển thị đánh giá này công khai</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-1/3 py-3 rounded-field border border-brand-border hover:bg-brand-bg text-brand-text text-body font-bold cursor-pointer transition-all active:scale-95 text-center"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-field bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-brand-terracotta/25 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Gửi phản hồi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
