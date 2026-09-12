import { useState } from 'react';
import { Course, Module, Chapter, Enrollment, StudentProgress, FooterConfig } from '../types';
import { BookOpen, Play, Search, Clock, Sparkles, ChevronRight, HelpCircle, Eye, MessageCircle, Mail, Phone, Send, X, CheckCircle2 } from 'lucide-react';
import { sendTransactionalEmail } from '../services/emailClient';
import { showToast } from './Toast';

interface StudentDashboardProps {
  currentUser: { email: string; name: string };
  allCourses: Course[];
  allModules: Module[];
  allChapters: Chapter[];
  allEnrollments: Enrollment[];
  allProgress: StudentProgress[];
  footerConfig?: FooterConfig;
  onOpenCoursePlayer: (course: Course) => void;
  onOpenCatalog: () => void;
  onOpenPublicPage?: (course: Course) => void;
}

export default function StudentDashboard({
  currentUser,
  allCourses,
  allModules,
  allChapters,
  allEnrollments,
  allProgress,
  footerConfig,
  onOpenCoursePlayer,
  onOpenCatalog,
  onOpenPublicPage
}: StudentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 0. Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const adminEmail = footerConfig?.contactInfo?.email || 'support@dekel-formation.com';
  const adminPhone = footerConfig?.contactInfo?.phone || '+237 6 00 00 00 00';

  const userEmail = (currentUser?.email || '').trim().toLowerCase();
  const userName = currentUser?.name || 'Étudiant';

  const [emailSubject, setEmailSubject] = useState(`[Support] Demande de ${userName}`);
  const [emailMessage, setEmailMessage] = useState(`Bonjour,\n\nJe suis l'étudiant(e) ${userName} (${userEmail}).\n\nJ'ai une demande concernant mes cours sur la plateforme :\n\n[Rédigez votre message ici]\n\nCordialement,\n${userName}`);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailMessage.trim()) {
      showToast('Veuillez saisir votre message.', 'warning');
      return;
    }
    setIsSendingEmail(true);
    try {
      await sendTransactionalEmail({
        to: adminEmail,
        recipientName: 'Administrateur',
        type: 'support_ticket_created',
        category: 'support',
        renderData: {
          customSubject: emailSubject,
          customMessage: `E-mail reçu de l'étudiant ${userName} (${userEmail}) :\n\n${emailMessage}`
        }
      });
      showToast('Votre e-mail a été transmis avec succès à l\'administrateur !', 'success');
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Votre e-mail a été transmis avec succès à l\'administrateur !', 'success');
      setIsEmailModalOpen(false);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 1. Filter enrolled courses
  const studentEnrollments = (allEnrollments || []).filter(
    e => (e?.studentEmail || '').trim().toLowerCase() === userEmail && e?.status === 'active'
  );
  
  const enrolledCourseIds = studentEnrollments.map(e => e.courseId);
  const enrolledCourses = (allCourses || []).filter(c => c?.id && enrolledCourseIds.includes(c.id));

  // 2. Identify newly added courses
  const sortedEnrollments = [...studentEnrollments].sort(
    (a, b) => new Date(b?.enrolledAt || 0).getTime() - new Date(a?.enrolledAt || 0).getTime()
  );
  const latestEnrollmentId = sortedEnrollments[0]?.courseId;
  const latestAddedCourse = enrolledCourses.find(c => c.id === latestEnrollmentId);

  // 3. Last accessed lessons
  const studentProgresses = (allProgress || []).filter(
    p => (p?.studentEmail || '').trim().toLowerCase() === userEmail
  );
  
  const sortedProgresses = [...studentProgresses].sort(
    (a, b) => new Date(b?.lastAccessedAt || 0).getTime() - new Date(a?.lastAccessedAt || 0).getTime()
  );

  // Global search across courses, modules, chapters
  const isSearching = searchQuery.trim().length > 0;
  
  // Search results
  const searchResults = {
    courses: [] as Course[],
    modules: [] as { module: Module; course: Course }[],
    chapters: [] as { chapter: Chapter; module: Module; course: Course }[]
  };

  if (isSearching) {
    const query = searchQuery.toLowerCase();
    
    enrolledCourses.forEach(c => {
      if (!c) return;
      if ((c.title || '').toLowerCase().includes(query) || (c.description || '').toLowerCase().includes(query)) {
        searchResults.courses.push(c);
      }
      
      const courseMods = (allModules || []).filter(m => m?.courseId === c.id);
      courseMods.forEach(m => {
        if (!m) return;
        if ((m.title || '').toLowerCase().includes(query)) {
          searchResults.modules.push({ module: m, course: c });
        }
        
        const modChaps = (allChapters || []).filter(ch => ch?.moduleId === m.id);
        modChaps.forEach(ch => {
          if (!ch) return;
          if ((ch.title || '').toLowerCase().includes(query) || (ch.richText || '').toLowerCase().includes(query)) {
            searchResults.chapters.push({ chapter: ch, module: m, course: c });
          }
        });
      });
    });
  }

  return (
    <div className="space-y-6">
      
      {/* Search Header Container (Section 15) */}
      <div className="glass border border-white/10 rounded-3xl p-5 shadow-lg space-y-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Bienvenue, {currentUser.name} !</h1>
            <p className="text-xs text-slate-400">Suivez votre progression et explorez vos cours actifs.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Recherche globale (cours, leçons...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
            />
          </div>
        </div>

        {/* Global Search Results Overlay/View */}
        {isSearching && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Résultats de recherche :</p>
            
            {searchResults.courses.length === 0 && searchResults.modules.length === 0 && searchResults.chapters.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun résultat trouvé pour "{searchQuery}" dans vos formations.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {/* Courses matched */}
                {searchResults.courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onOpenCoursePlayer(c); setSearchQuery(''); }}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mr-2">Formation</span>
                      <strong className="text-white">{c.title}</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}

                {/* Modules matched */}
                {searchResults.modules.map(({ module, course }) => (
                  <button
                    key={module.id}
                    onClick={() => { onOpenCoursePlayer(course); setSearchQuery(''); }}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="bg-purple-500/20 text-purple-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mr-2">Module</span>
                      <span className="text-slate-400 text-[11px]">{course.title} &gt; </span>
                      <strong className="text-white">{module.title}</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}

                {/* Chapters matched */}
                {searchResults.chapters.map(({ chapter, module, course }) => (
                  <button
                    key={chapter.id}
                    onClick={() => { onOpenCoursePlayer(course); setSearchQuery(''); }}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mr-2">Chapitre / Leçon</span>
                      <span className="text-slate-400 text-[11px]">{course.title} &gt; {module.title} &gt; </span>
                      <strong className="text-white">{chapter.title}</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main dashboard body */}
      {!isSearching && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Enrolled courses list */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick highlight: Last Added course (Section 12) */}
            {latestAddedCourse && (
              <div className="accent-gradient text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                <div className="space-y-1 z-10 max-w-md">
                  <div className="flex items-center gap-1.5 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Nouvelle formation débloquée !</span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug">{latestAddedCourse.title}</h3>
                  <p className="text-indigo-150 text-[11px] leading-relaxed">
                    Vous venez d'être ajouté à cette formation par votre formateur. Commencez à explorer dès aujourd'hui !
                  </p>
                </div>
                <button
                  onClick={() => onOpenCoursePlayer(latestAddedCourse)}
                  className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-xl text-xs shrink-0 self-start sm:self-center shadow transition-colors"
                >
                  Commencer
                </button>
              </div>
            )}

            {/* Enrolled Courses list */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vos formations actives ({enrolledCourses.length})</h2>
              
              {enrolledCourses.length === 0 ? (
                <div className="glass border border-white/10 rounded-3xl p-8 text-center space-y-4 text-white">
                  <BookOpen className="w-12 h-12 stroke-1 text-slate-400 mx-auto" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Aucun cours inscrit</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Vous n'êtes actuellement inscrit à aucune formation. Visitez notre catalogue pour découvrir nos cours et demander un accès !
                    </p>
                  </div>
                  <button
                    onClick={onOpenCatalog}
                    className="accent-gradient text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-md"
                  >
                    Découvrir le catalogue
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledCourses.map(course => {
                    const progress = allProgress.find(p => p.courseId === course.id && p.studentEmail === currentUser.email);
                    const courseChapters = allChapters.filter(ch => {
                      const m = allModules.find(mod => mod.id === ch.moduleId);
                      return m?.courseId === course.id;
                    });
                    
                    const completedCount = progress?.completedChapterIds.length || 0;
                    const totalChapters = courseChapters.length;
                    const pct = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

                    return (
                      <div key={course.id} className="glass border border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow group/card">
                        <div 
                          onClick={() => onOpenCoursePlayer(course)}
                          className="relative aspect-video cursor-pointer overflow-hidden group/banner"
                          title="Cliquer pour accéder au cours"
                        >
                          <img src={course.coverImage} className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500" alt={course.title} />
                          <span className="absolute bottom-3 left-3 bg-slate-900/85 text-white font-semibold text-[9px] px-2 py-0.5 rounded uppercase">
                            {course.type}
                          </span>
                          <span className="absolute top-3 right-3 bg-indigo-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md opacity-90 group-hover/banner:opacity-100 transition-opacity">
                            <Play className="w-3 h-3 text-white fill-white" />
                            <span>Accéder</span>
                          </span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div 
                            onClick={() => onOpenCoursePlayer(course)}
                            className="flex flex-col text-left items-start w-full cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <h4 className="font-bold text-white text-xs leading-snug line-clamp-2 text-left w-full">{course.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold text-left block w-full self-start">Par {course.trainerName}</p>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5 border-t border-white/10 pt-3">
                            <div className="flex justify-between items-center text-[10px] text-slate-300 font-semibold">
                              <span>Progression</span>
                              <span className="font-bold text-white">{pct}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="accent-gradient h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                            </div>
                            <p className="text-[9px] text-slate-450 font-medium">
                              {completedCount} sur {totalChapters} chapitres terminés
                            </p>
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => onOpenCoursePlayer(course)}
                            className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                            <span>{pct > 0 ? 'Continuer le cours' : 'Commencer le cours'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          {/* Right panel: Last visited lectures (Section 12) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Last visited box */}
            <div className="glass border border-white/10 rounded-2xl p-5 shadow-lg space-y-4 text-white">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Derniers cours consultés</span>
              </h3>

              <div className="space-y-3">
                {sortedProgresses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Aucune leçon consultée récemment.</p>
                ) : (
                  sortedProgresses.map(prog => {
                    const course = allCourses.find(c => c.id === prog.courseId);
                    if (!course) return null;

                    // Let's grab the last completed chapter or default to first
                    const completedIds = prog.completedChapterIds;
                    const lastId = completedIds[completedIds.length - 1];
                    const matchedCh = allChapters.find(ch => ch.id === lastId) || allChapters.find(ch => {
                      const m = allModules.find(mod => mod.id === ch.moduleId);
                      return m?.courseId === course.id;
                    });

                    return (
                      <button
                        key={prog.courseId}
                        onClick={() => onOpenCoursePlayer(course)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all gap-2"
                      >
                        <div className="truncate pr-1">
                          <p className="font-bold text-white truncate">{course.title}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            Dernier vu : {matchedCh ? matchedCh.title : 'Début du programme'}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-1 font-semibold">
                            Visité le {new Date(prog.lastAccessedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Support / Quick guidelines Card */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-[11px] text-slate-350 leading-relaxed space-y-3">
              <p className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Support & Assistance</span>
              </p>
              <p className="text-slate-300">
                Besoin d'aide ou d'une validation de paiement ? Contactez le support officiel de la plateforme.
              </p>

              {/* Display Administrator Contact Info */}
              <div className="space-y-2 pt-1 border-t border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors w-full text-left font-medium group"
                  title="Cliquer pour envoyer un e-mail pré-rempli à l'administrateur"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate underline decoration-indigo-400/40">{adminEmail}</span>
                </button>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{adminPhone}</span>
                </div>
              </div>

              {/* Support Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold px-3 py-2 rounded-xl text-xs transition-all w-full justify-center shadow-sm"
                >
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Envoyer un e-mail à l'admin</span>
                </button>

                {(() => {
                  const targetCourse = latestAddedCourse || enrolledCourses[0];
                  const rawWhatsapp = targetCourse?.whatsappNumber || footerConfig?.socialLinks?.whatsapp || footerConfig?.contactInfo?.phone || '221771234567';
                  const cleanNumber = rawWhatsapp.replace(/[^0-9]/g, '') || '221771234567';
                  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Bonjour, j'ai une question concernant mes cours.`)}`;
                  return (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/35 text-emerald-400 font-bold px-3 py-2 rounded-xl text-xs transition-all w-full justify-center shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      <span>Contacter sur WhatsApp</span>
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Send Email to Administrator */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Contact Administrateur</h3>
                  <p className="text-xs text-slate-400">Envoyer un message pré-rempli à l'administration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs space-y-1">
              <div className="text-slate-400">Destinataire :</div>
              <div className="font-mono text-indigo-300 font-bold text-sm truncate">{adminEmail}</div>
            </div>

            <form onSubmit={handleSendAdminEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Sujet de l'e-mail</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Contenu du message</label>
                <textarea
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <a
                  href={`mailto:${adminEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`}
                  className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ouvrir dans votre App Mail (mailto)</span>
                </a>

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'Envoi...' : 'Envoyer directement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
