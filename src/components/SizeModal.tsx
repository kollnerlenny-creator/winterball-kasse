import React from 'react';
import { CupSoda, Beer, X } from 'lucide-react';
import { InventoryItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName: string | null;
  product: InventoryItem | null;
  onSelectSize: (size: 'small' | 'large') => void;
}

export const SizeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productName,
  product,
  onSelectSize,
}) => {
  if (!isOpen || !productName || !product) return null;

  const isSmallOutOfStock = (product.stockS ?? 0) <= 0;
  const isLargeOutOfStock = (product.stockL ?? 0) <= 0;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold text-white text-center mb-2">Größe wählen</h3>
        <p className="text-center text-sm font-semibold text-indigo-400 mb-8">{productName}</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelectSize('small')}
            disabled={isSmallOutOfStock}
            className={`bg-slate-700/80 border-2 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all ${
              isSmallOutOfStock
                ? 'opacity-40 grayscale cursor-not-allowed border-slate-700'
                : 'hover:bg-slate-600 hover:border-indigo-500 border-slate-600 active:scale-95'
            }`}
          >
            <CupSoda className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-white uppercase text-xs">Klein</span>
            <span className="text-sm font-mono text-indigo-300 font-bold">
              {(product.priceS ?? 0).toFixed(2)} €
            </span>
            <span className={`text-[10px] font-mono ${isSmallOutOfStock ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
              {isSmallOutOfStock ? 'Ausverkauft' : `${product.stockS ?? 0} vorrätig`}
            </span>
          </button>

          <button
            onClick={() => onSelectSize('large')}
            disabled={isLargeOutOfStock}
            className={`bg-slate-700/80 border-2 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all ${
              isLargeOutOfStock
                ? 'opacity-40 grayscale cursor-not-allowed border-slate-700'
                : 'hover:bg-slate-600 hover:border-indigo-500 border-slate-600 active:scale-95'
            }`}
          >
            <Beer className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-white uppercase text-xs">Groß</span>
            <span className="text-sm font-mono text-indigo-300 font-bold">
              {(product.priceL ?? 0).toFixed(2)} €
            </span>
            <span className={`text-[10px] font-mono ${isLargeOutOfStock ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
              {isLargeOutOfStock ? 'Ausverkauft' : `${product.stockL ?? 0} vorrätig`}
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 text-slate-400 font-medium hover:text-white py-2 text-sm text-center"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};
