export type UserRole = 'admin' | 'trainer' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  status?: 'active' | 'deactivated';
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
  status: 'published' | 'draft';
  createdAt: string;
  type: string;
  price: number;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';
  duration: string;
  paymentInstructions?: string;
  contactInfo?: string;
  customPaymentButtons?: CustomPaymentButton[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
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
}
