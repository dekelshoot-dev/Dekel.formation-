import { useState } from 'react';
import { User } from '../types';
import { Shield, GraduationCap, Users, RefreshCw, X } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User | null) => void;
}

export default function RoleSwitcher({ currentUser, allUsers, onSelectUser }: RoleSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract trainers, admins, students
  const admins = allUsers.filter(u => u.role === 'admin');
  const trainers = allUsers.filter(u => u.role === 'trainer');
  const students = allUsers.filter(u => u.role === 'student');

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        title="Ouvrir le simulateur de rôles"
        className="fixed bottom-4 right-4 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2.5 shadow-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer group"
      >
        <RefreshCw className="w-3.5 h-3.5 text-white group-hover:rotate-45 transition-transform" />
        <span className="text-[10px] font-bold pr-1">Simulateur</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 glass-light backdrop-blur-xl shadow-2xl rounded-2xl border border-white/15 p-4 max-w-sm w-80 text-xs text-white transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
          <span>Simulateur de Rôle (Évaluation)</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white cursor-pointer"
          title="Masquer le simulateur"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-slate-400 mb-3 text-[11px] leading-relaxed">
        Cliquez sur un profil pour changer de rôle instantanément et tester les différents espaces de la plateforme.
      </p>

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {/* Admins */}
        <div>
          <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-400" />
            <span>Administrateur</span>
          </div>
          {admins.map(u => (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
              className={`w-full text-left p-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                currentUser?.id === u.id
                  ? 'bg-red-500/10 border border-red-500/20 text-red-300 font-medium'
                  : 'hover:bg-white/5 border border-transparent text-slate-300'
              }`}
            >
              <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
              <div className="truncate">
                <p className="font-medium">{u.name}</p>
                <p className="text-[10px] text-slate-450 truncate">{u.email}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Trainers */}
        <div>
          <div className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-455" />
            <span>Formateurs ({trainers.length})</span>
          </div>
          <div className="space-y-1">
            {trainers.map(u => (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`w-full text-left p-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  currentUser?.id === u.id
                    ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium'
                    : 'hover:bg-white/5 border border-transparent text-slate-300'
                }`}
              >
                <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                <div className="truncate">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-[10px] text-slate-450 truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Students */}
        <div>
          <div className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1 flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-emerald-455" />
            <span>Étudiants ({students.length})</span>
          </div>
          <div className="space-y-1">
            {students.map(u => (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`w-full text-left p-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  currentUser?.id === u.id
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium'
                    : 'hover:bg-white/5 border border-transparent text-slate-300'
                }`}
              >
                <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                <div className="truncate">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-[10px] text-slate-450 truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span>Session active: <strong className="text-slate-200">{currentUser ? currentUser.role : 'Visiteur'}</strong></span>
        {currentUser && (
          <button
            onClick={() => onSelectUser(null)}
            className="text-slate-400 hover:text-red-400 font-semibold cursor-pointer"
          >
            Se déconnecter
          </button>
        )}
      </div>
    </div>
  );
}
