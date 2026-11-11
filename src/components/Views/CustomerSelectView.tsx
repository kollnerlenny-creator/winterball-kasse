import React from 'react';
import { CupSoda, Utensils } from 'lucide-react';
import { PosType } from '../../types';

interface Props {
  onSelectPos: (pos: PosType) => void;
}

export const CustomerSelectView: React.FC<Props> = ({ onSelectPos }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 md:p-10">
      <div className="max-w-2xl w-full text-center space-y-3 mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Kundenansicht öffnen
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          Wähle die Kasse, deren Warenkorb und Beträge live auf diesem Bildschirm angezeigt werden sollen (z.B. für ein zweites Display oder Tablet zum Kunden gerichtet).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => onSelectPos(1)}
          className="bg-slate-800/90 hover:bg-indigo-600/90 border border-slate-700/80 hover:border-indigo-400 p-8 sm:p-10 rounded-3xl group transition-all duration-200 active:scale-95 shadow-xl hover:shadow-indigo-600/20 text-center"
        >
          <div className="w-20 h-20 bg-indigo-500/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors">
            <CupSoda className="w-10 h-10 text-indigo-400 group-hover:text-white transition-colors" />
          </div>
          <span className="block text-2xl font-black text-white mb-2">Kasse GETRÄNKE</span>
          <span className="text-xs text-slate-400 group-hover:text-indigo-100">Live-Synchronisation mit Kasse 1</span>
        </button>

        <button
          onClick={() => onSelectPos(2)}
          className="bg-slate-800/90 hover:bg-indigo-600/90 border border-slate-700/80 hover:border-indigo-400 p-8 sm:p-10 rounded-3xl group transition-all duration-200 active:scale-95 shadow-xl hover:shadow-indigo-600/20 text-center"
        >
          <div className="w-20 h-20 bg-indigo-500/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors">
            <Utensils className="w-10 h-10 text-indigo-400 group-hover:text-white transition-colors" />
          </div>
          <span className="block text-2xl font-black text-white mb-2">Kasse SPEISEN</span>
          <span className="text-xs text-slate-400 group-hover:text-indigo-100">Live-Synchronisation mit Kasse 2</span>
        </button>
      </div>
    </div>
  );
};
