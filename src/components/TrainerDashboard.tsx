import React, { useState, useEffect } from 'react';
import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent, DownloadableFile, ExternalLink, CustomPaymentButton, CourseQuiz, CustomHtmlPage } from '../types';
import { 
  BarChart3, BookOpen, Users, Settings, User as UserIcon, Plus, Trash2, Copy, 
  Share2, Edit3, Save, ArrowUp, ArrowDown, Check, CheckCircle2, AlertCircle, 
  HelpCircle, Eye, EyeOff, Play, FileText, ExternalLink as LinkIcon, Globe, Image, Video,
  Mail, Phone, X, ChevronDown, ChevronRight, Folder, Menu, MessageSquare,
  Upload, Download, FileSpreadsheet, FileCode, Sparkles, Search, Award, FileQuestion, BarChart2, RefreshCw
} from 'lucide-react';
import { showToast } from './Toast';
import UserProfile from './UserProfile';
import CustomPagesManager from './CustomPagesManager';
import EmailBroadcastManager from './EmailBroadcastManager';
import ModuleProgressChart from './ModuleProgressChart';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { cleanUndefined } from '../firebaseService';
import { QuizEditorModal } from './QuizEditorModal';
import { TrainerQuizStatsModal } from './TrainerQuizStatsModal';
import { ConfirmModal } from './ConfirmModal';
import { emailTriggers } from '../services/emailClient';

interface TrainerDashboardProps {
  currentUser: User;
  allUsers: User[];
  allCourses: Course[];
  allModules: Module[];
  allChapters: Chapter[];
  allEnrollments: Enrollment[];
  allProgress: StudentProgress[];
  preRegistered: PreRegisteredStudent[];
  categories?: string[];
  customPages?: CustomHtmlPage[];
  onAddCategory?: (cat: string) => void;
  onDeleteCategory?: (cat: string) => void;
  onSaveCustomPage?: (page: CustomHtmlPage) => void;
  onDeleteCustomPage?: (pageId: string) => void;
  onPreviewCustomPage?: (page: CustomHtmlPage) => void;
  
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
  initialTab?: string;
  onTabChange?: (tab: string) => void;
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
  categories = ['Développement', 'E-commerce', 'Design', 'Marketing', 'Montage Vidéo', 'Miniatures', 'Flyers'],
  customPages = [],
  onAddCategory,
  onDeleteCategory,
  onSaveCustomPage,
  onDeleteCustomPage,
  onPreviewCustomPage,
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
  initialTab,
  onTabChange
}: TrainerDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'courses' | 'students' | 'course-editor' | 'webhooks' | 'assistants' | 'custom-pages' | 'emails'>(
    (initialTab as any) || 'dashboard'
  );

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const changeTab = (tab: any) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  // Selection states
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [isEditingCourseSettings, setIsEditingCourseSettings] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState('');

  // Delete Confirmation Modal State
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

  // Course configuration states
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseType, setNewCourseType] = useState('Développement');
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);

  // Import course states
  const [createCourseTab, setCreateCourseTab] = useState<'manual' | 'import'>('manual');
  const [importedCourseData, setImportedCourseData] = useState<ParsedImportCourse | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

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

  // Quiz Management States
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<CourseQuiz | null>(null);
  const [quizDefaultAssoc, setQuizDefaultAssoc] = useState<'chapter' | 'module' | 'course_end'>('course_end');
  const [quizDefaultTargetId, setQuizDefaultTargetId] = useState<string>('');
  const [isQuizStatsOpen, setIsQuizStatsOpen] = useState(false);
  const [selectedQuizForStats, setSelectedQuizForStats] = useState<CourseQuiz | null>(null);

  // Realtime subscription to quizzes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'quizzes'), (snap) => {
      const list: CourseQuiz[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CourseQuiz);
      });
      setQuizzes(list);
    }, (err) => {
      console.warn("Quiz list snapshot warning:", err.message);
    });
    return () => unsub();
  }, []);

  const handleOpenQuizEditor = (quiz?: CourseQuiz | null, defaultType: 'chapter' | 'module' | 'course_end' = 'course_end', defaultTarget: string = '') => {
    setEditingQuiz(quiz || null);
    setQuizDefaultAssoc(defaultType);
    setQuizDefaultTargetId(defaultTarget);
    setIsQuizEditorOpen(true);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le quiz",
      message: "Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est définitive.",
      itemName: quiz ? quiz.title : `Quiz ID: ${quizId}`,
      confirmText: "Supprimer le quiz",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'quizzes', quizId));
          showToast("Quiz supprimé avec succès !", "info");
        } catch (err: any) {
          showToast(`Erreur lors de la suppression : ${err.message}`, "error");
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

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
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'assistant') {
      const trainer = allUsers.find(u => u.email.toLowerCase() === currentUser.invitedBy?.toLowerCase());
      return trainer ? c.trainerId === trainer.id : false;
    }
    return c.trainerId === currentUser.id;
  });

  const selectedCourse = allCourses.find(c => {
    if (currentUser.role === 'admin') return c.id === selectedCourseId;
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
  
  // Extract unique student emails from enrollments & pre-registrations
  const enrolledStudentEmails = new Set<string>([
    ...activeEnrollments.map(e => e.studentEmail.trim().toLowerCase()),
    ...preRegistered.filter(p => p.courseIds?.some(cid => courseIds.includes(cid))).map(p => p.email.trim().toLowerCase())
  ]);

  const trainerStudents = allUsers.filter(u => {
    if (u.role !== 'student') return false;
    if (currentUser.role === 'admin') return true;
    return enrolledStudentEmails.has(u.email.trim().toLowerCase());
  });

  const allUniqueEmails = new Set<string>([
    ...Array.from(enrolledStudentEmails),
    ...trainerStudents.map(u => u.email.trim().toLowerCase())
  ]);

  const uniqueStudentCount = currentUser.role === 'admin'
    ? Math.max(allUsers.filter(u => u.role === 'student').length, allUniqueEmails.size)
    : (allUniqueEmails.size > 0 ? allUniqueEmails.size : trainerStudents.length);

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

  // Parsed course structure state
  interface ParsedImportCourse {
    title: string;
    type: string;
    description?: string;
    price?: number;
    level?: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';
    duration?: string;
    paymentInstructions?: string;
    whatsappNumber?: string;
    modules: {
      title: string;
      chapters: {
        title: string;
        videoSource?: 'youtube' | 'vimeo' | 'direct' | 'iframe';
        videoUrl?: string;
        richText?: string;
        duration?: string;
        freePreview?: boolean;
      }[];
    }[];
  }

  // Sample File Downloads
  const handleDownloadJsonSample = () => {
    const sampleData = {
      title: "Formation Exemple : Mastery Web Design & Vidéos Multi-Sources",
      type: categories[0] || "Design",
      description: "Une formation complète pour maîtriser le Web Design, Figma, la théorie des couleurs et le prototypage UI/UX avec tous les types de vidéos pris en charge (YouTube, Vimeo, MP4 direct, iFrame).",
      price: 125000,
      level: "Tous niveaux",
      duration: "10 heures",
      paymentInstructions: "Paiement par Mobile Money (Orange Money, Wave ou MTN) puis envoyez le justificatif sur WhatsApp.",
      whatsappNumber: "+221771234567",
      modules: [
        {
          title: "Module 1 : Les Fondamentaux du Web Design",
          chapters: [
            {
              title: "Chapitre 1 : Théorie des couleurs (Vidéo YouTube)",
              videoSource: "youtube",
              videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              richText: "Dans ce chapitre, apprenez la théorie des couleurs, la hiérarchie visuelle et l'association des polices de caractères via une vidéo YouTube.",
              duration: "15 min",
              freePreview: true
            },
            {
              title: "Chapitre 2 : Grilles de mise en page & Design System (Vidéo Vimeo)",
              videoSource: "vimeo",
              videoUrl: "https://vimeo.com/76979871",
              richText: "Découvrez comment utiliser les grilles de 12 colonnes et structurer un Design System réutilisable grâce à ce tutoriel Vimeo.",
              duration: "20 min",
              freePreview: false
            }
          ]
        },
        {
          title: "Module 2 : Ergonomie, Prototypage & Formats Vidéos Avancés",
          chapters: [
            {
              title: "Chapitre 1 : Composants & Smart Animate (Fichier MP4 Direct)",
              videoSource: "direct",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              richText: "Créez des prototypes haute fidélité avec des animations fluides. Cette leçon utilise une vidéo MP4 hébergée en direct.",
              duration: "25 min",
              freePreview: false
            },
            {
              title: "Chapitre 2 : Intégration iFrame / Embed Player (Loom, Wistia ou HTML iFrame)",
              videoSource: "iframe",
              videoUrl: '<iframe src="https://www.loom.com/embed/1234567890" width="100%" height="400" frameborder="0" allowfullscreen></iframe>',
              richText: "Cette leçon montre comment intégrer n'importe quel lecteur vidéo via un code d'intégration HTML iFrame (Loom, Vdocipher, Bunny Stream...).",
              duration: "18 min",
              freePreview: false
            }
          ]
        }
      ]
    };

    const jsonStr = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemple_structure_formation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Fichier exemple JSON avec tous les types de vidéos (YouTube, Vimeo, MP4, iFrame) téléchargé !');
  };

  const handleDownloadCsvSample = () => {
    const csvContent = 
`Titre_Formation,Categorie,Description,Prix_XAF,Niveau,Duree,Titre_Module,Titre_Chapitre,Type_Video,URL_Video,Contenu_Texte,Gratuit
"Formation Exemple : Mastery Web Design","Design","Apprenez le Web Design, la typographie et le prototypage UX avec tous types de vidéos.",125000,"Tous niveaux","10 heures","Module 1 : Les Fondamentaux","Chapitre 1 : Théorie des couleurs (YouTube)","youtube","https://www.youtube.com/watch?v=dQw4w9WgXcQ","Présentation des règles de couleur et typographie.","oui"
"Formation Exemple : Mastery Web Design","Design","Apprenez le Web Design, la typographie et le prototypage UX avec tous types de vidéos.",125000,"Tous niveaux","10 heures","Module 1 : Les Fondamentaux","Chapitre 2 : Design System (Vimeo)","vimeo","https://vimeo.com/76979871","Comment utiliser les grilles responsive et le Design System.","non"
"Formation Exemple : Mastery Web Design","Design","Apprenez le Web Design, la typographie et le prototypage UX avec tous types de vidéos.",125000,"Tous niveaux","10 heures","Module 2 : Prototypage","Chapitre 1 : Composants (Vidéo MP4 Direct)","direct","https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4","Animations fluides et réactives sur Figma via fichier vidéo MP4 direct.","non"
"Formation Exemple : Mastery Web Design","Design","Apprenez le Web Design, la typographie et le prototypage UX avec tous types de vidéos.",125000,"Tous niveaux","10 heures","Module 2 : Prototypage","Chapitre 2 : Intégration iFrame Embed","iframe","<iframe src=""https://www.loom.com/embed/1234567890"" width=""100%"" height=""400"" frameborder=""0"" allowfullscreen></iframe>","Intégration d'un lecteur iFrame personnalisé (Loom, Wistia, Vdocipher).","non"`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemple_structure_formation.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Fichier exemple CSV avec tous les types de vidéos (YouTube, Vimeo, MP4, iFrame) téléchargé !');
  };

  // Export Course Students to CSV
  const handleExportCourseStudentsCSV = (targetCourse?: Course) => {
    const courseToExport = targetCourse || selectedCourse;
    if (!courseToExport) {
      triggerToast('Veuillez sélectionner une formation à exporter.', 'warning');
      return;
    }

    const courseEnrollments = allEnrollments.filter(e => e.courseId === courseToExport.id);
    if (courseEnrollments.length === 0) {
      triggerToast(`Aucun élève inscrit à la formation "${courseToExport.title}".`, 'info');
      return;
    }

    const courseChapters = allChapters.filter(ch => {
      const mod = allModules.find(m => m.id === ch.moduleId);
      return mod?.courseId === courseToExport.id;
    });
    const totalChapters = courseChapters.length;

    const headers = [
      "ID Inscription",
      "Nom Eleve",
      "Prenom Eleve",
      "Email Eleve",
      "Titre Formation",
      "Date Inscription",
      "Statut Acces",
      "Chapitres Completes",
      "Total Chapitres",
      "Pourcentage Progression",
      "Formation Terminee"
    ];

    const rows = courseEnrollments.map(en => {
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === en.studentEmail.toLowerCase());
      const progress = allProgress.find(p => p.studentEmail === en.studentEmail && p.courseId === courseToExport.id);
      const completedCount = totalChapters > 0 
        ? courseChapters.filter(ch => progress?.completedChapterIds.includes(ch.id)).length
        : 0;
      const pct = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
      const isFinished = totalChapters > 0 && completedCount >= totalChapters ? "Oui" : "Non";

      return [
        `"${en.id}"`,
        `"${(matchedUser?.name || en.studentEmail.split('@')[0]).replace(/"/g, '""')}"`,
        `"${(matchedUser?.firstName || '').replace(/"/g, '""')}"`,
        `"${en.studentEmail}"`,
        `"${courseToExport.title.replace(/"/g, '""')}"`,
        `"${new Date(en.enrolledAt).toLocaleDateString('fr-FR')}"`,
        `"${en.status === 'active' ? 'Actif' : 'Suspendu'}"`,
        completedCount,
        totalChapters,
        `"${pct}%"`,
        `"${isFinished}"`
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = courseToExport.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    a.download = `eleves_inscrits_${safeTitle}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerToast(`Export CSV réussi pour "${courseToExport.title}" (${courseEnrollments.length} élèves) !`, 'success');
  };

  const handleExportFilteredStudentsCSV = (filterCourseId: string) => {
    if (filterCourseId && filterCourseId !== 'all') {
      const c = trainerCourses.find(course => course.id === filterCourseId);
      if (c) {
        handleExportCourseStudentsCSV(c);
        return;
      }
    }

    let enrollsToExport = activeEnrollments;
    if (filterCourseId && filterCourseId !== 'all') {
      enrollsToExport = activeEnrollments.filter(e => e.courseId === filterCourseId);
    }

    if (enrollsToExport.length === 0) {
      triggerToast('Aucun élève inscrit à exporter.', 'info');
      return;
    }

    const headers = [
      "ID Inscription",
      "Nom Eleve",
      "Prenom Eleve",
      "Email Eleve",
      "ID Formation",
      "Titre Formation",
      "Date Inscription",
      "Statut Acces",
      "Chapitres Completes",
      "Total Chapitres",
      "Pourcentage Progression",
      "Formation Terminee"
    ];

    const rows = enrollsToExport.map(en => {
      const c = allCourses.find(crs => crs.id === en.courseId);
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === en.studentEmail.toLowerCase());
      
      const courseChapters = allChapters.filter(ch => {
        const mod = allModules.find(m => m.id === ch.moduleId);
        return mod?.courseId === en.courseId;
      });
      const totalChapters = courseChapters.length;

      const progress = allProgress.find(p => p.studentEmail === en.studentEmail && p.courseId === en.courseId);
      const completedCount = totalChapters > 0 
        ? courseChapters.filter(ch => progress?.completedChapterIds.includes(ch.id)).length
        : 0;
      const pct = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
      const isFinished = totalChapters > 0 && completedCount >= totalChapters ? "Oui" : "Non";

      return [
        `"${en.id}"`,
        `"${(matchedUser?.name || en.studentEmail.split('@')[0]).replace(/"/g, '""')}"`,
        `"${(matchedUser?.firstName || '').replace(/"/g, '""')}"`,
        `"${en.studentEmail}"`,
        `"${en.courseId}"`,
        `"${(c?.title || 'Cours inconnu').replace(/"/g, '""')}"`,
        `"${new Date(en.enrolledAt).toLocaleDateString('fr-FR')}"`,
        `"${en.status === 'active' ? 'Actif' : 'Suspendu'}"`,
        completedCount,
        totalChapters,
        `"${pct}%"`,
        `"${isFinished}"`
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liste_etudiants_inscrits.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerToast(`Export CSV réussi pour ${enrollsToExport.length} élève(s) !`, 'success');
  };

  // Import File Parsers
  const parseJsonCourse = (text: string): ParsedImportCourse | null => {
    try {
      const data = JSON.parse(text);
      const item = Array.isArray(data) ? data[0] : data;
      if (!item || typeof item !== 'object') return null;

      return {
        title: item.title || item.titre || 'Formation importée',
        type: item.type || item.categorie || item.category || categories[0] || 'Développement',
        description: item.description || 'Description de la formation importée.',
        price: typeof item.price === 'number' ? item.price : (typeof item.prix === 'number' ? item.prix : 125000),
        level: item.level || item.niveau || 'Tous niveaux',
        duration: item.duration || item.duree || '10 heures',
        paymentInstructions: item.paymentInstructions || item.consignesPaiement,
        whatsappNumber: item.whatsappNumber || item.numeroWhatsapp,
        modules: Array.isArray(item.modules) ? item.modules.map((m: any, mIdx: number) => ({
          title: m.title || m.titre || `Module ${mIdx + 1}`,
          chapters: Array.isArray(m.chapters || m.chapitres) ? (m.chapters || m.chapitres).map((ch: any, cIdx: number) => ({
            title: ch.title || ch.titre || `Chapitre ${cIdx + 1}`,
            videoSource: ['youtube', 'vimeo', 'direct', 'iframe'].includes(ch.videoSource || ch.typeVideo) ? (ch.videoSource || ch.typeVideo) : 'youtube',
            videoUrl: ch.videoUrl || ch.urlVideo || '',
            richText: ch.richText || ch.content || ch.contenu || '',
            duration: ch.duration || ch.duree || '15 min',
            freePreview: Boolean(ch.freePreview || ch.gratuit)
          })) : []
        })) : []
      };
    } catch (e) {
      return null;
    }
  };

  const parseCsvCourse = (text: string): ParsedImportCourse | null => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return null;

    const delimiter = lines[0].includes(';') ? ';' : ',';

    const parseRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const rows = lines.slice(1).map(parseRow);
    if (rows.length === 0) return null;

    const firstRow = rows[0];
    const courseTitle = firstRow[0] || 'Formation importée CSV';
    const courseType = firstRow[1] || categories[0] || 'Développement';
    const courseDesc = firstRow[2] || 'Description de la formation importée';
    const coursePrice = parseFloat(firstRow[3]) || 125000;
    const courseLevel = (firstRow[4] as any) || 'Tous niveaux';
    const courseDuration = firstRow[5] || '10 heures';

    const modulesMap = new Map<string, any[]>();

    for (const row of rows) {
      if (!row[6] && !row[7]) continue;
      const modTitle = row[6] || 'Module 1';
      const chapTitle = row[7] || 'Chapitre';
      const chapVideoType = (row[8] as any) || 'youtube';
      const chapVideoUrl = row[9] || '';
      const chapContent = row[10] || '';
      const chapFree = (row[11] || '').toLowerCase() === 'oui' || (row[11] || '').toLowerCase() === 'true' || row[11] === '1';

      if (!modulesMap.has(modTitle)) {
        modulesMap.set(modTitle, []);
      }
      modulesMap.get(modTitle)!.push({
        title: chapTitle,
        videoSource: ['youtube', 'vimeo', 'direct', 'iframe'].includes(chapVideoType) ? chapVideoType : 'youtube',
        videoUrl: chapVideoUrl,
        richText: chapContent,
        duration: '15 min',
        freePreview: chapFree
      });
    }

    const modules = Array.from(modulesMap.entries()).map(([mTitle, chapters]) => ({
      title: mTitle,
      chapters
    }));

    return {
      title: courseTitle,
      type: courseType,
      description: courseDesc,
      price: coursePrice,
      level: courseLevel,
      duration: courseDuration,
      modules
    };
  };

  const handleFileUpload = (file: File) => {
    setImportFileError(null);
    setIsParsingFile(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setIsParsingFile(false);
      const content = e.target?.result as string;
      if (!content) {
        setImportFileError("Le fichier est vide.");
        setImportedCourseData(null);
        return;
      }

      let parsed: ParsedImportCourse | null = null;
      if (file.name.toLowerCase().endsWith('.json')) {
        parsed = parseJsonCourse(content);
      } else if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
        parsed = parseCsvCourse(content);
      } else {
        parsed = parseJsonCourse(content) || parseCsvCourse(content);
      }

      if (!parsed || !parsed.title) {
        setImportFileError("Impossible d'analyser la structure du fichier. Assurez-vous d'utiliser le format JSON ou CSV recommandé (téléchargez un fichier exemple ci-dessus).");
        setImportedCourseData(null);
      } else {
        setImportedCourseData(parsed);
        setImportFileError(null);
        triggerToast(`Fichier "${file.name}" analysé avec succès !`);
      }
    };

    reader.onerror = () => {
      setIsParsingFile(false);
      setImportFileError("Erreur lors de la lecture du fichier.");
      setImportedCourseData(null);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImportCourse = () => {
    if (!importedCourseData) return;

    handleAsyncAction('createCourse', async () => {
      const newCourseId = `c-${Date.now()}`;
      const newCourse: Course = {
        id: newCourseId,
        title: importedCourseData.title,
        trainerId: currentUser.id,
        trainerName: currentUser.name,
        language: 'Français',
        description: importedCourseData.description || 'Formation créée par importation de fichier.',
        themeColor: 'indigo',
        trainerPhoto: currentUser.avatarUrl,
        logoUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=100',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        status: 'draft',
        createdAt: new Date().toISOString(),
        type: importedCourseData.type || categories[0] || 'Développement',
        price: importedCourseData.price || 125000,
        level: importedCourseData.level || 'Tous niveaux',
        duration: importedCourseData.duration || '10 heures',
        paymentInstructions: importedCourseData.paymentInstructions,
        whatsappNumber: importedCourseData.whatsappNumber
      };

      await onAddCourse(newCourse);

      let totalChaptersCount = 0;
      if (importedCourseData.modules && importedCourseData.modules.length > 0) {
        for (let mIdx = 0; mIdx < importedCourseData.modules.length; mIdx++) {
          const modData = importedCourseData.modules[mIdx];
          const newModId = `m-${Date.now()}-${mIdx}-${Math.random().toString(36).substr(2, 4)}`;
          const newMod: Module = {
            id: newModId,
            courseId: newCourseId,
            title: modData.title || `Module ${mIdx + 1}`,
            order: mIdx + 1
          };
          await onAddModule(newMod);

          if (modData.chapters && modData.chapters.length > 0) {
            for (let cIdx = 0; cIdx < modData.chapters.length; cIdx++) {
              const chData = modData.chapters[cIdx];
              const newCh: Chapter = {
                id: `ch-${Date.now()}-${mIdx}-${cIdx}-${Math.random().toString(36).substr(2, 4)}`,
                moduleId: newModId,
                courseId: newCourseId,
                title: chData.title || `Chapitre ${cIdx + 1}`,
                order: cIdx + 1,
                videoSource: chData.videoSource || 'youtube',
                videoUrl: chData.videoUrl || '',
                richText: chData.richText || '',
                duration: chData.duration || '15 min',
                isFree: Boolean(chData.freePreview)
              };
              await onAddChapter(newCh);
              totalChaptersCount++;
            }
          }
        }
      }

      setImportedCourseData(null);
      setImportFileError(null);
      setShowAddCourseForm(false);
      triggerToast(`Formation "${newCourse.title}" créée avec succès (${importedCourseData.modules.length} modules, ${totalChaptersCount} chapitres) !`);

      setSelectedCourseId(newCourseId);
      setActiveTab('course-editor');
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
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editPaymentButtons, setEditPaymentButtons] = useState<CustomPaymentButton[]>([]);
  const [editShowPaymentInstructions, setEditShowPaymentInstructions] = useState(true);
  const [editPromoPrice, setEditPromoPrice] = useState<number | ''>('');

  // Registered Database Webhooks & Modal states
  const [registeredWebhooks, setRegisteredWebhooks] = useState<any[]>([]);
  const [isCreatingWebhookModal, setIsCreatingWebhookModal] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhCourseId, setNewWhCourseId] = useState('all');
  const [newWhUrl, setNewWhUrl] = useState('');
  const [newWhEventType, setNewWhEventType] = useState('payment_success');
  const [newWhSecretKey, setNewWhSecretKey] = useState('');

  // Listen to custom webhooks in Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'webhooks'), (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRegisteredWebhooks(list);
    }, (err) => {
      console.warn("Snapshot listener for webhooks warning:", err.message);
    });
    return () => unsub();
  }, []);

  const handleCreateCustomWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName.trim() || !newWhUrl.trim()) {
      triggerToast('Veuillez saisir un nom et une URL valide pour le webhook.', 'warning');
      return;
    }
    try {
      const id = `wh-${Date.now()}`;
      const whObj = {
        id,
        name: newWhName.trim(),
        courseId: newWhCourseId,
        url: newWhUrl.trim(),
        eventType: newWhEventType,
        secretKey: newWhSecretKey.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email
      };
      await setDoc(doc(db, 'webhooks', id), cleanUndefined(whObj));
      triggerToast('Webhook enregistré en base de données avec succès !', 'success');
      setIsCreatingWebhookModal(false);
      setNewWhName('');
      setNewWhUrl('');
      setNewWhSecretKey('');
    } catch (err: any) {
      triggerToast('Erreur lors de l\'enregistrement du webhook : ' + err.message, 'error');
    }
  };

  const handleDeleteWebhookFromDb = async (whId: string, whName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le webhook",
      message: `Voulez-vous vraiment supprimer le webhook de la base de données ?`,
      itemName: whName,
      confirmText: "Supprimer le webhook",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'webhooks', whId));
          setRegisteredWebhooks(prev => prev.filter(w => w.id !== whId));
          triggerToast(`Le webhook "${whName}" a été supprimé de la plateforme et de la base de données.`, 'success');
        } catch (err: any) {
          triggerToast('Erreur lors de la suppression : ' + err.message, 'error');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleDeleteCourseWebhook = async (courseToClean: Course) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le webhook de la formation",
      message: `Voulez-vous vraiment supprimer le webhook pour cette formation ?`,
      itemName: courseToClean.title,
      confirmText: "Supprimer le webhook",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'webhooks', `wh-${courseToClean.id}`)).catch(() => {});
          await deleteDoc(doc(db, 'webhooks', courseToClean.id)).catch(() => {});
          
          const updatedCourse: Course = {
            ...courseToClean,
            webhookEmailKey: 'email',
            webhookNameKey: 'name',
            webhookUrl: 'disabled',
            webhookDisabled: true
          };
          await onUpdateCourse(updatedCourse);
          setRegisteredWebhooks(prev => prev.filter(w => w.id !== courseToClean.id && w.id !== `wh-${courseToClean.id}` && w.courseId !== courseToClean.id));
          triggerToast(`Le webhook pour "${courseToClean.title}" a été supprimé de la plateforme et de la base de données avec succès !`, 'success');
        } catch (err: any) {
          triggerToast('Erreur lors de la suppression du webhook : ' + err.message, 'error');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleReactivateCourseWebhook = async (courseToActivate: Course) => {
    try {
      const updatedCourse: Course = {
        ...courseToActivate,
        webhookDisabled: false,
        webhookUrl: `${window.location.origin}/api/webhooks/payment/${courseToActivate.id}`
      };
      await onUpdateCourse(updatedCourse);
      triggerToast(`Le webhook pour "${courseToActivate.title}" a été réactivé avec succès.`, 'success');
    } catch (err: any) {
      triggerToast('Erreur lors de la réactivation du webhook : ' + err.message, 'error');
    }
  };

  const handleDeleteSingleWebhookLog = async (logId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer l'enregistrement",
      message: "Voulez-vous vraiment supprimer cet enregistrement du journal ?",
      confirmText: "Supprimer",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/webhooks/log/${logId}`, { method: 'DELETE' });
          if (res.ok) {
            setWebhookLogs(prev => prev.filter(l => l.id !== logId));
            setGlobalWebhookLogs(prev => prev.filter(l => l.id !== logId));
            triggerToast('Log de webhook supprimé avec succès.', 'success');
          } else {
            triggerToast('Erreur lors de la suppression du log.', 'error');
          }
        } catch (err) {
          triggerToast('Erreur de connexion lors de la suppression.', 'error');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleResetCourseWebhookConfig = async () => {
    if (!selectedCourse) return;
    setConfirmModal({
      isOpen: true,
      title: "Réinitialiser la configuration Webhook",
      message: "Voulez-vous vraiment réinitialiser et désactiver la configuration du webhook pour cette formation ?",
      itemName: selectedCourse.title,
      confirmText: "Réinitialiser",
      onConfirm: async () => {
        setEditWebhookEmailKey('email');
        setEditWebhookNameKey('name');

        const updatedCourse: Course = {
          ...selectedCourse,
          webhookEmailKey: 'email',
          webhookNameKey: 'name',
          webhookUrl: 'disabled',
          webhookDisabled: true
        };
        await onUpdateCourse(updatedCourse);
        await deleteDoc(doc(db, 'webhooks', `wh-${selectedCourse.id}`)).catch(() => {});
        await deleteDoc(doc(db, 'webhooks', selectedCourse.id)).catch(() => {});
        setRegisteredWebhooks(prev => prev.filter(w => w.id !== selectedCourse.id && w.id !== `wh-${selectedCourse.id}` && w.courseId !== selectedCourse.id));
        triggerToast("Configuration du webhook réinitialisée et supprimée pour cette formation.", "info");
        closeConfirmModal();
      }
    });
  };

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
    setConfirmModal({
      isOpen: true,
      title: "Vider tous les journaux Webhooks",
      message: "Voulez-vous vraiment effacer TOUS les journaux de Webhooks de l'application ? Cette action est irréversible.",
      confirmText: "Effacer les journaux",
      onConfirm: async () => {
        try {
          const res = await fetch('/api/webhooks/logs', { method: 'DELETE' });
          if (res.ok) {
            setGlobalWebhookLogs([]);
            triggerToast("Tous les journaux ont été effacés.");
          }
        } catch (err) {
        } finally {
          closeConfirmModal();
        }
      }
    });
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
    setEditWhatsappNumber(c.whatsappNumber || '+221771234567');
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
        whatsappNumber: editWhatsappNumber,
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
    setConfirmModal({
      isOpen: true,
      title: "Effacer l'historique des webhooks",
      message: "Voulez-vous vraiment effacer l'historique des webhooks pour cette formation ?",
      itemName: selectedCourse.title,
      confirmText: "Effacer l'historique",
      onConfirm: async () => {
        try {
          await fetch(`/api/webhooks/logs/${selectedCourse.id}`, { method: 'DELETE' });
          setWebhookLogs([]);
          triggerToast("Historique des webhooks vidé.");
        } catch (err) {
        } finally {
          closeConfirmModal();
        }
      }
    });
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
    const mod = allModules.find(m => m.id === moduleId);
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le module",
      message: "Êtes-vous sûr de vouloir supprimer ce module et tous les chapitres qu'il contient ? Cette action est définitive.",
      itemName: mod ? mod.title : `Module ID: ${moduleId}`,
      confirmText: "Supprimer le module",
      onConfirm: () => {
        onDeleteModule(moduleId);
        triggerToast("Module supprimé !");
        closeConfirmModal();
      }
    });
  };

  const handleDeleteChapterClick = (chapterId: string) => {
    if (!hasPermission('edit_chapters')) {
      triggerToast('Permission refusée : Vous n\'avez pas le droit de modifier les chapitres.');
      return;
    }
    const ch = allChapters.find(c => c.id === chapterId);
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le chapitre",
      message: "Êtes-vous sûr de vouloir supprimer définitivement ce chapitre ?",
      itemName: ch ? ch.title : `Chapitre ID: ${chapterId}`,
      confirmText: "Supprimer le chapitre",
      onConfirm: () => {
        onDeleteChapter(chapterId);
        triggerToast("Chapitre supprimé !");
        closeConfirmModal();
      }
    });
  };

  // Chapter editing form states
  const [chTitle, setChTitle] = useState('');
  const [chVideoSrc, setChVideoSrc] = useState<'youtube' | 'vimeo' | 'direct' | 'iframe'>('youtube');
  const [chVideoUrl, setChVideoUrl] = useState('');
  const [chVideoOrientation, setChVideoOrientation] = useState<'16/9' | '9/16'>('16/9');
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
    setChVideoOrientation('16/9');
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
    setChVideoOrientation(chapter.videoOrientation || '16/9');
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
            videoOrientation: chVideoOrientation,
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
          videoOrientation: chVideoOrientation,
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
      triggerToast("L'étudiant a déjà la formation !", "error");
      alert("L'étudiant a déjà la formation !");
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

        // Send Instant Notification Email via transactional email engine & simulated log
        emailTriggers.courseManualAdd(
          emailTrimmed,
          studentUser.name || emailTrimmed,
          courseSelected.title,
          currentUser.name || 'Votre Formateur'
        );

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

        // Send Instant Notification Email via transactional email engine & simulated log
        emailTriggers.courseManualAdd(
          emailTrimmed,
          enrollName.trim() || emailTrimmed,
          courseSelected.title,
          currentUser.name || 'Votre Formateur'
        );
        emailTriggers.welcome(
          emailTrimmed,
          enrollName.trim() || emailTrimmed
        );

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
                  <span>Mes élèves ({uniqueStudentCount})</span>
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

                <button
                  onClick={() => { setActiveTab('custom-pages'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'custom-pages' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-amber-500" />
                  <span>Pages HTML ({customPages.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('emails'); setSelectedCourseId(null); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === 'emails' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-4 h-4 text-purple-500" />
                  <span>E-mails &amp; Diffusion</span>
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setActiveTab('courses'); setCreateCourseTab('manual'); setShowAddCourseForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle formation</span>
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setCreateCourseTab('import'); setShowAddCourseForm(true); }}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Importer un fichier</span>
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
          <span>Mes élèves ({uniqueStudentCount})</span>
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
        <button
          onClick={() => { setActiveTab('custom-pages'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'custom-pages' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-500" />
          <span>Pages HTML ({customPages.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('emails'); setSelectedCourseId(null); }}
          className={`pb-3 px-1 border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'emails' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-purple-500" />
          <span>E-mails &amp; Diffusion</span>
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
            <div className="bg-[#1a1e24] border border-white/10 p-3.5 sm:p-5 rounded-2xl text-center shadow-sm hover:scale-[1.015] hover:border-indigo-500/30 transition-all duration-200 overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Total Étudiants inscrits</p>
              <p className="text-3xl font-black text-slate-100 mt-1 truncate">{uniqueStudentCount}</p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">Élèves uniques inscrits à vos cours</p>
            </div>
            <div className="bg-[#1a1e24] border border-white/10 p-3.5 sm:p-5 rounded-2xl text-center shadow-sm hover:scale-[1.015] hover:border-indigo-500/30 transition-all duration-200 overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Formations Publiées</p>
              <p className="text-3xl font-black text-indigo-400 mt-1 truncate">
                {trainerCourses.filter(c => c.status === 'published').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">Sur {trainerCourses.length} cours créés au total</p>
            </div>
            <div className="bg-[#1a1e24] border border-white/10 p-3.5 sm:p-5 rounded-2xl text-center shadow-sm hover:scale-[1.015] hover:border-emerald-500/30 transition-all duration-200 overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Inscriptions globales actives</p>
              <p className="text-3xl font-black text-emerald-400 mt-1 truncate">{activeEnrollments.length}</p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">Vérifications de paiement validées</p>
            </div>
          </div>

          {/* Module Progress Recharts Data Visualization Component */}
          <ModuleProgressChart
            courses={trainerCourses}
            modules={allModules}
            chapters={allChapters}
            enrollments={allEnrollments}
            progress={allProgress}
          />

          {/* Quick list of courses progress stats */}
          <div className="bg-[#1a1e24] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:scale-[1.005] transition-all duration-200 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Statistiques & Complétion par formation</h3>
                <p className="text-[11px] text-slate-400">Pourcentage d'élèves ayant complété 100% des chapitres de chaque cours.</p>
              </div>
            </div>

            <div className="space-y-4">
              {trainerCourses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Créez votre première formation pour commencer à suivre son évolution.</p>
              ) : (
                trainerCourses.map(course => {
                  const courseEnrollments = allEnrollments.filter(e => e.courseId === course.id && e.status === 'active');
                  const enrolledCount = courseEnrollments.length;

                  const courseChapters = allChapters.filter(ch => {
                    const mod = allModules.find(m => m.id === ch.moduleId);
                    return mod?.courseId === course.id;
                  });
                  const totalChapters = courseChapters.length;

                  let completedStudentsCount = 0;
                  if (totalChapters > 0 && enrolledCount > 0) {
                    courseEnrollments.forEach(en => {
                      const p = allProgress.find(pr => pr.studentEmail === en.studentEmail && pr.courseId === course.id);
                      const doneCount = courseChapters.filter(ch => p?.completedChapterIds.includes(ch.id)).length;
                      if (doneCount >= totalChapters) {
                        completedStudentsCount++;
                      }
                    });
                  }

                  const completionPercentage = enrolledCount > 0 ? Math.round((completedStudentsCount / enrolledCount) * 100) : 0;

                  return (
                    <div key={course.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3.5 last:border-0 last:pb-0 gap-3">
                      <div 
                        onClick={() => { setSelectedCourseId(course.id); setActiveTab('course-editor'); }}
                        className="flex items-center gap-3 cursor-pointer group"
                        title="Ouvrir l'éditeur de cette formation"
                      >
                        <img src={course.coverImage} className="w-12 h-8 rounded-lg object-cover border border-slate-200 group-hover:opacity-85 transition-opacity" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                          <p className="text-[10px] text-slate-400">{course.status === 'published' ? 'Publiée' : 'Brouillon'} • {totalChapters} chapitre(s) • {enrolledCount} élève(s)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Completion progress bar */}
                        <div className="w-44 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-600">Complétion (100%)</span>
                            <span className="font-extrabold text-emerald-700">{completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 text-right">{completedStudentsCount} sur {enrolledCount} ont tout terminé</p>
                        </div>

                        <button
                          onClick={() => handleExportCourseStudentsCSV(course)}
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-2.5 py-1.5 rounded-xl text-[10px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
                          title="Télécharger la liste des étudiants en CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Export CSV</span>
                        </button>
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
          {/* Add / Import Course Form */}
          {showAddCourseForm && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5 max-w-2xl shadow-sm animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Créer ou importer une formation</h3>
                  <p className="text-xs text-slate-500">Choisissez le mode de création de votre nouvelle formation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCourseForm(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setCreateCourseTab('manual')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    createCourseTab === 'manual'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Création manuelle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateCourseTab('import')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    createCourseTab === 'import'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer un fichier (.json / .csv)</span>
                </button>
              </div>

              {/* TAB 1: MANUAL CREATION */}
              {createCourseTab === 'manual' && (
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Titre de la formation</label>
                    <input
                      type="text"
                      required
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      placeholder="Ex: Devenir Web Designer Pro"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie</label>
                    <select
                      value={newCourseType}
                      onChange={(e) => setNewCourseType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCourseForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loadingActions['createCourse']}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all cursor-pointer shadow-indigo-100"
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

              {/* TAB 2: FILE IMPORT */}
              {createCourseTab === 'import' && (
                <div className="space-y-4">
                  {/* Download Template Banner */}
                  <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Download className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-indigo-900">Modèles de fichier téléchargeables</h4>
                        <p className="text-[11px] text-indigo-700 leading-relaxed mt-0.5">
                          Téléchargez un fichier exemple prêt à l'emploi pour savoir comment structurer le titre, la catégorie, les modules et les leçons de votre formation :
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadJsonSample}
                        className="bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 hover:text-indigo-900 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Télécharger exemple JSON (.json)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadCsvSample}
                        className="bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 hover:text-indigo-900 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Télécharger exemple CSV (.csv)</span>
                      </button>
                    </div>
                  </div>

                  {/* Upload Box */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-2xl p-6 text-center transition-all">
                    <input
                      type="file"
                      id="course-file-import"
                      accept=".json,.csv,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="course-file-import"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-indigo-600 hover:underline">
                          Cliquez pour sélectionner un fichier
                        </span>
                        <span className="text-xs text-slate-500"> ou glissez-déposez le fichier ici</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Formats pris en charge : JSON (.json) et CSV (.csv)</p>
                    </label>
                  </div>

                  {/* Loading parsing state */}
                  {isParsingFile && (
                    <div className="p-4 bg-slate-100 rounded-2xl flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyse du fichier en cours...</span>
                    </div>
                  )}

                  {/* Parsing Error */}
                  {importFileError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{importFileError}</span>
                    </div>
                  )}

                  {/* Parsed Preview Card */}
                  {importedCourseData && (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Formation détectée</h4>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Prêt à importer</span>
                      </div>

                      <div className="bg-white border border-emerald-150 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">{importedCourseData.title}</p>
                            <p className="text-[11px] text-slate-500">{importedCourseData.description}</p>
                          </div>
                          <span className="font-extrabold text-indigo-600 whitespace-nowrap bg-indigo-50 px-2 py-1 rounded-lg">
                            {(importedCourseData.price || 125000).toLocaleString('fr-FR')} XAF
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">Catégorie: <strong>{importedCourseData.type}</strong></span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">Niveau: <strong>{importedCourseData.level}</strong></span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">Modules: <strong>{importedCourseData.modules?.length || 0}</strong></span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">Chapitres: <strong>{importedCourseData.modules?.reduce((acc, m) => acc + (m.chapters?.length || 0), 0) || 0}</strong></span>
                        </div>

                        {/* Modules Accordion/List preview */}
                        {importedCourseData.modules && importedCourseData.modules.length > 0 && (
                          <div className="pt-2 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Aperçu du contenu :</p>
                            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                              {importedCourseData.modules.map((m, idx) => (
                                <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                                  <p className="font-bold text-slate-800">{m.title}</p>
                                  {m.chapters && m.chapters.length > 0 && (
                                    <ul className="list-disc list-inside text-slate-500 pl-1 mt-0.5 space-y-0.5 text-[10px]">
                                      {m.chapters.map((ch, cIdx) => (
                                        <li key={cIdx}>{ch.title} {ch.freePreview ? '(Gratuit)' : ''}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setImportedCourseData(null);
                            setImportFileError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Réinitialiser
                        </button>
                        <button
                          type="button"
                          disabled={loadingActions['createCourse']}
                          onClick={handleConfirmImportCourse}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all cursor-pointer shadow-emerald-100"
                        >
                          {loadingActions['createCourse'] ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Importation...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Valider et créer la formation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCourseForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Courses Table (Section 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                    <th className="px-4 py-3">Image / Nom</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Inscrits</th>
                    <th className="px-4 py-3">Complétion (100%)</th>
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
                    const courseEnrollments = allEnrollments.filter(e => e.courseId === course.id && e.status === 'active');
                    const studentsCount = courseEnrollments.length;

                    const courseChapters = allChapters.filter(ch => {
                      const mod = allModules.find(m => m.id === ch.moduleId);
                      return mod?.courseId === course.id;
                    });
                    const totalChapters = courseChapters.length;

                    let completedStudentsCount = 0;
                    if (totalChapters > 0 && studentsCount > 0) {
                      courseEnrollments.forEach(en => {
                        const p = allProgress.find(pr => pr.studentEmail === en.studentEmail && pr.courseId === course.id);
                        const doneCount = courseChapters.filter(ch => p?.completedChapterIds.includes(ch.id)).length;
                        if (doneCount >= totalChapters) {
                          completedStudentsCount++;
                        }
                      });
                    }

                    const completionPercentage = studentsCount > 0 ? Math.round((completedStudentsCount / studentsCount) * 100) : 0;
                    
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5">
                          <div 
                            onClick={() => { setSelectedCourseId(course.id); setActiveTab('course-editor'); }}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Ouvrir l'éditeur de cette formation"
                          >
                            <img src={course.coverImage} className="w-12 h-8 rounded object-cover border border-slate-200 group-hover:opacity-85 transition-opacity shrink-0" />
                            <div>
                              <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{course.title}</p>
                              <p className="text-[10px] text-slate-400">{course.price.toLocaleString('fr-FR')} XAF • Créé le {new Date(course.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">
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
                        <td className="px-4 py-3.5 font-bold text-slate-700">
                          {studentsCount} élèves
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="w-32 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-700">{completionPercentage}%</span>
                              <span className="text-[10px] text-slate-400">({completedStudentsCount}/{studentsCount})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleExportCourseStudentsCSV(course)}
                            title="Exporter la liste des élèves au format CSV"
                            className="text-[10px] font-semibold px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                            <span>Export CSV</span>
                          </button>
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
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: "Supprimer la formation",
                                  message: "Êtes-vous sûr de vouloir supprimer définitivement cette formation et tout son contenu (modules, chapitres, ressources) ?",
                                  itemName: course.title,
                                  confirmText: "Supprimer la formation",
                                  onConfirm: () => {
                                    onDeleteCourse(course.id);
                                    triggerToast("Formation supprimée avec succès !");
                                    closeConfirmModal();
                                  }
                                });
                              }}
                              title="Supprimer la formation"
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 inline-flex align-middle cursor-pointer"
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
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
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
                          <span
                            style={{ backgroundColor: '#0c0d0f' }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${editSeoTitle.length > 60 ? 'text-amber-400' : 'text-slate-200'}`}
                          >
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
                          <span
                            style={{ backgroundColor: '#000000' }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${editSeoDescription.length > 160 ? 'text-amber-400' : 'text-slate-200'}`}
                          >
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

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Numéro WhatsApp de réception des preuves de paiement</span>
                      </label>
                      <input
                        type="text"
                        value={editWhatsappNumber}
                        onChange={(e) => setEditWhatsappNumber(e.target.value)}
                        placeholder="Ex: +221 77 123 45 67 ou 221771234567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all font-mono"
                      />
                      <p className="text-[10px] text-slate-400">
                        Ce numéro sera directement utilisé lorsqu'un étudiant clique sur "Envoyer la preuve par WhatsApp" sur la page de paiement.
                      </p>
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
                        <button
                          type="button"
                          onClick={handleResetCourseWebhookConfig}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1"
                          title="Réinitialiser la configuration webhook de cette formation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Réinitialiser</span>
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
                                <th className="px-3 py-2 text-right">Action</th>
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
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleWebhookLog(log.id)}
                                      className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                      title="Supprimer ce log"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Liste de vos élèves inscrits</h3>
                <p className="text-[10px] text-slate-400">Filtrer par cours ou rechercher un élève, puis exporter au format CSV.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter by course */}
                <select
                  value={studentCourseFilter}
                  onChange={(e) => setStudentCourseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium"
                >
                  <option value="all">Toutes les formations ({activeEnrollments.length} inscrits)</option>
                  {trainerCourses.map(c => {
                    const count = activeEnrollments.filter(e => e.courseId === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>{c.title} ({count} élèves)</option>
                    );
                  })}
                </select>

                {/* Search input */}
                <div className="relative w-48 sm:w-56">
                  <input
                    type="text"
                    placeholder="Rechercher e-mail / nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={() => handleExportFilteredStudentsCSV(studentCourseFilter)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shadow-emerald-100 shrink-0"
                  title="Exporter au format CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter CSV</span>
                </button>
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
                      .filter(en => {
                        const matchesCourse = studentCourseFilter === 'all' || en.courseId === studentCourseFilter;
                        const matchedUser = allUsers.find(u => u.email.toLowerCase() === en.studentEmail.toLowerCase());
                        const query = searchQuery.toLowerCase();
                        const matchesSearch = !searchQuery || 
                          en.studentEmail.toLowerCase().includes(query) ||
                          (matchedUser?.name || '').toLowerCase().includes(query) ||
                          (matchedUser?.firstName || '').toLowerCase().includes(query);
                        return matchesCourse && matchesSearch;
                      })
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
                                  src={matchedStudent?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'} 
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
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 shadow-xs">
                                  Accès actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-200 shadow-xs">
                                  Accès retiré
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => setViewingUserProfile(matchedStudent || {
                                  id: 'unknown',
                                  email: enroll.studentEmail,
                                  name: enroll.studentEmail.split('@')[0],
                                  role: 'student',
                                  createdAt: enroll.enrolledAt,
                                  status: 'active'
                                })}
                                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
                              >
                                Voir Profil
                              </button>
                              <button
                                onClick={() => {
                                  const matchedCourse = allCourses.find(c => c.id === enroll.courseId);
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Retirer l'accès de la formation",
                                    message: "Êtes-vous sûr de vouloir retirer l'accès de cet étudiant ? Il sera supprimé de cette formation.",
                                    itemName: `${enroll.studentEmail} — ${matchedCourse ? matchedCourse.title : 'Formation'}`,
                                    confirmText: "Retirer l'accès et supprimer",
                                    onConfirm: () => {
                                      onDeleteEnrollment(enroll.id);
                                      triggerToast("Accès retiré : L'étudiant a été supprimé de la formation !");
                                      closeConfirmModal();
                                    }
                                  });
                                }}
                                className="text-[11px] font-bold px-3 py-1.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer shadow-xs"
                              >
                                Retirer l'accès
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
          {/* Section: Webhooks Enregistrés dans la Base de Données */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>⚡ Webhooks Enregistrés dans la BD ({registeredWebhooks.length + trainerCourses.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Liste des points de terminaison Webhooks stockés en base de données. Vous pouvez enregistrer de nouveaux webhooks ou les supprimer à tout moment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingWebhookModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Webhook</span>
              </button>
            </div>

            {/* List of Registered Webhooks */}
            <div className="space-y-3">
              {/* Course Automatic Webhooks */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Points de terminaison automatiques des formations (Actifs)</p>
                {trainerCourses
                  .filter(c => !c.webhookDisabled && c.webhookUrl !== 'disabled')
                  .map(course => {
                  const url = `${window.location.origin}/api/webhooks/payment/${course.id}`;
                  return (
                    <div key={course.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3 gap-3">
                      <div 
                        onClick={() => { setSelectedCourseId(course.id); setActiveTab('course-editor'); }}
                        className="flex items-center gap-3 cursor-pointer group"
                        title="Ouvrir l'éditeur de cette formation"
                      >
                        <img src={course.coverImage} className="w-10 h-7 rounded object-cover border border-slate-200 shrink-0 group-hover:opacity-85 transition-opacity" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Enregistré BD</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-md">{url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(url);
                            triggerToast("URL du Webhook copiée !", "success");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copier URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCourseSettings(course)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Configurer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourseWebhook(course)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[10px] font-bold text-rose-700 flex items-center gap-1 transition-all cursor-pointer"
                          title="Supprimer ce webhook de la plateforme et de la base de données"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {trainerCourses.filter(c => c.webhookDisabled || c.webhookUrl === 'disabled').length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Webhooks Supprimés / Désactivés ({trainerCourses.filter(c => c.webhookDisabled || c.webhookUrl === 'disabled').length})</p>
                    {trainerCourses.filter(c => c.webhookDisabled || c.webhookUrl === 'disabled').map(course => (
                      <div key={course.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 gap-3 opacity-80">
                        <div className="flex items-center gap-3">
                          <img src={course.coverImage} className="w-10 h-7 rounded object-cover border border-slate-200 shrink-0 grayscale" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-600 line-through">{course.title}</h4>
                              <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Supprimé / Inactif BD</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Webhook supprimé et inactif en BD</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => handleReactivateCourseWebhook(course)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold text-emerald-700 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-emerald-600" />
                            <span>Réactiver Webhook</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Webhooks from Firestore Collection */}
              {registeredWebhooks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Webhooks Personnalisés en Base de Données ({registeredWebhooks.length})</p>
                  {registeredWebhooks.map(wh => {
                    const matchedCourse = trainerCourses.find(c => c.id === wh.courseId);
                    return (
                      <div key={wh.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-xl p-3 gap-3 shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{wh.name}</span>
                            <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">{wh.eventType || 'Custom'}</span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Stocké BD</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-md">{wh.url}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Formation : {matchedCourse ? matchedCourse.title : (wh.courseId === 'all' ? 'Toutes les formations' : wh.courseId)}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(wh.url);
                              triggerToast("URL copiée !", "success");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copier URL</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWebhookFromDb(wh.id, wh.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[10px] font-bold text-rose-700 flex items-center gap-1 transition-all cursor-pointer"
                            title="Supprimer définitivement ce webhook de la base de données"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

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

                          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                            <div className="text-left md:text-right">
                              <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">{log.method} • HTTP {log.status === 'success' ? '200' : '400'}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[280px]">{log.outcome || log.status}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingleWebhookLog(log.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                              title="Supprimer cette entrée du journal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                            <span className="text-slate-450 text-xs font-bold shrink-0">
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
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-800 truncate max-w-xs sm:max-w-md">Contenu de : {selectedCourse.title}</h2>
              <button
                type="button"
                onClick={() => handleExportCourseStudentsCSV(selectedCourse)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm shadow-emerald-100"
                title="Exporter la liste des élèves au format CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exporter CSV Élèves</span>
              </button>
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

            {/* Quiz Final de la Formation (Certification) */}
            {(() => {
              const courseQuizzes = quizzes.filter(q => q.courseId === selectedCourse.id);
              const finalQuiz = courseQuizzes.find(q => q.associationType === 'course_end' || (!q.moduleId && !q.chapterId));

              return (
                <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Quiz de Fin de Formation (Certification)</h4>
                        {finalQuiz && (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            finalQuiz.isPublished ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {finalQuiz.isPublished ? 'Publié' : 'Brouillon'}
                          </span>
                        )}
                        {finalQuiz?.isRequired && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            Obligatoire (Seuil {finalQuiz.passingScore}%)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {finalQuiz 
                          ? `${finalQuiz.title} • ${finalQuiz.questions.length} question(s) • Durée : ${finalQuiz.durationMinutes || 'Illimitée'} min`
                          : 'Créez un quiz final type Google Forms pour évaluer automatiquement les élèves avant délivrance du certificat.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {finalQuiz ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { setSelectedQuizForStats(finalQuiz); setIsQuizStatsOpen(true); }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Résultats</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuizEditor(finalQuiz, 'course_end', selectedCourse.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Éditer Quiz</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(finalQuiz.id)}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Supprimer ce quiz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenQuizEditor(null, 'course_end', selectedCourse.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Créer le Quiz Final</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

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
                                <button
                                  type="button"
                                  onClick={() => {
                                    const modQuiz = quizzes.find(q => q.associationType === 'module' && (q.targetId === mod.id || q.moduleId === mod.id));
                                    handleOpenQuizEditor(modQuiz || null, 'module', mod.id);
                                    setActiveModMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 transition-colors font-semibold text-indigo-600"
                                >
                                  <FileQuestion className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{quizzes.some(q => q.associationType === 'module' && (q.targetId === mod.id || q.moduleId === mod.id)) ? 'Gérer Quiz Module' : 'Ajouter Quiz au module'}</span>
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

                                          {/* Chapter Quiz badge */}
                                          {(() => {
                                            const chQuiz = quizzes.find(q => q.associationType === 'chapter' && (q.targetId === ch.id || q.chapterId === ch.id));
                                            if (!chQuiz) return null;
                                            return (
                                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0 flex items-center gap-1">
                                                <FileQuestion className="w-2.5 h-2.5 text-indigo-600" />
                                                Quiz ({chQuiz.questions.length} Q)
                                              </span>
                                            );
                                          })()}
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

                      <div className="pt-1">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Orientation / Format d'affichage de la vidéo</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setChVideoOrientation('16/9')}
                            className={`py-1.5 px-3 rounded-lg border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              chVideoOrientation === '16/9' || !chVideoOrientation
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>📺 Horizontal (16/9)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setChVideoOrientation('9/16')}
                            className={`py-1.5 px-3 rounded-lg border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              chVideoOrientation === '9/16'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>📱 Vertical (9/16 Shorts/Reels)</span>
                          </button>
                        </div>
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

      {/* Tab: Custom HTML Pages */}
      {activeTab === 'custom-pages' && (
        <div className="space-y-6 animate-fade-in">
          <CustomPagesManager
            customPages={customPages}
            currentUser={currentUser}
            onSavePage={onSaveCustomPage || (() => {})}
            onDeletePage={onDeleteCustomPage || (() => {})}
            onPreviewPage={onPreviewCustomPage || (() => {})}
          />
        </div>
      )}

      {/* Tab: Emails & Broadcast */}
      {activeTab === 'emails' && (
        <div className="space-y-6 animate-fade-in">
          <EmailBroadcastManager
            allUsers={allUsers}
            currentUser={currentUser}
            onSendEmail={onSendEmail}
          />
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
                src={viewingUserProfile.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'} 
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

      {/* Modal: Enregistrer un Webhook dans la Base de Données */}
      {isCreatingWebhookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">Enregistrer un Webhook dans la Base de Données</h3>
                <p className="text-[11px] text-slate-400">Ajoutez une URL de webhook personnalisée stockée en BD.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingWebhookModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nom du Webhook *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Webhook Zapier Inscriptions, Wave Webhook"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Formation associée</label>
                <select
                  value={newWhCourseId}
                  onChange={(e) => setNewWhCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">Toutes les formations</option>
                  {trainerCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">URL de destination / Endpoint *</label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.zapier.com/hooks/catch/12345/abcde"
                  value={newWhUrl}
                  onChange={(e) => setNewWhUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Événement déclencheur</label>
                <select
                  value={newWhEventType}
                  onChange={(e) => setNewWhEventType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="payment_success">Paiement / Inscription Réussie</option>
                  <option value="student_enrolled">Inscrit à la formation</option>
                  <option value="course_completed">Formation Complétée à 100%</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Jeton / Clé secrète d'authentification (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: whsec_123456789"
                  value={newWhSecretKey}
                  onChange={(e) => setNewWhSecretKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsCreatingWebhookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Enregistrer dans la BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Editor Modal */}
      {isQuizEditorOpen && selectedCourse && (
        <QuizEditorModal
          courseId={selectedCourse.id}
          quiz={editingQuiz}
          modules={courseModules}
          chapters={allChapters.filter(ch => courseModules.some(m => m.id === ch.moduleId))}
          defaultAssociationType={quizDefaultAssoc}
          defaultTargetId={quizDefaultTargetId}
          onClose={() => setIsQuizEditorOpen(false)}
          onSaveSuccess={() => setIsQuizEditorOpen(false)}
        />
      )}

      {/* Trainer Quiz Stats Modal */}
      {isQuizStatsOpen && selectedQuizForStats && (
        <TrainerQuizStatsModal
          quiz={selectedQuizForStats}
          onClose={() => setIsQuizStatsOpen(false)}
        />
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
