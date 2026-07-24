import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, XCircle, Clock, AlertCircle, Award, RotateCcw, 
  Send, HelpCircle, FileText, CheckSquare, Radio, Image as ImageIcon,
  ChevronRight, ArrowLeft, History, Lock
} from 'lucide-react';
import { CourseQuiz, CourseQuizQuestion, CourseQuizAttempt, User } from '../types';
import { showToast } from './Toast';
import { db } from '../firebase';
import { doc, setDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface QuizPlayerModalProps {
  currentUser: User;
  quiz: CourseQuiz;
  courseTitle?: string;
  onClose: () => void;
  onQuizCompleted?: (attempt: CourseQuizAttempt) => void;
}

export const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  currentUser,
  quiz,
  courseTitle = 'Formation',
  onClose,
  onQuizCompleted,
}) => {
  const [activeView, setActiveView] = useState<'taking' | 'result' | 'history'>('taking');
  
  // Student answers state: questionId -> answer string (or array of strings for multiple_choice)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  
  // Attempts history
  const [attempts, setAttempts] = useState<CourseQuizAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<CourseQuizAttempt | null>(null);

  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    quiz.durationMinutes ? quiz.durationMinutes * 60 : 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Load previous attempts
  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const q = query(
          collection(db, 'quiz_submissions'),
          where('quizId', '==', quiz.id),
          where('studentEmail', '==', currentUser.email)
        );
        const snapshot = await getDocs(q);
        const list: CourseQuizAttempt[] = [];
        snapshot.forEach(d => list.push(d.data() as CourseQuizAttempt));
        // Sort descending by attempt number or date
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setAttempts(list);

        // Check if student exceeded max attempts
        if (quiz.allowedAttempts > 0 && list.length >= quiz.allowedAttempts) {
          if (list.length > 0) {
            setCurrentAttempt(list[0]);
            setActiveView('result');
          }
        }
      } catch (err) {
        // Local fallback
        const saved = localStorage.getItem(`sio_attempts_${quiz.id}_${currentUser.email}`);
        if (saved) {
          const list: CourseQuizAttempt[] = JSON.parse(saved);
          setAttempts(list);
          if (quiz.allowedAttempts > 0 && list.length >= quiz.allowedAttempts && list.length > 0) {
            setCurrentAttempt(list[0]);
            setActiveView('result');
          }
        }
      }
    };

    loadAttempts();
  }, [quiz.id, currentUser.email, quiz.allowedAttempts]);

  // Timer countdown hook
  useEffect(() => {
    if (activeView !== 'taking' || !quiz.durationMinutes || quiz.durationMinutes <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeView, quiz.durationMinutes]);

  // Auto submission when time expires
  const handleAutoSubmitOnTimeOut = () => {
    showToast('Temps écoulé ! Soumission automatique de votre quiz.', 'info');
    handleSubmitQuiz();
  };

  // Selection handlers
  const handleSelectOption = (questionId: string, optionIndexStr: string, isMultiple: boolean) => {
    setAnswers(prev => {
      if (isMultiple) {
        const current = (prev[questionId] as string[]) || [];
        if (current.includes(optionIndexStr)) {
          return { ...prev, [questionId]: current.filter(c => c !== optionIndexStr) };
        } else {
          return { ...prev, [questionId]: [...current, optionIndexStr] };
        }
      } else {
        return { ...prev, [questionId]: optionIndexStr };
      }
    });
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  // Automatic Grading Function
  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const timeSpent = Math.max(1, Math.floor((Date.now() - startTime) / 1000));

    let pointsObtained = 0;
    let maxPointsPossible = 0;

    quiz.questions.forEach(q => {
      if (q.type === 'section_header') return; // 0 points

      maxPointsPossible += q.points || 1;
      const studentAns = answers[q.id];

      if (q.type === 'single_choice' || q.type === 'image_question') {
        const correctOptStr = q.correctAnswers?.[0];
        if (studentAns === correctOptStr) {
          pointsObtained += q.points || 1;
        }
      } else if (q.type === 'multiple_choice') {
        const expected = (q.correctAnswers || []).sort();
        const actual = Array.isArray(studentAns) ? [...studentAns].sort() : [];
        if (expected.length === actual.length && expected.every((val, idx) => val === actual[idx])) {
          pointsObtained += q.points || 1;
        }
      } else if (q.type === 'short_text') {
        const expectedText = (q.correctAnswers?.[0] || '').trim().toLowerCase();
        const actualText = (typeof studentAns === 'string' ? studentAns : '').trim().toLowerCase();
        if (expectedText && actualText && actualText.includes(expectedText)) {
          pointsObtained += q.points || 1;
        }
      }
    });

    const percentage = maxPointsPossible > 0 ? Math.round((pointsObtained / maxPointsPossible) * 100) : 100;
    const isPassed = percentage >= (quiz.passingScore || 80);

    const attemptNumber = attempts.length + 1;
    const attemptId = `attempt-${quiz.id}-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')}-${attemptNumber}`;

    const newAttempt: CourseQuizAttempt = {
      id: attemptId,
      quizId: quiz.id,
      courseId: quiz.courseId,
      quizTitle: quiz.title,
      targetId: quiz.targetId,
      studentEmail: currentUser.email,
      studentName: currentUser.name,
      answers,
      score: pointsObtained,
      totalPoints: maxPointsPossible,
      percentage,
      passed: isPassed,
      timeSpentSeconds: timeSpent,
      attemptNumber,
      submittedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'quiz_submissions', attemptId), newAttempt);

      // Audit log entry
      await addDoc(collection(db, 'audit_logs'), {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Quiz complété',
        details: `Complété ${quiz.title} avec un score de ${percentage}% (${isPassed ? 'Réussi' : 'Échoué'})`,
        timestamp: new Date().toISOString()
      });

      const updatedList = [newAttempt, ...attempts];
      setAttempts(updatedList);
      localStorage.setItem(`sio_attempts_${quiz.id}_${currentUser.email}`, JSON.stringify(updatedList));

      setCurrentAttempt(newAttempt);
      setActiveView('result');

      if (isPassed) {
        showToast(`Bravo ! Quiz réussi avec ${percentage}% ! 🎉`, 'success');
      } else {
        showToast(`Quiz terminé. Score obtenu : ${percentage}% (Seuil : ${quiz.passingScore}%)`, 'info');
      }

      if (onQuizCompleted) {
        onQuizCompleted(newAttempt);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      // Fallback local
      const updatedList = [newAttempt, ...attempts];
      setAttempts(updatedList);
      localStorage.setItem(`sio_attempts_${quiz.id}_${currentUser.email}`, JSON.stringify(updatedList));
      setCurrentAttempt(newAttempt);
      setActiveView('result');
      if (onQuizCompleted) onQuizCompleted(newAttempt);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    if (quiz.allowedAttempts > 0 && attempts.length >= quiz.allowedAttempts) {
      showToast(`Nombre maximum de tentatives atteint (${quiz.allowedAttempts})`, 'warning');
      return;
    }
    setAnswers({});
    setTimeLeftSeconds(quiz.durationMinutes ? quiz.durationMinutes * 60 : 0);
    setActiveView('taking');
  };

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in text-slate-100">
        
        {/* Top bar with Timer or Controls */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">{quiz.title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{courseTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeView === 'taking' && quiz.durationMinutes && quiz.durationMinutes > 0 && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                timeLeftSeconds < 180 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {attempts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView(activeView === 'history' ? 'taking' : 'history')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Historique ({attempts.length})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* VIEW 1: TAKING THE QUIZ */}
          {activeView === 'taking' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Header Banner Card in Google Forms Style */}
              <div className="bg-slate-800/90 border-t-4 border-t-indigo-500 border-x border-b border-slate-700 rounded-2xl p-6 shadow-xl space-y-3">
                <h1 className="text-xl font-black text-white">{quiz.title}</h1>
                {quiz.description && <p className="text-xs text-slate-300 font-medium">{quiz.description}</p>}
                {quiz.instructions && (
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200">
                    <strong>Consignes :</strong> {quiz.instructions}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-bold text-slate-400">
                  <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-amber-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Seuil de réussite : {quiz.passingScore}%
                  </span>
                  <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-indigo-300">
                    Tentative {attempts.length + 1} {quiz.allowedAttempts > 0 ? `/ ${quiz.allowedAttempts}` : '(Illimité)'}
                  </span>
                </div>
              </div>

              {/* Questions Cards */}
              <div className="space-y-6">
                {quiz.questions.map((q, qIdx) => {
                  if (q.type === 'section_header') {
                    return (
                      <div key={q.id} className="bg-indigo-900/30 border-l-4 border-l-indigo-500 border-y border-r border-slate-700 rounded-2xl p-5 space-y-2">
                        <h3 className="text-base font-black text-white">{q.title}</h3>
                        {q.description && <p className="text-xs text-slate-300">{q.description}</p>}
                      </div>
                    );
                  }

                  const studentAns = answers[q.id];

                  return (
                    <div key={q.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                      
                      {/* Question title header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                              Question {qIdx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {q.points || 1} point{(q.points || 1) > 1 ? 's' : ''}
                            </span>
                          </div>
                          <h2 className="text-sm font-bold text-white leading-relaxed">{q.title}</h2>
                          {q.description && <p className="text-xs text-slate-300 mt-1">{q.description}</p>}
                        </div>
                      </div>

                      {/* Image preview */}
                      {q.imageUrl && (
                        <div className="rounded-2xl border border-slate-700 overflow-hidden bg-slate-950 flex justify-center p-2">
                          <img src={q.imageUrl} alt={q.title} className="max-h-60 object-contain rounded-xl" />
                        </div>
                      )}

                      {/* Options rendering */}
                      {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'image_question') && (
                        <div className="space-y-2.5 pt-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const optStr = optIdx.toString();
                            const isSelected = q.type === 'multiple_choice'
                              ? (Array.isArray(studentAns) && studentAns.includes(optStr))
                              : studentAns === optStr;

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectOption(q.id, optStr, q.type === 'multiple_choice')}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-bold'
                                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                  isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-600 bg-slate-800'
                                }`}>
                                  {q.type === 'multiple_choice' ? (
                                    <CheckSquare className="w-3.5 h-3.5" />
                                  ) : (
                                    <Radio className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <span className="text-xs leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Short text input */}
                      {q.type === 'short_text' && (
                        <div className="pt-2">
                          <input
                            type="text"
                            value={typeof studentAns === 'string' ? studentAns : ''}
                            onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                            placeholder="Saisissez votre réponse courte ici..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Correction automatique en cours...' : 'Soumettre le quiz'}</span>
                </button>
              </div>

            </div>
          )}

          {/* VIEW 2: QUIZ RESULT & CORRECTION */}
          {activeView === 'result' && currentAttempt && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Score Summary Card */}
              <div className={`border rounded-3xl p-6 text-center space-y-4 shadow-2xl ${
                currentAttempt.passed 
                  ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/40' 
                  : 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500/40'
              }`}>
                <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center border shadow-xl ${
                  currentAttempt.passed 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  {currentAttempt.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white">
                    {currentAttempt.passed ? 'Félicitations ! Quiz Réussi 🎉' : 'Score insuffisant'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {currentAttempt.passed 
                      ? 'Vous avez franchi le seuil de validation pour ce quiz.' 
                      : `Il vous faut un minimum de ${quiz.passingScore}% pour valider ce quiz.`
                    }
                  </p>
                </div>

                <div className="inline-flex items-center gap-4 bg-slate-950/80 px-6 py-3 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Score Obtenu</span>
                    <span className={`text-xl font-black ${currentAttempt.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currentAttempt.percentage}%
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Points</span>
                    <span className="text-xl font-black text-amber-400">
                      {currentAttempt.score} / {currentAttempt.totalPoints} pts
                    </span>
                  </div>
                </div>

                {/* Retake button if allowed */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {(!quiz.allowedAttempts || attempts.length < quiz.allowedAttempts) && (
                    <button
                      type="button"
                      onClick={handleRetakeQuiz}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Repasser le quiz ({attempts.length} / {quiz.allowedAttempts || '∞'})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Continuer la formation
                  </button>
                </div>

              </div>

              {/* Correction breakdown if allowed */}
              {quiz.showCorrections !== 'never' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Correction détaillée des questions</span>
                  </h3>

                  <div className="space-y-4">
                    {quiz.questions.map((q, qIdx) => {
                      if (q.type === 'section_header') return null;

                      const studentAns = currentAttempt.answers[q.id];
                      let isQuestionCorrect = false;

                      if (q.type === 'single_choice' || q.type === 'image_question') {
                        isQuestionCorrect = studentAns === q.correctAnswers?.[0];
                      } else if (q.type === 'multiple_choice') {
                        const expected = (q.correctAnswers || []).sort();
                        const actual = Array.isArray(studentAns) ? [...studentAns].sort() : [];
                        isQuestionCorrect = expected.length === actual.length && expected.every((val, idx) => val === actual[idx]);
                      } else if (q.type === 'short_text') {
                        const expectedText = (q.correctAnswers?.[0] || '').trim().toLowerCase();
                        const actualText = (typeof studentAns === 'string' ? studentAns : '').trim().toLowerCase();
                        isQuestionCorrect = Boolean(expectedText && actualText && actualText.includes(expectedText));
                      }

                      return (
                        <div 
                          key={q.id}
                          className={`bg-slate-800/80 border rounded-2xl p-5 space-y-3 ${
                            isQuestionCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isQuestionCorrect ? (
                                <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                              <h4 className="text-xs font-bold text-white">Q{qIdx + 1}. {q.title}</h4>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isQuestionCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {isQuestionCorrect ? `+${q.points || 1} pt` : '0 pt'}
                            </span>
                          </div>

                          {/* Options breakdown */}
                          {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'image_question') && (
                            <div className="space-y-1.5 pt-1">
                              {(q.options || []).map((opt, optIdx) => {
                                const optStr = optIdx.toString();
                                const isCorrectChoice = (q.correctAnswers || []).includes(optStr);
                                const isUserChoice = q.type === 'multiple_choice'
                                  ? (Array.isArray(studentAns) && studentAns.includes(optStr))
                                  : studentAns === optStr;

                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                      isCorrectChoice
                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold'
                                        : isUserChoice
                                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 font-medium'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isCorrectChoice && <span className="text-[10px] text-emerald-400 font-bold">(Bonne réponse)</span>}
                                    {!isCorrectChoice && isUserChoice && <span className="text-[10px] text-rose-400 font-bold">(Votre choix)</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'short_text' && (
                            <div className="space-y-1 text-xs">
                              <p className="text-slate-300">Votre réponse : <strong className="text-white">{String(studentAns || 'Aucune')}</strong></p>
                              <p className="text-emerald-400">Réponse attendue : <strong>{q.correctAnswers?.[0]}</strong></p>
                            </div>
                          )}

                          {/* Trainer Explanation Callout */}
                          {q.explanation && (
                            <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200 mt-2">
                              <strong className="block text-indigo-400 mb-0.5">Explication du formateur :</strong>
                              {q.explanation}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW 3: ATTEMPTS HISTORY */}
          {activeView === 'history' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Historique de vos tentatives ({attempts.length})</span>
                </h3>
                <button
                  onClick={() => setActiveView('taking')}
                  className="text-xs text-indigo-400 font-bold hover:underline"
                >
                  Retour au quiz
                </button>
              </div>

              <div className="space-y-3">
                {attempts.map(att => (
                  <div key={att.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Tentative #{att.attemptNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          att.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {att.passed ? 'Réussi' : 'Échoué'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Soumis le {new Date(att.submittedAt).toLocaleDateString('fr-FR')} à {new Date(att.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-base font-black ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {att.percentage}%
                      </span>
                      <p className="text-[10px] text-slate-400">{att.score} / {att.totalPoints} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default QuizPlayerModal;
