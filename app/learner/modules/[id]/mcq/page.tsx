"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface OptionData {
  id: string;
  optionText: string;
}

interface QuestionData {
  id: string;
  questionText: string;
  marks: number;
  sequenceOrder: number;
  options: OptionData[];
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  status: string;
}

export default function LearnerQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submissions map: questionId -> selectedOptionId
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [showWarning, setShowWarning] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (id) fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    setLoading(true);
    const res = await apiFetch(`/modules/${id}/quiz`);
    if (res.success && res.data) {
      setQuestions(res.data);
    } else {
      setError(res.message || "Failed to load quiz. You may need to complete the module content first.");
    }
    setLoading(false);
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleInitialSubmit = () => {
    const answeredCount = Object.keys(selections).length;
    if (answeredCount < questions.length) {
      setShowWarning(true);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setShowWarning(false);
    setSubmitting(true);
    
    // Format for backend: { questionId, selectedOptionId }
    const submissions = questions.map(q => ({
      questionId: q.id,
      selectedOptionId: selections[q.id] || null
    }));

    const res = await apiFetch(`/modules/${id}/quiz/submit`, {
      method: "POST",
      body: JSON.stringify({ submissions }),
    });

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.message || "Failed to submit quiz.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push(`/learner/modules/${id}`)} className="rounded-lg bg-slate-800 px-6 py-2.5 font-medium text-white hover:bg-slate-700 transition-colors">
            Back to Module
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl shadow-black/50">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h1>
            <p className="text-slate-400 mb-8">You have successfully completed this module's assessment.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <p className="text-sm font-medium text-slate-400 mb-1">Score</p>
                <p className="text-4xl font-bold text-emerald-400">{result.percentage}%</p>
                <p className="text-sm text-slate-500 mt-2">{result.obtainedMarks} / {result.totalMarks} Marks</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-sm text-slate-400">Total Questions</span>
                  <span className="text-sm font-bold text-white">{result.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-sm text-slate-400">Correct Answers</span>
                  <span className="text-sm font-bold text-emerald-400">{result.correctAnswers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Incorrect/Unanswered</span>
                  <span className="text-sm font-bold text-red-400">{result.incorrectAnswers}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
              <p className="text-blue-300 font-medium">Module Status: {result.status}</p>
            </div>

            <button onClick={() => router.push("/learner/modules")} className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
              Return to My Modules
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/learner/modules/${id}`)} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Module Assessment</h1>
          </div>
          <div className="text-sm font-medium text-slate-400">
            {Object.keys(selections).length} / {questions.length} Answered
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 mt-6 space-y-8">
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-500">No questions available for this module.</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white leading-relaxed">{q.questionText}</h3>
                  <p className="text-sm text-slate-500 mt-1">{q.marks} Marks</p>
                </div>
              </div>
              
              <div className="space-y-3 pl-12">
                {q.options.map((opt) => {
                  const isSelected = selections[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleOptionSelect(q.id, opt.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-600/10 border-blue-500 shadow-sm"
                          : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "border-blue-500" : "border-slate-500"
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                      <span className={`text-base ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {opt.optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {questions.length > 0 && (
          <div className="flex justify-end pt-4">
            <button 
              onClick={handleInitialSubmit}
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-10 py-4 font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
            >
              Submit Assessment
            </button>
          </div>
        )}
      </div>

      {/* Unanswered Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Unanswered Questions</h3>
            <p className="text-slate-400 mb-8">
              You have {questions.length - Object.keys(selections).length} unanswered question(s). 
              Unanswered questions will receive 0 marks. Are you sure you want to submit?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowWarning(false)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={submitQuiz}
                disabled={submitting}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
