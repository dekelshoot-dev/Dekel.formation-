import React, { useState } from 'react';
import { 
  BookOpen, ShieldCheck, FileText, Lock, Cookie, Building, Mail, Phone, MapPin, Clock, Search, HelpCircle, MessageSquare, Send, CheckCircle, ChevronDown, ChevronUp, User as UserIcon, Star, Award, Sparkles, ExternalLink, ArrowRight, LifeBuoy, Layers, AlertCircle, PhoneCall
} from 'lucide-react';
import { User, Course, Enrollment, SimulatedEmail } from '../types';
import { showToast } from './Toast';

interface PublicPageProps {
  onNavigate: (path: string) => void;
}

interface LegalPagesProps extends PublicPageProps {
  initialDoc?: 'terms' | 'privacy' | 'cookies' | 'legal';
}

/**
 * 1. LEGAL PAGES (Terms, Privacy, Cookies, Legal Notice)
 */
export function LegalPages({ initialDoc = 'terms', onNavigate }: LegalPagesProps) {
  const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy' | 'cookies' | 'legal'>(initialDoc);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass border-white/10 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden text-center sm:text-left">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transparence & Sécurité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Centre Légal & Conformité</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Consultez nos conditions générales d'utilisation, politique de confidentialité, gestion des cookies et mentions légales.
          </p>
        </div>
      </div>

      {/* Document Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-md">
        <button
          onClick={() => { setActiveDoc('terms'); onNavigate('/p/terms'); }}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeDoc === 'terms' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Conditions d'utilisation</span>
        </button>

        <button
          onClick={() => { setActiveDoc('privacy'); onNavigate('/p/privacy'); }}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeDoc === 'privacy' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Confidentialité</span>
        </button>

        <button
          onClick={() => { setActiveDoc('cookies'); onNavigate('/p/cookies'); }}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeDoc === 'cookies' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Cookie className="w-4 h-4" />
          <span>Gestion des Cookies</span>
        </button>

        <button
          onClick={() => { setActiveDoc('legal'); onNavigate('/p/legal'); }}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeDoc === 'legal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Mentions Légales</span>
        </button>
      </div>

      {/* Document Content Box */}
      <div className="glass border-white/10 rounded-3xl p-6 sm:p-10 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-6">
        {activeDoc === 'terms' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-black text-white">Conditions Générales d'Utilisation (CGU)</h2>
              <p className="text-xs text-slate-400 mt-1">Dernière mise à jour : 1er Janvier 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">1. Objet et Champ d'application</h3>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme de formation en ligne <strong>Dekel.Formation</strong>. En créant un compte ou en naviguant sur la plateforme, l'utilisateur accepte sans réserve l'intégralité des présentes conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">2. Accès aux Services et Inscription</h3>
              <p>
                L'accès à l'espace étudiant ou formateur nécessite la création d'un compte individuel. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants de connexion. Dekel.Formation se réserve le droit de suspendre tout compte présentant une utilisation frauduleuse ou non autorisée.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">3. Propriété Intellectuelle</h3>
              <p>
                Tous les contenus diffusés sur la plateforme (vidéos, supports PDF, textes, exercices, logos, éléments graphiques) sont la propriété exclusive de Dekel.Formation et de ses formateurs partenaires. Toute reproduction, redistribution ou revente non autorisée est strictement interdite sous peine de poursuites judiciaires.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">4. Inscription aux Formations et Paiements</h3>
              <p>
                L'accès aux formations payantes s'effectue après validation du paiement intégral via nos modes de paiement partenaires (Mobile Money Orange/MTN, Virement Bancaire ou Carte). Les accès accordés sont personnels, intransmissibles et valables pour toute la durée de publication de la formation.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">5. Droit de Rétractation & Remboursement</h3>
              <p>
                Conformément aux réglementations applicables aux contenus numériques fournis immédiatement, l'accès complet aux contenus pédagogiques consommé annule le droit de rétractation. En cas de motif légitime ou de problème technique avéré de la plateforme empêchant le visionnage des cours, notre support étudiera les demandes au cas par cas.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">6. Responsabilité & Disponibilité du Service</h3>
              <p>
                Dekel.Formation s'efforce d'assurer une disponibilité de la plateforme 24h/24 et 7j/7. Toutefois, l'accès peut être temporairement interrompu pour des raisons de maintenance technique ou de mises à jour système sans préavis.
              </p>
            </section>
          </div>
        )}

        {activeDoc === 'privacy' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-black text-white">Politique de Confidentialité & Protection des Données</h2>
              <p className="text-xs text-slate-400 mt-1">Dernière mise à jour : 1er Janvier 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">1. Collecte des Données Personnelles</h3>
              <p>
                Nous collectons uniquement les informations personnelles strictement nécessaires au bon fonctionnement de nos services de formation : nom, prénom, adresse e-mail, numéro de téléphone, historique de progression pédagogique et preuves de règlement.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">2. Utilisation et Finalités du Traitement</h3>
              <p>
                Vos données personnelles sont traitées exclusivement pour :
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2">
                <li>Activer vos accès aux cours achetés et enregistrer votre progression ;</li>
                <li>Vous envoyer des notifications administratives et confirmations d'inscription ;</li>
                <li>Assurer la gestion du support client et répondre à vos demandes ;</li>
                <li>Améliorer l'expérience utilisateur et la sécurité de notre plateforme.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">3. Non-Divulgation aux Tiers</h3>
              <p>
                Dekel.Formation ne vend, ne loue et ne cède aucune de vos données personnelles à des tiers à des fins publicitaires ou commerciales. Les seules transmissions autorisées concernent nos sous-traitants techniques sécurisés (hébergement cloud, passerelles d'envoi d'e-mails).
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">4. Vos Droits (Accès, Rectification, Suppression)</h3>
              <p>
                Vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression définitive de l'ensemble de vos données personnelles. Vous pouvez exercer ce droit à tout moment en contactant notre délégué à la protection des données à l'adresse : <strong>support@dekel-formation.com</strong>.
              </p>
            </section>
          </div>
        )}

        {activeDoc === 'cookies' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-black text-white">Politique relative aux Cookies</h2>
              <p className="text-xs text-slate-400 mt-1">Dernière mise à jour : 1er Janvier 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">1. Qu'est-ce qu'un Cookie ?</h3>
              <p>
                Un cookie est un petit fichier texte déposé sur votre navigateur lors de la visite d'un site web. Il permet de conserver vos préférences de navigation et d'assurer une expérience fluide et personnalisée.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">2. Typologie des Cookies Utilisés</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <h4 className="font-bold text-white text-xs">Cookies Essentiels (Obligatoires)</h4>
                  <p className="text-[11px] text-slate-300">Indispensables pour maintenir votre session connectée, sécuriser vos achats et enregistrer la lecture des cours.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <h4 className="font-bold text-white text-xs">Cookies de Préférences</h4>
                  <p className="text-[11px] text-slate-300">Memorisation de vos choix d'affichage (thème sombre/clair, langue, filtres du catalogue).</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">3. Gestion de vos Préférences</h3>
              <p>
                Vous pouvez configurer votre navigateur internet à tout moment pour refuser le dépôt de cookies non essentiels ou être averti avant toute installation. Notez toutefois que la désactivation complète des cookies indispensables peut altérer l'accès à certaines fonctionnalités de votre espace étudiant.
              </p>
            </section>
          </div>
        )}

        {activeDoc === 'legal' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-black text-white">Mentions Légales & Identification Éditeur</h2>
              <p className="text-xs text-slate-400 mt-1">Dernière mise à jour : 1er Janvier 2026</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Éditeur du Site
                </h3>
                <div className="space-y-1 text-xs text-slate-300">
                  <p><strong className="text-white">Raison sociale :</strong> Dekel.Formation SAS</p>
                  <p><strong className="text-white">Siège Social :</strong> Akwa, Douala, Cameroun</p>
                  <p><strong className="text-white">Numéro d'immatriculation :</strong> RC/DLA/2026/B/1234</p>
                  <p><strong className="text-white">E-mail de contact :</strong> contact@dekel-formation.com</p>
                  <p><strong className="text-white">Téléphone :</strong> +237 6 00 00 00 00</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Hébergement & Infrastructure
                </h3>
                <div className="space-y-1 text-xs text-slate-300">
                  <p><strong className="text-white">Hébergeur Cloud :</strong> Google Cloud Platform (Cloud Run & Firestore)</p>
                  <p><strong className="text-white">Adresse :</strong> Gordon House, Barrow St, Dublin 4, Irlande</p>
                  <p><strong className="text-white">Sécurité SSL :</strong> Chiffrement TLS 1.3 256 bits haut niveau</p>
                </div>
              </div>
            </div>

            <section className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Directeur de la Publication</h3>
              <p>Le directeur de la publication et responsable du contenu éditorial de la plateforme est la Direction Générale de Dekel.Formation.</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. TRAINERS DIRECTORY PAGE (`Tous les formateurs`)
 */
interface TrainersPageProps extends PublicPageProps {
  allUsers: User[];
  allCourses: Course[];
  allEnrollments: Enrollment[];
}

export function TrainersPage({ allUsers, allCourses, allEnrollments, onNavigate }: TrainersPageProps) {
  const [searchTrainer, setSearchTrainer] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<User | null>(null);

  // Filter trainers
  const trainers = allUsers.filter(u => u.role === 'trainer' || u.role === 'admin');

  const filteredTrainers = trainers.filter(t => {
    const q = searchTrainer.toLowerCase().trim();
    if (!q) return true;
    return (t.name || '').toLowerCase().includes(q) || (t.bio || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass border-white/10 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>Experts & Mentors Certifiés</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Découvrez nos <span className="text-rose-400">Formateurs d'Excellence</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Apprenez auprès de passionnés et d'experts du secteur. Tous nos formateurs partagent leur savoir-faire concret et vous accompagnent dans votre réussite.
          </p>
        </div>

        <div className="w-full md:w-auto relative z-10">
          <div className="relative max-w-xs mx-auto md:mx-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTrainer}
              onChange={(e) => setSearchTrainer(e.target.value)}
              placeholder="Rechercher un formateur..."
              className="w-full bg-slate-900/80 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map(trainer => {
          const trainerCourses = allCourses.filter(c => c.status === 'published' && (c.trainerId === trainer.id || c.trainerName?.toLowerCase() === trainer.name?.toLowerCase()));
          const trainerCourseIds = new Set(trainerCourses.map(c => c.id));
          const totalStudents = allEnrollments.filter(e => trainerCourseIds.has(e.courseId) && e.status === 'active').length;

          return (
            <div 
              key={trainer.id}
              className="glass border-white/10 rounded-3xl p-6 space-y-5 hover:border-rose-500/40 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {trainer.avatarUrl ? (
                      <img 
                        src={trainer.avatarUrl} 
                        alt={trainer.name} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500/30 shadow-lg group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                        {trainer.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full border-2 border-slate-900" title="Formateur Certifié">
                      <CheckCircle className="w-3 h-3" />
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-rose-400 transition-colors">{trainer.name}</h3>
                    <p className="text-[11px] text-rose-300 font-medium">Formateur & Expert</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>4.9 / 5.0</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {trainer.bio || "Formateur passionné partageant son expertise professionnelle sur Dekel.Formation pour vous transmettre des compétences concrètes."}
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="block font-black text-white text-sm">{trainerCourses.length}</span>
                    <span className="text-[10px] text-slate-400">Formation{trainerCourses.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="block font-black text-emerald-400 text-sm">{totalStudents}</span>
                    <span className="text-[10px] text-slate-400">Élève{totalStudents > 1 ? 's' : ''} inscrits</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setSelectedTrainer(trainer)}
                  className="w-full bg-white/10 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Voir ses formations ({trainerCourses.length})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Trainer's Courses */}
      {selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-white relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center">
                  {selectedTrainer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedTrainer.name}</h3>
                  <p className="text-xs text-rose-300">Toutes les formations publiées</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {allCourses.filter(c => c.status === 'published' && (c.trainerId === selectedTrainer.id || c.trainerName?.toLowerCase() === selectedTrainer.name?.toLowerCase())).map(course => (
                <div 
                  key={course.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-rose-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img src={course.coverImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300'} alt={course.title} className="w-16 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{course.title}</h4>
                      <p className="text-[11px] text-slate-400">{course.type || 'Formation'} • {course.level || 'Tous niveaux'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTrainer(null);
                      onNavigate(`/formation/${course.seoSlug || course.id}`);
                    }}
                    className="accent-gradient text-white font-bold py-2 px-4 rounded-xl text-xs hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Découvrir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 3. FAQ PAGE (`FAQ - Foire aux questions`)
 */
export function FaqPage({ onNavigate }: PublicPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const faqItems = [
    {
      category: 'Inscriptions & Cours',
      question: 'Comment s\'inscrire à une formation sur Dekel.Formation ?',
      answer: 'C\'est très simple ! Parcourez le catalogue, choisissez la formation de votre choix et cliquez sur "M\'inscrire". Vous pourrez payer via Mobile Money (Orange, MTN) ou virement, puis soumettre votre preuve pour débloquer immédiatement vos accès.'
    },
    {
      category: 'Inscriptions & Cours',
      question: 'Les cours sont-ils accessibles à vie ?',
      answer: 'Oui, absolument ! Une fois inscrit(e) à une formation, vous conservez un accès illimité aux vidéos, exercices et mises à jour futures depuis votre espace étudiant.'
    },
    {
      category: 'Paiements & Sécurité',
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons les paiements en Mobile Money (Orange Money, MTN Mobile Money, Wave) ainsi que les virements bancaires et versements. Un système de validation rapide vérifie vos reçus.'
    },
    {
      category: 'Paiements & Sécurité',
      question: 'Combien de temps prend la validation de mon paiement ?',
      answer: 'La validation des paiements manuels prend en moyenne entre 5 et 30 minutes pendant les heures ouvrables. Dès validation par le formateur ou l\'administrateur, vous recevez une notification e-mail.'
    },
    {
      category: 'Espace Formateurs',
      question: 'Comment devenir formateur sur la plateforme ?',
      answer: 'Contactez notre équipe via la page Contact ou créez un compte. Après validation de vos compétences par l\'administrateur, votre rôle sera passé en "Formateur", vous permettant d\'uploader vos propres modules et cours.'
    },
    {
      category: 'Problèmes Techniques',
      question: 'J\'ai oublié mon mot de passe, que faire ?',
      answer: 'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Saisissez votre adresse e-mail pour recevoir les instructions de réinitialisation sécurisée.'
    },
    {
      category: 'Problèmes Techniques',
      question: 'Puis-je suivre mes cours sur mon téléphone mobile ?',
      answer: 'Oui ! Dekel.Formation est 100% responsive et optimisé pour smartphone, tablette et ordinateur.'
    }
  ];

  const categories = ['Toutes', 'Inscriptions & Cours', 'Paiements & Sécurité', 'Espace Formateurs', 'Problèmes Techniques'];

  const filteredFaqs = faqItems.filter(item => {
    const matchesCat = activeCategory === 'Toutes' || item.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass border-white/10 text-white rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden space-y-4">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Foire aux Questions</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Comment pouvons-nous vous aider ?</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Retrouvez les réponses aux questions les plus fréquemment posées par nos étudiants et formateurs.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question ou un mot-clé..."
            className="w-full bg-slate-900/90 border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
              activeCategory === cat 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.map((item, idx) => {
          const isOpen = expandedIndex === idx;
          return (
            <div 
              key={idx}
              className="glass border-white/10 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setExpandedIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <span>{item.question}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 animate-fade-in">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support CTA Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/30 text-center space-y-3">
        <h3 className="text-base font-bold text-white">Vous n'avez pas trouvé votre réponse ?</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">Notre équipe de support est disponible 7j/7 pour répondre à toutes vos interrogations.</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('/contact')}
            className="accent-gradient text-white font-bold py-2.5 px-6 rounded-2xl text-xs hover:scale-105 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            Contacter le support
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. HELP CENTER PAGE (`Centre d'aide`)
 */
export function HelpCenterPage({ onNavigate }: PublicPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="glass border-white/10 text-white rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Assistance & Tutoriels</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Centre d'Aide & Documentation</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
          Découvrez nos guides étape par étape pour utiliser pleinement la plateforme Dekel.Formation.
        </p>
      </div>

      {/* Help Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass border-white/10 rounded-3xl p-6 space-y-3 hover:border-teal-500/40 transition-all">
          <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 w-fit border border-teal-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Guide Étudiant</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Apprenez à naviguer dans votre espace de cours, suivre votre progression, télécharger vos supports et contacter les formateurs.
          </p>
          <ul className="space-y-1.5 text-xs text-teal-300 pt-2 font-medium">
            <li className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onNavigate('/faq')}>• S'inscrire à une formation</li>
            <li className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onNavigate('/faq')}>• Valider sa preuve de paiement</li>
            <li className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onNavigate('/faq')}>• Obtenir une attestation</li>
          </ul>
        </div>

        <div className="glass border-white/10 rounded-3xl p-6 space-y-3 hover:border-indigo-500/40 transition-all">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 w-fit border border-indigo-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Guide Formateur</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Toutes les astuces pour créer, organiser et publier des modules de cours attractifs avec vidéos HD et exercices interactifs.
          </p>
          <ul className="space-y-1.5 text-xs text-indigo-300 pt-2 font-medium">
            <li className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onNavigate('/contact')}>• Demander un compte formateur</li>
            <li className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onNavigate('/contact')}>• Ajouter des vidéos de cours</li>
            <li className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onNavigate('/contact')}>• Suivre ses revenus & inscriptions</li>
          </ul>
        </div>

        <div className="glass border-white/10 rounded-3xl p-6 space-y-3 hover:border-rose-500/40 transition-all">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 w-fit border border-rose-500/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Support & Contact</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Une question spécifique ou un problème d'accès ? Notre équipe d'assistance technique répond à vos demandes sous 24 heures.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/contact')}
              className="accent-gradient text-white font-bold py-2 px-4 rounded-xl text-xs hover:scale-105 transition-all cursor-pointer"
            >
              Envoyer un message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. CONTACT PAGE (`Contact`)
 */
interface ContactPageProps extends PublicPageProps {
  onSendEmail?: (email: SimulatedEmail) => void;
}

export function ContactPage({ onSendEmail, onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Information générale',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (onSendEmail) {
        onSendEmail({
          id: `email-${Date.now()}`,
          to: 'support@dekel-formation.com',
          subject: `[Contact Support] ${formData.topic} - De : ${formData.name}`,
          body: `Nom : ${formData.name}\nE-mail : ${formData.email}\nSujet : ${formData.topic}\n\nMessage :\n${formData.message}`,
          sentAt: new Date().toISOString(),
          status: 'sent',
          type: 'contact_form'
        });
      }

      setIsSubmitting(false);
      setSubmitted(true);
      showToast('Votre message a été envoyé avec succès !', 'success');
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="glass border-white/10 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Service Client 7j/7</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Contactez notre <span className="text-emerald-400">Équipe d'Assistance</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Une question sur nos formations, vos accès ou un partenariat ? Écrivez-nous directement ou utilisez notre support WhatsApp rapide.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Info Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="glass border-white/10 rounded-3xl p-6 space-y-4 text-xs text-slate-300">
            <h3 className="font-bold text-white text-sm border-b border-white/10 pb-2">Nos Coordonnées</h3>

            <a href="mailto:support@dekel-formation.com" className="flex items-center gap-3 hover:text-emerald-400 transition-colors">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-white">E-mail</span>
                <span className="text-[11px]">support@dekel-formation.com</span>
              </div>
            </a>

            <a href="tel:+237600000000" className="flex items-center gap-3 hover:text-emerald-400 transition-colors">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-white">Téléphone</span>
                <span className="text-[11px]">+237 6 00 00 00 00</span>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-white">Adresse</span>
                <span className="text-[11px]">Douala, Cameroun</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-white">Horaires d'ouverture</span>
                <span className="text-[11px]">Lun - Ven : 08h00 - 18h00</span>
              </div>
            </div>
          </div>

          <a 
            href="https://wa.me/237600000000?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20Dekel.Formation."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-4 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Assistance directe WhatsApp</span>
          </a>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-2 glass border-white/10 rounded-3xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Message Envoyé !</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Merci de nous avoir contactés. Un conseiller de notre équipe vous répondra par e-mail dans un délai de 24 heures.
              </p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', topic: 'Information générale', message: '' }); }}
                className="accent-gradient text-white font-bold py-2 px-6 rounded-xl text-xs hover:scale-105 transition-all cursor-pointer"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-bold text-white text-base border-b border-white/10 pb-3">Formulaire de Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Votre Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Jean Kamga"
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Votre Adresse E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: jean@exemple.com"
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Objet de votre demande</label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                >
                  <option value="Information générale">Information générale</option>
                  <option value="Inscription & Paiement">Inscription & Paiement</option>
                  <option value="Problème d'accès à un cours">Problème d'accès à un cours</option>
                  <option value="Postuler comme Formateur">Postuler comme Formateur</option>
                  <option value="Autre demande">Autre demande</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Votre Message *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Décrivez votre demande en détail..."
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full accent-gradient text-white font-bold py-3 px-6 rounded-2xl text-xs hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer mon message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
