import { SimulatedEmail } from '../types';
import { Mail, Clock, Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';

interface NotificationLogProps {
  emails: SimulatedEmail[];
  onClear: () => void;
}

export default function NotificationLog({ emails, onClear }: NotificationLogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative glass hover:bg-white/10 text-white rounded-full p-3.5 shadow-xl transition-all duration-200 border border-white/10 flex items-center gap-2 group cursor-pointer"
      >
        <Mail className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold pr-1">Logs Emails</span>
        {emails.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
            {emails.length}
          </span>
        )}
      </button>

      {/* Drawer Container */}
      {isOpen && (
        <div className="fixed bottom-20 left-3 right-3 sm:left-4 sm:right-auto sm:w-96 max-w-[calc(100vw-1.5rem)] glass-light backdrop-blur-xl shadow-2xl border border-white/15 rounded-2xl p-4 text-xs text-white transition-all duration-300 z-50">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <div>
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-450" />
                <span>Simulateur d'Emails envoyés</span>
              </h3>
              <p className="text-[10px] text-slate-400">Section 16 - Notifications Système</p>
            </div>
            <div className="flex items-center gap-1">
              {emails.length > 0 && (
                <button
                  onClick={onClear}
                  title="Effacer l'historique"
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {emails.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Mail className="w-8 h-8 mx-auto stroke-1 mb-2 text-slate-500" />
                <p>Aucun email envoyé pour le moment.</p>
                <p className="text-[10px] mt-1 text-slate-500">
                  Ajoutez un étudiant à un cours ou créez un compte pour simuler des notifications.
                </p>
              </div>
            ) : (
              [...emails].reverse().map(email => (
                <div key={email.id} className="bg-white/5 border border-white/10 rounded-lg p-2.5 hover:bg-white/10 transition-colors text-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                     <span className="font-semibold text-indigo-450">Pour : {email.to}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(email.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-[11px] mb-1">{email.subject}</h4>
                  <p className="text-[10px] text-slate-350 whitespace-pre-line leading-relaxed border-t border-white/10 pt-1">
                    {email.body}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    <span>Envoyé avec succès par SMTP simulé</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
