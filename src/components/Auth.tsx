import React, { useState } from 'react';
import { User, UserRole, SimulatedEmail } from '../types';
import { Mail, Key, User as UserIcon, BookOpen, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { showToast } from './Toast';
import ResetPassword from './ResetPassword';

interface AuthProps {
  allUsers: User[];
  onLogin: (user: User) => void;
  onAddUser: (user: User) => void;
  onSendEmail: (email: SimulatedEmail) => void;
}

export default function Auth({ allUsers, onLogin, onAddUser, onSendEmail }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setMessage('Connexion Google réussie !');
      showToast('Connexion Google réussie !', 'success');
    } catch (err: any) {
      console.error(err);
      let errMsg = `Échec de la connexion Google: ${err.message || err}`;
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = "La connexion avec Google n'est pas activée dans votre console Firebase Authentication. Veuillez l'activer sous l'onglet 'Sign-in method'.";
      }
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      showToast('Veuillez remplir tous les champs.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      // Verify credentials with real Firebase Auth
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      showToast('Connexion réussie !', 'success');
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Échec de la connexion. Veuillez vérifier vos identifiants.';
      if (err.code === 'auth/user-not-found') {
        errMsg = 'Adresse e-mail non enregistrée.';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = 'Mot de passe incorrect.';
      } else if (err.code === 'auth/invalid-credential') {
        errMsg = 'Identifiants incorrects.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = "La méthode de connexion par E-mail/Mot de passe n'est pas activée dans votre console Firebase Authentication. Veuillez l'activer sous l'onglet 'Sign-in method'.";
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!email || !name || !password) {
      setError('Veuillez remplir tous les champs.');
      showToast('Veuillez remplir tous les champs.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // 1. Create the Firebase Auth account first
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      // 2. Set the display name in Auth and send email verification
      if (credential.user) {
        await updateProfile(credential.user, {
          displayName: name
        });

        const actionCodeSettings = {
          url: `${window.location.origin}?mode=verifyEmail`,
          handleCodeInApp: true,
        };
        try {
          await sendEmailVerification(credential.user, actionCodeSettings);
        } catch (verifErr) {
          console.warn('Firebase email verification auto-send warning:', verifErr);
        }
      }

      // 3. Define complementary profile data (Default role is Student)
      const newUser: User = {
        id: credential.user.uid,
        email: trimmedEmail,
        name,
        role: 'student',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // 4. Save to Firestore DB
      await onAddUser(newUser);

      // Send Email via unified backend SMTP server (service@dekel-dev.com) & record in DB history
      const verifyUrl = `${window.location.origin}?mode=verifyEmail&oobCode=verify_${Date.now()}&email=${encodeURIComponent(trimmedEmail)}`;
      
      try {
        await fetch('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: trimmedEmail,
            recipientName: name,
            type: 'account_verification',
            category: 'account_security',
            renderData: {
              recipientName: name,
              recipientEmail: trimmedEmail,
              actionUrl: verifyUrl
            },
            actionUrl: verifyUrl,
            metadata: { userId: credential.user.uid, event: 'user_registration' }
          })
        });
      } catch (smtpErr) {
        console.warn('Backend SMTP email error:', smtpErr);
      }

      const verificationEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: trimmedEmail,
        subject: `Activez votre compte - Dekel.Formation`,
        body: `Bonjour ${name},

Bienvenue sur la plateforme Dekel.Formation !

Pour activer définitivement votre compte et valider votre adresse e-mail, veuillez cliquer sur le lien d'activation ci-dessous :

${verifyUrl}

Si vous n'avez pas demandé la création de ce compte, vous pouvez ignorer cet e-mail.

Cordialement,
L'équipe Dekel.Formation`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(verificationEmail);

      showToast('Compte créé ! Un e-mail de vérification a été envoyé par le serveur SMTP.', 'success');
      onLogin(newUser);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Échec de la création du compte.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'Cet e-mail est déjà associé à un compte.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = "La méthode de connexion par E-mail/Mot de passe n'est pas activée dans votre console Firebase Authentication. Veuillez l'activer sous l'onglet 'Sign-in method'.";
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!email) {
      setError('Veuillez renseigner votre adresse e-mail.');
      showToast('Veuillez renseigner votre adresse e-mail.', 'warning');
      setIsLoading(false);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const foundUser = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);
    const recipientName = foundUser ? foundUser.name : trimmedEmail.split('@')[0];

    try {
      // Dispatch password reset via backend SMTP server (service@dekel-dev.com)
      // Generates server-managed oobCode token & stores transaction log in DB
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

      const resetEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: trimmedEmail,
        subject: 'Réinitialisation de votre mot de passe - Dekel.Formation',
        body: `Bonjour ${recipientName},

Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.
Veuillez cliquer sur le lien ci-dessous pour configurer un nouveau mot de passe :

${generatedResetUrl}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(resetEmail);

      showToast('E-mail de réinitialisation avec jeton sécurisé envoyé par le serveur SMTP !', 'success');
      setMessage('Lien de réinitialisation généré et envoyé via le serveur SMTP (enregistré en base de données).');
    } catch (smtpErr: any) {
      console.error(smtpErr);
      const errMsg = smtpErr.message || 'Adresse e-mail non reconnue.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  if (mode === 'forgot') {
    return (
      <ResetPassword
        onBackToLogin={() => { setMode('login'); setError(''); setMessage(''); }}
        onSendEmail={onSendEmail}
        allUsers={allUsers}
      />
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass border border-white/10 shadow-2xl rounded-3xl overflow-hidden p-8 relative text-white">
        <div className="absolute top-0 left-0 w-full h-1.5 accent-gradient"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 p-3.5 rounded-2xl mb-3.5 border border-white/5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dekel.<span className="text-indigo-400">Formation</span></h1>
          <p className="text-slate-400 mt-1 text-sm">
            {mode === 'login' ? 'Connexion à votre espace de formation' : 'Rejoindre la plateforme en ligne'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>{message}</div>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adresse e-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sophie.eleve@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-450 text-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-450 mt-1">Astuce : Saisissez l'un des emails de démonstration ou créez un compte.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-450 text-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-450 mt-1">Dans ce prototype, le mot de passe est factice. Saisissez ce que vous souhaitez.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full accent-gradient hover:opacity-95 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-[#161a20] px-3 text-xs text-slate-400 font-medium">Ou continuer avec</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50 font-bold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Connexion Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.56 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.01 7.21 8.79 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.82-.07-1.6-.2-2.3H12v4.4h6.5c-.28 1.48-1.12 2.73-2.38 3.58l3.6 2.8c2.1-1.94 3.78-4.8 3.78-8.48z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.1 14.7c-.25-.75-.4-1.55-.4-2.7s.15-1.95.4-2.7L1.5 6.5C.54 8.42 0 10.65 0 13s.54 4.58 1.5 6.5l3.6-2.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.6-2.8c-1.1.74-2.52 1.18-4.36 1.18-3.21 0-5.99-2.17-6.9-5.26l-3.6 2.8C3.4 20.35 7.35 23 12 23z"
                    />
                  </svg>
                  <span>Se connecter avec Google</span>
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-white/10 text-sm text-slate-300">
              Pas encore inscrit ?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setMessage(''); }}
                className="text-indigo-400 font-bold hover:underline"
              >
                Créer un compte
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nom complet / Organisme</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-450 text-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adresse e-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-450 text-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-450 mt-1">
                Note : Si un formateur vous a déjà pré-inscrit avec cet email, vos cours apparaîtront directement ! (Section 4 - Cas 2)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-450 text-sm focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full accent-gradient hover:opacity-95 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-white/10 text-sm text-slate-300">
              Déjà membre ?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="text-indigo-400 font-bold hover:underline"
              >
                Se connecter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
