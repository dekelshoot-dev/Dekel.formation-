import { User, Course, Module, Chapter, Enrollment, StudentProgress, SimulatedEmail, PreRegisteredStudent } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    email: 'admin@dekel-formation.com',
    name: 'Admin Dekel.Formation',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Administrateur général de la plateforme de formation.',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'active'
  },
  {
    id: 'u-2',
    email: 'jean.formateur@gmail.com',
    name: 'Jean Dupont',
    role: 'trainer',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
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
    bio: 'Experte en e-commerce et marketing digital. Créatrice de 3 marques à succès sur Shopify.',
    createdAt: '2026-02-01T14:30:00Z',
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
    title: 'Devenir Développeur Web Moderne',
    trainerId: 'u-2',
    trainerName: 'Jean Dupont',
    language: 'Français',
    description: 'Apprenez le HTML, CSS, JavaScript, React et Node.js pour créer des applications web professionnelles de A à Z. Aucun prérequis nécessaire !',
    themeColor: 'indigo',
    trainerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=100',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    status: 'published',
    createdAt: '2026-01-15T12:00:00Z',
    type: 'Développement Web',
    price: 150000,
    level: 'Débutant',
    duration: '30 heures'
  },
  {
    id: 'c-2',
    title: 'E-Commerce Extrême : De Zéro à 5 000 000 FCFA/mois',
    trainerId: 'u-3',
    trainerName: 'Marie Laurent',
    language: 'Français',
    description: 'Le plan d\'action complet pour lancer votre boutique en ligne sans stock, trouver des produits gagnants et générer des ventes grâce aux réseaux sociaux.',
    themeColor: 'emerald',
    trainerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100',
    coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    status: 'published',
    createdAt: '2026-02-05T15:00:00Z',
    type: 'E-commerce & Marketing',
    price: 250000,
    level: 'Intermédiaire',
    duration: '20 heures'
  },
  {
    id: 'c-3',
    title: 'Masterclass Design UX/UI & Figma',
    trainerId: 'u-2',
    trainerName: 'Jean Dupont',
    language: 'Français',
    description: 'Maîtrisez l\'outil de design Figma et concevez des interfaces mobiles et desktop sublimes, ergonomiques et prêtes à être codées.',
    themeColor: 'rose',
    trainerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    coverImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800',
    status: 'published',
    createdAt: '2026-03-01T09:00:00Z',
    type: 'Design UI/UX',
    price: 125000,
    level: 'Tous niveaux',
    duration: '15 heures'
  },
  {
    id: 'c-4',
    title: 'Bâtir son Audience Instagram Organique',
    trainerId: 'u-3',
    trainerName: 'Marie Laurent',
    language: 'Français',
    description: 'La méthode pas-à-pas pour attirer 10 000 abonnés qualifiés sans dépenser un seul centime en publicité et monétiser son compte dès le premier jour.',
    themeColor: 'amber',
    trainerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100',
    coverImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800',
    status: 'draft',
    createdAt: '2026-04-10T17:30:00Z',
    type: 'Marketing d\'Influence',
    price: 75000,
    level: 'Débutant',
    duration: '8 heures'
  },
  {
    id: 'c-5',
    title: 'Montage Vidéo de Pro : De CapCut à Premiere Pro',
    trainerId: 'u-2',
    trainerName: 'Jean Dupont',
    language: 'Français',
    description: 'Maîtrisez les techniques de montage vidéo professionnelles. Apprenez à couper, rythmer, étalonner, ajouter des effets sonores et exporter des vidéos captivantes pour YouTube, TikTok et Instagram.',
    themeColor: 'sky',
    trainerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=100',
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800',
    status: 'published',
    createdAt: '2026-05-01T10:00:00Z',
    type: 'Montage Vidéo',
    price: 95000,
    level: 'Débutant',
    duration: '12 heures'
  },
  {
    id: 'c-6',
    title: 'L\'Art des Miniatures YouTube Explosives',
    trainerId: 'u-2',
    trainerName: 'Jean Dupont',
    language: 'Français',
    description: 'La méthode complète pour concevoir des miniatures (thumbnails) qui maximisent le taux de clic (CTR). Maîtrisez le cadrage, la théorie des couleurs, le détourage et l\'intégration de textes impactants sur Photoshop et Canva.',
    themeColor: 'rose',
    trainerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?w=100',
    coverImage: 'https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?w=800',
    status: 'published',
    createdAt: '2026-05-10T14:00:00Z',
    type: 'Miniatures',
    price: 45000,
    level: 'Tous niveaux',
    duration: '6 heures'
  },
  {
    id: 'c-7',
    title: 'Conception de Flyers & Identités Visuelles d\'Impact',
    trainerId: 'u-3',
    trainerName: 'Marie Laurent',
    language: 'Français',
    description: 'Créez des flyers promotionnels professionnels, des affiches publicitaires et des visuels pour réseaux sociaux qui captent l\'attention. Idéal pour freelances, créateurs de contenu et entreprises.',
    themeColor: 'emerald',
    trainerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=100',
    coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=800',
    status: 'published',
    createdAt: '2026-05-15T09:00:00Z',
    type: 'Flyers',
    price: 60000,
    level: 'Débutant',
    duration: '8 heures'
  }
];

export const INITIAL_MODULES: Module[] = [
  // Modules for Course 1 (c-1)
  { id: 'm-1', courseId: 'c-1', title: 'Module 1 : Introduction & Préparatifs', order: 1 },
  { id: 'm-2', courseId: 'c-1', title: 'Module 2 : Les bases du HTML5', order: 2 },
  { id: 'm-3', courseId: 'c-1', title: 'Module 3 : Styliser avec CSS3', order: 3 },
  
  // Modules for Course 2 (c-2)
  { id: 'm-4', courseId: 'c-2', title: 'Module 1 : Les bases de la niche', order: 1 },
  { id: 'm-5', courseId: 'c-2', title: 'Module 2 : Créer sa boutique Shopify', order: 2 },

  // Modules for Course 5 (c-5)
  { id: 'm-6', courseId: 'c-5', title: 'Module 1 : Maîtrise des logiciels de montage', order: 1 },

  // Modules for Course 6 (c-6)
  { id: 'm-7', courseId: 'c-6', title: 'Module 1 : Les règles d\'or de la Miniature', order: 1 },

  // Modules for Course 7 (c-7)
  { id: 'm-8', courseId: 'c-7', title: 'Module 1 : Fondations du Graphisme & Flyers', order: 1 }
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
    courseId: 'c-5',
    title: 'Les bases du montage : Découpe, rythme et transition',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    richText: `Dans ce cours, nous allons poser les bases du montage vidéo.

### Ce que vous allez apprendre :
* Comment organise votre timeline de projet.
* L'art du "cut" pour éliminer les temps morts.
* L'intégration de transitions fluides et professionnelles.

Prenez vos fichiers d'entraînement ci-dessous et commencez à pratiquer en direct !`,
    downloadableFiles: [
      { id: 'df-3', name: 'Pack de Rushs d\'entraînement (Vlog & Facecam).zip', url: '#', size: '145 Mo' }
    ]
  },
  {
    id: 'ch-10',
    moduleId: 'm-7',
    courseId: 'c-6',
    title: 'La psychologie du clic : théorie des visages et couleurs',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=M9mCHtIisdM',
    richText: `Pourquoi un internaute clique-t-il sur une vidéo plutôt qu'une autre ?

### Les secrets d'une miniature cliquable :
1. **La règle des 3 éléments max** : Le cerveau humain doit comprendre le sujet de la vidéo en moins d'une seconde.
2. **L'expression faciale exagérée** : Les visages génèrent de l'empathie et de la curiosité.
3. **Le contraste fort** : Utiliser des contours lumineux et des textes à fort contraste (jaune, rouge, blanc sur fond sombre).`,
    externalLinks: [
      { id: 'el-3', title: 'Site de référence : Thumbsup.tv (Tester son design en direct)', url: 'https://thumbsup.tv' }
    ]
  },
  {
    id: 'ch-11',
    moduleId: 'm-8',
    courseId: 'c-7',
    title: 'Composer une affiche commerciale équilibrée',
    order: 1,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
    richText: `Un flyer efficace doit guider l'œil du prospect.

### Structure universelle d'un flyer :
* **Accroche principale** : visible à plus de 2 mètres.
* **L'offre ou la valeur ajoutée** : claire et chiffrée (ex: -20% sur tout).
* **Call to action (Appel à l'action)** : QR Code, numéro de téléphone WhatsApp ou adresse de l'événement.`
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
