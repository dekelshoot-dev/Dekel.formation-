import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Course, Module, Chapter, Enrollment, User, SimulatedEmail } from '../types';
import CourseFaqComponent from './CourseFaqComponent';
import ShareModal from './ShareModal';
import { BookOpen, User as UserIcon, Coins, MessageSquare, ShieldCheck, CheckCircle, ArrowRight, Smartphone, AlertCircle, Lock, Unlock, PlayCircle, Eye, X, ArrowLeft, Search, Plus, Trash2, Tag, Share2, ExternalLink } from 'lucide-react';

interface MarketplaceProps {
  allCourses: Course[];
  allModules: Module[];
  allChapters: Chapter[];
  allEnrollments: Enrollment[];
  currentUser: User | null;
  categories?: string[];
  onAddCategory?: (cat: string) => void;
  onDeleteCategory?: (cat: string) => void;
  onEnrollStudent: (email: string, courseId: string) => void;
  onSendEmail: (email: SimulatedEmail) => void;
  onSwitchToLogin: () => void;
  autoOpenSlug?: string;
  onClearAutoOpen?: () => void;
  onOpenPublicPage?: (course: Course) => void;
}

export default function Marketplace({
  allCourses,
  allModules,
  allChapters,
  allEnrollments,
  currentUser,
  categories: categoriesProp,
  onAddCategory,
  onDeleteCategory,
  onEnrollStudent,
  onSendEmail,
  onSwitchToLogin,
  autoOpenSlug,
  onClearAutoOpen,
  onOpenPublicPage
}: MarketplaceProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Detailed view program modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [lockedChapterAlert, setLockedChapterAlert] = useState<string | null>(null);

  // Social Share Modal State
  const [courseToShare, setCourseToShare] = useState<Course | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Search & Category Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Auto-open selected course when matching slug is passed via custom SEO URL
  useEffect(() => {
    if (autoOpenSlug && allCourses.length > 0) {
      const matchedCourse = allCourses.find(
        c => c.seoSlug === autoOpenSlug || c.id === autoOpenSlug
      );
      if (matchedCourse) {
        setSelectedCourseForDetails(matchedCourse);
        setShowDetailsModal(true);
      }
      if (onClearAutoOpen) {
        onClearAutoOpen();
      }
    }
  }, [autoOpenSlug, allCourses, onClearAutoOpen]);

  const categoryList = categoriesProp && categoriesProp.length > 0 
    ? categoriesProp 
    : ['Développement', 'E-commerce', 'Design', 'Marketing', 'Montage Vidéo', 'Miniatures', 'Flyers'];

  const publishedCourses = (allCourses || []).filter(c => c && c.status === 'published');

  const filteredCourses = publishedCourses.filter(course => {
    if (!course) return false;
    // 1. Category Filter
    let matchesCategory = true;
    if (selectedCategory !== 'Tous') {
      const cType = (course.type || '').toLowerCase();
      const target = selectedCategory.toLowerCase();
      matchesCategory = cType.includes(target) || target.includes(cType);
    }

    // 2. Search Query Filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (course.title || '').toLowerCase().includes(q);
      const descMatch = (course.description || '').toLowerCase().includes(q);
      const trainerMatch = (course.trainerName || '').toLowerCase().includes(q);
      const typeMatch = (course.type || '').toLowerCase().includes(q);
      matchesSearch = titleMatch || descMatch || trainerMatch || typeMatch;
    }

    return matchesCategory && matchesSearch;
  });

  const isUserEnrolledInSelectedCourse = (courseId?: string): boolean => {
    if (!currentUser || (!courseId && !selectedCourse)) return false;
    const targetCourseId = courseId || selectedCourse?.id;
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    return (allEnrollments || []).some(
      e => e?.courseId === targetCourseId &&
           (e?.studentEmail || '').trim().toLowerCase() === userEmail &&
           e?.status === 'active'
    );
  };

  const openCheckout = (course: Course) => {
    setSelectedCourse(course);
    setShowCheckoutModal(true);
    setIsCheckingPayment(false);
    
    // Check immediately if already enrolled
    if (currentUser) {
      const userEmail = currentUser.email.trim().toLowerCase();
      const alreadyEnrolled = allEnrollments.some(
        e => e.courseId === course.id &&
             e.studentEmail.trim().toLowerCase() === userEmail &&
             e.status === 'active'
      );
      setPaymentDone(alreadyEnrolled);
    } else {
      setPaymentDone(false);
    }
  };

  // Poll every 3 seconds while isCheckingPayment is true until user is enrolled
  useEffect(() => {
    if (!isCheckingPayment || !selectedCourse || !currentUser) return;

    // Check immediately
    if (isUserEnrolledInSelectedCourse(selectedCourse.id)) {
      setIsCheckingPayment(false);
      setPaymentDone(true);
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await fetch('/api/sync-enrollments');
      } catch {
        // sync error ignored
      }

      if (isUserEnrolledInSelectedCourse(selectedCourse.id)) {
        setIsCheckingPayment(false);
        setPaymentDone(true);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isCheckingPayment, allEnrollments, currentUser, selectedCourse]);

  const handleVerifyPayment = () => {
    if (!currentUser) {
      alert('Veuillez d\'abord vous connecter à votre compte étudiant pour vérifier votre paiement.');
      onSwitchToLogin();
      setShowCheckoutModal(false);
      return;
    }

    if (!selectedCourse) return;

    if (isUserEnrolledInSelectedCourse(selectedCourse.id)) {
      setPaymentDone(true);
      setIsCheckingPayment(false);
    } else {
      setIsCheckingPayment(true);
      setPaymentDone(false);
    }
  };

  // Pre-fill WhatsApp message
  const getWhatsAppMessage = (course: Course) => {
    const activePrice = course.promoPrice && course.promoPrice > 0 ? course.promoPrice : course.price;
    const text = `Bonjour, je viens d'effectuer le paiement de ${activePrice.toLocaleString('fr-FR')} XAF pour la formation "${course.title}". Voici ma preuve de paiement pour activer mon compte (${currentUser?.email || 'mon-email@exemple.com'}). Merci !`;
    const cleanNumber = course.whatsappNumber ? course.whatsappNumber.replace(/[^0-9]/g, '') : '221771234567';
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="glass border-white/10 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs border border-indigo-500/30">
            Catalogue de formations
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Propulsez vos compétences vers le <span className="text-indigo-400">niveau supérieur</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Parcourez les formations créées par nos experts. Suivez les étapes de paiement manuel sécurisé par Mobile Money ou virement bancaire pour débloquer votre accès instantanément.
          </p>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="glass border-white/10 rounded-2xl sm:rounded-3xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une formation par titre, sujet ou formateur..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Badge & Add Category Trigger */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs">
            <span className="text-slate-300 font-medium px-3 py-2 bg-white/5 border border-white/10 rounded-xl whitespace-nowrap">
              {filteredCourses.length} formation{filteredCourses.length > 1 ? 's' : ''} {searchQuery ? 'trouvée(s)' : 'disponible(s)'}
            </span>

            {(currentUser?.role === 'admin' || currentUser?.role === 'trainer') && (
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gérer les catégories</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('Tous')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'Tous'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
                : 'bg-white/5 text-slate-350 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            Toutes les catégories
          </button>
          {categoryList.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-white/5 text-slate-350 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredCourses.length === 0 ? (
          <div className="text-center col-span-full py-16 bg-white/5 border border-white/15 rounded-3xl p-6 space-y-2">
            <p className="text-sm font-bold text-slate-200">Aucune formation trouvée</p>
            <p className="text-xs text-slate-400">Il n'y a pas encore de formation publiée dans cette catégorie.</p>
          </div>
        ) : (
          filteredCourses.map(course => {
            const courseModules = allModules.filter(m => m.courseId === course.id);
            const courseChapters = allChapters.filter(ch => {
              const mod = courseModules.find(m => m.id === ch.moduleId);
              return !!mod;
            });

            const isAlreadyEnrolled = currentUser 
              ? allEnrollments.some(e => e.studentEmail.toLowerCase() === currentUser.email.toLowerCase() && e.courseId === course.id && e.status === 'active')
              : false;

            return (
              <div key={course.id} className="glass border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group">
                {/* Course Cover */}
                <div 
                  onClick={() => {
                    if (onOpenPublicPage) {
                      onOpenPublicPage(course);
                    } else {
                      setSelectedCourseForDetails(course);
                      setShowDetailsModal(true);
                      setPreviewChapter(null);
                      setLockedChapterAlert(null);
                    }
                  }}
                  className="relative aspect-video overflow-hidden cursor-pointer"
                  title="Voir la page de présentation complète"
                >
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 glass-light backdrop-blur shadow text-white font-black px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-xs flex flex-col items-end">
                    {course.promoPrice && course.promoPrice > 0 ? (
                      <>
                        <span className="line-through text-[7px] sm:text-[10px] text-slate-350 font-normal">
                          {course.price.toLocaleString('fr-FR')} XAF
                        </span>
                        <span className="text-emerald-300 font-extrabold text-[8px] sm:text-xs">
                          {course.promoPrice.toLocaleString('fr-FR')} XAF
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] sm:text-xs">{course.price.toLocaleString('fr-FR')} XAF</span>
                    )}
                  </span>
                  <span className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 bg-slate-900/80 text-white font-semibold px-1 py-0.5 sm:px-2 rounded text-[7px] sm:text-[10px] uppercase">
                    {course.type}
                  </span>
                </div>

                {/* Course Body */}
                <div className="p-2 sm:p-5 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] text-slate-400 font-bold">
                      <span>{course.level}</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                    </div>
                    <h3 
                      onClick={() => {
                        if (onOpenPublicPage) {
                          onOpenPublicPage(course);
                        } else {
                          setSelectedCourseForDetails(course);
                          setShowDetailsModal(true);
                          setPreviewChapter(null);
                          setLockedChapterAlert(null);
                        }
                      }}
                      className="font-bold text-white text-[11px] sm:text-sm leading-tight sm:leading-snug group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2"
                      title="Voir la page de présentation complète"
                    >
                      {course.title}
                    </h3>
                  </div>

                  {/* Modules preview program outline (Desktop only to keep mobile cards compact) */}
                  <div className="hidden sm:block border-t border-white/10 pt-3.5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aperçu du programme :</p>
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        {courseModules.length} Modules
                      </span>
                      <span>{courseChapters.length} Chapitres</span>
                    </div>

                    {courseModules.length > 0 && (
                      <div className="bg-white/5 border border-white/10 p-2 rounded-xl text-[10px] text-slate-400 max-h-20 overflow-y-auto space-y-1">
                        {courseModules.map(m => (
                          <div key={m.id} className="truncate">• {m.title}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Instructor row & action buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5 border-t border-white/10 pt-1.5 sm:pt-3.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <img
                        src={course.trainerPhoto}
                        className="w-4 h-4 sm:w-6 sm:h-6 rounded-full object-cover border border-white/10"
                        alt={course.trainerName}
                      />
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-semibold truncate max-w-[80px] sm:max-w-[120px]">{course.trainerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
                      {/* Share button (Desktop only) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCourseToShare(course);
                          setShowShareModal(true);
                        }}
                        title="Partager cette formation"
                        className="hidden sm:flex bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold p-1.5 px-2 rounded-xl transition-all cursor-pointer items-center gap-1 text-[9px]"
                      >
                        <Share2 className="w-3 h-3 text-indigo-400" />
                        <span>Partager</span>
                      </button>

                      {/* Aperçu button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenPublicPage) {
                            onOpenPublicPage(course);
                          } else {
                            setSelectedCourseForDetails(course);
                            setShowDetailsModal(true);
                            setPreviewChapter(null);
                            setLockedChapterAlert(null);
                          }
                        }}
                        title="Voir la page publique complète de présentation"
                        className="flex-1 sm:flex-initial justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-[8px] sm:text-[9px] px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1"
                      >
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">Aperçu</span>
                      </button>

                      {/* Enrollment button */}
                      {isAlreadyEnrolled ? (
                        <span className="flex-1 sm:flex-initial text-center bg-emerald-500/10 text-emerald-400 font-bold text-[8px] sm:text-[9px] px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-emerald-500/20 truncate">
                          Inscrit
                        </span>
                      ) : (
                        <button
                          onClick={() => openCheckout(course)}
                          className="flex-1 sm:flex-initial text-center accent-gradient hover:opacity-90 text-white font-bold text-[8px] sm:text-[9px] px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer truncate"
                        >
                          S'inscrire
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Checkout Instructions Modal Overlay (Section 13) */}
      {showCheckoutModal && selectedCourse && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl border border-white/15 p-6 w-full max-w-lg shadow-2xl space-y-4 text-slate-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-start border-b border-white/10 pb-3 shrink-0">
              <div>
                <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">Paiement Manuel</span>
                <h3 className="font-black text-white text-base mt-1">S'inscrire à : {selectedCourse.title}</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-250 font-bold text-sm transition-colors"
              >
                Fermer
              </button>
            </div>

            {/* Scrollable Container for Instructions content */}
            <div className="overflow-y-auto pr-1.5 flex-1 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  Dans cette version, aucun paiement par carte n'est requis. L'accès est validé manuellement par le formateur après réception de votre preuve de paiement.
                </div>
              </div>

              {/* Instruction Steps (Requirement 6) */}
              <div className="space-y-4">
                {/* 1. Custom payment buttons (Requirement 6) */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boutons de paiement disponibles :</p>
                  {selectedCourse.customPaymentButtons && selectedCourse.customPaymentButtons.filter(b => b.active).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCourse.customPaymentButtons.filter(b => b.active).map(btn => {
                        let colorClasses = 'bg-indigo-600/25 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/35';
                        if (btn.color === 'blue') {
                          colorClasses = 'bg-blue-600/25 border-blue-500/40 text-blue-300 hover:bg-blue-600/35';
                        } else if (btn.color === 'green') {
                          colorClasses = 'bg-emerald-600/25 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/35';
                        } else if (btn.color === 'red') {
                          colorClasses = 'bg-rose-600/25 border-rose-500/40 text-rose-300 hover:bg-rose-600/35';
                        } else if (btn.color === 'yellow') {
                          colorClasses = 'bg-amber-600/25 border-amber-500/40 text-amber-300 hover:bg-amber-600/35';
                        } else if (btn.color === 'purple') {
                          colorClasses = 'bg-purple-600/25 border-purple-500/40 text-purple-300 hover:bg-purple-600/35';
                        }

                        return (
                          <a
                            key={btn.id}
                            href={btn.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${colorClasses}`}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>{btn.text}</span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href="https://wave.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-blue-600/25 border-blue-500/40 text-blue-300 hover:bg-blue-600/35 transition-all shadow-sm"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Payer par Wave</span>
                      </a>
                      <a
                        href="https://orangemoney.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-amber-600/25 border-amber-500/40 text-amber-300 hover:bg-amber-600/35 transition-all shadow-sm"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Payer par Orange Money</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Instructions de paiement (si activées) */}
                {selectedCourse.showPaymentInstructions !== false && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Instructions de paiement (Moyens acceptés) :</h4>
                    
                    {selectedCourse.paymentInstructions ? (
                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed markdown-body">
                        <Markdown>{selectedCourse.paymentInstructions}</Markdown>
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-start gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                          <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-white">Mobile Money (Orange / MTN / Wave)</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Envoyez le montant de <span className="font-bold text-white">{(selectedCourse.promoPrice && selectedCourse.promoPrice > 0 ? selectedCourse.promoPrice : selectedCourse.price).toLocaleString('fr-FR')} XAF</span> au numéro suivant :</p>
                            <p className="font-mono text-xs font-bold text-indigo-400 mt-1">+225 07 00 00 00 00 ({selectedCourse.trainerName})</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                          <Coins className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-white">Virement bancaire classique</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">RIB international de l'instructeur :</p>
                            <p className="font-mono text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded mt-1 select-all">
                              FR76 3000 1000 2000 3000 4000 500
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Informations de contact */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informations de contact :</p>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                    {selectedCourse.contactInfo || "WhatsApp: +225 07 00 00 00 00\nE-mail: support@formateur.com"}
                  </div>
                </div>

                {/* Steps checklist */}
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Étapes de validation :</p>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Effectuez la transaction du montant exact (<span className="font-bold text-white">{(selectedCourse.promoPrice && selectedCourse.promoPrice > 0 ? selectedCourse.promoPrice : selectedCourse.price).toLocaleString('fr-FR')} XAF</span>) via l'un des boutons ou moyens ci-dessus.</li>
                    <li>Prenez une capture d'écran du reçu de paiement.</li>
                    <li>Cliquez sur le bouton ci-dessous pour envoyer la preuve via WhatsApp au formateur pour validation.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/10 shrink-0">
              {paymentDone ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-center space-y-3 animate-fade-in">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-200">Paiement vérifié avec succès !</h4>
                    <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                      Votre inscription à la formation « <strong className="text-white">{selectedCourse.title}</strong> » est validée et active.
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20 text-left text-xs text-slate-300 space-y-1.5">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>📌 Instructions pour accéder à votre formation :</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                      <li>Cliquez sur le bouton ci-dessous pour fermer la fenêtre de paiement.</li>
                      <li>Rendez-vous dans votre espace étudiant sous la rubrique <strong className="text-white">"Mes Formations"</strong>.</li>
                      <li>Cliquez sur la formation pour démarrer le premier module.</li>
                    </ol>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <span>Accéder à ma formation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : isCheckingPayment ? (
                <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-amber-200 space-y-3 animate-fade-in text-center">
                  <div className="flex items-center justify-center gap-2.5 text-amber-400">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-xs">Vérification du paiement en cours...</span>
                  </div>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Nous vérifions si votre accès pour la formation <strong className="text-white">{selectedCourse.title}</strong> a été validé.
                  </p>
                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-amber-500/20 text-[11px] text-slate-300">
                    ⏳ Vérification automatique <strong className="text-amber-300">toutes les 3 secondes</strong>. Dès que le formateur ou l'administrateur valide votre inscription, cette page se mettra à jour.
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckingPayment(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline mt-1"
                  >
                    Arrêter la vérification
                  </button>
                </div>
              ) : (
                <>
                  <a
                    href={getWhatsAppMessage(selectedCourse)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-2 shadow"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Envoyer la preuve par WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    className="w-full bg-[#009966] hover:bg-[#008055] text-white font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Vérifier le paiement</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Course Details & Interactive Curriculum Modal (Requirement 1 - Free Chapters Preview) */}
      {showDetailsModal && selectedCourseForDetails && (() => {
        const detailModules = allModules
          .filter(m => m.courseId === selectedCourseForDetails.id)
          .sort((a, b) => a.order - b.order);

        const getEmbedUrlLocal = (url: string, source: 'youtube' | 'vimeo' | 'direct' | 'iframe') => {
          if (source === 'iframe') {
            const match = url.match(/src="([^"]+)"/);
            return match ? match[1] : url;
          }
          if (source === 'youtube') {
            let videoId = '';
            if (url.includes('v=')) {
              videoId = url.split('v=')[1]?.split('&')[0];
            } else if (url.includes('youtu.be/')) {
              videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('embed/')) {
              videoId = url.split('embed/')[1]?.split('?')[0];
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
          }
          if (source === 'vimeo') {
            let vimeoId = '';
            const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
            if (match) vimeoId = match[1];
            return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1` : url;
          }
          return url;
        };

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div className="glass rounded-3xl border border-white/15 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
              
              {/* Header */}
              <div className="p-4 md:p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <span className="bg-indigo-500/25 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase border border-indigo-500/30">
                    Programme & Aperçus de cours
                  </span>
                  <h3 className="font-black text-white text-base md:text-lg mt-1">{selectedCourseForDetails.title}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCourseForDetails(null);
                    setPreviewChapter(null);
                    setLockedChapterAlert(null);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 p-2 rounded-xl border border-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto lg:overflow-hidden">
                
                {/* Left Panel: Curriculum Modules and Chapters (7 cols) */}
                <div className="lg:col-span-5 p-4 md:p-5 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 space-y-4 lg:max-h-[70vh]">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedCourseForDetails.description}</p>
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Curriculum ({detailModules.length} Modules)</span>
                    </p>

                    {detailModules.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucun programme publié pour cette formation pour le moment.</p>
                    ) : (
                      <div className="space-y-3">
                        {detailModules.map((mod, mIdx) => {
                          const modChapters = allChapters
                            .filter(ch => ch.moduleId === mod.id)
                            .sort((a, b) => a.order - b.order);

                          return (
                            <div key={mod.id} className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-2">
                              <p className="text-xs font-black text-white truncate">
                                Module {mIdx + 1} : {mod.title}
                              </p>
                              
                              <div className="space-y-1.5">
                                {modChapters.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic pl-2">Aucun chapitre dans ce module.</p>
                                ) : (
                                  modChapters.map(ch => {
                                    const isFree = ch.isFree === true;
                                    const isSelected = previewChapter?.id === ch.id;
                                    const isAlertSelected = lockedChapterAlert === ch.title;

                                    return (
                                      <button
                                        key={ch.id}
                                        type="button"
                                        onClick={() => {
                                          if (isFree) {
                                            setPreviewChapter(ch);
                                            setLockedChapterAlert(null);
                                          } else {
                                            setLockedChapterAlert(ch.title);
                                            setPreviewChapter(null);
                                          }
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                                          isSelected
                                            ? 'bg-indigo-600/20 border-indigo-500/50 text-white font-bold'
                                            : isAlertSelected
                                            ? 'bg-rose-600/15 border-rose-500/50 text-rose-200'
                                            : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                      >
                                        <span className="truncate flex items-center gap-2">
                                          {isFree ? (
                                            <PlayCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                          ) : (
                                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                          )}
                                          <span className="truncate font-medium">{ch.title}</span>
                                        </span>

                                        <span className="shrink-0 text-[9px] font-bold">
                                          {isFree ? (
                                            <span className="text-emerald-400">✅ Gratuit</span>
                                          ) : (
                                            <span className="text-slate-400">🔒 Vérouillé</span>
                                          )}
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Active Preview Area (7 cols) */}
                <div className="lg:col-span-7 p-4 md:p-5 flex flex-col justify-start bg-slate-900/50 lg:max-h-[70vh] lg:overflow-y-auto space-y-4">
                  {lockedChapterAlert ? (
                    <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-center space-y-5 my-auto">
                      <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Contenu protégé</p>
                        <h4 className="text-white font-bold text-sm leading-snug">{lockedChapterAlert}</h4>
                        <p className="text-xs text-rose-300 font-bold">🔒 Chapitre réservé aux étudiants inscrits</p>
                        <p className="text-xs text-slate-300 max-w-md mx-auto pt-2 leading-relaxed">
                          Pour accéder à l'intégralité du programme pédagogique, à toutes les vidéos, ressources téléchargeables (PDF, ZIP) et liens externes, veuillez vous inscrire à cette formation.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setShowDetailsModal(false);
                            openCheckout(selectedCourseForDetails);
                          }}
                          className="accent-gradient hover:opacity-95 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                        >
                          S'inscrire à la formation ({(selectedCourseForDetails.promoPrice && selectedCourseForDetails.promoPrice > 0 ? selectedCourseForDetails.promoPrice : selectedCourseForDetails.price).toLocaleString('fr-FR')} XAF)
                        </button>
                      </div>
                    </div>
                  ) : previewChapter ? (
                    <div className="space-y-4">
                      {/* Video Embed Player */}
                      {previewChapter.videoUrl ? (
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
                          {previewChapter.videoSource === 'direct' ? (
                            <video
                              src={previewChapter.videoUrl}
                              controls
                              className="w-full h-full object-contain"
                            ></video>
                          ) : (
                            <iframe
                              src={getEmbedUrlLocal(previewChapter.videoUrl, previewChapter.videoSource)}
                              title={previewChapter.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 p-6 text-center">
                          <div className="space-y-1">
                            <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-300 font-bold">Aperçu sans vidéo</p>
                            <p className="text-[10px] text-slate-400">Ce chapitre gratuit contient du texte d'étude ci-dessous.</p>
                          </div>
                        </div>
                      )}

                      {/* Header info */}
                      <div className="border-b border-white/10 pb-3">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
                          Aperçu d'étude (Chapitre gratuit)
                        </span>
                        <h4 className="text-white font-bold text-sm md:text-base leading-snug">{previewChapter.title}</h4>
                      </div>

                      {/* Text content view */}
                      {previewChapter.richText ? (
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs max-h-[25vh] overflow-y-auto leading-relaxed text-slate-300 markdown-body">
                          <Markdown>{previewChapter.richText}</Markdown>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Aucune note de cours rédigée pour cet aperçu.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-5 my-auto py-8">
                      <img
                        src={selectedCourseForDetails.coverImage}
                        alt={selectedCourseForDetails.title}
                        className="w-full max-w-sm aspect-video object-cover rounded-2xl mx-auto border border-white/10 shadow-lg"
                      />
                      <div className="space-y-2">
                        <h4 className="text-white font-bold text-sm leading-snug">Bienvenue sur Dekel.Formation !</h4>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                          Sélectionnez n'importe quel chapitre gratuit (noté <span className="text-emerald-400 font-bold">✅ Gratuit</span>) à gauche pour lancer immédiatement l'aperçu du cours !
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-xs pt-1">
                        <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium text-slate-300">
                          🎯 {selectedCourseForDetails.level}
                        </span>
                        <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium text-slate-300">
                          ⏱️ {selectedCourseForDetails.duration}
                        </span>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setShowDetailsModal(false);
                            openCheckout(selectedCourseForDetails);
                          }}
                          className="accent-gradient hover:opacity-95 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg"
                        >
                          S'inscrire pour débloquer tout ({(selectedCourseForDetails.promoPrice && selectedCourseForDetails.promoPrice > 0 ? selectedCourseForDetails.promoPrice : selectedCourseForDetails.price).toLocaleString('fr-FR')} XAF)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Course FAQ Section on Detail View */}
              <div className="p-4 md:p-6 border-t border-white/10 bg-slate-900/40">
                <CourseFaqComponent 
                  course={selectedCourseForDetails} 
                  currentUser={currentUser} 
                />
              </div>

            </div>
          </div>
        );
      })()}

      {/* Category Management Modal (Admin/Trainer) */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative text-white">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400">
                <Tag className="w-5 h-5" />
                <h3 className="text-base font-black">Gestion des catégories</h3>
              </div>
              <p className="text-xs text-slate-400">
                Ajoutez ou supprimez les catégories de formations proposées sur la marketplace.
              </p>
            </div>

            {/* Add New Category Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryInput.trim() && onAddCategory) {
                  onAddCategory(newCategoryInput.trim());
                  setNewCategoryInput('');
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Ex: Intelligence Artificielle, Trading..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                disabled={!newCategoryInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catégories actuelles ({categoryList.length})</p>
              <div className="flex flex-wrap gap-2">
                {categoryList.map((cat) => (
                  <div
                    key={cat}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 group hover:border-white/20 transition-all"
                  >
                    <span>{cat}</span>
                    {onDeleteCategory && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat)}
                        title={`Supprimer la catégorie ${cat}`}
                        className="text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {courseToShare && (
        <ShareModal
          course={courseToShare}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setCourseToShare(null);
          }}
        />
      )}
    </div>
  );
}
