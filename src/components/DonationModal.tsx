import React, { useState, useEffect } from 'react';
import { Gift, Delete, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export const DonationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [val, setVal] = useState("");

  useEffect(() => {
    if (isOpen) setVal("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNum = (char: string) => {
    if (char === '.' && val.includes('.')) return;
    if (char === '.' && val === '') {
      setVal('0.');
      return;
    }
    // Limit decimal places to 2
    if (val.includes('.') && val.split('.')[1].length >= 2) return;
    setVal(v => v + char);
  };

  const handleClear = () => {
    setVal(v => v.slice(0, -1));
  };

  const handleSubmit = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onConfirm(Math.round(num * 100) / 100);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4 animate-backdrop">
      <div className="max-w-sm w-full bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 md:p-8 relative animate-modal">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-amber-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
            <Gift className="text-amber-400 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Spende / Freibetrag</h2>
          <p className="text-xs text-slate-400 mt-1">Betrag manuell zur Rechnung hinzufügen</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-6">
          <div className="text-4xl font-mono font-bold text-white flex justify-end items-baseline">
            <span>{val || '0'}</span>
            <span className="text-slate-500 ml-1.5 text-2xl">€</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => handleNum(n.toString())}
              className="bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-mono text-2xl font-bold py-3.5 rounded-xl border border-slate-700 active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="bg-slate-800 hover:bg-slate-700 text-rose-400 py-3.5 rounded-xl border border-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleNum('0')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-mono text-2xl font-bold py-3.5 rounded-xl border border-slate-700 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={() => handleNum('.')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-mono text-2xl font-bold py-3.5 rounded-xl border border-slate-700 active:scale-95 transition-all"
          >
            ,
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-slate-400 hover:text-white font-semibold rounded-xl text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!val || parseFloat(val) <= 0}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-sm"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
