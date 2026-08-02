import React, { useEffect, useState } from 'react';
import { CustomHtmlPage } from '../types';
import { incrementCustomPageViewCount } from '../firebaseService';
import { ArrowLeft, Monitor, Smartphone, Tablet, Edit3, ExternalLink, X, Eye, ShieldCheck } from 'lucide-react';

interface CustomPageViewerProps {
  page: CustomHtmlPage;
  isPreviewMode?: boolean;
  onClosePreview?: () => void;
  onEditPage?: (page: CustomHtmlPage) => void;
}

export default function CustomPageViewer({
  page,
  isPreviewMode = false,
  onClosePreview,
  onEditPage
}: CustomPageViewerProps) {
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Increment view counter when loaded live (not preview mode)
  useEffect(() => {
    if (!isPreviewMode && page?.id) {
      incrementCustomPageViewCount(page.id);
    }
  }, [page?.id, isPreviewMode]);

  // Inject Meta Title & Meta Description on host page as well for SEO
  useEffect(() => {
    const originalTitle = document.title;
    document.title = page.seoTitle || page.title;

    // Update or insert meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const prevDesc = metaDesc.getAttribute('content') || '';
    metaDesc.setAttribute('content', page.seoDescription || page.title);

    // Update Open Graph Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (page.ogImage) {
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      ogImg.setAttribute('content', page.ogImage);
    }

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, [page]);

  // Build complete sandboxed HTML document
  const fullHtmlDocument = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${(page.seoTitle || page.title).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
  ${page.seoDescription ? `<meta name="description" content="${page.seoDescription.replace(/"/g, '&quot;')}">` : ''}
  ${page.ogImage ? `<meta property="og:image" content="${page.ogImage}">` : ''}
  <meta property="og:title" content="${(page.seoTitle || page.title).replace(/"/g, '&quot;')}">
  ${page.customHeadTags || ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Reset de base pour isolation parfaite */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #ffffff;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    ${page.css || ''}
  </style>
</head>
<body>
  ${page.html || ''}
  <script>
    window.addEventListener('error', function(e) {
      console.warn('Custom Page Script Warning:', e.message);
    });
    try {
      ${page.js || ''}
    } catch(err) {
      console.error('Erreur lors de l\\'exécution du JS de la page personnalisée:', err);
    }
  </script>
</body>
</html>`;

  const getViewportWidthClass = () => {
    switch (deviceViewport) {
      case 'mobile':
        return 'w-[375px] h-[667px] my-auto shadow-2xl rounded-2xl border-8 border-slate-800 overflow-hidden';
      case 'tablet':
        return 'w-[768px] h-[90vh] my-auto shadow-2xl rounded-2xl border-8 border-slate-800 overflow-hidden';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900 flex flex-col w-screen h-screen overflow-hidden text-slate-100 font-sans">
      {/* Optional Admin Preview Header Toolbar */}
      {isPreviewMode && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {onClosePreview && (
              <button
                onClick={onClosePreview}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Quitter la prévisualisation"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour au tableau de bord</span>
              </button>
            )}
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2 min-w-0">
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Mode Prévisualisation</span>
              </div>
              <span className="text-xs font-bold text-white truncate">{page.title}</span>
              <span className="text-xs text-slate-500 hidden md:inline truncate">(/p/{page.slug})</span>
            </div>
          </div>

          {/* Device Responsive Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setDeviceViewport('desktop')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                deviceViewport === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Ordinateur"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceViewport('tablet')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                deviceViewport === 'tablet' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Tablette (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Tablette</span>
            </button>
            <button
              onClick={() => setDeviceViewport('mobile')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                deviceViewport === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Mobile (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Mobile</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditPage && (
              <button
                onClick={() => onEditPage(page)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Éditer le code</span>
              </button>
            )}
            {onClosePreview && (
              <button
                onClick={onClosePreview}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Standalone Viewport Canvas */}
      <div className={`flex-1 w-full h-full flex justify-center items-center overflow-auto ${
        deviceViewport !== 'desktop' && isPreviewMode ? 'p-6 bg-slate-950/80' : 'bg-white'
      }`}>
        <iframe
          title={page.title}
          srcDoc={fullHtmlDocument}
          className={`${getViewportWidthClass()} transition-all duration-300 bg-white`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    </div>
  );
}
