import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation de suppression",
  message,
  itemName,
  confirmText = "Supprimer définitivement",
  cancelText = "Annuler",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              confirmVariant === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              {confirmVariant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-400">Action irréversible</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 break-words flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">{itemName}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Cette action retirera définitivement cet élément de la plateforme et de la base de données.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
