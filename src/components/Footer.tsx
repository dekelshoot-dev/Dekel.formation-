import React, { useState } from 'react';
import { 
  BookOpen, Mail, Phone, MapPin, Clock, Send, Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle, ArrowUp, CheckCircle, ShieldCheck, HeartHandshake, Sparkles, ExternalLink, Music2
} from 'lucide-react';
import { FooterConfig, DEFAULT_FOOTER_CONFIG } from '../types';
import { subscribeNewsletter } from '../firebaseService';
import { showToast } from './Toast';

interface FooterProps {
  config?: FooterConfig;
  onNavigate: (path: string) => void;
}

export default function Footer({ config, onNavigate }: FooterProps) {
  const footerData: FooterConfig = {
    ...DEFAULT_FOOTER_CONFIG,
    ...config,
    contactInfo: {
      ...DEFAULT_FOOTER_CONFIG.contactInfo,
      ...(config?.contactInfo || {})
    },
    socialLinks: {
      ...DEFAULT_FOOTER_CONFIG.socialLinks,
      ...(config?.socialLinks || {})
    }
  };

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Veuillez entrer une adresse e-mail valide.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await subscribeNewsletter(newsletterEmail);
      setIsSubscribed(true);
      setNewsletterEmail('');
      showToast('Merci ! Votre inscription à la newsletter a bien été prise en compte.', 'success');
    } catch (err) {
      console.error('Newsletter error:', err);
      showToast('Une erreur est survenue lors de l\'inscription.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const {
    brandName = 'Dekel.Formation',
    logoUrl,
    description,
    usefulLinks = DEFAULT_FOOTER_CONFIG.usefulLinks,
    legalLinks = DEFAULT_FOOTER_CONFIG.legalLinks,
    contactInfo = DEFAULT_FOOTER_CONFIG.contactInfo,
    socialLinks = DEFAULT_FOOTER_CONFIG.socialLinks,
    copyrightText = 'Dekel.Formation — Tous droits réservés.',
    newsletterEnabled = true,
    newsletterTitle = 'Abonnez-vous à notre Newsletter',
    newsletterSubtitle = 'Recevez nos dernières offres, actualités et conseils directement dans votre boîte mail.'
  } = footerData;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#12161c]/95 border-t border-white/10 text-slate-300 relative overflow-hidden backdrop-blur-xl mt-12">
      {/* Decorative gradient glow line at top edge */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Top Newsletter Banner (if enabled) */}
        {newsletterEnabled && (
          <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Restez informé(e)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{newsletterTitle}</h3>
                <p className="text-xs sm:text-sm text-slate-300">{newsletterSubtitle}</p>
              </div>

              {isSubscribed ? (
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Vous êtes abonnés à nos actualités !</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 max-w-md">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Votre e-mail (ex: exemple@domaine.com)..."
                    className="flex-1 bg-slate-950/80 border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="accent-gradient text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>S'abonner</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Column 1: Presentation & Brand (2 Columns width on LG) */}
          <div className="lg:col-span-2 space-y-4">
            <button 
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="w-9 h-9 rounded-xl object-contain border border-white/10" />
              ) : (
                <div className="accent-gradient text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="font-black text-white text-xl tracking-tight">{brandName}</span>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Plateforme de formation en ligne</p>
              </div>
            </button>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {description}
            </p>

            {/* Contact Details List */}
            <div className="space-y-2 pt-2 text-xs text-slate-300">
              {contactInfo.email && (
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-2.5 hover:text-indigo-400 transition-colors w-fit"
                >
                  <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>{contactInfo.email}</span>
                </a>
              )}
              {contactInfo.phone && (
                <a 
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-2.5 hover:text-indigo-400 transition-colors w-fit"
                >
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{contactInfo.phone}</span>
                </a>
              )}
              {contactInfo.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{contactInfo.address}</span>
                </div>
              )}
              {contactInfo.hours && (
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{contactInfo.hours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Useful Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Liens Utiles
            </h4>
            <ul className="space-y-2 text-xs">
              {usefulLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => {
                      if (link.isExternal || link.url.startsWith('http')) {
                        window.open(link.url, '_blank', 'noopener,noreferrer');
                      } else {
                        onNavigate(link.url);
                      }
                    }}
                    className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Informations Légales
            </h4>
            <ul className="space-y-2 text-xs">
              {legalLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => {
                      if (link.isExternal || link.url.startsWith('http')) {
                        window.open(link.url, '_blank', 'noopener,noreferrer');
                      } else {
                        onNavigate(link.url);
                      }
                    }}
                    className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Social Networks */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Rejoignez-nous
            </h4>
            <p className="text-[11px] text-slate-400">
              Suivez-nous sur les réseaux sociaux pour ne rien manquer de nos actualités :
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all text-slate-300 cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-pink-600 hover:text-white hover:border-pink-500 transition-all text-slate-300 cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-sky-600 hover:text-white hover:border-sky-500 transition-all text-slate-300 cursor-pointer"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="X (Twitter)"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all text-slate-300 cursor-pointer"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all text-slate-300 cursor-pointer"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="TikTok"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-slate-900 hover:text-white hover:border-teal-400 transition-all text-slate-300 cursor-pointer"
                >
                  <Music2 className="w-4 h-4" />
                </a>
              )}
              {socialLinks.whatsapp && (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all text-slate-300 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {socialLinks.telegram && (
                <a
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Telegram"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-sky-500 hover:text-white hover:border-sky-400 transition-all text-slate-300 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Bar Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {currentYear} {copyrightText}</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
              <span>Propulsé par Dekel.Formation</span>
            </span>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all cursor-pointer flex items-center gap-1"
              title="Haut de page"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Haut</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
