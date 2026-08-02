import React, { useState } from 'react';
import { CustomHtmlPage, CustomPageStatus, User } from '../types';
import { 
  Plus, Edit3, Trash2, Eye, Copy, ExternalLink, Globe, FileCode, 
  Code, Palette, Terminal, Sparkles, Check, Search, Filter, 
  Settings, ArrowLeft, Save, ShieldCheck, Layers, FileText, AlertCircle, RefreshCw,
  User as UserIcon, Lock
} from 'lucide-react';
import { showToast } from './Toast';

interface CustomPagesManagerProps {
  customPages: CustomHtmlPage[];
  currentUser?: User;
  onSavePage: (page: CustomHtmlPage) => void;
  onDeletePage: (pageId: string) => void;
  onPreviewPage: (page: CustomHtmlPage) => void;
}

export default function CustomPagesManager({
  customPages,
  currentUser,
  onSavePage,
  onDeletePage,
  onPreviewPage
}: CustomPagesManagerProps) {
  // Navigation & View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [activeEditorTab, setActiveEditorTab] = useState<'html' | 'css' | 'js'>('html');
  const [showSeoSettings, setShowSeoSettings] = useState(false);
  const [livePreviewSplit, setLivePreviewSplit] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomPageStatus>('all');

  // Currently Editing Page State
  const [editingPage, setEditingPage] = useState<CustomHtmlPage | null>(null);

  // Draft form fields
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageStatus, setPageStatus] = useState<CustomPageStatus>('draft');
  const [pageHtml, setPageHtml] = useState('');
  const [pageCss, setPageCss] = useState('');
  const [pageJs, setPageJs] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [customHeadTags, setCustomHeadTags] = useState('');

  // Start creating a new custom page
  const handleStartNewPage = () => {
    const id = `page-${Date.now()}`;
    const newPage: CustomHtmlPage = {
      id,
      title: 'Nouvelle Page Personnalisée',
      slug: `page-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'draft',
      html: `<div class="container">\n  <h1>Bienvenue sur votre nouvelle page !</h1>\n  <p>Personnalisez facilement ce contenu en modifiant le code HTML, CSS et JavaScript dans l'éditeur.</p>\n  <button class="btn" id="demoBtn">Cliquez-moi</button>\n</div>`,
      css: `body {\n  font-family: system-ui, sans-serif;\n  background: #f8fafc;\n  color: #1e293b;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n}\n.container {\n  text-align: center;\n  background: #ffffff;\n  padding: 40px;\n  border-radius: 16px;\n  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);\n  max-width: 500px;\n}\n.btn {\n  background: #2563eb;\n  color: #fff;\n  border: none;\n  padding: 12px 24px;\n  border-radius: 8px;\n  font-weight: 600;\n  cursor: pointer;\n}`,
      js: `document.getElementById('demoBtn')?.addEventListener('click', function() {\n  alert('Bravo ! Votre script JavaScript fonctionne parfaitement.');\n});`,
      seoTitle: 'Nouvelle Page Personnalisée',
      seoDescription: 'Découvrez notre nouvelle page personnalisée.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentUser?.id || currentUser?.email,
      authorName: currentUser?.name || currentUser?.email || 'Auteur Inconnu',
      viewsCount: 0
    };

    setEditingPage(newPage);
    setPageTitle(newPage.title);
    setPageSlug(newPage.slug);
    setPageStatus(newPage.status);
    setPageHtml(newPage.html);
    setPageCss(newPage.css);
    setPageJs(newPage.js);
    setSeoTitle(newPage.seoTitle || '');
    setSeoDescription(newPage.seoDescription || '');
    setOgImage(newPage.ogImage || '');
    setCustomHeadTags(newPage.customHeadTags || '');
    setViewMode('editor');
  };

  // Start editing an existing page
  const handleEditPage = (page: CustomHtmlPage) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageStatus(page.status);
    setPageHtml(page.html);
    setPageCss(page.css);
    setPageJs(page.js);
    setSeoTitle(page.seoTitle || '');
    setSeoDescription(page.seoDescription || '');
    setOgImage(page.ogImage || '');
    setCustomHeadTags(page.customHeadTags || '');
    setViewMode('editor');
  };

  // Duplicate an existing page
  const handleDuplicatePage = (page: CustomHtmlPage) => {
    const clone: CustomHtmlPage = {
      ...page,
      id: `page-${Date.now()}`,
      title: `${page.title} (Copie)`,
      slug: `${page.slug}-copie-${Math.floor(100 + Math.random() * 900)}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentUser?.id || currentUser?.email || page.authorId,
      authorName: currentUser?.name || currentUser?.email || page.authorName,
      viewsCount: 0
    };
    onSavePage(clone);
    showToast(`Page "${page.title}" dupliquée en brouillon !`, 'success');
  };

  // Save changes
  const handleSaveCurrentPage = (forcedStatus?: CustomPageStatus) => {
    if (!pageTitle.trim()) {
      showToast('Veuillez saisir un titre pour la page.', 'warning');
      return;
    }

    const cleanSlug = pageSlug
      .toLowerCase()
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-z0-9\-_]/g, '-');

    if (!cleanSlug) {
      showToast('Veuillez saisir une route d\'accès valide.', 'warning');
      return;
    }

    const targetStatus = forcedStatus || pageStatus;

    const updated: CustomHtmlPage = {
      id: editingPage?.id || `page-${Date.now()}`,
      title: pageTitle.trim(),
      slug: cleanSlug,
      status: targetStatus,
      html: pageHtml,
      css: pageCss,
      js: pageJs,
      seoTitle: seoTitle.trim() || pageTitle.trim(),
      seoDescription: seoDescription.trim(),
      ogImage: ogImage.trim(),
      customHeadTags: customHeadTags.trim(),
      createdAt: editingPage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: editingPage?.authorId || currentUser?.id || currentUser?.email,
      authorName: editingPage?.authorName || currentUser?.name || currentUser?.email || 'Auteur Inconnu',
      viewsCount: editingPage?.viewsCount || 0
    };

    onSavePage(updated);
    showToast(
      targetStatus === 'published' 
        ? `Page "${updated.title}" publiée avec succès !` 
        : `Page "${updated.title}" enregistrée en brouillon.`,
      'success'
    );
    setViewMode('list');
  };

  // Helper for starter template insertion
  const applyStarterTemplate = (type: 'offer' | 'masterclass' | 'minimal') => {
    if (type === 'offer') {
      setPageTitle('Offre Promotionnelle Flash');
      setPageSlug('promo-flash');
      setPageHtml(`<div class="promo-card">\n  <span class="badge">OFFRE LIMITÉE</span>\n  <h1>Profitez de -50% Immédiats</h1>\n  <p>Accédez à l'ensemble des modules certifiants avant expiration de la promo.</p>\n  <a href="/#catalog" class="cta">Bénéficier de la réduction</a>\n</div>`);
      setPageCss(`body { margin:0; font-family:'Plus Jakarta Sans', sans-serif; background:#0f172a; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; }\n.promo-card { background:#1e293b; padding:40px; border-radius:24px; text-align:center; border:1px solid #334155; max-width:500px; }\n.badge { background:#e11d48; color:#fff; font-size:12px; font-weight:800; padding:6px 14px; border-radius:99px; }\nh1 { font-size:28px; margin:20px 0 10px; }\np { color:#94a3b8; font-size:15px; margin-bottom:24px; }\n.cta { display:inline-block; width:100%; box-sizing:border-box; background:#e11d48; color:#fff; padding:16px; border-radius:12px; font-weight:700; text-decoration:none; }`);
      setPageJs(`console.log('Template offre spéciale chargé !');`);
    } else if (type === 'masterclass') {
      setPageTitle('Masterclass Direct Webinar');
      setPageSlug('live-masterclass');
      setPageHtml(`<div class="webinar-box">\n  <div class="live-dot">LIVE</div>\n  <h2>Masterclass : Réussir en E-Commerce</h2>\n  <p>Inscrivez-vous pour assister à la session en direct avec nos experts.</p>\n  <input type="email" id="mEmail" placeholder="Entrez votre e-mail" />\n  <button id="mBtn">Réserver ma place</button>\n  <div id="mRes"></div>\n</div>`);
      setPageCss(`body { margin:0; font-family:sans-serif; background:#040d1a; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; }\n.webinar-box { background:#0b192c; border:1px solid #1e293b; border-radius:20px; padding:32px; width:100%; max-width:440px; }\n.live-dot { background:#10b981; color:#fff; font-size:10px; font-weight:800; padding:3px 10px; border-radius:10px; display:inline-block; margin-bottom:12px; }\ninput { width:100%; box-sizing:border-box; padding:12px; border-radius:10px; border:1px solid #334155; background:#0f172a; color:#fff; margin-bottom:12px; outline:none; }\nbutton { width:100%; padding:14px; background:#2563eb; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; }`);
      setPageJs(`document.getElementById('mBtn')?.addEventListener('click', function(){\n  const email = document.getElementById('mEmail').value;\n  if(!email) return alert('Saisissez votre mail');\n  document.getElementById('mRes').innerHTML = '<p style="color:#10b981; margin-top:12px;">✅ Inscription enregistrée !</p>';\n});`);
    }
    showToast('Modèle appliqué avec succès !', 'info');
  };

  // Creator Isolation: Filter pages so formateurs and admins only see pages created by themselves
  const userPages = customPages.filter(page => {
    if (!currentUser) return true;
    if (page.authorId) {
      return page.authorId === currentUser.id || page.authorId === currentUser.email;
    }
    // If no authorId is set (legacy page), match if authorName corresponds or show to owner
    return true;
  });

  // Filter userPages by search query & status
  const filteredPages = userPages.filter(page => {
    const matchesSearch = 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPageUrl = (slug: string) => {
    return `${window.location.origin}/p/${slug}`;
  };

  const copyPageUrl = (slug: string) => {
    const url = getPageUrl(slug);
    navigator.clipboard.writeText(url);
    showToast('Lien de la page copié dans le presse-papier !', 'success');
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-slate-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/25 shrink-0">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Pages HTML Personnalisées</span>
              <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold uppercase">
                Autonome
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Créez, éditez et publiez des landing pages, offres spéciales ou masterclass uniques en HTML, CSS et JS.
            </p>
          </div>
        </div>

        {viewMode === 'list' && (
          <button
            onClick={handleStartNewPage}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une Page HTML</span>
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre ou URL..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Tous les statuts ({userPages.length})</option>
                <option value="published">Publiées ({userPages.filter(p => p.status === 'published').length})</option>
                <option value="draft">Brouillons ({userPages.filter(p => p.status === 'draft').length})</option>
                <option value="archived">Archivées ({userPages.filter(p => p.status === 'archived').length})</option>
              </select>
            </div>
          </div>

          {/* Table / Grid of Pages */}
          {filteredPages.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Aucune page HTML trouvée</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vous n'avez pas encore créé de page correspondant à votre recherche. Créez votre première landing page personnalisée dès maintenant.
              </p>
              <button
                onClick={handleStartNewPage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une page maintenant</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredPages.map(page => (
                <div 
                  key={page.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{page.title}</h3>
                      
                      {/* Status Badges */}
                      {page.status === 'published' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          <span>Publiée</span>
                        </span>
                      )}
                      {page.status === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                          Brouillon
                        </span>
                      )}
                      {page.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                          Archivée
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <div className="flex items-center gap-1 text-indigo-600 font-mono font-medium bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100">
                        <Globe className="w-3.5 h-3.5" />
                        <span>/p/{page.slug}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span>Modifiée le {new Date(page.updatedAt).toLocaleDateString('fr-FR')}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-slate-700">{page.viewsCount || 0} vue{(page.viewsCount || 0) > 1 ? 's' : ''}</span>
                      {page.authorName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            <UserIcon className="w-3 h-3 text-slate-500" />
                            <span>{page.authorName}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => onPreviewPage(page)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Prévisualiser la page"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Aperçu</span>
                    </button>

                    <button
                      onClick={() => handleEditPage(page)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-100"
                      title="Modifier le code HTML/CSS/JS"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Éditer</span>
                    </button>

                    <button
                      onClick={() => copyPageUrl(page.slug)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      title="Copier le lien public"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicatePage(page)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      title="Dupliquer la page"
                    >
                      <Layers className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeletePage(page.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Supprimer la page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDITOR VIEW */}
      {viewMode === 'editor' && editingPage && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Control Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Retour à la liste"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Éditeur de Page HTML</h3>
                <p className="text-xs text-slate-400">Modifiez le code HTML, les styles CSS et l'interactivité JavaScript</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSeoSettings(!showSeoSettings)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showSeoSettings ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>SEO & Métas</span>
              </button>

              <button
                type="button"
                onClick={() => setLivePreviewSplit(!livePreviewSplit)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  livePreviewSplit ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Aperçu en direct</span>
              </button>

              <button
                type="button"
                onClick={() => onPreviewPage({
                  ...editingPage,
                  title: pageTitle,
                  slug: pageSlug,
                  status: pageStatus,
                  html: pageHtml,
                  css: pageCss,
                  js: pageJs,
                  seoTitle,
                  seoDescription,
                  ogImage,
                  customHeadTags
                })}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Plein écran</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCurrentPage('draft')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Enregistrer brouillon
              </button>

              <button
                type="button"
                onClick={() => handleSaveCurrentPage('published')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Publier la page</span>
              </button>
            </div>
          </div>

          {/* Settings & Route Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de la Page</label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Ex: Offre Spéciale Lancement"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Route / URL Personnalisée</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 px-3 py-2 rounded-l-xl text-xs font-mono">/p/</span>
                  <input
                    type="text"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="offre-speciale"
                    className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-3 py-2 text-xs font-mono font-bold text-indigo-600 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut de Publication</label>
                <select
                  value={pageStatus}
                  onChange={(e) => setPageStatus(e.target.value as CustomPageStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="draft">🟡 Brouillon (non accessible au public)</option>
                  <option value="published">🟢 Publiée (accessible en ligne)</option>
                  <option value="archived">⚪ Archivée</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collapsible SEO & Scripts Drawer */}
          {showSeoSettings && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-slate-100 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>Référencement SEO, Balises & Scripts &lt;script&gt; Personnalisés</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSeoSettings(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Méta-Titre (Balise Title)</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titre optimisé pour les moteurs de recherche"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Image Open Graph (Partage Réseaux)</label>
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://exemple.com/image-partage.jpg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Méta-Description</label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Description concise pour les résultats de recherche Google..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      <span>Balises &lt;script&gt; &amp; En-tête &lt;head&gt; Personnalisés (Google Analytics, Pixel, SDKs...)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>\n<script>\n  console.log('Script de suivi/tracking personnalisé chargé !');\n</script>`;
                        setCustomHeadTags(prev => prev ? `${prev}\n${snippet}` : snippet);
                        showToast('Exemple de balise <script> inséré !', 'info');
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Insérer un exemple &lt;script&gt;
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={customHeadTags}
                    onChange={(e) => setCustomHeadTags(e.target.value)}
                    placeholder={`<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXX');\n</script>`}
                    spellCheck={false}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-200 outline-none focus:border-amber-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 Vous pouvez coller ici n'importe quelle balise <code className="text-amber-300">&lt;script&gt;</code>, pixel de suivi, Google Tag Manager, widget de chat ou stylesheet externe. Elles seront insérées directement dans le <code className="text-amber-300">&lt;head&gt;</code> de la page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CODE EDITORS AND LIVE PREVIEW SPLIT */}
          <div className={`grid grid-cols-1 ${livePreviewSplit ? 'lg:grid-cols-2' : ''} gap-4`}>
            {/* Code Editor Container */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-lg min-h-[500px]">
              {/* 3 Independent Code Tabs (HTML, CSS, JS) */}
              <div className="bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('html')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeEditorTab === 'html' 
                        ? 'bg-rose-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('css')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeEditorTab === 'css' 
                        ? 'bg-sky-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>CSS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('js')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeEditorTab === 'js' 
                        ? 'bg-amber-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>JavaScript</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-mono hidden sm:block pr-2">
                  {activeEditorTab === 'html' && 'Structure HTML (Body)'}
                  {activeEditorTab === 'css' && 'Styles CSS Personnalisés'}
                  {activeEditorTab === 'js' && 'Scripts JS Isolés'}
                </div>
              </div>

              {/* Code Input Textarea */}
              <div className="flex-1 relative bg-slate-950">
                {activeEditorTab === 'html' && (
                  <textarea
                    value={pageHtml}
                    onChange={(e) => setPageHtml(e.target.value)}
                    placeholder="<h1>Votre code HTML ici...</h1>"
                    spellCheck={false}
                    className="w-full h-full min-h-[450px] bg-slate-950 text-slate-100 font-mono text-xs p-4 outline-none resize-y leading-relaxed border-none focus:ring-0"
                  />
                )}

                {activeEditorTab === 'css' && (
                  <textarea
                    value={pageCss}
                    onChange={(e) => setPageCss(e.target.value)}
                    placeholder="/* Vos styles CSS ici */"
                    spellCheck={false}
                    className="w-full h-full min-h-[450px] bg-slate-950 text-sky-200 font-mono text-xs p-4 outline-none resize-y leading-relaxed border-none focus:ring-0"
                  />
                )}

                {activeEditorTab === 'js' && (
                  <textarea
                    value={pageJs}
                    onChange={(e) => setPageJs(e.target.value)}
                    placeholder="// Vos scripts JavaScript ici"
                    spellCheck={false}
                    className="w-full h-full min-h-[450px] bg-slate-950 text-amber-200 font-mono text-xs p-4 outline-none resize-y leading-relaxed border-none focus:ring-0"
                  />
                )}
              </div>
            </div>

            {/* Split Screen Realtime Preview */}
            {livePreviewSplit && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-lg min-h-[500px]">
                <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Aperçu en temps réel</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Sandboxed Isolation</span>
                </div>

                <div className="flex-1 bg-white relative overflow-hidden">
                  <iframe
                    title="Live Preview"
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8">${customHeadTags || ''}<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;}${pageCss}</style></head><body>${pageHtml}<script>try{${pageJs}}catch(e){console.warn(e);}</script></body></html>`}
                    className="w-full h-full border-none min-h-[450px]"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
