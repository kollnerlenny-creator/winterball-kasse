import React from 'react';
import { Gift, Sparkles, X, Plus, AlertCircle } from 'lucide-react';
import { InventoryItem, CartItem, PosType } from '../../types';

interface Props {
  currentPos: PosType;
  onSetPos: (pos: PosType) => void;
  inventory: Record<string, InventoryItem>;
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onRemoveFromCart: (index: number) => void;
  onClearCart: () => void;
  onOpenVariantModal: (name: string) => void;
  onOpenDonationModal: () => void;
  onOpenPaymentModal: () => void;
  onLoadSampleData: () => void;
}

export const OrderView: React.FC<Props> = ({
  currentPos,
  onSetPos,
  inventory,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onOpenVariantModal,
  onOpenDonationModal,
  onOpenPaymentModal,
  onLoadSampleData,
}) => {
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Filter products by current active POS (or 0 = Alle)
  const productNames = Object.keys(inventory)
    .sort()
    .filter(name => {
      const pos = inventory[name].assignedPos ?? 0;
      return pos === 0 || pos === currentPos;
    });

  const handleProductClick = (name: string) => {
    const item = inventory[name];
    if (!item) return;

    if (item.hasVariants) {
      onOpenVariantModal(name);
    } else {
      if ((item.stock ?? 0) <= 0) return;
      onAddToCart({
        name,
        price: item.price ?? 0,
        isVariant: false,
        isLarge: false,
        parent: name,
      });
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-0 md:gap-6 p-2 md:p-6 overflow-hidden">
      {/* Products Column */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-none flex-wrap">
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => onSetPos(1)}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentPos === 1
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GETRÄNKE
            </button>
            <button
              onClick={() => onSetPos(2)}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentPos === 2
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SPEISEN
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDonationModal}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-2 transition-all active:scale-95"
            >
              <Gift className="w-4 h-4" /> Spende / Freibetrag
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-20">
          {productNames.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
              <AlertCircle className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-slate-300 font-bold mb-1">
                Keine Artikel für {currentPos === 1 ? 'Getränke' : 'Speisen'} vorhanden
              </p>
              <p className="text-slate-500 text-xs mb-4">
                Erstelle Artikel im Inventar oder lade typische Winterball-Beispieldaten.
              </p>
              <button
                onClick={onLoadSampleData}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> Beispieldaten jetzt laden
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {productNames.map(name => {
                const item = inventory[name];
                const outOfStock = item.hasVariants
                  ? (item.stockS ?? 0) <= 0 && (item.stockL ?? 0) <= 0
                  : (item.stock ?? 0) <= 0;
                const totalStock = item.hasVariants
                  ? (item.stockS ?? 0) + (item.stockL ?? 0)
                  : (item.stock ?? 0);
                const lowStock = !outOfStock && totalStock <= 5;

                return (
                  <div
                    key={name}
                    onClick={() => handleProductClick(name)}
                    className={`product-card p-4 rounded-2xl flex flex-col justify-between h-32 cursor-pointer border transition-all ${
                      outOfStock
                        ? 'opacity-40 grayscale cursor-not-allowed border-slate-800 bg-slate-900'
                        : 'border-slate-700/60 hover:border-indigo-500/60 bg-gradient-to-br from-slate-800 to-slate-900/90 active:scale-[0.97] hover:shadow-lg hover:shadow-indigo-500/10'
                    }`}
                  >
                    <div className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2">
                      {name}
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <div className="font-mono text-indigo-400 font-black text-lg">
                        {item.hasVariants
                          ? `${(item.priceS ?? 0).toFixed(2)} / ${(item.priceL ?? 0).toFixed(2)}€`
                          : `${(item.price ?? 0).toFixed(2)} €`}
                      </div>

                      {(lowStock || outOfStock) && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            outOfStock
                              ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                              : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          }`}
                        >
                          {outOfStock
                            ? 'LEER'
                            : item.hasVariants
                            ? `S${item.stockS ?? 0}/L${item.stockL ?? 0}`
                            : `${item.stock ?? 0}x`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="md:w-96 flex-none bg-slate-900/70 backdrop-blur-md md:rounded-3xl border border-slate-700/80 flex flex-col shadow-2xl overflow-hidden mt-2 md:mt-0 max-h-[45vh] md:max-h-full">
        {/* Cart Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-300 text-base">Warenkorb</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-mono font-bold">
              {cart.length}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-rose-400 font-medium px-2 py-1 hover:bg-rose-500/10 rounded transition-colors"
            >
              Leeren
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar min-h-24">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <p className="text-xs font-medium">Warenkorb ist leer</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Tippe auf einen Artikel zum Hinzufügen</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm font-bold text-white truncate">{item.name}</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                    {item.price.toFixed(2)} €
                  </span>
                </div>
                <button
                  onClick={() => onRemoveFromCart(idx)}
                  className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors flex-none"
                  title="Entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Total & Checkout Button */}
        <div className="p-4 sm:p-6 bg-slate-900/80 border-t border-slate-800 flex-none">
          <div className="flex justify-between items-end mb-4">
            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Gesamtsumme</span>
            <span className="text-3xl font-black text-white font-mono">
              {cartTotal.toFixed(2)} €
            </span>
          </div>

          <button
            onClick={onOpenPaymentModal}
            disabled={cart.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 sm:py-4 rounded-xl text-lg sm:text-xl font-bold text-white disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            Kassieren
          </button>
        </div>
      </div>
    </div>
  );
};
