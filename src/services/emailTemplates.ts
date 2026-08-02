import { EmailType, EmailCategory, EmailTemplateDefinition } from '../types/email';

export interface EmailRenderData {
  recipientName?: string;
  recipientEmail: string;
  actionUrl?: string;
  token?: string;
  tokenExpiresAt?: string;
  courseTitle?: string;
  courseId?: string;
  trainerName?: string;
  chapterTitle?: string;
  moduleTitle?: string;
  quizTitle?: string;
  scorePercent?: number;
  certificateUrl?: string;
  certificateId?: string;
  progressPercent?: number;
  updateDetails?: string;
  paymentAmount?: string;
  paymentMethod?: string;
  transactionRef?: string;
  roleName?: string;
  accountStatus?: string;
  commentText?: string;
  ticketSubject?: string;
  ipAddress?: string;
  deviceInfo?: string;
  customMessage?: string;
  discountCode?: string;
  discountPercent?: number;
  origin?: string;
  baseUrl?: string;
  fullName?: string;
  verificationCode?: string;
}

export const CATEGORY_LABELS: Record<EmailCategory, string> = {
  authentication: '1. Identification & Sécurité',
  user_management: '2. Gestion des Utilisateurs',
  enrollments: '3. Inscriptions aux Formations',
  payments: '4. Paiements',
  courses: '5. Formations',
  modules_chapters: '6. Modules et Chapitres',
  quizzes: '7. Quiz',
  certificates: '8. Certificats',
  progress: '9. Progression',
  comments: '10. Commentaires & Discussions',
  admin_system: '11. Notifications Administratives',
  marketing: '12. Marketing',
  support: '13. Support',
  security: '14. Sécurité',
  webhooks: '15. Webhooks',
  trainer_notifs: '16. Notifications Formateurs',
  admin_notifs: '17. Notifications Administrateurs'
};

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  // 1. Identification
  {
    type: 'auth_verify_email',
    category: 'authentication',
    categoryLabel: CATEGORY_LABELS.authentication,
    name: 'Vérification d\'adresse e-mail',
    description: 'Envoyé après l\'inscription pour vérifier l\'adresse e-mail de l\'utilisateur.',
    defaultSubject: 'Vérifiez votre adresse e-mail - Dekel.Formation',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Amadou Sow', actionUrl: 'https://formation.dekel-dev.com/verify?token=xyz123' }
  },
  {
    type: 'auth_welcome',
    category: 'authentication',
    categoryLabel: CATEGORY_LABELS.authentication,
    name: 'Bienvenue sur Dekel.Formation',
    description: 'Souhaite la bienvenue à un nouvel utilisateur inscrit.',
    defaultSubject: 'Bienvenue sur Dekel.Formation !',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Fatou Ndiaye' }
  },
  {
    type: 'auth_reset_password',
    category: 'authentication',
    categoryLabel: CATEGORY_LABELS.authentication,
    name: 'Réinitialisation du mot de passe',
    description: 'Envoyé pour réinitialiser le mot de passe oublié.',
    defaultSubject: 'Réinitialisation de votre mot de passe - Dekel.Formation',
    defaultRecipients: ['student', 'trainer', 'admin'],
    sampleData: { recipientName: 'Moussa Diallo', actionUrl: 'https://formation.dekel-dev.com/reset-password?token=abc456' }
  },
  {
    type: 'auth_email_changed',
    category: 'authentication',
    categoryLabel: CATEGORY_LABELS.authentication,
    name: 'Modification de l\'adresse e-mail',
    description: 'Alerte lors du changement d\'e-mail.',
    defaultSubject: 'Alerte sécurité : Changement d\'adresse e-mail',
    defaultRecipients: ['student', 'trainer'],
    sampleData: { recipientName: 'Sophie Koné' }
  },

  // 2. User Management
  {
    type: 'user_admin_created',
    category: 'user_management',
    categoryLabel: CATEGORY_LABELS.user_management,
    name: 'Création de compte par un admin',
    description: 'Un administrateur crée directement un compte utilisateur.',
    defaultSubject: 'Votre compte Dekel.Formation a été créé par l\'administration',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Ibrahima Sarr', roleName: 'Étudiant' }
  },
  {
    type: 'user_promoted_trainer',
    category: 'user_management',
    categoryLabel: CATEGORY_LABELS.user_management,
    name: 'Promotion au rang de Formateur',
    description: 'Un utilisateur est promu au rôle de Formateur.',
    defaultSubject: 'Félicitations ! Vous êtes désormais Formateur sur Dekel.Formation',
    defaultRecipients: ['trainer'],
    sampleData: { recipientName: 'Aïcha Traoré', roleName: 'Formateur' }
  },
  {
    type: 'user_promoted_admin',
    category: 'user_management',
    categoryLabel: CATEGORY_LABELS.user_management,
    name: 'Promotion au rang d\'Administrateur',
    description: 'Un utilisateur obtient les droits d\'administrateur.',
    defaultSubject: 'Nouveaux privilèges : Accès Administrateur accordé',
    defaultRecipients: ['admin'],
    sampleData: { recipientName: 'Jean Dupont', roleName: 'Administrateur' }
  },

  // 3. Enrollments
  {
    type: 'course_enrollment_confirm',
    category: 'enrollments',
    categoryLabel: CATEGORY_LABELS.enrollments,
    name: 'Inscription à une formation',
    description: 'Confirmation d\'inscription à un cours.',
    defaultSubject: 'Confirmation d\'accès : {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Khadija Sarr', courseTitle: 'Canva Pro & Design' }
  },
  {
    type: 'course_manual_add',
    category: 'enrollments',
    categoryLabel: CATEGORY_LABELS.enrollments,
    name: 'Ajout manuel par un formateur',
    description: 'Ajout manuel d\'un élève par un formateur.',
    defaultSubject: 'Un formateur vous a inscrit à {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Ousmane Cissé', courseTitle: 'Copywriting Ultra-Convaincant', trainerName: 'Marie Formatrice' }
  },
  {
    type: 'course_free_access_granted',
    category: 'enrollments',
    categoryLabel: CATEGORY_LABELS.enrollments,
    name: 'Attribution d\'un accès gratuit',
    description: 'Accès offert à une formation sans frais.',
    defaultSubject: 'Un accès gratuit vous est offert sur {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Mariama Bâ', courseTitle: 'Introduction à l\'IA' }
  },

  // 4. Payments
  {
    type: 'payment_initiated',
    category: 'payments',
    categoryLabel: CATEGORY_LABELS.payments,
    name: 'Paiement initié',
    description: 'Confirmation de l\'initialisation du règlement.',
    defaultSubject: 'Paiement en cours de traitement pour {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Cheikh Sy', courseTitle: 'E-commerce Africa', paymentAmount: '25 000 FCFA' }
  },
  {
    type: 'payment_validated',
    category: 'payments',
    categoryLabel: CATEGORY_LABELS.payments,
    name: 'Paiement validé (Reçu)',
    description: 'Validation définitive du paiement et émission du reçu.',
    defaultSubject: 'Paiement validé - Votre reçu Dekel.Formation',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Mariama Diop', courseTitle: 'Freelance Upwork', paymentAmount: '15 000 FCFA', transactionRef: 'TX-98745' }
  },

  // 5. Courses
  {
    type: 'course_new_published',
    category: 'courses',
    categoryLabel: CATEGORY_LABELS.courses,
    name: 'Nouvelle formation publiée',
    description: 'Informer la communauté qu\'une formation vient de sortir.',
    defaultSubject: 'Nouvelle formation disponible : {{courseTitle}} !',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Saliou Diouf', courseTitle: 'Masterclass Intelligence Artificielle 2026' }
  },

  // 6. Modules & Chapters
  {
    type: 'chapter_new_published',
    category: 'modules_chapters',
    categoryLabel: CATEGORY_LABELS.modules_chapters,
    name: 'Nouveau chapitre publié',
    description: 'Notification d\'un nouveau chapitre vidéo/texte.',
    defaultSubject: 'Nouveau chapitre disponible : {{chapterTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Kewaye Camara', courseTitle: 'Canva Pro', chapterTitle: 'Créer des visuels 3D' }
  },

  // 7. Quizzes
  {
    type: 'quiz_passed',
    category: 'quizzes',
    categoryLabel: CATEGORY_LABELS.quizzes,
    name: 'Quiz réussi !',
    description: 'Félicitations pour la réussite d\'un quiz.',
    defaultSubject: 'Bravo ! Vous avez réussi le quiz sur {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Aminata Sow', courseTitle: 'Excel Pro', quizTitle: 'Quiz Final Tableaux Croisés', scorePercent: 95 }
  },
  {
    type: 'quiz_failed',
    category: 'quizzes',
    categoryLabel: CATEGORY_LABELS.quizzes,
    name: 'Quiz échoué',
    description: 'Encouragements après un échec au quiz.',
    defaultSubject: 'Résultats de votre quiz sur {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Mamadou Faye', courseTitle: 'Marketing Digital', quizTitle: 'Evaluation Modulo 2', scorePercent: 50 }
  },

  // 8. Certificates
  {
    type: 'certificate_earned',
    category: 'certificates',
    categoryLabel: CATEGORY_LABELS.certificates,
    name: 'Certificat obtenu',
    description: 'Notification d\'obtention et de commande de certificat de réussite.',
    defaultSubject: '🎓 Félicitations ! Votre certificat officiel pour {{courseTitle}} est disponible',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Fatoumata Bâ', courseTitle: 'Développement Web Fullstack', certificateId: 'CERT-2026-99', verificationCode: 'CERT-DEKEL-881293' }
  },

  // 9. Progress
  {
    type: 'progress_module_completed',
    category: 'progress',
    categoryLabel: CATEGORY_LABELS.progress,
    name: 'Module terminé (Félicitations)',
    description: 'Notification envoyée lorsqu\'un étudiant achève tous les chapitres d\'un module.',
    defaultSubject: '🌟 Félicitations ! Vous avez terminé le module {{moduleTitle}} sur {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Amadou Sow', courseTitle: 'Canva Pro Masterclass', moduleTitle: 'Module 1 : Prise en main' }
  },
  {
    type: 'progress_course_completed',
    category: 'progress',
    categoryLabel: CATEGORY_LABELS.progress,
    name: 'Formation terminée à 100%',
    description: 'Félicitations pour l\'achèvement complet d\'un programme.',
    defaultSubject: '🎉 Bravo ! Vous avez terminé 100% de la formation {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Bamba Kane', courseTitle: 'Automatisations Make & Zapier' }
  },

  // 10. Comments
  {
    type: 'comment_trainer_replied',
    category: 'comments',
    categoryLabel: CATEGORY_LABELS.comments,
    name: 'Réponse du formateur à votre question',
    description: 'Le formateur a répondu à un commentaire sous une vidéo.',
    defaultSubject: 'Le formateur a répondu à votre question dans {{courseTitle}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Oumar Sy', courseTitle: 'Photoshop Avancé', trainerName: 'Jean Formateur' }
  },

  // 11. Admin System
  {
    type: 'admin_system_error',
    category: 'admin_system',
    categoryLabel: CATEGORY_LABELS.admin_system,
    name: 'Erreur système importante',
    description: 'Alerte système critique envoyée aux administrateurs.',
    defaultSubject: '⚠️ Alerte Système Critique - Dekel.Formation',
    defaultRecipients: ['admin'],
    sampleData: { recipientName: 'Admin Tech', customMessage: 'Erreur de base de données temporaire résolue.' }
  },

  // 12. Marketing
  {
    type: 'marketing_welcome',
    category: 'marketing',
    categoryLabel: CATEGORY_LABELS.marketing,
    name: 'Offre de bienvenue & code promo',
    description: 'Offre marketing promotionnelle de bienvenue.',
    defaultSubject: 'Profitez de -20% sur votre première formation avec le code DEKEL20 !',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Nouveau Membre', discountCode: 'DEKEL20', discountPercent: 20 }
  },

  // 13. Support
  {
    type: 'support_ticket_created',
    category: 'support',
    categoryLabel: CATEGORY_LABELS.support,
    name: 'Ticket de support créé',
    description: 'Confirmation d\'ouverture d\'une demande d\'assistance.',
    defaultSubject: 'Demande de support enregistrée - Ticket #{{transactionRef}}',
    defaultRecipients: ['student'],
    sampleData: { recipientName: 'Salif Sané', ticketSubject: 'Problème de lecture vidéo', transactionRef: 'SUP-4491' }
  },

  // 14. Security
  {
    type: 'security_new_login',
    category: 'security',
    categoryLabel: CATEGORY_LABELS.security,
    name: 'Nouvelle connexion détectée',
    description: 'Alerte de sécurité lors de la connexion sur un nouvel appareil.',
    defaultSubject: 'Sécurité : Nouvelle connexion à votre compte Dekel.Formation',
    defaultRecipients: ['student', 'trainer', 'admin'],
    sampleData: { recipientName: 'Modou Ndiaye', ipAddress: '197.220.12.5', deviceInfo: 'Chrome sur macOS (Dakar, Sénégal)' }
  },

  // 15. Webhooks
  {
    type: 'webhook_payment_validated',
    category: 'webhooks',
    categoryLabel: CATEGORY_LABELS.webhooks,
    name: 'Paiement validé via Webhook',
    description: 'Confirmation de la réception et du traitement d\'un webhook de vente.',
    defaultSubject: 'Webhook Vente Validé : {{courseTitle}}',
    defaultRecipients: ['admin', 'student'],
    sampleData: { recipientName: 'Client Automatique', courseTitle: 'Formation Zapier', transactionRef: 'WHK-9988' }
  },

  // 16. Trainer Notifications
  {
    type: 'trainer_student_enrolled',
    category: 'trainer_notifs',
    categoryLabel: CATEGORY_LABELS.trainer_notifs,
    name: 'Nouvel étudiant inscrit (Pour Formateur)',
    description: 'Alerter le formateur qu\'un élève a rejoint son cours.',
    defaultSubject: '🎓 Un nouvel étudiant a rejoint votre formation {{courseTitle}} !',
    defaultRecipients: ['trainer'],
    sampleData: { recipientName: 'Jean Formateur', courseTitle: 'Canva Pro', customMessage: 'L\'étudiant Fatou Sow vient de s\'inscrire.' }
  },

  // 17. Admin Notifications
  {
    type: 'admin_notif_new_account',
    category: 'admin_notifs',
    categoryLabel: CATEGORY_LABELS.admin_notifs,
    name: 'Nouveau compte utilisateur (Pour Admin)',
    description: 'Rapport administrateur de création de compte.',
    defaultSubject: '👤 Nouveau compte utilisateur créé sur la plateforme',
    defaultRecipients: ['admin'],
    sampleData: { recipientName: 'Administrateur', customMessage: 'L\'utilisateur boubacar@gmail.com vient de s\'inscrire.' }
  }
];

function resolveActionUrl(type: EmailType, data: EmailRenderData, baseUrl: string): string {
  // 1. If explicit absolute actionUrl is supplied and is a valid HTTP/HTTPS URL
  if (data.actionUrl && (data.actionUrl.startsWith('http://') || data.actionUrl.startsWith('https://'))) {
    return data.actionUrl;
  }

  // 2. If relative path or query string is supplied in actionUrl
  if (data.actionUrl && data.actionUrl !== '#') {
    const rel = data.actionUrl.startsWith('/') ? data.actionUrl : `/${data.actionUrl}`;
    return `${baseUrl}${rel}`;
  }

  // 3. Fallback routing based on email type
  const encodedEmail = encodeURIComponent(data.recipientEmail || '');
  const encodedCourse = encodeURIComponent(data.courseTitle || '');

  switch (type) {
    case 'auth_verify_email':
      return `${baseUrl}?mode=verifyEmail${encodedEmail ? `&email=${encodedEmail}` : ''}`;
    
    case 'auth_reset_password':
    case 'user_admin_created':
      return `${baseUrl}?mode=resetPassword${encodedEmail ? `&email=${encodedEmail}` : ''}`;

    case 'auth_welcome':
    case 'auth_email_changed':
    case 'auth_password_changed':
    case 'security_new_login':
      return `${baseUrl}?mode=login`;

    case 'user_promoted_trainer':
      return `${baseUrl}?view=trainer`;

    case 'user_promoted_admin':
      return `${baseUrl}?view=admin`;

    case 'course_enrollment_confirm':
    case 'course_manual_add':
    case 'course_free_access_granted':
    case 'payment_validated':
    case 'payment_initiated':
    case 'chapter_new_published':
    case 'quiz_passed':
    case 'certificate_earned':
      return `${baseUrl}?view=student${encodedCourse ? `&course=${encodedCourse}` : ''}`;

    case 'course_new_published':
      return `${baseUrl}?view=catalog${encodedCourse ? `&course=${encodedCourse}` : ''}`;

    default:
      return baseUrl;
  }
}

export function generateEmailHtml(type: EmailType, data: EmailRenderData & { customSubject?: string; customHtml?: string }): { subject: string; html: string; text: string } {
  const name = data.recipientName || 'Cher membre';
  const appName = 'Dekel.Formation';
  const senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'service@dekel-dev.com';
  const currentYear = new Date().getFullYear();

  // If custom HTML and/or subject is explicitly passed, use it directly
  if (data.customHtml) {
    const customSubject = data.customSubject || `Message de ${appName}`;
    const htmlBody = data.customHtml;
    const isFullDoc = htmlBody.trim().toLowerCase().startsWith('<!doctype') || htmlBody.trim().toLowerCase().startsWith('<html');
    const finalHtml = isFullDoc ? htmlBody : `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${customSubject}</title>
</head>
<body style="margin: 0; padding: 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  ${htmlBody}
</body>
</html>`;

    return {
      subject: customSubject,
      html: finalHtml,
      text: htmlBody.replace(/<[^>]+>/g, '')
    };
  }

  const rawBaseUrl = data.origin || data.baseUrl || process.env.APP_URL || process.env.PUBLIC_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : '');
  const baseUrl = (rawBaseUrl && rawBaseUrl.startsWith('http')) 
    ? rawBaseUrl.replace(/\/$/, '') 
    : 'https://ais-dev-ncjptdvwzolepvgizaagu6-364041685083.europe-west3.run.app';

  let subject = '';
  let badgeTitle = 'Notification';
  let iconEmoji = '✉️';
  let title = '';
  let contentHtml = '';
  let callToActionText = '';
  const callToActionUrl = resolveActionUrl(type, data, baseUrl);

  switch (type) {
    // 1. AUTHENTICATION
    case 'auth_verify_email':
      subject = 'Vérifiez votre adresse e-mail - Dekel.Formation';
      badgeTitle = 'Authentification';
      iconEmoji = '🔒';
      title = 'Vérification de votre adresse e-mail';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Merci de vous être inscrit sur <strong>${appName}</strong>. Afin de finaliser votre compte et de sécuriser vos accès, veuillez confirmer votre adresse e-mail :</p>
      `;
      callToActionText = 'Vérifier mon e-mail';
      break;

    case 'auth_welcome':
      subject = `Bienvenue sur ${appName} !`;
      badgeTitle = 'Bienvenue';
      iconEmoji = '🎉';
      title = 'Bienvenue dans la communauté Dekel.Formation !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous sommes ravis de vous accueillir sur <strong>${appName}</strong>. Vous pouvez dès à présent accéder à votre espace de formation et démarrer votre apprentissage.</p>
      `;
      callToActionText = 'Accéder à mon espace';
      break;

    case 'auth_reset_password':
      subject = 'Réinitialisation de votre mot de passe - Dekel.Formation';
      badgeTitle = 'Sécurité';
      iconEmoji = '🔑';
      title = 'Demande de réinitialisation de mot de passe';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez ci-dessous pour choisir un nouveau mot de passe :</p>
      `;
      callToActionText = 'Réinitialiser mon mot de passe';
      break;

    case 'auth_email_changed':
      subject = 'Mise à jour de votre adresse e-mail - Dekel.Formation';
      badgeTitle = 'Sécurité';
      iconEmoji = '📧';
      title = 'Adresse e-mail mise à jour';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre adresse e-mail de connexion a été modifiée avec succès sur <strong>${appName}</strong>.</p>
        ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
      `;
      callToActionText = 'Se connecter à mon compte';
      break;

    case 'auth_password_changed':
      subject = 'Mot de passe modifié avec succès - Dekel.Formation';
      badgeTitle = 'Sécurité';
      iconEmoji = '🔐';
      title = 'Mot de passe mis à jour';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le mot de passe associé à votre compte a été modifié. Si vous n'êtes pas à l'origine de cette action, veuillez contacter le support immédiatement.</p>
      `;
      callToActionText = 'Se connecter';
      break;

    // 2. USER MANAGEMENT
    case 'user_admin_created':
      subject = `Votre compte ${appName} a été créé par l'administration`;
      badgeTitle = 'Gestion des comptes';
      iconEmoji = '👤';
      title = 'Création de votre compte par l\'administration';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Un administrateur de la plateforme <strong>${appName}</strong> vient de vous créer un compte avec le rôle de <strong>${data.roleName || 'Étudiant'}</strong>.</p>
      `;
      callToActionText = 'Définir mon mot de passe';
      break;

    case 'user_promoted_trainer':
      subject = `Félicitations ! Vous êtes désormais Formateur sur ${appName}`;
      badgeTitle = 'Promotion';
      iconEmoji = '🎓';
      title = 'Vous avez été promu Formateur !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous disposez désormais des privilèges de <strong>Formateur</strong>. Vous pouvez créer des cours, mettre en ligne des leçons et suivre vos étudiants.</p>
      `;
      callToActionText = 'Accéder à l\'Espace Formateur';
      break;

    case 'user_promoted_admin':
      subject = `Accès Administrateur accordé - ${appName}`;
      badgeTitle = 'Administration';
      iconEmoji = '🛡️';
      title = 'Vous disposez désormais des privilèges Administrateur';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre compte a été promu au rôle d'<strong>Administrateur</strong> sur Dekel.Formation.</p>
      `;
      callToActionText = 'Accéder au Dashboard Admin';
      break;

    // 3. ENROLLMENTS & COURSES
    case 'course_enrollment_confirm':
      subject = `Confirmation d'inscription : ${data.courseTitle || 'Votre formation'}`;
      badgeTitle = 'Inscription Validée';
      iconEmoji = '📚';
      title = 'Votre inscription est confirmée !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre inscription à la formation <strong>« ${data.courseTitle || 'Formation'} »</strong> est validée avec succès.</p>
      `;
      callToActionText = 'Accéder à la formation';
      break;

    case 'course_manual_add':
      subject = `Accès accordé à la formation : ${data.courseTitle || 'Nouvelle formation'}`;
      badgeTitle = 'Nouvel Accès';
      iconEmoji = '🎁';
      title = 'Un nouveau cours vous est ouvert !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le formateur <strong>${data.trainerName || 'Dekel.Formation'}</strong> vous a accordé l'accès au cours <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
      `;
      callToActionText = 'Suivre le cours maintenant';
      break;

    case 'course_free_access_granted':
      subject = `Accès offert : ${data.courseTitle || 'Formation Dekel'}`;
      badgeTitle = 'Offre Spéciale';
      iconEmoji = '✨';
      title = 'Accès gratuit débloqué !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous avez obtenu un accès gratuit à la formation <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
      `;
      callToActionText = 'Consulter ma formation';
      break;

    case 'course_new_published':
      subject = `Nouveau cours disponible : ${data.courseTitle || 'Catalogue Dekel'}`;
      badgeTitle = 'Nouveau Cours';
      iconEmoji = '🌟';
      title = 'Découvrez notre nouvelle formation !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>La formation <strong>« ${data.courseTitle || 'Nouvelle formation'} »</strong> est disponible sur le catalogue.</p>
      `;
      callToActionText = 'Découvrir la formation';
      break;

    case 'chapter_new_published':
      subject = `Nouveau chapitre : ${data.chapterTitle || 'Leçon publiée'}`;
      badgeTitle = 'Nouveau Contenu';
      iconEmoji = '📹';
      title = 'Une nouvelle leçon a été mise en ligne !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le chapitre <strong>« ${data.chapterTitle || 'Nouveau chapitre'} »</strong> est désormais disponible dans le cours <strong>« ${data.courseTitle || 'Votre formation'} »</strong>.</p>
      `;
      callToActionText = 'Visionner la leçon';
      break;

    // 4. PAYMENTS
    case 'payment_initiated':
      subject = `Paiement en cours pour ${data.courseTitle || 'votre formation'}`;
      badgeTitle = 'Paiement Initié';
      iconEmoji = '💳';
      title = 'Votre commande est en cours de traitement';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons bien pris en compte votre intention de règlement pour <strong>« ${data.courseTitle || 'Formation'} »</strong>${data.paymentAmount ? ` d'un montant de <strong>${data.paymentAmount}</strong>` : ''}.</p>
      `;
      callToActionText = 'Voir mon espace étudiant';
      break;

    case 'payment_validated':
      subject = `Paiement validé - Reçu officiel ${appName}`;
      badgeTitle = 'Paiement Validé';
      iconEmoji = '🧾';
      title = 'Validation de votre règlement';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre paiement pour la formation <strong>« ${data.courseTitle || 'Formation'} »</strong> de <strong>${data.paymentAmount || 'Montant validé'}</strong> a été traité avec succès.</p>
      `;
      callToActionText = 'Voir mon cours';
      break;

    // 7. QUIZZES
    case 'quiz_passed':
      subject = `Félicitations ! Quiz réussi sur ${data.courseTitle || 'votre formation'}`;
      badgeTitle = 'Quiz Réussi';
      iconEmoji = '🏆';
      title = 'Bravo pour votre réussite !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous avez brillamment réussi le quiz <strong>« ${data.quizTitle || 'Quiz de formation'} »</strong> avec un score de <strong>${data.scorePercent || 100}%</strong> !</p>
      `;
      callToActionText = 'Continuer le cours';
      break;

    // 8. CERTIFICATES
    case 'certificate_earned':
      subject = `🎓 Votre Certificat Officiel de Réussite - ${data.courseTitle || 'Dekel.Formation'}`;
      badgeTitle = 'Certificat Débloqué';
      iconEmoji = '🏅';
      title = 'Votre Certificat Officiel est disponible !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons le plaisir de vous délivrer votre <strong>Certificat Officiel de Réussite</strong> pour la formation <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
        <div style="background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6366f1; font-weight: 800;">Attestation Académique Officielle</p>
          <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 900; color: #0f172a;">${data.fullName || data.recipientName || name}</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">A validé l'intégralité du programme d'apprentissage <strong>"${data.courseTitle || 'Dekel.Formation'}"</strong></p>
          <p style="margin: 0; font-size: 11px; font-family: monospace; color: #4f46e5; font-weight: bold;">Code de vérification : ${data.verificationCode || data.certificateId || 'CERT-OFFICIEL'}</p>
        </div>
        <p>Vous pouvez consulter, imprimer ou télécharger votre certificat au format PDF / HTML directement depuis votre espace étudiant.</p>
      `;
      callToActionText = 'Télécharger mon certificat';
      break;

    // 9. PROGRESS
    case 'progress_module_completed':
      subject = `🌟 Félicitations ! Vous avez terminé le module ${data.moduleTitle || 'du cours'} sur ${data.courseTitle || 'Dekel.Formation'}`;
      badgeTitle = 'Module Complété';
      iconEmoji = '🌟';
      title = 'Félicitations pour la validation de votre module !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous tenons à vous féliciter chaleureusement ! Vous venez de terminer avec succès le module <strong>« ${data.moduleTitle || 'Module'} »</strong> de la formation <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
        <p style="margin-top: 12px; color: #047857; font-weight: 600;">Poursuivez sur votre lancée et continuez votre apprentissage pour débloquer les prochains modules et votre certificat officiel !</p>
      `;
      callToActionText = 'Continuer ma formation';
      break;

    case 'progress_course_completed':
      subject = `🎉 Bravo ! Vous avez terminé 100% de la formation ${data.courseTitle || 'Dekel.Formation'}`;
      badgeTitle = 'Formation Réussie 100%';
      iconEmoji = '🎓';
      title = 'Bravo ! Vous avez achevé l\'intégralité de la formation !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Félicitations exceptionnelles ! Vous avez accompli 100% du parcours de formation <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
        <p style="margin-top: 12px; color: #047857; font-weight: 600;">Vous êtes maintenant éligible pour commander votre certificat officiel de réussite attestant de vos compétences.</p>
      `;
      callToActionText = 'Commander mon Certificat';
      break;

    // 9. SECURITY
    case 'security_new_login':
      subject = `Alerte Sécurité : Nouvelle connexion à votre compte Dekel.Formation`;
      badgeTitle = 'Sécurité';
      iconEmoji = '🛡️';
      title = 'Nouvelle connexion enregistrée';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Une nouvelle connexion s'est produite sur votre compte (${data.ipAddress || 'IP masquée'} - ${data.deviceInfo || 'Appareil navigateur'}).</p>
      `;
      callToActionText = 'Sécuriser mon compte';
      break;

    // DEFAULT FALLBACK
    default:
      const tplDef = EMAIL_TEMPLATE_DEFINITIONS.find(t => t.type === type);
      subject = tplDef?.defaultSubject || `Notification Dekel.Formation`;
      badgeTitle = tplDef?.categoryLabel || 'Notification';
      iconEmoji = '✉️';
      title = tplDef?.name || 'Notification automatique';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>${data.customMessage || 'Vous avez reçu une notification importante sur votre compte Dekel.Formation.'}</p>
        ${data.courseTitle ? `<p>Formation : <strong>${data.courseTitle}</strong></p>` : ''}
      `;
      callToActionText = 'Ouvrir Dekel.Formation';
      break;
  }

  const plainText = `${title}\n\n${contentHtml.replace(/<[^>]+>/g, '')}\n\nDekel.Formation - Expéditeur : ${senderEmail}`;

  const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f1115; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1b2028; padding: 28px 24px; text-align: center; border-bottom: 3px solid #10b981;">
              <div style="display: inline-flex; align-items: center; justify-content: center; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 8px 16px;">
                <span style="font-size: 18px; margin-right: 8px;"></span>
                <span style="color: #ffffff; font-weight: 800; font-size: 18px;">Dekel.<span style="color: #34d399;">Formation</span></span>
              </div>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Service Expéditeur : ${senderEmail}</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 20px;">
                  ${iconEmoji} ${badgeTitle}
                </span>
              </div>

              <h1 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
                ${title}
              </h1>

              <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                ${contentHtml}
              </div>

              ${callToActionText ? `
              <div style="margin-top: 28px; text-align: center;">
                <a href="${callToActionUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 12px;">
                  ${callToActionText} &rarr;
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #cbd5e1;">Dekel.Formation &bull; Expéditeur officiel : ${senderEmail}</p>
              <p style="margin: 0;">&copy; ${currentYear} Dekel.Formation. Tous droits réservés.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    html: fullHtml,
    text: plainText
  };
}
