import { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Save, Image, Phone, Mail, FileText, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { updatePassword, updateEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { showToast } from './Toast';

interface UserProfileProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

export default function UserProfile({ currentUser, onUpdateUser }: UserProfileProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png');
  const [name, setName] = useState(currentUser.name || '');
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const user = auth.currentUser;
      if (user) {
        // 1. Try to update password if filled
        if (password.trim().length > 0) {
          if (password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
          }
          try {
            await updatePassword(user, password);
          } catch (authErr: any) {
            if (authErr.code === 'auth/requires-recent-login') {
              throw new Error('Pour changer votre mot de passe, vous devez vous reconnecter récemment pour des raisons de sécurité.');
            }
            throw authErr;
          }
        }

        // 2. Try to update email in Firebase Auth if changed
        if (email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
          try {
            await updateEmail(user, email.trim().toLowerCase());
          } catch (authErr: any) {
            if (authErr.code === 'auth/requires-recent-login') {
              throw new Error('Pour changer votre adresse e-mail, vous devez vous reconnecter récemment pour des raisons de sécurité.');
            }
            throw authErr;
          }
        }
      }

      const updated: User = {
        ...currentUser,
        name,
        firstName,
        phone,
        email: email.trim().toLowerCase(),
        bio,
        avatarUrl
      };
      
      onUpdateUser(updated);
      setSuccess(true);
      setPassword('');
      showToast('Profil enregistré avec succès !', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Une erreur est survenue lors de la mise à jour.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto glass border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-white space-y-6">
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-2xl border border-indigo-500/20">
          <UserIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white">Mon Profil</h1>
          <p className="text-xs text-slate-400">Gérez vos informations personnelles et votre photo de profil.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Vos informations de profil ont été enregistrées avec succès !</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in font-sans">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Avatar Display & Edit */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
          <img 
            src={avatarUrl} 
            alt="Aperçu avatar" 
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/30 shadow-md"
            onError={() => setAvatarUrl('https://cdn-icons-png.flaticon.com/512/3177/3177465.png')}
          />
          <div className="flex-1 w-full space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Photo de Profil (URL)</label>
            <div className="relative">
              <Image className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Prénom */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex: Sophie"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans"
            />
          </div>

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Nom de famille</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Martin"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Adresse E-mail</label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Numéro de téléphone</label>
            <div className="relative">
              <Phone className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +221 77 123 45 67"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Biographie / Présentation</label>
          <div className="relative">
            <FileText className="absolute top-3 left-3 text-slate-400 w-4 h-4" />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez-nous de vous..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans resize-none"
            ></textarea>
          </div>
        </div>

        {/* Mot de passe via Firebase Auth */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Nouveau Mot de passe (Firebase Auth)</label>
          <div className="relative">
            <Lock className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Laisser vide pour ne pas modifier"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2 text-xs text-white outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Doit contenir au moins 6 caractères.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-5 rounded-xl text-white text-xs font-bold transition-all shadow-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5 font-sans disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Enregistrement...' : 'Enregistrer mon profil'}</span>
        </button>

      </form>
    </div>
  );
}
