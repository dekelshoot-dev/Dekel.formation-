import { useState } from 'react';
import Markdown from 'react-markdown';
import { Course, Module, Chapter, StudentProgress } from '../types';
import { 
  Play, CheckCircle2, ChevronRight, ChevronDown, Download, ExternalLink, 
  ArrowLeft, FileText, Globe, Sparkles, BookOpen, Menu, X, Check, Lock, Unlock
} from 'lucide-react';

interface CoursePlayerProps {
  course: Course;
  modules: Module[];
  chapters: Chapter[];
  progress: StudentProgress | null;
  onToggleChapterComplete: (chapterId: string) => void;
  onBack: () => void;
  isEnrolled?: boolean;
}

export default function CoursePlayer({
  course,
  modules,
  chapters,
  progress,
  onToggleChapterComplete,
  onBack,
  isEnrolled = false
}: CoursePlayerProps) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(() => {
    // Default to first chapter of first module
    const sortedMods = [...modules].sort((a, b) => a.order - b.order);
    if (sortedMods.length > 0) {
      const firstModChaps = chapters
        .filter(ch => ch.moduleId === sortedMods[0].id)
        .sort((a, b) => a.order - b.order);
      if (firstModChaps.length > 0) {
        return firstModChaps[0].id;
      }
    }
    return chapters[0]?.id || null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeChapter = chapters.find(ch => ch.id === activeChapterId);
  const activeModule = activeChapter ? modules.find(m => m.id === activeChapter.moduleId) : null;

  // Sorted list of all chapters for "Previous / Next" logic
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);
  const allSortedChapters: Chapter[] = [];
  sortedModules.forEach(mod => {
    const modChaps = chapters
      .filter(ch => ch.moduleId === mod.id)
      .sort((a, b) => a.order - b.order);
    allSortedChapters.push(...modChaps);
  });

  const activeIndex = allSortedChapters.findIndex(ch => ch.id === activeChapterId);
  const prevChapter = activeIndex > 0 ? allSortedChapters[activeIndex - 1] : null;
  const nextChapter = activeIndex < allSortedChapters.length - 1 ? allSortedChapters[activeIndex + 1] : null;

  const completedChapterIds = progress?.completedChapterIds || [];
  const completedCount = completedChapterIds.length;
  const totalChapters = chapters.length;
  const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  // Custom Video URL parser to embed correctly
  const getEmbedUrl = (url: string, source: 'youtube' | 'vimeo' | 'direct' | 'iframe') => {
    if (source === 'iframe') {
      // Extract src if full iframe tag was input
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
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : url;
    }
    if (source === 'vimeo') {
      let vimeoId = '';
      const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
      if (match) vimeoId = match[1];
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : url;
    }
    return url;
  };

  // Color theme helper
  const themeColors = {
    indigo: {
      bg: 'bg-indigo-600',
      hoverBg: 'hover:bg-indigo-700',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      sidebarActive: 'bg-indigo-50 border-indigo-600 text-indigo-900',
      lightBg: 'bg-indigo-50/40',
      progress: 'bg-indigo-600'
    },
    slate: {
      bg: 'bg-slate-800',
      hoverBg: 'hover:bg-slate-900',
      text: 'text-slate-800',
      border: 'border-slate-200',
      sidebarActive: 'bg-slate-100 border-slate-700 text-slate-900',
      lightBg: 'bg-slate-50',
      progress: 'bg-slate-800'
    },
    emerald: {
      bg: 'bg-emerald-600',
      hoverBg: 'hover:bg-emerald-700',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      sidebarActive: 'bg-emerald-50 border-emerald-600 text-emerald-900',
      lightBg: 'bg-emerald-50/40',
      progress: 'bg-emerald-600'
    },
    amber: {
      bg: 'bg-amber-500',
      hoverBg: 'hover:bg-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-200',
      sidebarActive: 'bg-amber-50 border-amber-500 text-amber-900',
      lightBg: 'bg-amber-50/40',
      progress: 'bg-amber-500'
    },
    rose: {
      bg: 'bg-rose-600',
      hoverBg: 'hover:bg-rose-700',
      text: 'text-rose-600',
      border: 'border-rose-200',
      sidebarActive: 'bg-rose-50 border-rose-600 text-rose-900',
      lightBg: 'bg-rose-50/40',
      progress: 'bg-rose-600'
    },
    sky: {
      bg: 'bg-sky-600',
      hoverBg: 'hover:bg-sky-700',
      text: 'text-sky-600',
      border: 'border-sky-200',
      sidebarActive: 'bg-sky-50 border-sky-600 text-sky-900',
      lightBg: 'bg-sky-50/40',
      progress: 'bg-sky-600'
    }
  };

  const activeTheme = themeColors[course.themeColor] || themeColors.indigo;

  const handleMarkComplete = () => {
    if (!activeChapterId) return;
    onToggleChapterComplete(activeChapterId);

    // If next chapter exists, automatically transition to it
    if (nextChapter) {
      setTimeout(() => {
        setActiveChapterId(nextChapter.id);
      }, 300);
    }
  };

  return (
    <div className="min-h-[85vh] glass flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative text-white">
      
      {/* Top Navbar */}
      <div className="glass-light border-b border-white/10 py-3.5 px-6 flex items-center justify-between gap-4 z-10 shrink-0 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="truncate">
            <h1 className="text-xs font-black text-white truncate">{course.title}</h1>
            <p className="text-[10px] text-slate-400 font-semibold truncate">Formateur : {course.trainerName}</p>
          </div>
        </div>

        {/* Global Progression Tracker bar */}
        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 py-1.5 px-4 rounded-full max-w-xs w-60">
          <div className="flex-1 bg-white/15 h-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 accent-gradient" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="text-[10px] font-bold text-slate-300 shrink-0">{progressPercent}% Terminé ({completedCount}/{totalChapters})</span>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay (Requirement 3) */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-20"
          ></div>
        )}

        {/* Sidebar course outline navigation (Collapsible & Sticky) (Requirement 3) */}
        <div className={`absolute lg:relative top-0 left-0 h-full w-72 glass border-r border-white/10 flex flex-col justify-between shrink-0 z-30 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-2 text-white">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Programme du cours</span>
            </div>

            {sortedModules.map(mod => {
              const modChaps = chapters
                .filter(ch => ch.moduleId === mod.id)
                .sort((a, b) => a.order - b.order);

              return (
                <div key={mod.id} className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {mod.title}
                  </p>
                  
                  <div className="space-y-1">
                    {modChaps.map(ch => {
                      const isActive = ch.id === activeChapterId;
                      const isCompleted = completedChapterIds.includes(ch.id);
                      const isLocked = !isEnrolled && !ch.isFree;

                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            setActiveChapterId(ch.id);
                            if (window.innerWidth < 1024) setSidebarOpen(false); // Auto close mobile menu
                          }}
                          className={`w-full text-left p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                            isActive
                              ? `bg-white/15 border-white/10 text-white font-bold shadow-md`
                              : 'bg-transparent hover:bg-white/5 border-transparent text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10" />
                              ) : isLocked ? (
                                <Lock className="w-3 h-3 text-slate-400" />
                              ) : ch.isFree ? (
                                <Unlock className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Play className="w-3 h-3 text-slate-400" />
                              )}
                            </span>
                            <span className="truncate">{ch.title}</span>
                          </div>
                          {ch.isFree && (
                            <span className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 border border-emerald-500/25">
                              Aperçu
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Soutien technique : <strong className="text-slate-300">{course.language}</strong></span>
            {isEnrolled && (
              <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[8px] font-extrabold border border-indigo-500/30">INSCRIT</span>
            )}
          </div>
        </div>

        {/* Content View Pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 glass-light z-10 text-white">
          {activeChapter ? (
            !isEnrolled && !activeChapter.isFree ? (
              <div className="max-w-xl mx-auto space-y-6 py-8">
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
                  <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border border-rose-500/25">
                      Contenu réservé aux inscrits
                    </span>
                    <h2 className="text-lg font-black text-white leading-tight mt-2">{activeChapter.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ce chapitre est verrouillé. Pour débloquer la formation et y accéder immédiatement, suivez les options de paiement ci-dessous ou contactez le formateur.
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4 text-left space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Instructions de paiement :</h4>
                      <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-white/5 border border-white/10 p-4 rounded-xl">
                        {course.paymentInstructions || "Veuillez contacter le formateur pour valider votre inscription."}
                      </div>
                    </div>

                    {course.customPaymentButtons && course.customPaymentButtons.filter(b => b.active).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">💳 Liens de Paiement (Validation Webhook automatique) :</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {course.customPaymentButtons.filter(b => b.active).map(btn => {
                            const colors = {
                              blue: 'bg-blue-600 hover:bg-blue-700 text-white',
                              green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                              red: 'bg-rose-600 hover:bg-rose-700 text-white',
                              yellow: 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold',
                              purple: 'bg-purple-600 hover:bg-purple-700 text-white'
                            };
                            const colorClass = colors[btn.color as keyof typeof colors] || colors.blue;
                            return (
                              <a
                                key={btn.id}
                                href={btn.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${colorClass}`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{btn.text}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {course.contactInfo && (
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">📞 Contact Direct Formateur :</p>
                        <div className="text-xs text-slate-300 font-mono whitespace-pre-line bg-white/5 border border-white/5 p-3 rounded-xl">
                          {course.contactInfo}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Responsive Video Container (Section 9) */}
                {activeChapter.videoUrl ? (
                  <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-xl border border-white/10 relative group">
                    {activeChapter.videoSource === 'youtube' || activeChapter.videoSource === 'vimeo' || activeChapter.videoSource === 'iframe' ? (
                      <iframe
                        src={getEmbedUrl(activeChapter.videoUrl, activeChapter.videoSource)}
                        title={activeChapter.title}
                        className="w-full h-full border-0 absolute top-0 left-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video
                        src={activeChapter.videoUrl}
                        controls
                        className="w-full h-full"
                      ></video>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 rounded-3xl flex items-center justify-center border border-white/10 p-6 text-center">
                    <div className="space-y-2">
                      <BookOpen className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
                      <p className="text-xs text-slate-300 font-medium">Ce chapitre ne contient pas de vidéo.</p>
                      <p className="text-[10px] text-slate-500">Poursuivez la lecture ci-dessous.</p>
                    </div>
                  </div>
                )}

                {/* Title Header with Mark completed button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {activeModule ? activeModule.title : 'Cours'}
                    </span>
                    <h2 className="text-lg font-black text-white leading-tight mt-1">{activeChapter.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleChapterComplete(activeChapter.id)}
                      className={`py-2 px-4 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        completedChapterIds.includes(activeChapter.id)
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 font-bold'
                          : 'border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {completedChapterIds.includes(activeChapter.id) ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Terminé</span>
                        </>
                      ) : (
                        <span>Marquer Terminé</span>
                      )}
                    </button>

                    <button
                      onClick={handleMarkComplete}
                      className="py-2 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 accent-gradient hover:opacity-95"
                    >
                      <span>{nextChapter ? 'Suivant' : 'Terminer le cours'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rich text / markdown container (Section 10) */}
                <div className="max-w-none text-slate-300 text-xs md:text-sm leading-relaxed space-y-4">
                  {activeChapter.richText ? (
                    <div className="markdown-body">
                      <Markdown>{activeChapter.richText}</Markdown>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Aucune description textuelle disponible pour cette leçon.</p>
                  )}
                </div>

                {/* Call to action Button (CTA) (Section 8) */}
                {activeChapter.linkButton?.label && (
                  <div className="py-4 border-t border-b border-white/10 flex justify-center">
                    <a
                      href={activeChapter.linkButton.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 accent-gradient hover:opacity-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>{activeChapter.linkButton.label}</span>
                    </a>
                  </div>
                )}

                {/* Download links & External resources (Section 8) */}
                {(activeChapter.downloadableFiles?.length || 0) + (activeChapter.externalLinks?.length || 0) > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {/* Download files */}
                    {(activeChapter.downloadableFiles?.length || 0) > 0 && (
                      <div className="border border-white/10 rounded-2xl p-4 bg-white/5 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Ressources à télécharger</span>
                        </p>
                        <div className="space-y-1.5">
                          {activeChapter.downloadableFiles?.map(f => (
                            <a
                              key={f.id}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all"
                            >
                              <span className="font-bold text-white truncate max-w-[180px]">{f.name}</span>
                              <span className="text-[10px] text-indigo-300 font-semibold shrink-0 flex items-center gap-1">
                                {f.size || 'Télécharger'}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Complementary links */}
                    {(activeChapter.externalLinks?.length || 0) > 0 && (
                      <div className="border border-white/10 rounded-2xl p-4 bg-white/5 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Liens complémentaires</span>
                        </p>
                        <div className="space-y-1.5">
                          {activeChapter.externalLinks?.map(l => (
                            <a
                              key={l.id}
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all"
                            >
                              <span className="font-bold text-white truncate">{l.title}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )
          ) : (
            <div className="text-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto stroke-1 text-slate-500 mb-2" />
              <p>Sélectionnez un chapitre dans le menu de gauche pour démarrer.</p>
            </div>
          )}
        </div>

      </div>

      {/* Floating Button for Mobile Navigation Drawer (Requirement 3) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xl z-40 border border-indigo-400/25 transition-all duration-200 active:scale-95 hover:scale-105"
          title="Ouvrir le programme"
        >
          <BookOpen className="w-5 h-5 text-white" />
        </button>
      )}

    </div>
  );
}
