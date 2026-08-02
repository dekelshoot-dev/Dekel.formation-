export type EmailCategory = 
  | 'authentication'
  | 'user_management'
  | 'enrollments'
  | 'payments'
  | 'courses'
  | 'modules_chapters'
  | 'quizzes'
  | 'certificates'
  | 'progress'
  | 'comments'
  | 'admin_system'
  | 'marketing'
  | 'support'
  | 'security'
  | 'webhooks'
  | 'trainer_notifs'
  | 'admin_notifs';

export type EmailType = 
  // 1. Authentication
  | 'auth_verify_email'
  | 'auth_welcome'
  | 'auth_reset_password'
  | 'auth_email_changed'
  | 'auth_password_changed'

  // 2. User Management
  | 'user_admin_created'
  | 'user_promoted_trainer'
  | 'user_promoted_admin'
  | 'user_role_revoked'
  | 'user_account_disabled'
  | 'user_account_reactivated'
  | 'user_account_deleted'

  // 3. Enrollments
  | 'course_enrollment_confirm'
  | 'course_manual_add'
  | 'course_registration_validated'
  | 'course_registration_rejected'
  | 'course_student_removed'
  | 'course_free_access_granted'
  | 'course_access_expired'

  // 4. Payments
  | 'payment_initiated'
  | 'payment_validated'
  | 'payment_rejected'
  | 'payment_canceled'
  | 'payment_refunded'
  | 'payment_webhook_enrolled'
  | 'payment_access_granted'
  | 'payment_access_failed'

  // 5. Courses
  | 'course_new_published'
  | 'course_new_available'
  | 'course_updated'
  | 'course_disabled'
  | 'course_deleted'
  | 'course_promo'
  | 'course_price_dropped'

  // 6. Modules & Chapters
  | 'module_new_published'
  | 'chapter_new_published'
  | 'chapter_unlocked'
  | 'chapter_resource_added'
  | 'chapter_major_update'

  // 7. Quizzes
  | 'quiz_new_available'
  | 'quiz_completed'
  | 'quiz_passed'
  | 'quiz_failed'
  | 'quiz_new_attempt_allowed'
  | 'quiz_all_attempts_used'

  // 8. Certificates
  | 'certificate_earned'
  | 'certificate_downloadable'
  | 'certificate_generated'
  | 'certificate_revoked'

  // 9. Progress
  | 'progress_module_completed'
  | 'progress_course_completed'
  | 'progress_25'
  | 'progress_50'
  | 'progress_75'
  | 'progress_100'
  | 'progress_inactivity_reminder'

  // 10. Comments & Discussions
  | 'comment_replied'
  | 'comment_new_chapter'
  | 'comment_trainer_replied'
  | 'comment_mentioned'

  // 11. Admin System
  | 'admin_backup_completed'
  | 'admin_system_error'
  | 'admin_webhook_error'
  | 'admin_email_failed'
  | 'admin_trainer_request'
  | 'admin_new_trainer_registered'

  // 12. Marketing
  | 'marketing_welcome'
  | 'marketing_course_recommended'
  | 'marketing_followed_trainer_course'
  | 'marketing_limited_promo'
  | 'marketing_promo_code'
  | 'marketing_newsletter'

  // 13. Support
  | 'support_ticket_created'
  | 'support_ticket_replied'
  | 'support_ticket_resolved'
  | 'support_ticket_closed'

  // 14. Security
  | 'security_new_login'
  | 'security_new_device_login'
  | 'security_failed_logins'
  | 'security_account_locked'
  | 'security_account_unlocked'
  | 'security_info_updated'

  // 15. Webhooks
  | 'webhook_payment_validated'
  | 'webhook_processing_failed'
  | 'webhook_invalid'
  | 'webhook_success'

  // 16. Trainer Notifications
  | 'trainer_student_enrolled'
  | 'trainer_student_completed_course'
  | 'trainer_student_got_cert'
  | 'trainer_student_quiz_passed'
  | 'trainer_student_quiz_failed'
  | 'trainer_new_question'
  | 'trainer_new_review'

  // 17. Admin Notifications
  | 'admin_notif_new_account'
  | 'admin_notif_new_trainer'
  | 'admin_notif_new_course'
  | 'admin_notif_new_cert'
  | 'admin_notif_payment_valid'
  | 'admin_notif_critical_error'
  | 'admin_notif_webhook_failed'
  | 'admin_notif_email_failed'
  | 'admin_notif_new_support';

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
  smtpDeliveryDetails?: {
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
    response?: string;
  };
}

export interface EmailTemplateDefinition {
  type: EmailType;
  category: EmailCategory;
  categoryLabel: string;
  name: string;
  description: string;
  defaultSubject: string;
  defaultRecipients: ('student' | 'trainer' | 'admin' | 'custom')[];
  sampleData: Record<string, any>;
}

export interface NotificationTriggerConfig {
  type: EmailType;
  category: EmailCategory;
  name: string;
  enabled: boolean;
  subject: string;
  customHtml?: string;
  recipients: ('student' | 'trainer' | 'admin' | 'custom')[];
  customRecipientEmails?: string[];
  delayMinutes: number; // 0 for instant
}

export interface EmailServerConfig {
  providerName: string;
  senderName: string;
  senderEmail: string; // service@dekel-dev.com
  enableSmtp: boolean;
  smtpHost: string; // smtp.gmail.com
  smtpPort: number; // 465 or 587
  useTls: boolean;
  gmailUser: string; // service@dekel-dev.com
  gmailAppPassword?: string;
  autoRetryLimit: number;
  tokenSecretConfigured: boolean;
  triggerRules?: Record<string, NotificationTriggerConfig>;
}

