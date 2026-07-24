import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Copy, ArrowUp, ArrowDown, Image as ImageIcon, 
  HelpCircle, Settings, FileText, CheckCircle, Radio, CheckSquare, 
  AlignLeft, Type, Save, Eye, AlertCircle, Clock, Award
} from 'lucide-react';
import { CourseQuiz, CourseQuizQuestion, QuestionType, Module, Chapter } from '../types';
import { showToast } from './Toast';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface QuizEditorModalProps {
  courseId: string;
  quiz?: CourseQuiz | null;
  modules: Module[];
  chapters: Chapter[];
  defaultAssociationType?: 'chapter' | 'module' | 'course_end';
  defaultTargetId?: string;
  onClose: () => void;
  onSaveSuccess: (savedQuiz: CourseQuiz) => void;
}

export const QuizEditorModal: React.FC<QuizEditorModalProps> = ({
  courseId,
  quiz,
  modules,
  chapters,
  defaultAssociationType = 'course_end',
  defaultTargetId = '',
  onClose,
  onSaveSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('questions');

  // Quiz parameters
  const [title, setTitle] = useState(quiz?.title || 'Nouveau Quiz d\'évaluation');
  const [description, setDescription] = useState(quiz?.description || '');
  const [instructions, setInstructions] = useState(quiz?.instructions || 'Lisez attentivement chaque question avant de répondre.');
  const [associationType, setAssociationType] = useState<'chapter' | 'module' | 'course_end'>(
    quiz?.associationType || defaultAssociationType
  );
  const [targetId, setTargetId] = useState(quiz?.targetId || defaultTargetId);
  const [durationMinutes, setDurationMinutes] = useState(quiz?.durationMinutes || 0);
  const [passingScore, setPassingScore] = useState(quiz?.passingScore ?? 80);
  const [allowedAttempts, setAllowedAttempts] = useState(quiz?.allowedAttempts ?? 0);
  const [questionOrder, setQuestionOrder] = useState<'fixed' | 'random'>(quiz?.questionOrder || 'fixed');
  const [showCorrections, setShowCorrections] = useState<'immediate' | 'after_submission' | 'never'>(
    quiz?.showCorrections || 'immediate'
  );
  const [status, setStatus] = useState<'published' | 'draft'>(quiz?.status || 'published');
  const [isRequired, setIsRequired] = useState(quiz?.isRequired ?? true);

  // Questions state
  const [questions, setQuestions] = useState<CourseQuizQuestion[]>(
    quiz?.questions || [
      {
        id: `q-${Date.now()}-1`,
        type: 'single_choice',
        title: 'Première question exemple',
        description: '',
        points: 1,
        options: ['Option 1', 'Option 2', 'Option 3'],
        correctAnswers: ['0'],
        explanation: 'Explication pour la première option.'
      }
    ]
  );

  const [saving, setSaving] = useState(false);

  // Add new question helper
  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q-${Date.now()}-${questions.length + 1}`;
    let newQ: CourseQuizQuestion = {
      id: newId,
      type,
      title: type === 'section_header' ? 'Titre de la section / Explication' : 'Nouvelle question',
      description: type === 'section_header' ? 'Description détaillée ou texte explicatif à lire avant les questions.' : '',
      points: type === 'section_header' ? 0 : 1,
      options: type === 'short_text' || type === 'section_header' ? [] : ['Option A', 'Option B'],
      correctAnswers: type === 'short_text' ? [''] : type === 'section_header' ? [] : ['0'],
      explanation: ''
    };

    setQuestions(prev => [...prev, newQ]);
    showToast('Question ajoutée', 'info');
  };

  // Update a single question property
  const updateQuestion = (index: number, updatedFields: Partial<CourseQuizQuestion>) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedFields };
      return copy;
    });
  };

  // Add option to a question
  const handleAddOption = (qIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = copy[qIndex].options ? [...copy[qIndex].options!] : [];
      opts.push(`Option ${opts.length + 1}`);
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  // Edit option text
  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...(copy[qIndex].options || [])];
      opts[optIndex] = value;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  // Delete option
  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = (copy[qIndex].options || []).filter((_, idx) => idx !== optIndex);
      // Clean correctAnswers if affected
      const currentCorrect = copy[qIndex].correctAnswers || [];
      const newCorrect = currentCorrect
        .map(c => parseInt(c, 10))
        .filter(idx => idx !== optIndex)
        .map(idx => (idx > optIndex ? idx - 1 : idx).toString());

      copy[qIndex] = {
        ...copy[qIndex],
        options: opts,
        correctAnswers: newCorrect.length > 0 ? newCorrect : ['0']
      };
      return copy;
    });
  };

  // Toggle or select correct answers
  const handleToggleCorrectAnswer = (qIndex: number, optIndexStr: string) => {
    const q = questions[qIndex];
    if (q.type === 'single_choice' || q.type === 'image_question') {
      updateQuestion(qIndex, { correctAnswers: [optIndexStr] });
    } else if (q.type === 'multiple_choice') {
      const current = q.correctAnswers || [];
      if (current.includes(optIndexStr)) {
        if (current.length === 1) {
          showToast('Sélectionnez au moins une bonne réponse', 'warning');
          return;
        }
        updateQuestion(qIndex, { correctAnswers: current.filter(c => c !== optIndexStr) });
      } else {
        updateQuestion(qIndex, { correctAnswers: [...current, optIndexStr] });
      }
    }
  };

  // Reordering
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    setQuestions(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const duplicateQuestion = (index: number) => {
    const q = questions[index];
    const dup: CourseQuizQuestion = {
      ...q,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${q.title} (Copie)`,
    };
    setQuestions(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, dup);
      return copy;
    });
    showToast('Question dupliquée', 'info');
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      showToast('Le quiz doit comporter au moins une question ou section', 'warning');
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
    showToast('Question supprimée', 'info');
  };

  // Save Quiz
  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      showToast('Veuillez renseigner le titre du quiz', 'warning');
      return;
    }

    if (associationType === 'chapter' && !targetId) {
      showToast('Veuillez sélectionner le chapitre associé', 'warning');
      return;
    }

    if (associationType === 'module' && !targetId) {
      showToast('Veuillez sélectionner le module associé', 'warning');
      return;
    }

    setSaving(true);
    const quizId = quiz?.id || `quiz-${courseId}-${Date.now()}`;

    const newQuiz: CourseQuiz = {
      id: quizId,
      courseId,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      associationType,
      targetId: associationType === 'course_end' ? courseId : targetId,
      order: quiz?.order || Date.now(),
      durationMinutes: Number(durationMinutes) || 0,
      passingScore: Number(passingScore) || 80,
      allowedAttempts: Number(allowedAttempts) || 0,
      questionOrder,
      showCorrections,
      status,
      isRequired,
      questions,
      createdAt: quiz?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'quizzes', quizId), newQuiz);
      localStorage.setItem(`sio_quiz_${quizId}`, JSON.stringify(newQuiz));
      showToast('Quiz enregistré avec succès !', 'success');
      onSaveSuccess(newQuiz);
      onClose();
    } catch (err) {
      console.error('Save quiz error:', err);
      // Fallback local
      localStorage.setItem(`sio_quiz_${quizId}`, JSON.stringify(newQuiz));
      showToast('Quiz sauvegardé en mode local !', 'success');
      onSaveSuccess(newQuiz);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in text-slate-100">
        
        {/* Header - Google Forms style Header */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 p-5 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Éditeur de Quiz</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Expérience de création inspirée de Google Forms</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveQuiz}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer le Quiz'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Questions ({questions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres du Quiz</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* TAB 1: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* General info card */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Informations Générales</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Titre du quiz *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Evaluation Module 1 - Bases de la programmation"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description (Optionnelle)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Présentation générale du quiz pour les étudiants..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Instructions pour l'étudiant</label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Consignes particulières avant de démarrer..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium resize-none"
                  />
                </div>
              </div>

              {/* Association in course tree */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-emerald-400" />
                  <span>Placement dans la Structure de la Formation</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAssociationType('chapter');
                      if (chapters.length > 0) setTargetId(chapters[0].id);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      associationType === 'chapter'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">Associé à un chapitre</span>
                    <span className="text-[10px] opacity-70 mt-1">À la suite d'une leçon précise</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssociationType('module');
                      if (modules.length > 0) setTargetId(modules[0].id);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      associationType === 'module'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">Fin de module</span>
                    <span className="text-[10px] opacity-70 mt-1">Évaluation globale d'un module</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssociationType('course_end');
                      setTargetId(courseId);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      associationType === 'course_end'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">Examen Final</span>
                    <span className="text-[10px] opacity-70 mt-1">Fin de la formation globale</span>
                  </button>
                </div>

                {associationType === 'chapter' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Sélectionner le Chapitre</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choisir un chapitre --</option>
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {associationType === 'module' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Sélectionner le Module</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choisir un module --</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Evaluation and Certification Rules */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Règles de Note & Certification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Score minimum de réussite (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={passingScore}
                        onChange={(e) => setPassingScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Recommandé : 80% pour la certification.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tentatives autorisées</label>
                    <select
                      value={allowedAttempts}
                      onChange={(e) => setAllowedAttempts(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={0}>Illimité (Recommandé)</option>
                      <option value={1}>1 seule tentative</option>
                      <option value={2}>2 tentatives</option>
                      <option value={3}>3 tentatives</option>
                      <option value={5}>5 tentatives</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Durée limite (minutes)</label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="number"
                        min={0}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Math.max(0, Number(e.target.value)))}
                        placeholder="0 = Aucune limite"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Mettre 0 pour laisser un temps illimité.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Ordre des questions</label>
                    <select
                      value={questionOrder}
                      onChange={(e) => setQuestionOrder(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fixed">Ordre fixe (Défini ci-dessous)</option>
                      <option value="random">Ordre aléatoire pour chaque étudiant</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Affichage des corrections</label>
                    <select
                      value={showCorrections}
                      onChange={(e) => setShowCorrections(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="immediate">Immédiat (Juste après la soumission)</option>
                      <option value="after_submission">Seulement le score %, réponses masquées</option>
                      <option value="never">Rien (Masquer les explications)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Statut du quiz</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="published">Publié (Visible par les étudiants)</option>
                      <option value="draft">Brouillon (Inaccessible)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Quiz obligatoire pour le certificat de fin de formation</span>
                      <span className="text-[10px] text-slate-400">Ce quiz comptera dans la moyenne générale requise d'au moins 80 % pour générer le certificat.</span>
                    </div>
                  </label>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: QUESTIONS (Google Forms Style) */}
          {activeTab === 'questions' && (
            <div className="space-y-6">

              {/* Title & Description Header Card in Google Forms Style */}
              <div className="bg-slate-800/90 border-t-4 border-t-indigo-500 border-x border-b border-slate-700 rounded-2xl p-6 shadow-xl space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre du formulaire de quiz"
                  className="w-full bg-transparent text-xl font-black text-white focus:outline-none border-b border-transparent focus:border-indigo-500 pb-1 transition-all"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du quiz (instructions de passage)..."
                  className="w-full bg-transparent text-xs text-slate-300 focus:outline-none border-b border-transparent focus:border-indigo-500 pb-1 transition-all"
                />
              </div>

              {/* Floating Toolbar to Add Question Types */}
              <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-slate-300 px-2 shrink-0 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Ajouter un élément :</span>
                </span>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('single_choice')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Réponse unique</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestion('multiple_choice')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Réponses multiples</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestion('image_question')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Question + Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestion('short_text')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-sky-400" />
                    <span>Texte court</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestion('section_header')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlignLeft className="w-3.5 h-3.5 text-purple-400" />
                    <span>Section / Description</span>
                  </button>
                </div>
              </div>

              {/* Question Cards List */}
              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div 
                    key={q.id}
                    className="bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-2xl p-5 shadow-lg transition-all space-y-4 relative group"
                  >
                    {/* Top Action Controls & Position Badge */}
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                          {qIndex + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {q.type === 'single_choice' && 'Choix unique (Radio)'}
                          {q.type === 'multiple_choice' && 'Choix multiples (Cases)'}
                          {q.type === 'image_question' && 'Question avec Image'}
                          {q.type === 'short_text' && 'Réponse textuelle courte'}
                          {q.type === 'section_header' && 'Texte explicatif (0 pt)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(qIndex, 'up')}
                          disabled={qIndex === 0}
                          title="Déplacer vers le haut"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 disabled:opacity-20 transition-all cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(qIndex, 'down')}
                          disabled={qIndex === questions.length - 1}
                          title="Déplacer vers le bas"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 disabled:opacity-20 transition-all cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateQuestion(qIndex)}
                          title="Dupliquer la question"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(qIndex)}
                          title="Supprimer la question"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Title & Points row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-9 space-y-2">
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => updateQuestion(qIndex, { title: e.target.value })}
                          placeholder="Intitulé de la question..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={q.description || ''}
                          onChange={(e) => updateQuestion(qIndex, { description: e.target.value })}
                          placeholder="Sous-titre / instruction complémentaire (optionnel)..."
                          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {q.type !== 'section_header' && (
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Points attribués
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={q.points}
                            onChange={(e) => updateQuestion(qIndex, { points: Math.max(0, Number(e.target.value)) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 text-center focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Image URL section if type is image_question or optional image */}
                    {(q.type === 'image_question' || q.imageUrl) && (
                      <div className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-xl space-y-2">
                        <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>URL de l'image de la question</span>
                        </label>
                        <input
                          type="text"
                          value={q.imageUrl || ''}
                          onChange={(e) => updateQuestion(qIndex, { imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/... ou URL d'image"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        {q.imageUrl && (
                          <div className="mt-2 max-h-48 overflow-hidden rounded-xl border border-slate-700 bg-black/40 flex items-center justify-center p-2">
                            <img src={q.imageUrl} alt="Aperçu question" className="max-h-40 object-contain rounded-lg" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Options list for Single Choice, Multiple Choice, Image Question */}
                    {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'image_question') && (
                      <div className="space-y-2 pt-2 border-t border-slate-700/40">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Propositions de réponse (Cochez la/les bonne(s) réponse(s))
                        </p>

                        <div className="space-y-2">
                          {(q.options || []).map((opt, optIndex) => {
                            const isCorrect = (q.correctAnswers || []).includes(optIndex.toString());
                            return (
                              <div key={optIndex} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCorrectAnswer(qIndex, optIndex.toString())}
                                  title={isCorrect ? 'Bonne réponse sélectionnée' : 'Cliquer pour marquer comme réponse exacte'}
                                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                      : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
                                  }`}
                                >
                                  {q.type === 'multiple_choice' ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Radio className="w-4 h-4" />
                                  )}
                                </button>

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className={`flex-1 bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all ${
                                    isCorrect ? 'border-emerald-500/50 font-bold bg-emerald-950/10' : 'border-slate-700'
                                  }`}
                                />

                                {(q.options || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(qIndex, optIndex)}
                                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="mt-2 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter une option</span>
                        </button>
                      </div>
                    )}

                    {/* Short Text expected answer */}
                    {q.type === 'short_text' && (
                      <div className="space-y-2 pt-2 border-t border-slate-700/40">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Réponse exacte attendue (ou mot-clé exigé)
                        </label>
                        <input
                          type="text"
                          value={q.correctAnswers?.[0] || ''}
                          onChange={(e) => updateQuestion(qIndex, { correctAnswers: [e.target.value] })}
                          placeholder="Texte court exigé pour accorder les points..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {/* Explanation Callout Box */}
                    {q.type !== 'section_header' && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Explication de la réponse (Optionnel - affichée après correction)
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                          placeholder="Explication Pédagogique du formateur..."
                          className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-none font-medium"
                        />
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Total questions : <strong className="text-white">{questions.filter(q => q.type !== 'section_header').length}</strong> | Points max : <strong className="text-amber-400">{questions.reduce((acc, q) => acc + (q.points || 0), 0)} pts</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer le Quiz'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuizEditorModal;
