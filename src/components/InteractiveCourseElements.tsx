import { useState, useEffect } from 'react';
import { 
  Bookmark as BookmarkIcon, Star, HelpCircle, CheckCircle2, XCircle, 
  Send, Upload, FileText, QrCode, Award, Clock, ArrowRight, RotateCcw, 
  Trash2, MessageSquare, Reply, User as UserIcon, Check, FileUp, Download
} from 'lucide-react';
import { 
  User, Course, Chapter, StudentProgress, Bookmark, ChapterQuiz, 
  QuizQuestion, QuizSubmission, Exercise, ExerciseSubmission, ChapterComment, Certificate, CourseQuiz 
} from '../types';
import { QuizPlayerModal } from './QuizPlayerModal';
import { showToast } from './Toast';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, where, addDoc } from 'firebase/firestore';

// ============================================================================
// 1. CHAPTER BOOKMARKS (SIGNETS)
// ============================================================================
interface ChapterBookmarksProps {
  currentUser: User;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
}

export function ChapterBookmarks({ currentUser, courseId, chapterId, chapterTitle }: ChapterBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Real-time subscription to user's bookmarks
    const path = 'bookmarks';
    const q = query(
      collection(db, path), 
      where('studentEmail', '==', currentUser.email),
      where('courseId', '==', courseId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Bookmark[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Bookmark);
      });
      setBookmarks(list);
      setIsBookmarked(list.some(b => b.chapterId === chapterId));
    }, (err) => {
      // Fallback local storage
      const saved = localStorage.getItem(`sio_bookmarks_${currentUser.email}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Bookmark[];
        setBookmarks(parsed.filter(b => b.courseId === courseId));
        setIsBookmarked(parsed.some(b => b.chapterId === chapterId));
      }
    });

    return () => unsubscribe();
  }, [currentUser.email, courseId, chapterId]);

  const toggleBookmark = async () => {
    const bookmarkId = `bookmark-${courseId}-${chapterId}-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const docRef = doc(db, 'bookmarks', bookmarkId);

    if (isBookmarked) {
      try {
        await deleteDoc(docRef);
        showToast('Signet retiré des favoris', 'info');
      } catch (err) {
        // Local fallback
        const saved = localStorage.getItem(`sio_bookmarks_${currentUser.email}`);
        const parsed = saved ? (JSON.parse(saved) as Bookmark[]) : [];
        const filtered = parsed.filter(b => b.id !== bookmarkId);
        localStorage.setItem(`sio_bookmarks_${currentUser.email}`, JSON.stringify(filtered));
        setBookmarks(filtered.filter(b => b.courseId === courseId));
        setIsBookmarked(false);
        showToast('Signet retiré des favoris (hors-ligne)', 'info');
      }
    } else {
      const newBookmark: Bookmark = {
        id: bookmarkId,
        studentEmail: currentUser.email,
        courseId,
        chapterId,
        chapterTitle,
        savedAt: new Date().toISOString()
      };
      try {
        await setDoc(docRef, newBookmark);
        showToast('Chapitre ajouté aux favoris ⭐', 'success');
      } catch (err) {
        // Local fallback
        const saved = localStorage.getItem(`sio_bookmarks_${currentUser.email}`);
        const parsed = saved ? (JSON.parse(saved) as Bookmark[]) : [];
        parsed.push(newBookmark);
        localStorage.setItem(`sio_bookmarks_${currentUser.email}`, JSON.stringify(parsed));
        setBookmarks(parsed.filter(b => b.courseId === courseId));
        setIsBookmarked(true);
        showToast('Chapitre favori enregistré (hors-ligne)', 'success');
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
          <span className="text-xs font-bold text-white font-sans uppercase tracking-wider">Favoris & Signets</span>
        </div>
        <button
          onClick={toggleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            isBookmarked 
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-300' : ''}`} />
          <span>{isBookmarked ? 'Favori enregistré' : 'Ajouter aux favoris'}</span>
        </button>
      </div>

      {bookmarks.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 font-sans">Vos signets sur cette formation :</p>
          <div className="flex flex-wrap gap-1.5">
            {bookmarks.map(b => (
              <div 
                key={b.id} 
                className="bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 shrink-0 font-sans"
              >
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="truncate max-w-[120px]">{b.chapterTitle}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. CHAPTER QUIZZES
// ============================================================================
interface ChapterQuizProps {
  currentUser: User;
  chapterId: string;
}

// Static default quizzes in case Firestore doesn't have one
const DEFAULT_QUIZZES: Record<string, QuizQuestion[]> = {
  'ch-html-1': [
    { id: 'q1', type: 'qcm', question: 'Que signifie l\'acronyme HTML ?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyperlink Text Markdown Link', 'Home Tool Markup Language'], correctAnswer: '0' },
    { id: 'q2', type: 'true_false', question: 'La balise <img> n\'a pas besoin de balise de fermeture.', correctAnswer: 'True' },
    { id: 'q3', type: 'text', question: 'Quelle balise HTML est utilisée pour définir le titre principal d\'une page ?', correctAnswer: 'h1' }
  ],
  'ch-css-1': [
    { id: 'q1', type: 'qcm', question: 'Quelle propriété CSS est utilisée pour modifier la couleur du texte ?', options: ['text-color', 'font-color', 'color', 'background-color'], correctAnswer: '2' },
    { id: 'q2', type: 'true_false', question: 'Flexbox est une méthode de disposition unidimensionnelle.', correctAnswer: 'True' }
  ],
  'ch-js-1': [
    { id: 'q1', type: 'qcm', question: 'Quel mot-clé déclare une variable dont la valeur peut être réassignée ?', options: ['const', 'let', 'static', 'var_change'], correctAnswer: '1' },
    { id: 'q2', type: 'true_false', question: 'NaN signifie "Null and Nothing" en Javascript.', correctAnswer: 'False' },
    { id: 'q3', type: 'text', question: 'Quelle méthode de tableau ajoute un élément à la fin de celui-ci ?', correctAnswer: 'push' }
  ]
};

export function ChapterQuizComponent({ currentUser, chapterId }: ChapterQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullQuiz, setFullQuiz] = useState<CourseQuiz | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    setScore(null);

    // Retrieve submissions first
    const subQ = query(
      collection(db, 'quiz_submissions'),
      where('studentEmail', '==', currentUser.email),
      where('chapterId', '==', chapterId)
    );

    getDocs(subQ).then((snapshot) => {
      if (!snapshot.empty) {
        const sub = snapshot.docs[0].data() as QuizSubmission;
        setAnswers(sub.answers);
        setScore(sub.score);
        setSubmitted(true);
      }
    }).catch(() => {
      // Local fallback
      const savedSub = localStorage.getItem(`sio_quiz_sub_${chapterId}_${currentUser.email}`);
      if (savedSub) {
        const parsed = JSON.parse(savedSub) as QuizSubmission;
        setAnswers(parsed.answers);
        setScore(parsed.score);
        setSubmitted(true);
      }
    });

    // Retrieve quiz questions
    const qRef = doc(db, 'quizzes', chapterId);
    onSnapshot(qRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.questions) {
          setFullQuiz({ id: docSnap.id, ...data } as CourseQuiz);
          setQuestions(data.questions || []);
        } else {
          setQuestions((data as ChapterQuiz).questions || []);
        }
      } else {
        // Fallback to static quiz templates
        setQuestions(DEFAULT_QUIZZES[chapterId] || []);
      }
      setLoading(false);
    }, () => {
      setQuestions(DEFAULT_QUIZZES[chapterId] || []);
      setLoading(false);
    });
  }, [chapterId, currentUser.email]);

  const handleAnswerSelect = (qId: string, value: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleTextChange = (qId: string, val: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmitQuiz = async () => {
    // Validate all questions are answered
    if (questions.some(q => !answers[q.id])) {
      showToast('Veuillez répondre à toutes les questions avant de soumettre !', 'warning');
      return;
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      const correctVal = q.correctAnswer.toLowerCase().trim();
      const studentVal = (answers[q.id] || '').toLowerCase().trim();
      if (correctVal === studentVal) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setScore(calculatedScore);
    setSubmitted(true);

    const submission: QuizSubmission = {
      id: `quiz-sub-${chapterId}-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      studentEmail: currentUser.email,
      chapterId,
      answers,
      score: calculatedScore,
      completedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'quiz_submissions', submission.id), submission);
      
      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Quiz complété',
        details: `Score de ${calculatedScore}% au quiz du chapitre ${chapterId}`,
        timestamp: new Date().toISOString()
      });

      showToast(`Quiz soumis ! Votre score : ${calculatedScore}%`, 'success');
    } catch (err) {
      localStorage.setItem(`sio_quiz_sub_${chapterId}_${currentUser.email}`, JSON.stringify(submission));
      showToast(`Quiz validé localement : ${calculatedScore}%`, 'success');
    }
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  if (loading) {
    return <div className="text-center py-4 text-xs text-slate-400 font-sans">Chargement du quiz...</div>;
  }

  if (questions.length === 0) {
    return null; // Don't show anything if no quiz is defined for this lesson
  }

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/15 pb-3">
        <HelpCircle className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-white font-sans">Quiz d'évaluation</h3>
          <p className="text-[10px] text-slate-400 font-sans">Validez vos connaissances sur ce chapitre</p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isCorrect = submitted && q.correctAnswer.toLowerCase().trim() === (answers[q.id] || '').toLowerCase().trim();
          
          return (
            <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2.5">
              <div className="flex items-start gap-2 justify-between">
                <p className="text-xs font-semibold text-white font-sans">
                  <span className="text-indigo-400 font-black mr-1">{idx + 1}.</span> {q.question}
                </p>
                {submitted && (
                  isCorrect ? (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider font-sans">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 font-black px-2 py-0.5 rounded border border-rose-500/30 uppercase tracking-wider font-sans">
                      <XCircle className="w-3 h-3 text-rose-400" /> Incorrect
                    </span>
                  )
                )}
              </div>

              {/* 1. QCM options */}
              {q.type === 'qcm' && q.options && (
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[q.id] === String(optIdx);
                    const isCorrectAnswer = String(optIdx) === q.correctAnswer;

                    let optStyle = 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10';
                    if (isSelected) {
                      optStyle = 'bg-indigo-600/30 border-indigo-500 text-white font-bold';
                    }
                    if (submitted) {
                      if (isCorrectAnswer) {
                        optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected && !isCorrectAnswer) {
                        optStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerSelect(q.id, String(optIdx))}
                        disabled={submitted}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all font-sans cursor-pointer flex items-center justify-between`}
                      >
                        <span>{opt}</span>
                        {submitted && isCorrectAnswer && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. TRUE/FALSE options */}
              {q.type === 'true_false' && (
                <div className="flex gap-2 pt-1">
                  {['True', 'False'].map((option) => {
                    const isSelected = answers[q.id] === option;
                    const isCorrectAnswer = option === q.correctAnswer;
                    const label = option === 'True' ? 'Vrai' : 'Faux';

                    let optStyle = 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5';
                    if (isSelected) {
                      optStyle = 'bg-indigo-600/30 border-indigo-500 text-white font-bold';
                    }
                    if (submitted) {
                      if (isCorrectAnswer) {
                        optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected && !isCorrectAnswer) {
                        optStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswerSelect(q.id, option)}
                        disabled={submitted}
                        className={`px-4 py-1.5 rounded-lg border text-xs transition-all font-sans cursor-pointer ${optStyle}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. Free Text input */}
              {q.type === 'text' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    disabled={submitted}
                    placeholder="Tapez votre réponse ici..."
                    className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                  {submitted && (
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Réponse correcte : <span className="text-emerald-400 font-bold">{q.correctAnswer}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {score !== null && (
        <div className={`p-4 rounded-xl border text-center space-y-1.5 ${
          score >= 80 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
        }`}>
          <p className="text-sm font-black font-sans">Votre Score : {score}%</p>
          <p className="text-xs font-sans">
            {score >= 80 
              ? 'Excellent travail ! Vous maîtrisez parfaitement cette leçon.' 
              : 'N\'hésitez pas à revoir le contenu de cette leçon et à retenter le quiz.'}
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {submitted ? (
          <button
            onClick={handleResetQuiz}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recommencer le quiz</span>
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-1.5 font-sans"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Soumettre mes réponses</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. EXERCISES / ASSIGNMENTS SUBMISSION
// ============================================================================
interface ChapterExerciseProps {
  currentUser: User;
  courseId: string;
  chapterId: string;
}

// Static default exercises
const DEFAULT_EXERCISES: Record<string, Exercise> = {
  'ch-html-1': {
    id: 'ex-html',
    chapterId: 'ch-html-1',
    title: 'Exercice Pratique : Structurez votre première page HTML',
    instructions: 'Créez une page de profil personnelle en utilisant des balises sémantiques (header, main, footer, article, section) et au moins une liste d\'intérêts. Déposez votre code au format ZIP ou fichier HTML.'
  },
  'ch-css-1': {
    id: 'ex-css',
    chapterId: 'ch-css-1',
    title: 'Exercice CSS : Layout d\'une carte de profil moderne',
    instructions: 'Mettez en page une carte de produit ou profil en utilisant Flexbox ou CSS Grid. Ajoutez des effets de survol lisses et une palette de couleurs contrastée. Déposez vos fichiers CSS/HTML compilés dans un fichier ZIP.'
  },
  'ch-js-1': {
    id: 'ex-js',
    chapterId: 'ch-js-1',
    title: 'Exercice Algorithmique : Mini Calculateur interactif',
    instructions: 'Écrivez une série de fonctions Javascript permettant de calculer des pourboires et moyennes de tableaux. Vous pouvez utiliser jsfiddle ou joindre directement votre fichier JS.'
  }
};

export function ChapterExerciseComponent({ currentUser, courseId, chapterId }: ChapterExerciseProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<ExerciseSubmission[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Check if an exercise template exists
    const exRef = doc(db, 'exercises', chapterId);
    onSnapshot(exRef, (snap) => {
      if (snap.exists()) {
        setExercise(snap.data() as Exercise);
      } else {
        setExercise(DEFAULT_EXERCISES[chapterId] || null);
      }
    }, () => {
      setExercise(DEFAULT_EXERCISES[chapterId] || null);
    });

    // Check user submissions
    const subQ = query(
      collection(db, 'exercise_submissions'),
      where('studentEmail', '==', currentUser.email),
      where('chapterId', '==', chapterId)
    );

    const unsubscribe = onSnapshot(subQ, (snapshot) => {
      const list: ExerciseSubmission[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as ExerciseSubmission);
      });
      setSubmissions(list);
    }, () => {
      // Offline fallback
      const saved = localStorage.getItem(`sio_exercises_sub_${chapterId}_${currentUser.email}`);
      if (saved) {
        setSubmissions([JSON.parse(saved) as ExerciseSubmission]);
      }
    });

    return () => unsubscribe();
  }, [chapterId, currentUser.email]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFileAndSubmit = async (file: File) => {
    setUploading(true);
    // Simulated upload delay
    setTimeout(async () => {
      const subId = `exsub-${chapterId}-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
      
      const newSubmission: ExerciseSubmission = {
        id: subId,
        chapterId,
        courseId,
        studentEmail: currentUser.email,
        studentName: currentUser.name,
        fileName: file.name,
        fileUrl: '#', // In production, this would be a Firebase Storage reference URL
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} Mo`,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      try {
        await setDoc(doc(db, 'exercise_submissions', subId), newSubmission);
        
        // Audit log
        await addDoc(collection(db, 'audit_logs'), {
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Devoir déposé',
          details: `Dépôt du fichier ${file.name} pour l'exercice du chapitre ${chapterId}`,
          timestamp: new Date().toISOString()
        });

        showToast('Devoir soumis avec succès ! Formateur notifié.', 'success');
      } catch (err) {
        localStorage.setItem(`sio_exercises_sub_${chapterId}_${currentUser.email}`, JSON.stringify(newSubmission));
        setSubmissions([newSubmission]);
        showToast('Devoir soumis localement (hors-ligne)', 'success');
      } finally {
        setUploading(false);
        setDragActive(false);
      }
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileAndSubmit(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileAndSubmit(e.target.files[0]);
    }
  };

  if (!exercise) return null; // No exercise configured for this chapter

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/15 pb-3">
        <FileText className="w-5 h-5 text-emerald-400" />
        <div>
          <h3 className="text-sm font-bold text-white font-sans">Travaux Pratiques / Exercices</h3>
          <p className="text-[10px] text-slate-400 font-sans">Appliquez vos compétences théoriques</p>
        </div>
      </div>

      <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
        <h4 className="text-xs font-bold text-white font-sans">{exercise.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{exercise.instructions}</p>
        <p className="text-[10px] text-slate-400 font-sans font-medium">Formats acceptés : PDF, ZIP, PNG, JPG, MP4</p>
      </div>

      {submissions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-sans">Vos dépôts :</p>
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/20 shrink-0">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate font-sans">{sub.fileName}</p>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Taille : {sub.fileSize} • Soumis le {new Date(sub.submittedAt).toLocaleDateString('fr-FR')} à {new Date(sub.submittedAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  {sub.status === 'pending' ? (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-full font-bold font-sans">
                      En attente de correction
                    </span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-black font-sans">
                        Note : {sub.grade}/20
                      </span>
                    </div>
                  )}
                </div>

                {sub.feedback && (
                  <div className="w-full mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-300 font-sans italic bg-white/5 p-2 rounded-lg">
                    <span className="font-extrabold not-italic text-indigo-400 mr-1">Feedback de {sub.gradedBy || 'Formateur'} :</span>
                    "{sub.feedback}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {submissions.every(sub => sub.status !== 'pending') && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 relative ${
            dragActive 
              ? 'border-indigo-400 bg-indigo-500/15' 
              : 'border-white/15 bg-white/5 hover:bg-white/10'
          }`}
        >
          <input
            type="file"
            id="exercise-file"
            multiple={false}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          <Upload className={`w-8 h-8 text-slate-400 ${uploading ? 'animate-bounce text-indigo-400' : ''}`} />

          <label 
            htmlFor="exercise-file" 
            className="text-xs text-white font-bold cursor-pointer font-sans underline hover:text-indigo-300"
          >
            {uploading ? 'Traitement du fichier...' : 'Cliquez pour charger un devoir'}
          </label>
          <p className="text-[10px] text-slate-400 font-sans">ou glissez-déposez votre archive ZIP, document PDF ou image ici</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. CHAPTER DISCUSSIONS & COMMENTS (FORUM)
// ============================================================================
interface ChapterCommentsProps {
  currentUser: User;
  chapterId: string;
}

export function ChapterCommentsComponent({ currentUser, chapterId }: ChapterCommentsProps) {
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<ChapterComment | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const cQ = query(
      collection(db, 'comments'),
      where('chapterId', '==', chapterId)
    );

    const unsubscribe = onSnapshot(cQ, (snapshot) => {
      const list: ChapterComment[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ChapterComment);
      });
      // Sort chronologically
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setComments(list);
    }, () => {
      const saved = localStorage.getItem(`sio_comments_${chapterId}`);
      if (saved) {
        setComments(JSON.parse(saved) as ChapterComment[]);
      }
    });

    return () => unsubscribe();
  }, [chapterId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const comment: Omit<ChapterComment, 'id'> = {
      chapterId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      userRole: currentUser.role,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'comments'), comment);
      setNewCommentText('');
      showToast('Commentaire publié !', 'success');
    } catch (err) {
      // Local fallback
      const cached = [...comments];
      const mockComment: ChapterComment = { id: `local-${Date.now()}`, ...comment };
      cached.push(mockComment);
      localStorage.setItem(`sio_comments_${chapterId}`, JSON.stringify(cached));
      setComments(cached);
      setNewCommentText('');
      showToast('Commentaire enregistré localement (hors-ligne)', 'success');
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyText.trim()) return;

    if (currentUser.role === 'assistant' && !currentUser.permissions?.includes('manage_comments')) {
      showToast("Permission refusée : Vous n'avez pas l'autorisation de répondre aux commentaires.", 'error');
      return;
    }

    const comment: Omit<ChapterComment, 'id'> = {
      chapterId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      userRole: currentUser.role,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      parentId: replyTarget.id
    };

    try {
      await addDoc(collection(db, 'comments'), comment);
      setReplyText('');
      setReplyTarget(null);
      showToast('Réponse publiée !', 'success');
    } catch (err) {
      const cached = [...comments];
      const mockComment: ChapterComment = { id: `local-${Date.now()}`, ...comment };
      cached.push(mockComment);
      localStorage.setItem(`sio_comments_${chapterId}`, JSON.stringify(cached));
      setComments(cached);
      setReplyText('');
      setReplyTarget(null);
      showToast('Réponse enregistrée localement (hors-ligne)', 'success');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (currentUser.role === 'assistant' && !currentUser.permissions?.includes('manage_comments')) {
      showToast("Permission refusée : Vous n'avez pas l'autorisation de supprimer les commentaires.", 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      showToast('Commentaire supprimé', 'info');
    } catch (err) {
      const filtered = comments.filter(c => c.id !== commentId);
      localStorage.setItem(`sio_comments_${chapterId}`, JSON.stringify(filtered));
      setComments(filtered);
    }
  };

  // Group threads
  const parentComments = comments.filter(c => !c.parentId);
  const getRepliesForParent = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/15 pb-3">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-white font-sans">Espace de discussion & Questions</h3>
          <p className="text-[10px] text-slate-400 font-sans">Posez vos questions ou débattez de cette leçon</p>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {parentComments.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500 italic font-sans">Aucune discussion en cours. Soyez le premier à commenter !</p>
        ) : (
          parentComments.map((comment) => {
            const replies = getRepliesForParent(comment.id);
            return (
              <div key={comment.id} className="space-y-2 border-b border-white/5 pb-3">
                {/* Parent comment */}
                <div className="flex gap-2.5 items-start">
                  <img
                    src={comment.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'}
                    alt={comment.userName}
                    className="w-7 h-7 rounded-full object-cover border border-white/10"
                  />
                  <div className="flex-1 bg-white/5 p-2.5 rounded-xl border border-white/10 relative">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-white font-sans">{comment.userName}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-sans ${
                          comment.userRole === 'admin' 
                            ? 'bg-red-500/20 text-red-300' 
                            : comment.userRole === 'trainer' 
                              ? 'bg-amber-500/20 text-amber-300' 
                              : comment.userRole === 'assistant'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {comment.userRole === 'assistant' ? 'Assistant' : comment.userRole}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-sans">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1 font-sans">{comment.content}</p>
                    
                    <div className="flex gap-3 justify-end mt-2 pt-1.5 border-t border-white/5">
                      <button
                        onClick={() => setReplyTarget(comment)}
                        className="text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-sans font-bold cursor-pointer"
                      >
                        <Reply className="w-3 h-3" /> Répondre
                      </button>
                      {(currentUser.id === comment.userId || currentUser.role === 'admin' || currentUser.role === 'trainer' || currentUser.role === 'assistant') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 font-sans font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Replies */}
                {replies.length > 0 && (
                  <div className="ml-8 space-y-2 pl-3 border-l border-white/10">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2.5 items-start animate-fade-in">
                        <img
                          src={reply.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'}
                          alt={reply.userName}
                          className="w-6 h-6 rounded-full object-cover border border-white/10"
                        />
                        <div className="flex-1 bg-white/5 p-2 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-extrabold text-white font-sans">{reply.userName}</span>
                              <span className={`text-[8px] font-black px-1.5 rounded uppercase font-sans ${
                                reply.userRole === 'trainer' 
                                  ? 'bg-amber-500/20 text-amber-300' 
                                  : reply.userRole === 'assistant'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-indigo-500/20 text-indigo-300'
                              }`}>
                                {reply.userRole === 'assistant' ? 'Assistant' : reply.userRole}
                              </span>
                            </div>
                            <span className="text-[8px] text-slate-400 font-sans">
                              {new Date(reply.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-normal mt-1 font-sans">{reply.content}</p>
                          
                          {(currentUser.id === reply.userId || currentUser.role === 'admin' || currentUser.role === 'trainer' || currentUser.role === 'assistant') && (
                            <div className="flex justify-end mt-1">
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-[9px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 font-sans font-bold cursor-pointer"
                              >
                                <Trash2 className="w-2.5 h-2.5" /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reply Trigger Modal/Form overlay */}
      {replyTarget && (
        <div className="bg-indigo-600/15 border border-indigo-500/30 p-3 rounded-xl space-y-2 animate-fade-in text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-300 font-extrabold font-sans">
              En réponse à <strong className="text-white">{replyTarget.userName}</strong>
            </span>
            <button
              onClick={() => setReplyTarget(null)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Annuler
            </button>
          </div>
          <form onSubmit={handlePostReply} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tapez votre réponse..."
              className="flex-1 bg-slate-900 border border-white/10 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg border border-indigo-400/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handlePostComment} className="flex gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Posez votre question ou commentez..."
          className="flex-1 bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
        />
        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-xl border border-indigo-400/20 cursor-pointer flex items-center justify-center gap-1.5 font-sans text-xs font-bold transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Publier</span>
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// 5. COURSE CERTIFICATES GENERATION
// ============================================================================
interface CourseCertificateProps {
  currentUser: User;
  course: Course;
  progressPercent: number;
}

export function CourseCertificateComponent({ currentUser, course, progressPercent }: CourseCertificateProps) {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    // Look up issued certificate
    const cQ = query(
      collection(db, 'certificates'),
      where('studentEmail', '==', currentUser.email),
      where('courseId', '==', course.id)
    );

    getDocs(cQ).then((snapshot) => {
      if (!snapshot.empty) {
        setCertificate(snapshot.docs[0].data() as Certificate);
      }
    }).catch(() => {
      // Offline check
      const saved = localStorage.getItem(`sio_cert_${course.id}_${currentUser.email}`);
      if (saved) {
        setCertificate(JSON.parse(saved) as Certificate);
      }
    });

    // Fetch course mandatory quizzes
    const qQ = query(collection(db, 'quizzes'), where('courseId', '==', course.id));
    getDocs(qQ).then(snap => {
      const list: CourseQuiz[] = [];
      snap.forEach(d => {
        const qData = d.data() as CourseQuiz;
        if (qData.status === 'published' && qData.isRequired !== false) {
          list.push(qData);
        }
      });
      setQuizzes(list);
    }).catch(() => {
      setQuizzes([]);
    });

    // Fetch user quiz submissions for this course
    const subQ = query(
      collection(db, 'quiz_submissions'),
      where('studentEmail', '==', currentUser.email),
      where('courseId', '==', course.id)
    );
    getDocs(subQ).then(snap => {
      const list: QuizSubmission[] = [];
      snap.forEach(d => list.push(d.data() as QuizSubmission));
      setSubmissions(list);
      setLoadingQuizzes(false);
    }).catch(() => {
      setLoadingQuizzes(false);
    });

  }, [course.id, currentUser.email]);

  // Calculate student best scores for mandatory quizzes
  const mandatoryQuizzesCount = quizzes.length;
  let totalBestPercentageSum = 0;
  let completedMandatoryQuizzesCount = 0;

  quizzes.forEach(quiz => {
    const quizSubs = submissions.filter(s => (s as any).quizId === quiz.id || s.chapterId === quiz.targetId || s.chapterId === quiz.id);
    if (quizSubs.length > 0) {
      completedMandatoryQuizzesCount += 1;
      // Get highest percentage score achieved
      const bestScore = Math.max(...quizSubs.map(s => s.score || (s as any).percentage || 0));
      totalBestPercentageSum += bestScore;
    }
  });

  const overallQuizAverage = mandatoryQuizzesCount > 0 
    ? Math.round(totalBestPercentageSum / mandatoryQuizzesCount) 
    : 100;

  const isQuizzesQualified = mandatoryQuizzesCount === 0 || (
    completedMandatoryQuizzesCount >= mandatoryQuizzesCount && overallQuizAverage >= 80
  );

  const canGenerateCertificate = progressPercent >= 100 && isQuizzesQualified;

  const handleGenerateCertificate = () => {
    if (progressPercent < 100) {
      showToast('Vous devez compléter 100% des chapitres de la formation !', 'warning');
      return;
    }

    if (mandatoryQuizzesCount > 0 && completedMandatoryQuizzesCount < mandatoryQuizzesCount) {
      showToast(`Vous devez répondre à tous les quiz obligatoires (${completedMandatoryQuizzesCount}/${mandatoryQuizzesCount}) !`, 'warning');
      return;
    }

    if (mandatoryQuizzesCount > 0 && overallQuizAverage < 80) {
      showToast(`Moyenne générale insuffisante (${overallQuizAverage}% / 80% requis). Veuillez repasser vos quiz pour améliorer votre moyenne.`, 'warning');
      return;
    }

    setGenerating(true);
    setTimeout(async () => {
      const uniqueCode = `CERT-${course.id.substring(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const certId = `cert-${course.id}-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const newCert: Certificate = {
        id: certId,
        studentEmail: currentUser.email,
        studentName: currentUser.name,
        courseId: course.id,
        courseTitle: course.title,
        issuedAt: new Date().toISOString(),
        verificationCode: uniqueCode
      };

      try {
        await setDoc(doc(db, 'certificates', certId), newCert);
        
        // Audit log
        await addDoc(collection(db, 'audit_logs'), {
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Certificat généré',
          details: `Obtention du certificat ${uniqueCode} pour le cours ${course.title} avec moyenne aux quiz ${overallQuizAverage}%`,
          timestamp: new Date().toISOString()
        });

        setCertificate(newCert);
        showToast('Félicitations ! Votre certificat officiel de réussite a été généré.', 'success');
      } catch (err) {
        localStorage.setItem(`sio_cert_${course.id}_${currentUser.email}`, JSON.stringify(newCert));
        setCertificate(newCert);
        showToast('Certificat généré hors-ligne !', 'success');
      } finally {
        setGenerating(false);
      }
    }, 2000);
  };

  const handleDownloadCertificate = () => {
    if (!certificate) return;

    // Create printable HTML Blob for direct download
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Certificat de Réussite - ${certificate.studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&family=Playfair+Display:ital,wght@1,500;1,700&display=swap');
    body {
      margin: 0;
      padding: 40px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #090d16;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .cert-container {
      width: 100%;
      max-width: 800px;
      border: 6px double rgba(99, 102, 241, 0.4);
      border-radius: 24px;
      padding: 48px;
      background: linear-gradient(135deg, #0f172a 0%, #030712 100%);
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
    }
    .brand {
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-size: 14px;
      color: #6366f1;
      margin-bottom: 24px;
    }
    .title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 4px;
      color: #818cf8;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .awarded {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 28px;
      color: #f8fafc;
      margin: 16px 0;
    }
    .student-name {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #38bdf8;
      margin-bottom: 24px;
    }
    .course-title {
      font-size: 18px;
      font-weight: 800;
      color: #10b981;
      margin-top: 8px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .code {
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      color: #a5b4fc;
    }
    @media print {
      body { background: white; color: black; padding: 0; }
      .cert-container { border-color: #333; background: white; color: black; box-shadow: none; }
      .student-name { color: #000; }
      .course-title { color: #000; }
      .awarded { color: #111; }
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="brand">DEKEL.FORMATION ACADEMY</div>
    <div class="title">Certificat Officiel de Réussite</div>
    <div class="awarded">Ce certificat est fièrement décerné à</div>
    <div class="student-name">${certificate.studentName}</div>
    <p style="font-size: 14px; color: #cbd5e1; max-width: 600px; margin: 0 auto 16px auto;">
      pour avoir validé avec succès l'intégralité du cursus de formation :
      <div class="course-title">"${certificate.courseTitle}"</div>
    </p>
    <div class="footer">
      <div style="text-align: left;">
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Délivré le</div>
        <div style="font-size: 12px; font-weight: bold; color: #f1f5f9;">${new Date(certificate.issuedAt).toLocaleDateString('fr-FR')}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">ID de Vérification</div>
        <div class="code">${certificate.verificationCode}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificat_${certificate.verificationCode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.print();
    showToast('Téléchargement du certificat démarré !', 'success');
  };

  return (
    <div className="bg-[#1b2028] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-2xl border border-indigo-500/25 shrink-0">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white font-sans">Certificat de Réussite</h3>
            <p className="text-xs text-slate-400 font-sans">Validez officiellement vos compétences acquises</p>
          </div>
        </div>

        {progressPercent < 100 ? (
          <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-400 font-sans uppercase tracking-wider">
            Verrouillé (Progression {progressPercent}%)
          </span>
        ) : (
          !certificate && (
            <button
              onClick={handleGenerateCertificate}
              disabled={generating}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 font-sans"
            >
              {generating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Générer mon Certificat</span>
                </>
              )}
            </button>
          )
        )}
      </div>

      {/* Certificate conditions status card */}
      {!certificate && (
        <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Conditions d'obtention du certificat :</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              progressPercent >= 100 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${progressPercent >= 100 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <span className="font-bold block">Chapitres terminés</span>
                <span className="text-[10px] opacity-80">{progressPercent}% / 100%</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              mandatoryQuizzesCount === 0 || completedMandatoryQuizzesCount >= mandatoryQuizzesCount 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${mandatoryQuizzesCount === 0 || completedMandatoryQuizzesCount >= mandatoryQuizzesCount ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <span className="font-bold block">Quiz obligatoires</span>
                <span className="text-[10px] opacity-80">{completedMandatoryQuizzesCount} / {mandatoryQuizzesCount} complétés</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              overallQuizAverage >= 80 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <Award className={`w-4 h-4 shrink-0 ${overallQuizAverage >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-bold block">Moyenne Générale</span>
                <span className="text-[10px] opacity-80">{overallQuizAverage}% (Requis: ≥ 80%)</span>
              </div>
            </div>
          </div>

          {overallQuizAverage < 80 && mandatoryQuizzesCount > 0 && completedMandatoryQuizzesCount > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200">
              <strong>Moyenne insuffisante :</strong> Votre moyenne actuelle aux quiz est de <strong>{overallQuizAverage}%</strong>. Pour débloquer votre certificat, vous devez atteindre une moyenne d'au moins 80%. Vous pouvez repasser les quiz pour augmenter votre note.
            </div>
          )}
        </div>
      )}

      {/* Actual Certificate view */}
      {certificate && (
        <div className="space-y-4">
          <div className="print:fixed print:inset-0 print:bg-white print:text-slate-900 border-4 border-double border-indigo-500/30 rounded-3xl p-6 md:p-10 bg-slate-950/40 relative text-center space-y-6 overflow-hidden">
            {/* Elegant Background Accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Logo and Brand */}
            <div className="flex justify-center items-center gap-2">
              <div className="accent-gradient p-2 rounded-xl text-white">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-white tracking-widest font-sans uppercase">Dekel.Formation</span>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 font-sans">Certificat de Réussite Académique</span>
              <h2 className="text-xl md:text-2xl font-serif text-white font-medium italic">Ce certificat est fièrement décerné à</h2>
              <p className="text-base md:text-lg font-black text-slate-100 uppercase tracking-wide font-sans">{certificate.studentName}</p>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed font-sans">
              pour avoir complété avec brio et validé l'intégralité du programme d'apprentissage intitulé
              <br />
              <strong className="text-white text-sm block mt-2 font-black">"{certificate.courseTitle}"</strong>
            </p>

            {/* Footer with serial, QR code and signatures */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10 max-w-xl mx-auto">
              <div className="text-left space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-slate-500 font-sans">Signature de l'organisme</p>
                <div className="h-8 flex items-center font-serif text-indigo-400 italic text-sm font-medium">
                  Dekel.Formation Staff
                </div>
                <div className="w-24 h-px bg-white/10" />
                <p className="text-[8px] text-slate-400 font-sans">Délivré le {new Date(certificate.issuedAt).toLocaleDateString('fr-FR')}</p>
              </div>

              {/* Unique QR Verification */}
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                <QrCode className="w-10 h-10 text-slate-200 shrink-0" />
                <div className="text-left font-sans">
                  <p className="text-[8px] text-slate-400 font-bold uppercase">ID Unique</p>
                  <p className="text-[10px] text-indigo-300 font-mono font-bold">{certificate.verificationCode}</p>
                  <p className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">Scannez pour vérifier</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={handleDownloadCertificate}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-90 text-white rounded-xl shadow-lg border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 font-sans"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Certificat (PDF / HTML)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
