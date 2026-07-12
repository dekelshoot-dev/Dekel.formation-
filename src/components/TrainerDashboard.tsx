import React, { useState } from 'react';
import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent, DownloadableFile, ExternalLink, CustomPaymentButton } from '../types';
import { 
  BarChart3, BookOpen, Users, Settings, User as UserIcon, Plus, Trash2, Copy, 
  Share2, Edit3, Save, ArrowUp, ArrowDown, Check, CheckCircle2, AlertCircle, 
  HelpCircle, Eye, Play, FileText, ExternalLink as LinkIcon, Globe, Image, Video
} from 'lucide-react';

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
  onUpdateUser
}: TrainerDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'courses' | 'students' | 'course-editor'>('dashboard');
  
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
  const [profileBio, setProfileBio] = useState(currentUser.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatarUrl || '');

  // 1. Filter Courses belonging to THIS trainer
  const trainerCourses = allCourses.filter(c => c.trainerId === currentUser.id);
  const selectedCourse = allCourses.find(c => c.id === selectedCourseId && c.trainerId === currentUser.id);

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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name: profileName,
      bio: profileBio,
      avatarUrl: profileAvatar
    });
    triggerToast('Vos informations ont été mises à jour !');
  };

  // Add Course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

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

    onAddCourse(newCourse);
    setNewCourseTitle('');
    setShowAddCourseForm(false);
    triggerToast('Formation créée avec succès en mode Brouillon !');
    
    // Auto-select and open editor
    setSelectedCourseId(newCourse.id);
    setActiveTab('course-editor');
  };

  // Duplicate Course
  const handleDuplicateCourse = (course: Course) => {
    const newCourse: Course = {
      ...course,
      id: `c-${Date.now()}`,
      title: `${course.title} (Copie)`,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    onAddCourse(newCourse);

    // Also duplicate its modules and chapters!
    const origModules = allModules.filter(m => m.courseId === course.id);
    origModules.forEach(oldMod => {
      const newModId = `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newMod: Module = {
        id: newModId,
        courseId: newCourse.id,
        title: oldMod.title,
        order: oldMod.order
      };
      onAddModule(newMod);

      const oldChapters = allChapters.filter(ch => ch.moduleId === oldMod.id);
      oldChapters.forEach(oldCh => {
        const newCh: Chapter = {
          ...oldCh,
          id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          moduleId: newModId
        };
        onAddChapter(newCh);
      });
    });

    triggerToast('Formation dupliquée avec succès !');
  };

  // Course settings edit save
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLang, setEditLang] = useState('Français');
  const [editColor, setEditColor] = useState<'indigo'|'slate'|'emerald'|'amber'|'rose'|'sky'>('indigo');
  const [editPrice, setEditPrice] = useState(125000);
  const [editLevel, setEditLevel] = useState<'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux'>('Tous niveaux');
  const [editDuration, setEditDuration] = useState('10 heures');
  const [editCover, setEditCover] = useState('');
  const [editStatus, setEditStatus] = useState<'published' | 'draft'>('draft');
  
  // Custom Payment settings (Requirement 5)
  const [editPaymentInstructions, setEditPaymentInstructions] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editPaymentButtons, setEditPaymentButtons] = useState<CustomPaymentButton[]>([]);

  // Webhook settings & tester states (Requirement 2)
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);

  const openCourseSettings = (c: Course) => {
    setSelectedCourseId(c.id);
    setEditTitle(c.title);
    setEditDesc(c.description);
    setEditLang(c.language);
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
    
    // Reset test fields
    setTestEmail('');
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

    onUpdateCourse({
      ...selectedCourse,
      title: editTitle,
      description: editDesc,
      language: editLang,
      themeColor: editColor,
      price: Number(editPrice),
      level: editLevel,
      duration: editDuration,
      coverImage: editCover,
      status: editStatus,
      paymentInstructions: editPaymentInstructions,
      contactInfo: editContactInfo,
      customPaymentButtons: editPaymentButtons
    });

    setIsEditingCourseSettings(false);
    triggerToast('Paramètres de la formation enregistrés !');
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

    try {
      const res = await fetch(`/api/webhooks/payment/${selectedCourse.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmail, event: 'payment.success', amount: selectedCourse.price })
      });
      const data = await res.json();
      
      if (res.ok) {
        triggerToast(`Webhook reçu avec succès ! L'étudiant "${testEmail}" a été inscrit en arrière-plan.`);
        setTestEmail('');
      } else {
        triggerToast(`Erreur webhook : ${data.message}`);
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

    const newOrder = courseModules.length + 1;
    const newMod: Module = {
      id: `m-${Date.now()}`,
      courseId: selectedCourseId,
      title: newModuleTitle,
      order: newOrder
    };

    onAddModule(newMod);
    setNewModuleTitle('');
    triggerToast('Module ajouté !');
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
    setEditingModuleId(chapter.moduleId);
    setSelectedChapterId(chapter.id);
    setChTitle(chapter.title);
    setChVideoSrc(chapter.videoSource);
    setChVideoUrl(chapter.videoUrl);
    setChRichText(chapter.richText);
    setChFiles(chapter.downloadableFiles || []);
    setChLinks(chapter.externalLinks || []);
    setChBtnLabel(chapter.linkButton?.label || '');
    setChBtnUrl(chapter.linkButton?.url || '');
    setChIsFree(chapter.isFree || false);
    setIsEditingChapter(true);
  };

  const handleSaveChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chTitle) return;

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
        onUpdateChapters(allUpdated);
        triggerToast('Chapitre mis à jour avec succès !');
      }
    } else {
      // Create new
      const siblingChapters = allChapters.filter(ch => ch.moduleId === editingModuleId);
      const newOrder = siblingChapters.length + 1;
      const newCh: Chapter = {
        id: `ch-${Date.now()}`,
        moduleId: editingModuleId,
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
      onAddChapter(newCh);
      triggerToast('Nouveau chapitre créé !');
    }

    setIsEditingChapter(false);
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
        onUpdateEnrollmentStatus(alreadyEnrolled.id, 'active');
        triggerToast(`Accès réactivé pour ${emailTrimmed} !`);
        return;
      }
      alert('Cet élève est déjà inscrit à cette formation !');
      return;
    }

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
      } else {
        onAddPreRegistered({
          email: emailTrimmed,
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

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-50"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle formation</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold overflow-x-auto pb-1">
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
        <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-lg space-y-4 animate-fade-in">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Informations Publiques du Formateur</h2>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nom complet affiché</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Biographie / Expertise</label>
            <textarea
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              rows={3}
              placeholder="Ex: Formateur React et entrepreneur e-commerce depuis 10 ans..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Photo de profil URL</label>
            <input
              type="text"
              value={profileAvatar}
              onChange={(e) => setProfileAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <p className="text-[9px] text-slate-400 mt-1">Entrez une URL d'image valide pour personnaliser votre avatar sur les fiches de cours.</p>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow"
          >
            Sauvegarder mon profil
          </button>
        </form>
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
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow"
                >
                  Continuer vers l'éditeur
                </button>
              </div>
            </form>
          )}

          {/* Courses Table (Section 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
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
                        <td className="px-4 py-3.5 text-right space-x-1">
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
                            title="Dupliquer la formation"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 inline-flex align-middle"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCourse(course.id)}
                            title="Supprimer la formation"
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Prix de la formation (XAF)</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
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

                {/* Section 5: Custom Payment Buttons (Requirement 5) */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Instructions de paiement & Boutons personnalisés</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Configurez vos instructions, contacts et boutons de paiement pour cette formation. Les étudiants verront ces informations lors de leur demande d'inscription.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Instructions de paiement</label>
                      <textarea
                        rows={3}
                        value={editPaymentInstructions}
                        onChange={(e) => setEditPaymentInstructions(e.target.value)}
                        placeholder="Ex: Envoyez le montant par Orange Money au..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Informations de contact</label>
                      <textarea
                        rows={3}
                        value={editContactInfo}
                        onChange={(e) => setEditContactInfo(e.target.value)}
                        placeholder="Ex: WhatsApp: +221..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
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

                    {/* Webhook Live Tester */}
                    <div className="border-t border-slate-200/65 pt-3.5 space-y-2">
                      <p className="text-[10px] font-bold text-slate-600 uppercase">🧪 Testeur de Webhook en direct (Simulateur)</p>
                      <div className="flex flex-col sm:flex-row gap-2 items-end">
                        <div className="flex-1 space-y-0.5">
                          <label className="block text-[9px] text-slate-400 font-semibold">Adresse e-mail de l'élève de test</label>
                          <input
                            type="email"
                            placeholder="exemple.eleve@gmail.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isTestingWebhook || !testEmail}
                          onClick={handleTestWebhookSubmit}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 border border-transparent text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          {isTestingWebhook ? "Appel en cours..." : "Simuler POST Webhook"}
                        </button>
                      </div>
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
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                  >
                    Enregistrer les paramètres
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Adresse e-mail de l'élève</label>
                  <input
                    type="email"
                    required
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    placeholder="sophie.eleve@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sélectionner la formation</label>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white"
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Valider le paiement & inscrire</span>
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
              <table className="w-full text-left border-collapse">
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

                        return (
                          <tr key={enroll.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-800">{enroll.studentEmail}</p>
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
      )}

      {/* Tab 5: Course Editor curriculum (Modules & Chapters) (Section 8) */}
      {activeTab === 'course-editor' && selectedCourse && (
        <div className="space-y-6 animate-fade-in">
          {/* Back to courses */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectedCourseId(null); setActiveTab('courses'); }}
              className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
            >
              ← Retour à mes formations
            </button>
            <h2 className="text-sm font-black text-slate-800 truncate max-w-md">Contenu de : {selectedCourse.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side modules list */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Structure / Modules</h3>
                
                {/* Add Module Form */}
                <form onSubmit={handleAddModuleSubmit} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    required
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Nom du nouveau module"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2">
                  {courseModules.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Aucun module créé pour le moment.</p>
                  ) : (
                    courseModules.map((mod, index) => (
                      <div
                        key={mod.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <p className="text-[10px] font-bold text-indigo-600">Module {mod.order}</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{mod.title}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveModule(mod, 'up')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={index === courseModules.length - 1}
                            onClick={() => handleMoveModule(mod, 'down')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteModule(mod.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right side chapters inside modules list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Chapitres par module</h3>
                </div>

                {courseModules.map(mod => {
                  const chapters = moduleChaptersMap(mod.id);
                  return (
                    <div key={mod.id} className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-slate-50/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide">Module {mod.order}</p>
                          <h4 className="text-xs font-bold text-slate-800">{mod.title}</h4>
                        </div>
                        <button
                          onClick={() => openNewChapter(mod.id)}
                          className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Ajouter un chapitre</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {chapters.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2 pl-2">Aucun chapitre dans ce module.</p>
                        ) : (
                          chapters.map((ch, idx) => (
                            <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5 truncate">
                                <Play className="w-3.5 h-3.5 text-slate-400" />
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{ch.title}</p>
                                    {ch.isFree && (
                                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0">Gratuit</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-medium">Source : {ch.videoSource.toUpperCase()} • {(ch.richText || '').length} car.</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  disabled={idx === 0}
                                  onClick={() => handleMoveChapter(ch, 'up')}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={idx === chapters.length - 1}
                                  onClick={() => handleMoveChapter(ch, 'down')}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openEditChapter(ch)}
                                  className="p-1 hover:bg-slate-100 rounded text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteChapter(ch.id)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                  >
                    Enregistrer le chapitre
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
