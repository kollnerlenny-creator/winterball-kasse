import React, { useEffect, useState } from 'react';
import { LogOut, ShoppingCart, Snowflake, ArrowLeft } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, PATH } from '../../firebase';
import { PosType, SyncCartData } from '../../types';

interface Props {
  customerPos: PosType;
  onClose: () => void;
}

export const CustomerView: React.FC<Props> = ({ customerPos, onClose }) => {
  const [syncData, setSyncData] = useState<SyncCartData>({
    items: [],
    total: 0,
    isPaying: false,
    given: 0,
    change: 0,
    tip: 0,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [lastCompletedTs, setLastCompletedTs] = useState<number>(0);

  const posName = customerPos === 1 ? 'GETRÄNKE' : 'SPEISEN';

  useEffect(() => {
    const syncDocRef = doc(db, PATH, 'sync', `cart_pos_${customerPos}`);
    const unsubscribe = onSnapshot(
      syncDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SyncCartData;
          setSyncData(data);

          // Handle newly completed sale animation
          if (data.justCompleted && data.completedAt && data.completedAt !== lastCompletedTs) {
            setLastCompletedTs(data.completedAt);
            setSuccessAmount(data.completedTotal || data.total || 0);
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
            }, 2600);
          }
        } else {
          setSyncData({
            items: [],
            total: 0,
            isPaying: false,
            given: 0,
            change: 0,
            tip: 0,
          });
        }
      },
      (err) => {
        console.warn('Customer sync listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [customerPos, lastCompletedTs]);

  const items = syncData.items || [];
  const total = syncData.total || 0;
  const isIdle = items.length === 0 && !syncData.isPaying && !showSuccess;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 flex flex-col justify-between overflow-hidden select-none z-50 animate-viewIn">
      {/* Top Header Bar (Always cleanly aligned and visible) */}
      <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30 flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            {isIdle ? (
              <Snowflake className="text-white w-5 h-5" />
            ) : (
              <ShoppingCart className="text-white w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Winterball</span>
              <span className="text-indigo-400 font-bold text-sm sm:text-base">Kundenansicht</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Kasse {posName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold uppercase tracking-wider text-xs">
            {posName}
          </span>
          <button
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 shadow-lg transition-all duration-150 active:scale-95 cursor-pointer"
            title="Zur Kasse zurückkehren"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Zurück zur Kasse</span>
          </button>
        </div>
      </header>

      {/* Screensaver Overlay (100% Vertically & Horizontally Centered) */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 transition-all duration-500 ease-out cursor-pointer z-20 ${
          isIdle
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-snow-1" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-snow-2" />
        </div>

        {/* Centered Brand Presentation */}
        <div className="relative text-center animate-pulse-glow z-10 max-w-lg mx-auto flex flex-col items-center justify-center">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/35 mb-6 sm:mb-8 border border-indigo-400/25">
            <Snowflake className="text-white w-16 h-16 sm:w-20 sm:h-20" />
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-2">
            Winterball
          </h2>
          <p className="text-xl sm:text-3xl text-indigo-400 font-bold uppercase tracking-widest mb-4">
            KASSE {posName}
          </p>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mx-auto">
            Willkommen! Ihre Bestellung wird gleich erfasst.
          </p>
        </div>

        <p className="absolute bottom-8 sm:bottom-12 text-slate-500 text-xs sm:text-sm font-medium animate-breathe z-10">
          Zum Zurückkehren tippen
        </p>
      </div>

      {/* Sale Success Overlay with Fluid Pop & Checkmark */}
      {showSuccess && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex items-center justify-center sale-success-overlay">
          <div className="sale-success-card flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center">
              <div className="sale-success-ring absolute w-36 h-36 rounded-full border-4 border-emerald-400"></div>
              <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
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
              <p className="text-white font-black text-5xl sm:text-6xl font-mono">
                {successAmount.toFixed(2)} €
              </p>
              <p className="text-emerald-400 font-bold text-xl uppercase tracking-widest mt-2">
                Vielen Dank!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Order View Container (Centered, fluid, balanced) */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 flex flex-col justify-between overflow-hidden z-10">
        {/* Live Items Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-2.5 pr-1">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <ShoppingCart className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-400">Keine Artikel im Warenkorb</p>
              <p className="text-xs text-slate-600 mt-1">Artikel erscheinen live bei der Erfassung</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="flex justify-between items-center px-5 py-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm transition-all duration-200 animate-itemIn"
              >
                <span className="text-base sm:text-lg font-bold text-white truncate pr-4">
                  {item.name}
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-indigo-400 flex-none">
                  {item.price.toFixed(2)} €
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: Payment Breakdown & Total */}
        <div className="space-y-4 pt-2 flex-none">
          {syncData.isPaying && (
            <div className="bg-slate-900/90 border-2 border-indigo-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-500/15 animate-modal">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                    Gegeben
                  </p>
                  <p className="text-3xl sm:text-4xl font-mono font-black text-white">
                    {(syncData.given || 0).toFixed(2)} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                    Rückgeld
                  </p>
                  <p className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">
                    {(Math.max(0, syncData.change) || 0).toFixed(2)} €
                  </p>
                </div>
              </div>

              {(syncData.tip ?? 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-right">
                  <span className="text-amber-400/90 font-bold uppercase tracking-wider text-xs">
                    Trinkgeld
                  </span>
                  <span className="text-xl font-mono font-black text-amber-400">
                    {(syncData.tip ?? 0).toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/80 flex justify-between items-end px-2">
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">
                Gesamtsumme
              </p>
              <p className="text-4xl sm:text-6xl font-black text-white tracking-tight font-mono">
                {total.toFixed(2)} €
              </p>
            </div>

            <div className="text-right pb-1">
              <span className="text-xs sm:text-sm text-slate-400 font-medium">
                {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
