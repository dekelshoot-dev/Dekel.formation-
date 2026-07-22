# Security Specifications for Firestore Rules

## 1. Data Invariants
- **Users**: Users can read and write only their own profiles (`/users/{userId}`). No user can modify their own or another user's `role` to escalate privileges (e.g. from 'student' to 'admin' or 'trainer'). Only authenticated administrators can read/write any profile or escalate roles.
- **Courses**:
  - Anyone can read published courses (`status == 'published'`).
  - Trainers can create, read, and write courses where they are the designated trainer (`trainerId == request.auth.uid`).
  - Admins can manage any course.
- **Modules and Chapters**:
  - Anyone can read modules and chapters of published courses.
  - Trainers can manage modules and chapters for courses where they are the trainer.
  - Free chapters (`isFree == true`) are readable by anyone, while premium chapters are only readable by enrolled students, the course trainer, or admins.
- **Enrollments**:
  - Users can read their own enrollments (where `studentEmail == request.auth.token.email`).
  - Trainers can read and manage enrollments for their own courses.
  - Admins can manage all enrollments.
- **StudentProgress**:
  - Users can read and write their own student progress.
  - Trainers/admins can read student progress.
- **Simulated Emails**:
  - Users can read email logs sent to them.
  - Admins/trainers can log emails.
- **Pre-Registered**:
  - Admins/trainers can read/write pre-registrations.

---

## 2. The "Dirty Dozen" Rogue Payloads
Here are 12 specific malicious payloads designed to breach Identity, Integrity, and State, which MUST return `PERMISSION_DENIED`:

1. **Privilege Escalation**: A student trying to change their own role to `"admin"`.
2. **Identity Spoofing**: An authenticated user creating a user profile with a different UID.
3. **Course Hijack**: An authenticated trainer trying to modify another trainer's course details.
4. **Draft Course Snatching**: A student trying to read/list a course that is currently in `status: "draft"`.
5. **Unauthorized Lesson Read**: A student who is NOT enrolled trying to read a premium chapter (`isFree == false` or undefined).
6. **Fake Enrollment**: A student creating their own active enrollment record for a premium course.
7. **Progress Tampering**: A student writing completion progress logs for another student's email.
8. **Shadow Field Injection**: Creating a course document with extra unrecognized field `"hackerBackdoor": true`.
9. **Timestamp Spoofing**: Setting `createdAt` of a course to a manual date/time instead of `request.time`.
10. **Malicious ID Injection**: Creating a course with an ID containing giant junk characters to exhaust resource quotas.
11. **Negative Price bypass**: Trying to update a course price to `-500` or a non-integer type.
12. **PII Harvesting**: An authenticated visitor requesting a list of all user profiles and emails.

---

## 3. Security Rules Test Suite (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gen-lang-client-0934022789',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  it('rejects user role self-escalation (Dirty Dozen #1)', async () => {
    const context = testEnv.authenticatedContext('student_user_123', { email: 'student@example.com' });
    const db = context.firestore();
    const docRef = doc(db, 'users', 'student_user_123');
    await assertFails(updateDoc(docRef, { role: 'admin' }));
  });

  it('rejects identity spoofing on user creation (Dirty Dozen #2)', async () => {
    const context = testEnv.authenticatedContext('user_A', { email: 'userA@example.com' });
    const db = context.firestore();
    const docRef = doc(db, 'users', 'user_B');
    await assertFails(setDoc(docRef, { id: 'user_B', email: 'userB@example.com', name: 'Spoof', role: 'student', createdAt: new Date().toISOString() }));
  });
});
```
