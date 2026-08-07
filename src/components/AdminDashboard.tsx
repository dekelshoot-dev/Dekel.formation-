import React, { useState } from 'react';
import { User, UserRole, Course, Enrollment, SimulatedEmail, CustomHtmlPage, FooterConfig, DEFAULT_FOOTER_CONFIG, Module, Chapter } from '../types';
import { Shield, Users, BookOpen, Settings, Search, Plus, Trash2, Power, CheckCircle, XCircle, BarChart3, Mail, RefreshCw, Star, UserCheck, User as UserIcon, X, Phone, FileText, Play, Menu, Tag, FileCode, Globe, LayoutTemplate, Link as LinkIcon, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { showToast } from './Toast';
import TransactionalEmailDashboard from './TransactionalEmailDashboard';
import CustomPagesManager from './CustomPagesManager';
import EnrollmentGrowthChart from './EnrollmentGrowthChart';
import { ConfirmModal } from './ConfirmModal';
import { emailTriggers } from '../services/emailClient';
import { clearAllBrowserCaches, APP_BUILD_ID } from '../services/cacheManager';

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  allCourses: Course[];
  allEnrollments: Enrollment[];
  allModules?: Module[];
  allChapters?: Chapter[];
  categories?: string[];
  customPages?: CustomHtmlPage[];
  footerConfig?: FooterConfig;
  onSaveFooterConfig?: (config: FooterConfig) => void;
  onAddCategory?: (cat: string) => void;
  onDeleteCategory?: (cat: string) => void;
  onToggleCourseStatus: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateUserStatus: (userId: string, isDeactivated: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (user: User) => void;
  onSendEmail: (email: SimulatedEmail) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onUpdateUser: (user: User) => void;
  onPreviewCourse?: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onSaveCustomPage?: (page: CustomHtmlPage) => void;
  onDeleteCustomPage?: (pageId: string) => void;
  onPreviewCustomPage?: (page: CustomHtmlPage) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AdminDashboard({
  currentUser,
  allUsers,
  allCourses,
  allEnrollments,
  allModules = [],
  allChapters = [],
  categories = ['Développement', 'E-commerce', 'Design', 'Marketing', 'Montage Vidéo', 'Miniatures', 'Flyers'],
  customPages = [],
  footerConfig = DEFAULT_FOOTER_CONFIG,
  onSaveFooterConfig,
  onAddCategory,
  onDeleteCategory,
  onToggleCourseStatus,
  onDeleteCourse,
  onUpdateUserStatus,
  onDeleteUser,
  onAddUser,
  onSendEmail,
  onUpdateUserRole,
  onUpdateUser,
  onPreviewCourse,
  onEditCourse,
  onSaveCustomPage,
  onDeleteCustomPage,
  onPreviewCustomPage,
  initialTab,
  onTabChange
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'trainers' | 'courses' | 'students' | 'emails' | 'custom-pages' | 'settings' | 'profile'>(
    (initialTab as any) || 'stats'
  );

  const handleExportCourseJSON = (courseToExport: Course) => {
    const courseModules = (allModules || [])
      .filter(m => m.courseId === courseToExport.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const courseChapters = (allChapters || [])
      .filter(c => c.courseId === courseToExport.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const structuredModules = courseModules.map(mod => {
      const modChapters = courseChapters.filter(ch => ch.moduleId === mod.id);
      return {
        id: mod.id,
        title: mod.title,
        order: mod.order,
        description: mod.description,
        chapters: modChapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          order: ch.order,
          videoSource: ch.videoSource,
          videoUrl: ch.videoUrl,
          richText: ch.richText,
          imageUrl: ch.imageUrl,
          pdfUrl: ch.pdfUrl,
          downloadableFiles: ch.downloadableFiles || [],
          externalLinks: ch.externalLinks || [],
          linkButton: ch.linkButton,
          isFree: ch.isFree,
          duration: ch.duration,
          status: ch.status
        }))
      };
    });

    const exportData = {
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      format: 'dekel_formation_export',
      course: courseToExport,
      modules: structuredModules,
      rawModules: courseModules,
      rawChapters: courseChapters,
      summary: {
        totalModules: courseModules.length,
        totalChapters: courseChapters.length
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = courseToExport.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 35);

    a.href = url;
    a.download = `formation_${safeTitle || 'export'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Export JSON complet de "${courseToExport.title}" téléchargé avec succès !`, 'success');
  };

  React.useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleTabClick = (tab: 'stats' | 'users' | 'trainers' | 'courses' | 'students' | 'emails' | 'custom-pages' | 'settings' | 'profile') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };
  
  // Category input state for admin
  const [adminCatInput, setAdminCatInput] = useState('');
  
  // Trainer form state
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [showAddTrainerForm, setShowAddTrainerForm] = useState(false);

  // Admin creation form state (email only)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  
  // Global settings state
  const [platformName, setPlatformName] = useState('Dekel.Formation');
  const [supportEmail, setSupportEmail] = useState('support@dekel-formation.com');
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Footer Settings State
  const [footerForm, setFooterForm] = useState<FooterConfig>(footerConfig);
  const [newUsefulLabel, setNewUsefulLabel] = useState('');
  const [newUsefulUrl, setNewUsefulUrl] = useState('');
  const [newLegalLabel, setNewLegalLabel] = useState('');
  const [newLegalUrl, setNewLegalUrl] = useState('');
  const [isSavingFooter, setIsSavingFooter] = useState(false);

  React.useEffect(() => {
    if (footerConfig) {
      setFooterForm(footerConfig);
    }
  }, [footerConfig]);

  const handleSaveFooter = async () => {
    setIsSavingFooter(true);
    let updatedForm = { ...footerForm };

    // Automatically append useful link if user typed both label and URL but forgot to click '+'
    if (newUsefulLabel.trim() && newUsefulUrl.trim()) {
      updatedForm = {
        ...updatedForm,
        usefulLinks: [...(updatedForm.usefulLinks || []), { label: newUsefulLabel.trim(), url: newUsefulUrl.trim() }]
      };
      setNewUsefulLabel('');
      setNewUsefulUrl('');
    }

    // Automatically append legal link if user typed both label and URL but forgot to click '+'
    if (newLegalLabel.trim() && newLegalUrl.trim()) {
      updatedForm = {
        ...updatedForm,
        legalLinks: [...(updatedForm.legalLinks || []), { label: newLegalLabel.trim(), url: newLegalUrl.trim() }]
      };
      setNewLegalLabel('');
      setNewLegalUrl('');
    }

    setFooterForm(updatedForm);

    try {
      if (onSaveFooterConfig) {
        await onSaveFooterConfig(updatedForm);
      }
      showToast('Configuration du Footer enregistrée avec succès !', 'success');
    } catch (err) {
      console.error('Erreur sauvegarde footer:', err);
      showToast('Erreur lors de l\'enregistrement de la configuration du footer', 'error');
    } finally {
      setIsSavingFooter(false);
    }
  };

  // Edit Profile Form
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileFirstName, setProfileFirstName] = useState(currentUser.firstName || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email || '');
  const [profileBio, setProfileBio] = useState(currentUser.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatarUrl || '');
  const [profileTheme, setProfileTheme] = useState(currentUser.theme || 'theme-nature-dark');
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);

  React.useEffect(() => {
    setProfileName(currentUser.name);
    setProfileFirstName(currentUser.firstName || '');
    setProfilePhone(currentUser.phone || '');
    setProfileEmail(currentUser.email || '');
    setProfileBio(currentUser.bio || '');
    setProfileAvatar(currentUser.avatarUrl || '');
    setProfileTheme(currentUser.theme || 'theme-nature-dark');
  }, [currentUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name: profileName,
      firstName: profileFirstName,
      phone: profilePhone,
      email: profileEmail,
      bio: profileBio,
      avatarUrl: profileAvatar,
      theme: profileTheme
    });
    showToast('Vos informations de profil ont été mises à jour !', 'success');
  };

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
    const emailTrimmed = newTrainerEmail.trim().toLowerCase();
    if (!emailTrimmed) return;

    // Check if user already exists
    const existingUser = allUsers.find(u => u.email.toLowerCase() === emailTrimmed);

    if (existingUser) {
      // 1. User ALREADY HAS AN ACCOUNT
      if (existingUser.role !== 'trainer') {
        onUpdateUserRole(existingUser.id, 'trainer');
      }

      // Send real transactional notifications
      emailTriggers.userAdminCreated(emailTrimmed, existingUser.name || 'Formateur', 'Formateur');
      emailTriggers.userPromotedTrainer(emailTrimmed, existingUser.name || 'Formateur');

      // Send simulated notification email
      const promoEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: emailTrimmed,
        subject: `Accès Formateur accordé sur ${platformName}`,
        body: `Bonjour ${existingUser.name || 'Utilisateur'},

Vos privilèges ont été mis à jour sur ${platformName}.
Vous disposez désormais du rôle de Formateur avec la possibilité d'ajouter et de gérer vos formations.

Email : ${emailTrimmed}

Connectez-vous à votre espace pour accéder à votre tableau de bord Formateur.`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(promoEmail);

      showToast(`L'utilisateur possède déjà un compte. Son rôle a été mis à jour en Formateur et une notification par mail lui a été envoyée !`, 'success');
    } else {
      // 2. User DOES NOT HAVE AN ACCOUNT
      const defaultName = emailTrimmed.split('@')[0];
      const newTrainer: User = {
        id: `u-${Date.now()}`,
        email: emailTrimmed,
        name: defaultName,
        role: 'trainer',
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png',
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      onAddUser(newTrainer);

      // Send real transactional notifications with account creation link
      const createAccountUrl = `${window.location.origin}?mode=signUp&email=${encodeURIComponent(emailTrimmed)}`;
      emailTriggers.userAdminCreated(emailTrimmed, defaultName, 'Formateur');
      emailTriggers.verifyEmail(emailTrimmed, defaultName, createAccountUrl);

      // Send simulated notification email
      const inviteEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: emailTrimmed,
        subject: `Invitation : Créez votre compte Formateur sur ${platformName}`,
        body: `Bonjour,

Vous avez été invité à devenir Formateur sur la plateforme ${platformName}.

Comme vous n'avez pas encore de compte, veuillez cliquer sur le lien ci-dessous pour créer votre compte et définir votre mot de passe :

${createAccountUrl}

Adresse e-mail attribuée : ${emailTrimmed}

À très bientôt sur ${platformName} !`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(inviteEmail);

      showToast(`Invitation envoyée ! Un e-mail contenant le lien pour créer son compte formateur a été envoyé à ${emailTrimmed}.`, 'success');
    }

    setNewTrainerEmail('');
    setShowAddTrainerForm(false);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = newAdminEmail.trim().toLowerCase();
    if (!emailTrimmed) return;

    // Check if user already exists
    const existingUser = allUsers.find(u => u.email.toLowerCase() === emailTrimmed);

    if (existingUser) {
      // 1. User ALREADY HAS AN ACCOUNT
      if (existingUser.role !== 'admin') {
        onUpdateUserRole(existingUser.id, 'admin');
      }

      // Send real transactional notifications
      emailTriggers.userAdminCreated(emailTrimmed, existingUser.name || 'Administrateur', 'Administrateur');
      emailTriggers.userPromotedAdmin(emailTrimmed, existingUser.name || 'Administrateur');

      // Send simulated notification email
      const promoEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: emailTrimmed,
        subject: `Accès Administrateur accordé sur ${platformName}`,
        body: `Bonjour ${existingUser.name || 'Utilisateur'},

Vos privilèges ont été mis à jour sur ${platformName}.
Vous disposez désormais du rôle d'Administrateur avec un accès complet à la gestion de la plateforme.

Email : ${emailTrimmed}

Connectez-vous à votre espace pour accéder à votre tableau de bord d'administration.`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(promoEmail);

      showToast(`L'utilisateur possède déjà un compte. Son rôle a été mis à jour en Administrateur et une notification par mail lui a été envoyée !`, 'success');
    } else {
      // 2. User DOES NOT HAVE AN ACCOUNT
      const defaultName = emailTrimmed.split('@')[0];
      const newAdmin: User = {
        id: `u-${Date.now()}`,
        email: emailTrimmed,
        name: defaultName,
        role: 'admin',
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png',
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      onAddUser(newAdmin);

      // Send real transactional notifications with account creation link
      const createAccountUrl = `${window.location.origin}?mode=signUp&email=${encodeURIComponent(emailTrimmed)}`;
      emailTriggers.userAdminCreated(emailTrimmed, defaultName, 'Administrateur');
      emailTriggers.verifyEmail(emailTrimmed, defaultName, createAccountUrl);

      // Send simulated notification email
      const inviteEmail: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: emailTrimmed,
        subject: `Invitation : Créez votre compte Administrateur sur ${platformName}`,
        body: `Bonjour,

Vous avez été invité à devenir Administrateur sur la plateforme ${platformName}.

Comme vous n'avez pas encore de compte, veuillez cliquer sur le lien ci-dessous pour créer votre compte et définir votre mot de passe :

${createAccountUrl}

Adresse e-mail attribuée : ${emailTrimmed}

À très bientôt sur ${platformName} !`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(inviteEmail);

      showToast(`Invitation envoyée ! Un e-mail contenant le lien pour créer son compte administrateur a été envoyé à ${emailTrimmed}.`, 'success');
    }

    setNewAdminEmail('');
    setShowAddAdminForm(false);
  };

  const saveSettings = () => {
    setIsSaved(true);
    showToast('Paramètres système enregistrés !', 'success');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Mobile Navigation Drawer for Administrators */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white text-slate-800 border-r border-slate-200 p-5 shadow-2xl flex flex-col justify-between animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-red-50 text-red-600 p-1.5 rounded-xl border border-red-100">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Administration</p>
                    <p className="text-[9px] text-slate-400">Navigation mobile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('stats'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'stats' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-red-500" />
                  <span>Tableau de bord</span>
                </button>

                <button
                  onClick={() => { setActiveTab('users'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'users' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-red-500" />
                  <span>Gestion des utilisateurs</span>
                </button>

                <button
                  onClick={() => { setActiveTab('trainers'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'trainers' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-red-500" />
                  <span>Gérer les Formateurs</span>
                </button>

                <button
                  onClick={() => { setActiveTab('courses'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'courses' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-red-500" />
                  <span>Toutes les formations</span>
                </button>

                <button
                  onClick={() => { setActiveTab('students'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'students' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-red-500" />
                  <span>Gérer les Étudiants</span>
                </button>

                <button
                  onClick={() => { setActiveTab('emails'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'emails' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>E-mails Transactionnels</span>
                </button>

                <button
                  onClick={() => { setActiveTab('custom-pages'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'custom-pages' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>Pages HTML Personnalisées</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'settings' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-4 h-4 text-red-500" />
                  <span>Paramètres Globaux</span>
                </button>

                <button
                  onClick={() => { setActiveTab('profile'); setSearchQuery(''); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'profile' ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-red-500" />
                  <span>Mon Profil</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <span className="text-[10px] text-slate-400 font-medium">Dekel.Formation • Administrateur</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1a1e24] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger Menu on Mobile */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/5 transition-all cursor-pointer mr-1 shrink-0"
            title="Ouvrir le menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>

          <div className="bg-red-500/15 text-red-400 p-2.5 rounded-2xl border border-red-500/25 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-100 truncate">Espace Administrateur</h1>
            <p className="text-xs text-slate-400 truncate">Gérez l'ensemble des formateurs, élèves, formations et paramètres système.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl self-start text-xs text-slate-300 font-medium shrink-0">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="truncate">Connecté en tant que: {currentUser.name}</span>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1e24] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 hover:scale-[1.015] hover:border-indigo-500/30 transition-all duration-200 overflow-hidden">
          <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-xl shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium truncate">Formations totales</p>
            <p className="text-lg font-black text-slate-100 truncate">{totalCourses}</p>
            <p className="text-[10px] text-slate-400 truncate">{publishedCourses} publiées / {draftCourses} brouillons</p>
          </div>
        </div>

        <div className="bg-[#1a1e24] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 hover:scale-[1.015] hover:border-sky-500/30 transition-all duration-200 overflow-hidden">
          <div className="p-2.5 bg-sky-500/15 text-sky-400 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium truncate">Formateurs</p>
            <p className="text-lg font-black text-slate-100 truncate">{totalTrainers}</p>
            <p className="text-[10px] text-slate-400 truncate">Instructeurs indépendants</p>
          </div>
        </div>

        <div className="bg-[#1a1e24] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 hover:scale-[1.015] hover:border-emerald-500/30 transition-all duration-200 overflow-hidden">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium truncate">Étudiants totaux</p>
            <p className="text-lg font-black text-slate-100 truncate">{totalStudents}</p>
            <p className="text-[10px] text-slate-400 truncate">Inscrits à la plateforme</p>
          </div>
        </div>

        <div className="bg-[#1a1e24] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 hover:scale-[1.015] hover:border-purple-500/30 transition-all duration-200 overflow-hidden">
          <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-xl shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium truncate">Inscriptions actives</p>
            <p className="text-lg font-black text-slate-100 truncate">{totalInscriptions}</p>
            <p className="text-[10px] text-slate-400 truncate">Moyenne: {(totalInscriptions / (totalCourses || 1)).toFixed(1)} / cours</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side Navigation Menu */}
        <div className="hidden md:block md:w-60 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm self-start space-y-1">
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
            onClick={() => { setActiveTab('emails'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'emails' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>E-mails Transactionnels</span>
          </button>

          <button
            onClick={() => { setActiveTab('custom-pages'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'custom-pages' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Pages HTML Personnalisées</span>
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
          <button
            onClick={() => { setActiveTab('profile'); setSearchQuery(''); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'profile' ? 'bg-red-50 text-red-900 font-bold border border-red-100' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4 text-red-500" />
            <span>Mon Profil</span>
          </button>
        </div>

        {/* Right Side Content Pane */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
          
          {/* Active search bar when relevant */}
          {activeTab !== 'stats' && activeTab !== 'settings' && activeTab !== 'profile' && (
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
              {activeTab === 'users' && (
                <button
                  type="button"
                  onClick={() => setShowAddAdminForm(!showAddAdminForm)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-50 cursor-pointer shrink-0"
                >
                  <Shield className="w-4 h-4" />
                  <span>Créer un Administrateur</span>
                </button>
              )}
              {activeTab === 'trainers' && (
                <button
                  type="button"
                  onClick={() => setShowAddTrainerForm(!showAddTrainerForm)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-50 cursor-pointer shrink-0"
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

              {/* Recharts Enrollment Growth Chart */}
              <EnrollmentGrowthChart allEnrollments={allEnrollments} />

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

              {/* Firebase App Hosting Cache Control */}
              <div className="bg-[#181c22] border border-white/10 rounded-2xl p-4 text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/25 shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">Gestion du Cache & Déploiements Firebase</p>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-mono px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {APP_BUILD_ID}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Le cache client est automatiquement purgé à chaque nouveau déploiement Firebase App Hosting.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await clearAllBrowserCaches();
                    showToast('🧹 Cache navigateur intégralement réinitialisé !', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  className="bg-white/10 hover:bg-white/15 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border border-white/10 transition-all shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Forcer réinitialisation cache</span>
                </button>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900">Gestion des utilisateurs ({allUsers.length})</h2>
                  <p className="text-xs text-slate-400">Recherchez un utilisateur, consultez ses informations, modifiez son rôle ou créez un compte administrateur.</p>
                </div>
                {!showAddAdminForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddAdminForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-50 cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Créer un Administrateur</span>
                  </button>
                )}
              </div>

              {/* Form to create an administrator by email only */}
              {showAddAdminForm && (
                <form onSubmit={handleCreateAdmin} className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl space-y-3 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-900">
                      <div className="p-1.5 bg-red-600 text-white rounded-lg shadow-sm">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Créer / Inviter un Administrateur</h3>
                        <p className="text-[10px] text-red-700 font-medium">Saisissez uniquement son adresse e-mail</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowAddAdminForm(false); setNewAdminEmail(''); }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-red-100/50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-red-100">
                    💡 <strong>Fonctionnement :</strong> Renseignez uniquement son adresse e-mail. Si la personne possède déjà un compte, elle recevra une notification par mail pour l'informer qu'elle est désormais Administrateur. Si elle n'a pas encore de compte, elle recevra un mail d'invitation contenant un lien pour créer son compte administrateur.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <div className="flex-1 relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="Adresse e-mail de l'administrateur (ex: admin@dekel-formation.com)"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddAdminForm(false); setNewAdminEmail(''); }}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Envoyer la notification</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

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
                                <div className="flex items-center justify-end gap-1.5">
                                  {isDeactivated ? (
                                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                                      <XCircle className="w-3 h-3" /> Bloqué
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                                      <CheckCircle className="w-3 h-3" /> Actif
                                    </span>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => setViewingUserProfile(u)}
                                    className="text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
                                  >
                                    Voir Profil
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onUpdateUserStatus(u.id, !isDeactivated)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                      isDeactivated
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                    }`}
                                  >
                                    {isDeactivated ? 'Débloquer' : 'Bloquer'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: "Supprimer l'utilisateur",
                                        message: "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est définitive.",
                                        itemName: `${u.name} (${u.email})`,
                                        confirmText: "Supprimer l'utilisateur",
                                        onConfirm: () => {
                                          onDeleteUser(u.id);
                                          showToast("Utilisateur supprimé !", "info");
                                          closeConfirmModal();
                                        }
                                      });
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 inline-flex align-middle cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                <form onSubmit={handleCreateTrainer} className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Créer / Inviter un Formateur</h3>
                        <p className="text-[10px] text-indigo-700 font-medium">Saisissez uniquement son adresse e-mail</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowAddTrainerForm(false); setNewTrainerEmail(''); }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-indigo-100/50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-white leading-relaxed p-3 rounded-xl border border-teal-800/50 shadow-inner" style={{ backgroundColor: '#0d584c' }}>
                    💡 <strong>Fonctionnement :</strong> Renseignez uniquement son adresse e-mail. Si la personne possède déjà un compte, elle recevra une notification par mail pour l'informer qu'elle est désormais Formateur. Si elle n'a pas encore de compte, elle recevra un mail d'invitation contenant un lien pour créer son compte formateur.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <div className="flex-1 relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={newTrainerEmail}
                        onChange={(e) => setNewTrainerEmail(e.target.value)}
                        placeholder="Adresse e-mail du formateur (ex: formateur@dekel-formation.com)"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddTrainerForm(false); setNewTrainerEmail(''); }}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Envoyer la notification</span>
                      </button>
                    </div>
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
                              <img src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt={t.name} />
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
                            <td className="px-4 py-3.5 text-right space-x-1.5 flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingUserProfile(t)}
                                className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
                              >
                                Voir Profil
                              </button>
                              <button
                                onClick={() => onUpdateUserStatus(t.id, !isDeactivated)}
                                title={isDeactivated ? "Activer l'accès" : "Désactiver l'accès"}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDeactivated 
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Supprimer le formateur",
                                    message: "Êtes-vous sûr de vouloir supprimer définitivement ce formateur ?",
                                    itemName: `${t.name} (${t.email})`,
                                    confirmText: "Supprimer le formateur",
                                    onConfirm: () => {
                                      onDeleteUser(t.id);
                                      showToast("Formateur supprimé !", "info");
                                      closeConfirmModal();
                                    }
                                  });
                                }}
                                title="Supprimer définitivement"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
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
                            <td className="px-4 py-3.5">
                              <div 
                                onClick={() => {
                                  if (onEditCourse) onEditCourse(c);
                                  else if (onPreviewCourse) onPreviewCourse(c);
                                }}
                                className="flex items-center gap-3 cursor-pointer group"
                                title="Ouvrir la formation"
                              >
                                <img src={c.coverImage} className="w-12 h-8 rounded object-cover border border-slate-200 group-hover:opacity-85 transition-opacity shrink-0" />
                                <div>
                                  <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{c.title}</p>
                                  <p className="text-[10px] text-slate-400">{c.type} • {c.price.toLocaleString('fr-FR')} XAF</p>
                                </div>
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
                                type="button"
                                onClick={() => handleExportCourseJSON(c)}
                                className="text-[10px] font-semibold px-2 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Exporter tout le contenu de la formation au format JSON"
                              >
                                <FileCode className="w-3 h-3 text-indigo-600" />
                                <span>Export JSON</span>
                              </button>
                              {onPreviewCourse && (
                                <button
                                  type="button"
                                  onClick={() => onPreviewCourse(c)}
                                  className="text-[10px] font-semibold px-2.5 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Prévisualiser la formation"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Prévisualiser</span>
                                </button>
                              )}
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
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Supprimer la formation",
                                    message: "Êtes-vous sûr de vouloir supprimer définitivement cette formation ?",
                                    itemName: c.title,
                                    confirmText: "Supprimer la formation",
                                    onConfirm: () => {
                                      onDeleteCourse(c.id);
                                      showToast("Formation supprimée !", "info");
                                      closeConfirmModal();
                                    }
                                  });
                                }}
                                title="Supprimer le cours"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors inline-flex align-middle cursor-pointer"
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
                            <td className="px-4 py-3.5 text-right space-x-1.5 flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingUserProfile(s)}
                                className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
                              >
                                Voir Profil
                              </button>
                              <button
                                onClick={() => onUpdateUserStatus(s.id, !isDeactivated)}
                                title={isDeactivated ? "Réactiver l'élève" : "Suspendre l'élève"}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDeactivated 
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Supprimer l'étudiant",
                                    message: "Êtes-vous sûr de vouloir supprimer définitivement la fiche de cet étudiant ?",
                                    itemName: `${s.name} (${s.email})`,
                                    confirmText: "Supprimer l'étudiant",
                                    onConfirm: () => {
                                      onDeleteUser(s.id);
                                      showToast("Fiche étudiant supprimée !", "info");
                                      closeConfirmModal();
                                    }
                                  });
                                }}
                                title="Supprimer définitivement"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
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

          {/* Tab Content: Transactional Emails */}
          {activeTab === 'emails' && (
            <TransactionalEmailDashboard 
              allUsers={allUsers}
              currentUser={currentUser}
              onSendEmail={onSendEmail}
            />
          )}

          {/* Tab Content: Custom HTML Pages */}
          {activeTab === 'custom-pages' && (
            <CustomPagesManager
              customPages={customPages}
              currentUser={currentUser}
              onSavePage={(page) => onSaveCustomPage && onSaveCustomPage(page)}
              onDeletePage={(pageId) => onDeleteCustomPage && onDeleteCustomPage(pageId)}
              onPreviewPage={(page) => onPreviewCustomPage && onPreviewCustomPage(page)}
            />
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
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-red-50 flex items-center gap-1.5 cursor-pointer"
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

              {/* Footer Configuration Block */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <LayoutTemplate className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider">Configuration du Footer (Pied de page public)</h3>
                      <p className="text-xs text-slate-500">Personnalisez toutes les informations du footer affiché sur les pages publiques (Marketplace, formations...).</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveFooter}
                    disabled={isSavingFooter}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-red-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className={`w-4 h-4 ${isSavingFooter ? 'animate-spin' : ''}`} />
                    <span>{isSavingFooter ? 'Enregistrement...' : 'Enregistrer le Footer'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand & Presentation */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      1. Présentation & Marque
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom de la marque</label>
                      <input
                        type="text"
                        value={footerForm.brandName || ''}
                        onChange={(e) => setFooterForm(prev => ({ ...prev, brandName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">URL du Logo (Optionnel)</label>
                      <input
                        type="url"
                        value={footerForm.logoUrl || ''}
                        onChange={(e) => setFooterForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Description courte de la plateforme</label>
                      <textarea
                        rows={3}
                        value={footerForm.description || ''}
                        onChange={(e) => setFooterForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Texte de Copyright</label>
                      <input
                        type="text"
                        value={footerForm.copyrightText || ''}
                        onChange={(e) => setFooterForm(prev => ({ ...prev, copyrightText: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Coordonnées & Contact */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      2. Coordonnées de Contact
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail de support</label>
                      <input
                        type="email"
                        value={footerForm.contactInfo?.email || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          contactInfo: { ...(prev.contactInfo || {}), email: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Téléphone de contact</label>
                      <input
                        type="text"
                        value={footerForm.contactInfo?.phone || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          contactInfo: { ...(prev.contactInfo || {}), phone: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Adresse géographique</label>
                      <input
                        type="text"
                        value={footerForm.contactInfo?.address || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          contactInfo: { ...(prev.contactInfo || {}), address: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Horaires de disponibilité</label>
                      <input
                        type="text"
                        value={footerForm.contactInfo?.hours || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          contactInfo: { ...(prev.contactInfo || {}), hours: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-600" />
                    3. Liens Réseaux Sociaux
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Facebook</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.facebook || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), facebook: e.target.value }
                        }))}
                        placeholder="https://facebook.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Instagram</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.instagram || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), instagram: e.target.value }
                        }))}
                        placeholder="https://instagram.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.linkedin || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), linkedin: e.target.value }
                        }))}
                        placeholder="https://linkedin.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">X (Twitter)</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.twitter || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), twitter: e.target.value }
                        }))}
                        placeholder="https://twitter.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">YouTube</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.youtube || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), youtube: e.target.value }
                        }))}
                        placeholder="https://youtube.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TikTok</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.tiktok || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), tiktok: e.target.value }
                        }))}
                        placeholder="https://tiktok.com/@..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.whatsapp || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), whatsapp: e.target.value }
                        }))}
                        placeholder="https://wa.me/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telegram</label>
                      <input
                        type="url"
                        value={footerForm.socialLinks?.telegram || ''}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          socialLinks: { ...(prev.socialLinks || {}), telegram: e.target.value }
                        }))}
                        placeholder="https://t.me/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Newsletter Configuration */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      4. Section Newsletter
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={footerForm.newsletterEnabled ?? true}
                        onChange={(e) => setFooterForm(prev => ({ ...prev, newsletterEnabled: e.target.checked }))}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <span>Activer la section Newsletter dans le Footer</span>
                    </label>
                  </div>

                  {footerForm.newsletterEnabled !== false && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Titre de la Newsletter</label>
                        <input
                          type="text"
                          value={footerForm.newsletterTitle || ''}
                          onChange={(e) => setFooterForm(prev => ({ ...prev, newsletterTitle: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Sous-titre / Description</label>
                        <input
                          type="text"
                          value={footerForm.newsletterSubtitle || ''}
                          onChange={(e) => setFooterForm(prev => ({ ...prev, newsletterSubtitle: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Useful Links & Legal Links Managers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  {/* Useful Links Manager */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                      5. Liens Utiles ({footerForm.usefulLinks?.length || 0})
                    </h4>

                    <div className="space-y-2">
                      {footerForm.usefulLinks?.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{link.label}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFooterForm(prev => ({
                                ...prev,
                                usefulLinks: prev.usefulLinks?.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Libellé (ex: Support)"
                        value={newUsefulLabel}
                        onChange={(e) => setNewUsefulLabel(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:bg-white"
                      />
                      <input
                        type="text"
                        placeholder="URL (ex: /support)"
                        value={newUsefulUrl}
                        onChange={(e) => setNewUsefulUrl(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newUsefulLabel && newUsefulUrl) {
                            setFooterForm(prev => ({
                              ...prev,
                              usefulLinks: [...(prev.usefulLinks || []), { label: newUsefulLabel, url: newUsefulUrl }]
                            }));
                            setNewUsefulLabel('');
                            setNewUsefulUrl('');
                          }
                        }}
                        className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-indigo-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Legal Links Manager */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      6. Liens Légaux ({footerForm.legalLinks?.length || 0})
                    </h4>

                    <div className="space-y-2">
                      {footerForm.legalLinks?.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{link.label}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFooterForm(prev => ({
                                ...prev,
                                legalLinks: prev.legalLinks?.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Libellé (ex: Mentions légales)"
                        value={newLegalLabel}
                        onChange={(e) => setNewLegalLabel(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:bg-white"
                      />
                      <input
                        type="text"
                        placeholder="URL (ex: /p/legal)"
                        value={newLegalUrl}
                        onChange={(e) => setNewLegalUrl(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newLegalLabel && newLegalUrl) {
                            setFooterForm(prev => ({
                              ...prev,
                              legalLinks: [...(prev.legalLinks || []), { label: newLegalLabel, url: newLegalUrl }]
                            }));
                            setNewLegalLabel('');
                            setNewLegalUrl('');
                          }
                        }}
                        className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveFooter}
                    disabled={isSavingFooter}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md shadow-red-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className={`w-4 h-4 ${isSavingFooter ? 'animate-spin' : ''}`} />
                    <span>{isSavingFooter ? 'Enregistrement...' : 'Enregistrer la configuration du Footer'}</span>
                  </button>
                </div>
              </div>

              {/* Category Management Block */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800">
                  <Tag className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Gestion des catégories de formations</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Ajoutez les catégories disponibles dans le catalogue marketplace et dans les formulaires des formateurs.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (adminCatInput.trim() && onAddCategory) {
                      onAddCategory(adminCatInput.trim());
                      setAdminCatInput('');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={adminCatInput}
                    onChange={(e) => setAdminCatInput(e.target.value)}
                    placeholder="Nouvelle catégorie (ex: Intelligence Artificielle...)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!adminCatInput.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center gap-2"
                    >
                      <span>{cat}</span>
                      {onDeleteCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: "Supprimer la catégorie",
                              message: "Êtes-vous sûr de vouloir supprimer cette catégorie ?",
                              itemName: cat,
                              confirmText: "Supprimer",
                              onConfirm: () => {
                                onDeleteCategory(cat);
                                showToast("Catégorie supprimée !", "info");
                                closeConfirmModal();
                              }
                            });
                          }}
                          title={`Supprimer la catégorie ${cat}`}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-black text-slate-900">Mon profil d'administrateur</h2>
                <p className="text-xs text-slate-400">Gérez vos coordonnées personnelles, votre bio de présentation et votre avatar de profil.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 border border-slate-150 rounded-2xl bg-slate-50">
                  <img 
                    src={profileAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                    alt={profileName} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-500/30 shadow-sm"
                  />
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">URL de l'avatar (Photo de profil)</label>
                    <input
                      type="url"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nom de famille</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Prénom</label>
                    <input
                      type="text"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Adresse E-mail</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="Ex: +237 6xx xxx xxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Biographie / Présentation</label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Écrivez quelques mots sur vous..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Thème de l'application</label>
                  <div style={{ backgroundColor: '#1b2028' }} className="p-3.5 rounded-2xl border border-emerald-500/30 text-white flex items-center justify-between">
                    <div style={{ backgroundColor: '#1b2028' }} className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                      <div>
                        <p className="text-xs font-bold text-white">Nature Dark (Premium)</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">Thème unique de l'application (#1b2028)</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">Actif</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-red-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Mettre à jour mon profil</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Visualiser Profil Modal */}
      {viewingUserProfile && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-800 space-y-4">
            <button
              onClick={() => setViewingUserProfile(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center space-y-3">
              <img 
                src={viewingUserProfile.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'} 
                alt={viewingUserProfile.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-red-500/20 shadow-md mx-auto"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {viewingUserProfile.firstName ? `${viewingUserProfile.firstName} ${viewingUserProfile.name}` : viewingUserProfile.name}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border mt-1 ${
                  viewingUserProfile.role === 'admin' 
                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                    : viewingUserProfile.role === 'trainer'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  {viewingUserProfile.role === 'admin' ? 'Administrateur' : viewingUserProfile.role === 'trainer' ? 'Formateur' : 'Étudiant'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-150 pt-3.5 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Adresse E-mail</p>
                  <p className="font-semibold text-slate-700">{viewingUserProfile.email}</p>
                </div>
              </div>

              {viewingUserProfile.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Téléphone</p>
                    <p className="font-semibold text-slate-700 font-mono">{viewingUserProfile.phone}</p>
                  </div>
                </div>
              )}

              {viewingUserProfile.bio && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Biographie / Présentation</p>
                    <p className="text-slate-600 leading-relaxed font-normal whitespace-pre-line bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-1 text-[11px]">{viewingUserProfile.bio}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewingUserProfile(null)}
              className="w-full py-2.5 px-4 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition-all mt-4 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        itemName={confirmModal.itemName}
        confirmText={confirmModal.confirmText}
      />

    </div>
  );
}
