export type EmailCategory = 'authentication' | 'courses' | 'payments' | 'pedagogy' | 'administration';

export type EmailType = 
  // Authentication
  | 'auth_verify_email'
  | 'auth_welcome'
  | 'auth_reset_password'
  | 'auth_email_changed'
  | 'auth_password_changed'
  // Courses
  | 'course_enrollment_confirm'
  | 'course_manual_add'
  | 'course_access_granted'
  | 'course_access_revoked'
  // Payments
  | 'payment_received'
  | 'payment_validated'
  | 'payment_webhook_enrolled'
  | 'payment_failed'
  // Pedagogy
  | 'pedagogy_course_welcome'
  | 'pedagogy_new_chapter'
  | 'pedagogy_new_module'
  | 'pedagogy_course_updated'
  // Administration
  | 'admin_trainer_invitation'
  | 'admin_role_changed'
  | 'admin_account_status';

export type EmailStatus = 'pending' | 'sent' | 'failed';

export interface TransactionalEmailLog {
  id: string;
  to: string;
  recipientName?: string;
  subject: string;
  type: EmailType;
  category: EmailCategory;
  htmlBody: string;
  textBody?: string;
  status: EmailStatus;
  queuedAt: string;
  sentAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  token?: string;
  tokenExpiresAt?: string;
}

export interface EmailTemplateDefinition {
  type: EmailType;
  category: EmailCategory;
  name: string;
  description: string;
  defaultSubject: string;
  sampleData: Record<string, any>;
}

export interface EmailServerConfig {
  providerName: string;
  senderName: string;
  senderEmail: string;
  enableSmtp: boolean;
  smtpHost?: string;
  smtpPort?: number;
  useTls: boolean;
  autoRetryLimit: number;
  tokenSecretConfigured: boolean;
}
