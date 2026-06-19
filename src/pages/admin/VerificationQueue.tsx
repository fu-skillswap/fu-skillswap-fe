import { useState, useEffect } from 'react';
import { FileText, Check, X, FileCheck, HelpCircle } from 'lucide-react';

interface VerificationRequest {
  id: string;
  applicantName: string;
  email: string;
  campus: string;
  specialization: string;
  documentName: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export const VerificationQueue: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const storedRequests = localStorage.getItem('mockMentorRequests');
    if (storedRequests) {
      try {
        setRequests(JSON.parse(storedRequests));
      } catch (e) {
        console.error('Failed to parse mockMentorRequests', e);
      }
    } else {
      const initialRequests: VerificationRequest[] = [
        {
          id: 'req1',
          applicantName: 'Trần Hoàng Long',
          email: 'longth.se18@fpt.edu.vn',
          campus: 'HCM',
          specialization: 'Trí tuệ nhân tạo',
          documentName: 'Bang_Diem_Chung_Chi_AI.pdf',
          submittedAt: '2026-06-10 14:30',
          status: 'PENDING',
        },
        {
          id: 'req2',
          applicantName: 'Phạm Thùy Linh',
          email: 'linhpt.ba18@fpt.edu.vn',
          campus: 'HA_NOI',
          specialization: 'Marketing số',
          documentName: 'Card_SinhVien_K18.png',
          submittedAt: '2026-06-11 09:15',
          status: 'PENDING',
        },
        {
          id: 'req3',
          applicantName: 'Lê Minh Hương',
          email: 'huonglm.se19@fpt.edu.vn',
          campus: 'HCM',
          specialization: 'Lập trình Fullstack',
          documentName: 'Chung_Chi_IELTS_7.5.pdf',
          submittedAt: '2026-06-09 11:00',
          status: 'APPROVED',
        },
      ];
      localStorage.setItem('mockMentorRequests', JSON.stringify(initialRequests));
      setRequests(initialRequests);
    }
  }, []);

  const handleOpenDoc = (req: VerificationRequest) => {
    setActiveRequest(req);
    setShowDocModal(true);
  };

  const handleApprove = (reqId: string) => {
    const updated = requests.map((r) => {
      if (r.id === reqId) {
        // If this request belongs to the demo user, update their role and application status
        const demoUserStr = localStorage.getItem('demoUser');
        if (demoUserStr) {
          try {
            const demoUser = JSON.parse(demoUserStr);
            if (demoUser.email === r.email) {
              demoUser.roles = ['MENTOR'];
              localStorage.setItem('demoUser', JSON.stringify(demoUser));
              localStorage.setItem('mockMentorRequest', JSON.stringify({ status: 'APPROVED' }));
            }
          } catch (e) {
            console.error('Failed to parse demoUser during approval', e);
          }
        }
        return { ...r, status: 'APPROVED' as const };
      }
      return r;
    });

    setRequests(updated);
    localStorage.setItem('mockMentorRequests', JSON.stringify(updated));
    setSuccessMsg('Hồ sơ Mentor đã được phê duyệt thành công. Quyền Mentor đã được cấp!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleOpenReject = (req: VerificationRequest) => {
    setActiveRequest(req);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    if (activeRequest) {
      const updated = requests.map((r) => {
        if (r.id === activeRequest.id) {
          const demoUserStr = localStorage.getItem('demoUser');
          if (demoUserStr) {
            try {
              const demoUser = JSON.parse(demoUserStr);
              if (demoUser.email === r.email) {
                localStorage.setItem('mockMentorRequest', JSON.stringify({
                  status: 'REJECTED',
                  specialization: r.specialization,
                  documentName: r.documentName,
                  submittedAt: r.submittedAt,
                  rejectionReason
                }));
              }
            } catch (e) {
              console.error('Failed to parse demoUser during reject', e);
            }
          }
          return { ...r, status: 'REJECTED' as const, rejectionReason };
        }
        return r;
      });

      setRequests(updated);
      localStorage.setItem('mockMentorRequests', JSON.stringify(updated));
      setShowRejectModal(false);
      setSuccessMsg('Đã từ chối đơn đăng ký làm Mentor của ứng viên.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-brand-text font-serif tracking-tight flex items-center gap-2">
          <FileCheck className="w-8 h-8 text-brand-terracotta" /> Hồ sơ chờ xác thực
        </h1>
        <p className="text-brand-text-muted text-body font-medium">
          Duyệt danh sách đơn xin làm Mentor của sinh viên FPTU. Kiểm tra tài liệu chứng minh và phê duyệt quyền.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-field text-body font-semibold">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid */}
      <div className="meetmind-card rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-body text-left border-collapse">
            
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-brand-text-muted font-bold text-meta uppercase tracking-wider">
                <th className="py-4 px-6">Ứng viên</th>
                <th className="py-4 px-4">Chuyên ngành xin Mentor</th>
                <th className="py-4 px-4">Tài liệu đính kèm</th>
                <th className="py-4 px-4">Ngày gửi đơn</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-6 text-right">Quyết định</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-text-muted font-semibold">
                    Hàng chờ trống. Không có hồ sơ nào chờ duyệt.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-bg/20 transition-colors">
                    
                    {/* Applicant details */}
                    <td className="py-4 px-6 font-bold text-brand-text text-left">
                      <div>{r.applicantName}</div>
                      <span className="text-meta text-brand-text-muted font-semibold">{r.email}</span>
                    </td>

                    {/* Specialization */}
                    <td className="py-4 px-4 font-semibold">
                      <span className="text-brand-terracotta bg-brand-terracotta/10 border border-brand-terracotta/20 px-2 py-0.5 rounded-lg text-meta font-bold">
                        {r.specialization} ({r.campus})
                      </span>
                    </td>

                    {/* Document */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleOpenDoc(r)}
                        className="inline-flex items-center gap-1.5 text-brand-blue font-bold hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{r.documentName}</span>
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 font-semibold text-brand-text-muted">{r.submittedAt}</td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-block text-meta font-bold py-0.5 px-2 rounded-lg ${
                        r.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-850 border border-amber-200'
                          : r.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {r.status === 'PENDING' ? 'Chờ duyệt' : r.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                      {r.status === 'REJECTED' && r.rejectionReason && (
                        <p className="text-meta text-red-500 font-semibold mt-1">Lý do: {r.rejectionReason}</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {r.status === 'PENDING' ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 active:scale-95 transition-all cursor-pointer"
                            title="Chấp nhận"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReject(r)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                            title="Từ chối"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-meta text-brand-text-muted font-bold">-</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Document Review Modal */}
      {showDocModal && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border border-brand-border rounded-card p-6 relative">
            <button
              onClick={() => setShowDocModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-brand-text text-left">Xem tài liệu minh chứng</h3>
              
              <div className="bg-brand-bg border border-brand-border rounded-card p-3 text-left">
                <span className="text-body text-brand-text-muted font-bold block">Tên tệp:</span>
                <span className="text-body text-brand-text font-bold flex items-center gap-1.5 mt-0.5">
                  <FileText className="w-4 h-4 text-brand-terracotta" /> {activeRequest.documentName}
                </span>
              </div>

              {/* Simulated Document Preview */}
              <div className="w-full h-64 bg-brand-bg border border-brand-border rounded-card flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-card bg-surface border border-brand-border flex items-center justify-center text-brand-terracotta shadow-sm">
                  <HelpCircle className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <p className="text-body font-bold text-brand-text">Xem trước tài liệu minh chứng</p>
                  <p className="text-body text-brand-text-muted font-semibold mt-1">
                    Bằng chứng học tập / Chứng chỉ chuyên ngành của {activeRequest.applicantName}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleApprove(activeRequest.id);
                    setShowDocModal(false);
                  }}
                  className="flex-1 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white text-body font-bold py-2.5 px-4 rounded-field cursor-pointer shadow-md shadow-brand-terracotta/20 transition-all active:scale-[0.98]"
                >
                  Duyệt hồ sơ này
                </button>
                <button
                  onClick={() => {
                    setShowDocModal(false);
                    handleOpenReject(activeRequest);
                  }}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-body font-bold py-2.5 px-4 rounded-field cursor-pointer transition-all active:scale-[0.98]"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative">
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="text-left">
                <h3 className="text-lg font-bold font-serif text-brand-text">Từ chối hồ sơ Mentor</h3>
                <p className="text-brand-text-muted text-body font-semibold mt-0.5">
                  Vui lòng cung cấp lý do để ứng viên biết cần bổ sung gì.
                </p>
              </div>

              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Lý do từ chối (bắt buộc)</label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ví dụ: Tài liệu minh chứng bị mờ, vui lòng chụp rõ nét hơn hoặc cung cấp bảng điểm chính thức..."
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white text-body font-bold py-3 px-4 rounded-field cursor-pointer active:scale-[0.98] transition-all"
              >
                Gửi phản hồi Từ chối
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
