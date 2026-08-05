import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';
import { showToast } from './Toast';
import { KeyRound, Mail, CheckCircle2, AlertCircle, ArrowLeft, Lock, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SimulatedEmail, User } from '../types';

interface ResetPasswordProps {
  onBackToLogin: () => void;
  onSendEmail?: (email: SimulatedEmail) => void;
  allUsers?: User[];
}

export default function ResetPassword({ onBackToLogin, onSendEmail, allUsers = [] }: ResetPasswordProps) {
  // Extract parameters from URL
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // States for code verification phase
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [codeVerified, setCodeVerified] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string>('');

  // States for request reset form (if no oobCode)
  const [requestEmail, setRequestEmail] = useState<string>('');
  const [isSendingLink, setIsSendingLink] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);

  // States for new password form (if oobCode is valid)
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    // Check URL parameters for oobCode, token, or code
    const searchParams = new URLSearchParams(window.location.search);
    let code = searchParams.get('oobCode') || searchParams.get('token') || searchParams.get('code');
    let emailParam = searchParams.get('email') || searchParams.get('user') || '';

    // Also check hash in case of single page hash router or hash search params
    if (!code && (window.location.hash.includes('oobCode=') || window.location.hash.includes('token=') || window.location.hash.includes('code='))) {
      const hashQuery = window.location.hash.split('?')[1] || window.location.hash;
      const hashParams = new URLSearchParams(hashQuery);
      code = hashParams.get('oobCode') || hashParams.get('token') || hashParams.get('code');
      if (!emailParam) emailParam = hashParams.get('email') || '';
    }

    if (emailParam) {
      setUserEmail(emailParam);
    }

    if (code) {
      setOobCode(code);
      verifyCode(code);
    }
  }, []);

  const verifyCode = async (code: string) => {
    setIsVerifyingCode(true);
    setCodeError('');
    try {
      // 1. Try server signed token verification first
      const serverRes = await fetch(`/api/emails/verify-token?token=${encodeURIComponent(code)}`);
      const serverData = await serverRes.json();

      if (serverRes.ok && serverData.valid && serverData.payload) {
        setUserEmail(serverData.payload.email);
        setCodeVerified(true);
        showToast('Code de réinitialisation vérifié par le serveur SMTP.', 'success');
        return;
      }

      // 2. Fallback to Firebase verify code if code is native Firebase action code
      const email = await verifyPasswordResetCode(auth, code);
      setUserEmail(email);
      setCodeVerified(true);
      showToast('Code de réinitialisation Firebase vérifié avec succès.', 'success');
    } catch (err: any) {
      console.error('Error verifying reset code:', err);
      let msg = 'Le lien de réinitialisation est invalide, expiré ou a déjà été utilisé.';
      if (err.code === 'auth/invalid-action-code') {
        msg = 'Le code de réinitialisation est invalide ou a déjà été utilisé.';
      } else if (err.code === 'auth/expired-action-code') {
        msg = 'Le lien de réinitialisation a expiré. Veuillez refaire une demande.';
      }
      setCodeError(msg);
      setCodeVerified(false);
      showToast(msg, 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!requestEmail) {
      setFormError('Veuillez saisir votre adresse e-mail.');
      showToast('Veuillez saisir votre adresse e-mail.', 'warning');
      return;
    }

    const trimmedEmail = requestEmail.trim().toLowerCase();
    setIsSendingLink(true);

    try {
      const found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
      const recipientName = found ? found.name : trimmedEmail.split('@')[0];

      // Dispatch real email via backend SMTP server & record in database history
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          recipientName,
          origin: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Échec de l\'envoi du lien par le serveur SMTP.');
      }

      const generatedResetUrl = data.resetUrl || `${window.location.origin}?mode=resetPassword&oobCode=${data.oobCode}&email=${encodeURIComponent(trimmedEmail)}`;

      setRequestSuccess(true);
      showToast('E-mail de réinitialisation avec jeton sécurisé envoyé par le serveur SMTP !', 'success');

      if (onSendEmail) {
        const simEmail: SimulatedEmail = {
          id: `em-${Date.now()}`,
          to: trimmedEmail,
          subject: 'Réinitialisation de votre mot de passe - Dekel.Formation',
          body: `Bonjour ${recipientName},\n\nUne demande de réinitialisation de mot de passe a été émise pour votre compte.\nCliquez sur le lien suivant pour créer votre nouveau mot de passe :\n\n${generatedResetUrl}\n\nSi vous n'avez pas demandé ce changement, vous pouvez ignorer ce message.\n\nCordialement,\nL'équipe Dekel.Formation`,
          sentAt: new Date().toISOString()
        };
        onSendEmail(simEmail);
      }
    } catch (err: any) {
      console.error('Error sending password reset email:', err);
      const msg = err.message || 'Impossible d\'envoyer l\'e-mail de réinitialisation.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newPassword) {
      setFormError('Veuillez saisir un nouveau mot de passe.');
      showToast('Veuillez saisir un nouveau mot de passe.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères.');
      showToast('Le mot de passe doit contenir au moins 6 caractères.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas.');
      showToast('Les mots de passe ne correspondent pas.', 'warning');
      return;
    }

    if (!oobCode) {
      setFormError('Code de réinitialisation manquant.');
      return;
    }

    setIsResetting(true);

    try {
      // 1. Send password reset request to backend server
      const serverRes = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: oobCode, newPassword })
      });

      const serverData = await serverRes.json();

      // 2. If it was also a Firebase code, update Firebase auth password
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
      } catch (fbErr) {
        // Ignored if server token was used
      }

      if (!serverRes.ok && serverData.status === 'error') {
        throw new Error(serverData.message || 'Échec de la réinitialisation du mot de passe.');
      }

      setResetSuccess(true);
      showToast('Votre mot de passe a été réinitialisé avec succès !', 'success');
      
      // Clean up search query string in URL
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    } catch (err: any) {
      console.error('Error confirming reset password:', err);
      const msg = err.message || 'Échec de la réinitialisation du mot de passe.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsResetting(false);
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
          <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-2xl mb-3 text-emerald-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Réinitialisation du mot de passe</h2>
          <p className="text-xs text-slate-400 mt-1">
            {oobCode 
              ? 'Configurez votre nouveau mot de passe sécurisé' 
              : 'Saisissez votre e-mail pour recevoir un lien de réinitialisation'}
          </p>
        </div>

        {/* CASE 1: Verification in progress */}
        {oobCode && isVerifyingCode && (
          <div className="text-center py-8 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-300">Vérification du lien de réinitialisation...</p>
          </div>
        )}

        {/* CASE 2: Invalid/Expired Code */}
        {oobCode && !isVerifyingCode && codeError && (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Lien invalide ou expiré</p>
                <p className="mt-0.5 text-slate-300">{codeError}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setOobCode(null);
                setCodeError('');
              }}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Renvoyer un nouveau lien de réinitialisation
            </button>

            <button
              onClick={onBackToLogin}
              className="inline-flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la connexion</span>
            </button>
          </div>
        )}

        {/* CASE 3: Reset Success */}
        {resetSuccess && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="font-bold text-sm text-white">Mot de passe modifié avec succès !</p>
              <p className="text-slate-300 text-center">
                Votre nouveau mot de passe est enregistré dans Firebase Authentication. Vous pouvez désormais vous connecter.
              </p>
            </div>

            <button
              onClick={onBackToLogin}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Se connecter avec le nouveau mot de passe
            </button>
          </div>
        )}

        {/* CASE 4: Valid oobCode -> Form to set new password */}
        {oobCode && !isVerifyingCode && codeVerified && !resetSuccess && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Compte vérifié</p>
                <p className="text-xs font-bold text-white truncate">{userEmail}</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirmer le nouveau mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isResetting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Enregistrer le nouveau mot de passe</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </form>
        )}

        {/* CASE 5: Request reset email (No oobCode in URL) */}
        {!oobCode && (
          <div className="space-y-4">
            {requestSuccess ? (
              <div className="space-y-5 text-center animate-fade-in">
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="font-bold text-sm text-white">E-mail envoyé avec succès !</p>
                  <p className="text-slate-300">
                    Un lien de réinitialisation sécurisé a été généré par Firebase Auth et envoyé à <strong className="text-white">{requestEmail}</strong>.
                  </p>
                </div>

                <p className="text-[11px] text-slate-400">
                  Vérifiez votre boîte de réception (et vos indésirables). Cliquez sur le lien reçu pour définir votre nouveau mot de passe.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setRequestSuccess(false);
                      setRequestEmail('');
                    }}
                    className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Envoyer à une autre adresse
                  </button>

                  <button
                    onClick={onBackToLogin}
                    className="inline-flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors py-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour à la connexion</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Votre adresse e-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingLink}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSendingLink ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Envoyer le lien Firebase</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour à la connexion</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
