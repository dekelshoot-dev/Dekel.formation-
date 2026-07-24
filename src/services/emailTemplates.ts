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
  updateDetails?: string;
  paymentAmount?: string;
  paymentMethod?: string;
  transactionRef?: string;
  roleName?: string;
  accountStatus?: string;
  customMessage?: string;
}

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  // Authentication
  {
    type: 'auth_verify_email',
    category: 'authentication',
    name: 'Vérification d\'adresse e-mail',
    description: 'Envoyé après l\'inscription pour vérifier l\'adresse e-mail de l\'utilisateur avec un lien signé.',
    defaultSubject: 'Vérifiez votre adresse e-mail - Dekel.Formation',
    sampleData: { recipientName: 'Amadou Sow', actionUrl: 'https://dekel-formation.com/verify?token=xyz123' }
  },
  {
    type: 'auth_welcome',
    category: 'authentication',
    name: 'Confirmation de création de compte',
    description: 'Envoyé pour souhaiter la bienvenue à un nouvel utilisateur.',
    defaultSubject: 'Bienvenue sur Dekel.Formation !',
    sampleData: { recipientName: 'Fatou Ndiaye' }
  },
  {
    type: 'auth_reset_password',
    category: 'authentication',
    name: 'Réinitialisation du mot de passe',
    description: 'Envoyé lorsque l\'utilisateur demande la réinitialisation de son mot de passe.',
    defaultSubject: 'Réinitialisation de votre mot de passe - Dekel.Formation',
    sampleData: { recipientName: 'Moussa Diallo', actionUrl: 'https://dekel-formation.com/reset-password?token=abc456' }
  },
  {
    type: 'auth_email_changed',
    category: 'authentication',
    name: 'Modification de l\'adresse e-mail',
    description: 'Alerte de sécurité envoyée lorsque l\'adresse e-mail d\'un compte est mise à jour.',
    defaultSubject: 'Mise à jour de votre adresse e-mail - Dekel.Formation',
    sampleData: { recipientName: 'Sophie Koné', customMessage: 'Votre ancienne adresse : sophie@old.com' }
  },
  {
    type: 'auth_password_changed',
    category: 'authentication',
    name: 'Confirmation de changement de mot de passe',
    description: 'Alerte de sécurité confirmant que le mot de passe a été modifié avec succès.',
    defaultSubject: 'Votre mot de passe a été modifié avec succès',
    sampleData: { recipientName: 'Jean Dupont' }
  },

  // Courses
  {
    type: 'course_enrollment_confirm',
    category: 'courses',
    name: 'Confirmation d\'inscription à une formation',
    description: 'Envoyé lorsqu\'un élève rejoint une nouvelle formation.',
    defaultSubject: 'Confirmation d\'accès : {{courseTitle}}',
    sampleData: { recipientName: 'Aïcha Traoré', courseTitle: 'Maîtriser Canva & Design Graphique', trainerName: 'Jean Formateur' }
  },
  {
    type: 'course_manual_add',
    category: 'courses',
    name: 'Ajout manuel par un formateur',
    description: 'Envoyé lorsqu\'un formateur ajoute manuellement un élève à un cours.',
    defaultSubject: 'Un formateur vous a inscrit à {{courseTitle}}',
    sampleData: { recipientName: 'Ibrahima Ba', courseTitle: 'Copywriting Ultra-Convaincant', trainerName: 'Marie Formatrice' }
  },
  {
    type: 'course_access_granted',
    category: 'courses',
    name: 'Accès accordé à une formation',
    description: 'Notification d\'activation des droits de visionnage d\'un cours.',
    defaultSubject: 'Accès débloqué pour la formation {{courseTitle}}',
    sampleData: { recipientName: 'Khadija Sarr', courseTitle: 'Publicité Facebook & Instagram Ads' }
  },
  {
    type: 'course_access_revoked',
    category: 'courses',
    name: 'Accès retiré à une formation',
    description: 'Notification lorsque l\'accès à une formation est suspendu ou révoqué.',
    defaultSubject: 'Modification de votre accès à {{courseTitle}}',
    sampleData: { recipientName: 'Ousmane Cissé', courseTitle: 'Développement Web Fullstack' }
  },

  // Payments
  {
    type: 'payment_received',
    category: 'payments',
    name: 'Réception d\'un paiement',
    description: 'Accusé de réception d\'un paiement (Wave, Orange Money, Carte, Webhook).',
    defaultSubject: 'Paiement reçu pour {{courseTitle}}',
    sampleData: { recipientName: 'Cheikh Sy', courseTitle: 'E-commerce & Dropshipping Africa', paymentAmount: '25 000 FCFA', paymentMethod: 'Wave Sénégal' }
  },
  {
    type: 'payment_validated',
    category: 'payments',
    name: 'Validation définitive du paiement',
    description: 'Confirmation de validation manuelle ou automatique du paiement.',
    defaultSubject: 'Paiement validé - Votre reçu Dekel.Formation',
    sampleData: { recipientName: 'Mariama Diop', courseTitle: 'Formation Freelance & Upwork', paymentAmount: '15 000 FCFA', transactionRef: 'TX-98745' }
  },
  {
    type: 'payment_webhook_enrolled',
    category: 'payments',
    name: 'Inscription automatique via Webhook',
    description: 'Confirmation d\'accès instantané après traitement automatique du webhook de vente.',
    defaultSubject: 'Accès instantané activé : {{courseTitle}}',
    sampleData: { recipientName: 'Bamba Kane', courseTitle: 'Automatisations Make & Zapier', transactionRef: 'WHK-33421' }
  },
  {
    type: 'payment_failed',
    category: 'payments',
    name: 'Échec du paiement',
    description: 'Alerte en cas d\'échec de transaction avec instructions pour réessayer.',
    defaultSubject: 'Échec de transaction pour {{courseTitle}}',
    sampleData: { recipientName: 'Salif Sané', courseTitle: 'Montage Vidéo CapCut & Premiere', paymentAmount: '20 000 FCFA' }
  },

  // Pedagogy
  {
    type: 'pedagogy_course_welcome',
    category: 'pedagogy',
    name: 'Bienvenue dans une formation',
    description: 'Guide d\'accueil avec conseils pédagogiques pour réussir sa formation.',
    defaultSubject: 'Bienvenue dans la formation {{courseTitle}} !',
    sampleData: { recipientName: 'Saliou Diouf', courseTitle: 'Masterclass Intelligence Artificielle', trainerName: 'Jean Formateur' }
  },
  {
    type: 'pedagogy_new_chapter',
    category: 'pedagogy',
    name: 'Publication d\'un nouveau chapitre',
    description: 'Alerte lorsqu\'un nouveau chapitre vidéo/texte est mis en ligne.',
    defaultSubject: 'Nouveau chapitre disponible : {{chapterTitle}}',
    sampleData: { recipientName: 'Kewaye Camara', courseTitle: 'Maîtriser Canva', chapterTitle: 'Créer des visuels 3D professionnels', moduleTitle: 'Module 3 : Visual Design' }
  },
  {
    type: 'pedagogy_new_module',
    category: 'pedagogy',
    name: 'Publication d\'un nouveau module',
    description: 'Alerte lorsqu\'un nouveau module complet de cours est publié.',
    defaultSubject: 'Nouveau module publié dans {{courseTitle}}',
    sampleData: { recipientName: 'Mamadou Faye', courseTitle: 'Marketing Digital', moduleTitle: 'Module 4 : Stratégie TikTok & Reels' }
  },
  {
    type: 'pedagogy_course_updated',
    category: 'pedagogy',
    name: 'Mise à jour importante d\'une formation',
    description: 'Notification des améliorations ou ajouts de ressources dans un cours.',
    defaultSubject: 'Mise à jour disponible pour {{courseTitle}}',
    sampleData: { recipientName: 'Aminata Sow', courseTitle: 'Excel & Analyse de Données', updateDetails: 'Ajout des templates de Dashboard automatisés 2026.' }
  },

  // Administration
  {
    type: 'admin_trainer_invitation',
    category: 'administration',
    name: 'Invitation à devenir formateur',
    description: 'Invitation officielle pour rejoindre l\'équipe de formateurs.',
    defaultSubject: 'Invitation officielle : Devenez Formateur sur Dekel.Formation',
    sampleData: { recipientName: 'Dr. Ousmane Touré', actionUrl: 'https://dekel-formation.com/accept-trainer-invite?token=trn990' }
  },
  {
    type: 'admin_role_changed',
    category: 'administration',
    name: 'Changement de rôle utilisateur',
    description: 'Notification lors du surclassement ou ajustement du rôle (Étudiant, Formateur, Administrateur).',
    defaultSubject: 'Mise à jour de vos privilèges sur Dekel.Formation',
    sampleData: { recipientName: 'Fatoumata Bâ', roleName: 'Formateur' }
  },
  {
    type: 'admin_account_status',
    category: 'administration',
    name: 'Désactivation / Réactivation de compte',
    description: 'Notification du statut du compte utilisateur.',
    defaultSubject: 'Mise à jour du statut de votre compte Dekel.Formation',
    sampleData: { recipientName: 'Modou Ndiaye', accountStatus: 'Actif' }
  }
];

// Master Email Template Generator
export function generateEmailHtml(type: EmailType, data: EmailRenderData): { subject: string; html: string; text: string } {
  const name = data.recipientName || 'Cher membre';
  const appName = 'Dekel.Formation';
  const logoUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop';
  const currentYear = new Date().getFullYear();

  let subject = '';
  let badgeTitle = '';
  let iconEmoji = '✉️';
  let title = '';
  let contentHtml = '';
  let callToActionText = '';
  let callToActionUrl = data.actionUrl || '#';

  switch (type) {
    // AUTHENTICATION
    case 'auth_verify_email':
      subject = 'Vérifiez votre adresse e-mail - Dekel.Formation';
      badgeTitle = 'Authentification & Sécurité';
      iconEmoji = '🔒';
      title = 'Vérification de votre adresse e-mail';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Merci de vous être inscrit sur <strong>${appName}</strong>. Afin de finaliser votre compte et de sécuriser vos accès, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Note de sécurité :</strong> Ce lien de vérification signé est valide pendant 24 heures. Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer ce message.</p>
        </div>
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
        <p>Nous sommes ravis de vous accueillir sur <strong>${appName}</strong>, la plateforme d'apprentissage professionnelle conçue pour propulser vos compétences au niveau supérieur.</p>
        <p>Voici ce que vous pouvez faire dès maintenant :</p>
        <ul style="padding-left: 20px; color: #334155; line-height: 1.6;">
          <li>Explorez notre catalogue de formations pratiques et certifiantes.</li>
          <li>Suivez vos progrès en temps réel et obtenez des attestations.</li>
          <li>Échangez avec des formateurs experts et d'autres passionnés.</li>
        </ul>
      `;
      callToActionText = 'Accéder à mon espace';
      break;

    case 'auth_reset_password':
      subject = 'Réinitialisation de votre mot de passe - Dekel.Formation';
      badgeTitle = 'Sécurité du compte';
      iconEmoji = '🔑';
      title = 'Demande de réinitialisation de mot de passe';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte <strong>${appName}</strong>.</p>
        <p>Pour définir un nouveau mot de passe sécurisé, cliquez sur le bouton ci-dessous :</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Lien sécurisé temporaire :</strong> Ce lien unique expire dans 1 heure. Ne partagez ce lien avec personne.</p>
        </div>
      `;
      callToActionText = 'Réinitialiser mon mot de passe';
      break;

    case 'auth_email_changed':
      subject = 'Alerte de sécurité : Adresse e-mail modifiée';
      badgeTitle = 'Sécurité du compte';
      iconEmoji = '🛡️';
      title = 'Votre adresse e-mail a été mise à jour';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>L'adresse e-mail associée à votre compte <strong>${appName}</strong> vient d'être modifiée avec succès.</p>
        ${data.customMessage ? `<p style="font-size: 13px; color: #64748b; background: #0f1115; padding: 10px; border-radius: 6px;">${data.customMessage}</p>` : ''}
        <p>Si vous êtes à l'origine de cette modification, aucune action supplémentaire n'est requise.</p>
        <p style="color: #dc2626; font-weight: 600;">Si vous n'avez pas demandé ce changement, veuillez contacter immédiatement le support de la plateforme.</p>
      `;
      callToActionText = 'Vérifier mon compte';
      break;

    case 'auth_password_changed':
      subject = 'Confirmation de modification du mot de passe';
      badgeTitle = 'Sécurité du compte';
      iconEmoji = '✅';
      title = 'Votre mot de passe a été modifié';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous vous confirmons que le mot de passe de votre compte <strong>${appName}</strong> a été modifié avec succès le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.</p>
        <p>Si vous avez effectué cette action, tout est en ordre.</p>
      `;
      callToActionText = 'Se connecter à l\'espace';
      break;

    // COURSES
    case 'course_enrollment_confirm':
      subject = `Confirmation d'inscription : ${data.courseTitle || 'Votre formation'}`;
      badgeTitle = 'Nouvelle Inscription';
      iconEmoji = '🎓';
      title = 'Félicitations pour votre inscription !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre inscription à la formation <strong>« ${data.courseTitle || 'Formation Dekel'} »</strong> est validée avec succès !</p>
        ${data.trainerName ? `<p><strong>Formateur référent :</strong> ${data.trainerName}</p>` : ''}
        <p>Tous vos cours, vidéos, quiz et supports de téléchargement sont dès à présent accessibles depuis votre tableau de bord étudiant.</p>
      `;
      callToActionText = 'Commencer la formation';
      break;

    case 'course_manual_add':
      subject = `Un formateur vous a inscrit à ${data.courseTitle || 'une nouvelle formation'}`;
      badgeTitle = 'Accès Offert';
      iconEmoji = '⭐';
      title = 'Nouveau cours disponible dans votre catalogue';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le formateur <strong>${data.trainerName || 'un administrateur'}</strong> vous a ajouté directement à la formation :</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; margin: 16px 0;">
          <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 16px;">${data.courseTitle || 'Formation Dekel'}</h4>
          <p style="margin: 0; font-size: 13px; color: #15803d;">Accès complet accordé sans restriction de durée.</p>
        </div>
      `;
      callToActionText = 'Ouvrir mon cours';
      break;

    case 'course_access_granted':
      subject = `Accès débloqué pour : ${data.courseTitle || 'votre formation'}`;
      badgeTitle = 'Accès Débloqué';
      iconEmoji = '🔓';
      title = 'Votre accès est maintenant actif !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous vous informons que votre accès à la formation <strong>« ${data.courseTitle || 'Formation'} »</strong> a été activé par l'équipe pédagogique.</p>
        <p>Vous pouvez immédiatement reprendre là où vous vous étiez arrêté.</p>
      `;
      callToActionText = 'Accéder aux chapitres';
      break;

    case 'course_access_revoked':
      subject = `Mise à jour d'accès : ${data.courseTitle || 'Formation'}`;
      badgeTitle = 'Information d\'Accès';
      iconEmoji = 'ℹ️';
      title = 'Ajustement de vos droits d\'accès';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>L'accès à la formation <strong>« ${data.courseTitle || 'Formation'} »</strong> a été suspendu ou archivé conformément à la gestion de votre abonnement ou aux directives du formateur.</p>
        <p>Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à contacter notre équipe support.</p>
      `;
      callToActionText = 'Contacter le support';
      break;

    // PAYMENTS
    case 'payment_received':
      subject = `Paiement reçu pour ${data.courseTitle || 'votre commande'}`;
      badgeTitle = 'Accusé de Réception';
      iconEmoji = '💳';
      title = 'Nous avons bien reçu votre paiement';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous accusons réception de votre règlement pour la formation <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Montant :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${data.paymentAmount || 'Validé'}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Moyen de paiement :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${data.paymentMethod || 'Paiement sécurisé'}</td></tr>
          ${data.transactionRef ? `<tr><td style="padding: 8px 0; color: #64748b;">Référence :</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${data.transactionRef}</td></tr>` : ''}
        </table>
      `;
      callToActionText = 'Voir mes achats';
      break;

    case 'payment_validated':
      subject = `Paiement validé - Reçu officiel ${appName}`;
      badgeTitle = 'Reçu de Paiement';
      iconEmoji = '🧾';
      title = 'Validation définitive de votre commande';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre preuve de paiement pour la formation <strong>« ${data.courseTitle || 'Formation'} »</strong> a été examinée et validée par le formateur.</p>
        <p>Un reçu d'achat officiel est joint à la fiche de votre profil étudiant.</p>
      `;
      callToActionText = 'Accéder à la formation';
      break;

    case 'payment_webhook_enrolled':
      subject = `Accès instantané activé : ${data.courseTitle || 'Votre cours'}`;
      badgeTitle = 'Validation Automatique';
      iconEmoji = '⚡';
      title = 'Traitement automatique réussi !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Grâce au système d'intégration automatique, votre paiement a été synchronisé en temps réel.</p>
        <p>Votre inscription à <strong>« ${data.courseTitle || 'Formation'} »</strong> a été immédiatement enregistrée.</p>
      `;
      callToActionText = 'Démarrer maintenant';
      break;

    case 'payment_failed':
      subject = `Échec de transaction pour ${data.courseTitle || 'votre achat'}`;
      badgeTitle = 'Alerte Paiement';
      iconEmoji = '⚠️';
      title = 'Votre transaction n\'a pas pu aboutir';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>La tentative de règlement pour la formation <strong>« ${data.courseTitle || 'Formation'} »</strong> n'a pas pu être finalisée.</p>
        <p style="color: #64748b; font-size: 13px;">Motif possible : Solde insuffisant, interruption de session réseau Mobile Money, ou rejet par l'opérateur.</p>
        <p>Vous pouvez réessayer directement sur notre marketplace ou envoyer une preuve par WhatsApp.</p>
      `;
      callToActionText = 'Réessayer le paiement';
      break;

    // PEDAGOGY
    case 'pedagogy_course_welcome':
      subject = `Bienvenue dans la formation ${data.courseTitle || ''} !`;
      badgeTitle = 'Espace Pédagogique';
      iconEmoji = '🚀';
      title = 'Prêt à commencer l\'apprentissage ?';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Bienvenue dans votre programme <strong>« ${data.courseTitle || 'Formation'} »</strong> animé par <strong>${data.trainerName || 'votre formateur'}</strong>.</p>
        <p>Quelques conseils pour réussir votre apprentissage :</p>
        <ol style="padding-left: 20px; color: #334155; line-height: 1.6;">
          <li>Suivez les chapitres dans l'ordre chronologique.</li>
          <li>Téléchargez les fichiers d'exercices et PDF mis à votre disposition.</li>
          <li>Prenez des notes directement dans votre lecteur vidéo interactif.</li>
        </ol>
      `;
      callToActionText = 'Lancer la première vidéo';
      break;

    case 'pedagogy_new_chapter':
      subject = `Nouveau chapitre disponible : ${data.chapterTitle || 'Chapitre inédit'}`;
      badgeTitle = 'Mise à jour du Cours';
      iconEmoji = '🎬';
      title = 'Un nouveau chapitre est disponible !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le formateur vient de publier une nouvelle leçon dans la formation <strong>« ${data.courseTitle || 'Votre cours'} »</strong> :</p>
        <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 14px; margin: 16px 0; border-radius: 4px;">
          ${data.moduleTitle ? `<p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; color: #6366f1; font-weight: bold;">${data.moduleTitle}</p>` : ''}
          <h4 style="margin: 0; color: #1e293b; font-size: 16px;">${data.chapterTitle || 'Nouveau Chapitre'}</h4>
        </div>
      `;
      callToActionText = 'Visionner la leçon';
      break;

    case 'pedagogy_new_module':
      subject = `Nouveau module publié dans ${data.courseTitle || 'votre cours'}`;
      badgeTitle = 'Nouveau Module';
      iconEmoji = '📚';
      title = 'Votre programme s\'enrichit d\'un nouveau module !';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Un module entier vient d'être débloqué dans votre formation <strong>« ${data.courseTitle || 'Formation'} »</strong> :</p>
        <p style="font-weight: bold; color: #059669; font-size: 16px;">${data.moduleTitle || 'Nouveau Module Pédagogique'}</p>
        <p>Découvrez dès à présent les cours vidéos et cas pratiques associés.</p>
      `;
      callToActionText = 'Découvrir le module';
      break;

    case 'pedagogy_course_updated':
      subject = `Mise à jour importante pour ${data.courseTitle || 'votre formation'}`;
      badgeTitle = 'Contenu Actualisé';
      iconEmoji = '💡';
      title = 'Contenus et ressources mis à jour';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Nous avons apporté des améliorations à la formation <strong>« ${data.courseTitle || 'Formation'} »</strong>.</p>
        ${data.updateDetails ? `<p style="background: #eff6ff; color: #1d4ed8; padding: 12px; border-radius: 8px; font-size: 13px;">${data.updateDetails}</p>` : ''}
      `;
      callToActionText = 'Voir les nouveautés';
      break;

    // ADMINISTRATION
    case 'admin_trainer_invitation':
      subject = `Invitation officielle : Devenez Formateur sur ${appName}`;
      badgeTitle = 'Invitation Officielle';
      iconEmoji = '🌟';
      title = 'Rejoignez l\'équipe des Formateurs Dekel';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>L'administration de <strong>${appName}</strong> a le plaisir de vous inviter à devenir Formateur officiel sur la plateforme.</p>
        <p>En acceptant cette invitation, vous pourrez créer vos propres formations, enregistrer vos modules, suivre les étudiants et percevoir les règlements.</p>
      `;
      callToActionText = 'Accepter l\'invitation';
      break;

    case 'admin_role_changed':
      subject = `Mise à jour de vos privilèges sur ${appName}`;
      badgeTitle = 'Profil Mise à Jour';
      iconEmoji = '👑';
      title = 'Vos droits d\'accès ont évolué';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Un administrateur a mis à jour votre rôle sur la plateforme <strong>${appName}</strong>.</p>
        <p style="font-size: 15px;"><strong>Nouveau rôle :</strong> <span style="background: #ecfdf5; color: #047857; font-weight: bold; padding: 4px 10px; border-radius: 12px;">${data.roleName || 'Membre'}</span></p>
      `;
      callToActionText = 'Accéder à mon espace';
      break;

    case 'admin_account_status':
      subject = `Statut de votre compte ${appName}`;
      badgeTitle = 'Gestion de Compte';
      iconEmoji = '⚙️';
      title = 'Mise à jour du statut de votre compte';
      contentHtml = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Le statut de votre compte sur <strong>${appName}</strong> est actuellement : <strong>${data.accountStatus || 'Actif'}</strong>.</p>
        ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
      `;
      callToActionText = 'Consulter mon profil';
      break;

    default:
      subject = `Notification importante - ${appName}`;
      badgeTitle = 'Information';
      iconEmoji = '📩';
      title = 'Notification Dekel.Formation';
      contentHtml = `<p>Bonjour <strong>${name}</strong>,</p><p>${data.customMessage || 'Vous avez reçu un nouveau message de la plateforme Dekel.Formation.'}</p>`;
      callToActionText = 'Ouvrir la plateforme';
      break;
  }

  const plainText = `${title}\n\n${contentHtml.replace(/<[^>]+>/g, '')}\n\nLien : ${callToActionUrl}\n\nDekel.Formation - E-Learning Pro`;

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
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Nature Dark Premium #1b2028) -->
          <tr>
            <td style="background-color: #1b2028; padding: 28px 24px; text-align: center; border-bottom: 3px solid #10b981;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-flex; align-items: center; justify-content: center; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
                      <span style="font-size: 18px; margin-right: 8px;">🌿</span>
                      <span style="color: #ffffff; font-weight: 800; font-size: 18px; letter-spacing: -0.5px;">Dekel.<span style="color: #34d399;">Formation</span></span>
                    </div>
                    <p style="margin: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Plateforme E-Learning Professionnelle</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Category Badge & Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              
              <!-- Badge -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
                  ${iconEmoji} ${badgeTitle}
                </span>
              </div>

              <!-- Title -->
              <h1 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 800; line-height: 1.3; letter-spacing: -0.3px;">
                ${title}
              </h1>

              <!-- Content Body -->
              <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                ${contentHtml}
              </div>

              <!-- Action Button -->
              ${callToActionText ? `
              <div style="margin-top: 28px; margin-bottom: 24px; text-align: center;">
                <a href="${callToActionUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); transition: all 0.2s ease;">
                  ${callToActionText} &rarr;
                </a>
              </div>
              ` : ''}

              <!-- Expiration or Security Disclaimer -->
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #2D3748; font-size: 12px; color: #64748b; line-height: 1.5;">
                <p style="margin: 0;">Si le bouton ne fonctionne pas, copiez-collez l'adresse suivante dans votre navigateur :</p>
                <p style="margin: 4px 0 0 0; word-break: break-all; color: #2563eb; font-family: monospace;">${callToActionUrl}</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #cbd5e1;">Dekel.Formation &bull; Système d'E-mails Transactionnels Sécurisés</p>
              <p style="margin: 0 0 12px 0; color: #64748b;">
                Cet e-mail a été envoyé automatiquement suite à une action sur votre compte.<br>
                Merci de ne pas répondre directement à ce message.
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                &copy; ${currentYear} Dekel.Formation. Tous droits réservés.
              </p>
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
