import React, { useState } from 'react';
import { User, UserRole, SimulatedEmail } from '../types';
import { Mail, Key, User as UserIcon, BookOpen, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

interface AuthProps {
  allUsers: User[];
  onLogin: (user: User) => void;
  onAddUser: (user: User) => void;
  onSendEmail: (email: SimulatedEmail) => void;
}

export default function Auth({ allUsers, onLogin, onAddUser, onSendEmail }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Simulated
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Veuillez saisir votre adresse e-mail.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (found) {
      onLogin(found);
    } else {
      setError(`Adresse email non enregistrée. Vous pouvez créer un compte avec cet email en cliquant sur "S'inscrire".`);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !name) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (found) {
      setError('Cet email est déjà associé à un compte.');
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      email: trimmedEmail,
      name,
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    onAddUser(newUser);

    // Send Simulated Welcome Email (Section 16)
    const welcomeEmail: SimulatedEmail = {
      id: `em-${Date.now()}`,
      to: trimmedEmail,
      subject: `Création de compte réussie - Plateforme Dekel.Formation`,
      body: `Bonjour ${name},

Bienvenue sur la plateforme de formation Dekel.Formation !
Votre compte en tant qu'Étudiant a été créé avec succès.

Identifiant : ${trimmedEmail}
Vous pouvez dès à présent accéder à votre espace de travail.

Cordialement,
L'équipe Dekel.Formation`,
      sentAt: new Date().toISOString()
    };
    onSendEmail(welcomeEmail);

    onLogin(newUser);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Veuillez renseigner votre adresse e-mail.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const found = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (found) {
      // Send Simulated Email (Section 16)
      const resetEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: trimmedEmail,
        subject: 'Réinitialisation de votre mot de passe',
        body: `Bonjour ${found.name},

Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.
Veuillez cliquer sur le lien ci-dessous pour configurer un nouveau mot de passe :

https://dekel-formation.com/reset-password?token=simulated_token_${Date.now()}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(resetEmail);
      setMessage('Un e-mail de réinitialisation a été envoyé (voir la section "Logs Emails" en bas à gauche pour consulter l\'email envoyé).');
    } else {
      setError('Aucun compte n\'est associé à cette adresse e-mail.');
    }
  };

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
            {mode === 'login' && 'Connexion à votre espace de formation'}
            {mode === 'register' && 'Rejoindre la plateforme en ligne'}
            {mode === 'forgot' && 'Récupérer l\'accès à votre compte'}
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
              className="w-full accent-gradient hover:opacity-95 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-sm cursor-pointer"
            >
              <span>Se connecter</span>
              <ChevronRight className="w-4 h-4" />
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
              className="w-full accent-gradient hover:opacity-95 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-sm cursor-pointer"
            >
              <span>Créer mon compte</span>
              <ChevronRight className="w-4 h-4" />
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

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Saisissez votre e-mail</label>
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
            </div>

            <button
              type="submit"
              className="w-full accent-gradient hover:opacity-95 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-sm cursor-pointer"
            >
              <span>Envoyer les instructions</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-4 border-t border-white/10 text-sm text-slate-300 flex justify-between items-center">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="text-indigo-400 hover:underline font-bold"
              >
                Retour à la connexion
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setMessage(''); }}
                className="text-slate-400 hover:underline"
              >
                Créer un compte
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
