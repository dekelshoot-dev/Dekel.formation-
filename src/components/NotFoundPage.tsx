import React from 'react';
import { BookOpen, Home, ShoppingBag, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export default function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
          <span className="text-2xl font-black font-mono">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Page introuvable</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée. Vérifiez l'adresse saisie ou retournez à l'accueil.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full sm:w-auto accent-gradient text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/marketplace')}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-slate-200 font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            <span>Marketplace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
