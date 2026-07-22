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
  customPaymentButtons?: CustomPaymentButton[];
  webhookEmailKey?: string;
  webhookNameKey?: string;
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

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
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

export interface QuizQuestion {
  id: string;
  type: 'qcm' | 'true_false' | 'text';
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
