import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Course, Module, Chapter, CustomPaymentButton, User } from '../types';
import ShareModal from './ShareModal';
import Breadcrumbs from './Breadcrumbs';
import { showToast } from './Toast';
import { 
  BookOpen, Clock, Award, CheckCircle, ShieldCheck, PlayCircle, Lock, 
  Share2, ArrowLeft, ArrowRight, MessageSquare, Smartphone, Coins, 
  AlertCircle, ChevronDown, ChevronUp, User as UserIcon, Sparkles, Target, 
  GraduationCap, HelpCircle, ExternalLink, LogIn, Check, CreditCard
} from 'lucide-react';

interface PublicCoursePageProps {
  course: Course;
  allModules: Module[];
  allChapters: Chapter[];
  currentUser: User | null;
  onNavigateToCatalog: () => void;
  onNavigateToLogin: () => void;
  onOpenCheckout?: (course: Course) => void;
  isEnrolled?: boolean;
}

export default function PublicCoursePage({
  course,
  allModules,
  allChapters,
  currentUser,
  onNavigateToCatalog,
  onNavigateToLogin,
  onOpenCheckout,
  isEnrolled = false
}: PublicCoursePageProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [activePreviewChapter, setActivePreviewChapter] = useState<Chapter | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  // Filter modules and chapters belonging to this course
  const courseModules = allModules
    .filter(m => m.courseId === course.id)
    .sort((a, b) => a.order - b.order);

  const courseChapters = allChapters.filter(ch => {
    return courseModules.some(m => m.id === ch.moduleId) || ch.courseId === course.id;
  });

  const freeChapters = courseChapters.filter(ch => ch.isFree === true);
  const lockedChapters = courseChapters.filter(ch => ch.isFree !== true);

  // Expand all modules by default
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    courseModules.forEach(m => {
      initialExpanded[m.id] = true;
    });
    setExpandedModules(initialExpanded);
  }, [courseModules.length]);

  // Update document title, canonical link, robots, and dynamic SEO meta tags on mount
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${course.seoTitle || course.title} | Formation Dekel`;

    // 1. Inject/Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const previousDesc = metaDesc.getAttribute('content');
    metaDesc.setAttribute('content', course.seoDescription || course.description);

    // 2. Inject/Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const cleanSlug = course.seoSlug || course.id;
    const currentCanonicalUrl = `${window.location.origin}/formation/${cleanSlug}`;
    canonical.setAttribute('href', currentCanonicalUrl);

    // 3. Inject/Update Robots Meta
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'index, follow');

    // 4. Inject/Update OpenGraph & Twitter Meta Tags
    const ogTags = [
      { property: 'og:title', content: course.seoTitle || course.title },
      { property: 'og:description', content: course.seoDescription || course.description },
      { property: 'og:image', content: course.seoShareImage || course.coverImage || '' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: currentCanonicalUrl },
      { property: 'og:site_name', content: 'Dekel.Formation' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: course.seoTitle || course.title },
      { property: 'twitter:description', content: course.seoDescription || course.description },
      { property: 'twitter:image', content: course.seoShareImage || course.coverImage || '' }
    ];

    const createdTags: HTMLMetaElement[] = [];
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`) as HTMLMetaElement;
      if (!el && tag.property.startsWith('twitter:')) {
        el = document.querySelector(`meta[name="${tag.property}"]`) as HTMLMetaElement;
      }
      if (!el) {
        el = document.createElement('meta');
        if (tag.property.startsWith('twitter:')) {
          el.setAttribute('name', tag.property);
        } else {
          el.setAttribute('property', tag.property);
        }
        document.head.appendChild(el);
        createdTags.push(el);
      }
      el.setAttribute('content', tag.content);
    });

    return () => {
      document.title = originalTitle;
      if (previousDesc) {
        metaDesc?.setAttribute('content', previousDesc);
      }
      createdTags.forEach(t => t.remove());
    };
  }, [course]);

  // JSON-LD Schema.org Data
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': course.seoTitle || course.title,
    'description': course.seoDescription || course.description,
    'provider': {
      '@type': 'EducationalOrganization',
      'name': 'Dekel.Formation',
      'sameAs': window.location.origin,
      'logo': 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=100'
    },
    'author': {
      '@type': 'Person',
      'name': course.trainerName,
      'image': course.trainerPhoto || undefined
    },
    'hasCourseInstance': {
      '@type': 'CourseInstance',
      'courseMode': 'online',
      'courseWorkload': course.estimatedDuration || course.duration
    },
    'offers': {
      '@type': 'Offer',
      'category': 'Paid',
      'price': course.promoPrice && course.promoPrice > 0 ? course.promoPrice : course.price,
      'priceCurrency': 'XAF',
      'availability': 'https://schema.org/InStock',
      'url': window.location.href
    }
  };

  const faqSchema = course.faqs && course.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': course.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  } : null;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getEmbedUrl = (url: string, source: 'youtube' | 'vimeo' | 'direct' | 'iframe') => {
    if (!url) return '';
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

  // WhatsApp Pre-filled message generator
  const getWhatsAppMessage = () => {
    const activePrice = course.promoPrice && course.promoPrice > 0 ? course.promoPrice : course.price;
    const text = `Bonjour, je suis intéressé(e) par la formation "${course.title}" (${activePrice.toLocaleString('fr-FR')} XAF). Pouvez-vous me donner plus d'informations ? Merci !`;
    const cleanNumber = course.whatsappNumber ? course.whatsappNumber.replace(/[^0-9]/g, '') : '221771234567';
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  // Structured Prerequisites fallback generator
  const prerequisitesList = course.prerequisites && course.prerequisites.length > 0 
    ? course.prerequisites 
    : [
        `Niveau requis : ${course.level || 'Accessible à tous'}`,
        `Un ordinateur ou smartphone avec connexion Internet`,
        `Motivation et envie d'apprendre`
      ];

  // Structured Objectives fallback generator
  const objectivesList = course.objectives && course.objectives.length > 0
    ? course.objectives
    : [
        `Maîtriser tous les concepts clés de ${course.title}`,
        `Mettre en pratique les connaissances à travers des exercices concrets`,
        `Obtenir une autonomie professionnelle dans le domaine`,
        `Valider vos compétences grâce au suivi pédagogique`
      ];

  // Structured Skills Acquired fallback generator
  const skillsList = course.skillsAcquired && course.skillsAcquired.length > 0
    ? course.skillsAcquired
    : [
        `Expertise pratique en ${course.type || 'compétences spécialisées'}`,
        `Autonomie complète sur les cas d'usage réels`,
        `Capacité à appliquer les meilleures méthodes de travail`,
        `Certification valorisable dans votre parcours`
      ];

  const activePrice = course.promoPrice && course.promoPrice > 0 ? course.promoPrice : course.price;
  const hasDiscount = course.promoPrice && course.promoPrice > 0 && course.promoPrice < course.price;
  const activeCustomButtons = (course.customPaymentButtons || []).filter(b => b.active);

  return (
    <div className="min-h-screen bg-[#161a20] text-slate-100 font-sans pb-16">
      {/* Inject Schema.org JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#161a20]/85 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="flex items-center gap-2 text-xs font-bold text-[#94a3b8] hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#94a3b8]" />
            <span className="text-[#94a3b8]">Catalogue</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Partager</span>
            </button>

            {currentUser ? (
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow cursor-pointer"
              >
                Mon Espace
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-bold px-3.5 py-2 rounded-xl text-xs border border-white/15 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connexion</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 pt-4 space-y-6 bg-[#161a20]">
        
        {/* Breadcrumbs Navigation (Requirement SEO Fil d'Ariane) */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', onClick: onNavigateToCatalog },
            { label: 'Marketplace', onClick: onNavigateToCatalog },
            { label: course.type || 'Formations', onClick: onNavigateToCatalog },
            { label: course.title }
          ]}
          className="text-slate-400"
        />

        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Hero Details (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 font-extrabold px-3 py-1 rounded-full text-xs border border-indigo-500/30 uppercase tracking-wider">
                {course.type || 'Formation en ligne'}
              </span>
              <span className="bg-white/10 text-[#cbd5e1] font-bold px-3 py-1 rounded-full text-xs border border-white/10">
                {course.level || 'Tous niveaux'}
              </span>
              {course.duration && (
                <span className="bg-white/10 text-[#cbd5e1] font-bold px-3 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  {course.estimatedDuration || course.duration}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-[#ffffff] text-sm md:text-base leading-relaxed">
              {course.description}
            </p>

            {/* Formateur Card */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl max-w-md">
              <img
                src={course.trainerPhoto || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'}
                alt={course.trainerName}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40 shrink-0"
              />
              <div>
                <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Formateur & Instructeur</p>
                <h3 className="text-sm font-bold text-white">{course.trainerName}</h3>
                <p className="text-xs text-slate-400">Expert référent Dekel Formation</p>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="glass p-3 rounded-2xl border border-white/10 text-center space-y-1">
                <BookOpen className="w-5 h-5 text-indigo-400 mx-auto" />
                <p className="text-lg font-black text-white">{courseModules.length}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Modules</p>
              </div>

              <div className="glass p-3 rounded-2xl border border-white/10 text-center space-y-1">
                <PlayCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                <p className="text-lg font-black text-white">{courseChapters.length}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Chapitres</p>
              </div>

              <div className="glass p-3 rounded-2xl border border-white/10 text-center space-y-1">
                <Clock className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="text-xs font-black text-white truncate mt-1">{course.estimatedDuration || course.duration}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Durée estimée</p>
              </div>

              <div className="glass p-3 rounded-2xl border border-white/10 text-center space-y-1">
                <Award className="w-5 h-5 text-purple-400 mx-auto" />
                <p className="text-xs font-black text-emerald-400 mt-1">Inclus</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Certificat</p>
              </div>
            </div>
          </div>

          {/* Right Hero Cover Card & Enrollment Widget (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="glass border border-white/15 rounded-3xl overflow-hidden shadow-2xl space-y-5 p-5">
              
              {/* Cover Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={course.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {freeChapters.length > 0 && (
                  <span className="absolute bottom-3 left-3 bg-emerald-600/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-400/40 flex items-center gap-1 shadow">
                    <PlayCircle className="w-3.5 h-3.5" />
                    {freeChapters.length} chapitre{freeChapters.length > 1 ? 's' : ''} gratuit{freeChapters.length > 1 ? 's' : ''} disponible{freeChapters.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Price Tag */}
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tarif de la formation</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {activePrice.toLocaleString('fr-FR')} XAF
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        {course.price.toLocaleString('fr-FR')} XAF
                      </span>
                    )}
                  </div>
                </div>

                {hasDiscount && (
                  <span className="bg-rose-500/20 text-rose-300 font-extrabold text-xs px-2.5 py-1 rounded-full border border-rose-500/30 animate-pulse">
                    Promo spéciale
                  </span>
                )}
              </div>

              {/* Primary Call To Actions */}
              <div className="space-y-3">
                {isEnrolled ? (
                  <button
                    type="button"
                    onClick={onNavigateToCatalog}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs text-center flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Déjà inscrit — Accéder au cours</span>
                  </button>
                ) : activeCustomButtons.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#ffffff] uppercase tracking-wider mb-1">
                      Moyens de paiement du formateur :
                    </p>
                    {activeCustomButtons.map((btn) => {
                      let colorClasses = 'bg-blue-600 hover:bg-blue-500 text-[#ffffff] border-blue-400/30 shadow-blue-500/20';
                      if (btn.color === 'green') {
                        colorClasses = 'bg-emerald-600 hover:bg-emerald-500 text-[#ffffff] border-emerald-400/30 shadow-emerald-500/20';
                      } else if (btn.color === 'red') {
                        colorClasses = 'bg-rose-600 hover:bg-rose-500 text-[#ffffff] border-rose-400/30 shadow-rose-500/20';
                      } else if (btn.color === 'yellow') {
                        colorClasses = 'bg-amber-500 hover:bg-amber-400 text-[#ffffff] font-black border-amber-300/40 shadow-amber-500/20';
                      } else if (btn.color === 'purple') {
                        colorClasses = 'bg-purple-600 hover:bg-purple-500 text-[#ffffff] border-purple-400/30 shadow-purple-500/20';
                      }

                      return (
                        <a
                          key={btn.id}
                          href={btn.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`w-full font-black py-3 px-4 rounded-2xl text-xs text-center flex items-center justify-center gap-2 border shadow-lg transition-all cursor-pointer text-[#ffffff] ${colorClasses}`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span className="truncate">{btn.text}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCheckout) {
                        onOpenCheckout(course);
                      } else {
                        setShowPaymentSection(true);
                      }
                    }}
                    className="w-full accent-gradient hover:opacity-95 text-white font-black py-3.5 px-4 rounded-2xl text-sm text-center flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>S'inscrire à cette formation</span>
                  </button>
                )}

                <a
                  href={getWhatsAppMessage()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold py-3 px-4 rounded-2xl text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Poser une question sur WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full bg-white/5 hover:bg-white/10 text-[#94a3b8] font-bold py-2.5 px-4 rounded-2xl text-xs text-center flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-[#94a3b8]">Partager cette page</span>
                </button>
              </div>

              {/* Guarantees Badges */}
              <div className="border-t border-white/10 pt-3 text-[11px] text-slate-400 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Accès illimité à vie aux contenus</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Supports pédagogiques et exercices inclus</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Certificat de réussite délivré à la fin</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* SECTION: PROGRAMME DÉTAILLÉ DE LA FORMATION (CURRICULUM) */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase border border-indigo-500/30">
                Curriculum
              </span>
              <h2 className="text-xl font-black text-white mt-1">Programme détaillé de la formation</h2>
            </div>
            <span className="text-xs text-slate-400">
              {courseModules.length} Modules • {courseChapters.length} Chapitres
            </span>
          </div>

          {/* Interactive Free Preview Video Player (if active) */}
          {activePreviewChapter && (
            <div className="glass border border-emerald-500/40 rounded-3xl p-5 space-y-4 bg-emerald-950/20 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/30 uppercase">
                    Aperçu Gratuit
                  </span>
                  <h3 className="font-bold text-white text-sm">{activePreviewChapter.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePreviewChapter(null)}
                  className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Fermer la vidéo
                </button>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                {activePreviewChapter.videoUrl ? (
                  <iframe
                    src={getEmbedUrl(activePreviewChapter.videoUrl, activePreviewChapter.videoSource)}
                    title={activePreviewChapter.title}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs p-6 text-center">
                    Aperçu textuel du chapitre gratuit. S'inscrire pour la vidéo intégrale.
                  </div>
                )}
              </div>

              {activePreviewChapter.richText && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto markdown-body">
                  <Markdown>{activePreviewChapter.richText}</Markdown>
                </div>
              )}
            </div>
          )}

          {/* Modules Accordions */}
          {courseModules.length === 0 ? (
            <div className="glass p-8 text-center rounded-3xl border border-white/10 text-slate-400 text-xs">
              Le programme de cette formation est en cours d'actualisation par le formateur.
            </div>
          ) : (
            <div className="space-y-3">
              {courseModules.map((module, mIndex) => {
                const modChapters = courseChapters
                  .filter(ch => ch.moduleId === module.id)
                  .sort((a, b) => a.order - b.order);

                const isExpanded = expandedModules[module.id] ?? true;

                return (
                  <div key={module.id} className="glass border border-white/10 rounded-2xl overflow-hidden">
                    {/* Module Header */}
                    <button
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0">
                          {mIndex + 1}
                        </span>
                        <div>
                          <h3 className="font-bold text-white text-sm">{module.title}</h3>
                          <p className="text-[11px] text-slate-400">
                            {modChapters.length} chapitre{modChapters.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Module Chapters List */}
                    {isExpanded && (
                      <div className="border-t border-white/10 bg-slate-950/40 divide-y divide-white/5">
                        {modChapters.length === 0 ? (
                          <div className="p-3 text-[11px] text-slate-500 italic pl-6">
                            Aucun chapitre dans ce module pour l'instant.
                          </div>
                        ) : (
                          modChapters.map((chapter) => {
                            const isFree = chapter.isFree === true;
                            return (
                              <div
                                key={chapter.id}
                                className={`p-3.5 px-4 flex items-center justify-between gap-3 text-xs transition-all ${
                                  isFree ? 'hover:bg-emerald-500/5' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {isFree ? (
                                    <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                                  )}
                                  <span className={`truncate font-medium ${isFree ? 'text-white' : 'text-slate-400'}`}>
                                    {chapter.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isFree ? (
                                    <button
                                      type="button"
                                      onClick={() => setActivePreviewChapter(chapter)}
                                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <PlayCircle className="w-3 h-3 text-emerald-400" />
                                      <span>Extrait Gratuit</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                      <Lock className="w-3 h-3" />
                                      <span>Verrouillé</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION: OBJECTIFS, PRÉREQUIS & COMPÉTENCES ACQUISES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Objectifs */}
          <div className="glass p-5 rounded-3xl border border-white/10 space-y-3 text-[#ffffff]">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Target className="w-4 h-4" />
              <h3>Objectifs de la formation</h3>
            </div>
            <ul className="space-y-2 text-xs text-[#ffffff]">
              {objectivesList.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-[#94a3b8]">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prérequis */}
          <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <h3>Prérequis recommandés</h3>
            </div>
            <ul className="space-y-2 text-xs text-[#00d492]">
              {prerequisitesList.map((pre, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="text-[#efae03]">{pre}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Compétences acquises */}
          <div className="glass p-5 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <GraduationCap className="w-4 h-4" />
              <h3>Compétences acquises</h3>
            </div>
            <ul className="space-y-2 text-xs text-[#00d492]">
              {skillsList.map((skill, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#00d492]">{skill}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* SECTION: BOUTONS DE PAIEMENT CONFIGURÉS & INSTRUCTIONS */}
        <div className="glass p-6 rounded-3xl border border-white/10 space-y-5">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase border border-indigo-500/30">
              Modalités d'inscription
            </span>
            <h2 className="text-xl font-black text-white mt-1">Options de paiement & instructions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accédez directement à la formation via les liens de paiement sécurisés ou suivez les instructions de règlement manuel.
            </p>
          </div>

          {/* Custom Payment Buttons configured by trainer */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Boutons de paiement instantané configurés par le formateur :
            </p>
            {course.customPaymentButtons && course.customPaymentButtons.filter(b => b.active).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {course.customPaymentButtons.filter(b => b.active).map(btn => {
                  let colorClasses = 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/30';
                  if (btn.color === 'blue') {
                    colorClasses = 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30';
                  } else if (btn.color === 'green') {
                    colorClasses = 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/30';
                  } else if (btn.color === 'red') {
                    colorClasses = 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400/30';
                  } else if (btn.color === 'yellow') {
                    colorClasses = 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/30';
                  } else if (btn.color === 'purple') {
                    colorClasses = 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/30';
                  }

                  return (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold border transition-all shadow-md ${colorClasses}`}
                    >
                      <span>{btn.text}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-slate-300">
                Paiement manuel direct par Mobile Money ou Virement bancaire disponible.
              </div>
            )}
          </div>

          {/* Payment instructions (if enabled) */}
          {course.showPaymentInstructions !== false && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Instructions de règlement manuel :</h3>
              {course.paymentInstructions ? (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-slate-300 leading-relaxed markdown-body">
                  <Markdown>{course.paymentInstructions}</Markdown>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Mobile Money (Orange / MTN / Wave)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Transférez le montant de <strong className="text-white">{activePrice.toLocaleString('fr-FR')} XAF</strong> :</p>
                      <p className="font-mono text-xs font-bold text-indigo-400 mt-1">{course.whatsappNumber || '+225 07 00 00 00 00'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <Coins className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Virement bancaire</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">RIB de l'instructeur :</p>
                      <p className="font-mono text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded mt-1 select-all">
                        FR76 3000 1000 2000 3000 4000 500
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact info (if enabled) */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact & support du formateur :</p>
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs text-[#ffffff] whitespace-pre-line leading-relaxed font-mono">
              {course.contactInfo || `WhatsApp: ${course.whatsappNumber || '+225 07 00 00 00 00'}\nE-mail: support@dekel-formation.com`}
            </div>
          </div>
        </div>

        {/* SECTION: CERTIFICAT */}
        <div className="pt-2">
          
          {/* Certificat */}
          <div className="glass p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Award className="w-5 h-5" />
              <h3>Certificat de réussite inclus</h3>
            </div>
            <p className="text-xs text-[#ffffff] leading-relaxed">
              Une fois tous les modules validés et les quizz réussis, un certificat de formation nominatif avec code de vérification unique est généré automatiquement dans votre espace étudiant.
            </p>
          </div>

        </div>

      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        course={course}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
