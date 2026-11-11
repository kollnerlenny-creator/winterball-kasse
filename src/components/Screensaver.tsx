import React from 'react';
import { Snowflake } from 'lucide-react';

interface Props {
  visible: boolean;
  onWake: () => void;
  subtitle: string;
}

export const Screensaver: React.FC<Props> = ({ visible, onWake, subtitle }) => {
  return (
    <div
      onClick={onWake}
      className={`fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out select-none ${
        visible
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Ambient Winter Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-snow-1" />
        <div className="absolute bottom-1/4 right-1/5 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-snow-2" />
        
        {/* Floating subtle snowflake dots */}
        <div className="absolute top-12 left-1/4 w-2 h-2 rounded-full bg-indigo-300/30 animate-snow-1" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-indigo-400/20 animate-snow-2" />
        <div className="absolute bottom-1/3 left-1/6 w-2 h-2 rounded-full bg-blue-300/30 animate-snow-1" />
        <div className="absolute bottom-20 right-1/3 w-3 h-3 rounded-full bg-indigo-200/25 animate-snow-2" />
      </div>

      {/* Center Branding Content */}
      <div className="relative text-center animate-pulse-glow z-10">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-32 h-32 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 border border-indigo-400/30 transition-transform duration-300 hover:scale-105">
          <Snowflake className="text-white w-20 h-20" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-2">
          Winterball
        </h1>
        <p className="text-2xl sm:text-3xl text-indigo-400 font-bold tracking-widest uppercase">
          {subtitle}
        </p>
      </div>

      {/* Gentle wake up indicator */}
      <div className="absolute bottom-12 text-center z-10 animate-breathe">
        <p className="text-slate-400 text-sm font-semibold tracking-wide">
          Zum Aufwecken berühren
        </p>
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mx-auto mt-2" />
      </div>

      {/* Copyright Notice */}
      <div className="absolute bottom-4 text-center z-10 text-[11px] font-medium text-slate-600 tracking-wider">
        © Lenny Köllner
      </div>
    </div>
  );
};
