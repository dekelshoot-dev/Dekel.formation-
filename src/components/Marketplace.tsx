import { useState } from 'react';
import Markdown from 'react-markdown';
import { Course, Module, Chapter, Enrollment, User, SimulatedEmail } from '../types';
import { BookOpen, User as UserIcon, Coins, MessageSquare, ShieldCheck, CheckCircle, ArrowRight, Smartphone, AlertCircle, Lock, Unlock, PlayCircle, Eye, X, ArrowLeft } from 'lucide-react';

interface MarketplaceProps {
  allCourses: Course[];
  allModules: Module[];
  allChapters: Chapter[];
  allEnrollments: Enrollment[];
  currentUser: User | null;
  onEnrollStudent: (email: string, courseId: string) => void;
  onSendEmail: (email: SimulatedEmail) => void;
  onSwitchToLogin: () => void;
}

export default function Marketplace({
  allCourses,
  allModules,
  allChapters,
  allEnrollments,
  currentUser,
  onEnrollStudent,
  onSendEmail,
  onSwitchToLogin
}: MarketplaceProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Detailed view program modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [lockedChapterAlert, setLockedChapterAlert] = useState<string | null>(null);

  // Filter only published courses
  const publishedCourses = allCourses.filter(c => c.status === 'published');

  const openCheckout = (course: Course) => {
    setSelectedCourse(course);
    setShowCheckoutModal(true);
    setPaymentDone(false);
  };

  const handleSimulatePaymentProof = () => {
    if (!currentUser) {
      alert('Veuillez d\'abord vous connecter ou créer un compte étudiant.');
      onSwitchToLogin();
      setShowCheckoutModal(false);
      return;
    }

    if (!selectedCourse) return;

    setSimulatingPayment(true);
    
    setTimeout(() => {
      // 1. Enroll the student
      onEnrollStudent(currentUser.email, selectedCourse.id);

      // 2. Send simulation email (Section 16)
      const confirmationEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: currentUser.email,
        subject: `Accès validé ! Bienvenue sur ${selectedCourse.title}`,
        body: `Bonjour ${currentUser.name},

Nous avons bien reçu votre preuve de paiement WhatsApp pour la formation "${selectedCourse.title}".
Votre accès vient d'être activé par le formateur ${selectedCourse.trainerName} !

Vous pouvez dès à présent retourner sur votre tableau de bord étudiant pour suivre la formation.

Bon apprentissage !`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(confirmationEmail);

      setSimulatingPayment(false);
      setPaymentDone(true);
    }, 1500);
  };

  // Pre-fill WhatsApp message
  const getWhatsAppMessage = (course: Course) => {
    const text = `Bonjour, je viens d'effectuer le paiement de ${course.price.toLocaleString('fr-FR')} XAF pour la formation "${course.title}". Voici ma preuve de paiement pour activer mon compte (${currentUser?.email || 'mon-email@exemple.com'}). Merci !`;
    return `https://wa.me/33600000000?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="glass border-white/10 text-white rounded-3xl p-8 relative overflow-hidden">
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

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedCourses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center col-span-full py-12">Aucune formation n'est publiée dans le catalogue pour le moment.</p>
        ) : (
          publishedCourses.map(course => {
            const courseModules = allModules.filter(m => m.courseId === course.id);
            const courseChapters = allChapters.filter(ch => {
              const mod = courseModules.find(m => m.id === ch.moduleId);
              return !!mod;
            });

            const isAlreadyEnrolled = currentUser 
              ? allEnrollments.some(e => e.studentEmail.toLowerCase() === currentUser.email.toLowerCase() && e.courseId === course.id && e.status === 'active')
              : false;

            return (
              <div key={course.id} className="glass border border-white/10 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group">
                {/* Course Cover */}
                <div 
                  onClick={() => {
                    setSelectedCourseForDetails(course);
                    setShowDetailsModal(true);
                    setPreviewChapter(null);
                    setLockedChapterAlert(null);
                  }}
                  className="relative aspect-video overflow-hidden cursor-pointer"
                >
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 right-3 glass-light backdrop-blur shadow text-white font-black px-3 py-1 rounded-full text-xs">
                    {course.price.toLocaleString('fr-FR')} XAF
                  </span>
                  <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white font-semibold px-2 py-0.5 rounded text-[10px] uppercase">
                    {course.type}
                  </span>
                </div>

                {/* Course Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <span>{course.level}</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                    </div>
                    <h3 
                      onClick={() => {
                        setSelectedCourseForDetails(course);
                        setShowDetailsModal(true);
                        setPreviewChapter(null);
                        setLockedChapterAlert(null);
                      }}
                      className="font-bold text-white text-sm leading-snug group-hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      {course.title}
                    </h3>
                    <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Modules preview program outline */}
                  <div className="border-t border-white/10 pt-3.5 space-y-2">
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

                  {/* Instructor row */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={course.trainerPhoto}
                        className="w-6 h-6 rounded-full object-cover border border-white/10"
                        alt={course.trainerName}
                      />
                      <span className="text-[10px] text-slate-400 font-semibold">{course.trainerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCourseForDetails(course);
                          setShowDetailsModal(true);
                          setPreviewChapter(null);
                          setLockedChapterAlert(null);
                        }}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-[9px] px-2.5 py-1.5 rounded-xl transition-all"
                      >
                        Programme
                      </button>

                      {isAlreadyEnrolled ? (
                        <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[9px] px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                          Inscrit
                        </span>
                      ) : (
                        <button
                          onClick={() => openCheckout(course)}
                          className="accent-gradient hover:opacity-90 text-white font-bold text-[9px] px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-500/20"
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
          <div className="glass rounded-3xl border border-white/15 p-6 w-full max-w-lg shadow-2xl space-y-5 text-slate-200">
            
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
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

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                Dans cette version, aucun paiement par carte n'est requis. L'accès est validé manuellement par le formateur après réception de votre preuve de paiement.
              </div>
            </div>

            {/* Instruction Steps (Requirement 6) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Instructions de paiement (Moyens acceptés) :</h4>
              
              {selectedCourse.paymentInstructions ? (
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedCourse.paymentInstructions}
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Mobile Money (Orange / MTN / Wave)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Envoyez le montant de <span className="font-bold text-white">{selectedCourse.price.toLocaleString('fr-FR')} XAF</span> au numéro suivant :</p>
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

              {/* Contact info */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informations de contact :</p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {selectedCourse.contactInfo || "WhatsApp: +225 07 00 00 00 00\nE-mail: support@formateur.com"}
                </div>
              </div>

              {/* Custom payment buttons (Requirement 6) */}
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

              {/* Steps checklist */}
              <div className="border-t border-white/10 pt-3 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Étapes de validation :</p>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Effectuez la transaction du montant exact (<span className="font-bold text-white">{selectedCourse.price.toLocaleString('fr-FR')} XAF</span>) via l'un des boutons ou moyens ci-dessus.</li>
                  <li>Prenez une capture d'écran du reçu de paiement.</li>
                  <li>Cliquez sur le bouton ci-dessous pour envoyer la preuve via WhatsApp au formateur pour validation.</li>
                </ol>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
              {paymentDone ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-2xl text-center text-xs space-y-1.5 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                  <p className="font-bold text-emerald-200">Accès accordé avec succès !</p>
                  <p className="text-[11px] text-emerald-400">Le cours est maintenant débloqué dans votre tableau de bord étudiant.</p>
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-3 rounded-lg text-[10px]"
                  >
                    Aller au tableau de bord
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

                  {/* Simulator action for quick eval */}
                  <button
                    type="button"
                    onClick={handleSimulatePaymentProof}
                    disabled={simulatingPayment}
                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    {simulatingPayment ? (
                      <span>Vérification de la capture d'écran en cours...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Simuler la validation instantanée (Démo)</span>
                      </>
                    )}
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
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
                
                {/* Left Panel: Curriculum Modules and Chapters (7 cols) */}
                <div className="lg:col-span-5 p-4 md:p-5 overflow-y-auto border-r border-white/10 space-y-4 max-h-[40vh] lg:max-h-[70vh]">
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
                <div className="lg:col-span-7 p-4 md:p-5 flex flex-col justify-start bg-slate-900/50 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto space-y-4">
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
                          S'inscrire à la formation ({selectedCourseForDetails.price.toLocaleString('fr-FR')} XAF)
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
                          S'inscrire pour débloquer tout ({selectedCourseForDetails.price.toLocaleString('fr-FR')} XAF)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
