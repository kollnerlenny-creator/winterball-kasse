import React, { useEffect, useState } from 'react';
import { LogOut, ShoppingCart, Snowflake } from 'lucide-react';
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
            }, 2500);
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
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Prominent Exit Button (Always visible on top) */}
      <div className="absolute top-4 right-4 z-[120]">
        <button
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 shadow-2xl transition-all active:scale-95 cursor-pointer backdrop-blur-md"
          title="Kundenansicht beenden und zur Kasse zurückkehren"
        >
          <LogOut className="w-4 h-4 text-indigo-400" />
          <span>Zurück zur Kasse</span>
        </button>
      </div>

      {/* Customer Screensaver */}
      {isIdle && (
        <div
          onClick={onClose}
          className="absolute inset-0 bg-slate-950 z-20 flex flex-col items-center justify-center transition-opacity duration-700 cursor-pointer"
        >
          <div className="text-center animate-pulse-glow">
            <div className="bg-indigo-600 w-32 h-32 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8">
              <Snowflake className="text-white w-20 h-20" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-2">Winterball</h1>
            <p className="text-2xl text-indigo-400 font-bold uppercase tracking-widest">
              KASSE {posName}
            </p>
            <p className="text-slate-500 text-sm mt-4">Willkommen! Ihre Bestellung wird gleich erfasst.</p>
          </div>
          <p className="absolute bottom-10 text-slate-600 text-xs font-medium">Zum Zurückkehren tippen</p>
        </div>
      )}

      {/* Sale Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="sale-success-card flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center">
              <div className="sale-success-ring absolute w-36 h-36 rounded-full border-4 border-emerald-400"></div>
              <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path
                    className="sale-success-check"
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-5xl font-mono">
                {successAmount.toFixed(2)} €
              </p>
              <p className="text-emerald-400 font-bold text-xl uppercase tracking-widest mt-2">
                Vielen Dank!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Order View for Customer */}
      <div className="w-full max-w-3xl p-6 sm:p-8 flex flex-col h-full z-10 justify-between">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShoppingCart className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Ihre Bestellung</h2>
              <p className="text-xs text-slate-400">Winterball Kasse</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold uppercase tracking-wider text-xs">
            {posName}
          </div>
        </div>

        {/* Live Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-6 space-y-2.5 pr-2">
          {items.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="flex justify-between items-center px-5 py-3.5 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm"
            >
              <span className="text-lg font-bold text-white">{item.name}</span>
              <span className="text-lg font-mono font-bold text-indigo-400">
                {item.price.toFixed(2)} €
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Section: Payment Breakdown & Total */}
        <div className="space-y-4">
          {syncData.isPaying && (
            <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 shadow-2xl shadow-indigo-500/10 animate-fadeIn">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                    Gegeben
                  </p>
                  <p className="text-4xl font-mono font-black text-white">
                    {(syncData.given || 0).toFixed(2)} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                    Rückgeld
                  </p>
                  <p className="text-4xl font-mono font-black text-emerald-400">
                    {(Math.max(0, syncData.change) || 0).toFixed(2)} €
                  </p>
                </div>
              </div>

              {(syncData.tip ?? 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-right">
                  <span className="text-amber-400/80 font-bold uppercase tracking-wider text-xs">
                    Trinkgeld
                  </span>
                  <span className="text-xl font-mono font-black text-amber-400">
                    {(syncData.tip ?? 0).toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">
                Gesamtsumme
              </p>
              <p className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
                {total.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
