import { 
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, where, getDoc, updateDoc, increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent, CustomHtmlPage 
} from './types';
import { 
  INITIAL_USERS, INITIAL_COURSES, INITIAL_MODULES, INITIAL_CHAPTERS, 
  INITIAL_ENROLLMENTS, INITIAL_PROGRESS, INITIAL_EMAILS, INITIAL_PRE_REGISTERED, INITIAL_CUSTOM_PAGES 
} from './mockData';

// Helper to sanitize strings for document IDs if necessary
export function sanitizeId(val: string): string {
  return val.replace(/[^a-zA-Z0-9_\\-]/g, '_');
}

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = (obj as any)[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Auto-seeds the Firestore database with initial mock data if the courses collection is empty.
 */
export async function seedDatabaseIfEmpty() {
  let currentStep = 'check seeding doc';
  try {
    const seedingDocRef = doc(db, 'metadata', 'seeding_hierarchical');
    const seedingSnap = await getDoc(seedingDocRef);
    if (seedingSnap.exists()) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding Firestore database with initial mock data...');

        // Seed Users
    currentStep = 'users';
    for (const u of INITIAL_USERS) {
      console.log('Seeding user:', u.id);
      await setDoc(doc(db, 'users', u.id), cleanUndefined(u));
    }

    // Seed Courses
    currentStep = 'courses';
    for (const c of INITIAL_COURSES) {
      console.log('Seeding course:', c.id);
      await setDoc(doc(db, 'courses', c.id), cleanUndefined(c));
    }

    // Seed Modules
    currentStep = 'modules';
    for (const m of INITIAL_MODULES) {
      console.log('Seeding module:', m.id);
      await setDoc(doc(db, 'courses', m.courseId, 'modules', m.id), cleanUndefined(m));
    }

    // Seed Chapters
    currentStep = 'chapters';
    for (const ch of INITIAL_CHAPTERS) {
      console.log('Seeding chapter:', ch.id);
      await setDoc(doc(db, 'courses', ch.courseId, 'modules', ch.moduleId, 'chapters', ch.id), cleanUndefined(ch));
    }

    // Seed Enrollments
    currentStep = 'enrollments';
    for (const e of INITIAL_ENROLLMENTS) {
      console.log('Seeding enrollment:', e.id);
      await setDoc(doc(db, 'enrollments', e.id), cleanUndefined(e));
    }

    // Seed Progress
    currentStep = 'progress';
    for (const p of INITIAL_PROGRESS) {
      const pid = `progress-${p.courseId}-${sanitizeId(p.studentEmail)}`;
      console.log('Seeding progress:', pid);
      await setDoc(doc(db, 'progress', pid), cleanUndefined(p));
    }

    // Seed Emails
    currentStep = 'emails';
    for (const em of INITIAL_EMAILS) {
      console.log('Seeding email:', em.id);
      await setDoc(doc(db, 'emails', em.id), cleanUndefined(em));
    }

    // Seed Pre-registered
    currentStep = 'preregistered';
    for (const pr of INITIAL_PRE_REGISTERED) {
      const prid = `prereg-${sanitizeId(pr.email)}`;
      console.log('Seeding preregistered:', prid);
      await setDoc(doc(db, 'preregistered', prid), cleanUndefined(pr));
    }

    // Mark Seeding as Completed
    currentStep = 'mark seeding completed';
    console.log('Seeding metadata...');
    await setDoc(seedingDocRef, { completed: true });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.warn(`Database seeding notice at step "${currentStep}":`, error);
  }
}

/**
 * Users Profile Mutations
 */
export async function saveUserProfile(user: User) {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), cleanUndefined(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserProfile(userId: string) {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Courses Mutations
 */
export async function saveCourse(course: Course) {
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), cleanUndefined(course));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCourse(courseId: string) {
  const path = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Modules Mutations
 */
export async function saveModule(mod: Module) {
  const path = `courses/${mod.courseId}/modules/${mod.id}`;
  try {
    await setDoc(doc(db, 'courses', mod.courseId, 'modules', mod.id), cleanUndefined(mod));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteModule(moduleId: string, courseId: string) {
  const path = `courses/${courseId}/modules/${moduleId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveModuleList(modules: Module[]) {
  try {
    const batch = writeBatch(db);
    modules.forEach(m => {
      const ref = doc(db, 'courses', m.courseId, 'modules', m.id);
      batch.set(ref, cleanUndefined(m));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'modules-batch');
  }
}

/**
 * Chapters Mutations
 */
export async function saveChapter(chapter: Chapter) {
  const path = `courses/${chapter.courseId}/modules/${chapter.moduleId}/chapters/${chapter.id}`;
  try {
    await setDoc(doc(db, 'courses', chapter.courseId, 'modules', chapter.moduleId, 'chapters', chapter.id), cleanUndefined(chapter));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveChapterList(chapters: Chapter[]) {
  try {
    const batch = writeBatch(db);
    chapters.forEach(ch => {
      const ref = doc(db, 'courses', ch.courseId, 'modules', ch.moduleId, 'chapters', ch.id);
      batch.set(ref, cleanUndefined(ch));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'chapters-batch');
  }
}

export async function deleteChapter(chapterId: string, moduleId: string, courseId: string) {
  const path = `courses/${courseId}/modules/${moduleId}/chapters/${chapterId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId, 'chapters', chapterId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Enrollments Mutations
 */
export async function saveEnrollment(enrollment: Enrollment) {
  const path = `enrollments/${enrollment.id}`;
  try {
    await setDoc(doc(db, 'enrollments', enrollment.id), cleanUndefined(enrollment));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEnrollment(enrollmentId: string) {
  const path = `enrollments/${enrollmentId}`;
  try {
    await deleteDoc(doc(db, 'enrollments', enrollmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * StudentProgress Mutations
 */
export async function saveStudentProgress(progress: StudentProgress) {
  const pid = `progress-${progress.courseId}-${sanitizeId(progress.studentEmail)}`;
  const path = `progress/${pid}`;
  try {
    await setDoc(doc(db, 'progress', pid), cleanUndefined(progress));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Simulated Emails Mutations
 */
export async function saveSimulatedEmail(email: SimulatedEmail) {
  const path = `emails/${email.id}`;
  try {
    await setDoc(doc(db, 'emails', email.id), cleanUndefined(email));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearSimulatedEmails(emails: SimulatedEmail[]) {
  try {
    const batch = writeBatch(db);
    emails.forEach(e => {
      const ref = doc(db, 'emails', e.id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'emails-batch-clear');
  }
}

/**
 * PreRegistered Mutations
 */
export async function savePreRegistered(pre: PreRegisteredStudent) {
  const prid = `prereg-${sanitizeId(pre.email)}`;
  const path = `preregistered/${prid}`;
  try {
    await setDoc(doc(db, 'preregistered', prid), cleanUndefined(pre));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePreRegistered(email: string) {
  const prid = `prereg-${sanitizeId(email)}`;
  const path = `preregistered/${prid}`;
  try {
    await deleteDoc(doc(db, 'preregistered', prid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
  * Custom HTML Pages Mutations
  */
export async function saveCustomPage(page: CustomHtmlPage) {
  const path = `custom_pages/${page.id}`;
  try {
    await setDoc(doc(db, 'custom_pages', page.id), cleanUndefined(page));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomPage(pageId: string) {
  const path = `custom_pages/${pageId}`;
  try {
    await deleteDoc(doc(db, 'custom_pages', pageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function incrementCustomPageViewCount(pageId: string) {
  const path = `custom_pages/${pageId}`;
  try {
    await updateDoc(doc(db, 'custom_pages', pageId), {
      viewsCount: increment(1)
    });
  } catch (error) {
    // If updateDoc fails because document doesn't exist yet or lacks viewsCount
    console.warn('Could not increment page view count:', error);
  }
}

