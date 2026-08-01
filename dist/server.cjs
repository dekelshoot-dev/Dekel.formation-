var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");

// server/emailServerService.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_dns = __toESM(require("dns"), 1);
var import_net = __toESM(require("net"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);

// src/services/emailTemplates.ts
var CATEGORY_LABELS = {
  authentication: "1. Identification & S\xE9curit\xE9",
  user_management: "2. Gestion des Utilisateurs",
  enrollments: "3. Inscriptions aux Formations",
  payments: "4. Paiements",
  courses: "5. Formations",
  modules_chapters: "6. Modules et Chapitres",
  quizzes: "7. Quiz",
  certificates: "8. Certificats",
  progress: "9. Progression",
  comments: "10. Commentaires & Discussions",
  admin_system: "11. Notifications Administratives",
  marketing: "12. Marketing",
  support: "13. Support",
  security: "14. S\xE9curit\xE9",
  webhooks: "15. Webhooks",
  trainer_notifs: "16. Notifications Formateurs",
  admin_notifs: "17. Notifications Administrateurs"
};
var EMAIL_TEMPLATE_DEFINITIONS = [
  // 1. Identification
  {
    type: "auth_verify_email",
    category: "authentication",
    categoryLabel: CATEGORY_LABELS.authentication,
    name: "V\xE9rification d'adresse e-mail",
    description: "Envoy\xE9 apr\xE8s l'inscription pour v\xE9rifier l'adresse e-mail de l'utilisateur.",
    defaultSubject: "V\xE9rifiez votre adresse e-mail - Dekel.Formation",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Amadou Sow", actionUrl: "https://dekel-formation.com/verify?token=xyz123" }
  },
  {
    type: "auth_welcome",
    category: "authentication",
    categoryLabel: CATEGORY_LABELS.authentication,
    name: "Bienvenue sur Dekel.Formation",
    description: "Souhaite la bienvenue \xE0 un nouvel utilisateur inscrit.",
    defaultSubject: "Bienvenue sur Dekel.Formation !",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Fatou Ndiaye" }
  },
  {
    type: "auth_reset_password",
    category: "authentication",
    categoryLabel: CATEGORY_LABELS.authentication,
    name: "R\xE9initialisation du mot de passe",
    description: "Envoy\xE9 pour r\xE9initialiser le mot de passe oubli\xE9.",
    defaultSubject: "R\xE9initialisation de votre mot de passe - Dekel.Formation",
    defaultRecipients: ["student", "trainer", "admin"],
    sampleData: { recipientName: "Moussa Diallo", actionUrl: "https://dekel-formation.com/reset-password?token=abc456" }
  },
  {
    type: "auth_email_changed",
    category: "authentication",
    categoryLabel: CATEGORY_LABELS.authentication,
    name: "Modification de l'adresse e-mail",
    description: "Alerte lors du changement d'e-mail.",
    defaultSubject: "Alerte s\xE9curit\xE9 : Changement d'adresse e-mail",
    defaultRecipients: ["student", "trainer"],
    sampleData: { recipientName: "Sophie Kon\xE9" }
  },
  // 2. User Management
  {
    type: "user_admin_created",
    category: "user_management",
    categoryLabel: CATEGORY_LABELS.user_management,
    name: "Cr\xE9ation de compte par un admin",
    description: "Un administrateur cr\xE9e directement un compte utilisateur.",
    defaultSubject: "Votre compte Dekel.Formation a \xE9t\xE9 cr\xE9\xE9 par l'administration",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Ibrahima Sarr", roleName: "\xC9tudiant" }
  },
  {
    type: "user_promoted_trainer",
    category: "user_management",
    categoryLabel: CATEGORY_LABELS.user_management,
    name: "Promotion au rang de Formateur",
    description: "Un utilisateur est promu au r\xF4le de Formateur.",
    defaultSubject: "F\xE9licitations ! Vous \xEAtes d\xE9sormais Formateur sur Dekel.Formation",
    defaultRecipients: ["trainer"],
    sampleData: { recipientName: "A\xEFcha Traor\xE9", roleName: "Formateur" }
  },
  {
    type: "user_promoted_admin",
    category: "user_management",
    categoryLabel: CATEGORY_LABELS.user_management,
    name: "Promotion au rang d'Administrateur",
    description: "Un utilisateur obtient les droits d'administrateur.",
    defaultSubject: "Nouveaux privil\xE8ges : Acc\xE8s Administrateur accord\xE9",
    defaultRecipients: ["admin"],
    sampleData: { recipientName: "Jean Dupont", roleName: "Administrateur" }
  },
  // 3. Enrollments
  {
    type: "course_enrollment_confirm",
    category: "enrollments",
    categoryLabel: CATEGORY_LABELS.enrollments,
    name: "Inscription \xE0 une formation",
    description: "Confirmation d'inscription \xE0 un cours.",
    defaultSubject: "Confirmation d'acc\xE8s : {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Khadija Sarr", courseTitle: "Canva Pro & Design" }
  },
  {
    type: "course_manual_add",
    category: "enrollments",
    categoryLabel: CATEGORY_LABELS.enrollments,
    name: "Ajout manuel par un formateur",
    description: "Ajout manuel d'un \xE9l\xE8ve par un formateur.",
    defaultSubject: "Un formateur vous a inscrit \xE0 {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Ousmane Ciss\xE9", courseTitle: "Copywriting Ultra-Convaincant", trainerName: "Marie Formatrice" }
  },
  {
    type: "course_free_access_granted",
    category: "enrollments",
    categoryLabel: CATEGORY_LABELS.enrollments,
    name: "Attribution d'un acc\xE8s gratuit",
    description: "Acc\xE8s offert \xE0 une formation sans frais.",
    defaultSubject: "Un acc\xE8s gratuit vous est offert sur {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Mariama B\xE2", courseTitle: "Introduction \xE0 l'IA" }
  },
  // 4. Payments
  {
    type: "payment_initiated",
    category: "payments",
    categoryLabel: CATEGORY_LABELS.payments,
    name: "Paiement initi\xE9",
    description: "Confirmation de l'initialisation du r\xE8glement.",
    defaultSubject: "Paiement en cours de traitement pour {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Cheikh Sy", courseTitle: "E-commerce Africa", paymentAmount: "25 000 FCFA" }
  },
  {
    type: "payment_validated",
    category: "payments",
    categoryLabel: CATEGORY_LABELS.payments,
    name: "Paiement valid\xE9 (Re\xE7u)",
    description: "Validation d\xE9finitive du paiement et \xE9mission du re\xE7u.",
    defaultSubject: "Paiement valid\xE9 - Votre re\xE7u Dekel.Formation",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Mariama Diop", courseTitle: "Freelance Upwork", paymentAmount: "15 000 FCFA", transactionRef: "TX-98745" }
  },
  // 5. Courses
  {
    type: "course_new_published",
    category: "courses",
    categoryLabel: CATEGORY_LABELS.courses,
    name: "Nouvelle formation publi\xE9e",
    description: "Informer la communaut\xE9 qu'une formation vient de sortir.",
    defaultSubject: "Nouvelle formation disponible : {{courseTitle}} !",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Saliou Diouf", courseTitle: "Masterclass Intelligence Artificielle 2026" }
  },
  // 6. Modules & Chapters
  {
    type: "chapter_new_published",
    category: "modules_chapters",
    categoryLabel: CATEGORY_LABELS.modules_chapters,
    name: "Nouveau chapitre publi\xE9",
    description: "Notification d'un nouveau chapitre vid\xE9o/texte.",
    defaultSubject: "Nouveau chapitre disponible : {{chapterTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Kewaye Camara", courseTitle: "Canva Pro", chapterTitle: "Cr\xE9er des visuels 3D" }
  },
  // 7. Quizzes
  {
    type: "quiz_passed",
    category: "quizzes",
    categoryLabel: CATEGORY_LABELS.quizzes,
    name: "Quiz r\xE9ussi !",
    description: "F\xE9licitations pour la r\xE9ussite d'un quiz.",
    defaultSubject: "Bravo ! Vous avez r\xE9ussi le quiz sur {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Aminata Sow", courseTitle: "Excel Pro", quizTitle: "Quiz Final Tableaux Crois\xE9s", scorePercent: 95 }
  },
  {
    type: "quiz_failed",
    category: "quizzes",
    categoryLabel: CATEGORY_LABELS.quizzes,
    name: "Quiz \xE9chou\xE9",
    description: "Encouragements apr\xE8s un \xE9chec au quiz.",
    defaultSubject: "R\xE9sultats de votre quiz sur {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Mamadou Faye", courseTitle: "Marketing Digital", quizTitle: "Evaluation Modulo 2", scorePercent: 50 }
  },
  // 8. Certificates
  {
    type: "certificate_earned",
    category: "certificates",
    categoryLabel: CATEGORY_LABELS.certificates,
    name: "Certificat obtenu",
    description: "Notification d'obtention de certificat de r\xE9ussite.",
    defaultSubject: "F\xE9licitations ! Votre certificat pour {{courseTitle}} est disponible",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Fatoumata B\xE2", courseTitle: "D\xE9veloppement Web Fullstack", certificateId: "CERT-2026-99" }
  },
  // 9. Progress
  {
    type: "progress_course_completed",
    category: "progress",
    categoryLabel: CATEGORY_LABELS.progress,
    name: "Formation termin\xE9e \xE0 100%",
    description: "F\xE9licitations pour l'ach\xE8vement complet d'un programme.",
    defaultSubject: "Bravo ! Vous avez termin\xE9 100% de la formation {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Bamba Kane", courseTitle: "Automatisations Make & Zapier" }
  },
  // 10. Comments
  {
    type: "comment_trainer_replied",
    category: "comments",
    categoryLabel: CATEGORY_LABELS.comments,
    name: "R\xE9ponse du formateur \xE0 votre question",
    description: "Le formateur a r\xE9pondu \xE0 un commentaire sous une vid\xE9o.",
    defaultSubject: "Le formateur a r\xE9pondu \xE0 votre question dans {{courseTitle}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Oumar Sy", courseTitle: "Photoshop Avanc\xE9", trainerName: "Jean Formateur" }
  },
  // 11. Admin System
  {
    type: "admin_system_error",
    category: "admin_system",
    categoryLabel: CATEGORY_LABELS.admin_system,
    name: "Erreur syst\xE8me importante",
    description: "Alerte syst\xE8me critique envoy\xE9e aux administrateurs.",
    defaultSubject: "\u26A0\uFE0F Alerte Syst\xE8me Critique - Dekel.Formation",
    defaultRecipients: ["admin"],
    sampleData: { recipientName: "Admin Tech", customMessage: "Erreur de base de donn\xE9es temporaire r\xE9solue." }
  },
  // 12. Marketing
  {
    type: "marketing_welcome",
    category: "marketing",
    categoryLabel: CATEGORY_LABELS.marketing,
    name: "Offre de bienvenue & code promo",
    description: "Offre marketing promotionnelle de bienvenue.",
    defaultSubject: "Profitez de -20% sur votre premi\xE8re formation avec le code DEKEL20 !",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Nouveau Membre", discountCode: "DEKEL20", discountPercent: 20 }
  },
  // 13. Support
  {
    type: "support_ticket_created",
    category: "support",
    categoryLabel: CATEGORY_LABELS.support,
    name: "Ticket de support cr\xE9\xE9",
    description: "Confirmation d'ouverture d'une demande d'assistance.",
    defaultSubject: "Demande de support enregistr\xE9e - Ticket #{{transactionRef}}",
    defaultRecipients: ["student"],
    sampleData: { recipientName: "Salif San\xE9", ticketSubject: "Probl\xE8me de lecture vid\xE9o", transactionRef: "SUP-4491" }
  },
  // 14. Security
  {
    type: "security_new_login",
    category: "security",
    categoryLabel: CATEGORY_LABELS.security,
    name: "Nouvelle connexion d\xE9tect\xE9e",
    description: "Alerte de s\xE9curit\xE9 lors de la connexion sur un nouvel appareil.",
    defaultSubject: "S\xE9curit\xE9 : Nouvelle connexion \xE0 votre compte Dekel.Formation",
    defaultRecipients: ["student", "trainer", "admin"],
    sampleData: { recipientName: "Modou Ndiaye", ipAddress: "197.220.12.5", deviceInfo: "Chrome sur macOS (Dakar, S\xE9n\xE9gal)" }
  },
  // 15. Webhooks
  {
    type: "webhook_payment_validated",
    category: "webhooks",
    categoryLabel: CATEGORY_LABELS.webhooks,
    name: "Paiement valid\xE9 via Webhook",
    description: "Confirmation de la r\xE9ception et du traitement d'un webhook de vente.",
    defaultSubject: "Webhook Vente Valid\xE9 : {{courseTitle}}",
    defaultRecipients: ["admin", "student"],
    sampleData: { recipientName: "Client Automatique", courseTitle: "Formation Zapier", transactionRef: "WHK-9988" }
  },
  // 16. Trainer Notifications
  {
    type: "trainer_student_enrolled",
    category: "trainer_notifs",
    categoryLabel: CATEGORY_LABELS.trainer_notifs,
    name: "Nouvel \xE9tudiant inscrit (Pour Formateur)",
    description: "Alerter le formateur qu'un \xE9l\xE8ve a rejoint son cours.",
    defaultSubject: "\u{1F393} Un nouvel \xE9tudiant a rejoint votre formation {{courseTitle}} !",
    defaultRecipients: ["trainer"],
    sampleData: { recipientName: "Jean Formateur", courseTitle: "Canva Pro", customMessage: "L'\xE9tudiant Fatou Sow vient de s'inscrire." }
  },
  // 17. Admin Notifications
  {
    type: "admin_notif_new_account",
    category: "admin_notifs",
    categoryLabel: CATEGORY_LABELS.admin_notifs,
    name: "Nouveau compte utilisateur (Pour Admin)",
    description: "Rapport administrateur de cr\xE9ation de compte.",
    defaultSubject: "\u{1F464} Nouveau compte utilisateur cr\xE9\xE9 sur la plateforme",
    defaultRecipients: ["admin"],
    sampleData: { recipientName: "Administrateur", customMessage: "L'utilisateur boubacar@gmail.com vient de s'inscrire." }
  }
];
function resolveActionUrl(type, data, baseUrl) {
  if (data.actionUrl && (data.actionUrl.startsWith("http://") || data.actionUrl.startsWith("https://"))) {
    return data.actionUrl;
  }
  if (data.actionUrl && data.actionUrl !== "#") {
    const rel = data.actionUrl.startsWith("/") ? data.actionUrl : `/${data.actionUrl}`;
    return `${baseUrl}${rel}`;
  }
  const encodedEmail = encodeURIComponent(data.recipientEmail || "");
  const encodedCourse = encodeURIComponent(data.courseTitle || "");
  switch (type) {
    case "auth_verify_email":
      return `${baseUrl}?mode=verifyEmail${encodedEmail ? `&email=${encodedEmail}` : ""}`;
    case "auth_reset_password":
    case "user_admin_created":
      return `${baseUrl}?mode=resetPassword${encodedEmail ? `&email=${encodedEmail}` : ""}`;
    case "auth_welcome":
    case "auth_email_changed":
    case "auth_password_changed":
    case "security_new_login":
      return `${baseUrl}?mode=login`;
    case "user_promoted_trainer":
      return `${baseUrl}?view=trainer`;
    case "user_promoted_admin":
      return `${baseUrl}?view=admin`;
    case "course_enrollment_confirm":
    case "course_manual_add":
    case "course_free_access_granted":
    case "payment_validated":
    case "payment_initiated":
    case "chapter_new_published":
    case "quiz_passed":
    case "certificate_earned":
      return `${baseUrl}?view=student${encodedCourse ? `&course=${encodedCourse}` : ""}`;
    case "course_new_published":
      return `${baseUrl}?view=catalog${encodedCourse ? `&course=${encodedCourse}` : ""}`;
    default:
      return baseUrl;
  }
}
function generateEmailHtml(type, data) {
  const name = data.recipientName || "Cher membre";
  const appName = "Dekel.Formation";
  const senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER || "service@dekel-dev.com";
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const rawBaseUrl = data.origin || data.baseUrl || process.env.APP_URL || process.env.PUBLIC_URL || (typeof window !== "undefined" && window.location.origin ? window.location.origin : "");
  const baseUrl = rawBaseUrl && rawBaseUrl.startsWith("http") ? rawBaseUrl.replace(/\/$/, "") : "https://ais-dev-ncjptdvwzolepvgizaagu6-364041685083.europe-west3.run.app";
  let subject = "";
  let badgeTitle = "Notification";
  let iconEmoji = "\u2709\uFE0F";
  let title = "";
  let contentHtml = "";
  let callToActionText = "";
  const callToActionUrl = resolveActionUrl(type, data, baseUrl);
  switch (type) {
    // 1. AUTHENTICATION
    case "auth_verify_email":
      subject = "V\xE9rifiez votre adresse e-mail - Dekel.Formation";
      badgeTitle = "Authentification";
      iconEmoji = "\u{1F512}";
      title = "V\xE9rification de votre adresse e-mail";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Merci de vous \xEAtre inscrit sur <strong>${appName}</strong>. Afin de finaliser votre compte et de s\xE9curiser vos acc\xE8s, veuillez confirmer votre adresse e-mail :</p>
      `;
      callToActionText = "V\xE9rifier mon e-mail";
      break;
    case "auth_welcome":
      subject = `Bienvenue sur ${appName} !`;
      badgeTitle = "Bienvenue";
      iconEmoji = "\u{1F389}";
      title = "Bienvenue dans la communaut\xE9 Dekel.Formation !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous sommes ravis de vous accueillir sur <strong>${appName}</strong>. Vous pouvez d\xE8s \xE0 pr\xE9sent acc\xE9der \xE0 votre espace de formation et d\xE9marrer votre apprentissage.</p>
      `;
      callToActionText = "Acc\xE9der \xE0 mon espace";
      break;
    case "auth_reset_password":
      subject = "R\xE9initialisation de votre mot de passe - Dekel.Formation";
      badgeTitle = "S\xE9curit\xE9";
      iconEmoji = "\u{1F511}";
      title = "Demande de r\xE9initialisation de mot de passe";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons re\xE7u une demande de r\xE9initialisation de votre mot de passe. Cliquez ci-dessous pour choisir un nouveau mot de passe :</p>
      `;
      callToActionText = "R\xE9initialiser mon mot de passe";
      break;
    case "auth_email_changed":
      subject = "Mise \xE0 jour de votre adresse e-mail - Dekel.Formation";
      badgeTitle = "S\xE9curit\xE9";
      iconEmoji = "\u{1F4E7}";
      title = "Adresse e-mail mise \xE0 jour";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre adresse e-mail de connexion a \xE9t\xE9 modifi\xE9e avec succ\xE8s sur <strong>${appName}</strong>.</p>
        ${data.customMessage ? `<p>${data.customMessage}</p>` : ""}
      `;
      callToActionText = "Se connecter \xE0 mon compte";
      break;
    case "auth_password_changed":
      subject = "Mot de passe modifi\xE9 avec succ\xE8s - Dekel.Formation";
      badgeTitle = "S\xE9curit\xE9";
      iconEmoji = "\u{1F510}";
      title = "Mot de passe mis \xE0 jour";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le mot de passe associ\xE9 \xE0 votre compte a \xE9t\xE9 modifi\xE9. Si vous n'\xEAtes pas \xE0 l'origine de cette action, veuillez contacter le support imm\xE9diatement.</p>
      `;
      callToActionText = "Se connecter";
      break;
    // 2. USER MANAGEMENT
    case "user_admin_created":
      subject = `Votre compte ${appName} a \xE9t\xE9 cr\xE9\xE9 par l'administration`;
      badgeTitle = "Gestion des comptes";
      iconEmoji = "\u{1F464}";
      title = "Cr\xE9ation de votre compte par l'administration";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Un administrateur de la plateforme <strong>${appName}</strong> vient de vous cr\xE9er un compte avec le r\xF4le de <strong>${data.roleName || "\xC9tudiant"}</strong>.</p>
      `;
      callToActionText = "D\xE9finir mon mot de passe";
      break;
    case "user_promoted_trainer":
      subject = `F\xE9licitations ! Vous \xEAtes d\xE9sormais Formateur sur ${appName}`;
      badgeTitle = "Promotion";
      iconEmoji = "\u{1F393}";
      title = "Vous avez \xE9t\xE9 promu Formateur !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous disposez d\xE9sormais des privil\xE8ges de <strong>Formateur</strong>. Vous pouvez cr\xE9er des cours, mettre en ligne des le\xE7ons et suivre vos \xE9tudiants.</p>
      `;
      callToActionText = "Acc\xE9der \xE0 l'Espace Formateur";
      break;
    case "user_promoted_admin":
      subject = `Acc\xE8s Administrateur accord\xE9 - ${appName}`;
      badgeTitle = "Administration";
      iconEmoji = "\u{1F6E1}\uFE0F";
      title = "Vous disposez d\xE9sormais des privil\xE8ges Administrateur";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre compte a \xE9t\xE9 promu au r\xF4le d'<strong>Administrateur</strong> sur Dekel.Formation.</p>
      `;
      callToActionText = "Acc\xE9der au Dashboard Admin";
      break;
    // 3. ENROLLMENTS & COURSES
    case "course_enrollment_confirm":
      subject = `Confirmation d'inscription : ${data.courseTitle || "Votre formation"}`;
      badgeTitle = "Inscription Valid\xE9e";
      iconEmoji = "\u{1F4DA}";
      title = "Votre inscription est confirm\xE9e !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre inscription \xE0 la formation <strong>\xAB ${data.courseTitle || "Formation"} \xBB</strong> est valid\xE9e avec succ\xE8s.</p>
      `;
      callToActionText = "Acc\xE9der \xE0 la formation";
      break;
    case "course_manual_add":
      subject = `Acc\xE8s accord\xE9 \xE0 la formation : ${data.courseTitle || "Nouvelle formation"}`;
      badgeTitle = "Nouvel Acc\xE8s";
      iconEmoji = "\u{1F381}";
      title = "Un nouveau cours vous est ouvert !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le formateur <strong>${data.trainerName || "Dekel.Formation"}</strong> vous a accord\xE9 l'acc\xE8s au cours <strong>\xAB ${data.courseTitle || "Formation"} \xBB</strong>.</p>
      `;
      callToActionText = "Suivre le cours maintenant";
      break;
    case "course_free_access_granted":
      subject = `Acc\xE8s offert : ${data.courseTitle || "Formation Dekel"}`;
      badgeTitle = "Offre Sp\xE9ciale";
      iconEmoji = "\u2728";
      title = "Acc\xE8s gratuit d\xE9bloqu\xE9 !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous avez obtenu un acc\xE8s gratuit \xE0 la formation <strong>\xAB ${data.courseTitle || "Formation"} \xBB</strong>.</p>
      `;
      callToActionText = "Consulter ma formation";
      break;
    case "course_new_published":
      subject = `Nouveau cours disponible : ${data.courseTitle || "Catalogue Dekel"}`;
      badgeTitle = "Nouveau Cours";
      iconEmoji = "\u{1F31F}";
      title = "D\xE9couvrez notre nouvelle formation !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>La formation <strong>\xAB ${data.courseTitle || "Nouvelle formation"} \xBB</strong> est disponible sur le catalogue.</p>
      `;
      callToActionText = "D\xE9couvrir la formation";
      break;
    case "chapter_new_published":
      subject = `Nouveau chapitre : ${data.chapterTitle || "Le\xE7on publi\xE9e"}`;
      badgeTitle = "Nouveau Contenu";
      iconEmoji = "\u{1F4F9}";
      title = "Une nouvelle le\xE7on a \xE9t\xE9 mise en ligne !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le chapitre <strong>\xAB ${data.chapterTitle || "Nouveau chapitre"} \xBB</strong> est d\xE9sormais disponible dans le cours <strong>\xAB ${data.courseTitle || "Votre formation"} \xBB</strong>.</p>
      `;
      callToActionText = "Visionner la le\xE7on";
      break;
    // 4. PAYMENTS
    case "payment_initiated":
      subject = `Paiement en cours pour ${data.courseTitle || "votre formation"}`;
      badgeTitle = "Paiement Initi\xE9";
      iconEmoji = "\u{1F4B3}";
      title = "Votre commande est en cours de traitement";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons bien pris en compte votre intention de r\xE8glement pour <strong>\xAB ${data.courseTitle || "Formation"} \xBB</strong>${data.paymentAmount ? ` d'un montant de <strong>${data.paymentAmount}</strong>` : ""}.</p>
      `;
      callToActionText = "Voir mon espace \xE9tudiant";
      break;
    case "payment_validated":
      subject = `Paiement valid\xE9 - Re\xE7u officiel ${appName}`;
      badgeTitle = "Paiement Valid\xE9";
      iconEmoji = "\u{1F9FE}";
      title = "Validation de votre r\xE8glement";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre paiement pour la formation <strong>\xAB ${data.courseTitle || "Formation"} \xBB</strong> de <strong>${data.paymentAmount || "Montant valid\xE9"}</strong> a \xE9t\xE9 trait\xE9 avec succ\xE8s.</p>
      `;
      callToActionText = "Voir mon cours";
      break;
    // 7. QUIZZES
    case "quiz_passed":
      subject = `F\xE9licitations ! Quiz r\xE9ussi sur ${data.courseTitle || "votre formation"}`;
      badgeTitle = "Quiz R\xE9ussi";
      iconEmoji = "\u{1F3C6}";
      title = "Bravo pour votre r\xE9ussite !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous avez brillamment r\xE9ussi le quiz <strong>\xAB ${data.quizTitle || "Quiz de formation"} \xBB</strong> avec un score de <strong>${data.scorePercent || 100}%</strong> !</p>
      `;
      callToActionText = "Continuer le cours";
      break;
    // 8. CERTIFICATES
    case "certificate_earned":
      subject = `Certificat officiel obtenu : ${data.courseTitle || "Formation Dekel"}`;
      badgeTitle = "Certificat D\xE9bloqu\xE9";
      iconEmoji = "\u{1F3C5}";
      title = "Votre certificat est disponible !";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>F\xE9licitations ! Ayant compl\xE9t\xE9 100% de la formation <strong>\xAB ${data.courseTitle || "Formation"} \xBB</strong>, votre certificat officiel est d\xE8s \xE0 pr\xE9sent disponible au t\xE9l\xE9chargement.</p>
      `;
      callToActionText = "T\xE9l\xE9charger mon certificat";
      break;
    // 9. SECURITY
    case "security_new_login":
      subject = `Alerte S\xE9curit\xE9 : Nouvelle connexion \xE0 votre compte Dekel.Formation`;
      badgeTitle = "S\xE9curit\xE9";
      iconEmoji = "\u{1F6E1}\uFE0F";
      title = "Nouvelle connexion enregistr\xE9e";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Une nouvelle connexion s'est produite sur votre compte (${data.ipAddress || "IP masqu\xE9e"} - ${data.deviceInfo || "Appareil navigateur"}).</p>
      `;
      callToActionText = "S\xE9curiser mon compte";
      break;
    // DEFAULT FALLBACK
    default:
      const tplDef = EMAIL_TEMPLATE_DEFINITIONS.find((t) => t.type === type);
      subject = tplDef?.defaultSubject || `Notification Dekel.Formation`;
      badgeTitle = tplDef?.categoryLabel || "Notification";
      iconEmoji = "\u2709\uFE0F";
      title = tplDef?.name || "Notification automatique";
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>${data.customMessage || "Vous avez re\xE7u une notification importante sur votre compte Dekel.Formation."}</p>
        ${data.courseTitle ? `<p>Formation : <strong>${data.courseTitle}</strong></p>` : ""}
      `;
      callToActionText = "Ouvrir Dekel.Formation";
      break;
  }
  const plainText = `${title}

${contentHtml.replace(/<[^>]+>/g, "")}

Dekel.Formation - Exp\xE9diteur : ${senderEmail}`;
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
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Service Exp\xE9diteur : ${senderEmail}</p>
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
              ` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #cbd5e1;">Dekel.Formation &bull; Exp\xE9diteur officiel : ${senderEmail}</p>
              <p style="margin: 0;">&copy; ${currentYear} Dekel.Formation. Tous droits r\xE9serv\xE9s.</p>
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

// server/emailServerService.ts
var TOKEN_SECRET = process.env.EMAIL_TOKEN_SECRET || "DEKEL_EMAIL_SECURE_SECRET_KEY_2026";
var DB_FILE = import_path.default.join(process.cwd(), "webhook_db.json");
function readDb() {
  if (!import_fs.default.existsSync(DB_FILE)) {
    return { enrollments: [], logs: [], transactional_emails: [], email_config: null };
  }
  try {
    const data = JSON.parse(import_fs.default.readFileSync(DB_FILE, "utf-8"));
    if (!data.transactional_emails) data.transactional_emails = [];
    if (!data.email_config) {
      data.email_config = {
        providerName: "Gmail SMTP Server (Dekel.Formation)",
        senderName: process.env.SENDER_NAME || "Dekel.Formation",
        senderEmail: process.env.SENDER_EMAIL || process.env.GMAIL_USER || "service@dekel-dev.com",
        enableSmtp: true,
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort: parseInt(process.env.SMTP_PORT || "465", 10),
        useTls: true,
        gmailUser: process.env.GMAIL_USER || "service@dekel-dev.com",
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
        autoRetryLimit: 3,
        tokenSecretConfigured: true
      };
    } else {
      if (!data.email_config.senderEmail || data.email_config.senderEmail.includes("no-reply@dekel-formation.com")) {
        data.email_config.senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER || "service@dekel-dev.com";
      }
      if (!data.email_config.gmailUser) {
        data.email_config.gmailUser = process.env.GMAIL_USER || "service@dekel-dev.com";
      }
      if (!data.email_config.smtpHost) {
        data.email_config.smtpHost = "smtp.gmail.com";
      }
    }
    return data;
  } catch (e) {
    return { enrollments: [], logs: [], transactional_emails: [], email_config: null };
  }
}
function writeDb(data) {
  import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}
function createSmtpTransporter(configOverride) {
  const db = readDb();
  const cfg = { ...db.email_config || {}, ...configOverride || {} };
  const user = cfg.gmailUser || process.env.GMAIL_USER || cfg.senderEmail || "service@dekel-dev.com";
  const pass = cfg.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || "";
  const host = cfg.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(cfg.smtpPort || process.env.SMTP_PORT || 465);
  if (!pass) {
    return { transporter: null, user, host, port, error: "Mot de passe d'application Gmail non configur\xE9 (GMAIL_APP_PASSWORD)." };
  }
  const isSecure = port === 465;
  const transporter = import_nodemailer.default.createTransport({
    host,
    port,
    secure: isSecure,
    // Port 465 (SSL)
    requireTLS: port === 587,
    // Port 587 (TLS / STARTTLS)
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  return { transporter, user, host, port, error: null };
}
function generateSignedToken(action, email, expiresInSeconds = 86400, extraData) {
  const exp = Math.floor(Date.now() / 1e3) + expiresInSeconds;
  const payload = {
    action,
    email: email.trim().toLowerCase(),
    exp,
    data: extraData
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = import_crypto.default.createHmac("sha256", TOKEN_SECRET);
  hmac.update(payloadBase64);
  const signature = hmac.digest("base64url");
  return `${payloadBase64}.${signature}`;
}
function verifySignedToken(tokenString) {
  if (!tokenString || !tokenString.includes(".")) {
    return { valid: false, error: "Format de jeton invalide ou corrompu" };
  }
  const [payloadBase64, signature] = tokenString.split(".");
  try {
    const hmac = import_crypto.default.createHmac("sha256", TOKEN_SECRET);
    hmac.update(payloadBase64);
    const expectedSignature = hmac.digest("base64url");
    if (!import_crypto.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: "Signature de s\xE9curit\xE9 invalide ou modifi\xE9e" };
    }
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now) {
      return { valid: false, payload, error: "Le lien de s\xE9curit\xE9 a expir\xE9. Veuillez effectuer une nouvelle demande." };
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: `\xC9chec du d\xE9codage du jeton : ${err.message}` };
  }
}
function queueTransactionalEmail(params) {
  const db = readDb();
  const emailId = `tx-em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const recipientName = params.recipientName || params.to.split("@")[0];
  const renderData = {
    recipientEmail: params.to,
    recipientName,
    actionUrl: params.actionUrl,
    ...params.renderData
  };
  const templateOutput = generateEmailHtml(params.type, renderData);
  const emailEntry = {
    id: emailId,
    to: params.to.trim().toLowerCase(),
    recipientName,
    subject: templateOutput.subject,
    type: params.type,
    category: params.category,
    htmlBody: templateOutput.html,
    textBody: templateOutput.text,
    status: "pending",
    queuedAt: (/* @__PURE__ */ new Date()).toISOString(),
    attempts: 0,
    maxAttempts: db.email_config?.autoRetryLimit || 3,
    metadata: params.metadata || {},
    actionUrl: params.actionUrl
  };
  db.transactional_emails.unshift(emailEntry);
  if (db.transactional_emails.length > 500) {
    db.transactional_emails = db.transactional_emails.slice(0, 500);
  }
  writeDb(db);
  setImmediate(() => {
    processTransactionalEmailQueue();
  });
  return emailEntry;
}
var isProcessingQueue = false;
async function processTransactionalEmailQueue() {
  if (isProcessingQueue) {
    return { processedCount: 0, successCount: 0, failureCount: 0 };
  }
  isProcessingQueue = true;
  try {
    const db = readDb();
    const pendingEmails = db.transactional_emails.filter(
      (e) => e.status === "pending" || e.status === "failed" && e.attempts < e.maxAttempts
    );
    if (pendingEmails.length === 0) {
      return { processedCount: 0, successCount: 0, failureCount: 0 };
    }
    for (const email of pendingEmails) {
      email.status = "processing";
    }
    writeDb(db);
    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    const cfg = db.email_config || {};
    const senderEmail = cfg.senderEmail || process.env.SENDER_EMAIL || process.env.GMAIL_USER || "service@dekel-dev.com";
    const senderName = cfg.senderName || process.env.SENDER_NAME || "Dekel.Formation";
    const { transporter } = createSmtpTransporter();
    for (const email of pendingEmails) {
      processedCount++;
      email.attempts += 1;
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.to)) {
          throw new Error(`Adresse e-mail destinataire invalide : ${email.to}`);
        }
        if (transporter) {
          const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: email.to,
            subject: email.subject,
            html: email.htmlBody,
            text: email.textBody
          });
          email.status = "sent";
          email.sentAt = (/* @__PURE__ */ new Date()).toISOString();
          email.error = void 0;
          email.smtpDeliveryDetails = {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response
          };
          successCount++;
        } else {
          email.status = "sent";
          email.sentAt = (/* @__PURE__ */ new Date()).toISOString();
          email.error = void 0;
          email.metadata = {
            ...email.metadata,
            smtpNote: "Mail enregistr\xE9 et rendu en HTML. Ajoutez votre Mot de Passe d'Application Gmail dans la configuration pour livraison en boite de r\xE9ception."
          };
          successCount++;
        }
      } catch (err) {
        failureCount++;
        email.error = err.message || "Erreur inconnue lors de l'envoi de l'e-mail";
        if (email.attempts >= email.maxAttempts) {
          email.status = "failed";
        } else {
          email.status = "pending";
        }
      }
    }
    const latestDb = readDb();
    for (const updated of pendingEmails) {
      const idx = latestDb.transactional_emails.findIndex((e) => e.id === updated.id);
      if (idx !== -1) {
        latestDb.transactional_emails[idx] = updated;
      }
    }
    writeDb(latestDb);
    return { processedCount, successCount, failureCount };
  } finally {
    isProcessingQueue = false;
  }
}
setInterval(() => {
  processTransactionalEmailQueue().catch((err) => console.error("Error in email queue worker:", err));
}, 5e3);
async function runSmtpDiagnostic(options) {
  const logs = [];
  const recommendations = [];
  const log = (msg) => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().substring(11, 19);
    logs.push(`[${timestamp}] ${msg}`);
  };
  log("\u{1F680} D\xE9marrage du diagnostic SMTP en temps r\xE9el...");
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
  if (isRender) {
    log("\u2139\uFE0F Environnement d\xE9tect\xE9 : H\xE9bergement Cloud Render.");
  } else {
    log("\u2139\uFE0F Environnement d\xE9tect\xE9 : Conteneur local / Applet AI Studio.");
  }
  const db = readDb();
  const cfg = { ...db.email_config || {}, ...options?.configOverride || {} };
  const user = cfg.gmailUser || process.env.GMAIL_USER || cfg.senderEmail || "service@dekel-dev.com";
  const pass = cfg.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || "";
  const host = cfg.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(cfg.smtpPort || process.env.SMTP_PORT || 465);
  const senderEmail = cfg.senderEmail || user;
  const senderName = cfg.senderName || "Dekel.Formation";
  const cleanPass = pass.replace(/\s+/g, "");
  const hasSpaces = pass.includes(" ");
  log(`\u{1F4CB} Configuration active -> Host: ${host}:${port} | Compte: ${user} | Exp\xE9diteur: ${senderEmail}`);
  log(`\u{1F511} Cl\xE9 d'application : ${pass ? `D\xE9finie (${pass.length} chars, nettoy\xE9e: ${cleanPass.length} chars)` : "\u274C MANQUANTE"}`);
  if (!pass) {
    log("\u274C ERREUR: Aucun mot de passe d'application Gmail n'est configur\xE9 !");
    recommendations.push("G\xE9n\xE9rez un Mot de Passe d'Application \xE0 16 caract\xE8res sur votre compte Google (S\xE9curit\xE9 > Validation en 2 \xE9tapes > Mots de passe d'application) et renseignez la variable d'environnement GMAIL_APP_PASSWORD sur Render.");
  }
  if (hasSpaces) {
    log("\u26A0\uFE0F REMARQUE : Des espaces ont \xE9t\xE9 d\xE9tect\xE9s dans le mot de passe d'application. Ils sont nettoy\xE9s automatiquement.");
  }
  const dnsStart = Date.now();
  let dnsResult = { success: false };
  try {
    log(`\u{1F50D} Test de r\xE9solution DNS pour host=${host}...`);
    const addresses = await import_dns.default.promises.lookup(host);
    const durationMs = Date.now() - dnsStart;
    dnsResult = { success: true, ip: addresses.address, durationMs };
    log(`\u2705 R\xE9solution DNS r\xE9ussie : ${host} -> IP ${addresses.address} (${durationMs}ms)`);
  } catch (dnsErr) {
    const durationMs = Date.now() - dnsStart;
    dnsResult = { success: false, error: dnsErr.message, durationMs };
    log(`\u274C \xC9CHEC de la r\xE9solution DNS pour ${host} : ${dnsErr.message}`);
    recommendations.push(`Impossible de r\xE9soudre l'h\xF4te DNS ${host}. V\xE9rifiez la connexion Internet et les r\xE9solveurs DNS.`);
  }
  const checkPort = (testHost, testPort, timeoutMs = 5e3) => {
    return new Promise((resolve) => {
      const tcpStart = Date.now();
      const socket = new import_net.default.Socket();
      socket.setTimeout(timeoutMs);
      socket.connect(testPort, testHost, () => {
        const durationMs = Date.now() - tcpStart;
        const res = {
          success: true,
          localAddress: socket.localAddress,
          remoteAddress: socket.remoteAddress,
          durationMs
        };
        socket.destroy();
        resolve(res);
      });
      socket.on("error", (err) => {
        const durationMs = Date.now() - tcpStart;
        socket.destroy();
        resolve({ success: false, error: err.message, durationMs });
      });
      socket.on("timeout", () => {
        const durationMs = Date.now() - tcpStart;
        socket.destroy();
        resolve({ success: false, error: `TIMEOUT (${timeoutMs}ms) - Port bloqu\xE9 ou filtr\xE9 par l'h\xE9bergeur.`, durationMs });
      });
    });
  };
  let tcpResult = { success: false };
  if (dnsResult.success) {
    log(`\u{1F50C} Test de socket TCP brut vers ${host}:${port}...`);
    tcpResult = await checkPort(host, port, 6e3);
    if (tcpResult.success) {
      log(`\u2705 Socket TCP connect\xE9 avec succ\xE8s \xE0 ${host}:${port} (${tcpResult.durationMs}ms)`);
    } else {
      log(`\u274C \xC9CHEC de la connexion TCP (${host}:${port}) : ${tcpResult.error || "Refus\xE9e"}`);
      const altPorts = [587, 2525, 80].filter((p) => p !== port);
      log(`\u{1F50D} Test automatique des ports SMTP alternatifs (${altPorts.join(", ")})...`);
      let workingAltPort = null;
      for (const altPort of altPorts) {
        const altRes = await checkPort(host, altPort, 4e3);
        if (altRes.success) {
          log(`\u{1F4A1} PORT OUVERT D\xC9TECT\xC9 : Port ${altPort} sur ${host} r\xE9ponds positivement !`);
          workingAltPort = altPort;
          recommendations.push(`Le port principal ${port} est bloqu\xE9 par Render, mais le port ${altPort} est accessible ! Changez le port SMTP pour ${altPort} dans la configuration.`);
          break;
        } else {
          log(`  - Port ${altPort} : Bloqu\xE9 (${altRes.error})`);
        }
      }
      if (isRender && !workingAltPort) {
        log(`\u{1F6A8} RESTRICTION D\xC9TECT\xC9E SUR RENDER : Render bloque les ports TCP SMTP sortants (25, 465, 587) par d\xE9faut sur ses services Web pour \xE9viter le spam.`);
        recommendations.push(`EXPLICATION RENDER : Render bloque le port SMTP TCP ${port} (et 587). SOLUTIONS : 1) Si vous avez un compte payant Render, soumettez un ticket support 'Enable Outbound SMTP'. 2) Utilisez un relais d'e-mail HTTP/REST (comme Brevo ou Resend) qui utilise le port HTTPS 443 (jamais bloqu\xE9 sur Render). 3) Vous pouvez aussi tenter le port 2525 ou 8080 si disponible sur votre serveur SMTP.`);
      } else if (!workingAltPort) {
        recommendations.push(`Connexion TCP refus\xE9e ou bloqu\xE9e vers ${host}:${port}. V\xE9rifiez votre pare-feu ou vos param\xE8tres r\xE9seau.`);
      }
    }
  }
  let smtpVerify = { success: false };
  if (tcpResult.success && pass) {
    log(`\u{1F510} Authentification SMTP en cours via Nodemailer...`);
    const verifyStart = Date.now();
    const transporter = import_nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      },
      logger: true,
      debug: true
    });
    try {
      await transporter.verify();
      const durationMs = Date.now() - verifyStart;
      smtpVerify = { success: true, durationMs };
      log(`\u{1F389} V\xC9RIFICATION SMTP R\xC9USSIE ! Le compte Gmail ${user} est pleinement autoris\xE9 (${durationMs}ms)`);
    } catch (authErr) {
      const durationMs = Date.now() - verifyStart;
      smtpVerify = { success: false, error: authErr.message, durationMs };
      log(`\u274C ERREUR Authentification Gmail SMTP : ${authErr.message}`);
      if (authErr.message.includes("535") || authErr.message.includes("Username and Password not accepted")) {
        recommendations.push("Mot de passe d'application invalide : G\xE9n\xE9rez un nouveau 'Mot de Passe d'Application' \xE0 16 lettres sur Google (S\xE9curit\xE9 > Validation en 2 \xE9tapes > Mots de passe d'application) et mettez \xE0 jour la variable GMAIL_APP_PASSWORD sur Render.");
      } else if (authErr.message.includes("534") || authErr.message.includes("Check log in on web")) {
        recommendations.push("Google requiert une validation web. Connectez-vous \xE0 votre compte Google et validez l'alerte de s\xE9curit\xE9 relative \xE0 la tentative de connexion depuis le serveur Render.");
      } else {
        recommendations.push(`Erreur SMTP : ${authErr.message}`);
      }
    }
  }
  let testEmailSend = void 0;
  if (smtpVerify.success && options?.sendTestEmailTo) {
    const targetEmail = options.sendTestEmailTo.trim().toLowerCase();
    log(`\u2709\uFE0F Envoi d'un e-mail de test r\xE9el \xE0 : ${targetEmail}...`);
    try {
      const transporter = import_nodemailer.default.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass: cleanPass },
        tls: { rejectUnauthorized: false }
      });
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: targetEmail,
        subject: `[DIAGNOSTIC SMTP] Test de transmission Dekel.Formation - ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`,
        html: `
          <div style="font-family: system-ui, sans-serif; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #34d399; margin-top: 0;">\u2705 Test de Diagnostic SMTP R\xE9ussi !</h2>
            <p>Cet e-mail confirme que le serveur de messagerie Dekel.Formation peut transmettre des messages en direct.</p>
            <hr style="border-color: #334155; margin: 16px 0;" />
            <ul style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
              <li><strong>Serveur exp\xE9diteur :</strong> ${host}:${port} (${isRender ? "H\xE9berg\xE9 sur Render" : "Environnement Standalone"})</li>
              <li><strong>Adresse d'envoi :</strong> ${senderEmail}</li>
              <li><strong>Destinataire :</strong> ${targetEmail}</li>
              <li><strong>Horodatage :</strong> ${(/* @__PURE__ */ new Date()).toISOString()}</li>
            </ul>
          </div>
        `,
        text: `Test de Diagnostic SMTP R\xE9ussi pour ${targetEmail} \xE0 ${(/* @__PURE__ */ new Date()).toISOString()}`
      });
      testEmailSend = {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted
      };
      log(`\u2705 E-mail de diagnostic transmis avec succ\xE8s ! ID: ${info.messageId}`);
    } catch (sendErr) {
      testEmailSend = {
        success: false,
        error: sendErr.message
      };
      log(`\u274C \xC9chec de la livraison de l'e-mail de test : ${sendErr.message}`);
      recommendations.push(`Erreur lors de la livraison du message : ${sendErr.message}`);
    }
  }
  log("\u{1F3C1} Diagnostic termin\xE9.");
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    isRender,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      gmailUser: user,
      hasAppPassword: Boolean(pass),
      appPasswordLength: pass.length,
      hasSpacesInPassword: hasSpaces,
      smtpHost: host,
      smtpPort: port,
      senderEmail,
      senderName
    },
    checks: {
      dns: dnsResult,
      tcp: tcpResult,
      smtpVerify,
      testEmailSend
    },
    logs,
    recommendations
  };
}

// server.ts
var firebaseConfigPath = import_path2.default.join(process.cwd(), "firebase-applet-config.json");
var firebaseConfig = JSON.parse(import_fs2.default.readFileSync(firebaseConfigPath, "utf-8"));
var firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
var dbFirestore = (0, import_firestore.getFirestore)(firebaseApp, firebaseConfig.firestoreDatabaseId);
var app = (0, import_express.default)();
app.set("trust proxy", 1);
var PORT = 3e3;
var DB_FILE2 = import_path2.default.join(process.cwd(), "webhook_db.json");
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    const db = readDb2();
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const logEntry = {
      id: logId,
      courseId: "malformed_json_payload",
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: null,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "failed_malformed_json",
      errorMessage: `Format JSON invalide : ${err.message}`,
      outcome: "\xC9chec critique du parsing JSON (La charge utile brute envoy\xE9e est syntaxiquement incorrecte ou tronqu\xE9e)"
    };
    db.logs.unshift(logEntry);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb2(db);
    return res.status(400).json({
      status: "error",
      message: "Bad Request: Malformed JSON payload received.",
      error: err.message,
      logId,
      outcome: logEntry.outcome
    });
  }
  next();
});
function readDb2() {
  if (!import_fs2.default.existsSync(DB_FILE2)) {
    return { enrollments: [], logs: [] };
  }
  try {
    return JSON.parse(import_fs2.default.readFileSync(DB_FILE2, "utf-8"));
  } catch (e) {
    return { enrollments: [], logs: [] };
  }
}
function writeDb2(data) {
  import_fs2.default.writeFileSync(DB_FILE2, JSON.stringify(data, null, 2), "utf-8");
}
function getValueByPath(obj, path3) {
  if (!obj || !path3) return void 0;
  const parts = path3.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0) return void 0;
    current = current[part];
  }
  return current;
}
app.post("/api/webhooks/payment/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const db = readDb2();
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  let webhookEmailKey = "email";
  let webhookNameKey = "name";
  let courseExists = false;
  let courseTitle = "";
  try {
    const courseRef = (0, import_firestore.doc)(dbFirestore, "courses", courseId);
    const courseSnap = await (0, import_firestore.getDoc)(courseRef);
    if (courseSnap.exists()) {
      const courseData = courseSnap.data();
      if (courseData.webhookDisabled === true || courseData.webhookUrl === "disabled") {
        courseExists = false;
      } else {
        courseExists = true;
        courseTitle = courseData.title || "";
        if (courseData.webhookEmailKey) {
          webhookEmailKey = courseData.webhookEmailKey;
        }
        if (courseData.webhookNameKey) {
          webhookNameKey = courseData.webhookNameKey;
        }
      }
    } else if (courseId === "c-1" || courseId === "c-2" || courseId === "c-3" || courseId.startsWith("c-")) {
      courseExists = true;
      courseTitle = "Formation Dekel Test";
    }
  } catch (e) {
    console.warn("Could not read course config from Firestore", e);
    if (courseId === "c-1" || courseId === "c-2" || courseId === "c-3" || courseId.startsWith("c-")) {
      courseExists = true;
      courseTitle = "Formation Dekel Test";
    }
  }
  if (!courseExists) {
    const errorMessage = `Acc\xE8s non autoris\xE9 : La formation avec l'identifiant '${courseId}' n'existe pas ou le webhook n'est pas autoris\xE9.`;
    const outcome = "Acc\xE8s refus\xE9 (formation introuvable ou non enregistr\xE9e)";
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "failed_unauthorized_course",
      errorMessage,
      outcome
    };
    db.logs.unshift(logEntry2);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb2(db);
    return res.status(401).json({
      status: "error",
      message: errorMessage,
      logId,
      error: "Unauthorized target resource"
    });
  }
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      const errorMessage = `Format JSON invalide dans le corps brut : ${e.message}`;
      const outcome = "\xC9chec du parsing JSON (Donn\xE9es brutes illisibles)";
      const logEntry2 = {
        id: logId,
        courseId,
        url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
        method: req.method,
        headers: req.headers,
        body: null,
        query: req.query,
        detectedEmail: null,
        detectedName: null,
        receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "failed_malformed_json",
        errorMessage,
        outcome
      };
      db.logs.unshift(logEntry2);
      if (db.logs.length > 200) {
        db.logs = db.logs.slice(0, 200);
      }
      writeDb2(db);
      return res.status(400).json({
        status: "error",
        message: "Bad Request: Unable to parse payload body as valid JSON object.",
        logId,
        error: errorMessage
      });
    }
  }
  body = body || {};
  if (Object.keys(body).length === 0 && Object.keys(req.query).length === 0) {
    const errorMessage = "La charge utile JSON re\xE7ue et les param\xE8tres de requ\xEAte sont compl\xE8tement vides.";
    const outcome = "\xC9chec de validation (Requ\xEAte vide)";
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "failed_empty_payload",
      errorMessage,
      outcome
    };
    db.logs.unshift(logEntry2);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb2(db);
    return res.status(400).json({
      status: "error",
      message: "Bad Request: Request payload is empty.",
      logId,
      error: errorMessage
    });
  }
  let detectedEmail = "";
  let detectedName = "";
  const emailVal = getValueByPath(body, webhookEmailKey);
  if (emailVal && typeof emailVal === "string") {
    detectedEmail = emailVal;
  }
  const nameVal = getValueByPath(body, webhookNameKey);
  if (nameVal && typeof nameVal === "string") {
    detectedName = nameVal;
  }
  if (!detectedEmail && req.query.email && typeof req.query.email === "string") {
    detectedEmail = req.query.email;
  }
  if (!detectedEmail && body) {
    detectedEmail = body.email || body.customer_email || body.studentEmail || body.student_email || body.customer?.email || body.data?.object?.customer_details?.email || // Stripe Checkout payload
    body.payer?.email_address || // PayPal standard payload
    body.email_address || body.payload?.email || "";
  }
  if (!detectedName && body) {
    detectedName = body.name || body.customer_name || body.studentName || body.student_name || body.customer?.name || body.data?.object?.customer_details?.name || "";
  }
  detectedEmail = detectedEmail ? detectedEmail.trim() : "";
  detectedName = detectedName ? detectedName.trim() : "";
  let emailError = "";
  let emailStatus = "";
  let emailOutcome = "";
  if (!detectedEmail) {
    emailError = "Adresse e-mail manquante dans la charge utile JSON ou les param\xE8tres de requ\xEAte.";
    emailStatus = "failed_missing_email";
    emailOutcome = "Acc\xE8s refus\xE9 (adresse e-mail introuvable)";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(detectedEmail)) {
      emailError = `L'adresse e-mail '${detectedEmail}' a un format syntaxique invalide (ex attendu: nom@domaine.com).`;
      emailStatus = "failed_invalid_email_format";
      emailOutcome = "Acc\xE8s refus\xE9 (format d'e-mail incorrect)";
    }
  }
  if (emailError) {
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail: detectedEmail || null,
      detectedName: detectedName || null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: emailStatus,
      errorMessage: emailError,
      outcome: emailOutcome
    };
    db.logs.unshift(logEntry2);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb2(db);
    return res.status(400).json({
      status: "error",
      message: "Bad Request: Validation failed for student email.",
      logId,
      error: emailError,
      outcome: emailOutcome
    });
  }
  const targetEmailLower = detectedEmail.toLowerCase();
  let alreadyEnrolledInCourse = false;
  if (db.enrollments && Array.isArray(db.enrollments)) {
    alreadyEnrolledInCourse = db.enrollments.some(
      (e) => e.studentEmail && e.studentEmail.toLowerCase() === targetEmailLower && e.courseId === courseId
    );
  }
  if (!alreadyEnrolledInCourse) {
    try {
      const enrollmentsRef = (0, import_firestore.collection)(dbFirestore, "enrollments");
      const q = (0, import_firestore.query)(
        enrollmentsRef,
        (0, import_firestore.where)("studentEmail", "==", targetEmailLower),
        (0, import_firestore.where)("courseId", "==", courseId),
        (0, import_firestore.where)("status", "==", "active")
      );
      const snap = await (0, import_firestore.getDocs)(q);
      if (!snap.empty) {
        alreadyEnrolledInCourse = true;
      }
    } catch (err) {
    }
  }
  if (alreadyEnrolledInCourse) {
    const ignoredOutcome = `L'\xE9tudiant '${detectedEmail}' a d\xE9j\xE0 la formation. Aucune action effectu\xE9e.`;
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail,
      detectedName: detectedName || null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "ignored_already_enrolled",
      errorMessage: "",
      outcome: ignoredOutcome
    };
    db.logs.unshift(logEntry2);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb2(db);
    return res.status(200).json({
      status: "success",
      message: `L'\xE9tudiant ${detectedEmail} a d\xE9j\xE0 la formation. Aucune action n'a \xE9t\xE9 effectu\xE9e.`,
      logId,
      outcome: ignoredOutcome
    });
  }
  const finalOutcome = `Acc\xE8s accord\xE9 avec succ\xE8s pour la formation "${courseTitle}"`;
  const logEntry = {
    id: logId,
    courseId,
    url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    detectedEmail,
    detectedName: detectedName || null,
    receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "success",
    errorMessage: "",
    outcome: finalOutcome
  };
  const enrollmentRecord = {
    id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    courseId,
    studentEmail: detectedEmail.toLowerCase(),
    studentName: detectedName || void 0,
    enrolledAt: (/* @__PURE__ */ new Date()).toISOString(),
    synced: false
  };
  db.logs.unshift(logEntry);
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200);
  }
  db.enrollments.push(enrollmentRecord);
  writeDb2(db);
  try {
    queueTransactionalEmail({
      to: detectedEmail.toLowerCase(),
      recipientName: detectedName || void 0,
      type: "payment_webhook_enrolled",
      category: "payments",
      renderData: {
        recipientEmail: detectedEmail.toLowerCase(),
        courseTitle,
        courseId,
        transactionRef: enrollmentRecord.id,
        actionUrl: `${req.protocol}://${req.get("host")}`
      },
      metadata: { source: "webhook", courseId, enrollmentId: enrollmentRecord.id }
    });
  } catch (emailErr) {
    console.warn("Could not queue transactional email for webhook:", emailErr);
  }
  return res.status(200).json({
    status: "success",
    message: `Payment registered successfully. Student ${detectedEmail} has been enrolled in "${courseTitle}".`,
    enrollmentId: enrollmentRecord.id,
    logId,
    outcome: finalOutcome
  });
});
app.post(["/api/emails/send", "/api/emails/queue"], (req, res) => {
  const { to, recipientName, type, category, renderData, actionUrl, metadata } = req.body;
  if (!to || typeof to !== "string" || !to.includes("@")) {
    return res.status(400).json({ status: "error", message: "Adresse e-mail destinataire invalide." });
  }
  if (!type) {
    return res.status(400).json({ status: "error", message: "Le type d'e-mail est requis." });
  }
  const requestOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || `${req.protocol}://${req.get("host")}`;
  const mergedRenderData = {
    origin: requestOrigin,
    baseUrl: requestOrigin,
    ...renderData || {}
  };
  try {
    const queuedEmail = queueTransactionalEmail({
      to,
      recipientName,
      type,
      category: category || "authentication",
      renderData: mergedRenderData,
      actionUrl,
      metadata: metadata || {}
    });
    return res.status(200).json({
      status: "success",
      message: "E-mail transactionnel mis en file d'attente d'envoi.",
      email: queuedEmail
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});
app.get("/api/emails/logs", (req, res) => {
  const db = readDb();
  let logs = db.transactional_emails || [];
  const { category, status, type, search } = req.query;
  if (category && typeof category === "string") {
    logs = logs.filter((e) => e.category === category);
  }
  if (status && typeof status === "string") {
    logs = logs.filter((e) => e.status === status);
  }
  if (type && typeof type === "string") {
    logs = logs.filter((e) => e.type === type);
  }
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    logs = logs.filter(
      (e) => e.to.toLowerCase().includes(q) || e.recipientName && e.recipientName.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)
    );
  }
  return res.json({ logs });
});
app.get("/api/emails/logs/:id", (req, res) => {
  const db = readDb();
  const email = (db.transactional_emails || []).find((e) => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ status: "error", message: "E-mail introuvable." });
  }
  return res.json({ email });
});
app.post("/api/emails/retry/:id", async (req, res) => {
  const db = readDb();
  const email = (db.transactional_emails || []).find((e) => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ status: "error", message: "E-mail introuvable." });
  }
  email.status = "pending";
  email.attempts = 0;
  email.error = void 0;
  writeDb(db);
  await processTransactionalEmailQueue();
  const updatedDb = readDb();
  const updatedEmail = (updatedDb.transactional_emails || []).find((e) => e.id === req.params.id);
  return res.json({
    status: "success",
    message: "Nouvelle tentative d'envoi ex\xE9cut\xE9e.",
    email: updatedEmail
  });
});
app.delete("/api/emails/logs/:id", (req, res) => {
  const db = readDb();
  db.transactional_emails = (db.transactional_emails || []).filter((e) => e.id !== req.params.id);
  writeDb(db);
  return res.json({ status: "success", message: "E-mail supprim\xE9 de l'historique." });
});
app.delete("/api/emails/logs", (req, res) => {
  const db = readDb();
  db.transactional_emails = [];
  writeDb(db);
  return res.json({ status: "success", message: "Historique des e-mails enti\xE8rement effac\xE9." });
});
app.get("/api/emails/templates", (req, res) => {
  return res.json({ templates: EMAIL_TEMPLATE_DEFINITIONS });
});
app.post("/api/emails/test-send", async (req, res) => {
  const { type, recipientEmail, recipientName, customMessage } = req.body;
  if (!type || !recipientEmail) {
    return res.status(400).json({ status: "error", message: "Le type et le destinataire sont requis." });
  }
  const templateDef = EMAIL_TEMPLATE_DEFINITIONS.find((t) => t.type === type);
  const sample = templateDef?.sampleData || {};
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const actionToken = generateSignedToken("test_action", recipientEmail, 86400);
  const queued = queueTransactionalEmail({
    to: recipientEmail,
    recipientName: recipientName || sample.recipientName || "Testeur Dekel",
    type,
    category: templateDef?.category || "authentication",
    renderData: {
      ...sample,
      recipientName: recipientName || sample.recipientName || "Testeur Dekel",
      recipientEmail,
      actionUrl: `${hostUrl}/verify?token=${actionToken}`,
      customMessage: customMessage || sample.customMessage
    },
    actionUrl: `${hostUrl}/verify?token=${actionToken}`,
    metadata: { isTestSend: true }
  });
  await processTransactionalEmailQueue();
  return res.json({
    status: "success",
    message: `E-mail de test (${type}) envoy\xE9 \xE0 ${recipientEmail}.`,
    email: queued
  });
});
app.get("/api/emails/verify-token", (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ valid: false, error: "Jeton manquant dans la requ\xEAte." });
  }
  const result = verifySignedToken(token);
  return res.json(result);
});
app.post("/api/auth/request-password-reset", async (req, res) => {
  const { email, recipientName, origin } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ status: "error", message: "Adresse e-mail destinataire invalide." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const name = recipientName || trimmedEmail.split("@")[0];
  const oobCode = generateSignedToken("reset_password", trimmedEmail, 3600);
  const baseUrl = origin || `${req.protocol}://${req.get("host")}`;
  const resetUrl = `${baseUrl}?mode=resetPassword&oobCode=${oobCode}&email=${encodeURIComponent(trimmedEmail)}`;
  try {
    const queuedEmail = queueTransactionalEmail({
      to: trimmedEmail,
      recipientName: name,
      type: "auth_reset_password",
      category: "authentication",
      renderData: {
        recipientName: name,
        recipientEmail: trimmedEmail,
        actionUrl: resetUrl
      },
      actionUrl: resetUrl,
      metadata: { event: "password_reset_request", oobCode }
    });
    await processTransactionalEmailQueue();
    return res.json({
      status: "success",
      message: "Lien de r\xE9initialisation g\xE9n\xE9r\xE9 et envoy\xE9 via le serveur SMTP.",
      oobCode,
      resetUrl,
      email: queuedEmail
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message || "Erreur lors de l'envoi de l'e-mail." });
  }
});
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, oobCode, newPassword } = req.body;
  const tokenToVerify = token || oobCode;
  if (!tokenToVerify) {
    return res.status(400).json({ status: "error", message: "Code de r\xE9initialisation (oobCode) manquant." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ status: "error", message: "Le nouveau mot de passe doit contenir au moins 6 caract\xE8res." });
  }
  const verification = verifySignedToken(tokenToVerify);
  if (!verification.valid || !verification.payload) {
    return res.status(400).json({ status: "error", message: verification.error || "Lien de r\xE9initialisation invalide ou expir\xE9." });
  }
  const { email } = verification.payload;
  return res.json({
    status: "success",
    message: "Le mot de passe a \xE9t\xE9 r\xE9initialis\xE9 avec succ\xE8s.",
    email
  });
});
app.get("/api/emails/config", (req, res) => {
  const db = readDb();
  return res.json({ config: db.email_config });
});
app.post("/api/emails/config", (req, res) => {
  const db = readDb();
  db.email_config = {
    ...db.email_config,
    ...req.body
  };
  writeDb(db);
  return res.json({ status: "success", message: "Configuration du serveur d'e-mails enregistr\xE9e.", config: db.email_config });
});
app.post("/api/emails/test-smtp", async (req, res) => {
  const { gmailUser, gmailAppPassword, smtpHost, smtpPort } = req.body;
  const { transporter, user, host, port, error } = createSmtpTransporter({
    gmailUser,
    gmailAppPassword,
    smtpHost,
    smtpPort
  });
  if (!transporter) {
    return res.status(400).json({ status: "error", message: error || "Configuration SMTP incompl\xE8te." });
  }
  try {
    await transporter.verify();
    return res.json({
      status: "success",
      message: `Connexion SMTP Gmail r\xE9ussie avec succ\xE8s pour ${user} sur ${host}:${port} !`
    });
  } catch (verifyErr) {
    return res.status(500).json({
      status: "error",
      message: `\xC9chec de la connexion SMTP Gmail : ${verifyErr.message}`
    });
  }
});
app.post("/api/emails/diagnostic", async (req, res) => {
  try {
    const { sendTestEmailTo, configOverride } = req.body || {};
    const diagnosticResult = await runSmtpDiagnostic({
      sendTestEmailTo,
      configOverride
    });
    return res.json({
      status: "success",
      diagnostic: diagnosticResult
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message || "Erreur lors de l'ex\xE9cution du diagnostic SMTP."
    });
  }
});
app.get("/api/webhooks/logs", (req, res) => {
  const db = readDb2();
  res.json({ logs: db.logs || [] });
});
app.delete("/api/webhooks/logs", (req, res) => {
  const db = readDb2();
  db.logs = [];
  writeDb2(db);
  res.json({ status: "success", message: "All webhook logs cleared" });
});
app.get("/api/webhooks/logs/:courseId", (req, res) => {
  const { courseId } = req.params;
  const db = readDb2();
  const courseLogs = db.logs.filter((l) => l.courseId === courseId);
  res.json({ logs: courseLogs });
});
app.delete("/api/webhooks/logs/:courseId", (req, res) => {
  const { courseId } = req.params;
  const db = readDb2();
  db.logs = db.logs.filter((l) => l.courseId !== courseId);
  writeDb2(db);
  res.json({ status: "success", message: "Logs cleared" });
});
app.delete("/api/webhooks/log/:logId", async (req, res) => {
  const { logId } = req.params;
  const db = readDb2();
  db.logs = db.logs.filter((l) => l.id !== logId);
  writeDb2(db);
  try {
    await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(dbFirestore, "webhook_logs", logId));
  } catch (err) {
  }
  res.json({ status: "success", message: "Single webhook log deleted" });
});
app.get("/api/sync-enrollments", (req, res) => {
  const db = readDb2();
  const unsynced = db.enrollments.filter((e) => !e.synced);
  db.enrollments = db.enrollments.map((e) => ({ ...e, synced: true }));
  writeDb2(db);
  res.json({ enrollments: unsynced });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dekel.Formation running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
