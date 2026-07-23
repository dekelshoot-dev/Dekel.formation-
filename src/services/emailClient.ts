import { EmailType, EmailCategory } from '../types/email';

export interface SendTransactionalEmailPayload {
  to: string;
  recipientName?: string;
  type: EmailType;
  category: EmailCategory;
  renderData?: Record<string, any>;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function sendTransactionalEmail(payload: SendTransactionalEmailPayload) {
  try {
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err: any) {
    console.error('Error triggering transactional email:', err);
    return { status: 'error', message: err.message };
  }
}

// Convenient helper dispatchers for app workflows
export const emailClient = {
  // Auth
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

  // Courses
  courseEnrollment: (to: string, recipientName: string, courseTitle: string, trainerName?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_enrollment_confirm', category: 'courses', renderData: { courseTitle, trainerName } }),

  courseManualAdd: (to: string, recipientName: string, courseTitle: string, trainerName?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_manual_add', category: 'courses', renderData: { courseTitle, trainerName } }),

  courseAccessGranted: (to: string, recipientName: string, courseTitle: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_access_granted', category: 'courses', renderData: { courseTitle } }),

  courseAccessRevoked: (to: string, recipientName: string, courseTitle: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'course_access_revoked', category: 'courses', renderData: { courseTitle } }),

  // Payments
  paymentReceived: (to: string, recipientName: string, courseTitle: string, amount?: string, method?: string, transactionRef?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'payment_received', category: 'payments', renderData: { courseTitle, paymentAmount: amount, paymentMethod: method, transactionRef } }),

  paymentValidated: (to: string, recipientName: string, courseTitle: string, amount?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'payment_validated', category: 'payments', renderData: { courseTitle, paymentAmount: amount } }),

  paymentFailed: (to: string, recipientName: string, courseTitle: string, amount?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'payment_failed', category: 'payments', renderData: { courseTitle, paymentAmount: amount } }),

  // Pedagogy
  pedagogyWelcome: (to: string, recipientName: string, courseTitle: string, trainerName?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'pedagogy_course_welcome', category: 'pedagogy', renderData: { courseTitle, trainerName } }),

  newChapter: (to: string, recipientName: string, courseTitle: string, chapterTitle: string, moduleTitle?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'pedagogy_new_chapter', category: 'pedagogy', renderData: { courseTitle, chapterTitle, moduleTitle } }),

  newModule: (to: string, recipientName: string, courseTitle: string, moduleTitle: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'pedagogy_new_module', category: 'pedagogy', renderData: { courseTitle, moduleTitle } }),

  courseUpdated: (to: string, recipientName: string, courseTitle: string, updateDetails?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'pedagogy_course_updated', category: 'pedagogy', renderData: { courseTitle, updateDetails } }),

  // Administration
  trainerInvitation: (to: string, recipientName: string, actionUrl: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'admin_trainer_invitation', category: 'administration', actionUrl }),

  roleChanged: (to: string, recipientName: string, roleName: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'admin_role_changed', category: 'administration', renderData: { roleName } }),

  accountStatus: (to: string, recipientName: string, accountStatus: string, customMessage?: string) =>
    sendTransactionalEmail({ to, recipientName, type: 'admin_account_status', category: 'administration', renderData: { accountStatus, customMessage } })
};
