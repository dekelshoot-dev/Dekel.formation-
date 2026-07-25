import { useState } from 'react';
import Markdown from 'react-markdown';
import { Course, Module, Chapter, StudentProgress, User } from '../types';
import { 
  Play, CheckCircle2, ChevronRight, ChevronDown, Download, ExternalLink, 
  ArrowLeft, FileText, Globe, Sparkles, BookOpen, Menu, X, Check, Lock, Unlock,
  GraduationCap, Search
} from 'lucide-react';
import { 
  ChapterBookmarks, 
  ChapterQuizComponent, 
  ChapterExerciseComponent, 
  ChapterCommentsComponent, 
  CourseCertificateComponent 
} from './InteractiveCourseElements';

interface CoursePlayerProps {
  course: Course;
  modules: Module[];
  chapters: Chapter[];
  progress: StudentProgress | null;
  onToggleChapterComplete: (chapterId: string) => void;
  onBack: () => void;
  isEnrolled?: boolean;
  currentUser?: User | null;
}

export default function CoursePlayer({
  course,
  modules,
  chapters,
  progress,
  onToggleChapterComplete,
  onBack,
  isEnrolled = false,
  currentUser = null
}: CoursePlayerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar is hidden by default
  const [showCongrats, setShowCongrats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter active modules and chapters for the student view
  const activeModules = modules.filter(m => m.active !== false);
  const activeChapters = chapters.filter(ch => {
    const parentMod = activeModules.find(m => m.id === ch.moduleId);
    const matchesSearch = searchQuery ? ch.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return parentMod && ch.active !== false && matchesSearch;
  });

  const [activeChapterId, setActiveChapterId] = useState<string | null>(() => {
    // Default to first active chapter of first active module
    const sortedMods = [...activeModules].sort((a, b) => a.order - b.order);
    if (sortedMods.length > 0) {
      const firstModChaps = activeChapters
        .filter(ch => ch.moduleId === sortedMods[0].id)
        .sort((a, b) => a.order - b.order);
      if (firstModChaps.length > 0) {
        return firstModChaps[0].id;
      }
    }
    return activeChapters[0]?.id || null;
  });

  // Track which modules are currently expanded (dropdown / accordion style)
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>(() => {
    // Expand the active chapter's parent module by default
    const initial: Record<string, boolean> = {};
    const sortedMods = [...activeModules].sort((a, b) => a.order - b.order);
    let defaultActiveId: string | null = null;
    if (sortedMods.length > 0) {
      const firstModChaps = activeChapters
        .filter(ch => ch.moduleId === sortedMods[0].id)
        .sort((a, b) => a.order - b.order);
      if (firstModChaps.length > 0) {
        defaultActiveId = firstModChaps[0].id;
      }
    }
    const initialActiveChapterId = activeChapters[0]?.id || null;
    const resolvedActiveId = defaultActiveId || initialActiveChapterId;
    if (resolvedActiveId) {
      const activeCh = activeChapters.find(ch => ch.id === resolvedActiveId);
      if (activeCh) {
        initial[activeCh.moduleId] = true;
      }
    }
    return initial;
  });

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModuleIds(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const activeChapter = activeChapters.find(ch => ch.id === activeChapterId);
  const activeModule = activeChapter ? activeModules.find(m => m.id === activeChapter.moduleId) : null;

  // Sorted list of all chapters for sequential navigation
  const sortedModules = [...activeModules].sort((a, b) => a.order - b.order);
  const allSortedChapters: Chapter[] = [];
  sortedModules.forEach(mod => {
    const modChaps = activeChapters
      .filter(ch => ch.moduleId === mod.id)
      .sort((a, b) => a.order - b.order);
    allSortedChapters.push(...modChaps);
  });

  const activeIndex = allSortedChapters.findIndex(ch => ch.id === activeChapterId);
  const prevChapter = activeIndex > 0 ? allSortedChapters[activeIndex - 1] : null;
  const nextChapter = activeIndex < allSortedChapters.length - 1 ? allSortedChapters[activeIndex + 1] : null;

  const completedChapterIds = progress?.completedChapterIds || [];
  const completedCount = completedChapterIds.length;
  const totalChapters = activeChapters.length;
  const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  // Custom Video URL parser to embed correctly
  const getEmbedUrl = (url: string, source: 'youtube' | 'vimeo' | 'direct' | 'iframe') => {
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

  // Single button flow: marks current chapter complete and automatically redirects to the next.
  const handleMarkComplete = () => {
    if (!activeChapterId) return;
    
    // Mark as completed
    const isAlreadyCompleted = completedChapterIds.includes(activeChapterId);
    if (!isAlreadyCompleted) {
      onToggleChapterComplete(activeChapterId);
    }

    if (nextChapter) {
      setTimeout(() => {
        // Automatically expand the parent module of the next chapter
        setExpandedModuleIds(prev => ({
          ...prev,
          [nextChapter.moduleId]: true
        }));
        setActiveChapterId(nextChapter.id);
      }, 300);
    } else {
      // End of course! Show congratulations modal
      setShowCongrats(true);
    }
  };

  return (
    <div className="lg:h-[calc(100vh-140px)] lg:overflow-hidden glass flex flex-col rounded-3xl border border-white/10 shadow-2xl relative text-white">
      
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
            <p className="text-[10px] text-slate-400 font-semibold truncate font-sans">Formateur : {course.trainerName}</p>
          </div>
        </div>

        {/* Global Progression Tracker bar */}
        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 py-1.5 px-4 rounded-full max-w-xs w-60">
          <div className="flex-1 bg-white/15 h-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 accent-gradient" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="text-[10px] font-bold text-slate-300 shrink-0 font-sans">{progressPercent}% Terminé ({completedCount}/{totalChapters})</span>
        </div>

        {/* Small screen drawer trigger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 bg-white/10 hover:bg-white/15 rounded-xl text-white"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-950/75 backdrop-blur-md z-40"
          ></div>
        )}

        {/* Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
        <div className={`absolute lg:relative top-0 left-0 h-full w-80 lg:w-72 bg-[#161a20] lg:bg-transparent border-r border-white/10 flex flex-col justify-between shrink-0 z-50 lg:z-30 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-white">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-white font-sans uppercase tracking-wide">Programme</span>
              </div>
              
              {/* Close Button on Mobile Sidebar */}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-Course Chapter Search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Rechercher un chapitre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 top-2.5" />
            </div>

            <div className="space-y-3">
              {sortedModules.map(mod => {
                const modChaps = activeChapters
                  .filter(ch => ch.moduleId === mod.id)
                  .sort((a, b) => a.order - b.order);

                const isExpanded = !!expandedModuleIds[mod.id];

                return (
                  <div key={mod.id} className="space-y-1 bg-white/5 p-2 rounded-2xl border border-white/5">
                    {/* Collapsible Module Title Button */}
                    <button
                      type="button"
                      onClick={() => toggleModuleExpanded(mod.id)}
                      className="w-full flex items-center justify-between text-left py-1.5 px-2 text-[10px] font-black text-slate-300 hover:text-white uppercase tracking-wider transition-colors"
                    >
                      <span className="truncate pr-2 font-sans">{mod.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      )}
                    </button>
                    
                    {/* Expandable list of Chapters inside this Module */}
                    {isExpanded && (
                      <div className="space-y-1 pt-1 border-t border-white/5 mt-1.5 transition-all">
                        {modChaps.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic p-2 font-sans">Aucun chapitre visible.</p>
                        ) : (
                          modChaps.map(ch => {
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
                                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    ) : ch.isFree ? (
                                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </span>
                                  <span className="truncate font-sans">{ch.title}</span>
                                </div>
                                {ch.isFree && (
                                  <span className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 border border-emerald-500/25">
                                    Aperçu
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10 text-[10px] text-slate-400 flex justify-between items-center shrink-0">
            <span className="font-sans">Soutien : <strong className="text-slate-300">{course.language}</strong></span>
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
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Ce chapitre est verrouillé. Pour débloquer la formation et y accéder immédiatement, suivez les options de paiement ci-dessous ou contactez le formateur.
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4 text-left space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 font-sans">Instructions de paiement :</h4>
                      <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-white/5 border border-white/10 p-4 rounded-xl font-sans">
                        {course.paymentInstructions || "Veuillez contacter le formateur pour valider votre inscription."}
                      </div>
                    </div>

                    {course.customPaymentButtons && course.customPaymentButtons.filter(b => b.active).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">💳 Liens de Paiement (Validation Webhook automatique) :</p>
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
                                <span className="font-sans">{btn.text}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {course.contactInfo && (
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">📞 Contact Direct Formateur :</p>
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
                
                {/* Responsive Video Container */}
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
                      <p className="text-xs text-slate-300 font-medium font-sans">Ce chapitre ne contient pas de vidéo.</p>
                      <p className="text-[10px] text-slate-500 font-sans">Poursuivez la lecture ci-dessous.</p>
                    </div>
                  </div>
                )}

                {/* Title Header with single "Marquer comme terminé" button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-sans">
                      {activeModule ? activeModule.title : 'Cours'}
                    </span>
                    <h2 className="text-lg font-black text-white leading-tight mt-1">{activeChapter.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* SINGLE BUTTON labeled "Marquer comme terminé" replaces all navigation buttons */}
                    <button
                      onClick={handleMarkComplete}
                      className="py-2.5 px-5 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Marquer comme terminé</span>
                    </button>
                  </div>
                </div>

                {/* Rich text / markdown container */}
                <div className="max-w-none text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 font-sans">
                  {activeChapter.richText ? (
                    <div className="markdown-body">
                      <Markdown>{activeChapter.richText}</Markdown>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic font-sans">Aucune description textuelle disponible pour cette leçon.</p>
                  )}
                </div>

                {/* Call to action Button (CTA) */}
                {activeChapter.linkButton?.label && (
                  <div className="py-4 border-t border-b border-white/10 flex justify-center">
                    <a
                      href={activeChapter.linkButton.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 accent-gradient hover:opacity-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span className="font-sans">{activeChapter.linkButton.label}</span>
                    </a>
                  </div>
                )}

                {/* Download links & External resources */}
                {(activeChapter.downloadableFiles?.length || 0) + (activeChapter.externalLinks?.length || 0) > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {/* Download files */}
                    {(activeChapter.downloadableFiles?.length || 0) > 0 && (
                      <div className="border border-white/10 rounded-2xl p-4 bg-white/5 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-sans">
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
                              <span className="font-bold text-white truncate max-w-[180px] font-sans">{f.name}</span>
                              <span className="text-[10px] text-indigo-300 font-semibold shrink-0 flex items-center gap-1 font-sans">
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
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-sans">
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
                              className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs transition-all animate-fade-in"
                            >
                              <span className="font-bold text-white truncate font-sans">{l.title}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODULAR INTERACTIVE FEATURES (Student view: bookmarks, quizzes, assignments, certificate & Q&A) */}
                {currentUser && isEnrolled && (
                  <div className="border-t border-white/10 pt-6 space-y-6">
                    {/* Bookmarks */}
                    <ChapterBookmarks 
                      currentUser={currentUser} 
                      courseId={course.id} 
                      chapterId={activeChapter.id} 
                      chapterTitle={activeChapter.title} 
                    />

                    {/* Quiz */}
                    <ChapterQuizComponent 
                      currentUser={currentUser} 
                      chapterId={activeChapter.id} 
                    />

                    {/* Exercise Submission */}
                    <ChapterExerciseComponent 
                      currentUser={currentUser} 
                      courseId={course.id} 
                      chapterId={activeChapter.id} 
                    />

                    {/* Certificate of completion */}
                    <CourseCertificateComponent 
                      currentUser={currentUser} 
                      course={course} 
                      progressPercent={progressPercent} 
                    />

                    {/* Live Q&A and Chat Forum */}
                    <ChapterCommentsComponent 
                      currentUser={currentUser} 
                      chapterId={activeChapter.id} 
                    />
                  </div>
                )}

              </div>
            )
          ) : (
            <div className="text-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto stroke-1 text-slate-500 mb-2" />
              <p className="font-sans">Sélectionnez un chapitre dans le menu de gauche pour démarrer.</p>
            </div>
          )}
        </div>

      </div>

      {/* Floating Graduation Cap button at bottom of mobile screen */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xl z-40 border border-indigo-400/25 transition-all duration-200 active:scale-95 hover:scale-105"
          title="Ouvrir le programme de formation"
        >
          <GraduationCap className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Congratulations Modal when Course is Completed */}
      {showCongrats && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1b2028] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in text-white">
            <div className="w-20 h-20 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Félicitations ! 🎉</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Vous avez terminé le dernier chapitre de cette formation. Quel incroyable accomplissement ! Votre persévérance est la clé de votre succès.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCongrats(false);
                onBack();
              }}
              className="w-full py-3 px-5 rounded-xl text-white text-xs font-bold transition-all shadow-lg bg-indigo-600 hover:bg-indigo-700 font-sans"
            >
              Retourner à mon espace
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
