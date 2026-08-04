import { useState } from 'react';
import { Course, Module, Chapter, Enrollment, StudentProgress } from '../types';
import { BookOpen, Play, Search, Clock, Sparkles, ChevronRight, HelpCircle, Eye } from 'lucide-react';

interface StudentDashboardProps {
  currentUser: { email: string; name: string };
  allCourses: Course[];
  allModules: Module[];
  allChapters: Chapter[];
  allEnrollments: Enrollment[];
  allProgress: StudentProgress[];
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
  onOpenCoursePlayer,
  onOpenCatalog,
  onOpenPublicPage
}: StudentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter enrolled courses
  const userEmail = (currentUser?.email || '').trim().toLowerCase();
  const userName = currentUser?.name || 'Étudiant';

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
                          onClick={() => {
                            if (onOpenPublicPage) {
                              onOpenPublicPage(course);
                            } else {
                              onOpenCoursePlayer(course);
                            }
                          }}
                          className="relative aspect-video cursor-pointer overflow-hidden group/banner"
                          title="Cliquer pour voir l'aperçu de la formation"
                        >
                          <img src={course.coverImage} className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500" alt={course.title} />
                          <span className="absolute bottom-3 left-3 bg-slate-900/85 text-white font-semibold text-[9px] px-2 py-0.5 rounded uppercase">
                            {course.type}
                          </span>
                          <span className="absolute top-3 right-3 bg-indigo-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md opacity-90 group-hover/banner:opacity-100 transition-opacity">
                            <Eye className="w-3 h-3" />
                            <span>Aperçu</span>
                          </span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="flex flex-col text-left items-start w-full">
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
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-[11px] text-slate-350 leading-relaxed space-y-2">
              <p className="font-bold text-indigo-300 flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-indigo-450" />
                <span>Une question sur vos cours ?</span>
              </p>
              <p>
                Pour toute demande de déblocage de cours ou validation de reçu de paiement, contactez votre formateur référent directement par WhatsApp.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
