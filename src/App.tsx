import { useState, useEffect } from 'react';
import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent, CustomHtmlPage, FooterConfig, DEFAULT_FOOTER_CONFIG } from './types';
import { 
  INITIAL_USERS, INITIAL_COURSES, INITIAL_MODULES, INITIAL_CHAPTERS, 
  INITIAL_ENROLLMENTS, INITIAL_PROGRESS, INITIAL_EMAILS, INITIAL_PRE_REGISTERED,
  INITIAL_CATEGORIES, INITIAL_CUSTOM_PAGES
} from './mockData';

// Modular Components
import Auth from './components/Auth';
import ResetPassword from './components/ResetPassword';
import VerifyEmail from './components/VerifyEmail';
import AdminDashboard from './components/AdminDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import StudentDashboard from './components/StudentDashboard';
import CoursePlayer from './components/CoursePlayer';
import Marketplace from './components/Marketplace';
import UserProfile from './components/UserProfile';
import CustomPageViewer from './components/CustomPageViewer';
import PublicCoursePage from './components/PublicCoursePage';
import NewsletterUnsubscribePage from './components/NewsletterUnsubscribePage';
import { LegalPages, TrainersPage, FaqPage, HelpCenterPage, ContactPage } from './components/PublicFooterPages';
import Footer from './components/Footer';
import NotFoundPage from './components/NotFoundPage';
import ForbiddenPage from './components/ForbiddenPage';
import { ToastContainer, showToast } from './components/Toast';
import GlobalOverflowPopover from './components/GlobalOverflowPopover';
import { NotificationBell } from './components/NotificationBell';
import { emailTriggers } from './services/emailClient';
import { sendRealtimeNotification } from './services/notificationService';

// Icons
import { BookOpen, LogOut, Layout, Star, LogIn, Plus, Menu, X, User as UserIcon, KeyRound } from 'lucide-react';

// Firebase
import { onSnapshot, collection, doc, getDoc, setDoc, collectionGroup } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  seedDatabaseIfEmpty, saveUserProfile, deleteUserProfile, saveCourse, deleteCourse, 
  saveModule, saveModuleList, deleteModule, saveChapter, saveChapterList, 
  deleteChapter, saveEnrollment, deleteEnrollment, saveStudentProgress, 
  saveSimulatedEmail, clearSimulatedEmails, savePreRegistered, deletePreRegistered,
  saveCustomPage, deleteCustomPage, saveFooterSettings
} from './firebaseService';

// Safe localStorage JSON parser helper to prevent white screen crashes from corrupt cache
function safeJsonStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch (err) {
    console.warn(`Error parsing localStorage key "${key}":`, err);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore storage errors
    }
    return fallback;
  }
}

export default function App() {
  // --- Persistent State Handlers (localStorage/Firestore cached fallback) ---
  const [allUsers, setAllUsers] = useState<User[]>(() => safeJsonStorage('sio_users', INITIAL_USERS));
  const [allCourses, setAllCourses] = useState<Course[]>(() => safeJsonStorage('sio_courses', INITIAL_COURSES));
  const [allModules, setAllModules] = useState<Module[]>(() => safeJsonStorage('sio_modules', INITIAL_MODULES));
  const [allChapters, setAllChapters] = useState<Chapter[]>(() => safeJsonStorage('sio_chapters', INITIAL_CHAPTERS));
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>(() => safeJsonStorage('sio_enrollments', INITIAL_ENROLLMENTS));
  const [allProgress, setAllProgress] = useState<StudentProgress[]>(() => safeJsonStorage('sio_progress', INITIAL_PROGRESS));
  const [emails, setEmails] = useState<SimulatedEmail[]>(() => safeJsonStorage('sio_emails', INITIAL_EMAILS));
  const [preRegistered, setPreRegistered] = useState<PreRegisteredStudent[]>(() => safeJsonStorage('sio_preregistered', INITIAL_PRE_REGISTERED));
  const [categories, setCategories] = useState<string[]>(() => safeJsonStorage('sio_categories', INITIAL_CATEGORIES));

  // Sync categories with Firestore settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'categories'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          setCategories(data.list);
          localStorage.setItem('sio_categories', JSON.stringify(data.list));
        }
      } else {
        // Seed default categories into Firestore database if document does not exist yet
        setDoc(doc(db, 'settings', 'categories'), { list: INITIAL_CATEGORIES }).catch(err => {
          console.warn('Could not seed initial categories to Firestore:', err);
        });
      }
    }, (err) => {
      console.warn('Settings categories snapshot listener warning:', err.message);
    });
    return () => unsub();
  }, []);

  const handleAddCategory = async (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Cette catégorie existe déjà !', 'warning');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    localStorage.setItem('sio_categories', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'settings', 'categories'), { list: updated });
    } catch (err) {
      console.error('Error saving category to Firestore:', err);
    }
    showToast(`Catégorie "${trimmed}" ajoutée avec succès !`, 'success');
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const updated = categories.filter(c => c !== catToDelete);
    setCategories(updated);
    localStorage.setItem('sio_categories', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'settings', 'categories'), { list: updated });
    } catch (err) {
      console.error('Error deleting category from Firestore:', err);
    }
    showToast(`Catégorie "${catToDelete}" supprimée.`, 'info');
  };

  // Active session and view management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Helper to extract custom page route synchronously on initial load
  const matchCustomPageRoute = (pages: CustomHtmlPage[], isAdmin = false): CustomHtmlPage | null => {
    if (!pages || pages.length === 0) return null;
    let slug = '';
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const SYSTEM_RESERVED_SLUGS = ['marketplace', 'admin', 'student', 'trainer', 'auth', 'verify-email', 'verify', 'verifier-email', 'reset-password', 'mot-de-passe-oublie', 'connexion', 'login', 'inscription', 'register', 'dashboard', 'api', 'unsubscribe', 'desabonnement', 'desinscription'];
    
    // 1. Pathname check (e.g. /p/offre-speciale or /offre-speciale)
    if (pathParts.length >= 2 && pathParts[0] === 'p') {
      slug = pathParts[1];
    } else if (pathParts.length === 1 && !SYSTEM_RESERVED_SLUGS.includes(pathParts[0].toLowerCase())) {
      slug = pathParts[0];
    }

    // 2. Query parameter check (e.g. ?p=offre-speciale or ?page=offre-speciale)
    if (!slug) {
      const params = new URLSearchParams(window.location.search);
      slug = params.get('p') || params.get('page') || '';
    }

    // 3. Hash check (e.g. #/p/offre-speciale or #/offre-speciale)
    if (!slug && window.location.hash) {
      const hash = window.location.hash.replace('#', '').replace(/^\/+/, '');
      const hashParts = hash.split('/');
      if (hashParts[0] === 'p' && hashParts[1]) {
        slug = hashParts[1];
      } else if (hashParts.length === 1 && !hashParts[0].includes('=')) {
        slug = hashParts[0];
      }
    }

    if (slug) {
      const matchedPage = pages.find(p => p.slug === slug || p.id === slug);
      if (matchedPage) {
        if (matchedPage.status === 'published' || isAdmin) {
          return matchedPage;
        }
      }
    }
    return null;
  };

  // --- Custom HTML Pages State & Firestore Sync ---
  const [allCustomPages, setAllCustomPages] = useState<CustomHtmlPage[]>(() => safeJsonStorage('sio_custom_pages', INITIAL_CUSTOM_PAGES));

  const [previewingCustomPage, setPreviewingCustomPage] = useState<CustomHtmlPage | null>(null);
  
  // Synchronous initial route detection (zero delay / no home page flash)
  const [activeCustomPageRoute, setActiveCustomPageRoute] = useState<CustomHtmlPage | null>(() => {
    const pages: CustomHtmlPage[] = safeJsonStorage('sio_custom_pages', INITIAL_CUSTOM_PAGES);
    let slug = '';
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const SYSTEM_RESERVED_SLUGS = ['marketplace', 'admin', 'student', 'trainer', 'auth', 'verify-email', 'verify', 'verifier-email', 'reset-password', 'mot-de-passe-oublie', 'connexion', 'login', 'inscription', 'register', 'dashboard', 'api', 'unsubscribe', 'desabonnement', 'desinscription'];
    if (pathParts.length >= 2 && pathParts[0] === 'p') {
      slug = pathParts[1];
    } else if (pathParts.length === 1 && !SYSTEM_RESERVED_SLUGS.includes(pathParts[0].toLowerCase())) {
      slug = pathParts[0];
    }
    if (!slug) {
      const params = new URLSearchParams(window.location.search);
      slug = params.get('p') || params.get('page') || '';
    }
    if (!slug && window.location.hash) {
      const hash = window.location.hash.replace('#', '').replace(/^\/+/, '');
      const hashParts = hash.split('/');
      if (hashParts[0] === 'p' && hashParts[1]) {
        slug = hashParts[1];
      } else if (hashParts.length === 1 && !hashParts[0].includes('=')) {
        slug = hashParts[0];
      }
    }
    if (slug) {
      const matched = pages.find(p => p.slug === slug || p.id === slug);
      if (matched) return matched;
    }
    return null;
  });

  // --- Footer Settings State & Realtime Firestore Sync ---
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => safeJsonStorage('sio_footer_settings', DEFAULT_FOOTER_CONFIG));

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'footer'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as FooterConfig;
        setFooterConfig(data);
        localStorage.setItem('sio_footer_settings', JSON.stringify(data));
      }
    }, (err) => {
      console.warn('Footer settings subscription restricted:', err.message);
    });
    return () => unsub();
  }, []);

  const handleSaveFooterConfig = async (newConfig: FooterConfig) => {
    setFooterConfig(newConfig);
    localStorage.setItem('sio_footer_settings', JSON.stringify(newConfig));
    await saveFooterSettings(newConfig);
  };

  const handleSaveCustomPage = async (page: CustomHtmlPage) => {
    const exists = allCustomPages.some(p => p.id === page.id);
    const updated = exists
      ? allCustomPages.map(p => p.id === page.id ? page : p)
      : [page, ...allCustomPages];
    setAllCustomPages(updated);
    localStorage.setItem('sio_custom_pages', JSON.stringify(updated));
    try {
      await saveCustomPage(page);
    } catch (err) {
      console.error('Error saving custom page to Firestore:', err);
    }
  };

  const handleDeleteCustomPage = async (pageId: string) => {
    const pageToDelete = allCustomPages.find(p => p.id === pageId);
    const updated = allCustomPages.filter(p => p.id !== pageId);
    setAllCustomPages(updated);
    localStorage.setItem('sio_custom_pages', JSON.stringify(updated));
    try {
      await deleteCustomPage(pageId);
    } catch (err) {
      console.error('Error deleting custom page from Firestore:', err);
    }
    if (pageToDelete) {
      showToast(`Page "${pageToDelete.title}" supprimée.`, 'info');
    }
  };

  // Intercept Custom Page routes dynamically on navigation / updates
  useEffect(() => {
    if (allCustomPages.length === 0) return;

    const checkCustomPageRoute = () => {
      const matchedPage = matchCustomPageRoute(allCustomPages, currentUser?.role === 'admin');
      setActiveCustomPageRoute(matchedPage);
    };

    checkCustomPageRoute();

    window.addEventListener('popstate', checkCustomPageRoute);
    window.addEventListener('hashchange', checkCustomPageRoute);
    return () => {
      window.removeEventListener('popstate', checkCustomPageRoute);
      window.removeEventListener('hashchange', checkCustomPageRoute);
    };
  }, [allCustomPages, currentUser]);

  const [activeCoursePlayer, setActiveCoursePlayer] = useState<Course | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [autoOpenCourseSlug, setAutoOpenCourseSlug] = useState('');

  // --- Centralized SPA Router State ---
  const [currentPath, setCurrentPath] = useState<string>(() => 
    window.location.pathname + window.location.search + window.location.hash
  );

  const navigateTo = (path: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname + window.location.search + window.location.hash);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // --- Auto-redirect logged in users accessing login/register routes directly to their dashboard ---
  useEffect(() => {
    if (currentUser && !authLoading) {
      const rawPath = currentPath.split('?')[0].split('#')[0] || '/';
      const cleanPath = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;
      const lowerPath = cleanPath.toLowerCase();

      if (['/connexion', '/auth', '/login', '/inscription', '/register', '/signup'].includes(lowerPath)) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          navigateTo(redirectUrl, true);
        } else if (currentUser.role === 'admin') {
          navigateTo('/admin', true);
        } else if (currentUser.role === 'trainer' || currentUser.role === 'assistant') {
          navigateTo('/trainer', true);
        } else {
          navigateTo('/dashboard', true);
        }
      }
    }
  }, [currentUser, authLoading, currentPath]);

  // Sync document title and canonical link on route changes
  useEffect(() => {
    let rawPath = currentPath.split('?')[0].split('#')[0] || '/';
    if (rawPath.length > 1 && rawPath.endsWith('/')) {
      rawPath = rawPath.slice(0, -1);
    }
    const pathname = rawPath.toLowerCase();

    let pageTitle = 'Dekel.Formation - Plateforme E-Learning';

    if (pathname === '/' || pathname === '/marketplace' || pathname === '/catalogue') {
      pageTitle = 'Catalogue de Formations | Dekel.Formation';
    } else if (pathname === '/connexion' || pathname === '/auth' || pathname === '/login') {
      pageTitle = 'Connexion | Dekel.Formation';
    } else if (pathname === '/inscription' || pathname === '/register') {
      pageTitle = 'Création de compte | Dekel.Formation';
    } else if (pathname === '/mot-de-passe-oublie' || pathname === '/reset-password') {
      pageTitle = 'Mot de passe oublié | Dekel.Formation';
    } else if (pathname === '/verifier-email' || pathname === '/verify-email') {
      pageTitle = 'Vérification Email | Dekel.Formation';
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/student')) {
      pageTitle = 'Mon Espace Étudiant | Dekel.Formation';
    } else if (pathname.startsWith('/trainer')) {
      pageTitle = 'Espace Formateur | Dekel.Formation';
    } else if (pathname.startsWith('/admin')) {
      pageTitle = 'Espace Administration | Dekel.Formation';
    }

    const courseMatch = pathname.match(/^\/(formation|course|f)\/([^/]+)/i);
    if (courseMatch && courseMatch[2]) {
      const slug = courseMatch[2];
      const course = allCourses.find(c => c.seoSlug?.toLowerCase() === slug || c.id.toLowerCase() === slug);
      if (course) {
        pageTitle = `${course.seoTitle || course.title} | Formation Dekel`;
      } else {
        pageTitle = '404 - Page introuvable | Dekel.Formation';
      }
    }

    document.title = pageTitle;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [currentPath, allCourses]);

  // Single application theme: Nature Dark (Premium)
  const currentTheme = 'theme-nature-dark';

  useEffect(() => {
    localStorage.setItem('sio_theme', 'theme-nature-dark');
  }, []);

  // Trigger local cache persistence on updates
  useEffect(() => {
    localStorage.setItem('sio_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('sio_courses', JSON.stringify(allCourses));
  }, [allCourses]);

  useEffect(() => {
    localStorage.setItem('sio_modules', JSON.stringify(allModules));
  }, [allModules]);

  useEffect(() => {
    localStorage.setItem('sio_chapters', JSON.stringify(allChapters));
  }, [allChapters]);

  useEffect(() => {
    localStorage.setItem('sio_enrollments', JSON.stringify(allEnrollments));
  }, [allEnrollments]);

  useEffect(() => {
    localStorage.setItem('sio_progress', JSON.stringify(allProgress));
  }, [allProgress]);

  useEffect(() => {
    localStorage.setItem('sio_emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem('sio_preregistered', JSON.stringify(preRegistered));
  }, [preRegistered]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sio_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sio_current_user');
    }
  }, [currentUser]);

  // --- Real-time Firestore Subscriptions & Auto-Seeding ---
  useEffect(() => {
    seedDatabaseIfEmpty();
  }, []);

  useEffect(() => {
    // Safety timer: Never block rendering for more than 2 seconds
    const fallbackTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 2000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user authenticated:', firebaseUser.email);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as User;
            setCurrentUser(profile);
          } else {
            const email = firebaseUser.email || '';
            let role: 'admin' | 'trainer' | 'student' = 'student';
            
            if (email.toLowerCase() === 'admin@dekel-formation.com' || email.toLowerCase() === 'service@dekel-dev.com') {
              role = 'admin';
            } else if (email.toLowerCase() === 'jean.formateur@gmail.com' || email.toLowerCase() === 'marie.formatrice@gmail.com') {
              role = 'trainer';
            }

            const matchedPreReg = preRegistered.find(p => p.email.toLowerCase() === email.toLowerCase());
            const detectedName = matchedPreReg?.name || firebaseUser.displayName || email.split('@')[0];

            const newProfile: User = {
              id: firebaseUser.uid,
              email: email,
              name: detectedName,
              role: role,
              avatarUrl: firebaseUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png',
              createdAt: new Date().toISOString(),
              status: 'active'
            };
            
            await saveUserProfile(newProfile);
            setCurrentUser(newProfile);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error on auth state change:', err);
      } finally {
        clearTimeout(fallbackTimer);
        setAuthLoading(false);
      }
    });
    return () => {
      clearTimeout(fallbackTimer);
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'courses'), (snap) => {
      const list: Course[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as Course);
      });
      if (list.length > 0) {
        setAllCourses(list);
      }
    }, (err) => {
      console.warn('Courses snapshot subscription restricted or offline:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, 'modules'), (snap) => {
      const list: Module[] = [];
      const seen = new Set<string>();
      snap.forEach(doc => {
        const data = doc.data() as Module;
        if (!seen.has(data.id)) {
          seen.add(data.id);
          list.push(data);
        } else {
          const idx = list.findIndex(m => m.id === data.id);
          if (idx !== -1 && !list[idx].courseId && data.courseId) {
            list[idx] = data;
          }
        }
      });
      if (list.length > 0) {
        setAllModules(list);
      }
    }, (err) => {
      console.warn('Modules snapshot subscription restricted or offline:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, 'chapters'), (snap) => {
      const list: Chapter[] = [];
      const seen = new Set<string>();
      snap.forEach(doc => {
        const data = doc.data() as Chapter;
        if (!seen.has(data.id)) {
          seen.add(data.id);
          list.push(data);
        } else {
          const idx = list.findIndex(ch => ch.id === data.id);
          if (idx !== -1 && !list[idx].courseId && data.courseId) {
            list[idx] = data;
          }
        }
      });
      if (list.length > 0) {
        setAllChapters(list);
      }
    }, (err) => {
      console.warn('Chapters snapshot subscription restricted or offline:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: User[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as User);
      });
      if (list.length > 0) {
        setAllUsers(list);
      }
    }, (err) => {
      console.warn('Users collection subscription restricted:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'enrollments'), (snap) => {
      const list: Enrollment[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as Enrollment);
      });
      setAllEnrollments(list);
    }, (err) => {
      console.warn('Enrollments collection subscription restricted:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'progress'), (snap) => {
      const list: StudentProgress[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as StudentProgress);
      });
      setAllProgress(list);
    }, (err) => {
      console.warn('Progress collection subscription restricted:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'emails'), (snap) => {
      const list: SimulatedEmail[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as SimulatedEmail);
      });
      setEmails(list);
    }, (err) => {
      console.warn('Emails collection subscription restricted:', err.message);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'preregistered'), (snap) => {
      const list: PreRegisteredStudent[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as PreRegisteredStudent);
      });
      setPreRegistered(list);
    }, (err) => {
      console.warn('Preregistered collection subscription restricted:', err.message);
    });
    return () => unsub();
  }, []);

  // Webhook Background Synchronizer
  useEffect(() => {
    let active = true;

    const syncWebhooks = async () => {
      try {
        const res = await fetch('/api/sync-enrollments');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && Array.isArray(data.enrollments) && data.enrollments.length > 0) {
          for (const record of data.enrollments) {
            const courseId = record.courseId;
            const studentEmail = record.studentEmail.toLowerCase();
            
            // Check if student is already enrolled in this course ("si un webhook est reçu et que le mail reçu est déja dans la formation, ne rien faire")
            const alreadyEnrolled = allEnrollments.some(
              e => e.studentEmail.toLowerCase() === studentEmail && e.courseId === courseId && e.status === 'active'
            );
            if (alreadyEnrolled) {
              continue;
            }

            // 1. Grant student enrollment
            const newEnroll: Enrollment = {
              id: `e-wh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              studentEmail,
              courseId,
              status: 'active',
              enrolledAt: record.enrolledAt || new Date().toISOString()
            };
            await saveEnrollment(newEnroll);

            // 2. Register/activate student account automatically
            const userExists = allUsers.some(u => u.email.toLowerCase() === studentEmail);
            if (!userExists) {
              const newPre: PreRegisteredStudent = {
                email: studentEmail,
                name: record.studentName || undefined,
                courseIds: [courseId]
              };
              await savePreRegistered(newPre);
            }

            // 3. Send out Real Transactional Email & Simulated Email confirmation
            const courseObj = allCourses.find(c => c.id === courseId);
            const courseTitle = courseObj ? courseObj.title : 'votre formation';

            emailTriggers.paymentValidated(
              studentEmail,
              record.studentName || studentEmail,
              courseTitle,
              record.amount ? `${record.amount} FCFA` : undefined
            );
            emailTriggers.courseEnrollment(
              studentEmail,
              record.studentName || studentEmail,
              courseTitle
            );

            const autoWebhookEmail: SimulatedEmail = {
              id: `em-wh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              to: studentEmail,
              subject: `[Dekel.Formation] Accès activé automatiquement !`,
              body: `Bonjour,

Nous avons le plaisir de vous informer que votre paiement a été validé avec succès par notre système de webhook de paiement automatique !

Votre accès à la formation "${courseTitle}" est maintenant débloqué sur la plateforme Dekel.Formation.

- Si vous possédez déjà un compte étudiant avec cet e-mail (${studentEmail}), connectez-vous pour retrouver votre cours dans votre espace personnel.
- Si vous n'avez pas encore de compte étudiant, créez simplement un compte avec l'e-mail "${studentEmail}" sur notre page d'authentification pour débloquer automatiquement vos cours en attente.

Bon apprentissage sur Dekel.Formation !
L'équipe de support client : support@dekel-formation.com`,
              sentAt: new Date().toISOString()
            };
            await saveSimulatedEmail(autoWebhookEmail);
          }
        }
      } catch (err) {
        // Silent error
      }
    };

    const interval = setInterval(() => {
      if (active) syncWebhooks();
    }, 3500);

    syncWebhooks();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [allCourses, allUsers]);

  // --- Helper Action Dispatchers ---
  const handleSendEmail = async (email: SimulatedEmail) => {
    setEmails(prev => [...prev, email]);
    await saveSimulatedEmail(email);
  };

  const handleClearEmails = async () => {
    setEmails([]);
    await clearSimulatedEmails(emails);
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setActiveCoursePlayer(null);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      navigateTo(redirectUrl, true);
    } else if (user.role === 'admin') {
      navigateTo('/admin', true);
    } else if (user.role === 'trainer' || user.role === 'assistant') {
      navigateTo('/trainer', true);
    } else {
      navigateTo('/dashboard', true);
    }

    // Case 2 Activation
    const preRegMatch = preRegistered.find(p => p.email.toLowerCase() === user.email.toLowerCase());
    if (preRegMatch && user.role === 'student') {
      const newEnrollmentsToCreate: Enrollment[] = [];
      
      for (const cId of preRegMatch.courseIds) {
        const alreadyHas = allEnrollments.some(
          en => en.studentEmail.toLowerCase() === user.email.toLowerCase() && en.courseId === cId
        );
        if (!alreadyHas) {
          const newEnroll: Enrollment = {
            id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentEmail: user.email.toLowerCase(),
            courseId: cId,
            status: 'active',
            enrolledAt: new Date().toISOString()
          };
          newEnrollmentsToCreate.push(newEnroll);
          await saveEnrollment(newEnroll);
        }
      }

      if (newEnrollmentsToCreate.length > 0) {
        await deletePreRegistered(user.email);

        const autoActiveEmail: SimulatedEmail = {
          id: `em-${Date.now()}`,
          to: user.email.toLowerCase(),
          subject: 'Vos formations pré-enregistrées ont été débloquées !',
          body: `Félicitations ${user.name},

Vous venez d'activer votre compte. Nous avons détecté des inscriptions en attente pour votre adresse e-mail.
${newEnrollmentsToCreate.length} formation(s) ont été automatiquement débloquées sur votre espace !

Bon apprentissage.`,
          sentAt: new Date().toISOString()
        };
        await handleSendEmail(autoActiveEmail);
      }
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setActiveCoursePlayer(null);
    navigateTo('/');
    try {
      await auth.signOut();
      showToast('Déconnexion réussie !', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la déconnexion.', 'error');
    }
  };

  const handleAddUser = async (user: User) => {
    setAllUsers(prev => [...prev, user]);
    await saveUserProfile(user);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    await saveUserProfile(updatedUser);

    if (updatedUser.avatarUrl) {
      setAllCourses(prevCourses => {
        let changed = false;
        const updatedCourses = prevCourses.map(c => {
          if ((c.trainerId && c.trainerId === updatedUser.id) || (c.trainerName && c.trainerName.toLowerCase() === updatedUser.name?.toLowerCase())) {
            if (c.trainerPhoto !== updatedUser.avatarUrl) {
              changed = true;
              const updatedCourse = { ...c, trainerPhoto: updatedUser.avatarUrl };
              saveCourse(updatedCourse);
              return updatedCourse;
            }
          }
          return c;
        });
        return changed ? updatedCourses : prevCourses;
      });
    }
  };

  const handleEnrollStudent = async (email: string, courseId: string) => {
    const emailTrimmed = email.trim().toLowerCase();
    
    // Check if student already enrolled in this specific course
    const alreadyEnrolled = allEnrollments.some(
      e => e.studentEmail.toLowerCase() === emailTrimmed && e.courseId === courseId && e.status === 'active'
    );
    if (alreadyEnrolled) {
      showToast("L'étudiant a déjà la formation !", "error");
      return;
    }

    const newEnroll: Enrollment = {
      id: `e-${Date.now()}`,
      studentEmail: emailTrimmed,
      courseId,
      status: 'active',
      enrolledAt: new Date().toISOString()
    };
    setAllEnrollments(prev => [...prev, newEnroll]);
    await saveEnrollment(newEnroll);

    // Send transactional email
    const courseObj = allCourses.find(c => c.id === courseId);
    const studentUser = allUsers.find(u => u.email.toLowerCase() === emailTrimmed);
    const recipientName = studentUser ? (studentUser.name || studentUser.firstName || emailTrimmed) : emailTrimmed;

    emailTriggers.courseEnrollment(
      emailTrimmed,
      recipientName,
      courseObj ? courseObj.title : 'Formation Dekel.Formation',
      courseObj ? courseObj.trainerName : 'Formateur'
    );

    // Send Realtime Notification
    sendRealtimeNotification({
      userEmail: emailTrimmed,
      title: '🔓 Nouveau cours débloqué !',
      message: `Vous avez été inscrit(e) à la formation "${courseObj ? courseObj.title : 'Nouvelle Formation'}".`,
      type: 'access_granted',
      courseId: courseId
    });

    const userExists = allUsers.some(u => u.email.toLowerCase() === emailTrimmed);
    if (!userExists) {
      const existing = preRegistered.find(p => p.email.toLowerCase() === emailTrimmed);
      let updatedPre: PreRegisteredStudent;
      if (existing) {
        updatedPre = {
          ...existing,
          courseIds: existing.courseIds.includes(courseId) ? existing.courseIds : [...existing.courseIds, courseId]
        };
      } else {
        updatedPre = { email: emailTrimmed, courseIds: [courseId] };
      }
      setPreRegistered(prev => {
        const other = prev.filter(p => p.email.toLowerCase() !== emailTrimmed);
        return [...other, updatedPre];
      });
      await savePreRegistered(updatedPre);
    }
  };

  const handleToggleChapterComplete = async (chapterId: string) => {
    if (!currentUser || !activeCoursePlayer) return;

    const existingIdx = allProgress.findIndex(
      p => p.studentEmail.toLowerCase() === currentUser.email.toLowerCase() && p.courseId === activeCoursePlayer.id
    );

    const now = new Date().toISOString();
    let updatedProgress: StudentProgress;

    if (existingIdx !== -1) {
      const existing = allProgress[existingIdx];
      const isCompleted = existing.completedChapterIds.includes(chapterId);
      const newIds = isCompleted
        ? existing.completedChapterIds.filter(id => id !== chapterId)
        : [...existing.completedChapterIds, chapterId];

      updatedProgress = {
        ...existing,
        completedChapterIds: newIds,
        lastAccessedAt: now
      };
    } else {
      updatedProgress = {
        studentEmail: currentUser.email.toLowerCase(),
        courseId: activeCoursePlayer.id,
        completedChapterIds: [chapterId],
        lastAccessedAt: now,
        completedModuleEmailsSent: [],
        courseCompletedEmailSent: false
      };
    }

    // Check if adding this chapter completes a module or the course
    const isAddingChapter = existingIdx === -1 || !allProgress[existingIdx].completedChapterIds.includes(chapterId);

    if (isAddingChapter) {
      const courseModules = allModules.filter(m => m.courseId === activeCoursePlayer.id);
      const courseChapters = allChapters.filter(ch => {
        const mod = allModules.find(m => m.id === ch.moduleId);
        return mod?.courseId === activeCoursePlayer.id;
      });

      // Find module for this chapter
      const targetChapter = courseChapters.find(ch => ch.id === chapterId);
      if (targetChapter) {
        const targetModule = courseModules.find(m => m.id === targetChapter.moduleId);
        if (targetModule) {
          const moduleChapters = courseChapters.filter(ch => ch.moduleId === targetModule.id);
          const isModuleComplete = moduleChapters.length > 0 && moduleChapters.every(ch => updatedProgress.completedChapterIds.includes(ch.id));

          const sentModuleIds = updatedProgress.completedModuleEmailsSent || [];
          if (isModuleComplete && !sentModuleIds.includes(targetModule.id)) {
            emailTriggers.moduleCompleted(
              currentUser.email,
              currentUser.name,
              activeCoursePlayer.title,
              targetModule.title
            );

            // Send Realtime Notification
            sendRealtimeNotification({
              userEmail: currentUser.email,
              title: `🌟 Module « ${targetModule.title} » validé !`,
              message: `Félicitations ! Vous avez validé toutes les leçons du module dans "${activeCoursePlayer.title}".`,
              type: 'module_completed',
              courseId: activeCoursePlayer.id
            });

            updatedProgress = {
              ...updatedProgress,
              completedModuleEmailsSent: [...sentModuleIds, targetModule.id]
            };
            showToast(`🌟 Félicitations ! Module « ${targetModule.title} » terminé. Un e-mail vous a été envoyé !`, 'success');
          }
        }
      }

      // Check overall course completion (100%)
      const isCourseComplete = courseChapters.length > 0 && courseChapters.every(ch => updatedProgress.completedChapterIds.includes(ch.id));
      if (isCourseComplete && !updatedProgress.courseCompletedEmailSent) {
        emailTriggers.courseCompleted(
          currentUser.email,
          currentUser.name,
          activeCoursePlayer.title
        );

        // Send Realtime Notification
        sendRealtimeNotification({
          userEmail: currentUser.email,
          title: `🎉 Formation 100% terminée !`,
          message: `Bravo ! Vous avez terminé 100% de la formation "${activeCoursePlayer.title}". Vous pouvez commander votre certificat officiel.`,
          type: 'course_completed',
          courseId: activeCoursePlayer.id
        });

        updatedProgress = {
          ...updatedProgress,
          courseCompletedEmailSent: true
        };
        showToast(`🎉 Bravo ! Vous avez terminé 100% de la formation « ${activeCoursePlayer.title} ». Un e-mail vous a été envoyé !`, 'success');
      }
    }

    setAllProgress(prev => {
      const copy = [...prev];
      if (existingIdx !== -1) {
        copy[existingIdx] = updatedProgress;
      } else {
        copy.push(updatedProgress);
      }
      return copy;
    });
    await saveStudentProgress(updatedProgress);
  };

  const renderCurrentRoute = () => {
    let rawPath = currentPath.split('?')[0].split('#')[0] || '/';
    if (rawPath.length > 1 && rawPath.endsWith('/')) {
      rawPath = rawPath.slice(0, -1);
    }
    const pathname = rawPath.toLowerCase();

    const queryString = currentPath.includes('?') ? currentPath.split('?')[1].split('#')[0] : '';
    const searchParams = new URLSearchParams(queryString);
    const modeParam = (searchParams.get('mode') || '').toLowerCase();
    const hasResetCode = searchParams.has('oobCode') || searchParams.has('token') || searchParams.has('code');

    // 1. Preview mode for Custom Pages in modal
    if (previewingCustomPage) {
      return (
        <CustomPageViewer 
          page={previewingCustomPage} 
          isPreviewMode={true}
          onClosePreview={() => setPreviewingCustomPage(null)} 
        />
      );
    }

    // 1b. Email Action Routes & Query Overrides (Password reset, email verification, auth, etc.)
    if (
      pathname === '/reset-password' ||
      pathname === '/mot-de-passe-oublie' ||
      pathname === '/auth/reset-password' ||
      modeParam === 'resetpassword' ||
      modeParam === 'reset_password' ||
      modeParam === 'reset' ||
      (hasResetCode && !pathname.includes('verify') && !modeParam.includes('verify'))
    ) {
      return (
        <ResetPassword
          allUsers={allUsers}
          onBackToLogin={() => navigateTo('/connexion')}
          onSendEmail={handleSendEmail}
        />
      );
    }

    if (
      pathname === '/verify-email' ||
      pathname === '/verifier-email' ||
      pathname === '/verify' ||
      pathname === '/auth/verify-email' ||
      pathname === '/auth/verify' ||
      modeParam === 'verifyemail' ||
      modeParam === 'verify_email' ||
      modeParam === 'verify'
    ) {
      return (
        <VerifyEmail
          currentUser={currentUser}
          onBackToLogin={() => navigateTo('/connexion')}
          onGoToDashboard={() => navigateTo('/dashboard')}
        />
      );
    }

    if (
      pathname === '/connexion' ||
      pathname === '/auth' ||
      pathname === '/login' ||
      modeParam === 'login' ||
      modeParam === 'connexion'
    ) {
      if (currentUser) {
        return (
          <div className="text-center py-12 space-y-4">
            <p className="text-white font-bold">Vous êtes déjà connecté(e).</p>
            <button 
              onClick={() => {
                if (currentUser.role === 'admin') navigateTo('/admin');
                else if (currentUser.role === 'trainer' || currentUser.role === 'assistant') navigateTo('/trainer');
                else navigateTo('/dashboard');
              }} 
              className="accent-gradient text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              Accéder à mon espace
            </button>
          </div>
        );
      }
      return (
        <Auth
          allUsers={allUsers}
          onLogin={handleLogin}
          onAddUser={handleAddUser}
          onSendEmail={handleSendEmail}
        />
      );
    }

    if (
      pathname === '/inscription' ||
      pathname === '/register' ||
      pathname === '/signup' ||
      modeParam === 'register' ||
      modeParam === 'inscription'
    ) {
      if (currentUser) {
        return (
          <div className="text-center py-12 space-y-4">
            <p className="text-white font-bold">Vous êtes déjà connecté(e).</p>
            <button 
              onClick={() => {
                if (currentUser.role === 'admin') navigateTo('/admin');
                else if (currentUser.role === 'trainer' || currentUser.role === 'assistant') navigateTo('/trainer');
                else navigateTo('/dashboard');
              }} 
              className="accent-gradient text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              Accéder à mon espace
            </button>
          </div>
        );
      }
      return (
        <Auth
          allUsers={allUsers}
          onLogin={handleLogin}
          onAddUser={handleAddUser}
          onSendEmail={handleSendEmail}
        />
      );
    }

    // 2. Public Course Presentation Page: /formation/:slug, /course/:slug, /f/:slug
    const courseMatch = pathname.match(/^\/(formation|course|f)\/([^/]+)/i);
    if (courseMatch && courseMatch[2]) {
      const slug = courseMatch[2];
      const course = allCourses.find(c => c.seoSlug?.toLowerCase() === slug || c.id.toLowerCase() === slug);
      if (course) {
        return (
          <PublicCoursePage
            course={course}
            allModules={allModules.filter(m => m.courseId === course.id)}
            allChapters={allChapters.filter(ch => {
              const mod = allModules.find(m => m.id === ch.moduleId);
              return mod?.courseId === course.id;
            })}
            currentUser={currentUser}
            allUsers={allUsers}
            onNavigateToCatalog={() => navigateTo('/marketplace')}
            onNavigateToLogin={() => navigateTo('/connexion')}
            isEnrolled={currentUser ? allEnrollments.some(e => e.studentEmail.toLowerCase() === currentUser.email.toLowerCase() && e.courseId === course.id && e.status === 'active') : false}
          />
        );
      } else {
        return <NotFoundPage onNavigate={navigateTo} />;
      }
    }

    // 3. Custom HTML Page Route: /p/:slug or /page/:slug or root /:slug if matched
    const customPageMatch = pathname.match(/^\/(p|page|pages)\/([^/]+)/i);
    const targetSlug = customPageMatch ? customPageMatch[2] : (pathname.startsWith('/') ? pathname.slice(1) : '');
    
    if (targetSlug && !['', 'marketplace', 'catalogue', 'admin', 'student', 'trainer', 'auth', 'connexion', 'inscription', 'register', 'dashboard', 'reset-password', 'verify-email', 'api', 'formateurs', 'trainers', 'faq', 'centre-aide', 'help', 'contact', 'unsubscribe', 'desabonnement', 'desinscription'].includes(targetSlug.toLowerCase())) {
      const matchedPage = allCustomPages.find(p => p.slug?.toLowerCase() === targetSlug.toLowerCase() || p.id?.toLowerCase() === targetSlug.toLowerCase());
      if (matchedPage && (matchedPage.status === 'published' || currentUser?.role === 'admin')) {
        return (
          <CustomPageViewer
            page={matchedPage}
            onClosePreview={() => navigateTo('/')}
          />
        );
      }
    }

    // 3b. Public Footer Pages (Legal, Formateurs, FAQ, Centre d'Aide, Contact)
    const lowerPath = pathname.toLowerCase();
    if (lowerPath === '/p/terms' || lowerPath === '/terms' || lowerPath === '/conditions-utilisation') {
      return <LegalPages initialDoc="terms" onNavigate={navigateTo} />;
    }
    if (lowerPath === '/p/privacy' || lowerPath === '/privacy' || lowerPath === '/politique-confidentialite') {
      return <LegalPages initialDoc="privacy" onNavigate={navigateTo} />;
    }
    if (lowerPath === '/p/cookies' || lowerPath === '/cookies' || lowerPath === '/politique-cookies') {
      return <LegalPages initialDoc="cookies" onNavigate={navigateTo} />;
    }
    if (lowerPath === '/p/legal' || lowerPath === '/legal' || lowerPath === '/mentions-legales') {
      return <LegalPages initialDoc="legal" onNavigate={navigateTo} />;
    }
    if (lowerPath === '/formateurs' || lowerPath === '/trainers' || lowerPath === '/tous-les-formateurs') {
      return <TrainersPage allUsers={allUsers} allCourses={allCourses} allEnrollments={allEnrollments} onNavigate={navigateTo} />;
    }
    if (lowerPath === '/faq') {
      return <FaqPage onNavigate={navigateTo} />;
    }
    if (lowerPath === '/centre-aide' || lowerPath === '/help') {
      return <HelpCenterPage onNavigate={navigateTo} />;
    }
    if (lowerPath === '/contact') {
      return <ContactPage onSendEmail={handleSendEmail} onNavigate={navigateTo} />;
    }
    if (lowerPath.startsWith('/unsubscribe') || lowerPath.startsWith('/desabonnement') || lowerPath.startsWith('/desinscription')) {
      return <NewsletterUnsubscribePage onNavigate={navigateTo} />;
    }

    // 4. Public Pages
    if (pathname === '/' || pathname === '/accueil') {
      if (currentUser?.role === 'student') {
        return (
          <StudentDashboard
            currentUser={currentUser}
            allCourses={allCourses}
            allModules={allModules}
            allChapters={allChapters}
            allEnrollments={allEnrollments}
            allProgress={allProgress}
            onOpenCoursePlayer={(c) => navigateTo(`/dashboard/formation/${c.id}`)}
            onOpenCatalog={() => navigateTo('/marketplace')}
            onOpenPublicPage={(c) => navigateTo(`/formation/${c.seoSlug || c.id}`)}
          />
        );
      } else if (currentUser?.role === 'trainer' || currentUser?.role === 'assistant') {
        return (
          <TrainerDashboard
            currentUser={currentUser}
            allUsers={allUsers}
            allCourses={allCourses}
            allModules={allModules}
            allChapters={allChapters}
            allEnrollments={allEnrollments}
            allProgress={allProgress}
            preRegistered={preRegistered}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddCourse={(c) => { setAllCourses(prev => [...prev, c]); saveCourse(c); }}
            onUpdateCourse={(c) => { setAllCourses(prev => prev.map(x => x.id === c.id ? c : x)); saveCourse(c); }}
            onDeleteCourse={(id) => { setAllCourses(prev => prev.filter(c => c.id !== id)); deleteCourse(id); }}
            onAddModule={(m) => { setAllModules(prev => [...prev, m]); saveModule(m); }}
            onUpdateModules={async (mods) => {
              const ids = new Set(mods.map(m => m.id));
              setAllModules(prev => [...prev.filter(m => !ids.has(m.id)), ...mods]);
              await saveModuleList(mods);
            }}
            onDeleteModule={(id) => {
              const mod = allModules.find(m => m.id === id);
              setAllModules(prev => prev.filter(m => m.id !== id));
              deleteModule(id, mod ? mod.courseId : '');
            }}
            onAddChapter={(ch) => { setAllChapters(prev => [...prev, ch]); saveChapter(ch); }}
            onUpdateChapters={async (chaps) => { setAllChapters(chaps); await saveChapterList(chaps); }}
            onDeleteChapter={(id) => {
              const ch = allChapters.find(c => c.id === id);
              setAllChapters(prev => prev.filter(c => c.id !== id));
              deleteChapter(id, ch ? ch.moduleId : '', ch ? ch.courseId : '');
            }}
            onAddEnrollment={(e) => { setAllEnrollments(prev => [...prev, e]); saveEnrollment(e); }}
            onUpdateEnrollmentStatus={(id, status) => {
              const updated = allEnrollments.map(e => e.id === id ? { ...e, status } : e);
              setAllEnrollments(updated);
              const found = updated.find(e => e.id === id);
              if (found) saveEnrollment(found);
            }}
            onDeleteEnrollment={(id) => { setAllEnrollments(prev => prev.filter(e => e.id !== id)); deleteEnrollment(id); }}
            onAddPreRegistered={(p) => { setPreRegistered(prev => [...prev, p]); savePreRegistered(p); }}
            onSendEmail={handleSendEmail}
            onUpdateUser={handleUpdateUser}
            onPreviewCourse={(c) => navigateTo(`/dashboard/formation/${c.id}`)}
            onAddUser={handleAddUser}
            customPages={allCustomPages}
            onSaveCustomPage={handleSaveCustomPage}
            onDeleteCustomPage={handleDeleteCustomPage}
            onPreviewCustomPage={(page) => setPreviewingCustomPage(page)}
            initialTab="dashboard"
            onTabChange={(tab) => navigateTo(`/trainer/${tab}`)}
          />
        );
      } else if (currentUser?.role === 'admin') {
        return (
          <AdminDashboard
            currentUser={currentUser}
            allUsers={allUsers}
            allCourses={allCourses}
            allEnrollments={allEnrollments}
            allModules={allModules}
            allChapters={allChapters}
            onToggleCourseStatus={(id) => {
              const updated = allCourses.map(c => c.id === id ? { ...c, status: (c.status === 'published' ? 'draft' : 'published') as 'published' | 'draft' } : c);
              setAllCourses(updated);
              const found = updated.find(c => c.id === id);
              if (found) saveCourse(found);
            }}
            onDeleteCourse={(id) => { setAllCourses(prev => prev.filter(c => c.id !== id)); deleteCourse(id); }}
            onUpdateUserStatus={(id, isDeactivated) => {
              const updated = allUsers.map(u => u.id === id ? { ...u, status: (isDeactivated ? 'deactivated' : 'active') as 'active' | 'deactivated' } : u);
              setAllUsers(updated);
              const found = updated.find(u => u.id === id);
              if (found) saveUserProfile(found);
            }}
            onUpdateUserRole={(id, newRole) => {
              const updated = allUsers.map(u => u.id === id ? { ...u, role: newRole } : u);
              setAllUsers(updated);
              const found = updated.find(u => u.id === id);
              if (found) saveUserProfile(found);
              if (currentUser && currentUser.id === id) {
                setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
              }
            }}
            onDeleteUser={(id) => { setAllUsers(prev => prev.filter(u => u.id !== id)); deleteUserProfile(id); }}
            onAddUser={handleAddUser}
            onSendEmail={handleSendEmail}
            onUpdateUser={handleUpdateUser}
            onPreviewCourse={(c) => navigateTo(`/dashboard/formation/${c.id}`)}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            customPages={allCustomPages}
            footerConfig={footerConfig}
            onSaveFooterConfig={handleSaveFooterConfig}
            onSaveCustomPage={handleSaveCustomPage}
            onDeleteCustomPage={handleDeleteCustomPage}
            onPreviewCustomPage={(page) => setPreviewingCustomPage(page)}
            initialTab="stats"
            onTabChange={(tab) => navigateTo(`/admin/${tab}`)}
          />
        );
      } else {
        return (
          <Marketplace
            allCourses={allCourses}
            allModules={allModules}
            allChapters={allChapters}
            allEnrollments={allEnrollments}
            currentUser={null}
            allUsers={allUsers}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onEnrollStudent={handleEnrollStudent}
            onSendEmail={handleSendEmail}
            onSwitchToLogin={() => navigateTo('/connexion')}
            autoOpenSlug={autoOpenCourseSlug}
            onClearAutoOpen={() => setAutoOpenCourseSlug('')}
            onOpenPublicPage={(course) => navigateTo(`/formation/${course.seoSlug || course.id}`)}
          />
        );
      }
    }

    if (pathname === '/marketplace' || pathname === '/catalogue') {
      return (
        <Marketplace
          allCourses={allCourses}
          allModules={allModules}
          allChapters={allChapters}
          allEnrollments={allEnrollments}
          currentUser={currentUser}
          allUsers={allUsers}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onEnrollStudent={handleEnrollStudent}
          onSendEmail={handleSendEmail}
          onSwitchToLogin={() => navigateTo('/connexion')}
          autoOpenSlug={autoOpenCourseSlug}
          onClearAutoOpen={() => setAutoOpenCourseSlug('')}
          onOpenPublicPage={(course) => navigateTo(`/formation/${course.seoSlug || course.id}`)}
        />
      );
    }

    // 5. Student Dashboard Routes (/dashboard/*, /student/*)
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/student')) {
      if (!currentUser) {
        return (
          <div className="text-center py-12 space-y-4 glass p-8 rounded-3xl max-w-md mx-auto border border-white/10">
            <h2 className="text-xl font-bold text-white">Connexion requise</h2>
            <p className="text-xs text-slate-300">Veuillez vous connecter pour accéder à votre espace étudiant.</p>
            <button 
              onClick={() => navigateTo(`/connexion?redirect=${encodeURIComponent(currentPath)}`)}
              className="w-full accent-gradient text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg cursor-pointer"
            >
              Se connecter
            </button>
          </div>
        );
      }

      const playerMatch = pathname.match(/^\/(dashboard|student)\/(formation|cours)\/([^/]+)/i);
      if (playerMatch && playerMatch[3]) {
        const courseId = playerMatch[3];
        const course = allCourses.find(c => c.id.toLowerCase() === courseId.toLowerCase() || c.seoSlug?.toLowerCase() === courseId.toLowerCase());
        if (course) {
          return (
            <CoursePlayer
              course={course}
              modules={allModules.filter(m => m.courseId === course.id)}
              chapters={allChapters.filter(ch => {
                const mod = allModules.find(m => m.id === ch.moduleId);
                return mod?.courseId === course.id;
              })}
              progress={allProgress.find(
                p => p.studentEmail.toLowerCase() === currentUser.email.toLowerCase() && p.courseId === course.id
              ) || null}
              onToggleChapterComplete={handleToggleChapterComplete}
              onBack={() => navigateTo('/dashboard')}
              currentUser={currentUser}
              isEnrolled={
                currentUser.role === 'admin' ||
                currentUser.role === 'trainer' ||
                allEnrollments.some(
                  e => e.studentEmail.toLowerCase() === currentUser.email.toLowerCase() &&
                       e.courseId === course.id &&
                       e.status === 'active'
                )
              }
            />
          );
        } else {
          return <NotFoundPage onNavigate={navigateTo} />;
        }
      }

      if (pathname.endsWith('/mon-profil') || pathname.endsWith('/profil') || pathname.endsWith('/parametres')) {
        return (
          <UserProfile
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
          />
        );
      }

      if (pathname.endsWith('/catalogue') || pathname.endsWith('/marketplace')) {
        return (
          <Marketplace
            allCourses={allCourses}
            allModules={allModules}
            allChapters={allChapters}
            allEnrollments={allEnrollments}
            currentUser={currentUser}
            allUsers={allUsers}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onEnrollStudent={handleEnrollStudent}
            onSendEmail={handleSendEmail}
            onSwitchToLogin={() => navigateTo('/connexion')}
            autoOpenSlug={autoOpenCourseSlug}
            onClearAutoOpen={() => setAutoOpenCourseSlug('')}
            onOpenPublicPage={(course) => navigateTo(`/formation/${course.seoSlug || course.id}`)}
          />
        );
      }

      return (
        <StudentDashboard
          currentUser={currentUser}
          allCourses={allCourses}
          allModules={allModules}
          allChapters={allChapters}
          allEnrollments={allEnrollments}
          allProgress={allProgress}
          onOpenCoursePlayer={(c) => navigateTo(`/dashboard/formation/${c.id}`)}
          onOpenCatalog={() => navigateTo('/marketplace')}
          onOpenPublicPage={(c) => navigateTo(`/formation/${c.seoSlug || c.id}`)}
        />
      );
    }

    // 6. Trainer Dashboard Routes (/trainer/*, /dashboard/formateur/*)
    if (pathname.startsWith('/trainer') || pathname.startsWith('/dashboard/formateur')) {
      if (!currentUser) {
        return (
          <div className="text-center py-12 space-y-4 glass p-8 rounded-3xl max-w-md mx-auto border border-white/10">
            <h2 className="text-xl font-bold text-white">Connexion Formateur requise</h2>
            <p className="text-xs text-slate-300">Veuillez vous connecter avec votre compte Formateur.</p>
            <button 
              onClick={() => navigateTo(`/connexion?redirect=${encodeURIComponent(currentPath)}`)}
              className="w-full accent-gradient text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg cursor-pointer"
            >
              Se connecter
            </button>
          </div>
        );
      }

      if (currentUser.role !== 'trainer' && currentUser.role !== 'assistant' && currentUser.role !== 'admin') {
        return <ForbiddenPage requiredRole="Formateur" onNavigate={navigateTo} />;
      }

      let subTab = 'dashboard';
      if (pathname.includes('/mes-cours') || pathname.includes('/courses') || pathname.includes('/creer-cours')) subTab = 'courses';
      else if (pathname.includes('/etudiants') || pathname.includes('/students')) subTab = 'students';
      else if (pathname.includes('/webhooks')) subTab = 'webhooks';
      else if (pathname.includes('/assistants')) subTab = 'assistants';
      else if (pathname.includes('/custom-pages') || pathname.includes('/pages')) subTab = 'custom-pages';
      else if (pathname.includes('/emails')) subTab = 'emails';
      else if (pathname.includes('/parametres') || pathname.includes('/profil') || pathname.includes('/profile')) subTab = 'profile';

      return (
        <TrainerDashboard
          currentUser={currentUser}
          allUsers={allUsers}
          allCourses={allCourses}
          allModules={allModules}
          allChapters={allChapters}
          allEnrollments={allEnrollments}
          allProgress={allProgress}
          preRegistered={preRegistered}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddCourse={(newCourse) => {
            setAllCourses(prev => [...prev, newCourse]);
            saveCourse(newCourse);
          }}
          onUpdateCourse={(updatedCourse) => {
            setAllCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
            saveCourse(updatedCourse);
          }}
          onDeleteCourse={(courseId) => {
            setAllCourses(prev => prev.filter(c => c.id !== courseId));
            deleteCourse(courseId);
          }}
          onAddModule={(newMod) => {
            setAllModules(prev => [...prev, newMod]);
            saveModule(newMod);
          }}
          onUpdateModules={async (updatedMods) => {
            const updatedModIds = new Set(updatedMods.map(m => m.id));
            setAllModules(prev => [
              ...prev.filter(m => !updatedModIds.has(m.id)),
              ...updatedMods
            ]);
            await saveModuleList(updatedMods);
          }}
          onDeleteModule={(moduleId) => {
            const mod = allModules.find(m => m.id === moduleId);
            setAllModules(prev => prev.filter(m => m.id !== moduleId));
            deleteModule(moduleId, mod ? mod.courseId : '');
          }}
          onAddChapter={(newCh) => {
            setAllChapters(prev => [...prev, newCh]);
            saveChapter(newCh);
          }}
          onUpdateChapters={async (updatedChaps) => {
            setAllChapters(updatedChaps);
            await saveChapterList(updatedChaps);
          }}
          onDeleteChapter={(chapterId) => {
            const ch = allChapters.find(c => c.id === chapterId);
            setAllChapters(prev => prev.filter(c => c.id !== chapterId));
            deleteChapter(chapterId, ch ? ch.moduleId : '', ch ? ch.courseId : '');
          }}
          onAddEnrollment={(newEnroll) => {
            setAllEnrollments(prev => [...prev, newEnroll]);
            saveEnrollment(newEnroll);
          }}
          onUpdateEnrollmentStatus={(enrollmentId, status) => {
            const updated = allEnrollments.map(e => e.id === enrollmentId ? { ...e, status } : e);
            setAllEnrollments(updated);
            const found = updated.find(e => e.id === enrollmentId);
            if (found) saveEnrollment(found);
          }}
          onDeleteEnrollment={(enrollmentId) => {
            setAllEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            deleteEnrollment(enrollmentId);
          }}
          onAddPreRegistered={(newPre) => {
            setPreRegistered(prev => [...prev, newPre]);
            savePreRegistered(newPre);
          }}
          onSendEmail={handleSendEmail}
          onUpdateUser={handleUpdateUser}
          onPreviewCourse={(c) => navigateTo(`/dashboard/formation/${c.id}`)}
          onAddUser={handleAddUser}
          customPages={allCustomPages}
          onSaveCustomPage={handleSaveCustomPage}
          onDeleteCustomPage={handleDeleteCustomPage}
          onPreviewCustomPage={(page) => setPreviewingCustomPage(page)}
          initialTab={subTab}
          onTabChange={(tab) => navigateTo(`/trainer/${tab}`)}
        />
      );
    }

    // 7. Admin Dashboard Routes (/admin/*, /dashboard/admin/*)
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) {
      if (!currentUser) {
        return (
          <div className="text-center py-12 space-y-4 glass p-8 rounded-3xl max-w-md mx-auto border border-white/10">
            <h2 className="text-xl font-bold text-white">Connexion Administrateur requise</h2>
            <p className="text-xs text-slate-300">Veuillez vous connecter avec votre compte Administrateur.</p>
            <button 
              onClick={() => navigateTo(`/connexion?redirect=${encodeURIComponent(currentPath)}`)}
              className="w-full accent-gradient text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg cursor-pointer"
            >
              Se connecter
            </button>
          </div>
        );
      }

      if (currentUser.role !== 'admin') {
        return <ForbiddenPage requiredRole="Administrateur" onNavigate={navigateTo} />;
      }

      let subTab = 'stats';
      if (pathname.includes('/utilisateurs') || pathname.includes('/users')) subTab = 'users';
      else if (pathname.includes('/trainers') || pathname.includes('/formateurs')) subTab = 'trainers';
      else if (pathname.includes('/formations') || pathname.includes('/courses')) subTab = 'courses';
      else if (pathname.includes('/students') || pathname.includes('/etudiants')) subTab = 'students';
      else if (pathname.includes('/custom-pages') || pathname.includes('/pages')) subTab = 'custom-pages';
      else if (pathname.includes('/emails') || pathname.includes('/smtp')) subTab = 'emails';
      else if (pathname.includes('/webhooks')) subTab = 'webhooks';
      else if (pathname.includes('/parametres') || pathname.includes('/settings') || pathname.includes('/profil')) subTab = 'settings';

      return (
        <AdminDashboard
          currentUser={currentUser}
          allUsers={allUsers}
          allCourses={allCourses}
          allEnrollments={allEnrollments}
          allModules={allModules}
          allChapters={allChapters}
          onToggleCourseStatus={(courseId) => {
            const updated = allCourses.map(c => c.id === courseId ? { ...c, status: (c.status === 'published' ? 'draft' : 'published') as 'published' | 'draft' } : c);
            setAllCourses(updated);
            const found = updated.find(c => c.id === courseId);
            if (found) saveCourse(found);
          }}
          onDeleteCourse={(courseId) => {
            setAllCourses(prev => prev.filter(c => c.id !== courseId));
            deleteCourse(courseId);
          }}
          onUpdateUserStatus={(userId, isDeactivated) => {
            const updated = allUsers.map(u => u.id === userId ? { ...u, status: (isDeactivated ? 'deactivated' : 'active') as 'active' | 'deactivated' } : u);
            setAllUsers(updated);
            const found = updated.find(u => u.id === userId);
            if (found) saveUserProfile(found);
          }}
          onUpdateUserRole={(userId, newRole) => {
            const updated = allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u);
            setAllUsers(updated);
            const found = updated.find(u => u.id === userId);
            if (found) saveUserProfile(found);
            if (currentUser && currentUser.id === userId) {
              setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
            }
          }}
          onDeleteUser={(userId) => {
            setAllUsers(prev => prev.filter(u => u.id !== userId));
            deleteUserProfile(userId);
          }}
          onAddUser={handleAddUser}
          onSendEmail={handleSendEmail}
          onUpdateUser={handleUpdateUser}
          onPreviewCourse={(c) => navigateTo(`/dashboard/formation/${c.id}`)}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          customPages={allCustomPages}
          footerConfig={footerConfig}
          onSaveFooterConfig={handleSaveFooterConfig}
          onSaveCustomPage={handleSaveCustomPage}
          onDeleteCustomPage={handleDeleteCustomPage}
          onPreviewCustomPage={(page) => setPreviewingCustomPage(page)}
          initialTab={subTab}
          onTabChange={(tab) => navigateTo(`/admin/${tab}`)}
        />
      );
    }

    // 8. 404 - Page Introuvable Catch-all
    return <NotFoundPage onNavigate={navigateTo} />;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#161a20] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400 font-medium">Chargement de votre session...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen mesh-bg font-sans antialiased pb-20 ${currentTheme}`}>
      
      {/* Dynamic Header Wrapper */}
      <header className="glass-light border-b border-white/10 sticky top-0 z-30 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            {/* Hamburger Menu on Mobile */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer mr-1"
              title="Ouvrir le menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            {/* Logo / Brand */}
            <button 
              onClick={() => navigateTo('/')}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="accent-gradient text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black theme-brand-text tracking-tight text-base">Dekel.<span className="theme-brand-logo font-bold">Formation</span></span>
                <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase">Édition Formateurs</p>
              </div>
            </button>
          </div>

          {/* Navigation link items */}
          <nav className="flex items-center gap-1.5 md:gap-4">
            {/* If Student */}
            {currentUser?.role === 'student' && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigateTo('/dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath.startsWith('/dashboard') && !currentPath.includes('catalogue') && !currentPath.includes('profil') ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  <span>Mon Espace</span>
                </button>
                <button
                  onClick={() => navigateTo('/marketplace')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath === '/marketplace' || currentPath === '/catalogue' ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Catalogue cours</span>
                </button>
                <button
                  onClick={() => navigateTo('/dashboard/mon-profil')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath.includes('profil') ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Mon Profil</span>
                </button>
              </div>
            )}

            {/* If Trainer / Assistant */}
            {(currentUser?.role === 'trainer' || currentUser?.role === 'assistant') && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigateTo('/trainer')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath.startsWith('/trainer') ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  <span>Espace Formateur</span>
                </button>
                <button
                  onClick={() => navigateTo('/marketplace')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath === '/marketplace' ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Catalogue public</span>
                </button>
              </div>
            )}

            {/* If Admin */}
            {currentUser?.role === 'admin' && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigateTo('/admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath.startsWith('/admin') ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  <span>Administration</span>
                </button>
                <button
                  onClick={() => navigateTo('/marketplace')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath === '/marketplace' ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Catalogue public</span>
                </button>
              </div>
            )}

            {/* If Visitor (no session) */}
            {!currentUser && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigateTo('/marketplace')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentPath === '/marketplace' || currentPath === '/' ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Catalogue
                </button>
                <button
                  onClick={() => navigateTo('/connexion')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPath === '/connexion' ? 'accent-gradient text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              </div>
            )}

            {/* Notification Bell & Logout actions */}
            {currentUser && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                <NotificationBell 
                  currentUser={currentUser} 
                  onOpenCourse={(courseId) => navigateTo(`/dashboard/formation/${courseId}`)}
                />
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
                  <span className="text-[9px] bg-white/10 text-slate-300 font-bold px-1.5 py-0.5 rounded-full capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </nav>
        </div>

      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-8">
        {renderCurrentRoute()}
      </main>

      {/* Public Footer (Hidden on Student, Trainer, Admin & Course Player Dashboards) */}
      {!['/dashboard', '/student', '/trainer', '/admin', '/learn'].some(prefix => {
        const p = currentPath.split('?')[0].split('#')[0].toLowerCase();
        return p.startsWith(prefix);
      }) && (
        <Footer config={footerConfig} onNavigate={navigateTo} />
      )}

      {/* Mobile Offcanvas Sidebar Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          
          {/* Sidebar content panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white text-slate-800 border-r border-slate-200 p-5 shadow-2xl flex flex-col justify-between animate-slide-in">
            <div className="space-y-6">
              {/* Top Row: User info / Brand & Close */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={currentUser.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png'} 
                      alt={currentUser.name} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{currentUser.name}</p>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full capitalize">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="accent-gradient text-white p-1.5 rounded-lg">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Dekel.Formation</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase">Menu Visiteur</p>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links list */}
              <div className="space-y-1">
                {/* VISITOR NAVIGATION */}
                {!currentUser && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
                    <button
                      onClick={() => { navigateTo('/marketplace'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath === '/marketplace' || currentPath === '/' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Catalogue</span>
                    </button>
                    <button
                      onClick={() => { navigateTo('/connexion'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath === '/connexion' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Se connecter</span>
                    </button>
                    <button
                      onClick={() => { navigateTo('/mot-de-passe-oublie'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath === '/mot-de-passe-oublie' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Mot de passe oublié</span>
                    </button>
                  </>
                )}

                {/* STUDENT NAVIGATION */}
                {currentUser?.role === 'student' && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Espace Étudiant</p>
                    <button
                      onClick={() => { navigateTo('/dashboard'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath === '/dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                      <span>Mon Espace</span>
                    </button>
                    <button
                      onClick={() => { navigateTo('/marketplace'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath === '/marketplace' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      <span>Catalogue cours</span>
                    </button>
                    <button
                      onClick={() => { navigateTo('/dashboard/mon-profil'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath.includes('profil') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Mon Profil</span>
                    </button>
                  </>
                )}

                {/* TRAINER NAVIGATION */}
                {(currentUser?.role === 'trainer' || currentUser?.role === 'assistant') && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Espace Formateur</p>
                    <button
                      onClick={() => { navigateTo('/trainer'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath.startsWith('/trainer') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                      <span>Tableau de bord</span>
                    </button>
                  </>
                )}
                
                {/* ADMIN NAVIGATION */}
                {currentUser?.role === 'admin' && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Espace Administrateur</p>
                    <button
                      onClick={() => { navigateTo('/admin'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentPath.startsWith('/admin') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                      <span>Administration</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Logout/Footer section */}
            <div className="border-t border-slate-100 pt-4">
              {currentUser ? (
                <button
                  onClick={() => { handleLogout(); setIsMobileDrawerOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              ) : (
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-medium">Dekel.Formation • App</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications container */}
      <ToastContainer />
      <GlobalOverflowPopover />

    </div>
  );
}
