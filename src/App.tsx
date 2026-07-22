import { useState, useEffect } from 'react';
import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent } from './types';
import { 
  INITIAL_USERS, INITIAL_COURSES, INITIAL_MODULES, INITIAL_CHAPTERS, 
  INITIAL_ENROLLMENTS, INITIAL_PROGRESS, INITIAL_EMAILS, INITIAL_PRE_REGISTERED 
} from './mockData';

// Modular Components
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import StudentDashboard from './components/StudentDashboard';
import CoursePlayer from './components/CoursePlayer';
import Marketplace from './components/Marketplace';
import NotificationLog from './components/NotificationLog';
import UserProfile from './components/UserProfile';
import { ToastContainer, showToast } from './components/Toast';

// Icons
import { BookOpen, LogOut, Layout, Star, LogIn, Plus, Palette, Check, Menu, X, User as UserIcon } from 'lucide-react';

// Firebase
import { onSnapshot, collection, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  seedDatabaseIfEmpty, saveUserProfile, deleteUserProfile, saveCourse, deleteCourse, 
  saveModule, saveModuleList, deleteModule, saveChapter, saveChapterList, 
  deleteChapter, saveEnrollment, deleteEnrollment, saveStudentProgress, 
  saveSimulatedEmail, clearSimulatedEmails, savePreRegistered, deletePreRegistered 
} from './firebaseService';

export default function App() {
  // --- Persistent State Handlers (localStorage/Firestore cached fallback) ---
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sio_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [allCourses, setAllCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('sio_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [allModules, setAllModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('sio_modules');
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
  });

  const [allChapters, setAllChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('sio_chapters');
    return saved ? JSON.parse(saved) : INITIAL_CHAPTERS;
  });

  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>(() => {
    const saved = localStorage.getItem('sio_enrollments');
    return saved ? JSON.parse(saved) : INITIAL_ENROLLMENTS;
  });

  const [allProgress, setAllProgress] = useState<StudentProgress[]>(() => {
    const saved = localStorage.getItem('sio_progress');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  const [emails, setEmails] = useState<SimulatedEmail[]>(() => {
    const saved = localStorage.getItem('sio_emails');
    return saved ? JSON.parse(saved) : INITIAL_EMAILS;
  });

  const [preRegistered, setPreRegistered] = useState<PreRegisteredStudent[]>(() => {
    const saved = localStorage.getItem('sio_preregistered');
    return saved ? JSON.parse(saved) : INITIAL_PRE_REGISTERED;
  });

  // Active session and view management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeCoursePlayer, setActiveCoursePlayer] = useState<Course | null>(null);
  const [visitorTab, setVisitorTab] = useState<'catalog' | 'auth'>('catalog');
  const [studentTab, setStudentTab] = useState<'my-space' | 'catalog' | 'profile'>('my-space');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [autoOpenCourseSlug, setAutoOpenCourseSlug] = useState('');

  // Dynamic SEO URL Router & Meta Tags Injector (Requirement 26)
  useEffect(() => {
    if (allCourses.length === 0) return;

    const checkUrlForSeoRoute = () => {
      let slug = '';
      
      // 1. Pathname check (e.g. /marketplace/my-course)
      const pathParts = window.location.pathname.split('/');
      const mIdx = pathParts.indexOf('marketplace');
      if (mIdx !== -1 && pathParts[mIdx + 1]) {
        slug = pathParts[mIdx + 1];
      }

      // 2. Query parameters fallback (?course=slug, ?f=slug, ?slug=slug)
      if (!slug) {
        const params = new URLSearchParams(window.location.search);
        slug = params.get('course') || params.get('f') || params.get('slug') || '';
      }

      // 3. Hash fallback (e.g. #/marketplace/slug or #slug)
      if (!slug && window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        const hashParts = hash.split('/');
        const hIdx = hashParts.indexOf('marketplace');
        if (hIdx !== -1 && hashParts[hIdx + 1]) {
          slug = hashParts[hIdx + 1];
        } else if (hash && !hash.includes('/')) {
          slug = hash;
        }
      }

      if (slug) {
        const matchedCourse = allCourses.find(c => c.seoSlug === slug || c.id === slug);
        if (matchedCourse) {
          // Open Marketplace catalog tab
          if (currentUser) {
            setStudentTab('catalog');
          } else {
            setVisitorTab('catalog');
          }

          // Inject custom Meta Title
          document.title = matchedCourse.seoTitle || matchedCourse.title;

          // Inject custom Meta Description
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', matchedCourse.seoDescription || matchedCourse.description);

          // Inject Open Graph tags
          const ogProps = {
            'og:title': matchedCourse.seoTitle || matchedCourse.title,
            'og:description': matchedCourse.seoDescription || matchedCourse.description,
            'og:image': matchedCourse.seoShareImage || matchedCourse.coverImage || '',
            'og:url': window.location.href,
            'og:type': 'video.movie'
          };

          Object.entries(ogProps).forEach(([prop, val]) => {
            let metaTag = document.querySelector(`meta[property="${prop}"]`);
            if (!metaTag) {
              metaTag = document.createElement('meta');
              metaTag.setAttribute('property', prop);
              document.head.appendChild(metaTag);
            }
            if (val) {
              metaTag.setAttribute('content', val);
            }
          });

          // Set state to auto-open details in the Marketplace
          setAutoOpenCourseSlug(slug);
        }
      }
    };

    checkUrlForSeoRoute();

    window.addEventListener('popstate', checkUrlForSeoRoute);
    window.addEventListener('hashchange', checkUrlForSeoRoute);
    return () => {
      window.removeEventListener('popstate', checkUrlForSeoRoute);
      window.removeEventListener('hashchange', checkUrlForSeoRoute);
    };
  }, [allCourses, currentUser]);

  // Dynamic theme management
  const [currentTheme, setCurrentTheme] = useState<'theme-cosmic' | 'theme-slate' | 'theme-sage' | 'theme-nature' | 'theme-nature-dark'>(() => {
    const saved = localStorage.getItem('sio_theme');
    return (saved as any) || 'theme-nature-dark'; // Nature Dark is default
  });

  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Sync theme when user object loads or updates
  useEffect(() => {
    if (currentUser?.theme) {
      setCurrentTheme(currentUser.theme as any);
      localStorage.setItem('sio_theme', currentUser.theme);
    }
  }, [currentUser?.theme]);

  const handleThemeChange = async (themeClass: 'theme-cosmic' | 'theme-slate' | 'theme-sage' | 'theme-nature' | 'theme-nature-dark') => {
    setCurrentTheme(themeClass);
    localStorage.setItem('sio_theme', themeClass);
    if (currentUser) {
      const updatedUser = { ...currentUser, theme: themeClass };
      setCurrentUser(updatedUser);
      await saveUserProfile(updatedUser);
    }
    showToast('Thème mis à jour !', 'success');
  };

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
              avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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
        setAuthLoading(false);
      }
    });
    return () => unsubscribeAuth();
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

            // 3. Send out Simulated Email confirmation
            const courseObj = allCourses.find(c => c.id === courseId);
            const courseTitle = courseObj ? courseObj.title : 'votre formation';

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
    setStudentTab('my-space');

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
    setVisitorTab('catalog');
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

  const handleEnrollStudent = async (email: string, courseId: string) => {
    const emailTrimmed = email.trim().toLowerCase();
    
    const newEnroll: Enrollment = {
      id: `e-${Date.now()}`,
      studentEmail: emailTrimmed,
      courseId,
      status: 'active',
      enrolledAt: new Date().toISOString()
    };
    setAllEnrollments(prev => [...prev, newEnroll]);
    await saveEnrollment(newEnroll);

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
        lastAccessedAt: now
      };
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400 font-medium">Chargement de votre session...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen mesh-bg font-sans antialiased pb-20 ${currentTheme}`}>
      
      {/* Dynamic Header Wrapper (Section 5) */}
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
              onClick={() => {
                setActiveCoursePlayer(null);
                if (currentUser?.role === 'student') setStudentTab('my-space');
              }}
              className="flex items-center gap-2 text-left group"
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
            {currentUser?.role === 'student' && !activeCoursePlayer && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setStudentTab('my-space')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    studentTab === 'my-space' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  <span>Mon Espace</span>
                </button>
                <button
                  onClick={() => setStudentTab('catalog')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    studentTab === 'catalog' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Catalogue cours</span>
                </button>
                <button
                  onClick={() => setStudentTab('profile')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    studentTab === 'profile' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Mon Profil</span>
                </button>
              </div>
            )}

            {/* If Visitor (no session) */}
            {!currentUser && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setVisitorTab('catalog')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    visitorTab === 'catalog' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Catalogue
                </button>
                <button
                  onClick={() => setVisitorTab('auth')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    visitorTab === 'auth' ? 'accent-gradient text-white shadow-lg' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              </div>
            )}

            {/* Global Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer theme-header-text"
                title="Changer le thème de l'application"
              >
                <Palette className="w-4 h-4 theme-brand-logo" />
                <span className="hidden sm:inline">Thème</span>
              </button>
              
              {showThemeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-white/10 rounded-2xl p-2.5 shadow-xl z-50 backdrop-blur-md animate-fade-in space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-white/5">
                      Choisir un thème
                    </p>
                    
                    <button
                      onClick={() => { handleThemeChange('theme-cosmic'); setShowThemeDropdown(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                        currentTheme === 'theme-cosmic' ? 'bg-white/10 text-indigo-400' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
                        <span>Aura Cosmique (Sombre)</span>
                      </div>
                      {currentTheme === 'theme-cosmic' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>

                    <button
                      onClick={() => { handleThemeChange('theme-slate'); setShowThemeDropdown(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                        currentTheme === 'theme-slate' ? 'bg-white/10 text-indigo-600 dark:text-white font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm shadow-slate-400/50"></span>
                        <span>Ardoise (Clair Moderne)</span>
                      </div>
                      {currentTheme === 'theme-slate' && <Check className="w-3.5 h-3.5 text-slate-500" />}
                    </button>

                    <button
                      onClick={() => { handleThemeChange('theme-sage'); setShowThemeDropdown(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                        currentTheme === 'theme-sage' ? 'bg-white/10 text-emerald-600 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#749c85] shadow-sm shadow-[#749c85]/50"></span>
                        <span>Sauge Chaleureuse</span>
                      </div>
                      {currentTheme === 'theme-sage' && <Check className="w-3.5 h-3.5 text-[#749c85]" />}
                    </button>

                    <button
                      onClick={() => { handleThemeChange('theme-nature'); setShowThemeDropdown(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                        currentTheme === 'theme-nature' ? 'bg-white/10 text-emerald-500 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#1DB954] shadow-sm shadow-[#1DB954]/50"></span>
                        <span>Nature (Style Spotify)</span>
                      </div>
                      {currentTheme === 'theme-nature' && <Check className="w-3.5 h-3.5 text-[#1DB954]" />}
                    </button>

                    <button
                      onClick={() => { handleThemeChange('theme-nature-dark'); setShowThemeDropdown(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                        currentTheme === 'theme-nature-dark' ? 'bg-white/10 text-emerald-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#1ED760] shadow-sm shadow-[#1ED760]/50 animate-pulse"></span>
                        <span>Nature Dark (Premium)</span>
                      </div>
                      {currentTheme === 'theme-nature-dark' && <Check className="w-3.5 h-3.5 text-[#1ED760]" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Logout actions */}
            {currentUser && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
                  <span className="text-[9px] bg-white/10 text-slate-300 font-bold px-1.5 py-0.5 rounded-full capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
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
        
        {/* Course Player (Active Room) takes full viewport */}
        {activeCoursePlayer ? (
          <CoursePlayer
            course={activeCoursePlayer}
            modules={allModules.filter(m => m.courseId === activeCoursePlayer.id)}
            chapters={allChapters.filter(ch => {
              const mod = allModules.find(m => m.id === ch.moduleId);
              return mod?.courseId === activeCoursePlayer.id;
            })}
            progress={allProgress.find(
              p => p.studentEmail.toLowerCase() === currentUser?.email.toLowerCase() && p.courseId === activeCoursePlayer.id
            ) || null}
            onToggleChapterComplete={handleToggleChapterComplete}
            onBack={() => setActiveCoursePlayer(null)}
            currentUser={currentUser}
            isEnrolled={
              currentUser?.role === 'admin' ||
              currentUser?.role === 'trainer' ||
              (currentUser ? allEnrollments.some(
                e => e.studentEmail.toLowerCase() === currentUser.email.toLowerCase() &&
                     e.courseId === activeCoursePlayer.id &&
                     e.status === 'active'
              ) : false)
            }
          />
        ) : (
          <>
            {/* 1. VISITOR VIEW (Unauthenticated) */}
            {!currentUser && (
              <div className="space-y-6">
                {visitorTab === 'catalog' ? (
                  <Marketplace
                    allCourses={allCourses}
                    allModules={allModules}
                    allChapters={allChapters}
                    allEnrollments={allEnrollments}
                    currentUser={null}
                    onEnrollStudent={handleEnrollStudent}
                    onSendEmail={handleSendEmail}
                    onSwitchToLogin={() => setVisitorTab('auth')}
                    autoOpenSlug={autoOpenCourseSlug}
                    onClearAutoOpen={() => setAutoOpenCourseSlug('')}
                  />
                ) : (
                  <Auth
                    allUsers={allUsers}
                    onLogin={handleLogin}
                    onAddUser={handleAddUser}
                    onSendEmail={handleSendEmail}
                  />
                )}
              </div>
            )}

            {/* 2. ADMINISTRATOR VIEW */}
            {currentUser?.role === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                allUsers={allUsers}
                allCourses={allCourses}
                allEnrollments={allEnrollments}
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
                onUpdateUser={(updatedUser) => {
                  setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                  if (currentUser?.id === updatedUser.id) {
                    setCurrentUser(updatedUser);
                  }
                  saveUserProfile(updatedUser);
                }}
                onPreviewCourse={setActiveCoursePlayer}
              />
            )}

            {/* 3. TRAINER VIEW */}
            {(currentUser?.role === 'trainer' || currentUser?.role === 'assistant') && (
              <TrainerDashboard
                currentUser={currentUser}
                allUsers={allUsers}
                allCourses={allCourses}
                allModules={allModules}
                allChapters={allChapters}
                allEnrollments={allEnrollments}
                allProgress={allProgress}
                preRegistered={preRegistered}
                
                // State changers
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
                  const courseId = mod ? mod.courseId : '';
                  setAllModules(prev => prev.filter(m => m.id !== moduleId));
                  deleteModule(moduleId, courseId);
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
                  const moduleId = ch ? ch.moduleId : '';
                  const courseId = ch ? ch.courseId : '';
                  setAllChapters(prev => prev.filter(ch => ch.id !== chapterId));
                  deleteChapter(chapterId, moduleId, courseId);
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
                onUpdateUser={(updatedUser) => {
                  setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                  setCurrentUser(updatedUser);
                  saveUserProfile(updatedUser);
                }}
                onPreviewCourse={setActiveCoursePlayer}
                onAddUser={handleAddUser}
              />
            )}

            {/* 4. STUDENT VIEW */}
            {currentUser?.role === 'student' && (
              <div className="space-y-6 animate-fade-in">
                {studentTab === 'my-space' ? (
                  <StudentDashboard
                    currentUser={currentUser}
                    allCourses={allCourses}
                    allModules={allModules}
                    allChapters={allChapters}
                    allEnrollments={allEnrollments}
                    allProgress={allProgress}
                    onOpenCoursePlayer={(course) => setActiveCoursePlayer(course)}
                    onOpenCatalog={() => setStudentTab('catalog')}
                  />
                ) : studentTab === 'profile' ? (
                  <UserProfile
                    currentUser={currentUser}
                    onUpdateUser={(updatedUser) => {
                      setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                      setCurrentUser(updatedUser);
                      saveUserProfile(updatedUser);
                    }}
                  />
                ) : (
                  <Marketplace
                    allCourses={allCourses}
                    allModules={allModules}
                    allChapters={allChapters}
                    allEnrollments={allEnrollments}
                    currentUser={currentUser}
                    onEnrollStudent={handleEnrollStudent}
                    onSendEmail={handleSendEmail}
                    onSwitchToLogin={() => setStudentTab('my-space')}
                    autoOpenSlug={autoOpenCourseSlug}
                    onClearAutoOpen={() => setAutoOpenCourseSlug('')}
                  />
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* Persistent SMTP mail simulator helper (Section 16) */}
      <NotificationLog
        emails={emails}
        onClear={handleClearEmails}
      />

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
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
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
                {/* 1. VISITOR NAVIGATION */}
                {!currentUser && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
                    <button
                      onClick={() => { setVisitorTab('catalog'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        visitorTab === 'catalog' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Catalogue</span>
                    </button>
                    <button
                      onClick={() => { setVisitorTab('auth'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        visitorTab === 'auth' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Se connecter</span>
                    </button>
                  </>
                )}

                {/* 2. STUDENT NAVIGATION */}
                {currentUser?.role === 'student' && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Espace Étudiant</p>
                    <button
                      onClick={() => { setStudentTab('my-space'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        studentTab === 'my-space' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                      <span>Mon Espace</span>
                    </button>
                    <button
                      onClick={() => { setStudentTab('catalog'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        studentTab === 'catalog' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      <span>Catalogue cours</span>
                    </button>
                    <button
                      onClick={() => { setStudentTab('profile'); setIsMobileDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        studentTab === 'profile' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Mon Profil</span>
                    </button>
                  </>
                )}

                {/* 3. TRAINER NAVIGATION */}
                {currentUser?.role === 'trainer' && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Espace Formateur</p>
                    <p className="text-[11px] text-slate-500 px-2 leading-relaxed pb-3">Utilisez le bouton menu (☰) sur le tableau de bord de votre formateur pour basculer facilement d'onglet.</p>
                  </>
                )}
                
                {/* 4. ADMIN NAVIGATION */}
                {currentUser?.role === 'admin' && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Espace Administrateur</p>
                    <p className="text-[11px] text-slate-500 px-2 leading-relaxed pb-3">Utilisez le bouton menu (☰) sur le tableau de bord administrateur pour gérer les différents onglets.</p>
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

    </div>
  );
}
