import React, { useState, useEffect } from 'react';
import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent, DownloadableFile, ExternalLink, CustomPaymentButton } from '../types';
import { 
  BarChart3, BookOpen, Users, Settings, User as UserIcon, Plus, Trash2, Copy, 
  Share2, Edit3, Save, ArrowUp, ArrowDown, Check, CheckCircle2, AlertCircle, 
  HelpCircle, Eye, EyeOff, Play, FileText, ExternalLink as LinkIcon, Globe, Image, Video,
  Mail, Phone, X, ChevronDown, ChevronRight, Folder, Menu
} from 'lucide-react';
import { showToast } from './Toast';
import UserProfile from './UserProfile';

interface TrainerDashboardProps {
  currentUser: User;
  allUsers: User[];
  allCourses: Course[];
  allModules: Module[];
  allChapters: Chapter[];
  allEnrollments: Enrollment[];
  allProgress: StudentProgress[];
  preRegistered: PreRegisteredStudent[];
  
  // State changers
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddModule: (module: Module) => void;
  onUpdateModules: (modules: Module[]) => void;
  onDeleteModule: (moduleId: string) => void;
  onAddChapter: (chapter: Chapter) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onDeleteChapter: (chapterId: string) => void;
  onAddEnrollment: (enrollment: Enrollment) => void;
  onUpdateEnrollmentStatus: (enrollmentId: string, status: 'active' | 'revoked') => void;
  onDeleteEnrollment: (enrollmentId: string) => void;
  onAddPreRegistered: (preReg: PreRegisteredStudent) => void;
  onSendEmail: (email: SimulatedEmail) => void;
  onUpdateUser: (user: User) => void;
  onPreviewCourse?: (course: Course) => void;
  onAddUser?: (user: User) => void;
}

export default function TrainerDashboard({
  currentUser,
  allUsers,
  allCourses,
  allModules,
  allChapters,
  allEnrollments,
  allProgress,
  preRegistered,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddModule,
  onUpdateModules,
  onDeleteModule,
  onAddChapter,
  onUpdateChapters,
  onDeleteChapter,
  onAddEnrollment,
  onUpdateEnrollmentStatus,
  onDeleteEnrollment,
  onAddPreRegistered,
  onSendEmail,
  onUpdateUser,
  onPreviewCourse,
  onAddUser,
}: TrainerDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'courses' | 'students' | 'course-editor' | 'webhooks' | 'assistants'>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  // Selection states
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [isEditingCourseSettings, setIsEditingCourseSettings] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Course configuration states
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseType, setNewCourseType] = useState('Développement');
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);

  // Student enroll form states
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollName, setEnrollName] = useState(''); // If brand new
  const [enrollCourseId, setEnrollCourseId] = useState('');
  
  // Edit Profile Form
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileFirstName, setProfileFirstName] = useState(currentUser.firstName || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email || '');
  const [profileBio, setProfileBio] = useState(currentUser.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatarUrl || '');
  const [profileTheme, setProfileTheme] = useState(currentUser.theme || 'theme-nature-dark');
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);

  // Assistant management states (Requirement Fine-Grained Permissions)
  const [assistantFirstName, setAssistantFirstName] = useState('');
  const [assistantLastName, setAssistantLastName] = useState('');
  const [assistantEmail, setAssistantEmail] = useState('');
  const [assistantPassword, setAssistantPassword] = useState('');
  const [assistantPermEditChapters, setAssistantPermEditChapters] = useState(true);
  const [assistantPermManageComments, setAssistantPermManageComments] = useState(true);
  const [showAddAssistantForm, setShowAddAssistantForm] = useState(false);

  // States for unified "Structure de la formation" course editor
  const [expandedTrainerModuleIds, setExpandedTrainerModuleIds] = useState<Record<string, boolean>>({});
  const [activeModMenuId, setActiveModMenuId] = useState<string | null>(null);
  const [activeChMenuId, setActiveChMenuId] = useState<string | null>(null);
  const [modToRenameId, setModToRenameId] = useState<string | null>(null);
  const [modRenameTitle, setModRenameTitle] = useState('');

  const toggleTrainerModule = (moduleId: string) => {
    setExpandedTrainerModuleIds(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Automatically expand the first module of the course by default when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      const courseMods = allModules
        .filter(m => m.courseId === selectedCourseId)
        .sort((a, b) => a.order - b.order);
      if (courseMods.length > 0) {
        setExpandedTrainerModuleIds({ [courseMods[0].id]: true });
      } else {
        setExpandedTrainerModuleIds({});
      }
    } else {
      setExpandedTrainerModuleIds({});
    }
    setActiveModMenuId(null);
    setActiveChMenuId(null);
    setModToRenameId(null);
    setModRenameTitle('');
  }, [selectedCourseId, allModules]);

  useEffect(() => {
    setProfileName(currentUser.name);
    setProfileFirstName(currentUser.firstName || '');
    setProfilePhone(currentUser.phone || '');
    setProfileEmail(currentUser.email || '');
    setProfileBio(currentUser.bio || '');
    setProfileAvatar(currentUser.avatarUrl || '');
    setProfileTheme(currentUser.theme || 'theme-nature-dark');
  }, [currentUser]);

  // Helper for fine-grained permissions check (Requirement Fine-Grained Permissions)
  const hasPermission = (permission: 'edit_chapters' | 'manage_comments' | 'delete_course'): boolean => {
    if (currentUser.role === 'admin' || currentUser.role === 'trainer') return true;
    if (currentUser.role === 'assistant') {
      return currentUser.permissions?.includes(permission) ?? false;
    }
    return false;
  };

  // 1. Filter Courses belonging to THIS trainer or the trainer who invited this assistant (Requirement Fine-Grained Permissions)
  const trainerCourses = allCourses.filter(c => {
    if (currentUser.role === 'assistant') {
      const trainer = allUsers.find(u => u.email.toLowerCase() === currentUser.invitedBy?.toLowerCase());
      return trainer ? c.trainerId === trainer.id : false;
    }
    return c.trainerId === currentUser.id;
  });

  const selectedCourse = allCourses.find(c => {
    if (currentUser.role === 'assistant') {
      const trainer = allUsers.find(u => u.email.toLowerCase() === currentUser.invitedBy?.toLowerCase());
      return c.id === selectedCourseId && (trainer ? c.trainerId === trainer.id : false);
    }
    return c.id === selectedCourseId && c.trainerId === currentUser.id;
  });

  // 2. Filter Modules & Chapters belonging to selected course
  const courseModules = allModules
    .filter(m => m.courseId === selectedCourseId)
    .sort((a, b) => a.order - b.order);

  const moduleChaptersMap = (moduleId: string) => 
    allChapters
      .filter(ch => ch.moduleId === moduleId)
      .sort((a, b) => a.order - b.order);

  // 3. Filter Students enrolled in ANY of this trainer's courses
  const courseIds = trainerCourses.map(c => c.id);
  const activeEnrollments = allEnrollments.filter(e => courseIds.includes(e.courseId));
  
  // Extract unique students emails
  const studentEmails = Array.from(new Set(activeEnrollments.map(e => e.studentEmail.toLowerCase())));
  const trainerStudents = allUsers.filter(u => u.role === 'student' && studentEmails.includes(u.email.toLowerCase()));

  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const handleAsyncAction = async (actionKey: string, actionFn: () => Promise<void> | void) => {
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      await actionFn();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Une erreur est survenue", "error");
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const triggerToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    showToast(msg, type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsyncAction('saveProfile', async () => {
      await onUpdateUser({
        ...currentUser,
        name: profileName,
        firstName: profileFirstName,
        phone: profilePhone,
        email: profileEmail,
        bio: profileBio,
        avatarUrl: profileAvatar,
        theme: profileTheme
      });
      triggerToast('Vos informations ont été mises à jour !');
    });
  };

  // Add Course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    handleAsyncAction('createCourse', async () => {
      const newCourse: Course = {
        id: `c-${Date.now()}`,
        title: newCourseTitle,
        trainerId: currentUser.id,
        trainerName: currentUser.name,
        language: 'Français',
        description: 'Entrez une description captivante pour cette nouvelle formation.',
        themeColor: 'indigo',
        trainerPhoto: currentUser.avatarUrl,
        logoUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=100',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        status: 'draft',
        createdAt: new Date().toISOString(),
        type: newCourseType,
        price: 125000,
        level: 'Tous niveaux',
        duration: '10 heures'
      };

      await onAddCourse(newCourse);
      setNewCourseTitle('');
      setShowAddCourseForm(false);
      triggerToast('Formation créée avec succès en mode Brouillon !');
      
      // Auto-select and open editor
      setSelectedCourseId(newCourse.id);
      setActiveTab('course-editor');
    });
  };

  // Invite an Assistant (Requirement Fine-Grained Permissions)
  const handleInviteAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantEmail || !assistantLastName || !assistantFirstName || !assistantPassword) {
      triggerToast('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const emailTrimmed = assistantEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      triggerToast('Veuillez saisir un e-mail valide.');
      return;
    }

    // Check if user already exists
    const userExists = allUsers.some(u => u.email.toLowerCase() === emailTrimmed);
    if (userExists) {
      triggerToast('Cet utilisateur existe déjà.');
      return;
    }

    const permissions: string[] = [];
    if (assistantPermEditChapters) permissions.push('edit_chapters');
    if (assistantPermManageComments) permissions.push('manage_comments');

    const newAssistant: User = {
      id: `u-${Date.now()}`,
      email: emailTrimmed,
      name: assistantLastName.trim(),
      firstName: assistantFirstName.trim(),
      role: 'assistant',
      createdAt: new Date().toISOString(),
      permissions: permissions,
      invitedBy: currentUser.email,
      status: 'active'
    };

    if (onAddUser) {
      onAddUser(newAssistant);
      
      // Send simulated email
      onSendEmail({
        id: `m-${Date.now()}`,
        to: emailTrimmed,
        subject: `Invitation Collaborateur : Assistant sur Dekel.Formation par ${currentUser.name}`,
        body: `Bonjour ${assistantFirstName.trim()},\n\nVous avez été invité à collaborer en tant qu'Assistant par le formateur ${currentUser.name} (${currentUser.email}) sur Dekel.Formation.\n\nVoici vos accès de connexion :\n- Identifiant/E-mail : ${emailTrimmed}\n- Mot de passe : ${assistantPassword}\n\nVos permissions accordées :\n${permissions.includes('edit_chapters') ? '✓ Modifier les chapitres de cours\n' : ''}${permissions.includes('manage_comments') ? '✓ Répondre et gérer les commentaires\n' : ''}\nNote de sécurité : En tant qu'Assistant, vous n'êtes pas autorisé à supprimer de formations de la plateforme.\n\nConnectez-vous dès maintenant pour commencer votre collaboration !\n\nCordialement,\nL'équipe administrative Dekel.Formation`,
        sentAt: new Date().toISOString()
      });

      triggerToast(`Assistant ${assistantFirstName} invité avec succès ! Un e-mail de connexion lui a été envoyé.`);
      
      // Reset form
      setAssistantFirstName('');
      setAssistantLastName('');
      setAssistantEmail('');
      setAssistantPassword('');
      setAssistantPermEditChapters(true);
      setAssistantPermManageComments(true);
      setShowAddAssistantForm(false);
    } else {
      triggerToast('Erreur : le système ne peut pas ajouter d\'utilisateur pour le moment.');
    }
  };

  const handleToggleAssistantPermission = (assistant: User, permission: 'edit_chapters' | 'manage_comments') => {
    const currentPerms = assistant.permissions || [];
    let updatedPerms: string[] = [];
    if (currentPerms.includes(permission)) {
      updatedPerms = currentPerms.filter(p => p !== permission);
    } else {
      updatedPerms = [...currentPerms, permission];
    }
    onUpdateUser({
      ...assistant,
      permissions: updatedPerms
    });
    triggerToast('Permissions de l\'assistant mises à jour !');
  };

  const handleToggleAssistantStatus = (assistant: User) => {
    const newStatus = assistant.status === 'active' ? 'deactivated' : 'active';
    onUpdateUser({
      ...assistant,
      status: newStatus as any
    });
    triggerToast(`Statut de l'assistant mis à jour (${newStatus === 'active' ? 'Activé' : 'Désactivé'}).`);
  };

  // Duplicate Course
  const handleDuplicateCourse = (course: Course) => {
    handleAsyncAction(`duplicate-${course.id}`, async () => {
      const newCourse: Course = {
        ...course,
        id: `c-${Date.now()}`,
        title: `${course.title} (Copie)`,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      await onAddCourse(newCourse);

      // Also duplicate its modules and chapters!
      const origModules = allModules.filter(m => m.courseId === course.id);
      for (const oldMod of origModules) {
        const newModId = `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newMod: Module = {
          id: newModId,
          courseId: newCourse.id,
          title: oldMod.title,
          order: oldMod.order
        };
        await onAddModule(newMod);

        const oldChapters = allChapters.filter(ch => ch.moduleId === oldMod.id);
        const newChapsList: Chapter[] = [];
        for (const oldCh of oldChapters) {
          const newCh: Chapter = {
            ...oldCh,
            id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            moduleId: newModId
          };
          newChapsList.push(newCh);
          await onAddChapter(newCh);
        }
      }

      triggerToast('Formation dupliquée avec succès !');
    });
  };

  // Course settings edit save
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLang, setEditLang] = useState('Français');
  const [editType, setEditType] = useState('Développement');
  const [editColor, setEditColor] = useState<'indigo'|'slate'|'emerald'|'amber'|'rose'|'sky'>('indigo');
  const [editPrice, setEditPrice] = useState(125000);
  const [editLevel, setEditLevel] = useState<'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux'>('Tous niveaux');
  const [editDuration, setEditDuration] = useState('10 heures');
  const [editCover, setEditCover] = useState('');
  const [editStatus, setEditStatus] = useState<'published' | 'draft' | 'archived'>('draft');
  
  // SEO optimization fields (Requirement 26)
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editSeoSlug, setEditSeoSlug] = useState('');
  const [editSeoShareImage, setEditSeoShareImage] = useState('');

  // Helper to generate a URL-friendly slug
  const handleAutoGenerateSlug = () => {
    const slug = editTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setEditSeoSlug(slug);
  };
  
  // Custom Payment settings (Requirement 5)
  const [editPaymentInstructions, setEditPaymentInstructions] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editPaymentButtons, setEditPaymentButtons] = useState<CustomPaymentButton[]>([]);
  const [editShowPaymentInstructions, setEditShowPaymentInstructions] = useState(true);
  const [editPromoPrice, setEditPromoPrice] = useState<number | ''>('');

  // Webhook settings & tester states (Requirement 2)
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [editWebhookEmailKey, setEditWebhookEmailKey] = useState('email');
  const [editWebhookNameKey, setEditWebhookNameKey] = useState('name');

  // Global webhook journal states
  const [globalWebhookLogs, setGlobalWebhookLogs] = useState<any[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [globalWebhookSearch, setGlobalWebhookSearch] = useState('');
  const [globalWebhookFilterCourseId, setGlobalWebhookFilterCourseId] = useState('');
  const [globalWebhookFilterStatus, setGlobalWebhookFilterStatus] = useState('');
  const [testName, setTestName] = useState('');
  const [webhookTestResult, setWebhookTestResult] = useState<{
    sentPayload: any;
    response: any;
    success: boolean;
  } | null>(null);

  const fetchGlobalLogs = async () => {
    try {
      const res = await fetch('/api/webhooks/logs');
      const data = await res.json();
      if (data && Array.isArray(data.logs)) {
        setGlobalWebhookLogs(data.logs);
      }
    } catch (err) {}
  };

  const handleClearAllWebhookLogs = async () => {
    if (!confirm("Voulez-vous vraiment effacer TOUS les journaux de Webhooks de l'application ? Cette action est irréversible.")) return;
    try {
      const res = await fetch('/api/webhooks/logs', { method: 'DELETE' });
      if (res.ok) {
        setGlobalWebhookLogs([]);
        triggerToast("Tous les journaux ont été effacés.");
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (activeTab === 'webhooks') {
      fetchGlobalLogs();
    }
  }, [activeTab]);

  const openCourseSettings = (c: Course) => {
    setSelectedCourseId(c.id);
    setEditTitle(c.title);
    setEditDesc(c.description);
    setEditLang(c.language);
    setEditType(c.type || 'Développement');
    setEditColor(c.themeColor);
    setEditPrice(c.price);
    setEditLevel(c.level);
    setEditDuration(c.duration);
    setEditCover(c.coverImage || '');
    setEditStatus(c.status);
    setEditPaymentInstructions(c.paymentInstructions || 'Veuillez effectuer le paiement par Mobile Money (Orange Money, Wave ou MTN) ou par virement bancaire puis envoyer votre justificatif sur WhatsApp pour validation de votre inscription.');
    setEditContactInfo(c.contactInfo || 'WhatsApp: +221 77 123 45 67\nE-mail: support@formateur.com');
    setEditPaymentButtons(c.customPaymentButtons || [
      { id: 'btn-1', active: true, text: 'Payer par Wave', color: 'blue', url: 'https://wave.com' },
      { id: 'btn-2', active: true, text: 'Payer par Orange Money', color: 'yellow', url: 'https://orangemoney.com' }
    ]);
    setEditShowPaymentInstructions(c.showPaymentInstructions !== false);
    setEditPromoPrice(c.promoPrice !== undefined ? c.promoPrice : '');
    setEditWebhookEmailKey(c.webhookEmailKey || 'email');
    setEditWebhookNameKey(c.webhookNameKey || 'name');
    
    // SEO fields
    setEditSeoTitle(c.seoTitle || '');
    setEditSeoDescription(c.seoDescription || '');
    setEditSeoSlug(c.seoSlug || '');
    setEditSeoShareImage(c.seoShareImage || '');
    
    // Reset test fields
    setTestEmail('');
    setTestName('');
    setWebhookTestResult(null);
    setIsTestingWebhook(false);
    setWebhookCopied(false);

    // Fetch live webhook logs from Express backend
    fetch(`/api/webhooks/logs/${c.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.logs)) {
          setWebhookLogs(data.logs);
        }
      })
      .catch(() => {});

    setIsEditingCourseSettings(true);
  };

  const handleSaveCourseSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    handleAsyncAction('saveCourseSettings', async () => {
      await onUpdateCourse({
        ...selectedCourse,
        title: editTitle,
        description: editDesc,
        language: editLang,
        type: editType,
        themeColor: editColor,
        price: Number(editPrice),
        level: editLevel,
        duration: editDuration,
        coverImage: editCover,
        status: editStatus,
        paymentInstructions: editPaymentInstructions,
        contactInfo: editContactInfo,
        customPaymentButtons: editPaymentButtons,
        showPaymentInstructions: editShowPaymentInstructions,
        promoPrice: editPromoPrice !== '' ? Number(editPromoPrice) : undefined,
        webhookEmailKey: editWebhookEmailKey || 'email',
        webhookNameKey: editWebhookNameKey || 'name',
        seoTitle: editSeoTitle,
        seoDescription: editSeoDescription,
        seoSlug: editSeoSlug,
        seoShareImage: editSeoShareImage
      });

      setIsEditingCourseSettings(false);
      triggerToast('Paramètres de la formation enregistrés !');
    });
  };

  // Webhook integration helper functions (Requirement 2)
  const copyWebhookToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  const handleTestWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !selectedCourse) return;
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      // Build simulated body dynamically supporting nested JSON key mappings (e.g. data.object.email)
      const mockBody: any = {
        event: 'payment.success',
        amount: selectedCourse.price
      };

      const assignNestedValue = (obj: any, path: string, val: any) => {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        current[parts[parts.length - 1]] = val;
      };

      const emailPath = editWebhookEmailKey || 'email';
      const namePath = editWebhookNameKey || 'name';

      assignNestedValue(mockBody, emailPath, testEmail.trim());
      
      const studentNameVal = testName.trim() || ("Simulé " + testEmail.split('@')[0]);
      assignNestedValue(mockBody, namePath, studentNameVal);

      const res = await fetch(`/api/webhooks/payment/${selectedCourse.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockBody)
      });
      const data = await res.json();
      
      setWebhookTestResult({
        sentPayload: mockBody,
        response: data,
        success: res.ok
      });

      if (res.ok) {
        triggerToast(`Webhook reçu avec succès ! L'étudiant "${testEmail}" a été inscrit.`);
      } else {
        triggerToast(`Erreur webhook : ${data.message || 'Erreur inconnue'}`);
      }

      // Re-fetch live webhook logs
      const logsRes = await fetch(`/api/webhooks/logs/${selectedCourse.id}`);
      const logsData = await logsRes.json();
      if (logsData && Array.isArray(logsData.logs)) {
        setWebhookLogs(logsData.logs);
      }
    } catch (err) {
      triggerToast("Erreur de connexion avec le serveur backend.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleClearWebhookLogs = async () => {
    if (!selectedCourse) return;
    if (!confirm("Voulez-vous vraiment effacer l'historique des webhooks pour cette formation ?")) return;
    try {
      await fetch(`/api/webhooks/logs/${selectedCourse.id}`, { method: 'DELETE' });
      setWebhookLogs([]);
      triggerToast("Historique des webhooks vidé.");
    } catch (err) {}
  };

  // Add module
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const handleAddModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newModuleTitle) return;

    handleAsyncAction('addModule', async () => {
      const newOrder = courseModules.length + 1;
      const newMod: Module = {
        id: `m-${Date.now()}`,
        courseId: selectedCourseId,
        title: newModuleTitle,
        order: newOrder
      };

      await onAddModule(newMod);
      setNewModuleTitle('');
      triggerToast('Module ajouté !');
    });
  };

  // Reorder Modules
  const handleMoveModule = (module: Module, direction: 'up' | 'down') => {
    const index = courseModules.findIndex(m => m.id === module.id);
    if (index === -1) return;

    const newModules = [...courseModules];
    if (direction === 'up' && index > 0) {
      // Swap with previous
      const prev = newModules[index - 1];
      newModules[index - 1] = { ...module, order: prev.order };
      newModules[index] = { ...prev, order: module.order };
    } else if (direction === 'down' && index < newModules.length - 1) {
      // Swap with next
      const next = newModules[index + 1];
      newModules[index + 1] = { ...module, order: next.order };
      newModules[index] = { ...next, order: module.order };
    }

    onUpdateModules(newModules);
  };

  // Helpers for unified "Structure de la formation" editing
  const handleToggleModuleActive = async (mod: Module) => {
    const updated = { ...mod, active: mod.active === false ? true : false };
    const allUpdated = allModules.map(m => m.id === mod.id ? updated : m);
    const courseModsUpdated = allUpdated.filter(m => m.courseId === selectedCourseId);
    await onUpdateModules(courseModsUpdated);
    triggerToast(updated.active !== false ? 'Module activé !' : 'Module désactivé (masqué) !');
  };

  const handleRenameModuleSave = async (mod: Module) => {
    if (!modRenameTitle.trim()) return;
    const updated = { ...mod, title: modRenameTitle.trim() };
    const allUpdated = allModules.map(m => m.id === mod.id ? updated : m);
    const courseModsUpdated = allUpdated.filter(m => m.courseId === selectedCourseId);
    await onUpdateModules(courseModsUpdated);
    setModToRenameId(null);
    triggerToast("Module renommé !");
  };

  const handleToggleChapterActive = async (chapter: Chapter) => {
    const updated: Chapter = { ...chapter, active: chapter.active === false ? true : false };
    const allUpdated = allChapters.map(ch => ch.id === chapter.id ? updated : ch);
    await onUpdateChapters(allUpdated);
    triggerToast(updated.active !== false ? 'Chapitre activé !' : 'Chapitre désactivé (masqué) !');
  };

  const handleDeleteModuleClick = (moduleId: string) => {
    if (!hasPermission('edit_chapters')) {
      triggerToast('Permission refusée : Vous n\'avez pas le droit de modifier les chapitres.');
      return;
    }
    if (confirm("Voulez-vous vraiment supprimer ce module et tous les chapitres qu'il contient ?")) {
      onDeleteModule(moduleId);
      triggerToast("Module supprimé !");
    }
  };

  const handleDeleteChapterClick = (chapterId: string) => {
    if (!hasPermission('edit_chapters')) {
      triggerToast('Permission refusée : Vous n\'avez pas le droit de modifier les chapitres.');
      return;
    }
    if (confirm("Voulez-vous vraiment supprimer ce chapitre ?")) {
      onDeleteChapter(chapterId);
      triggerToast("Chapitre supprimé !");
    }
  };

  // Chapter editing form states
  const [chTitle, setChTitle] = useState('');
  const [chVideoSrc, setChVideoSrc] = useState<'youtube' | 'vimeo' | 'direct' | 'iframe'>('youtube');
  const [chVideoUrl, setChVideoUrl] = useState('');
  const [chRichText, setChRichText] = useState('');
  const [chFiles, setChFiles] = useState<DownloadableFile[]>([]);
  const [chLinks, setChLinks] = useState<ExternalLink[]>([]);
  const [chBtnLabel, setChBtnLabel] = useState('');
  const [chBtnUrl, setChBtnUrl] = useState('');
  const [editingModuleId, setEditingModuleId] = useState('');
  const [chIsFree, setChIsFree] = useState(false);

  // Chapter Rich text editor toolbar appender
  const appendToRichText = (tag: string) => {
    let append = '';
    switch (tag) {
      case 'b': append = '**Texte gras**'; break;
      case 'i': append = '*Texte italique*'; break;
      case 'code': append = '\n```javascript\nconsole.log("Hello World");\n```\n'; break;
      case 'list': append = '\n* Élément 1\n* Élément 2\n'; break;
      case 'quote': append = '\n> Ceci est une citation inspirante.\n'; break;
      case 'link': append = '[Texte du lien](https://exemple.com)'; break;
      case 'video': append = '\n<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="100%" height="400"></iframe>\n'; break;
      case 'table': append = '\n| Colonne 1 | Colonne 2 |\n|-----------|-----------|\n| Valeur A  | Valeur B  |\n'; break;
    }
    setChRichText(prev => prev + append);
  };

  const openNewChapter = (moduleId: string) => {
    setEditingModuleId(moduleId);
    setSelectedChapterId(null);
    setChTitle('');
    setChVideoSrc('youtube');
    setChVideoUrl('');
    setChRichText('');
    setChFiles([]);
    setChLinks([]);
    setChBtnLabel('');
    setChBtnUrl('');
    setChIsFree(false);
    setIsEditingChapter(true);
  };

  const openEditChapter = (chapter: Chapter) => {
    setEditingModuleId(chapter.moduleId || '');
    setSelectedChapterId(chapter.id || null);
    setChTitle(chapter.title || '');
    setChVideoSrc(chapter.videoSource || 'youtube');
    setChVideoUrl(chapter.videoUrl || '');
    setChRichText(chapter.richText || '');
    setChFiles(chapter.downloadableFiles || []);
    setChLinks(chapter.externalLinks || []);
    setChBtnLabel(chapter.linkButton?.label || '');
    setChBtnUrl(chapter.linkButton?.url || '');
    setChIsFree(chapter.isFree || false);
    setIsEditingChapter(true);
  };

  const handleSaveChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('edit_chapters')) {
      triggerToast('Permission refusée : Vous n\'avez pas le droit de modifier les chapitres.');
      return;
    }
    if (!chTitle) return;

    handleAsyncAction('saveChapter', async () => {
      const finalBtn = chBtnLabel && chBtnUrl ? { label: chBtnLabel, url: chBtnUrl } : undefined;

      if (selectedChapterId) {
        // Update existing
        const currentChaps = allChapters.filter(ch => ch.moduleId === editingModuleId);
        const existing = currentChaps.find(ch => ch.id === selectedChapterId);
        if (existing) {
          const updated: Chapter = {
            ...existing,
            title: chTitle,
            videoSource: chVideoSrc,
            videoUrl: chVideoUrl,
            richText: chRichText,
            downloadableFiles: chFiles,
            externalLinks: chLinks,
            linkButton: finalBtn,
            isFree: chIsFree
          };
          // Update globally
          const allUpdated = allChapters.map(ch => ch.id === selectedChapterId ? updated : ch);
          await onUpdateChapters(allUpdated);
          triggerToast('Chapitre mis à jour avec succès !');
        }
      } else {
        // Create new
        const siblingChapters = allChapters.filter(ch => ch.moduleId === editingModuleId);
        const newOrder = siblingChapters.length + 1;
        const parentModule = allModules.find(m => m.id === editingModuleId);
        const courseId = parentModule ? parentModule.courseId : '';
        const newCh: Chapter = {
          id: `ch-${Date.now()}`,
          moduleId: editingModuleId,
          courseId,
          title: chTitle,
          order: newOrder,
          videoSource: chVideoSrc,
          videoUrl: chVideoUrl,
          richText: chRichText,
          downloadableFiles: chFiles,
          externalLinks: chLinks,
          linkButton: finalBtn,
          isFree: chIsFree
        };
        await onAddChapter(newCh);
        triggerToast('Nouveau chapitre créé !');
      }

      setIsEditingChapter(false);
    });
  };

  // Move Chapter
  const handleMoveChapter = (chapter: Chapter, direction: 'up' | 'down') => {
    const siblingChapters = moduleChaptersMap(chapter.moduleId);
    const index = siblingChapters.findIndex(ch => ch.id === chapter.id);
    if (index === -1) return;

    const newChaps = [...siblingChapters];
    if (direction === 'up' && index > 0) {
      const prev = newChaps[index - 1];
      newChaps[index - 1] = { ...chapter, order: prev.order };
      newChaps[index] = { ...prev, order: chapter.order };
    } else if (direction === 'down' && index < newChaps.length - 1) {
      const next = newChaps[index + 1];
      newChaps[index + 1] = { ...chapter, order: next.order };
      newChaps[index] = { ...next, order: chapter.order };
    }

    // Merge back into global chapters state
    const orderMap = new Map(newChaps.map(ch => [ch.id, ch.order]));
    const allUpdated = allChapters.map(ch => {
      if (orderMap.has(ch.id)) {
        return { ...ch, order: orderMap.get(ch.id)! };
      }
      return ch;
    });
    onUpdateChapters(allUpdated);
  };

  // Add downloadable file row
  const [tempFileName, setTempFileName] = useState('');
  const [tempFileUrl, setTempFileUrl] = useState('');
  const [tempFileSize, setTempFileSize] = useState('PDF');
  const addFileRow = () => {
    if (!tempFileName || !tempFileUrl) return;
    setChFiles(prev => [...prev, { id: `file-${Date.now()}`, name: tempFileName, url: tempFileUrl, size: tempFileSize || 'Lien' }]);
    setTempFileName('');
    setTempFileUrl('');
    setTempFileSize('PDF');
  };

  // Add link row
  const [tempLinkTitle, setTempLinkTitle] = useState('');
  const [tempLinkUrl, setTempLinkUrl] = useState('');
  const addLinkRow = () => {
    if (!tempLinkTitle || !tempLinkUrl) return;
    setChLinks(prev => [...prev, { id: `link-${Date.now()}`, title: tempLinkTitle, url: tempLinkUrl }]);
    setTempLinkTitle('');
    setTempLinkUrl('');
  };

  // Student Enrollment management (Section 4 & 11)
  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollEmail || !enrollCourseId) return;

    const emailTrimmed = enrollEmail.trim().toLowerCase();
    const courseSelected = allCourses.find(c => c.id === enrollCourseId);
    if (!courseSelected) return;

    // Check if student already enrolled in this specific course
    const alreadyEnrolled = allEnrollments.find(
      en => en.studentEmail.toLowerCase() === emailTrimmed && en.courseId === enrollCourseId
    );

    if (alreadyEnrolled) {
      if (alreadyEnrolled.status === 'revoked') {
        handleAsyncAction('enrollStudent', async () => {
          await onUpdateEnrollmentStatus(alreadyEnrolled.id, 'active');
          triggerToast(`Accès réactivé pour ${emailTrimmed} !`);
        });
        return;
      }
      alert('Cet élève est déjà inscrit à cette formation !');
      return;
    }

    handleAsyncAction('enrollStudent', async () => {
      // Check if student has account in system
      const studentUser = allUsers.find(u => u.email.toLowerCase() === emailTrimmed && u.role === 'student');

    if (studentUser) {
      // Case 1: Student has account. Register Enrollment immediately.
      const newEnroll: Enrollment = {
        id: `e-${Date.now()}`,
        studentEmail: emailTrimmed,
        courseId: enrollCourseId,
        status: 'active',
        enrolledAt: new Date().toISOString()
      };
      onAddEnrollment(newEnroll);

      // Send Instant Notification Email (Section 16)
      const enrollEmailSim: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: emailTrimmed,
        subject: `Nouveau cours ajouté : ${courseSelected.title}`,
        body: `Bonjour ${studentUser.name},

Bonne nouvelle ! Le formateur ${currentUser.name} vient de vous accorder l'accès au cours :
"${courseSelected.title}"

Connectez-vous à votre espace étudiant pour commencer les leçons immédiatement !

Lien d'accès: ${courseSelected.title}`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(enrollEmailSim);
      triggerToast(`Élève inscrit immédiatement ! Email de notification envoyé.`);
    } else {
      // Case 2: Student has no account yet. Register PreRegistration & Enrollment.
      const newEnroll: Enrollment = {
        id: `e-${Date.now()}`,
        studentEmail: emailTrimmed,
        courseId: enrollCourseId,
        status: 'active',
        enrolledAt: new Date().toISOString()
      };
      onAddEnrollment(newEnroll);

      // Save Pre-registration list
      const existingPre = preRegistered.find(p => p.email.toLowerCase() === emailTrimmed);
      if (existingPre) {
        if (!existingPre.courseIds.includes(enrollCourseId)) {
          existingPre.courseIds.push(enrollCourseId);
        }
        if (enrollName.trim() && !existingPre.name) {
          existingPre.name = enrollName.trim();
        }
      } else {
        onAddPreRegistered({
          email: emailTrimmed,
          name: enrollName.trim() || undefined,
          courseIds: [enrollCourseId]
        });
      }

      // Send Invitation notification email (Section 16)
      const welcomeNoAccount: SimulatedEmail = {
        id: `em-${Date.now()}`,
        to: emailTrimmed,
        subject: `Accès en attente : Créez votre compte sur Dekel.Formation`,
        body: `Bonjour,

Le formateur ${currentUser.name} vous a inscrit au cours :
"${courseSelected.title}".

Il semblerait que vous ne possédiez pas encore de compte avec cette adresse e-mail.
Veuillez vous inscrire gratuitement dès aujourd'hui avec l'adresse ${emailTrimmed} sur notre plateforme.

Une fois inscrit, votre formation sera automatiquement activée dans votre espace !

Cordialement,
Le support Dekel.Formation`,
        sentAt: new Date().toISOString()
      };
      onSendEmail(welcomeNoAccount);
      triggerToast(`Cas 2 - Élève non enregistré : Invitation par email envoyée !`);
    }

      setEnrollEmail('');
      setEnrollName('');
    });
  };

  const copyShareLink = (courseId: string) => {
    const link = `${window.location.origin}/course/${courseId}/share`;
    navigator.clipboard.writeText(link);
    triggerToast('Lien de partage copié dans le presse-papiers !');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Navigation Drawer for Trainers */}
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
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-xl border border-indigo-100">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Espace Formateur</p>
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
                  onClick={() => { setActiveTab('dashboard'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Tableau de bord</span>
                </button>

                <button
                  onClick={() => { setActiveTab('courses'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'courses' || activeTab === 'course-editor' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Mes formations ({trainerCourses.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('students'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'students' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Mes élèves ({trainerStudents.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('webhooks'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'webhooks' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Journal des Webhooks</span>
                </button>

                {(currentUser.role === 'trainer' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => { setActiveTab('assistants'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      activeTab === 'assistants' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Mon Équipe (Assistants)</span>
                  </button>
                )}

                <button
                  onClick={() => { setActiveTab('profile'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Mes informations</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <span className="text-[10px] text-slate-400 font-medium">Dekel.Formation • Formateur</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Hamburger button on mobile */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer mr-1"
            title="Ouvrir le menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl border border-indigo-100">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Espace Formateur</h1>
            <p className="text-xs text-slate-500">Gérez vos modules de formation, publiez des chapitres et suivez vos étudiants.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('courses'); setShowAddCourseForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle formation</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <div className="hidden md:flex border-b border-slate-200 gap-4 text-xs font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tableau de bord</span>
        </button>
        <button
          onClick={() => { setActiveTab('courses'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'courses' || activeTab === 'course-editor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mes formations ({trainerCourses.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('students'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mes élèves ({trainerStudents.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('webhooks'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'webhooks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-500" />
          <span>Journal des Webhooks</span>
        </button>
        {(currentUser.role === 'trainer' || currentUser.role === 'admin') && (
          <button
            onClick={() => { setActiveTab('assistants'); setSelectedCourseId(null); }}
            className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'assistants' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Mon Équipe (Assistants)</span>
          </button>
        )}
        <button
          onClick={() => { setActiveTab('profile'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Mes informations</span>
        </button>
      </div>

      {/* Tab 1: Dashboard Analytics */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Étudiants inscrits</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{trainerStudents.length}</p>
              <p className="text-[10px] text-slate-500 mt-1">Élèves uniques inscrits à vos cours</p>
            </div>
            <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Formations Publiées</p>
              <p className="text-3xl font-black text-indigo-600 mt-1">
                {trainerCourses.filter(c => c.status === 'published').length}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Sur {trainerCourses.length} cours créés au total</p>
            </div>
            <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inscriptions globales actives</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{activeEnrollments.length}</p>
              <p className="text-[10px] text-slate-500 mt-1">Vérifications de paiement validées</p>
            </div>
          </div>

          {/* Quick list of courses progress stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Statistiques par formation</h3>
            <div className="space-y-4">
              {trainerCourses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Créez votre première formation pour commencer à suivre son évolution.</p>
              ) : (
                trainerCourses.map(course => {
                  const enrolledCount = allEnrollments.filter(e => e.courseId === course.id && e.status === 'active').length;
                  const courseProgresses = allProgress.filter(p => p.courseId === course.id);
                  const averageProgress = courseProgresses.length > 0 
                    ? Math.round(courseProgresses.reduce((acc, curr) => acc + curr.completedChapterIds.length, 0) / courseProgresses.length)
                    : 0;

                  return (
                    <div key={course.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <img src={course.coverImage} className="w-10 h-7 rounded object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{course.title}</h4>
                          <p className="text-[10px] text-slate-400">{course.status === 'published' ? 'Publiée' : 'Brouillon'} • {course.level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-2 sm:mt-0">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400">Élèves</p>
                          <p className="text-xs font-bold text-slate-800">{enrolledCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400">Leçons moyennes suivies</p>
                          <p className="text-xs font-bold text-indigo-600">{averageProgress} chap.</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl animate-fade-in">
          <UserProfile currentUser={currentUser} onUpdateUser={onUpdateUser} />
        </div>
      )}

      {/* Tab 3: My Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Add Course Form */}
          {showAddCourseForm && (
            <form onSubmit={handleCreateCourse} className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4 max-w-lg">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Créer une formation</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Titre de la formation</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Ex: Devenir Web Designer Pro"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Catégorie</label>
                <select
                  value={newCourseType}
                  onChange={(e) => setNewCourseType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="Développement">Développement Web & Logiciel</option>
                  <option value="E-commerce">E-commerce & Dropshipping</option>
                  <option value="Design">Design UX/UI & Créativité</option>
                  <option value="Marketing">Marketing Digital & SEO</option>
                  <option value="Montage Vidéo">Montage Vidéo & Post-production</option>
                  <option value="Miniatures">Miniatures / Thumbnails YouTube</option>
                  <option value="Flyers">Flyers & Graphisme Promotionnel</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingActions['createCourse']}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow flex items-center gap-1.5"
                >
                  {loadingActions['createCourse'] ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <span>Continuer vers l'éditeur</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Courses Table (Section 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                    <th className="px-4 py-3">Image / Nom</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Date Création</th>
                    <th className="px-4 py-3">Élèves</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {trainerCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Vous n'avez pas encore créé de formation. Cliquez sur "Nouvelle formation" ci-dessus.</td>
                  </tr>
                ) : (
                  trainerCourses.map(course => {
                    const studentsCount = allEnrollments.filter(e => e.courseId === course.id && e.status === 'active').length;
                    
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 flex items-center gap-3">
                          <img src={course.coverImage} className="w-12 h-8 rounded object-cover border border-slate-200" />
                          <div>
                            <p className="font-bold text-slate-800">{course.title}</p>
                            <p className="text-[10px] text-slate-400">Prix : {course.price.toLocaleString('fr-FR')} XAF</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {course.type}
                        </td>
                        <td className="px-4 py-3.5">
                          {course.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                              Publié
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                              Brouillon
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(course.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-700">
                          {studentsCount}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          {onPreviewCourse && (
                            <button
                              onClick={() => onPreviewCourse(course)}
                              className="text-[10px] font-semibold px-2.5 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Prévisualiser la formation"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Prévisualiser</span>
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedCourseId(course.id); setActiveTab('course-editor'); }}
                            className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-[10px] font-bold transition-all"
                          >
                            Éditer Contenu
                          </button>
                          <button
                            onClick={() => openCourseSettings(course)}
                            title="Paramètres de la formation"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 inline-flex align-middle"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => copyShareLink(course.id)}
                            title="Partager le lien"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 inline-flex align-middle"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateCourse(course)}
                            disabled={loadingActions[`duplicate-${course.id}`]}
                            title="Dupliquer la formation"
                            className="p-1 hover:bg-slate-100 disabled:opacity-50 rounded text-slate-400 hover:text-slate-700 inline-flex align-middle items-center gap-1"
                          >
                            {loadingActions[`duplicate-${course.id}`] ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {currentUser.role !== 'assistant' ? (
                            <button
                              onClick={() => onDeleteCourse(course.id)}
                              title="Supprimer la formation"
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 inline-flex align-middle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span 
                              title="Suppression interdite pour les assistants" 
                              className="p-1 rounded text-slate-300 inline-flex align-middle cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5 opacity-40" />
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

          {/* Edit Course Settings Modal overlay */}
          {isEditingCourseSettings && selectedCourse && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSaveCourseSettings} className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Paramètres de : {selectedCourse.title}</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingCourseSettings(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Fermer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Titre du cours</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Langue de formation</label>
                    <input
                      type="text"
                      value={editLang}
                      onChange={(e) => setEditLang(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Catégorie</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    >
                      <option value="Développement">Développement Web & Logiciel</option>
                      <option value="E-commerce">E-commerce & Dropshipping</option>
                      <option value="Design">Design UX/UI & Créativité</option>
                      <option value="Marketing">Marketing Digital & SEO</option>
                      <option value="Montage Vidéo">Montage Vidéo & Post-production</option>
                      <option value="Miniatures">Miniatures / Thumbnails YouTube</option>
                      <option value="Flyers">Flyers & Graphisme Promotionnel</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description marketing du cours</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Thème Visuel</label>
                    <select
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    >
                      <option value="indigo">Violet Royal</option>
                      <option value="emerald">Vert Émeraude</option>
                      <option value="amber">Ambre Chaleureux</option>
                      <option value="rose">Rose Romantique</option>
                      <option value="sky">Bleu Ciel</option>
                      <option value="slate">Gris Ardoise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prix normal de la formation (XAF)</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-150 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prix promotionnel (Optionnel, XAF)</label>
                    <input
                      type="number"
                      value={editPromoPrice}
                      onChange={(e) => setEditPromoPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 25000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-150 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Niveau ciblé</label>
                    <select
                      value={editLevel}
                      onChange={(e) => setEditLevel(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Tous niveaux">Tous niveaux</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Durée estimée</label>
                    <input
                      type="text"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Image de couverture URL</label>
                    <input
                      type="text"
                      value={editCover}
                      onChange={(e) => setEditCover(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Statut de publication</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    >
                      <option value="draft">Brouillon (invisible pour les élèves)</option>
                      <option value="published">Publié (accessible aux élèves inscrits)</option>
                    </select>
                  </div>
                </div>

                {/* Section SEO & Open Graph (Requirement 26) */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span>🔍 Optimisation SEO & Partage Social (Open Graph)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Configurez l'URL personnalisée, les métadonnées de référencement Google et l'image d'illustration pour le partage sur les réseaux sociaux (WhatsApp, Facebook, LinkedIn).
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3.5">
                    {/* Slug & custom URL */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-xs font-semibold text-slate-600">URL personnalisée (Slug)</label>
                        <div className="flex gap-2">
                          <span className="bg-slate-200 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-500 font-mono flex items-center select-none truncate">
                            /marketplace/
                          </span>
                          <input
                            type="text"
                            value={editSeoSlug}
                            onChange={(e) => setEditSeoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="titre-de-la-formation"
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono focus:ring-2 focus:ring-indigo-100 transition-all"
                          />
                        </div>
                        <p className="text-[9px] text-slate-450 italic">Seuls les lettres minuscules, chiffres et tirets sont autorisés.</p>
                      </div>

                      <div className="flex items-end pb-1">
                        <button
                          type="button"
                          onClick={handleAutoGenerateSlug}
                          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2 px-3 rounded-xl border border-indigo-200 transition-all cursor-pointer"
                        >
                          Générer depuis le titre
                        </button>
                      </div>
                    </div>

                    {/* Meta Title & Meta Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-slate-600">Meta Title</label>
                          <span className={`text-[9px] font-bold px-1 rounded ${editSeoTitle.length > 60 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {editSeoTitle.length}/60 car.
                          </span>
                        </div>
                        <input
                          type="text"
                          value={editSeoTitle}
                          onChange={(e) => setEditSeoTitle(e.target.value)}
                          placeholder="Titre optimisé pour les moteurs de recherche"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <p className="text-[9px] text-slate-400">Le titre qui s'affiche sur l'onglet du navigateur et les résultats de recherche Google.</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-slate-600">Meta Description</label>
                          <span className={`text-[9px] font-bold px-1 rounded ${editSeoDescription.length > 160 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {editSeoDescription.length}/160 car.
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={editSeoDescription}
                          onChange={(e) => setEditSeoDescription(e.target.value)}
                          placeholder="Description résumée pour attirer les clics dans les moteurs de recherche."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <p className="text-[9px] text-slate-400">Le résumé affiché sous le titre dans les résultats Google.</p>
                      </div>
                    </div>

                    {/* Open Graph share image */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">Image Open Graph (Partage Réseaux Sociaux)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editSeoShareImage}
                          onChange={(e) => setEditSeoShareImage(e.target.value)}
                          placeholder="https://exemple.com/image-partage-social.png"
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setEditSeoShareImage(editCover)}
                          disabled={!editCover}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Copier couverture
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400">L'image d'aperçu qui s'affiche automatiquement lorsque le lien de la formation est partagé sur WhatsApp, Facebook ou Twitter.</p>
                    </div>

                    {/* Live Preview Widget */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 mt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aperçu visuel du partage (WhatsApp / Facebook) :</p>
                      <div className="border border-slate-150 rounded-lg overflow-hidden max-w-sm mx-auto shadow-sm">
                        {editSeoShareImage ? (
                          <img src={editSeoShareImage} alt="OG Preview" className="w-full h-32 object-cover" />
                        ) : editCover ? (
                          <img src={editCover} alt="OG Preview fallback" className="w-full h-32 object-cover opacity-60" />
                        ) : (
                          <div className="w-full h-32 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">Aucune image configurée</div>
                        )}
                        <div className="p-2.5 bg-slate-50 border-t border-slate-150">
                          <p className="text-[10px] text-indigo-600 font-semibold truncate">https://dekel.formation/marketplace/{editSeoSlug || "slug-formation"}</p>
                          <h5 className="text-[11px] font-bold text-slate-800 truncate">{editSeoTitle || editTitle || "Titre de la formation"}</h5>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{editSeoDescription || editDesc || "Description de la formation..."}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Custom Payment Buttons (Requirement 5) */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Instructions de paiement & Boutons personnalisés</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Configurez vos instructions, contacts et boutons de paiement pour cette formation. Les étudiants verront ces informations lors de leur demande d'inscription.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <input
                        type="checkbox"
                        id="showPaymentInstructions"
                        checked={editShowPaymentInstructions}
                        onChange={(e) => setEditShowPaymentInstructions(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-550 cursor-pointer"
                      />
                      <label htmlFor="showPaymentInstructions" className="text-xs font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wide">
                        Afficher les instructions de paiement aux visiteurs
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-slate-500">Instructions de paiement (Markdown / texte libre)</label>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Supports Markdown</span>
                        </div>
                        <textarea
                          rows={4}
                          disabled={!editShowPaymentInstructions}
                          value={editPaymentInstructions}
                          onChange={(e) => setEditPaymentInstructions(e.target.value)}
                          placeholder="Ex: Rédigez librement vos instructions de paiement..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:bg-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-500">Informations de contact</label>
                        <textarea
                          rows={4}
                          value={editContactInfo}
                          onChange={(e) => setEditContactInfo(e.target.value)}
                          placeholder="Ex: WhatsApp: +221..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 border border-slate-150 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Boutons de paiement ({editPaymentButtons.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditPaymentButtons(prev => [
                            ...prev,
                            {
                              id: `btn-${Date.now()}`,
                              active: true,
                              text: 'Payer maintenant',
                              color: 'blue',
                              url: 'https://'
                            }
                          ]);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter un bouton
                      </button>
                    </div>

                    {editPaymentButtons.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">Aucun bouton configuré. Les étudiants devront vous contacter directement.</p>
                    ) : (
                      <div className="space-y-3">
                        {editPaymentButtons.map((btn) => (
                          <div key={btn.id} className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-3 shadow-sm relative">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={btn.active}
                                  onChange={(e) => {
                                    setEditPaymentButtons(prev => prev.map(b => b.id === btn.id ? { ...b, active: e.target.checked } : b));
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-100 w-3.5 h-3.5 cursor-pointer"
                                />
                                Actif
                              </label>

                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Texte du bouton</label>
                                  <input
                                    type="text"
                                    value={btn.text}
                                    required
                                    placeholder="Ex: Payer sur Wave"
                                    onChange={(e) => {
                                      setEditPaymentButtons(prev => prev.map(b => b.id === btn.id ? { ...b, text: e.target.value } : b));
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Couleur</label>
                                  <select
                                    value={btn.color}
                                    onChange={(e) => {
                                      setEditPaymentButtons(prev => prev.map(b => b.id === btn.id ? { ...b, color: e.target.value as any } : b));
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none"
                                  >
                                    <option value="blue">Bleu</option>
                                    <option value="green">Vert</option>
                                    <option value="red">Rouge</option>
                                    <option value="yellow">Jaune</option>
                                    <option value="purple">Violet</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Lien de redirection (URL)</label>
                                  <input
                                    type="text"
                                    value={btn.url}
                                    required
                                    placeholder="https://..."
                                    onChange={(e) => {
                                      setEditPaymentButtons(prev => prev.map(b => b.id === btn.id ? { ...b, url: e.target.value } : b));
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none focus:bg-white"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                    setEditPaymentButtons(prev => prev.filter(b => b.id !== btn.id));
                                }}
                                className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 self-end sm:self-center cursor-pointer p-1"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirement 2: Webhook payment automation section */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase border border-indigo-100">
                      🔌 Automatisation de paiement
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Webhook d'inscription instantanée</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Déclarez ce webhook unique dans n'importe quelle passerelle de paiement (Wave, Stripe, Orange Money, PayPal, etc.). 
                    Dès qu'un paiement réussit, notre serveur valide l'inscription et débloque le cours de l'élève par son adresse e-mail.
                  </p>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4">
                    {/* Webhook URL Copy */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Votre URL unique de Webhook</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/api/webhooks/payment/${selectedCourse.id}`}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-mono outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyWebhookToClipboard(`${window.location.origin}/api/webhooks/payment/${selectedCourse.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          {webhookCopied ? "Copié !" : "Copier"}
                        </button>
                      </div>
                    </div>

                    {/* Webhook JSON mapping variables */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200/65 pt-3.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Clé JSON pour l'adresse e-mail</label>
                        <input
                          type="text"
                          value={editWebhookEmailKey}
                          onChange={(e) => setEditWebhookEmailKey(e.target.value)}
                          placeholder="Ex: email, customer_email, customer.email..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-750 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                          required
                        />
                        <p className="text-[9px] text-slate-400">La clé contenant l'adresse e-mail dans le JSON reçu par votre plateforme de paiement.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Clé JSON pour le nom complet (Optionnel)</label>
                        <input
                          type="text"
                          value={editWebhookNameKey}
                          onChange={(e) => setEditWebhookNameKey(e.target.value)}
                          placeholder="Ex: name, customer_name, customer.name..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-750 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                        />
                        <p className="text-[9px] text-slate-400">La clé contenant le nom de l'élève pour le pré-enregistrement.</p>
                      </div>
                    </div>

                    {/* Webhook Live Tester */}
                    <div className="border-t border-slate-200/65 pt-3.5 space-y-3">
                      <p className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                        <span>🧪 Outil de test en direct (Simulateur)</span>
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-400 font-semibold">E-mail de l'élève de test</label>
                          <input
                            type="email"
                            placeholder="sophie.ndiaye@gmail.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-400 font-semibold">Nom complet de l'élève (Optionnel)</label>
                          <input
                            type="text"
                            placeholder="Sophie Ndiaye"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={isTestingWebhook || !testEmail}
                          onClick={handleTestWebhookSubmit}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 border border-transparent text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                          {isTestingWebhook ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Envoi en cours...</span>
                            </>
                          ) : (
                            <span>Envoyer le Webhook de test</span>
                          )}
                        </button>
                      </div>

                      {/* Display test result */}
                      {webhookTestResult && (
                        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 space-y-3 mt-2 text-[11px] text-slate-700 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Résultat du traitement</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              webhookTestResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {webhookTestResult.success ? "200 OK - Succès" : "400 Bad Request - Échec"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase">1. JSON Envoyé (Payload)</span>
                              <pre className="bg-slate-900 text-slate-200 font-mono text-[9px] p-2 rounded-lg overflow-auto max-h-32">
                                {JSON.stringify(webhookTestResult.sentPayload, null, 2)}
                              </pre>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase">2. Variables Détectées & Réponse</span>
                              <div className="bg-slate-900 text-emerald-400 font-mono text-[9px] p-2 rounded-lg overflow-auto max-h-32 space-y-1">
                                <div className="text-white border-b border-slate-800 pb-1 mb-1">
                                  Clé e-mail: <span className="text-yellow-400">"{editWebhookEmailKey || 'email'}"</span><br />
                                  Clé nom: <span className="text-yellow-400">"{editWebhookNameKey || 'name'}"</span>
                                </div>
                                <div>
                                  E-mail Détecté: <span className="text-emerald-300 font-bold">"{testEmail.trim()}"</span><br />
                                  Nom Détecté: <span className="text-emerald-300 font-bold">"{testName.trim() || ("Simulé " + testEmail.split('@')[0])}"</span>
                                </div>
                                <div className="text-white border-t border-slate-800 pt-1 mt-1 font-bold">Réponse serveur :</div>
                                <pre className="text-sky-300">{JSON.stringify(webhookTestResult.response, null, 2)}</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Webhook Hits History logs */}
                    <div className="border-t border-slate-200/65 pt-3.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-600 uppercase">📋 Historique des requêtes reçues ({webhookLogs.length})</p>
                        {webhookLogs.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearWebhookLogs}
                            className="text-[9px] text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Effacer les logs
                          </button>
                        )}
                      </div>

                      {webhookLogs.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-4 bg-white border border-slate-100 rounded-xl">
                          Aucun appel reçu pour le moment. Utilisez le testeur ci-dessus ou effectuez une requête POST externe !
                        </p>
                      ) : (
                        <div className="bg-white border border-slate-150 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-slate-50 text-[8px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                <th className="px-3 py-2">Date / Heure</th>
                                <th className="px-3 py-2">E-mail Détecté</th>
                                <th className="px-3 py-2">Statut</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {webhookLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/40">
                                  <td className="px-3 py-2 text-slate-500 font-mono">
                                    {new Date(log.receivedAt).toLocaleTimeString('fr-FR')} {new Date(log.receivedAt).toLocaleDateString('fr-FR')}
                                  </td>
                                  <td className="px-3 py-2 font-semibold text-slate-700 font-mono">
                                    {log.detectedEmail || <span className="text-rose-500">❌ Non détecté</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    {log.status === "success" ? (
                                      <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-extrabold uppercase text-[7px] border border-emerald-100">
                                        Succès
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-extrabold uppercase text-[7px] border border-rose-100">
                                        Erreur
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsEditingCourseSettings(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loadingActions['saveCourseSettings']}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    {loadingActions['saveCourseSettings'] ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>Enregistrer les paramètres</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Student enrollment list (Section 11) */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Enroll manual student box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-xl">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Ajouter un élève à une formation (Vérification paiement)</h3>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Une fois que vous avez validé le paiement par mobile money ou virement bancaire, saisissez l'email de l'élève pour lui attribuer l'accès. (Section 4)
            </p>

            <form onSubmit={handleEnrollStudent} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nom complet de l'élève</label>
                  <input
                    type="text"
                    required
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="Sophie Ndiaye"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Adresse e-mail de l'élève</label>
                  <input
                    type="email"
                    required
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    placeholder="sophie.eleve@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sélectionner la formation</label>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  >
                    <option value="">-- Choisir une formation --</option>
                    {trainerCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingActions['enrollStudent']}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                {loadingActions['enrollStudent'] ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Inscription en cours...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Valider le paiement & inscrire</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Student list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Liste de vos élèves</h3>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Rechercher par e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                      <th className="px-4 py-3">Élève</th>
                      <th className="px-4 py-3">Formation</th>
                      <th className="px-4 py-3">Date d'inscription</th>
                      <th className="px-4 py-3">Progression</th>
                      <th className="px-4 py-3">Statut Accès</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">Aucun élève n'est encore inscrit à vos formations.</td>
                    </tr>
                  ) : (
                    activeEnrollments
                      .filter(en => en.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(enroll => {
                        const course = allCourses.find(c => c.id === enroll.courseId);
                        const progress = allProgress.find(p => p.studentEmail === enroll.studentEmail && p.courseId === enroll.courseId);
                        
                        const courseChapters = allChapters.filter(ch => {
                          const mod = allModules.find(m => m.id === ch.moduleId);
                          return mod?.courseId === enroll.courseId;
                        });
                        
                        const completedCount = progress?.completedChapterIds.length || 0;
                        const totalChaps = courseChapters.length;
                        const pct = totalChaps > 0 ? Math.round((completedCount / totalChaps) * 100) : 0;

                        const matchedStudent = allUsers.find(u => u.email.toLowerCase() === enroll.studentEmail.toLowerCase());

                        return (
                          <tr key={enroll.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={matchedStudent?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                                  alt="Avatar" 
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200" 
                                />
                                <div>
                                  <p className="font-bold text-slate-800 leading-tight">
                                    {matchedStudent?.firstName ? `${matchedStudent.firstName} ${matchedStudent.name}` : (matchedStudent?.name || enroll.studentEmail.split('@')[0])}
                                  </p>
                                  <p className="text-[10px] text-slate-450">{enroll.studentEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-medium text-slate-600">
                              {course ? course.title : 'Cours inconnu'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {new Date(enroll.enrolledAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              <span className="font-bold">{pct}%</span> ({completedCount}/{totalChaps})
                            </td>
                            <td className="px-4 py-3.5">
                              {enroll.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                                  Accès actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                                  Suspendu
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1">
                              <button
                                onClick={() => setViewingUserProfile(matchedStudent || {
                                  id: 'unknown',
                                  email: enroll.studentEmail,
                                  name: enroll.studentEmail.split('@')[0],
                                  role: 'student',
                                  createdAt: enroll.enrolledAt,
                                  status: 'active'
                                })}
                                className="text-[10px] font-bold px-2 py-1 rounded border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all"
                              >
                                Voir Profil
                              </button>
                              <button
                                onClick={() => onUpdateEnrollmentStatus(enroll.id, enroll.status === 'active' ? 'revoked' : 'active')}
                                className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${
                                  enroll.status === 'active'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {enroll.status === 'active' ? 'Retirer accès' : 'Réactiver'}
                              </button>
                              <button
                                onClick={() => onDeleteEnrollment(enroll.id)}
                                title="Supprimer de l'effectif"
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 inline-flex align-middle"
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
          </div>
        </div>
      )}

      {/* Tab: Assistants & Équipe (Requirement Fine-Grained Permissions) */}
      {activeTab === 'assistants' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gestion de l'Équipe & Assistants</h2>
              <p className="text-[11px] text-slate-400 mt-1">
                Invitez des collaborateurs pour vous aider à gérer vos formations tout en contrôlant finement leurs droits.
              </p>
            </div>
            {!showAddAssistantForm && (
              <button
                type="button"
                onClick={() => setShowAddAssistantForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Inviter un assistant</span>
              </button>
            )}
          </div>

          {showAddAssistantForm && (
            <form onSubmit={handleInviteAssistant} className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xl space-y-6 animate-fade-in max-w-4xl">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                    👤
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Nouvelle Invitation d'Assistant</h3>
                    <p className="text-[10px] text-slate-400">Renseignez les informations de connexion et définissez ses droits d'accès.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAssistantForm(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informations d'identité</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={assistantFirstName}
                        onChange={(e) => setAssistantFirstName(e.target.value)}
                        placeholder="Ex: Jean"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">Nom de famille *</label>
                      <input
                        type="text"
                        required
                        value={assistantLastName}
                        onChange={(e) => setAssistantLastName(e.target.value)}
                        placeholder="Ex: Dupont"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600">Adresse E-mail de connexion *</label>
                    <input
                      type="email"
                      required
                      value={assistantEmail}
                      onChange={(e) => setAssistantEmail(e.target.value)}
                      placeholder="assistant@exemple.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600">Mot de passe provisoire *</label>
                    <input
                      type="password"
                      required
                      value={assistantPassword}
                      onChange={(e) => setAssistantPassword(e.target.value)}
                      placeholder="Mot de passe secret"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <p className="text-[9px] text-slate-400">Ce mot de passe permettra à l'assistant de se connecter directement à son espace.</p>
                  </div>
                </div>

                {/* Fine-grained permissions check list */}
                <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-150">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛡️ Droits & Permissions Très Fines</span>
                  </h4>
                  
                  <div className="space-y-3.5">
                    {/* Permission: Edit chapters */}
                    <label className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-sm cursor-pointer hover:border-indigo-150 transition-all">
                      <input
                        type="checkbox"
                        checked={assistantPermEditChapters}
                        onChange={(e) => setAssistantPermEditChapters(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-100"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Autoriser la modification des chapitres</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Permet de créer, réorganiser, renommer et modifier le contenu textuel/vidéo des chapitres de cours.</span>
                      </div>
                    </label>

                    {/* Permission: Manage comments */}
                    <label className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-sm cursor-pointer hover:border-indigo-150 transition-all">
                      <input
                        type="checkbox"
                        checked={assistantPermManageComments}
                        onChange={(e) => setAssistantPermManageComments(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-100"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Autoriser la réponse aux commentaires</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Permet d'interagir avec les élèves, de répondre aux questions du forum d'apprentissage et de supprimer les messages inappropriés.</span>
                      </div>
                    </label>

                    {/* Restricted/Forbidden action: Delete course */}
                    <div className="flex items-start gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100 shadow-sm opacity-75 select-none">
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        className="mt-0.5 rounded text-rose-300 border-rose-200 cursor-not-allowed bg-slate-100"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-rose-900">Supprimer la formation (Bloqué)</span>
                          <span className="bg-rose-100 text-rose-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                            🔒 Sécurisé
                          </span>
                        </div>
                        <span className="block text-[10px] text-rose-500/70 mt-0.5">Cette action critique est strictement réservée au formateur titulaire. L'assistant ne pourra jamais supprimer une formation.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAssistantForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold border border-slate-250 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Envoyer l'invitation
                </button>
              </div>
            </form>
          )}

          {/* Assistants list */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Membres de l'équipe ({allUsers.filter(u => u.role === 'assistant' && u.invitedBy === currentUser.email).length})</h3>
              <p className="text-[10px] text-slate-400">Liste des assistants autorisés sur votre compte formateur.</p>
            </div>

            {allUsers.filter(u => u.role === 'assistant' && u.invitedBy === currentUser.email).length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-4xl">👥</div>
                <h4 className="text-xs font-bold text-slate-700">Aucun assistant pour le moment</h4>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                  Simplifiez-vous la vie en déléguant des tâches à un assistant (réponses aux questions, modification du contenu). Invitez votre premier assistant dès maintenant !
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddAssistantForm(true)}
                  className="mt-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un premier assistant</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Collaborateur</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">Permissions Très Fines</th>
                      <th className="py-3 px-4">Statut d'accès</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {allUsers
                      .filter(u => u.role === 'assistant' && u.invitedBy === currentUser.email)
                      .map((assistant) => {
                        const perms = assistant.permissions || [];
                        return (
                          <tr key={assistant.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center border border-emerald-200 uppercase">
                                  {assistant.firstName?.[0] || assistant.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{assistant.firstName} {assistant.name}</p>
                                  <p className="text-[10px] text-slate-400">Inscrit le {new Date(assistant.createdAt).toLocaleDateString('fr-FR')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                              {assistant.email}
                            </td>
                            <td className="py-3.5 px-4 space-y-1">
                              {/* Chapter editing permission toggler */}
                              <button
                                type="button"
                                onClick={() => handleToggleAssistantPermission(assistant, 'edit_chapters')}
                                className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                  perms.includes('edit_chapters')
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 line-through'
                                }`}
                              >
                                <span>{perms.includes('edit_chapters') ? '✓' : '✗'} Modifier les chapitres</span>
                              </button>

                              {/* Comment managing permission toggler */}
                              <button
                                type="button"
                                onClick={() => handleToggleAssistantPermission(assistant, 'manage_comments')}
                                className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                  perms.includes('manage_comments')
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 line-through'
                                }`}
                              >
                                <span>{perms.includes('manage_comments') ? '✓' : '✗'} Répondre aux commentaires</span>
                              </button>

                              {/* Forbidden delete courses permission */}
                              <div className="text-[9px] font-bold px-2 py-1 rounded-lg border bg-rose-50 border-rose-100 text-rose-500/70 flex items-center gap-1 cursor-not-allowed select-none w-max">
                                <span>🔒 Supprimer formations</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                assistant.status === 'active' || !assistant.status
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {assistant.status === 'active' || !assistant.status ? 'Actif' : 'Désactivé'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleAssistantStatus(assistant)}
                                className={`text-[10px] font-bold py-1 px-2.5 rounded-xl border transition-all mr-2 cursor-pointer ${
                                  assistant.status === 'active' || !assistant.status
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {assistant.status === 'active' || !assistant.status ? 'Suspendre' : 'Réactiver'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Webhook Journal */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Journal de Réception des Webhooks</h2>
              <p className="text-[11px] text-slate-400 mt-1">
                Suivez en temps réel tous les signaux d'inscription instantanée envoyés par vos passerelles de paiement externes.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchGlobalLogs}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🔄 Actualiser</span>
              </button>
              {globalWebhookLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllWebhookLogs}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider les journaux</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recherche par e-mail ou contenu</label>
              <input
                type="text"
                placeholder="Ex: student@gmail.com, payload content..."
                value={globalWebhookSearch}
                onChange={(e) => setGlobalWebhookSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filtrer par formation</label>
              <select
                value={globalWebhookFilterCourseId}
                onChange={(e) => setGlobalWebhookFilterCourseId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Toutes les formations</option>
                {trainerCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filtrer par statut</label>
              <select
                value={globalWebhookFilterStatus}
                onChange={(e) => setGlobalWebhookFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Tous les statuts</option>
                <option value="success">Succès (Accès accordé)</option>
                <option value="failed">Erreur (Accès refusé)</option>
              </select>
            </div>
          </div>

          {/* Webhook Journal List */}
          <div className="space-y-3">
            {(() => {
              // Apply filters
              const filteredLogs = globalWebhookLogs.filter(log => {
                const searchLower = globalWebhookSearch.toLowerCase();
                const matchesSearch = !globalWebhookSearch ||
                  (log.detectedEmail && log.detectedEmail.toLowerCase().includes(searchLower)) ||
                  (log.detectedName && log.detectedName.toLowerCase().includes(searchLower)) ||
                  (log.body && JSON.stringify(log.body).toLowerCase().includes(searchLower)) ||
                  (log.errorMessage && log.errorMessage.toLowerCase().includes(searchLower));

                const matchesCourse = !globalWebhookFilterCourseId || log.courseId === globalWebhookFilterCourseId;

                const matchesStatus = !globalWebhookFilterStatus ||
                  (globalWebhookFilterStatus === 'success' && log.status === 'success') ||
                  (globalWebhookFilterStatus === 'failed' && log.status !== 'success');

                return matchesSearch && matchesCourse && matchesStatus;
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-400 italic">Aucun log de Webhook ne correspond à vos critères de recherche.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredLogs.map(log => {
                    const isExpanded = expandedLogId === log.id;
                    const course = allCourses.find(c => c.id === log.courseId);
                    const formattedDate = new Date(log.receivedAt).toLocaleString('fr-FR');

                    return (
                      <div
                        key={log.id}
                        className={`bg-white border transition-all rounded-2xl overflow-hidden shadow-sm ${
                          isExpanded ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header card / Row summary */}
                        <div
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-start gap-3">
                            <span className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase mt-0.5 tracking-wider shrink-0 ${
                              log.status === 'success' 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                : 'bg-rose-50 border border-rose-100 text-rose-700'
                            }`}>
                              {log.status === 'success' ? 'Accordé' : 'Refusé'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-slate-800">
                                  {log.detectedEmail || <span className="text-rose-500 font-sans italic">E-mail non détecté</span>}
                                </span>
                                {log.detectedName && (
                                  <span className="text-[11px] text-slate-500 font-medium">({log.detectedName})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 mt-0.5">
                                <span className="font-semibold text-slate-500 truncate max-w-[200px]">
                                  📚 {course ? course.title : `Formation #${log.courseId}`}
                                </span>
                                <span>•</span>
                                <span>🕒 {formattedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                            <div className="text-left md:text-right">
                              <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">{log.method} • HTTP {log.status === 'success' ? '200' : '400'}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[280px]">{log.outcome || log.status}</p>
                            </div>
                            <span className="text-slate-450 text-xs font-bold">
                              {isExpanded ? '▲ Réduire' : '▼ Détails'}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Metadata Panel */}
                              <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Données Détectées</h4>
                                <table className="w-full text-left">
                                  <tbody>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 text-[10px] font-bold text-slate-400">Date de réception</td>
                                      <td className="py-1 font-mono text-slate-700 text-[11px]">{formattedDate}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 text-[10px] font-bold text-slate-400">URL appelée</td>
                                      <td className="py-1 font-mono text-slate-700 text-[11px] break-all">{log.url}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 text-[10px] font-bold text-slate-400">Méthode HTTP</td>
                                      <td className="py-1 font-bold font-mono text-slate-700 text-[11px]">{log.method}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 text-[10px] font-bold text-slate-400">Formation cible</td>
                                      <td className="py-1 font-semibold text-slate-700">{course ? course.title : `Formation #${log.courseId}`}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 text-[10px] font-bold text-slate-400">Étudiant identifié</td>
                                      <td className="py-1 font-bold text-indigo-700 font-mono">{log.detectedEmail || "Aucun"}</td>
                                    </tr>
                                    {log.detectedName && (
                                      <tr className="border-b border-slate-100">
                                        <td className="py-1 text-[10px] font-bold text-slate-400">Nom détecté</td>
                                        <td className="py-1 text-slate-700 font-medium">{log.detectedName}</td>
                                      </tr>
                                    )}
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 text-[10px] font-bold text-slate-400">Résultat final</td>
                                      <td className="py-1">
                                        <span className={`font-bold ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {log.status === 'success' ? 'Accès accordé' : 'Accès refusé'}
                                        </span>
                                      </td>
                                    </tr>
                                    {log.errorMessage && (
                                      <tr>
                                        <td className="py-1 text-[10px] font-bold text-rose-500">Motif de l'erreur</td>
                                        <td className="py-1 text-rose-600 font-semibold leading-tight">{log.errorMessage}</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* HTTP Headers */}
                              <div className="space-y-1.5 flex flex-col">
                                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">En-têtes HTTP (Headers)</h4>
                                <div className="bg-slate-900 text-slate-100 font-mono text-[9px] p-3 rounded-xl overflow-auto max-h-48 flex-1 shadow-inner leading-relaxed">
                                  {log.headers ? (
                                    <pre>{JSON.stringify(log.headers, null, 2)}</pre>
                                  ) : (
                                    <span className="italic text-slate-400">Aucun en-tête reçu.</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* JSON Body */}
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Corps de la requête JSON (Body)</h4>
                              <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3.5 rounded-xl overflow-auto max-h-64 shadow-inner leading-relaxed">
                                {log.body ? (
                                  <pre>{JSON.stringify(log.body, null, 2)}</pre>
                                ) : (
                                  <span className="italic text-slate-400">Le corps de la requête est vide ou non lisible.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 5: Course Editor curriculum (Modules & Chapters) (Section 8) */}
      {activeTab === 'course-editor' && selectedCourse && (
        <div className="space-y-6 animate-fade-in">
          {/* Back to courses */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => { setSelectedCourseId(null); setActiveTab('courses'); }}
              className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
            >
              ← Retour à mes formations
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black text-slate-800 truncate max-w-xs sm:max-w-md">Contenu de : {selectedCourse.title}</h2>
              {onPreviewCourse && (
                <button
                  type="button"
                  onClick={() => onPreviewCourse(selectedCourse)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Prévisualiser</span>
                </button>
              )}
            </div>
          </div>

          {/* Unique Administration Space: Structure de la formation */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Header / Subtitle & Add module button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Structure de la formation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toute la gestion de la structure (modules et chapitres) est centralisée ici, proche d'un explorateur de fichiers.
                </p>
              </div>
              
              {/* Add Module Form Button/Field Inline */}
              <form onSubmit={handleAddModuleSubmit} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  required
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Nom du nouveau module"
                  className="flex-1 sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={loadingActions['addModule']}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all shrink-0"
                >
                  {loadingActions['addModule'] ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un module</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Backdrops to close dropdowns when clicking outside */}
            {activeModMenuId && (
              <div className="fixed inset-0 z-20 bg-transparent" onClick={() => setActiveModMenuId(null)} />
            )}
            {activeChMenuId && (
              <div className="fixed inset-0 z-20 bg-transparent" onClick={() => setActiveChMenuId(null)} />
            )}

            {/* Hierarchical modules list */}
            <div className="space-y-4">
              {courseModules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Aucun module dans cette formation.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Saisissez un nom ci-dessus pour créer votre premier module.</p>
                </div>
              ) : (
                courseModules.map((mod, modIdx) => {
                  const chapters = moduleChaptersMap(mod.id);
                  const isExpanded = !!expandedTrainerModuleIds[mod.id];
                  const isModActive = mod.active !== false;
                  const isRenaming = modToRenameId === mod.id;
                  const isAnyMenuOpenInThisMod = activeModMenuId === mod.id || chapters.some(ch => ch.id === activeChMenuId);

                  return (
                    <div
                      key={mod.id}
                      className={`border border-slate-200 rounded-2xl transition-all duration-200 bg-white shadow-sm relative ${
                        isAnyMenuOpenInThisMod ? 'z-30 overflow-visible' : 'z-10 overflow-hidden'
                      }`}
                    >
                      
                      {/* Module Header Row */}
                      <div className={`course-editor-module-header p-4 flex items-center justify-between gap-3 select-none ${isModActive ? 'bg-slate-50/60' : 'bg-slate-100/50 opacity-80'}`}>
                        <div className="flex items-center gap-2.5 truncate flex-1">
                          {/* Accordion toggle arrow */}
                          <button
                            type="button"
                            onClick={() => toggleTrainerModule(mod.id)}
                            className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-500 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          {/* Module folder/number index */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isModActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                            {mod.order}
                          </div>

                          {/* Title / Renaming Mode */}
                          {isRenaming ? (
                            <div className="flex items-center gap-1.5 flex-1 max-w-md">
                              <input
                                type="text"
                                value={modRenameTitle}
                                onChange={(e) => setModRenameTitle(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRenameModuleSave(mod); }}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                                title="Sauvegarder"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setModToRenameId(null); }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Annuler"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="truncate cursor-pointer flex-1" onClick={() => toggleTrainerModule(mod.id)}>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs truncate">
                                  {mod.title}
                                </span>
                                {/* Active/Inactive Badge */}
                                {isModActive ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 shrink-0">
                                    Visible
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 shrink-0 flex items-center gap-1">
                                    <EyeOff className="w-2.5 h-2.5" />
                                    Masqué
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{chapters.length} chapitre(s)</p>
                            </div>
                          )}
                        </div>

                        {/* Module Actions Toolbar */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Reordering buttons */}
                          <button
                            type="button"
                            disabled={modIdx === 0}
                            onClick={() => handleMoveModule(mod, 'up')}
                            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-500 disabled:opacity-20 transition-colors"
                            title="Déplacer vers le haut"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={modIdx === courseModules.length - 1}
                            onClick={() => handleMoveModule(mod, 'down')}
                            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-500 disabled:opacity-20 transition-colors"
                            title="Déplacer vers le bas"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Settings Trigger Icon (⚙️) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveModMenuId(activeModMenuId === mod.id ? null : mod.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                activeModMenuId === mod.id
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                              }`}
                              title="Paramètres du module"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeModMenuId === mod.id && (
                              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-slate-800 animate-fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggleModuleActive(mod);
                                    setActiveModMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 transition-colors"
                                >
                                  {isModActive ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                      <span className="text-slate-700">Désactiver le module</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="text-slate-700">Activer le module</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModToRenameId(mod.id);
                                    setModRenameTitle(mod.title);
                                    setActiveModMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="text-slate-700">Renommer</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    openNewChapter(mod.id);
                                    setActiveModMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="text-slate-700">Ajouter un chapitre</span>
                                </button>
                                <hr className="border-slate-100 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteModuleClick(mod.id);
                                    setActiveModMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-xs text-rose-600 flex items-center gap-2.5 font-bold transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Supprimer le module</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Module body - nested chapters */}
                      {isExpanded && (
                        <div className="course-editor-chapter-list-container p-4 bg-slate-50/30 border-t border-slate-100 space-y-3">
                          
                          {/* Chapters tree connection container */}
                          <div className="border-l-2 border-slate-200 ml-5 pl-4 py-1 space-y-2.5">
                            {chapters.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">
                                Aucun chapitre dans ce module.
                              </p>
                            ) : (
                              chapters.map((ch, idx) => {
                                const isChActive = ch.active !== false;

                                return (
                                  <div
                                    key={ch.id}
                                    className={`relative bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm transition-all hover:border-slate-300 ${
                                      activeChMenuId === ch.id ? 'z-40' : 'z-10'
                                    } ${
                                      isChActive ? '' : 'bg-slate-100/60 opacity-85'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 truncate">
                                      {/* Chapter Icon */}
                                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isChActive ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                                        <Play className="w-3 h-3 fill-current" />
                                      </div>

                                      <div className="truncate">
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-bold text-slate-800 truncate">
                                            {ch.title}
                                          </p>
                                          
                                          {/* Access status */}
                                          {ch.isFree ? (
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                              Gratuit
                                            </span>
                                          ) : (
                                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                              Payant
                                            </span>
                                          )}

                                          {/* Chapter Active badge */}
                                          {!isChActive && (
                                            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 flex items-center gap-1 scale-90">
                                              <EyeOff className="w-2 h-2" />
                                              Masqué
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">
                                          Source : {ch.videoSource.toUpperCase()} • {(ch.richText || '').length} car.
                                        </p>
                                      </div>
                                    </div>

                                    {/* Chapter actions toolbar */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Move buttons */}
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => handleMoveChapter(ch, 'up')}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-20 transition-colors"
                                        title="Déplacer vers le haut"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === chapters.length - 1}
                                        onClick={() => handleMoveChapter(ch, 'down')}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-20 transition-colors"
                                        title="Déplacer vers le bas"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Gear/Settings trigger icon (⚙️) */}
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setActiveChMenuId(activeChMenuId === ch.id ? null : ch.id)}
                                          className={`p-1.5 rounded-lg border transition-all ${
                                            activeChMenuId === ch.id
                                              ? 'bg-indigo-600 border-indigo-500 text-white'
                                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                          }`}
                                          title="Paramètres du chapitre"
                                        >
                                          <Settings className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeChMenuId === ch.id && (
                                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-slate-800 animate-fade-in">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleToggleChapterActive(ch);
                                                setActiveChMenuId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 transition-colors"
                                            >
                                              {isChActive ? (
                                                <>
                                                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                                  <span className="text-slate-700">Désactiver le chapitre</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                                  <span className="text-slate-700">Activer le chapitre</span>
                                                </>
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                openEditChapter(ch);
                                                setActiveChMenuId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 transition-colors"
                                            >
                                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                                              <span className="text-slate-700">Modifier</span>
                                            </button>
                                            <hr className="border-slate-100 my-1" />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleDeleteChapterClick(ch.id);
                                                setActiveChMenuId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 hover:bg-rose-50 text-xs text-rose-600 flex items-center gap-2.5 font-bold transition-colors"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                              <span>Supprimer</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}

                            {/* Create Chapter button inside module */}
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => openNewChapter(mod.id)}
                                className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Ajouter un chapitre</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Chapter Creation & Editing Overlay panel (Section 8, 9, 10) */}
          {isEditingChapter && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSaveChapter} className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                      {selectedChapterId ? 'Modifier' : 'Nouveau'} Chapitre
                    </h3>
                    <p className="text-[10px] text-indigo-600">Module de destination : Module {allModules.find(m => m.id === editingModuleId)?.order}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingChapter(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Fermer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left panel: Info + Video */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Titre du chapitre / cours</label>
                        <input
                          type="text"
                          required
                          value={chTitle}
                          onChange={(e) => setChTitle(e.target.value)}
                          placeholder="Ex: 1. Les balises HTML fondamentales"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Niveau d'accès</label>
                        <select
                          value={chIsFree ? 'free' : 'locked'}
                          onChange={(e) => setChIsFree(e.target.value === 'free')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-semibold"
                        >
                          <option value="locked">🔒 Réservé aux étudiants inscrits</option>
                          <option value="free">✅ Accessible gratuitement (Aperçu)</option>
                        </select>
                      </div>
                    </div>

                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        <span>Source Vidéo (Section 9)</span>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {(['youtube', 'vimeo', 'direct', 'iframe'] as const).map(source => (
                          <button
                            key={source}
                            type="button"
                            onClick={() => setChVideoSrc(source)}
                            className={`py-1.5 px-3 rounded-lg border text-center text-xs font-semibold uppercase transition-all ${
                              chVideoSrc === source
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {source}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">URL de la vidéo ou iframe embed</label>
                        <input
                          type="text"
                          value={chVideoUrl}
                          onChange={(e) => setChVideoUrl(e.target.value)}
                          placeholder={
                            chVideoSrc === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                            chVideoSrc === 'vimeo' ? 'https://vimeo.com/...' :
                            chVideoSrc === 'iframe' ? '<iframe src=...>' : 'https://serveur.com/video.mp4'
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    {/* Resources box */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ressources à télécharger (Lien HTTP avec son nom)</span>
                      </p>

                      <div className="space-y-2">
                        {chFiles.map(f => (
                          <div key={f.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg text-[10px] gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-700 truncate block">{f.name}</span>
                              <span className="text-[9px] text-indigo-500 truncate block font-mono">{f.url}</span>
                            </div>
                            <span className="text-slate-400 shrink-0">{f.size}</span>
                            <button
                              type="button"
                              onClick={() => setChFiles(chFiles.filter(item => item.id !== f.id))}
                              className="text-red-500 font-bold hover:underline shrink-0 text-[9px]"
                            >
                              Suppr.
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 bg-white/70 p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={tempFileName}
                            onChange={(e) => setTempFileName(e.target.value)}
                            placeholder="Nom du fichier / de la ressource"
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                          />
                          <input
                            type="text"
                            value={tempFileSize}
                            onChange={(e) => setTempFileSize(e.target.value)}
                            placeholder="Taille ou Type (ex: PDF, ZIP)"
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={tempFileUrl}
                            onChange={(e) => setTempFileUrl(e.target.value)}
                            placeholder="Lien HTTP de la ressource (ex: https://...)"
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={addFileRow}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 text-xs font-bold shrink-0"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Links box */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Liens complémentaires</span>
                      </p>

                      <div className="space-y-2">
                        {chLinks.map(l => (
                          <div key={l.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg text-[10px]">
                            <span className="font-bold text-slate-700 truncate max-w-[180px]">{l.title}</span>
                            <button
                              type="button"
                              onClick={() => setChLinks(chLinks.filter(item => item.id !== l.id))}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Suppr.
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={tempLinkTitle}
                          onChange={(e) => setTempLinkTitle(e.target.value)}
                          placeholder="Titre (ex: Documentation MDN)"
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                        />
                        <input
                          type="text"
                          value={tempLinkUrl}
                          onChange={(e) => setTempLinkUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={addLinkRow}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 text-xs"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>

                    {/* Link Button (CTA) */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        Bouton d'action principal (CTA)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={chBtnLabel}
                          onChange={(e) => setChBtnLabel(e.target.value)}
                          placeholder="Texte du bouton (ex: Passer le quiz)"
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px]"
                        />
                        <input
                          type="text"
                          value={chBtnUrl}
                          onChange={(e) => setChBtnUrl(e.target.value)}
                          placeholder="https://formulaire.com"
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Rich text simulated editor (Section 10) */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Éditeur de texte Markdown (Seul format accepté)
                    </label>
                    
                    {/* Rich toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border border-b-0 border-slate-200 rounded-t-xl shrink-0">
                      <button type="button" onClick={() => appendToRichText('b')} title="Gras" className="p-1.5 hover:bg-slate-200 rounded text-xs font-bold">Gras</button>
                      <button type="button" onClick={() => appendToRichText('i')} title="Italique" className="p-1.5 hover:bg-slate-200 rounded text-xs italic">Italique</button>
                      <button type="button" onClick={() => appendToRichText('code')} title="Bloc de code" className="p-1.5 hover:bg-slate-200 rounded text-xs font-mono bg-slate-50">Code</button>
                      <button type="button" onClick={() => appendToRichText('list')} title="Liste à puces" className="p-1.5 hover:bg-slate-200 rounded text-xs">Liste</button>
                      <button type="button" onClick={() => appendToRichText('quote')} title="Citation" className="p-1.5 hover:bg-slate-200 rounded text-xs">Citation</button>
                      <button type="button" onClick={() => appendToRichText('link')} title="Lien" className="p-1.5 hover:bg-slate-200 rounded text-xs text-indigo-600 underline">Lien</button>
                      <button type="button" onClick={() => appendToRichText('table')} title="Tableau" className="p-1.5 hover:bg-slate-200 rounded text-xs">Tableau</button>
                    </div>

                    <textarea
                      value={chRichText}
                      onChange={(e) => setChRichText(e.target.value)}
                      placeholder="Saisissez votre leçon au format Markdown (ex : # Titre, **texte gras**, etc.)..."
                      className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-b-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono min-h-[350px] resize-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Le format Markdown est le seul format accepté. Il sera converti en HTML propre et stylisé pour l'étudiant.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsEditingChapter(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loadingActions['saveChapter']}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    {loadingActions['saveChapter'] ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>Enregistrer le chapitre</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Visualiser Profil Modal */}
      {viewingUserProfile && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade-in text-slate-800 space-y-4">
            <button
              onClick={() => setViewingUserProfile(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center space-y-3">
              <img 
                src={viewingUserProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt={viewingUserProfile.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500/20 shadow-md mx-auto"
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
              className="w-full py-2.5 px-4 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition-all mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
