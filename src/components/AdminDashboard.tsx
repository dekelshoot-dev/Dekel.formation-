import React, { useState } from 'react';
import { User, UserRole, Course, Enrollment, SimulatedEmail } from '../types';
import { Shield, Users, BookOpen, Settings, Search, Plus, Trash2, Power, CheckCircle, XCircle, BarChart3, Mail, RefreshCw, Star, UserCheck } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  allCourses: Course[];
  allEnrollments: Enrollment[];
  onToggleCourseStatus: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateUserStatus: (userId: string, isDeactivated: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (user: User) => void;
  onSendEmail: (email: SimulatedEmail) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
}

export default function AdminDashboard({
  currentUser,
  allUsers,
  allCourses,
  allEnrollments,
  onToggleCourseStatus,
  onDeleteCourse,
  onUpdateUserStatus,
  onDeleteUser,
  onAddUser,
  onSendEmail,
  onUpdateUserRole
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'trainers' | 'courses' | 'students' | 'settings'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trainer form state
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [showAddTrainerForm, setShowAddTrainerForm] = useState(false);
  
  // Global settings state
  const [platformName, setPlatformName] = useState('Dekel.Formation');
  const [supportEmail, setSupportEmail] = useState('support@dekel-formation.com');
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Filter lists
  const trainers = allUsers.filter(u => u.role === 'trainer');
  const students = allUsers.filter(u => u.role === 'student');

  const filteredTrainers = trainers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = allCourses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.trainerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Math stats
  const totalCourses = allCourses.length;
  const publishedCourses = allCourses.filter(c => c.status === 'published').length;
  const draftCourses = totalCourses - publishedCourses;
  const totalStudents = students.length;
  const totalTrainers = trainers.length;
  const totalInscriptions = allEnrollments.filter(e => e.status === 'active').length;

  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerName || !newTrainerEmail) return;

    const emailTrimmed = newTrainerEmail.trim().toLowerCase();
    if (allUsers.some(u => u.email.toLowerCase() === emailTrimmed)) {
      alert('Cet email est déjà enregistré !');
      return;
    }

    const newTrainer: User = {
      id: `u-${Date.now()}`,
      email: emailTrimmed,
      name: newTrainerName,
      role: 'trainer',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    onAddUser(newTrainer);
    
    // Send welcome email simulation
    const welEmail: SimulatedEmail = {
      id: `em-${Date.now()}`,
      to: emailTrimmed,
      subject: `Bienvenue en tant que Formateur sur ${platformName}`,
      body: `Bonjour ${newTrainerName},

L'administrateur de ${platformName} vient de vous créer un compte Formateur.
Vous pouvez vous connecter dès à présent avec votre adresse email pour créer vos modules et chapitres de cours.

Email : ${emailTrimmed}

Bonnes formations !`,
      sentAt: new Date().toISOString()
    };
    onSendEmail(welEmail);

    setNewTrainerName('');
    setNewTrainerEmail('');
    setShowAddTrainerForm(false);
  };

  const saveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-2xl border border-red-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Espace Administrateur</h1>
            <p className="text-xs text-slate-500">Gérez l'ensemble des formateurs, élèves, formations et paramètres système.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl self-start text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span>Connecté en tant que: {currentUser.name}</span>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Formations totales</p>
            <p className="text-lg font-black text-slate-900">{totalCourses}</p>
            <p className="text-[10px] text-slate-500">{publishedCourses} publiées / {draftCourses} brouillons</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Formateurs</p>
            <p className="text-lg font-black text-slate-900">{totalTrainers}</p>
            <p className="text-[10px] text-slate-500">Instructeurs indépendants</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Étudiants totaux</p>
            <p className="text-lg font-black text-slate-900">{totalStudents}</p>
            <p className="text-[10px] text-slate-500">Inscrits à la plateforme</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Inscriptions actives</p>
            <p className="text-lg font-black text-slate-900">{totalInscriptions}</p>
            <p className="text-[10px] text-slate-500">Moyenne: {(totalInscriptions / (totalCourses || 1)).toFixed(1)} / cours</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side Navigation Menu */}
        <div className="md:w-60 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm self-start space-y-1">
          <button
            onClick={() => { setActiveTab('stats'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'stats' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-red-500" />
            <span>Tableau de bord</span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-red-500" />
            <span>Gestion des utilisateurs</span>
          </button>
          <button
            onClick={() => { setActiveTab('trainers'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'trainers' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-red-500" />
            <span>Gérer les Formateurs</span>
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'courses' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-red-500" />
            <span>Toutes les formations</span>
          </button>
          <button
            onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'students' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-red-500" />
            <span>Gérer les Étudiants</span>
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'settings' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 text-red-500" />
            <span>Paramètres Globaux</span>
          </button>
        </div>

        {/* Right Side Content Pane */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
          
          {/* Active search bar when relevant */}
          {activeTab !== 'stats' && activeTab !== 'settings' && (
            <div className="mb-5 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Rechercher par nom, email, cours...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all"
                />
              </div>
              {activeTab === 'trainers' && (
                <button
                  onClick={() => setShowAddTrainerForm(!showAddTrainerForm)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Formateur</span>
                </button>
              )}
            </div>
          )}

          {/* Tab Content: Stats */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-900">Vue d'ensemble analytique</h2>
                <p className="text-xs text-slate-400">Statistiques globales calculées en temps réel.</p>
              </div>

              {/* Graphical simulation of database state */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Répartition des formations</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Publiées</span>
                        <span className="font-semibold text-slate-700">{publishedCourses} ({totalCourses > 0 ? Math.round((publishedCourses/totalCourses)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${totalCourses > 0 ? (publishedCourses/totalCourses)*100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Brouillons</span>
                        <span className="font-semibold text-slate-700">{draftCourses} ({totalCourses > 0 ? Math.round((draftCourses/totalCourses)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-slate-400 h-full rounded-full" style={{ width: `${totalCourses > 0 ? (draftCourses/totalCourses)*100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Activité de la plateforme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Compte le plus actif</p>
                      <p className="text-xs font-black text-slate-800 mt-1 truncate">Jean Dupont</p>
                      <p className="text-[9px] text-slate-500">2 formations</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Élève le plus progressé</p>
                      <p className="text-xs font-black text-slate-800 mt-1 truncate">Sophie Martin</p>
                      <p className="text-[9px] text-slate-500">66% de progression</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System summary */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-950 flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Informations administrateur</p>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Vous visualisez le système avec des privilèges globaux. Vous pouvez publier de nouvelles formations rédigées par n'importe quel instructeur, suspendre des comptes formateurs ou étudiants récalcitrants, ou effacer l'historique d'inscriptions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Users Management (Section 2 & 3) */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Gestion des utilisateurs ({allUsers.length})</h2>
                <p className="text-xs text-slate-400">Recherchez un utilisateur, consultez ses informations et modifiez son rôle.</p>
              </div>

              <div className="border border-slate-150 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                      <th className="px-4 py-3">Utilisateur</th>
                      <th className="px-4 py-3">Date d'inscription</th>
                      <th className="px-4 py-3">Rôle actuel</th>
                      <th className="px-4 py-3">Nouveau rôle</th>
                      <th className="px-4 py-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {allUsers
                      .filter(u => 
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">Aucun utilisateur trouvé.</td>
                      </tr>
                    ) : (
                      allUsers
                        .filter(u => 
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(u => {
                          const isDeactivated = u.status === 'deactivated';
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3.5 flex items-center gap-3">
                                <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                <div>
                                  <p className="font-bold text-slate-800">{u.name}</p>
                                  <p className="text-[10px] text-slate-400">{u.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-500">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : 'Non renseignée'}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  u.role === 'admin' 
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : u.role === 'trainer'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {u.role === 'admin' ? 'Administrateur' : u.role === 'trainer' ? 'Formateur' : 'Étudiant'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <select
                                  value={u.role}
                                  onChange={(e) => onUpdateUserRole(u.id, e.target.value as any)}
                                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all"
                                >
                                  <option value="student">Étudiant</option>
                                  <option value="trainer">Formateur</option>
                                  <option value="admin">Administrateur</option>
                                </select>
                              </td>
                              <td className="px-4 py-3.5 text-right space-x-1.5">
                                {isDeactivated ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                                    <XCircle className="w-3 h-3" /> Bloqué
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                                    <CheckCircle className="w-3 h-3" /> Actif
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Trainers */}
          {activeTab === 'trainers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-slate-900">Formateurs inscrits ({filteredTrainers.length})</h2>
                  <p className="text-xs text-slate-400">Suspendre ou ajouter des formateurs de la plateforme.</p>
                </div>
              </div>

              {/* Add form */}
              {showAddTrainerForm && (
                <form onSubmit={handleCreateTrainer} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Créer une fiche Formateur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nom complet</label>
                      <input
                        type="text"
                        required
                        value={newTrainerName}
                        onChange={(e) => setNewTrainerName(e.target.value)}
                        placeholder="Ex: David Laroche"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Adresse e-mail</label>
                      <input
                        type="email"
                        required
                        value={newTrainerEmail}
                        onChange={(e) => setNewTrainerEmail(e.target.value)}
                        placeholder="david.formateur@gmail.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddTrainerForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow"
                    >
                      Ajouter le formateur
                    </button>
                  </div>
                </form>
              )}

              {/* Trainers Table */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                      <th className="px-4 py-3">Formateur</th>
                      <th className="px-4 py-3">Inscrit le</th>
                      <th className="px-4 py-3">Formations</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTrainers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">Aucun formateur trouvé.</td>
                      </tr>
                    ) : (
                      filteredTrainers.map(t => {
                        const count = allCourses.filter(c => c.trainerId === t.id).length;
                        const isDeactivated = t.status === 'deactivated';

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5 flex items-center gap-3">
                              <img src={t.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-800">{t.name}</p>
                                <p className="text-[10px] text-slate-400">{t.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-700">
                              {count} cours
                            </td>
                            <td className="px-4 py-3.5">
                              {isDeactivated ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                                  <XCircle className="w-3 h-3" /> Suspendu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                                  <CheckCircle className="w-3 h-3" /> Actif
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1.5">
                              <button
                                onClick={() => onUpdateUserStatus(t.id, !isDeactivated)}
                                title={isDeactivated ? "Activer l'accès" : "Désactiver l'accès"}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isDeactivated 
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteUser(t.id)}
                                title="Supprimer définitivement"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Courses */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Toutes les formations de la plateforme ({filteredCourses.length})</h2>
                <p className="text-xs text-slate-400">Modifiez le statut de visibilité ou supprimez n'importe quel cours.</p>
              </div>

              <div className="border border-slate-150 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                      <th className="px-4 py-3">Formation</th>
                      <th className="px-4 py-3">Formateur</th>
                      <th className="px-4 py-3">Élèves</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">Aucun cours trouvé.</td>
                      </tr>
                    ) : (
                      filteredCourses.map(c => {
                        const studentsCount = allEnrollments.filter(e => e.courseId === c.id && e.status === 'active').length;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5 flex items-center gap-3">
                              <img src={c.coverImage} className="w-12 h-8 rounded object-cover border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-800">{c.title}</p>
                                <p className="text-[10px] text-slate-400">{c.type} • {c.price.toLocaleString('fr-FR')} XAF</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 font-medium">
                              {c.trainerName}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-700">
                              {studentsCount} élèves
                            </td>
                            <td className="px-4 py-3.5">
                              {c.status === 'published' ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                                  Publié
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                                  Brouillon
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1.5">
                              <button
                                onClick={() => onToggleCourseStatus(c.id)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded border transition-all ${
                                  c.status === 'published'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {c.status === 'published' ? 'Passer en Brouillon' : 'Publier'}
                              </button>
                              <button
                                onClick={() => onDeleteCourse(c.id)}
                                title="Supprimer le cours"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors inline-flex align-middle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Students */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Étudiants de la plateforme ({filteredStudents.length})</h2>
                <p className="text-xs text-slate-400">Suspendez les accès globaux d'un élève ou supprimez sa fiche.</p>
              </div>

              <div className="border border-slate-150 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                      <th className="px-4 py-3">Étudiant</th>
                      <th className="px-4 py-3">Inscrit le</th>
                      <th className="px-4 py-3">Inscriptions de cours</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">Aucun étudiant trouvé.</td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => {
                        const enrollCount = allEnrollments.filter(e => e.studentEmail.toLowerCase() === s.email.toLowerCase() && e.status === 'active').length;
                        const isDeactivated = s.status === 'deactivated';

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5 flex items-center gap-3">
                              <img src={s.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-800">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 font-semibold">
                              {enrollCount} cours actif(s)
                            </td>
                            <td className="px-4 py-3.5">
                              {isDeactivated ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                                  <XCircle className="w-3 h-3" /> Bloqué
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                                  <CheckCircle className="w-3 h-3" /> Actif
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1.5">
                              <button
                                onClick={() => onUpdateUserStatus(s.id, !isDeactivated)}
                                title={isDeactivated ? "Réactiver l'élève" : "Suspendre l'élève"}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isDeactivated 
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteUser(s.id)}
                                title="Supprimer définitivement"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-900">Paramètres système de la plateforme</h2>
                <p className="text-xs text-slate-400">Configurez l'apparence et les règles générales de la marque blanche.</p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nom de l'application</label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email de contact support</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Autoriser l'auto-inscription</p>
                    <p className="text-[10px] text-slate-400">Permet aux étudiants de créer librement leur propre compte.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowPublicSignup}
                    onChange={(e) => setAllowPublicSignup(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveSettings}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-red-50 flex items-center gap-1.5"
                >
                  <Settings className="w-4 h-4" />
                  <span>Enregistrer les paramètres</span>
                </button>

                {isSaved && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Les paramètres ont été mis à jour avec succès.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
