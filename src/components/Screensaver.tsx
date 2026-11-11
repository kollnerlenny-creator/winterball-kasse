import React from 'react';
import { Snowflake } from 'lucide-react';

interface Props {
  visible: boolean;
  onWake: () => void;
  subtitle: string;
}

export const Screensaver: React.FC<Props> = ({ visible, onWake, subtitle }) => {
  if (!visible) return null;

  return (
    <div
      onClick={onWake}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-500 animate-fadeIn"
    >
      <div className="text-center animate-pulse-glow">
        <div className="bg-indigo-600 w-32 h-32 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-8 transform transition hover:scale-105">
          <Snowflake className="text-white w-20 h-20" />
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight mb-2">Winterball</h1>
        <p className="text-2xl text-indigo-400 font-bold tracking-widest uppercase">
          {subtitle}
        </p>
      </div>
      <p className="absolute bottom-10 text-slate-500 text-sm animate-bounce font-medium">
        Zum Aufwecken tippen
      </p>
    </div>
  );
};
