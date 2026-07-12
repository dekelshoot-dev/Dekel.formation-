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
import RoleSwitcher from './components/RoleSwitcher';
import NotificationLog from './components/NotificationLog';

// Icons
import { BookOpen, LogOut, Layout, Star, LogIn, Plus } from 'lucide-react';

export default function App() {
  // --- Persistent State Handlers (localStorage) ---
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sio_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[3]; // Default logged in as Sophie (student) for direct play!
  });

  const [activeCoursePlayer, setActiveCoursePlayer] = useState<Course | null>(null);
  const [visitorTab, setVisitorTab] = useState<'catalog' | 'auth'>('catalog');
  const [studentTab, setStudentTab] = useState<'my-space' | 'catalog'>('my-space');

  // Trigger state persistence on updates
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

  // Webhook Background Synchronizer (Requirement 2)
  useEffect(() => {
    let active = true;

    const syncWebhooks = async () => {
      try {
        const res = await fetch('/api/sync-enrollments');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && Array.isArray(data.enrollments) && data.enrollments.length > 0) {
          data.enrollments.forEach((record: any) => {
            const courseId = record.courseId;
            const studentEmail = record.studentEmail.toLowerCase();
            
            // 1. Grant student enrollment
            setAllEnrollments(prev => {
              const alreadyHas = prev.some(e => e.studentEmail.toLowerCase() === studentEmail && e.courseId === courseId && e.status === 'active');
              if (alreadyHas) return prev;
              return [
                ...prev,
                {
                  id: `e-wh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  studentEmail,
                  courseId,
                  status: 'active',
                  enrolledAt: record.enrolledAt || new Date().toISOString()
                }
              ];
            });

            // 2. Register/activate student account automatically
            setAllUsers(prev => {
              const userExists = prev.some(u => u.email.toLowerCase() === studentEmail);
              if (userExists) return prev;
              
              // If user does not exist, pre-register them
              setPreRegistered(pr => {
                const preExists = pr.find(p => p.email.toLowerCase() === studentEmail);
                if (preExists) {
                  if (!preExists.courseIds.includes(courseId)) {
                    return pr.map(p => p.email.toLowerCase() === studentEmail ? { ...p, courseIds: [...p.courseIds, courseId] } : p);
                  }
                  return pr;
                } else {
                  return [...pr, { email: studentEmail, courseIds: [courseId] }];
                }
              });

              return prev;
            });

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
            
            // Append simulated email logs
            setEmails(prev => {
              const emailAlreadyLogged = prev.some(em => em.to === studentEmail && em.subject === autoWebhookEmail.subject);
              if (emailAlreadyLogged) return prev;
              return [...prev, autoWebhookEmail];
            });
          });
        }
      } catch (err) {
        // Silent error during polling
      }
    };

    // Poll every 3.5 seconds
    const interval = setInterval(() => {
      if (active) syncWebhooks();
    }, 3500);

    // Run once immediately
    syncWebhooks();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [allCourses]);

  // --- Helper Action Dispatchers ---

  // Log emails simulation helper
  const handleSendEmail = (email: SimulatedEmail) => {
    setEmails(prev => [...prev, email]);
  };

  const handleClearEmails = () => {
    setEmails([]);
  };

  // Auth logins
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveCoursePlayer(null);
    setStudentTab('my-space');

    // Case 2 Activation: If new login email has pending pre-registered courses, activate them!
    const preRegMatch = preRegistered.find(p => p.email.toLowerCase() === user.email.toLowerCase());
    if (preRegMatch && user.role === 'student') {
      // Create enrollments for all pre-registered courses that don't exist
      const newEnrollmentsToCreate: Enrollment[] = [];
      
      preRegMatch.courseIds.forEach(cId => {
        const alreadyHas = allEnrollments.some(
          en => en.studentEmail.toLowerCase() === user.email.toLowerCase() && en.courseId === cId
        );
        if (!alreadyHas) {
          newEnrollmentsToCreate.push({
            id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentEmail: user.email.toLowerCase(),
            courseId: cId,
            status: 'active',
            enrolledAt: new Date().toISOString()
          });
        }
      });

      if (newEnrollmentsToCreate.length > 0) {
        setAllEnrollments(prev => [...prev, ...newEnrollmentsToCreate]);
        // Remove from pre-registration list
        setPreRegistered(prev => prev.filter(p => p.email.toLowerCase() !== user.email.toLowerCase()));

        // Log notification of auto activation
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
        handleSendEmail(autoActiveEmail);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCoursePlayer(null);
    setVisitorTab('catalog');
  };

  const handleAddUser = (user: User) => {
    setAllUsers(prev => [...prev, user]);
  };

  // Student manual enrollment (or simulation payment proof checkout)
  const handleEnrollStudent = (email: string, courseId: string) => {
    const emailTrimmed = email.trim().toLowerCase();
    
    // Create direct enrollment
    const newEnroll: Enrollment = {
      id: `e-${Date.now()}`,
      studentEmail: emailTrimmed,
      courseId,
      status: 'active',
      enrolledAt: new Date().toISOString()
    };
    setAllEnrollments(prev => [...prev, newEnroll]);

    // Check if user exists
    const userExists = allUsers.some(u => u.email.toLowerCase() === emailTrimmed);
    if (!userExists) {
      // Add to pre-registration queue
      setPreRegistered(prev => {
        const existing = prev.find(p => p.email.toLowerCase() === emailTrimmed);
        if (existing) {
          if (!existing.courseIds.includes(courseId)) {
            return prev.map(p => p.email.toLowerCase() === emailTrimmed ? { ...p, courseIds: [...p.courseIds, courseId] } : p);
          }
          return prev;
        } else {
          return [...prev, { email: emailTrimmed, courseIds: [courseId] }];
        }
      });
    }
  };

  // Student progress updating inside lessons player (Section 14)
  const handleToggleChapterComplete = (chapterId: string) => {
    if (!currentUser || !activeCoursePlayer) return;

    setAllProgress(prev => {
      const existingIdx = prev.findIndex(
        p => p.studentEmail.toLowerCase() === currentUser.email.toLowerCase() && p.courseId === activeCoursePlayer.id
      );

      const now = new Date().toISOString();

      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const isCompleted = existing.completedChapterIds.includes(chapterId);
        
        let newIds = [];
        if (isCompleted) {
          // Remove
          newIds = existing.completedChapterIds.filter(id => id !== chapterId);
        } else {
          // Add
          newIds = [...existing.completedChapterIds, chapterId];
        }

        const updated = {
          ...existing,
          completedChapterIds: newIds,
          lastAccessedAt: now
        };

        const copy = [...prev];
        copy[existingIdx] = updated;
        return copy;
      } else {
        // Create brand new
        return [...prev, {
          studentEmail: currentUser.email.toLowerCase(),
          courseId: activeCoursePlayer.id,
          completedChapterIds: [chapterId],
          lastAccessedAt: now
        }];
      }
    });
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-200 font-sans antialiased pb-20">
      
      {/* Dynamic Header Wrapper (Section 5) */}
      <header className="glass-light border-b border-white/10 sticky top-0 z-30 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          
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
              <span className="font-black text-white tracking-tight text-base">Dekel.<span className="text-indigo-400 font-bold">Formation</span></span>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase">Édition Formateurs</p>
            </div>
          </button>

          {/* Navigation link items */}
          <nav className="flex items-center gap-1.5 md:gap-4">
            {/* If Student */}
            {currentUser?.role === 'student' && !activeCoursePlayer && (
              <>
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
              </>
            )}

            {/* If Visitor (no session) */}
            {!currentUser && (
              <>
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
              </>
            )}

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
      <main className="max-w-7xl mx-auto px-6 py-8">
        
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
                  setAllCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: c.status === 'published' ? 'draft' : 'published' } : c));
                }}
                onDeleteCourse={(courseId) => {
                  setAllCourses(prev => prev.filter(c => c.id !== courseId));
                }}
                onUpdateUserStatus={(userId, isDeactivated) => {
                  setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: isDeactivated ? 'deactivated' : 'active' } : u));
                }}
                onUpdateUserRole={(userId, newRole) => {
                  setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                  if (currentUser && currentUser.id === userId) {
                    setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
                  }
                }}
                onDeleteUser={(userId) => {
                  setAllUsers(prev => prev.filter(u => u.id !== userId));
                }}
                onAddUser={handleAddUser}
                onSendEmail={handleSendEmail}
              />
            )}

            {/* 3. TRAINER VIEW */}
            {currentUser?.role === 'trainer' && (
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
                onAddCourse={(newCourse) => setAllCourses(prev => [...prev, newCourse])}
                onUpdateCourse={(updatedCourse) => setAllCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c))}
                onDeleteCourse={(courseId) => setAllCourses(prev => prev.filter(c => c.id !== courseId))}
                onAddModule={(newMod) => setAllModules(prev => [...prev, newMod])}
                onUpdateModules={(updatedMods) => {
                  const updatedModIds = new Set(updatedMods.map(m => m.id));
                  setAllModules(prev => [
                    ...prev.filter(m => !updatedModIds.has(m.id)),
                    ...updatedMods
                  ]);
                }}
                onDeleteModule={(moduleId) => setAllModules(prev => prev.filter(m => m.id !== moduleId))}
                onAddChapter={(newCh) => setAllChapters(prev => [...prev, newCh])}
                onUpdateChapters={(updatedChaps) => setAllChapters(updatedChaps)}
                onDeleteChapter={(chapterId) => setAllChapters(prev => prev.filter(ch => ch.id !== chapterId))}
                onAddEnrollment={(newEnroll) => setAllEnrollments(prev => [...prev, newEnroll])}
                onUpdateEnrollmentStatus={(enrollmentId, status) => {
                  setAllEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status } : e));
                }}
                onDeleteEnrollment={(enrollmentId) => setAllEnrollments(prev => prev.filter(e => e.id !== enrollmentId))}
                onAddPreRegistered={(newPre) => setPreRegistered(prev => [...prev, newPre])}
                onSendEmail={handleSendEmail}
                onUpdateUser={(updatedUser) => {
                  setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                  setCurrentUser(updatedUser);
                }}
              />
            )}

            {/* 4. STUDENT VIEW */}
            {currentUser?.role === 'student' && (
              <div className="space-y-6">
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

      {/* Floating Demo Role Switcher overlay */}
      <RoleSwitcher
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={(user) => {
          setCurrentUser(user);
          setActiveCoursePlayer(null);
          if (user?.role === 'student') {
            setStudentTab('my-space');
          }
        }}
      />

    </div>
  );
}
