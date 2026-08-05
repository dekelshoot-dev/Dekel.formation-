import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { unsubscribeNewsletter, subscribeNewsletter } from '../firebaseService';
import { showToast } from './Toast';

interface NewsletterUnsubscribePageProps {
  onNavigate: (path: string) => void;
}

export default function NewsletterUnsubscribePage({ onNavigate }: NewsletterUnsubscribePageProps) {
  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'unsubscribed' | 'resubscribed' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Parse query params from URL window.location
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') || '';
    if (emailParam) {
      const clean = emailParam.trim().toLowerCase();
      setEmail(clean);
      setInputEmail(clean);
      handleUnsubscribe(clean);
    }
  }, []);

  const handleUnsubscribe = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Veuillez saisir une adresse e-mail valide.', 'error');
      return;
    }

    setStatus('loading');
    try {
      await unsubscribeNewsletter(targetEmail);
      setEmail(targetEmail);
      setStatus('unsubscribed');
      setMessage(`L'adresse e-mail "${targetEmail}" a été retirée avec succès de notre liste d'envoi de la newsletter.`);
      showToast('Désinscription de la newsletter confirmée.', 'success');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Une erreur s\'est produite lors de la désinscription.');
      showToast('Erreur lors de la désinscription.', 'error');
    }
  };

  const handleResubscribe = async () => {
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      await subscribeNewsletter(email);
      setStatus('resubscribed');
      setMessage(`Super ! L'adresse "${email}" est à nouveau inscrite à notre newsletter.`);
      showToast('Vous êtes à nouveau réinscrit à la newsletter !', 'success');
    } catch (err: any) {
      setStatus('error');
      showToast('Erreur lors de la réinscription.', 'error');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-center text-white">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Icon Badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2 shadow-inner">
            {status === 'unsubscribed' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : status === 'resubscribed' ? (
              <Sparkles className="w-8 h-8 text-amber-400" />
            ) : (
              <Mail className="w-8 h-8 text-indigo-400" />
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Désinscription de la Newsletter
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-sm mx-auto">
              Gestion de vos préférences de communication Dekel.Formation.
            </p>
          </div>

          {/* Status Message Display */}
          {status === 'unsubscribed' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Désinscription confirmée !</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {message}
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-emerald-500/20">
                <span>Adresse concernée :</span>
                <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {email}
                </span>
              </div>
            </div>
          )}

          {status === 'resubscribed' && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Réinscription réussie !</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {message}
              </p>
            </div>
          )}

          {/* Manual Email Input form if no email in URL or user wants to specify another */}
          {status === 'idle' && (
            <div className="space-y-4 text-left">
              <label className="block text-xs font-bold text-slate-300">
                Saisissez votre adresse e-mail pour vous désinscrire :
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleUnsubscribe(inputEmail)}
                  className="px-5 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
                >
                  Se désinscrire
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {status === 'unsubscribed' && (
              <button
                onClick={handleResubscribe}
                className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>C'était une erreur ? Se réinscrire</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('/')}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l'accueil</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Conformité RGPD &amp; Protection de la vie privée</span>
          </div>
        </div>
      </div>
    </div>
  );
}
