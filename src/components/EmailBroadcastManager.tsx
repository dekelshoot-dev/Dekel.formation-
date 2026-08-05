import React, { useState, useEffect } from 'react';
import { User, CustomEmailTemplate, SimulatedEmail } from '../types';
import { 
  Mail, 
  Send, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  Users, 
  UserCheck, 
  Gift, 
  PartyPopper, 
  Rocket, 
  Megaphone, 
  Flame, 
  Settings, 
  Search, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Monitor, 
  ChevronRight, 
  Tag, 
  FileText,
  Clock,
  UserX,
  Download
} from 'lucide-react';
import { showToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { cleanUndefined, getNewsletterSubscribers, unsubscribeNewsletter, subscribeNewsletter, NewsletterSubscriber } from '../firebaseService';

interface EmailBroadcastManagerProps {
  allUsers: User[];
  currentUser: User;
  onSendEmail?: (email: SimulatedEmail) => void;
}

// Pre-built default templates
export const PREDEFINED_TEMPLATES: CustomEmailTemplate[] = [
  {
    id: 'tpl-fete-voeux',
    title: '🎉 Bonne Fête & Vœux de la Plateforme',
    subject: '🎉 Joyeuses Fêtes de la part de {nom_plateforme} !',
    category: 'fete',
    description: 'Modèle chaleureux pour souhaiter de bonnes fêtes, des vœux ou célébrer un événement.',
    isPredefined: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    htmlBody: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 26px; font-weight: 800; tracking: -0.5px;">🎉 Joyeuses Fêtes !</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Une attention spéciale de l'équipe {nom_plateforme}</p>
  </div>
  <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
    <p style="font-size: 16px; font-weight: 600; margin-top: 0;">Bonjour {prenom},</p>
    <p>À l'occasion de cette période festive, toute l'équipe de <strong>{nom_plateforme}</strong> tient à vous adresser ses vœux les plus chaleureux !</p>
    <p>Nous vous remercions sincèrement pour votre confiance et votre engagement au sein de notre communauté d'apprentissage.</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; font-style: italic; color: #475569;">"Le savoir est le plus beau des cadeaux que l'on puisse s'offrir et partager."</p>
    </div>

    <p>Nous vous souhaitons d'excellents moments de joie, de réussite dans vos projets et de belles réussites dans vos formations !</p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="https://formation.dekel-dev.com/" style="display: inline-block; background: #4f46e5; color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
        Découvrir mes formations
      </a>
    </div>
  </div>
  <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
    <p style="margin: 0;">Cet e-mail a été envoyé à {email} ({role}) par {nom_plateforme}.</p>
  </div>
</div>`
  },
  {
    id: 'tpl-bienvenue',
    title: '🚀 Bienvenue & Prise en main de la plateforme',
    subject: '👋 Bienvenue sur {nom_plateforme}, {prenom} !',
    category: 'bienvenue',
    description: 'Message de bienvenue pour accueillir chaleureusement les nouveaux inscrits.',
    isPredefined: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    htmlBody: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
  <div style="background: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #38bdf8;">🚀 Bienvenue parmi nous !</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">Votre aventure sur {nom_plateforme} commence ici</p>
  </div>
  <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
    <p style="font-size: 16px; font-weight: 600;">Bonjour {prenom} {nom},</p>
    <p>Nous sommes ravis de vous compter parmi nos membres ! Votre compte en tant que <strong>{role}</strong> est pleinement actif.</p>
    <p>Voici ce que vous pouvez faire dès maintenant :</p>
    
    <ul style="padding-left: 20px; margin: 20px 0; color: #475569;">
      <li style="margin-bottom: 10px;">Accéder à vos cours et espaces de formation</li>
      <li style="margin-bottom: 10px;">Suivre votre progression en temps réel</li>
      <li style="margin-bottom: 10px;">Télécharger vos ressources et certificats</li>
    </ul>

    <div style="text-align: center; margin-top: 28px;">
      <a href="https://formation.dekel-dev.com/" style="display: inline-block; background: #0284c7; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px;">
        Accéder à mon tableau de bord
      </a>
    </div>
  </div>
</div>`
  },
  {
    id: 'tpl-annonce',
    title: '📢 Annonce Importante & Communication',
    subject: '📢 Annonce importante pour l\'ensemble des membres',
    category: 'annonce',
    description: 'Modèle officiel pour transmettre une nouvelle majeure ou une mise à jour d\'organisation.',
    isPredefined: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    htmlBody: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1;">
  <div style="background: #1e293b; padding: 28px 24px; color: #ffffff;">
    <span style="background: #3b82f6; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 20px;">Communication Officielle</span>
    <h2 style="margin: 12px 0 0 0; font-size: 22px;">Information importante de la direction</h2>
  </div>
  <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
    <p>Bonjour {prenom},</p>
    <p>Nous souhaitons vous informer d'une mise à jour importante concernant l'organisation de nos formations sur <strong>{nom_plateforme}</strong>.</p>
    
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; margin: 20px 0; color: #1e40af;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">Ce qu'il faut retenir :</h3>
      <p style="margin: 0; font-size: 14px;">Inscrivez ici le contenu détaillé de votre annonce ou mise à jour plateforme.</p>
    </div>

    <p>Merci de votre attention et de votre présence continue à nos côtés !</p>
    <p style="margin-top: 24px; font-weight: 600;">L'équipe de gestion {nom_plateforme}</p>
  </div>
</div>`
  },
  {
    id: 'tpl-relance',
    title: '🎓 Relance & Motivation Formation',
    subject: '🔥 {prenom}, gardez le rythme de votre apprentissage !',
    category: 'relance',
    description: 'Rappel stimulant pour encourager les étudiants à reprendre leurs cours.',
    isPredefined: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    htmlBody: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 800;">🔥 Un pas de plus vers votre réussite !</h1>
  </div>
  <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
    <p style="font-size: 16px; font-weight: 600;">Bonjour {prenom},</p>
    <p>Nous avons remarqué que vous n'avez pas terminé tous vos modules récemment sur <strong>{nom_plateforme}</strong>.</p>
    <p>Chaque chapitre complété vous rapproche de la maîtrise et de l'obtention de votre certificat final !</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://formation.dekel-dev.com/" style="display: inline-block; background: #d97706; color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);">
        Reprendre ma formation maintenant
      </a>
    </div>
  </div>
</div>`
  },
  {
    id: 'tpl-offre',
    title: '🎁 Offre Spéciale & Code Promo',
    subject: '🎁 Offre exclusive réservée à nos membres, {prenom} !',
    category: 'offre',
    description: 'Email promotionnel pour annoncer une réduction ou une offre spéciale.',
    isPredefined: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    htmlBody: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
  <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
    <span style="background: rgba(255,255,255,0.2); font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 20px;">Offre Limitée</span>
    <h1 style="margin: 12px 0 0 0; font-size: 26px; font-weight: 800;">Profitez d'un avantage exclusif !</h1>
  </div>
  <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
    <p style="font-size: 16px; font-weight: 600;">Cher(e) {prenom},</p>
    <p>En tant que membre privilégié(e) de <strong>{nom_plateforme}</strong>, nous sommes ravis de vous offrir une réduction exceptionnelle !</p>

    <div style="background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; text-transform: uppercase; font-size: 12px; font-weight: 700; color: #be123c;">Votre code privilège :</p>
      <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 24px; font-weight: 800; color: #e11d48; letter-spacing: 2px;">DEKELPROMO20</p>
    </div>

    <p style="text-align: center;">Ne tardez pas, cette offre expire très bientôt !</p>

    <div style="text-align: center; margin-top: 28px;">
      <a href="https://formation.dekel-dev.com/" style="display: inline-block; background: #e11d48; color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px;">
        Profiter de l'offre
      </a>
    </div>
  </div>
</div>`
  }
];

export default function EmailBroadcastManager({ allUsers, currentUser, onSendEmail }: EmailBroadcastManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'send' | 'templates' | 'history'>('send');

  // Custom Templates stored in Firestore / LocalStorage
  const [customTemplates, setCustomTemplates] = useState<CustomEmailTemplate[]>(() => {
    const saved = localStorage.getItem('sio_custom_email_templates');
    return saved ? JSON.parse(saved) : [];
  });

  // History log of sent broadcasts
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('sio_broadcast_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Editor State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-fete-voeux');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'fete' | 'bienvenue' | 'annonce' | 'relance' | 'offre' | 'autre'>('fete');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Recipient Selection State
  const [recipientTarget, setRecipientTarget] = useState<'all_students' | 'all_trainers' | 'all_users' | 'selected_users' | 'custom_emails' | 'newsletter_subscribers'>('all_students');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Newsletter Subscribers State
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');

  // Send Progress & Confirmation
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // Load Newsletter Subscribers
  useEffect(() => {
    getNewsletterSubscribers().then(list => {
      if (list && list.length > 0) {
        setNewsletterSubscribers(list);
      }
    });

    const unsub = onSnapshot(collection(db, 'newsletter_subscribers'), (snapshot) => {
      const items: NewsletterSubscriber[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          email: data.email || '',
          subscribedAt: data.subscribedAt || new Date().toISOString()
        });
      });
      if (items.length > 0) {
        setNewsletterSubscribers(items);
        localStorage.setItem('sio_newsletter_subscribers', JSON.stringify(items));
      }
    }, (err) => {
      console.warn('Firestore subscription fallback for newsletter subscribers:', err);
    });

    return () => unsub();
  }, []);

  // Load Custom Templates from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_email_templates'), (snapshot) => {
      const items: CustomEmailTemplate[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as CustomEmailTemplate);
      });
      if (items.length > 0) {
        setCustomTemplates(items);
        localStorage.setItem('sio_custom_email_templates', JSON.stringify(items));
      }
    }, (err) => {
      console.warn('Firestore subscription fallback for email templates:', err);
    });
    return () => unsub();
  }, []);

  // Sync selected template content into composition form
  useEffect(() => {
    const allTpls = [...PREDEFINED_TEMPLATES, ...customTemplates];
    const match = allTpls.find(t => t.id === selectedTemplateId);
    if (match) {
      setTemplateSubject(match.subject);
      setTemplateHtml(match.htmlBody);
      setTemplateTitle(match.title);
      setTemplateCategory(match.category);
      setTemplateDescription(match.description || '');
    }
  }, [selectedTemplateId, customTemplates]);

  // Insert tag variable at cursor or end of string
  const insertVariableTag = (tag: string, targetField: 'subject' | 'html') => {
    if (targetField === 'subject') {
      setTemplateSubject(prev => `${prev} ${tag}`);
    } else {
      setTemplateHtml(prev => `${prev}\n${tag}`);
    }
    showToast(`Balise ${tag} insérée !`, 'info');
  };

  // Save or Update Custom Template in Firestore & local state
  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      showToast('Veuillez saisir un nom pour le modèle de mail.', 'error');
      return;
    }
    if (!templateSubject.trim()) {
      showToast('Veuillez saisir un sujet par défaut.', 'error');
      return;
    }
    if (!templateHtml.trim()) {
      showToast('Le contenu HTML ne peut pas être vide.', 'error');
      return;
    }

    const templateId = editingTemplateId || `custom-tpl-${Date.now()}`;
    const newTemplate: CustomEmailTemplate = {
      id: templateId,
      title: templateTitle.trim(),
      subject: templateSubject.trim(),
      category: templateCategory,
      description: templateDescription.trim(),
      htmlBody: templateHtml,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPredefined: false
    };

    try {
      await setDoc(doc(db, 'custom_email_templates', templateId), cleanUndefined(newTemplate));
      showToast('Modèle de mail enregistré dans Firestore !', 'success');
    } catch (err) {
      console.warn('Firestore save error, fallback to local storage:', err);
      showToast('Modèle enregistré localement.', 'info');
    }

    const updated = [...customTemplates.filter(t => t.id !== templateId), newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('sio_custom_email_templates', JSON.stringify(updated));
    setEditingTemplateId(null);
  };

  // Delete Custom Template
  const handleDeleteTemplate = async (templateId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le modèle de mail',
      message: 'Voulez-vous vraiment supprimer ce modèle de mail personnalisé ?',
      itemName: title,
      confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'custom_email_templates', templateId));
          showToast('Modèle supprimé avec succès !', 'info');
        } catch (err) {
          console.warn('Firestore delete fallback:', err);
        }
        const updated = customTemplates.filter(t => t.id !== templateId);
        setCustomTemplates(updated);
        localStorage.setItem('sio_custom_email_templates', JSON.stringify(updated));
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId(PREDEFINED_TEMPLATES[0].id);
        }
        closeConfirmModal();
      }
    });
  };

  // Calculate target recipients
  const getResolvedRecipients = (): { email: string; name: string; role: string }[] => {
    if (recipientTarget === 'newsletter_subscribers') {
      return newsletterSubscribers.map(sub => ({
        email: sub.email,
        name: sub.email.split('@')[0],
        role: 'Abonné Newsletter'
      }));
    }
    if (recipientTarget === 'all_students') {
      return allUsers
        .filter(u => u.role === 'student' && u.email)
        .map(u => ({ email: u.email, name: u.name || u.email.split('@')[0], role: 'Étudiant' }));
    }
    if (recipientTarget === 'all_trainers') {
      return allUsers
        .filter(u => (u.role === 'trainer' || u.role === 'admin') && u.email)
        .map(u => ({ email: u.email, name: u.name || u.email.split('@')[0], role: u.role === 'admin' ? 'Administrateur' : 'Formateur' }));
    }
    if (recipientTarget === 'all_users') {
      return allUsers
        .filter(u => u.email)
        .map(u => ({ email: u.email, name: u.name || u.email.split('@')[0], role: u.role === 'student' ? 'Étudiant' : u.role === 'trainer' ? 'Formateur' : 'Administrateur' }));
    }
    if (recipientTarget === 'selected_users') {
      return allUsers
        .filter(u => selectedUserIds.includes(u.id) && u.email)
        .map(u => ({ email: u.email, name: u.name || u.email.split('@')[0], role: u.role === 'student' ? 'Étudiant' : u.role === 'trainer' ? 'Formateur' : 'Administrateur' }));
    }
    if (recipientTarget === 'custom_emails') {
      const raw = customEmailInput
        .split(/[\n,;]+/)
        .map(e => e.trim())
        .filter(e => e.includes('@'));
      const unique = Array.from(new Set(raw));
      return unique.map(e => ({ email: e, name: e.split('@')[0], role: 'Membre' }));
    }
    return [];
  };

  const resolvedRecipients = getResolvedRecipients();

  // Personalize HTML / Subject for a given recipient
  const renderPersonalizedContent = (recipient: { email: string; name: string; role: string }, rawText: string) => {
    const todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const nameParts = recipient.name.split(' ');
    const prenom = recipient.name ? nameParts[0] : recipient.email.split('@')[0];
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;

    return rawText
      .replace(/\{prenom\}/g, prenom)
      .replace(/\{nom\}/g, recipient.name || prenom)
      .replace(/\{email\}/g, recipient.email)
      .replace(/\{role\}/g, recipient.role)
      .replace(/\{date\}/g, todayStr)
      .replace(/\{nom_plateforme\}/g, 'Dekel.Formation')
      .replace(/\{lien_desabonnement\}/g, unsubscribeUrl);
  };

  // Dispatch Broadcast Email
  const handleSendBroadcast = async () => {
    if (resolvedRecipients.length === 0) {
      showToast('Aucun destinataire valide sélectionné !', 'error');
      return;
    }
    if (!templateSubject.trim()) {
      showToast('Veuillez renseigner un sujet d\'e-mail.', 'error');
      return;
    }
    if (!templateHtml.trim()) {
      showToast('Le corps du message ne peut pas être vide.', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmer l\'envoi de la campagne e-mail',
      message: `Vous allez envoyer cet e-mail personnalisé à ${resolvedRecipients.length} destinataire(s). Voulez-vous exécuter l'envoi ?`,
      itemName: `Sujet : "${templateSubject}"`,
      confirmText: `🚀 Envoyer à ${resolvedRecipients.length} membre(s)`,
      onConfirm: async () => {
        closeConfirmModal();
        setIsSending(true);
        setSendProgress(0);

        let successCount = 0;
        const total = resolvedRecipients.length;

        for (let i = 0; i < total; i++) {
          const rec = resolvedRecipients[i];
          const personalizedSubj = renderPersonalizedContent(rec, templateSubject);
          let personalizedHtml = renderPersonalizedContent(rec, templateHtml);
          const unsubscribeUrl = `${window.location.origin}/unsubscribe?email=${encodeURIComponent(rec.email)}`;

          // Always ensure an unsubscribe footer link is present in marketing/newsletter emails
          const lowerHtml = personalizedHtml.toLowerCase();
          if (!lowerHtml.includes('unsubscribe') && !lowerHtml.includes('desinscri') && !lowerHtml.includes('désinscri')) {
            personalizedHtml += `
<div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; font-family: 'Segoe UI', Arial, sans-serif;">
  Vous recevez cet e-mail car vous êtes abonné à notre newsletter Dekel.Formation.<br/>
  Si vous ne souhaitez plus recevoir nos communications, <a href="${unsubscribeUrl}" style="color: #6366f1; font-weight: 700; text-decoration: underline;">cliquez ici pour vous désinscrire</a>.
</div>`;
          }

          try {
            // Trigger server endpoint
            await fetch('/api/emails/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: rec.email,
                recipientName: rec.name,
                type: 'marketing_newsletter',
                category: 'marketing',
                renderData: {
                  recipientName: rec.name,
                  recipientEmail: rec.email,
                  customSubject: personalizedSubj,
                  customHtml: personalizedHtml
                }
              })
            });

            // Also invoke client callback for UI state log sync
            if (onSendEmail) {
              const simEmail: SimulatedEmail = {
                id: `broadcast-${Date.now()}-${i}`,
                to: rec.email,
                subject: personalizedSubj,
                body: personalizedHtml.replace(/<[^>]*>?/gm, ''),
                htmlBody: personalizedHtml,
                sentAt: new Date().toISOString(),
                category: 'marketing',
                type: 'marketing_newsletter',
                status: 'sent'
              };
              onSendEmail(simEmail);
            }

            successCount++;
          } catch (err) {
            console.error(`Error sending broadcast to ${rec.email}:`, err);
          }

          setSendProgress(Math.round(((i + 1) / total) * 100));
          await new Promise(r => setTimeout(r, 60)); // smooth progress feedback
        }

        setIsSending(false);
        showToast(`🎉 Campagne e-mail envoyée avec succès à ${successCount}/${total} destinataire(s) !`, 'success');

        // Log entry in broadcast history
        const newLog = {
          id: `log-bcast-${Date.now()}`,
          subject: templateSubject,
          templateTitle: templateTitle || 'E-mail personnalisé',
          recipientsCount: successCount,
          sentAt: new Date().toISOString(),
          sender: currentUser.name || currentUser.email
        };
        const updatedLogs = [newLog, ...broadcastLogs];
        setBroadcastLogs(updatedLogs);
        localStorage.setItem('sio_broadcast_logs', JSON.stringify(updatedLogs));
      }
    });
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const sampleRecipient = resolvedRecipients.length > 0 
    ? resolvedRecipients[0] 
    : { email: 'eleve.demo@dekel-formation.com', name: 'Amadou Diallo', role: 'Étudiant' };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              E-mailing &amp; Modèles Personnalisés
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <span>Gestionnaire de Templates &amp; Diffusion de Mails</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Créez des modèles d'e-mails professionnels (Vœux, Bienvenue, Relances) et envoyez des campagnes personnalisées à vos étudiants, formateurs ou listes ciblées.
          </p>
        </div>

        {/* Subtab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('send')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'send' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer un Mail</span>
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'templates' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Modèles de Mail ({PREDEFINED_TEMPLATES.length + customTemplates.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historique Envois ({broadcastLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SEND BROADCAST EMAIL */}
      {activeSubTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selection & Recipient Targeting */}
          <div className="lg:col-span-5 space-y-6">
            {/* Template Chooser */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>1. Choisir un Modèle de Mail</span>
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {PREDEFINED_TEMPLATES.length + customTemplates.length} modèles
                </span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Templates de Base Prédéfinis</p>
                {PREDEFINED_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      selectedTemplateId === tpl.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                      {tpl.category === 'fete' && <PartyPopper className="w-4 h-4 text-rose-600" />}
                      {tpl.category === 'bienvenue' && <Rocket className="w-4 h-4 text-sky-600" />}
                      {tpl.category === 'annonce' && <Megaphone className="w-4 h-4 text-amber-600" />}
                      {tpl.category === 'relance' && <Flame className="w-4 h-4 text-orange-600" />}
                      {tpl.category === 'offre' && <Gift className="w-4 h-4 text-emerald-600" />}
                      {tpl.category === 'autre' && <FileText className="w-4 h-4 text-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">{tpl.title}</span>
                        {selectedTemplateId === tpl.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.subject}</p>
                    </div>
                  </button>
                ))}

                {customTemplates.length > 0 && (
                  <>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">Vos Modèles Personnalisés</p>
                    {customTemplates.map(tpl => (
                      <div key={tpl.id} className="relative group">
                        <button
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 pr-9 ${
                            selectedTemplateId === tpl.id
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 truncate">{tpl.title}</span>
                              {selectedTemplateId === tpl.id && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.subject}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(tpl.id, tpl.title);
                          }}
                          className="absolute right-2 top-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-80 hover:opacity-100 cursor-pointer"
                          title="Supprimer ce modèle personnalisé"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Recipient Targeting */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>2. Cibler les Destinataires</span>
                </h3>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                  {resolvedRecipients.length} destinataire(s)
                </span>
              </div>

              {/* Recipient Radio options */}
              <div className="grid grid-cols-1 gap-2">
                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  recipientTarget === 'newsletter_subscribers' ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recipientTarget"
                      checked={recipientTarget === 'newsletter_subscribers'}
                      onChange={() => setRecipientTarget('newsletter_subscribers')}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-slate-800 flex items-center gap-1.5 font-bold">
                      📰 Abonnés à la Newsletter ({newsletterSubscribers.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    {newsletterSubscribers.length} inscrits
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  recipientTarget === 'all_students' ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recipientTarget"
                      checked={recipientTarget === 'all_students'}
                      onChange={() => setRecipientTarget('all_students')}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-slate-800">🎓 Tous les étudiants de la plateforme</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {allUsers.filter(u => u.role === 'student').length}
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  recipientTarget === 'all_trainers' ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recipientTarget"
                      checked={recipientTarget === 'all_trainers'}
                      onChange={() => setRecipientTarget('all_trainers')}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-slate-800">👨‍🏫 Tous les formateurs &amp; enseignants</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {allUsers.filter(u => u.role === 'trainer' || u.role === 'admin').length}
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  recipientTarget === 'all_users' ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recipientTarget"
                      checked={recipientTarget === 'all_users'}
                      onChange={() => setRecipientTarget('all_users')}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-slate-800">🌐 Tous les utilisateurs inscrits</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {allUsers.length}
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  recipientTarget === 'selected_users' ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recipientTarget"
                      checked={recipientTarget === 'selected_users'}
                      onChange={() => setRecipientTarget('selected_users')}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-slate-800">☑️ Sélectionner des membres spécifiques</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {selectedUserIds.length}
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  recipientTarget === 'custom_emails' ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recipientTarget"
                      checked={recipientTarget === 'custom_emails'}
                      onChange={() => setRecipientTarget('custom_emails')}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs text-slate-800">✉️ Saisie manuelle d'adresses e-mail</span>
                  </div>
                </label>
              </div>

              {/* Sub-panel for Selected Users checkbox list */}
              {recipientTarget === 'selected_users' && (
                <div className="pt-2 space-y-3 border-t border-slate-100 animate-fade-in">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou e-mail..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(filteredUsers.map(u => u.id))}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      Tout sélectionner ({filteredUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds([])}
                      className="text-slate-400 hover:underline"
                    >
                      Tout désélectionner
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {filteredUsers.map(u => {
                      const isChecked = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                            } else {
                              setSelectedUserIds(prev => [...prev, u.id]);
                            }
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all ${
                            isChecked ? 'bg-indigo-100/70 border border-indigo-200' : 'bg-white hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div click
                              className="accent-indigo-600 rounded"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{u.name || u.email}</p>
                              <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-800' : u.role === 'trainer' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-panel for Newsletter Subscribers List & Management */}
              {recipientTarget === 'newsletter_subscribers' && (
                <div className="pt-3 space-y-3 border-t border-slate-100 animate-fade-in">
                  {/* Search and Add Subscriber controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Rechercher un abonné..."
                        value={subscriberSearchQuery}
                        onChange={(e) => setSubscriberSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        placeholder="Ajouter email..."
                        value={newSubEmail}
                        onChange={(e) => setNewSubEmail(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 min-w-[140px]"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (newSubEmail && newSubEmail.includes('@')) {
                            await subscribeNewsletter(newSubEmail);
                            showToast(`Abonné "${newSubEmail}" ajouté avec succès !`, 'success');
                            setNewSubEmail('');
                          } else {
                            showToast('Veuillez entrer une adresse email valide.', 'error');
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* List header with stats & Export */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>
                      {newsletterSubscribers.filter(s => s.email.toLowerCase().includes(subscriberSearchQuery.toLowerCase())).length} abonné(s) affiché(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8," + ["Email,DateInscription", ...newsletterSubscribers.map(s => `"${s.email}","${s.subscribedAt}"`)].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `newsletter_abonnees_${new Date().toISOString().slice(0,10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showToast('Export CSV téléchargé !', 'success');
                      }}
                      className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Exporter (CSV)</span>
                    </button>
                  </div>

                  {/* Subscribers Scrollable List */}
                  <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {newsletterSubscribers.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        <Mail className="w-6 h-6 mx-auto stroke-1 mb-1 text-slate-400" />
                        <p>Aucun abonné inscrit pour le moment.</p>
                      </div>
                    ) : (
                      newsletterSubscribers
                        .filter(s => s.email.toLowerCase().includes(subscriberSearchQuery.toLowerCase()))
                        .map(sub => (
                          <div
                            key={sub.id}
                            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-between text-xs transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 truncate">{sub.email}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                Inscrit le {new Date(sub.subscribedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Désinscrire l\'abonné',
                                  message: `Voulez-vous retirer l'adresse "${sub.email}" de la newsletter ?`,
                                  confirmText: 'Désinscrire',
                                  onConfirm: async () => {
                                    await unsubscribeNewsletter(sub.email);
                                    showToast(`Abonné ${sub.email} désinscrit.`, 'info');
                                    closeConfirmModal();
                                  }
                                });
                              }}
                              title="Désinscrire cet abonné"
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Sub-panel for Custom Manual Email input */}
              {recipientTarget === 'custom_emails' && (
                <div className="pt-2 space-y-2 border-t border-slate-100 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Entrez les e-mails destinataires (séparés par des virgules ou retours à la ligne) :
                  </label>
                  <textarea
                    rows={4}
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    placeholder="jean@example.com, marie@domain.org&#10;contact@societe.sn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mail Content Composition & Live Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span>Composer le Message</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Personnalisez le sujet et le contenu avec des variables dynamiques</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Aperçu de rendu</span>
                  </button>
                </div>
              </div>

              {/* Variable Helper Tags */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Insérer une variable dynamique (cliquez pour ajouter) :</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{prenom}', 'html')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;prenom&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{nom}', 'html')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;nom&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{email}', 'html')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;email&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{role}', 'html')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;role&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{date}', 'html')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;date&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{nom_plateforme}', 'html')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;nom_plateforme&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariableTag('{lien_desabonnement}', 'html')}
                    className="px-2 py-1 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 text-indigo-700 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    + &#123;lien_desabonnement&#125;
                  </button>
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Sujet de l'e-mail :</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="Ex: 🎉 Joyeuses Fêtes de la part de {nom_plateforme} !"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* HTML Body Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">Contenu du message (HTML / Texte) :</label>
                  <span className="text-[10px] text-slate-400">Prise en charge complète des balises HTML et CSS en ligne</span>
                </div>
                <textarea
                  rows={14}
                  value={templateHtml}
                  onChange={(e) => setTemplateHtml(e.target.value)}
                  placeholder="<h1>Bonjour {prenom},</h1><p>Votre message ici...</p>"
                  spellCheck={false}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Progress bar during sending */}
              {isSending && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                      Envoi en cours de la campagne e-mail...
                    </span>
                    <span>{sendProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-200 rounded-full"
                      style={{ width: `${sendProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-4 py-2.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Sauvegarder comme Template</span>
                  </button>

                  {customTemplates.some(t => t.id === selectedTemplateId) && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentTpl = customTemplates.find(t => t.id === selectedTemplateId);
                        if (currentTpl) handleDeleteTemplate(currentTpl.id, currentTpl.title);
                      }}
                      className="px-3.5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Supprimer ce modèle personnalisé"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Supprimer le modèle</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSending || resolvedRecipients.length === 0}
                  onClick={handleSendBroadcast}
                  className={`px-6 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                    isSending || resolvedRecipients.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 active:scale-95'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>🚀 Lancer l'Envoi ({resolvedRecipients.length} destinataire{resolvedRecipients.length > 1 ? 's' : ''})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES MANAGER & CREATOR */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Bibliothèque de Modèles de Mails</span>
            </h3>

            <button
              onClick={() => {
                setEditingTemplateId(null);
                setTemplateTitle('Nouveau Template Personnalisé');
                setTemplateSubject('Sujet du mail...');
                setTemplateCategory('autre');
                setTemplateDescription('Description du modèle...');
                setTemplateHtml(`<div style="font-family: Arial, sans-serif; padding: 20px;">\n  <h2>Bonjour {prenom},</h2>\n  <p>Votre contenu personnalisé ici.</p>\n</div>`);
                setActiveSubTab('send');
                showToast('Éditeur réinitialisé pour créer un nouveau modèle', 'info');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un nouveau Modèle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Predefined Templates */}
            {PREDEFINED_TEMPLATES.map(tpl => (
              <div key={tpl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Modèle de Base
                    </span>
                    <span className="text-[10px] text-slate-400">Système</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{tpl.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.description}</p>
                  <div className="bg-slate-50 p-2 rounded-lg text-xs font-mono text-slate-700 truncate border border-slate-100">
                    Sujet: {tpl.subject}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setActiveSubTab('send');
                    }}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Utiliser ce modèle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Custom User Templates */}
            {customTemplates.map(tpl => (
              <div key={tpl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Template Personnalisé
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(tpl.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{tpl.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.description || 'Pas de description'}</p>
                  <div className="bg-slate-50 p-2 rounded-lg text-xs font-mono text-slate-700 truncate border border-slate-100">
                    Sujet: {tpl.subject}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setActiveSubTab('send');
                    }}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Utiliser</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Supprimer ce modèle de mail"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST HISTORY LOGS */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Historique des Campagnes d'E-mails Envoyées</span>
            </h3>
            <button
              onClick={() => {
                setBroadcastLogs([]);
                localStorage.removeItem('sio_broadcast_logs');
                showToast('Historique effacé', 'info');
              }}
              className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
            >
              Vider l'historique
            </button>
          </div>

          {broadcastLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Mail className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Aucune campagne e-mail envoyée pour le moment.</p>
              <p className="text-xs">Les e-mails envoyés apparaîtront ici avec leur nombre de destinataires.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {broadcastLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {log.recipientsCount} destinataire(s)
                      </span>
                      <p className="font-bold text-xs text-slate-900 truncate">{log.subject}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Modèle : <span className="font-medium text-slate-700">{log.templateTitle}</span> • Envoyé le {new Date(log.sentAt).toLocaleString('fr-FR')} par {log.sender}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Envoyé avec succès
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Aperçu du Rendu de l'E-mail</h3>
                  <p className="text-[11px] text-slate-400">Rendu personnalisé pour un destinataire exemple</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Bureau</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Preview Body */}
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-950 flex-1 flex flex-col items-center">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
                <p className="text-slate-400"><strong>À :</strong> {sampleRecipient.name} &lt;{sampleRecipient.email}&gt; ({sampleRecipient.role})</p>
                <p className="text-slate-300 font-bold"><strong>Sujet :</strong> {renderPersonalizedContent(sampleRecipient, templateSubject)}</p>
              </div>

              {/* Rendered HTML Container */}
              <div className={`transition-all duration-300 bg-white rounded-2xl overflow-y-auto max-h-[65vh] shadow-2xl p-6 text-slate-900 border border-slate-200 ${
                previewDevice === 'desktop' ? 'w-full max-w-2xl' : 'w-[360px]'
              }`}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: renderPersonalizedContent(sampleRecipient, templateHtml) 
                  }} 
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        itemName={confirmModal.itemName}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirmModal}
      />
    </div>
  );
}
