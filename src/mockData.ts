import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent, CustomHtmlPage } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    email: 'admin@dekel-formation.com',
    name: 'Admin Dekel.Formation',
    role: 'admin',
    avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177465.png',
    bio: 'Administrateur général de la plateforme de formation.',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'active'
  },
  {
    id: 'u-2',
    email: 'jean.formateur@gmail.com',
    name: 'Jean Dupont',
    role: 'trainer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Développeur Full-Stack passionné avec 12 ans d\'expérience. Formateur de plus de 5000 élèves sur le web.',
    createdAt: '2026-01-10T10:00:00Z',
    status: 'active'
  },
  {
    id: 'u-3',
    email: 'marie.formatrice@gmail.com',
    name: 'Marie Laurent',
    role: 'trainer',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    bio: 'Formatrice en création vidéo mobile et storytelling pour réseaux sociaux. Formatrice sur "Monter des vidéos avec le téléphone".',
    createdAt: '2026-02-01T14:30:00Z',
    status: 'active'
  },
  {
    id: 'u-6',
    email: 'ibrahim.toure@gmail.com',
    name: 'Ibrahim Touré',
    role: 'trainer',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    bio: 'Fondateur de Cash Nation. Expert en business digital, monétisation et génération de revenus.',
    createdAt: '2026-01-05T09:00:00Z',
    status: 'active'
  },
  {
    id: 'u-4',
    email: 'sophie.eleve@gmail.com',
    name: 'Sophie Martin',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    createdAt: '2026-03-15T09:15:00Z',
    status: 'active'
  },
  {
    id: 'u-5',
    email: 'pierre.dubois@gmail.com',
    name: 'Pierre Dubois',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-04-02T11:45:00Z',
    status: 'active'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c-1',
    title: "Monter des vidéos avec l'ordinateur",
    trainerId: 'u-2',
    trainerName: 'Jean Dupont',
    language: 'Français',
    description: 'La formation de référence pour maîtriser le montage vidéo professionnel sur PC et Mac avec Premiere Pro, DaVinci Resolve et CapCut Desktop. Découpage, effets, transitions et étalonnage.',
    themeColor: 'indigo',
    trainerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=100',
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800',
    status: 'published',
    createdAt: '2026-01-15T12:00:00Z',
    type: 'Montage Vidéo sur PC & Mac',
    price: 35000,
    level: 'Tous niveaux',
    duration: '25 heures',
    whatsappNumber: '+221771234567',
    contactInfo: 'WhatsApp: +221 77 123 45 67\nE-mail: support@dekel-formation.com'
  },
  {
    id: 'c-2',
    title: 'Monter des vidéos avec le téléphone',
    trainerId: 'u-3',
    trainerName: 'Marie Laurent',
    language: 'Français',
    description: 'Créez des vidéos captivantes, dynamiques et virales pour TikTok, Instagram Reels et YouTube Shorts directement avec votre smartphone (CapCut Mobile & VN).',
    themeColor: 'emerald',
    trainerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=100',
    coverImage: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800',
    status: 'published',
    createdAt: '2026-02-05T15:00:00Z',
    type: 'Montage Vidéo Mobile',
    price: 5000,
    level: 'Débutant',
    duration: '15 heures',
    whatsappNumber: '+221771234567',
    contactInfo: 'WhatsApp: +221 77 123 45 67\nE-mail: support@dekel-formation.com'
  },
  {
    id: 'c-3',
    title: 'Cash Nation',
    trainerId: 'u-6',
    trainerName: 'Ibrahim Touré',
    language: 'Français',
    description: 'Le programme ultime de Cash Nation pour transformer vos compétences en machine à cash, lancer des business en ligne rentables et générer des revenus récurrents en Afrique et à l\'international.',
    themeColor: 'amber',
    trainerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100',
    coverImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
    status: 'published',
    createdAt: '2026-03-01T09:00:00Z',
    type: 'Business & Monétisation',
    price: 25000,
    level: 'Tous niveaux',
    duration: '20 heures',
    whatsappNumber: '+221771234567',
    contactInfo: 'WhatsApp: +221 77 123 45 67\nE-mail: support@dekel-formation.com'
  }
];

export const INITIAL_MODULES: Module[] = [
  // Modules for Course 1 (c-1) - Monter des vidéos avec l'ordinateur
  { id: 'm-1', courseId: 'c-1', title: 'Module 1 : Prise en main des logiciels (Premiere Pro & DaVinci)', order: 1 },
  { id: 'm-2', courseId: 'c-1', title: 'Module 2 : Le dérushage, rythme et techniques de cut', order: 2 },
  { id: 'm-3', courseId: 'c-1', title: 'Module 3 : Sound design, étalonnage et export haute qualité', order: 3 },
  
  // Modules for Course 2 (c-2) - Monter des vidéos avec le téléphone
  { id: 'm-4', courseId: 'c-2', title: 'Module 1 : Prise en main de CapCut Mobile', order: 1 },
  { id: 'm-5', courseId: 'c-2', title: 'Module 2 : Sous-titres dynamiques, B-rolls et transitions virales', order: 2 },

  // Modules for Course 3 (c-3) - Cash Nation
  { id: 'm-6', courseId: 'c-3', title: 'Module 1 : Mindset & Fondations de Cash Nation', order: 1 },
  { id: 'm-7', courseId: 'c-3', title: 'Module 2 : Création d\'offres irrésistibles et closing', order: 2 },
  { id: 'm-8', courseId: 'c-3', title: 'Module 3 : Automatisation et scalabilité de vos revenus', order: 3 }
];

export const INITIAL_CHAPTERS: Chapter[] = [
  // Chapters for Module 1 of Course 1 (m-1)
  {
    id: 'ch-1',
    moduleId: 'm-1',
    courseId: 'c-1',
    title: 'Bienvenue dans la formation !',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    richText: `Bonjour à tous et bienvenue dans ce grand programme d'apprentissage !

Dans ce premier chapitre, nous allons voir ensemble :
* Le fonctionnement global de la plateforme.
* Le rythme d'apprentissage conseillé (3h par semaine).
* La présentation du projet final (un clone complet de Twitter en React).

N'oubliez pas de télécharger le plan d'études ci-dessous pour suivre votre progression de manière structurée !`,
    downloadableFiles: [
      { id: 'df-1', name: 'Plan d\'études de la formation - Développeur Web.pdf', url: '#', size: '1.2 Mo' }
    ],
    externalLinks: [
      { id: 'el-1', title: 'Rejoindre la Communauté Discord officielle', url: 'https://discord.gg/invite-link' }
    ],
    linkButton: { label: 'Remplir le questionnaire de profil', url: 'https://forms.google.com/profile-survey' }
  },
  {
    id: 'ch-2',
    moduleId: 'm-1',
    courseId: 'c-1',
    title: 'Installation de VS Code & extensions utiles',
    order: 2,
    videoSource: 'vimeo',
    videoUrl: 'https://vimeo.com/76979871',
    richText: `Pour coder efficacement, nous allons installer l'éditeur de texte de référence : **Visual Studio Code**.

### Extensions recommandées à installer immédiatement :
1. **Live Server** : Pour lancer un serveur web local en un clic.
2. **Prettier** : Pour formater votre code automatiquement à chaque sauvegarde.
3. **Auto Rename Tag** : Met à jour les balises fermantes HTML en même temps que les balises ouvrantes.
4. **Tailwind CSS IntelliSense** : Indispensable pour l'autocomplétion des classes CSS.`,
    linkButton: { label: 'Télécharger VS Code', url: 'https://code.visualstudio.com/' }
  },

  // Chapters for Module 2 of Course 1 (m-2)
  {
    id: 'ch-3',
    moduleId: 'm-2',
    courseId: 'c-1',
    title: 'La structure de base d\'une page HTML',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=M9mCHtIisdM',
    richText: `Tout fichier HTML commence par la même structure obligatoire. Voici le squelette minimal :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon premier site web</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Ceci est mon premier paragraphe rédigé en HTML5.</p>
</body>
</html>
\`\`\`

### Les points clés à retenir :
* Le \`<!DOCTYPE html>\` indique au navigateur qu\'il s\'agit d\'un document HTML5 moderne.
* Le bloc \`<head>\` contient les métadonnées de la page (non visibles directement pour l'utilisateur).
* Le bloc \`<body>\` englobe tout le contenu visible de votre site.`,
    externalLinks: [
      { id: 'el-2', title: 'Documentation MDN sur les éléments HTML', url: 'https://developer.mozilla.org/fr/docs/Web/HTML' }
    ]
  },
  {
    id: 'ch-4',
    moduleId: 'm-2',
    courseId: 'c-1',
    title: 'Les balises de texte principales (h1, p, strong, ul)',
    order: 2,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
    richText: `Dans ce chapitre, nous explorons les balises sémantiques indispensables pour mettre en page vos premiers textes.

* **h1 à h6** : Les titres par ordre d'importance logique.
* **p** : Les paragraphes standards.
* **strong** : Pour mettre un mot ou un groupe de mots en valeur (gras).
* **ul & li** : Les listes à puces non ordonnées.

Prenez le temps d'ouvrir VS Code et d'expérimenter en direct avec ces différentes balises !`
  },

  // Chapters for Module 3 of Course 1 (m-3)
  {
    id: 'ch-5',
    moduleId: 'm-3',
    courseId: 'c-1',
    title: 'Introduction aux sélecteurs et à CSS',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=1PnVor36_40',
    richText: `Le CSS (Cascading Style Sheets) permet de séparer le fond (HTML) de la forme (mise en page, couleurs, typographies).

Sélecteurs principaux que nous étudions :
* Sélecteur de balise : \`p { color: red; }\`
* Sélecteur de classe : \`.ma-classe { font-size: 18px; }\`
* Sélecteur d'identifiant (ID) : \`#mon-titre { text-align: center; }\``
  },

  // Chapters for Module 1 of Course 2 (m-4)
  {
    id: 'ch-6',
    moduleId: 'm-4',
    courseId: 'c-2',
    title: 'L\'état d\'esprit de l\'e-commerçant à succès',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    richText: `Lancer son e-commerce est une aventure entrepreneuriale palpitante. Avant de toucher à la technique, nous allons forger votre "Mindset" d'acier.

Nous verrons comment :
* Accepter l'échec initial comme un outil d'apprentissage rapide.
* Gérer votre budget publicitaire de manière responsable.
* Organiser votre planning quotidien pour rester constant.`,
    downloadableFiles: [
      { id: 'df-2', name: 'Feuille de route Mindset Entrepreneur.pdf', url: '#', size: '540 Ko' }
    ]
  },
  {
    id: 'ch-7',
    moduleId: 'm-4',
    courseId: 'c-2',
    title: 'Comment valider une niche de produit ?',
    order: 2,
    videoSource: 'vimeo',
    videoUrl: 'https://vimeo.com/76979871',
    richText: `Une bonne niche doit posséder 3 caractéristiques majeures :
1. Une forte demande (volume de recherche stable ou en croissance).
2. Un problème douloureux à résoudre ou une passion viscérale de l'acheteur.
3. Des produits faciles à expédier et avec une bonne marge bénéficiaire.

Nous utilisons des outils gratuits comme Google Trends pour valider nos hypothèses.`
  },

  // Chapters for Module 2 of Course 2 (m-5)
  {
    id: 'ch-8',
    moduleId: 'm-5',
    courseId: 'c-2',
    title: 'Création du compte Shopify & configuration de base',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
    richText: `Découverte pas-à-pas de l'interface d'administration de Shopify. Nous allons configurer votre devise, vos informations de livraison et vos conditions générales obligatoires.`,
    linkButton: { label: 'Profiter de Shopify à 1€ par mois', url: 'https://shopify.pxf.io/free-trial' }
  },
  {
    id: 'ch-9',
    moduleId: 'm-6',
    courseId: 'c-3',
    title: 'Mindset & Vision : Les secrets de Cash Nation',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    richText: `Bienvenue dans le programme Cash Nation !
Dans ce module introductif, nous posons les piliers fondamentaux :
* Comment passer d'une mentalité de consommateur à celle de créateur de richesses.
* Identifier les besoins non satisfaits sur le marché digital.
* Définir ses objectifs financiers mensuels et sa feuille de route stratégique.`,
    downloadableFiles: [
      { id: 'df-3', name: 'Plan d\'action Cash Nation - Feuille de route.pdf', url: '#', size: '1.8 Mo' }
    ]
  },
  {
    id: 'ch-10',
    moduleId: 'm-7',
    courseId: 'c-3',
    title: 'Créer une offre irrésistible & Closing WhatsApp',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=M9mCHtIisdM',
    richText: `L'art du closing et de la conversion :
1. **La proposition de valeur unique** : Pourquoi le prospect doit acheter chez vous maintenant.
2. **Scripts de vente WhatsApp** : Comment convertir des prospects en clients payants sans forcer.
3. **Moyens de paiement locaux** : Intégrer Orange Money, MTN MoMo et Wave pour lever toute friction.`,
    externalLinks: [
      { id: 'el-3', title: 'Rejoindre le canal privé Telegram Cash Nation', url: 'https://t.me/cashnation' }
    ]
  },
  {
    id: 'ch-11',
    moduleId: 'm-8',
    courseId: 'c-3',
    title: 'Automatiser ses ventes et scaler à plus de 1M FCFA/mois',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
    richText: `Comment bâtir un système automatisé qui génère des revenus 24h/24 :
* Tunnels de vente simples et efficaces.
* Automatisation des accès après paiement Mobile Money.
* Délégation et recrutement de partenaires affiliés.`
  }
];

export const INITIAL_ENROLLMENTS: Enrollment[] = [
  {
    id: 'e-1',
    studentEmail: 'sophie.eleve@gmail.com',
    courseId: 'c-1',
    status: 'active',
    enrolledAt: '2026-03-15T09:30:00Z'
  },
  {
    id: 'e-2',
    studentEmail: 'pierre.dubois@gmail.com',
    courseId: 'c-2',
    status: 'active',
    enrolledAt: '2026-04-02T12:00:00Z'
  }
];

export const INITIAL_PROGRESS: StudentProgress[] = [
  {
    studentEmail: 'sophie.eleve@gmail.com',
    courseId: 'c-1',
    completedChapterIds: ['ch-1', 'ch-2'],
    lastAccessedAt: '2026-07-10T15:30:00Z'
  },
  {
    studentEmail: 'pierre.dubois@gmail.com',
    courseId: 'c-2',
    completedChapterIds: ['ch-6'],
    lastAccessedAt: '2026-07-11T18:45:00Z'
  }
];

export const INITIAL_EMAILS: SimulatedEmail[] = [
  {
    id: 'em-1',
    to: 'sophie.eleve@gmail.com',
    subject: 'Bienvenue dans votre formation : Devenir Développeur Web Moderne !',
    body: `Félicitations Sophie Martin ! Vos accès ont été accordés.
Vous pouvez vous connecter dès maintenant sur la plateforme avec votre adresse e-mail pour commencer le cours "Devenir Développeur Web Moderne".

Formateur : Jean Dupont
Lien de connexion : Plateforme Dekel.Formation`,
    sentAt: '2026-03-15T09:31:00Z'
  },
  {
    id: 'em-2',
    to: 'pierre.dubois@gmail.com',
    subject: 'Accès activé : E-Commerce Extrême : De Zéro à 5 000 000 FCFA/mois',
    body: `Bonjour Pierre Dubois,
Marie Laurent vient de valider votre preuve de paiement et vous a inscrit au cours "E-Commerce Extrême : De Zéro à 5 000 000 FCFA/mois".

Rendez-vous sur la plateforme pour démarrer votre première leçon !`,
    sentAt: '2026-04-02T12:01:00Z'
  }
];

export const INITIAL_PRE_REGISTERED: PreRegisteredStudent[] = [
  {
    email: 'nouveau.futur.eleve@gmail.com',
    courseIds: ['c-1', 'c-3']
  }
];

export const INITIAL_CATEGORIES: string[] = [
  'Développement',
  'E-commerce',
  'Design',
  'Marketing',
  'Montage Vidéo',
  'Miniatures',
  'Flyers'
];

export const INITIAL_CUSTOM_PAGES: CustomHtmlPage[] = [
  {
    id: 'page-video-ordinateur',
    title: 'Formation Montage Vidéo sur PC - Masterclass Complète',
    slug: 'video-ordinateur',
    status: 'published',
    seoTitle: 'Formation Montage Vidéo sur Ordinateur - Jean Dupont',
    seoDescription: 'Apprenez le montage vidéo professionnel sur ordinateur de A à Z avec Premiere Pro et DaVinci Resolve.',
    ogImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200',
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-08-10T14:30:00Z',
    authorId: 'u-2',
    authorName: 'Jean Dupont',
    authorEmail: 'jean.dupont@gmail.com',
    viewsCount: 268,
    html: `<div class="container">
  <div class="tag">Édition Spéciale 2026</div>
  <h1>Maîtrisez le Montage Vidéo Pro sur Ordinateur</h1>
  <p class="desc">Découvrez les secrets de montage des créateurs à succès : découpage rythmé, étalonnage cinéma, sound design et exports 4K.</p>
  
  <div class="stats-row">
    <div class="stat-box"><strong>+350</strong><span>Élèves Formés</span></div>
    <div class="stat-box"><strong>4.9/5</strong><span>Note Moyenne</span></div>
    <div class="stat-box"><strong>100%</strong><span>Pratique</span></div>
  </div>

  <div class="offer-box">
    <div class="price-tag">50 000 FCFA <span class="old-price">95 000 FCFA</span></div>
    <a href="/formation/monter-des-videos-avec-l-ordinateur" class="btn-primary">Rejoindre la formation</a>
    <p class="note">Accès instantané et illimité à vie • Assistance personnalisée</p>
  </div>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: #090d16;
  color: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
}
.container {
  max-width: 640px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}
.tag {
  display: inline-block;
  background: #4f46e5;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 99px;
  margin-bottom: 20px;
  text-transform: uppercase;
}
h1 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 16px;
  line-height: 1.3;
}
.desc {
  color: #94a3b8;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 28px;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}
.stat-box {
  background: #1f2937;
  padding: 14px 8px;
  border-radius: 12px;
}
.stat-box strong {
  display: block;
  font-size: 20px;
  color: #818cf8;
}
.stat-box span {
  font-size: 11px;
  color: #94a3b8;
}
.offer-box {
  background: rgba(79, 70, 229, 0.1);
  border: 1px solid rgba(79, 70, 229, 0.3);
  padding: 24px;
  border-radius: 16px;
}
.price-tag {
  font-size: 26px;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 16px;
}
.old-price {
  font-size: 16px;
  color: #64748b;
  text-decoration: line-through;
  margin-left: 8px;
}
.btn-primary {
  display: block;
  width: 100%;
  background: #4f46e5;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  font-size: 16px;
  transition: 0.2s;
}
.btn-primary:hover {
  background: #4338ca;
}
.note {
  font-size: 12px;
  color: #64748b;
  margin-top: 12px;
  margin-bottom: 0;
}`,
    js: `console.log("Page de vente Montage PC initialisée.");`
  },
  {
    id: 'page-video-smartphone',
    title: 'Formation Montage Vidéo sur Smartphone - Créateurs Mobiles',
    slug: 'video-telephone',
    status: 'published',
    seoTitle: 'Formation Montage Vidéo Smartphone - Marie Laurent',
    seoDescription: 'Créez des vidéos virales pour TikTok, Reels et Shorts directement depuis votre téléphone avec CapCut.',
    ogImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200',
    createdAt: '2026-06-20T10:30:00Z',
    updatedAt: '2026-08-12T16:00:00Z',
    authorId: 'u-3',
    authorName: 'Marie Laurent',
    authorEmail: 'marie.laurent@gmail.com',
    viewsCount: 195,
    html: `<div class="phone-card">
  <div class="mobile-badge">📱 100% Smartphone</div>
  <h2>Devenez Viral Grâce au Montage sur Téléphone</h2>
  <p class="lead">Pas besoin d'ordinateur coûteux ! Apprenez à monter des vidéos percutantes qui captivent l'attention dès les 3 premières secondes.</p>

  <div class="bullet-list">
    <div class="bullet-item">✨ Les transitions dynamiques CapCut</div>
    <div class="bullet-item">🔥 Le sous-titrage automatique animé</div>
    <div class="bullet-item">🎵 Le mixage audio et effets sonores</div>
  </div>

  <div class="checkout-box">
    <span class="cost">30 000 FCFA</span>
    <a href="/formation/monter-des-videos-avec-le-telephone" class="join-btn">S'inscrire maintenant</a>
  </div>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}
.phone-card {
  max-width: 500px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 24px;
  padding: 36px 28px;
  text-align: center;
}
.mobile-badge {
  background: #ec4899;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 99px;
  display: inline-block;
  margin-bottom: 18px;
}
h2 {
  font-size: 24px;
  margin: 0 0 12px;
}
.lead {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 24px;
}
.bullet-list {
  text-align: left;
  background: #0f172a;
  padding: 16px 20px;
  border-radius: 14px;
  margin-bottom: 24px;
}
.bullet-item {
  font-size: 13px;
  color: #e2e8f0;
  padding: 6px 0;
}
.checkout-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cost {
  font-size: 24px;
  font-weight: 800;
  color: #38bdf8;
}
.join-btn {
  background: #ec4899;
  color: #fff;
  text-decoration: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  transition: 0.2s;
}
.join-btn:hover {
  background: #db2777;
}`,
    js: `console.log("Page Smartphone chargée.");`
  },
  {
    id: 'page-cash-nation-vip',
    title: 'Cash Nation - Programme Privé d\'Accompagnement',
    slug: 'cash-nation',
    status: 'published',
    seoTitle: 'Cash Nation - Accompagnement Exclusif Ibrahim Touré',
    seoDescription: 'Développez des sources de revenus durables en Afrique et à l\'international grâce aux stratégies Cash Nation.',
    ogImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200',
    createdAt: '2026-07-05T08:00:00Z',
    updatedAt: '2026-08-14T11:20:00Z',
    authorId: 'u-6',
    authorName: 'Ibrahim Touré',
    authorEmail: 'ibrahim.toure@gmail.com',
    viewsCount: 312,
    html: `<div class="gold-box">
  <div class="gold-badge">💎 PROGRAMME EXCLUSIF</div>
  <h1>Cash Nation : Bâtir son Écosystème Financier</h1>
  <p class="intro">La méthode concrète étape par étape pour monétiser vos compétences et structurer des revenus récurrents.</p>

  <div class="highlight-grid">
    <div class="highlight-card">
      <h3>🚀 Stratégies Éprouvées</h3>
      <p>Modèles validés sur le terrain avec études de cas réelles.</p>
    </div>
    <div class="highlight-card">
      <h3>🤝 Réseau d'Élite</h3>
      <p>Accès au canal privé des membres actifs de Cash Nation.</p>
    </div>
  </div>

  <div class="price-container">
    <div class="tarification">45 000 FCFA <small>/ Accès Complet</small></div>
    <a href="/formation/cash-nation" class="btn-gold">Intégrer Cash Nation</a>
  </div>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: #030712;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
}
.gold-box {
  max-width: 600px;
  background: #0f172a;
  border: 1px solid #ca8a04;
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 0 30px rgba(202, 138, 4, 0.15);
}
.gold-badge {
  background: linear-gradient(90deg, #ca8a04, #eab308);
  color: #000;
  font-size: 11px;
  font-weight: 900;
  padding: 5px 14px;
  border-radius: 99px;
  display: inline-block;
  margin-bottom: 20px;
}
h1 {
  font-size: 26px;
  margin: 0 0 14px;
}
.intro {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 28px;
}
.highlight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 28px;
  text-align: left;
}
.highlight-card {
  background: #1e293b;
  border: 1px solid #334155;
  padding: 16px;
  border-radius: 14px;
}
.highlight-card h3 {
  font-size: 14px;
  margin: 0 0 6px;
  color: #fde047;
}
.highlight-card p {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}
.tarification {
  font-size: 28px;
  font-weight: 900;
  color: #fde047;
  margin-bottom: 14px;
}
.tarification small {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}
.btn-gold {
  display: block;
  width: 100%;
  background: linear-gradient(90deg, #ca8a04, #eab308);
  color: #000;
  font-weight: 800;
  padding: 16px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 16px;
  transition: 0.2s;
}
.btn-gold:hover {
  opacity: 0.9;
}`,
    js: `console.log("Cash Nation VIP chargé.");`
  },
  {
    id: 'page-offre-speciale',
    title: 'Offre Spéciale Lancement',
    slug: 'offre-speciale',
    status: 'published',
    seoTitle: 'Offre Spéciale Lancement - Dekel.Formation',
    seoDescription: 'Profitez de -50% sur toutes nos formations certifiantes pendant une durée limitée !',
    ogImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-15T14:20:00Z',
    authorId: 'u-2',
    authorName: 'Jean Dupont',
    authorEmail: 'jean.dupont@gmail.com',
    viewsCount: 342,
    html: `<div class="hero-container">
  <div class="badge">🔥 Offre Exclusive Limitée</div>
  <h1>Accélérez Votre Carrière avec nos Formations Certifiantes</h1>
  <p class="subtitle">Bénéficiez de <strong>-50% de réduction immédiate</strong> sur tout le catalogue jusqu'à ce soir minuit.</p>
  
  <div class="timer-card">
    <span class="timer-label">L'offre se termine dans :</span>
    <div id="countdown" class="countdown-display">00h 45m 30s</div>
  </div>

  <div class="actions">
    <a href="/#catalog" class="cta-button" id="claimBtn">Profiter de l'offre (-50%)</a>
    <p class="guarantee">Accès à vie • Certificat inclus • Garantie 14 jours</p>
  </div>
</div>`,
    css: `body {
  margin: 0;
  padding: 0;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #ffffff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-container {
  max-width: 680px;
  margin: 40px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 48px 36px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.badge {
  display: inline-block;
  background: linear-gradient(90deg, #e11d48, #f43f5e);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 999px;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

h1 {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.25;
  margin: 0 0 16px 0;
  background: linear-gradient(to right, #ffffff, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 16px;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 32px;
}

.timer-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(225, 29, 72, 0.3);
  padding: 18px;
  border-radius: 16px;
  margin-bottom: 32px;
}

.timer-label {
  display: block;
  font-size: 12px;
  color: #f43f5e;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.countdown-display {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #ffffff;
}

.cta-button {
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
  background: #e11d48;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  padding: 16px 32px;
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.4);
}

.cta-button:hover {
  background: #f43f5e;
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(225, 29, 72, 0.6);
}

.guarantee {
  font-size: 12px;
  color: #64748b;
  margin-top: 14px;
}`,
    js: `// Compte à rebours dynamique de test
let totalSeconds = 2730; // 45m 30s
const timerEl = document.getElementById('countdown');

function updateTimer() {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const formatted = [
    h.toString().padStart(2, '0') + 'h',
    m.toString().padStart(2, '0') + 'm',
    s.toString().padStart(2, '0') + 's'
  ].join(' ');

  if (timerEl) timerEl.textContent = formatted;
  if (totalSeconds > 0) totalSeconds--;
}

setInterval(updateTimer, 1000);
updateTimer();

document.getElementById('claimBtn')?.addEventListener('click', function(e) {
  console.log('Offre cliquée par le prospect!');
});`
  },
  {
    id: 'page-masterclass-ia',
    title: 'Masterclass Gratuite - IA & Automatisation',
    slug: 'masterclass',
    status: 'published',
    seoTitle: 'Masterclass Gratuite : Maîtriser l\'IA en 2026',
    seoDescription: 'Inscrivez-vous gratuitement à notre session en direct pour automatiser vos tâches et créer vos formations avec l\'IA.',
    ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-07-22T09:15:00Z',
    authorId: 'u-1',
    authorName: 'Dekel Formation',
    authorEmail: 'service@dekel-dev.com',
    viewsCount: 189,
    html: `<div class="wrapper">
  <div class="card">
    <div class="header">
      <span class="live-pill">LIVE WEBINAR</span>
      <h2>Masterclass IA & Automatisation 2026</h2>
      <p>Comment multiplier par 5 votre productivité avec les derniers modèles d'IA.</p>
    </div>
    
    <div class="form-group">
      <label for="userName">Votre Prénom</label>
      <input type="text" id="userName" placeholder="Ex: Alex" />
    </div>

    <div class="form-group">
      <label for="userEmail">Votre Adresse E-mail</label>
      <input type="email" id="userEmail" placeholder="votre.email@exemple.com" />
    </div>

    <button id="registerBtn" class="btn">Réserver ma place gratuite</button>
    <div id="statusMsg" class="status-message"></div>
  </div>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.wrapper {
  width: 100%;
  max-width: 480px;
  padding: 20px;
  box-sizing: border-box;
}

.card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.live-pill {
  background: #238636;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 1px;
}

h2 {
  font-size: 22px;
  margin: 16px 0 8px 0;
  color: #ffffff;
}

p {
  font-size: 14px;
  color: #8b949e;
  margin-bottom: 24px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #c9d1d9;
  margin-bottom: 6px;
}

input {
  width: 100%;
  box-sizing: border-box;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

input:focus {
  border-color: #58a6ff;
}

.btn {
  width: 100%;
  background: #1f6beb;
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}

.btn:hover {
  background: #388bfd;
}

.status-message {
  margin-top: 16px;
  font-size: 13px;
  text-align: center;
}`,
    js: `document.getElementById('registerBtn')?.addEventListener('click', function() {
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const status = document.getElementById('statusMsg');

  if (!email) {
    status.style.color = '#f85149';
    status.textContent = 'Veuillez saisir une adresse e-mail valide.';
    return;
  }

  status.style.color = '#3fb950';
  status.textContent = '🎉 Félicitations ' + (name || '') + ' ! Votre place a été réservée avec succès.';
});`
  }
];

