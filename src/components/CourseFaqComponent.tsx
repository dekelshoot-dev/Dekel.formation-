import React, { useState, useEffect } from 'react';
import { Course, FaqItem, User } from '../types';
import { 
  HelpCircle, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Search, 
  Pin, MessageCircle, Check, X, Sparkles, Send, Tag, AlertCircle 
} from 'lucide-react';
import { showToast } from './Toast';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

interface CourseFaqComponentProps {
  course: Course;
  currentUser: User | null;
  onUpdateCourse?: (updatedCourse: Course) => void;
  isCompact?: boolean;
}

export const DEFAULT_COURSE_FAQS: Omit<FaqItem, 'id' | 'courseId'>[] = [
  {
    question: "Comment se déroule la formation ?",
    answer: "La formation est 100% en ligne et accessible 24h/24. Vous avancez à votre propre rythme à travers des modules vidéo interactifs, des quizz et des exercices pratiques.",
    category: "Général",
    isPinned: true
  },
  {
    question: "Quels sont les moyens de paiement acceptés ?",
    answer: "Nous acceptons les paiements via Mobile Money (Orange Money, MTN Mobile Money, Wave) ainsi que les cartes bancaires et virements.",
    category: "Paiement & Accès",
    isPinned: true
  },
  {
    question: "Obtiendrai-je un certificat à la fin de la formation ?",
    answer: "Oui ! Une fois tous les modules validés à 100%, un certificat officiel de réussite nominatif au format PDF est automatiquement généré avec un numéro de vérification unique.",
    category: "Certificat",
    isPinned: false
  },
  {
    question: "Pendant combien de temps ai-je accès au contenu ?",
    answer: "Dès votre inscription validée, vous bénéficiez d'un accès illimité à vie à l'intégralité des modules, chapitres et ressources téléchargeables.",
    category: "Paiement & Accès",
    isPinned: false
  }
];

export default function CourseFaqComponent({
  course,
  currentUser,
  onUpdateCourse,
  isCompact = false
}: CourseFaqComponentProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Form states for trainer/admin editing & adding
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Général');

  // Form states for student asking question
  const [showAskForm, setShowAskForm] = useState(false);
  const [studentQuestion, setStudentQuestion] = useState('');

  // Determine permissions
  const isTrainerOrAdmin = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.role === 'trainer' ||
    currentUser.email.toLowerCase() === course.trainerId.toLowerCase() ||
    currentUser.id === course.trainerId ||
    currentUser.name.toLowerCase() === course.trainerName.toLowerCase()
  );

  // Firestore & local state synchronization
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      if (db) {
        const q = query(collection(db, 'course_faqs'), where('courseId', '==', course.id));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const items: FaqItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as FaqItem);
          });

          if (items.length > 0) {
            setFaqs(items);
          } else {
            // Load defaults or course.faqs if Firestore has no items yet
            const initial = course.faqs && course.faqs.length > 0
              ? course.faqs
              : DEFAULT_COURSE_FAQS.map((def, idx) => ({
                  ...def,
                  id: `faq-default-${idx}`,
                  courseId: course.id,
                  createdAt: new Date().toISOString()
                }));
            setFaqs(initial);
          }
        }, (err) => {
          console.warn("Firestore FAQ snapshot fallback to local:", err);
          const initial = course.faqs && course.faqs.length > 0
            ? course.faqs
            : DEFAULT_COURSE_FAQS.map((def, idx) => ({
                ...def,
                id: `faq-default-${idx}`,
                courseId: course.id,
                createdAt: new Date().toISOString()
              }));
          setFaqs(initial);
        });
      } else {
        const initial = course.faqs && course.faqs.length > 0
          ? course.faqs
          : DEFAULT_COURSE_FAQS.map((def, idx) => ({
              ...def,
              id: `faq-default-${idx}`,
              courseId: course.id,
              createdAt: new Date().toISOString()
            }));
        setFaqs(initial);
      }
    } catch (e) {
      const initial = course.faqs && course.faqs.length > 0
        ? course.faqs
        : DEFAULT_COURSE_FAQS.map((def, idx) => ({
            ...def,
            id: `faq-default-${idx}`,
            courseId: course.id,
            createdAt: new Date().toISOString()
          }));
      setFaqs(initial);
    }

    return () => unsubscribe();
  }, [course.id]);

  // Handle Save (Add or Edit FAQ)
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      showToast('Veuillez remplir la question et la réponse.', 'error');
      return;
    }

    const itemToSave: FaqItem = {
      id: editingFaq ? editingFaq.id : `faq-${Date.now()}`,
      courseId: course.id,
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      category: faqCategory,
      createdAt: editingFaq?.createdAt || new Date().toISOString(),
      authorEmail: currentUser?.email || course.trainerName,
      isPinned: editingFaq?.isPinned || false
    };

    try {
      if (db) {
        await setDoc(doc(db, 'course_faqs', itemToSave.id), itemToSave);
      }
    } catch (err) {
      console.error("Firestore save FAQ error:", err);
    }

    const updatedFaqs = editingFaq
      ? faqs.map(f => f.id === editingFaq.id ? itemToSave : f)
      : [itemToSave, ...faqs];

    setFaqs(updatedFaqs);

    if (onUpdateCourse) {
      onUpdateCourse({ ...course, faqs: updatedFaqs });
    }

    showToast(editingFaq ? 'FAQ mise à jour avec succès !' : 'Nouvelle FAQ ajoutée !', 'success');

    // Reset form
    setShowAddForm(false);
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('Général');
  };

  // Handle Delete
  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;

    try {
      if (db) {
        await deleteDoc(doc(db, 'course_faqs', id));
      }
    } catch (err) {
      console.error("Firestore delete FAQ error:", err);
    }

    const updated = faqs.filter(f => f.id !== id);
    setFaqs(updated);
    if (onUpdateCourse) {
      onUpdateCourse({ ...course, faqs: updated });
    }
    showToast('FAQ supprimée !', 'success');
  };

  // Handle Pin Toggle
  const handleTogglePin = async (faq: FaqItem) => {
    const updatedFaq: FaqItem = { ...faq, isPinned: !faq.isPinned };
    try {
      if (db) {
        await setDoc(doc(db, 'course_faqs', faq.id), updatedFaq);
      }
    } catch (err) {
      console.error("Firestore pin FAQ error:", err);
    }

    const updated = faqs.map(f => f.id === faq.id ? updatedFaq : f);
    setFaqs(updated);
    if (onUpdateCourse) {
      onUpdateCourse({ ...course, faqs: updated });
    }
    showToast(updatedFaq.isPinned ? 'FAQ épinglée en haut !' : 'Désépinglée', 'info');
  };

  // Handle Student Question Submission
  const handleStudentSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuestion.trim()) return;

    const newQuestionItem: FaqItem = {
      id: `faq-student-${Date.now()}`,
      courseId: course.id,
      question: studentQuestion.trim(),
      answer: "En attente de réponse du formateur...",
      category: "Questions des étudiants",
      createdAt: new Date().toISOString(),
      authorEmail: currentUser?.email || 'Étudiant',
      isPinned: false
    };

    try {
      if (db) {
        await setDoc(doc(db, 'course_faqs', newQuestionItem.id), newQuestionItem);
      }
    } catch (err) {
      console.error("Firestore student question error:", err);
    }

    const updated = [newQuestionItem, ...faqs];
    setFaqs(updated);
    if (onUpdateCourse) {
      onUpdateCourse({ ...course, faqs: updated });
    }

    showToast("Votre question a été soumise au formateur ! Elle apparaîtra dès sa validation.", "success");
    setStudentQuestion('');
    setShowAskForm(false);
  };

  // Categories extraction
  const categoriesList = ['Tous', ...Array.from(new Set(faqs.map(f => f.category || 'Général')))];

  // Filtered FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery.trim() === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Tous' || (faq.category || 'Général') === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className={`space-y-4 ${isCompact ? '' : 'p-4 md:p-6 bg-[#161a20] border border-white/10 rounded-3xl text-slate-200'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-2xl border border-indigo-500/25 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <span>Foire Aux Questions (FAQ)</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {faqs.length} question{faqs.length > 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Questions récurrentes et réponses officielles du formateur.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isTrainerOrAdmin ? (
            <button
              type="button"
              onClick={() => {
                setEditingFaq(null);
                setFaqQuestion('');
                setFaqAnswer('');
                setFaqCategory('Général');
                setShowAddForm(!showAddForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Fermer le formulaire' : 'Ajouter une FAQ'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAskForm(!showAskForm)}
              className="bg-white/10 hover:bg-white/15 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              <span>Poser une question</span>
            </button>
          )}
        </div>
      </div>

      {/* Trainer / Admin Add/Edit Form */}
      {showAddForm && isTrainerOrAdmin && (
        <form onSubmit={handleSaveFaq} className="bg-white/5 border border-indigo-500/30 rounded-2xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>{editingFaq ? 'Modifier la FAQ' : 'Ajouter une nouvelle question/réponse'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Catégorie</label>
              <select
                value={faqCategory}
                onChange={(e) => setFaqCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Général">Général</option>
                <option value="Paiement & Accès">Paiement & Accès</option>
                <option value="Programme">Programme & Exercices</option>
                <option value="Certificat">Certificat & Validation</option>
                <option value="Prérequis">Prérequis & Logiciels</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Question</label>
              <input
                type="text"
                required
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Ex: Quel est le niveau requis pour suivre ce cours ?"
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Réponse claire et détaillée</label>
              <textarea
                required
                rows={3}
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Ex: Ce cours est conçu pour les débutants complets. Aucun prérequis technique n'est nécessaire."
                className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 leading-relaxed"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingFaq(null);
              }}
              className="px-3.5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-300 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      )}

      {/* Student Ask Question Form */}
      {showAskForm && (
        <form onSubmit={handleStudentSubmitQuestion} className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>Poser une question au formateur ({course.trainerName})</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAskForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            required
            rows={2}
            value={studentQuestion}
            onChange={(e) => setStudentQuestion(e.target.value)}
            placeholder="Écrivez votre question ici..."
            className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          ></textarea>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer la question</span>
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question ou un mot-clé..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {categoriesList.length > 2 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categoriesList.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accordion List */}
      {filteredFaqs.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-bold">Aucune question trouvée.</p>
          <p className="text-[11px] text-slate-400">Essayez un autre mot-clé de recherche ou posez directement votre question.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div 
                key={faq.id} 
                className={`border rounded-2xl transition-all overflow-hidden ${
                  isOpen 
                    ? 'bg-white/10 border-indigo-500/40 shadow-lg' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Accordion Question Header */}
                <div 
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="p-3.5 md:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {faq.isPinned && (
                      <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg shrink-0" title="FAQ épinglée">
                        <Pin className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="text-xs md:text-sm font-bold text-white leading-snug">
                      {faq.question}
                    </span>
                    {faq.category && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/20 shrink-0">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{faq.category}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Admin/Trainer controls */}
                    {isTrainerOrAdmin && (
                      <div className="flex items-center gap-1 opacity-80 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(faq)}
                          className={`p-1.5 rounded-lg transition-colors ${faq.isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
                          title={faq.isPinned ? 'Désépingler' : 'Épingler en haut'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaq(faq);
                            setFaqQuestion(faq.question);
                            setFaqAnswer(faq.answer);
                            setFaqCategory(faq.category || 'Général');
                            setShowAddForm(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="p-1 bg-white/5 rounded-lg text-slate-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Answer Content */}
                {isOpen && (
                  <div className="px-3.5 pb-4 pt-1 md:px-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 space-y-2 animate-fade-in">
                    <p className="whitespace-pre-line font-normal text-slate-200">
                      {faq.answer}
                    </p>
                    {faq.authorEmail && (
                      <p className="text-[10px] text-slate-500 italic pt-1">
                        Réponse rédigée par l'équipe pédagogique ({course.trainerName})
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
