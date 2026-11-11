import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Ja, bestätigen",
  confirmVariant = 'danger',
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-backdrop">
      <div className="bg-slate-800 p-6 md:p-8 rounded-3xl max-w-sm w-full border border-slate-700 shadow-2xl space-y-4 animate-modal">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${confirmVariant === 'danger' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-slate-400 hover:text-white font-bold rounded-xl text-sm transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
