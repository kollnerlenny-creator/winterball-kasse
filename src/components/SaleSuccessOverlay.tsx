import React from 'react';

interface Props {
  visible: boolean;
  amount: number;
}

export const SaleSuccessOverlay: React.FC<Props> = ({ visible, amount }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center pointer-events-none sale-success-overlay">
      <div className="sale-success-card flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="sale-success-ring absolute w-28 h-28 rounded-full border-4 border-emerald-400"></div>
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                className="sale-success-check"
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-3xl font-mono">
            {amount.toFixed(2)} €
          </p>
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mt-1">
            Erfolgreich gebucht!
          </p>
        </div>
      </div>
    </div>
  );
};
