import React, { useState, useEffect } from 'react';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { showToast } from './Toast';
import { CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, Mail, Sparkles, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface VerifyEmailProps {
  onBackToLogin: () => void;
  onGoToDashboard?: () => void;
  currentUser?: User | null;
}

export default function VerifyEmail({ onBackToLogin, onGoToDashboard, currentUser }: VerifyEmailProps) {
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Extract parameters from URL query string or hash
    const searchParams = new URLSearchParams(window.location.search);
    let code = searchParams.get('oobCode');
    let emailParam = searchParams.get('email') || '';

    if (!code && window.location.hash.includes('oobCode=')) {
      const hashQuery = window.location.hash.split('?')[1] || window.location.hash;
      const hashParams = new URLSearchParams(hashQuery);
      code = hashParams.get('oobCode');
      if (!emailParam) emailParam = hashParams.get('email') || '';
    }

    if (emailParam) {
      setUserEmail(emailParam);
    } else if (auth.currentUser?.email) {
      setUserEmail(auth.currentUser.email);
    }

    if (code) {
      setOobCode(code);
      handleVerifyCode(code);
    } else {
      // Check if user is already verified via Firebase auth state
      if (auth.currentUser?.emailVerified) {
        setIsVerified(true);
        setIsVerifying(false);
      } else {
        setIsVerifying(false);
      }
    }
  }, []);

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    setError('');

    // Handle simulated local link code
    if (code.startsWith('simulated_')) {
      setTimeout(() => {
        setIsVerified(true);
        setIsVerifying(false);
        showToast('Votre compte a été activé avec succès !', 'success');
      }, 600);
      return;
    }

    try {
      // Execute real Firebase Auth verification
      await applyActionCode(auth, code);

      // Reload current user state if logged in
      if (auth.currentUser) {
        await auth.currentUser.reload().catch(() => {});
      }

      setIsVerified(true);
      showToast('Votre compte a été activé avec succès !', 'success');

      // Clean up search query string in URL
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    } catch (err: any) {
      console.error('Error applying action code:', err);
      let msg = 'Le lien d\'activation est invalide, expiré ou a déjà été utilisé.';
      if (err.code === 'auth/invalid-action-code') {
        msg = 'Le code d\'activation est invalide ou a déjà été utilisé.';
      } else if (err.code === 'auth/expired-action-code') {
        msg = 'Le lien de vérification a expiré. Veuillez en demander un nouveau.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'Ce compte utilisateur a été désactivé.';
      }
      setError(msg);
      setIsVerified(false);
      showToast(msg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendLink = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError('');

    try {
      if (auth.currentUser) {
        const actionCodeSettings = {
          url: `${window.location.origin}?mode=verifyEmail`,
          handleCodeInApp: true,
        };
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setResendSuccess(true);
        showToast('Un nouvel e-mail de vérification a été envoyé !', 'success');
      } else {
        setError('Veuillez vous connecter d\'abord pour demander un nouvel e-mail de vérification.');
        showToast('Veuillez vous connecter pour renvoyer le lien.', 'warning');
      }
    } catch (err: any) {
      console.error('Error resending email verification:', err);
      let msg = 'Échec de l\'envoi de l\'e-mail de vérification.';
      if (err.code === 'auth/too-many-requests') {
        msg = 'Trop de tentatives. Veuillez patienter un moment avant de réessayer.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1e24] border border-white/10 shadow-2xl rounded-3xl overflow-hidden p-6 sm:p-8 relative text-white">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl mb-3 text-emerald-400 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Activation du compte</h2>
          <p className="text-xs text-slate-400 mt-1">
            Vérification de votre adresse e-mail avec Firebase Authentication
          </p>
        </div>

        {/* CASE 1: Verifying in progress */}
        {isVerifying && (
          <div className="text-center py-10 space-y-4">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-300">Validation de votre lien d'activation en cours...</p>
          </div>
        )}

        {/* CASE 2: Account Successfully Verified */}
        {!isVerifying && isVerified && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="p-5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <p className="font-bold text-base text-white">Votre compte est activé !</p>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Votre adresse e-mail <span className="text-white font-semibold">{userEmail || auth.currentUser?.email || 'associée'}</span> a été vérifiée avec succès dans Firebase Authentication.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Vous avez désormais un accès complet à la plateforme de formations Dekel.Formation, à vos cours, quiz et certificats.
            </p>

            <div className="pt-2 space-y-3">
              {currentUser || auth.currentUser ? (
                <button
                  onClick={onGoToDashboard || onBackToLogin}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Accéder à mon espace</span>
                </button>
              ) : (
                <button
                  onClick={onBackToLogin}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Se connecter à mon compte</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* CASE 3: Link Failed / Expired or invalid */}
        {!isVerifying && !isVerified && error && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Lien d'activation invalide ou expiré</p>
                <p className="mt-0.5 text-slate-300">{error}</p>
              </div>
            </div>

            {resendSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Un nouveau lien de vérification vient de vous être envoyé par e-mail.</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleResendLink}
                disabled={isResending}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Renvoyer l'e-mail de vérification</span>
                  </>
                )}
              </button>

              <button
                onClick={onBackToLogin}
                className="inline-flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la page de connexion</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 4: Page accessed directly without code and not verified yet */}
        {!isVerifying && !isVerified && !error && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Mail className="w-4 h-4" />
                <span>E-mail de vérification envoyé</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Vérifiez votre boîte de réception <strong className="text-white">{userEmail || 'e-mail'}</strong> et cliquez sur le lien d'activation reçu.
              </p>
            </div>

            {resendSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Un nouveau lien vient d'être envoyé par e-mail.</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendLink}
                disabled={isResending}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Renvoyer l'e-mail de vérification</span>
                  </>
                )}
              </button>

              <button
                onClick={onBackToLogin}
                className="inline-flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
