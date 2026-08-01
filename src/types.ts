export type UserRole = 'admin' | 'trainer' | 'assistant' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  status?: 'active' | 'deactivated';
  theme?: string;
  country?: string;
  language?: string;
  timezone?: string;
  lastLoginAt?: string;
  loginHistory?: string[];
  isSuspended?: boolean;
  permissions?: string[]; // e.g., 'edit_chapters', 'manage_comments', 'delete_course'
  invitedBy?: string;
}

export interface CustomPaymentButton {
  id: string;
  active: boolean;
  text: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  url: string;
  webhookUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  trainerId: string;
  trainerName: string;
  language: string;
  description: string;
  themeColor: 'indigo' | 'slate' | 'emerald' | 'amber' | 'rose' | 'sky';
  trainerPhoto?: string;
  logoUrl?: string;
  coverImage?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  type: string;
  price: number;
  promoPrice?: number;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';
  duration: string;
  paymentInstructions?: string;
  showPaymentInstructions?: boolean;
  contactInfo?: string;
  whatsappNumber?: string;
  customPaymentButtons?: CustomPaymentButton[];
  webhookEmailKey?: string;
  webhookNameKey?: string;
  webhookUrl?: string;
  webhookDisabled?: boolean;
  // Advanced fields
  scheduledPublishDate?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  subCategory?: string;
  tags?: string[];
  estimatedDuration?: string;
  totalWatchTime?: number;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  seoShareImage?: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  active?: boolean;
}

export interface DownloadableFile {
  id: string;
  name: string;
  url: string;
  size: string;
}

export interface ExternalLink {
  id: string;
  title: string;
  url: string;
}

export interface LinkButton {
  label: string;
  url: string;
}

export interface Chapter {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  order: number;
  videoSource: 'youtube' | 'vimeo' | 'direct' | 'iframe';
  videoUrl: string;
  videoOrientation?: '16/9' | '9/16';
  richText: string;
  imageUrl?: string;
  pdfUrl?: string;
  downloadableFiles?: DownloadableFile[];
  externalLinks?: ExternalLink[];
  linkButton?: LinkButton;
  isFree?: boolean;
  duration?: string;
  status?: 'published' | 'draft';
  active?: boolean;
}

export interface Enrollment {
  id: string;
  studentEmail: string;
  courseId: string;
  status: 'active' | 'revoked';
  enrolledAt: string;
}

export interface StudentProgress {
  studentEmail: string;
  courseId: string;
  completedChapterIds: string[];
  lastAccessedAt: string;
  lastVideoTimestamp?: number;
  timeSpentMinutes?: number;
  lastChapterId?: string;
}

export * from './types/email';

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  type?: string;
  category?: string;
  status?: string;
  htmlBody?: string;
}

export interface PreRegisteredStudent {
  email: string;
  courseIds: string[];
  name?: string;
}

// Interactive Features & Audit Logs
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string; // e.g., 'Formation créée', 'Chapitre supprimé', 'Connexion', etc.
  details: string;
  timestamp: string;
}

// Expanded Quiz and Question Types (Google Forms style)
export type QuestionType = 
  | 'single_choice'    // Réponse unique (Radio)
  | 'multiple_choice'  // Réponses multiples (Checkboxes)
  | 'image_question'   // Question avec image + propositions
  | 'short_text'       // Question textuelle (Réponse courte)
  | 'section_header';  // Description / Texte explicatif entre questions (0 point)

export interface CourseQuizQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  imageUrl?: string;
  points: number;
  options?: string[];
  correctAnswers: string[]; // Option indices (e.g., ["0"], ["0", "2"]) or exact text
  explanation?: string;
}

export interface CourseQuiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  associationType: 'chapter' | 'module' | 'course_end';
  targetId?: string; // chapterId or moduleId
  moduleId?: string;
  chapterId?: string;
  order: number;
  durationMinutes?: number; // 0 = unlimited
  passingScore: number; // e.g., 80 %
  allowedAttempts: number; // 0 = unlimited
  questionOrder: 'fixed' | 'random';
  showCorrections: 'immediate' | 'after_submission' | 'never';
  status: 'published' | 'draft';
  isPublished?: boolean;
  isRequired: boolean;
  questions: CourseQuizQuestion[];
  createdAt: string;
  updatedAt?: string;
}

export interface CourseQuizAttempt {
  id: string;
  quizId: string;
  courseId: string;
  quizTitle?: string;
  targetId?: string;
  studentEmail: string;
  studentName?: string;
  answers: Record<string, string | string[]>; // questionId -> answer index string or array of strings
  score: number; // points obtained
  totalPoints: number; // max points possible
  percentage: number; // 0-100
  passed: boolean;
  timeSpentSeconds: number;
  attemptNumber: number;
  submittedAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'qcm' | 'true_false' | 'text' | QuestionType;
  question: string;
  options?: string[]; // For QCM
  correctAnswer: string; // index (e.g., "0") or "True"/"False" or text match
}

export interface ChapterQuiz {
  id: string;
  chapterId: string;
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  id: string;
  studentEmail: string;
  chapterId: string;
  answers: Record<string, string>;
  score: number; // percentage (e.g. 80)
  completedAt: string;
}

export interface Exercise {
  id: string;
  chapterId: string;
  title: string;
  instructions: string;
}

export interface ExerciseSubmission {
  id: string;
  chapterId: string;
  courseId: string;
  studentEmail: string;
  studentName: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  submittedAt: string;
  status: 'pending' | 'graded';
  grade?: number; // /20 or /100
  feedback?: string;
  gradedBy?: string;
}

export interface Bookmark {
  id: string;
  studentEmail: string;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  savedAt: string;
}

export interface ChapterComment {
  id: string;
  chapterId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  content: string;
  createdAt: string;
  parentId?: string; // Support for 1-level deep replies
}

export interface Certificate {
  id: string; // e.g. CERT-XXXX-YYYY
  studentEmail: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  verificationCode: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf' | 'audio' | 'archive';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}
