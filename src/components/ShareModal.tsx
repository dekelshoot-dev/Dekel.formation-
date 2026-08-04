import React, { useState } from 'react';
import { Course } from '../types';
import { showToast } from './Toast';
import { X, Copy, Check, Share2, MessageCircle, Facebook, Linkedin, Send, Twitter } from 'lucide-react';

interface ShareModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ course, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build target public URL for course presentation page (clean path for social media crawlers & WhatsApp/FB/Twitter preview cards)
  const origin = window.location.origin;
  const courseSlugOrId = course.seoSlug || course.id;
  const publicUrl = `${origin}/formation/${courseSlugOrId}`;

  const shareTitle = course.seoTitle || course.title;
  const shareText = `Découvrez la formation "${shareTitle}" par ${course.trainerName} !`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = publicUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast('Lien de la formation copié avec succès !', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      showToast('Erreur lors de la copie du lien.', 'error');
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30',
      iconColor: 'text-emerald-200',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${publicUrl}`)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/30',
      iconColor: 'text-blue-200',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500/30',
      iconColor: 'text-sky-200',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-600 text-white border-blue-600/30',
      iconColor: 'text-blue-100',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-500 hover:bg-sky-400 text-white border-sky-400/30',
      iconColor: 'text-sky-100',
      url: `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass rounded-3xl border border-white/15 p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-5 text-slate-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Partager la formation</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-[280px]">
                {course.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course Thumbnail Preview */}
        {course.coverImage && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-2xl overflow-hidden">
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-14 h-14 object-cover rounded-xl shrink-0 border border-white/10"
            />
            <div className="min-w-0 flex-1 flex flex-col text-left items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 mb-1">
                {course.type}
              </span>
              <h4 className="text-xs font-bold text-white truncate text-left w-full">{course.title}</h4>
              <p className="text-[10px] text-slate-400 truncate text-left w-full mt-0.5">Par {course.trainerName}</p>
            </div>
          </div>
        )}

        {/* Social Share Buttons */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Partager sur les réseaux sociaux :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${social.color}`}
                >
                  <IconComponent className={`w-4 h-4 ${social.iconColor}`} />
                  <span className="truncate">{social.name}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Copy Link Input Section */}
        <div className="space-y-2 pt-1 border-t border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Copier le lien public direct :
          </p>
          <div className="flex items-center gap-2 bg-slate-950/70 border border-white/15 p-1.5 rounded-xl">
            <input
              type="text"
              readOnly
              value={publicUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="bg-transparent border-none outline-none text-xs text-slate-300 font-mono flex-1 px-2 select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
