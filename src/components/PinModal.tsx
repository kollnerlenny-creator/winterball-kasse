import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetPin?: string;
}

export const PinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  targetPin = "5657",
}) => {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const addDigit = useCallback((d: number) => {
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + d;
      if (next.length === 4) {
        if (next === targetPin) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 150);
        } else {
          setShake(true);
          setTimeout(() => {
            setPin("");
            setShake(false);
          }, 400);
        }
      }
      return next;
    });
  }, [targetPin, onSuccess, onClose]);

  const clearDigit = useCallback(() => {
    setPin((p) => p.slice(0, -1));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setShake(false);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key >= '0' && e.key <= '9') {
          addDigit(parseInt(e.key, 10));
        } else if (e.key === 'Backspace') {
          clearDigit();
        } else if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, addDigit, clearDigit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
      <div className={`max-w-xs w-full space-y-6 ${shake ? 'animate-bounce' : ''}`}>
        <div className="text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700">
            <Lock className="text-indigo-400 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Zugriff geschützt</h2>
          <p className="text-xs text-slate-400 mt-1">Bitte 4-stelligen Sicherheitscode eingeben</p>

          <div className="flex justify-center gap-4 mt-6">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length >= idx
                    ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-lg shadow-indigo-500/50'
                    : 'border-slate-700 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => addDigit(n)}
              className="bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-2xl font-bold py-4 rounded-2xl border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            onClick={onClose}
            className="bg-slate-800/80 hover:bg-slate-700 text-rose-400 py-4 rounded-2xl border border-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Abbrechen"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => addDigit(0)}
            className="bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-2xl font-bold py-4 rounded-2xl border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            0
          </button>
          <button
            onClick={clearDigit}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-400 py-4 rounded-2xl border border-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Löschen"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
