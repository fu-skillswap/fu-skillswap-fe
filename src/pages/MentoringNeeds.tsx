// =====================================================================
// src/pages/MentoringNeeds.tsx — Bộ 5 câu hỏi nhu cầu mentoring của mentee.
// Contract BE: GET questionnaire -> render radio -> PUT 5 answer code phẳng.
// Trả lời xong giúp hệ thống gợi ý mentor phù hợp hơn ở trang khám phá.
// =====================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Check, Sparkles, ArrowRight } from 'lucide-react';
import { matchingApi } from '../api/matching';
import type { MatchingQuestionnaire } from '../api/types';

export const MentoringNeeds: React.FC = () => {
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<MatchingQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [q, profile] = await Promise.all([
          matchingApi.getQuestionnaire(),
          matchingApi.getProfile().catch(() => null),
        ]);
        if (!alive) return;
        setQuestionnaire(q);
        // Prefill từ câu trả lời gần nhất (map questionCode -> optionCode).
        if (profile?.latestAnswerCodes) setAnswers({ ...profile.latestAnswerCodes });
      } catch (e: any) {
        if (alive) setLoadError(e?.response?.data?.message || 'Không tải được bộ câu hỏi. Vui lòng thử lại.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const questions = useMemo(
    () => (questionnaire?.questions ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [questionnaire],
  );
  const answeredCount = questions.filter((q) => answers[q.code]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const handleSubmit = async () => {
    if (!allAnswered) { setError('Vui lòng trả lời đủ các câu hỏi.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const codes = questions.map((q) => answers[q.code]);
      await matchingApi.submit({
        phase: 'ACTIVE',
        question1AnswerCode: codes[0],
        question2AnswerCode: codes[1],
        question3AnswerCode: codes[2],
        question4AnswerCode: codes[3],
        question5AnswerCode: codes[4],
      });
      navigate('/mentors', { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không lưu được câu trả lời. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-left flex justify-center px-5 py-10 sm:py-14">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-meta font-extrabold uppercase tracking-wider py-1 px-3 rounded-full border border-brand-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Cá nhân hoá gợi ý mentor
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg mt-3">Nhu cầu mentoring của bạn</h1>
          <p className="text-fg-muted text-body font-medium mt-1.5 leading-relaxed">
            Trả lời nhanh {questions.length || 5} câu để hệ thống gợi ý đúng mentor hợp với bạn. Bạn có thể chỉnh lại bất cứ lúc nào.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-fg-muted"><Loader2 className="w-7 h-7 animate-spin" /></div>
        ) : loadError ? (
          <div className="flex items-start gap-2 text-body font-bold text-danger bg-danger/10 border border-danger/20 rounded-card px-4 py-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> {loadError}
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-300"
                  style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-meta font-bold text-fg-muted shrink-0">{answeredCount}/{questions.length}</span>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.code} className="bg-surface border border-line rounded-card p-5">
                  <p className="text-body font-bold text-fg leading-snug">
                    <span className="text-brand-primary">{idx + 1}.</span> {q.questionText}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((opt) => {
                      const selected = answers[q.code] === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => { setAnswers((prev) => ({ ...prev, [q.code]: opt.code })); setError(null); }}
                          className={`w-full flex items-center gap-3 text-left px-3.5 py-3 rounded-field border transition-all active:scale-[0.99] ${
                            selected
                              ? 'border-brand-primary bg-brand-primary/8 text-fg'
                              : 'border-line bg-surface hover:border-brand-primary/40 text-fg-muted'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selected ? 'border-brand-primary bg-brand-primary text-white' : 'border-line'
                          }`}>
                            {selected && <Check className="w-3 h-3" />}
                          </span>
                          <span className="text-body font-semibold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 text-meta font-bold text-danger bg-danger/10 border border-danger/20 rounded-field px-3 py-2 mt-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <Link to="/dashboard" className="text-body font-bold text-fg-muted hover:text-fg px-2 py-2.5">
                Để sau
              </Link>
              <button
                onClick={handleSubmit}
                disabled={submitting || !allAnswered}
                className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-body font-bold py-3 px-7 rounded-full shadow-md shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Lưu & tìm mentor
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
