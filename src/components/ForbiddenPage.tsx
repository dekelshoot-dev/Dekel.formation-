import React from 'react';
import { ShieldAlert, Home, LogIn } from 'lucide-react';

interface ForbiddenPageProps {
  onNavigate: (path: string) => void;
  requiredRole?: string;
}

export default function ForbiddenPage({ onNavigate, requiredRole }: ForbiddenPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-rose-500/20 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">403 - Accès refusé</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Vous n'avez pas les autorisations requises pour accéder à cette page.
            {requiredRole && (
              <span className="block mt-1 font-semibold text-rose-300">
                Rôle requis : {requiredRole}
              </span>
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/connexion')}
            className="w-full sm:w-auto accent-gradient text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
