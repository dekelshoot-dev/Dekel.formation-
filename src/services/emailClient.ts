import { EmailType, EmailCategory } from '../types/email';

export interface SendEmailOptions {
  to: string;
  recipientName?: string;
  type: EmailType;
  category: EmailCategory;
  actionUrl?: string;
  token?: string;
  renderData?: Record<string, any>;
}

export async function sendTransactionalEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/emails/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: options.to,
        recipientName: options.recipientName,
        type: options.type,
        category: options.category,
        actionUrl: options.actionUrl,
        token: options.token,
        renderData: options.renderData
      })
    });

    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Failed to trigger transactional email client:', error);
    return false;
  }
}

// Convenient helper methods for app components
export const emailTriggers = {
  // Authentication
  verifyEmail: (to: string, recipientName: string, actionUrl: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'auth_verify_email', category: 'authentication', actionUrl }),

  welcome: (to: string, recipientName: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'auth_welcome', category: 'authentication' }),

  resetPassword: (to: string, recipientName: string, actionUrl: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'auth_reset_password', category: 'authentication', actionUrl }),

  emailChanged: (to: string, recipientName: string, customMessage?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'auth_email_changed', category: 'authentication', renderData: { customMessage } }),

  passwordChanged: (to: string, recipientName: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'auth_password_changed', category: 'authentication' }),

  // User Management
  userAdminCreated: (to: string, recipientName: string, roleName: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'user_admin_created', category: 'user_management', renderData: { roleName } }),

  userPromotedTrainer: (to: string, recipientName: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'user_promoted_trainer', category: 'user_management' }),

  userPromotedAdmin: (to: string, recipientName: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'user_promoted_admin', category: 'user_management' }),

  // Enrollments
  courseEnrollment: (to: string, recipientName: string, courseTitle: string, trainerName?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_enrollment_confirm', category: 'enrollments', renderData: { courseTitle, trainerName } }),

  courseManualAdd: (to: string, recipientName: string, courseTitle: string, trainerName?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_manual_add', category: 'enrollments', renderData: { courseTitle, trainerName } }),

  courseFreeAccess: (to: string, recipientName: string, courseTitle: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_free_access_granted', category: 'enrollments', renderData: { courseTitle } }),

  // Payments
  paymentInitiated: (to: string, recipientName: string, courseTitle: string, amount?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'payment_initiated', category: 'payments', renderData: { courseTitle, paymentAmount: amount } }),

  paymentValidated: (to: string, recipientName: string, courseTitle: string, amount?: string, transactionRef?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'payment_validated', category: 'payments', renderData: { courseTitle, paymentAmount: amount, transactionRef } }),

  // Courses & Chapters
  newCoursePublished: (to: string, recipientName: string, courseTitle: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_new_published', category: 'courses', renderData: { courseTitle } }),

  newChapterPublished: (to: string, recipientName: string, courseTitle: string, chapterTitle: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'chapter_new_published', category: 'modules_chapters', renderData: { courseTitle, chapterTitle } }),

  // Quizzes & Certificates
  quizPassed: (to: string, recipientName: string, courseTitle: string, quizTitle: string, scorePercent: number) =>
    sendTransactionalEmail({ to, recipientName, type: 'quiz_passed', category: 'quizzes', renderData: { courseTitle, quizTitle, scorePercent } }),

  certificateEarned: (to: string, recipientName: string, courseTitle: string, certificateId?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'certificate_earned', category: 'certificates', renderData: { courseTitle, certificateId } }),

  // Security
  securityNewLogin: (to: string, recipientName: string, ipAddress?: string, deviceInfo?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'security_new_login', category: 'security', renderData: { ipAddress, deviceInfo } })
};
