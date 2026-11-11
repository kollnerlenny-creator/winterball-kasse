import React, { useState } from 'react';
import { CupSoda, Utensils, LayoutGrid, Edit3, Trash2, X, Sparkles, RefreshCcw, Check } from 'lucide-react';
import { InventoryItem, PosType } from '../../types';

interface Props {
  inventory: Record<string, InventoryItem>;
  onSaveProduct: (name: string, data: InventoryItem) => Promise<void>;
  onDeleteProduct: (name: string) => void;
  onResetApp: () => void;
  onLoadSampleData: () => void;
  onToast: (msg: string) => void;
}

export const InventoryView: React.FC<Props> = ({
  inventory,
  onSaveProduct,
  onDeleteProduct,
  onResetApp,
  onLoadSampleData,
  onToast,
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [assignedPos, setAssignedPos] = useState<PosType>(0);
  const [hasVariants, setHasVariants] = useState(false);

  // Single fields (stored as strings to allow natural comma or dot typing)
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [cost, setCost] = useState('');

  // Variant fields
  const [priceS, setPriceS] = useState('');
  const [stockS, setStockS] = useState('');
  const [costS, setCostS] = useState('');

  const [priceL, setPriceL] = useState('');
  const [stockL, setStockL] = useState('');
  const [costL, setCostL] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingName(null);
    setName('');
    setAssignedPos(0);
    setHasVariants(false);
    setPrice('');
    setStock('');
    setCost('');
    setPriceS('');
    setStockS('');
    setCostS('');
    setPriceL('');
    setStockL('');
    setCostL('');
  };

  const handleEdit = (prodName: string) => {
    const item = inventory[prodName];
    if (!item) return;

    setEditingName(prodName);
    setName(prodName);
    setAssignedPos(item.assignedPos ?? 0);
    setHasVariants(item.hasVariants ?? false);

    if (item.hasVariants) {
      setPriceS(item.priceS !== undefined ? item.priceS.toString() : '');
      setStockS(item.stockS !== undefined ? item.stockS.toString() : '');
      setCostS(item.costS !== undefined ? item.costS.toString() : '');
      setPriceL(item.priceL !== undefined ? item.priceL.toString() : '');
      setStockL(item.stockL !== undefined ? item.stockL.toString() : '');
      setCostL(item.costL !== undefined ? item.costL.toString() : '');
    } else {
      setPrice(item.price !== undefined ? item.price.toString() : '');
      setStock(item.stock !== undefined ? item.stock.toString() : '');
      setCost(item.cost !== undefined ? item.cost.toString() : '');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const sanitized = val.toString().replace(',', '.').trim();
    const num = parseFloat(sanitized);
    return isNaN(num) ? 0 : num;
  };

  const parseInteger = (val: string): number => {
    if (!val) return 0;
    const sanitized = val.toString().trim();
    const num = parseInt(sanitized, 10);
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      onToast("Bitte Produktname eingeben");
      return;
    }

    const itemData: InventoryItem = {
      hasVariants,
      assignedPos,
    };

    if (hasVariants) {
      itemData.priceS = parseNumber(priceS);
      itemData.stockS = parseInteger(stockS);
      itemData.costS = parseNumber(costS);
      itemData.priceL = parseNumber(priceL);
      itemData.stockL = parseInteger(stockL);
      itemData.costL = parseNumber(costL);
    } else {
      itemData.price = parseNumber(price);
      itemData.stock = parseInteger(stock);
      itemData.cost = parseNumber(cost);
    }

    setIsSaving(true);
    try {
      await onSaveProduct(trimmed, itemData);
      onToast(editingName ? `Artikel "${trimmed}" aktualisiert` : `Artikel "${trimmed}" gespeichert`);
      resetForm();
    } catch (err: any) {
      console.error("Save product error:", err);
      onToast(err.message || "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  // Group inventory items by POS
  const groups: { 0: string[]; 1: string[]; 2: string[] } = { 0: [], 1: [], 2: [] };
  Object.keys(inventory).sort().forEach(itemName => {
    const p = inventory[itemName].assignedPos ?? 0;
    if (p === 1) groups[1].push(itemName);
    else if (p === 2) groups[2].push(itemName);
    else groups[0].push(itemName);
  });

  const groupInfo = [
    { key: 1 as PosType, label: 'Getränke', icon: CupSoda },
    { key: 2 as PosType, label: 'Speisen', icon: Utensils },
    { key: 0 as PosType, label: 'Alle Kassen', icon: LayoutGrid },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8 pb-20">
        {/* Header & Reset Button */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Bestandsverwaltung</h2>
            <p className="text-xs text-slate-400">Preise, Einkaufskosten und Vorräte steuern</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLoadSampleData}
              className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-2 rounded-xl hover:bg-indigo-500/20 flex items-center gap-1.5 font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Beispieldaten
            </button>
            <button
              onClick={onResetApp}
              className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 rounded-xl hover:bg-rose-500/20 flex items-center gap-1.5 font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> System Reset
            </button>
          </div>
        </div>

        {/* Product Form Card */}
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-indigo-500/30 shadow-xl shadow-indigo-950/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              {editingName ? `Artikel bearbeiten: ${editingName}` : 'Neuen Artikel anlegen'}
            </h3>
            {editingName && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-700/50 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Abbrechen
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kassen-Zuordnung */}
            <div className="flex gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 overflow-x-auto items-center">
              <span className="text-xs font-bold text-slate-400 my-auto whitespace-nowrap">
                Kasse:
              </span>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="radio"
                    name="assignedPos"
                    checked={assignedPos === 0}
                    onChange={() => setAssignedPos(0)}
                    className="accent-indigo-500 cursor-pointer"
                  />
                  Alle Kassen
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="radio"
                    name="assignedPos"
                    checked={assignedPos === 1}
                    onChange={() => setAssignedPos(1)}
                    className="accent-indigo-500 cursor-pointer"
                  />
                  Getränke
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="radio"
                    name="assignedPos"
                    checked={assignedPos === 2}
                    onChange={() => setAssignedPos(2)}
                    className="accent-indigo-500 cursor-pointer"
                  />
                  Speisen
                </label>
              </div>
            </div>

            {/* Name & Variants toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">
                  Produktname *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!!editingName}
                  placeholder="z.B. Glühwein, Bratwurst..."
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all text-sm disabled:opacity-60"
                />
              </div>

              <div className="flex items-center gap-3 px-4 bg-slate-900/80 rounded-xl border border-slate-700/80 mt-0 md:mt-5 h-[48px]">
                <input
                  type="checkbox"
                  id="hasVariantsCheckbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer"
                />
                <label htmlFor="hasVariantsCheckbox" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Varianten unterstützen (Klein / Groß bzw. S/L)
                </label>
              </div>
            </div>

            {/* Single Product Fields */}
            {!hasVariants && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">
                    Verkaufspreis (€)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="z.B. 3,50"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">
                    Bestand (Stück)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-amber-400/80 uppercase font-bold ml-1">
                    Einkaufspreis/Stk (€)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="z.B. 1,20"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Variant Fields (S / L) */}
            {hasVariants && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                {/* Klein S */}
                <div className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-[11px] font-bold text-indigo-400 uppercase text-center tracking-wider">
                    Klein (S)
                  </p>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-bold ml-1">Verkaufspreis €</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceS}
                      onChange={(e) => setPriceS(e.target.value)}
                      placeholder="z.B. 2,50"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-bold ml-1">Bestand Stk</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stockS}
                      onChange={(e) => setStockS(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-amber-400/80 uppercase font-bold ml-1">Einkaufspreis €</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={costS}
                      onChange={(e) => setCostS(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Groß L */}
                <div className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-[11px] font-bold text-indigo-400 uppercase text-center tracking-wider">
                    Groß (L)
                  </p>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-bold ml-1">Verkaufspreis €</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceL}
                      onChange={(e) => setPriceL(e.target.value)}
                      placeholder="z.B. 4,00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-bold ml-1">Bestand Stk</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stockL}
                      onChange={(e) => setStockL(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-amber-400/80 uppercase font-bold ml-1">Einkaufspreis €</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={costL}
                      onChange={(e) => setCostL(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Wird gespeichert...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingName ? 'Artikel aktualisieren' : 'Artikel speichern'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Inventory Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Aktueller Bestand ({Object.keys(inventory).length} Artikel)
            </h3>
          </div>

          {Object.keys(inventory).length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-sm">
              Noch keine Artikel im System. Verwende das Formular oben oder lade Beispieldaten.
            </div>
          ) : (
            groupInfo.map(({ key, label, icon: Icon }) => {
              const names = groups[key];
              if (!names || names.length === 0) return null;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">({names.length})</span>
                  </div>

                  <div className="space-y-2">
                    {names.map(prodName => {
                      const item = inventory[prodName];
                      const outOfStock = item.hasVariants
                        ? (item.stockS ?? 0) <= 0 && (item.stockL ?? 0) <= 0
                        : (item.stock ?? 0) <= 0;

                      return (
                        <div
                          key={prodName}
                          className={`bg-slate-800/80 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                            outOfStock ? 'border-rose-500/30 bg-slate-900/50' : 'border-slate-700/80'
                          } flex justify-between items-center gap-3`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-bold text-sm sm:text-base truncate">
                              {prodName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                              {item.hasVariants ? (
                                <span>
                                  S: {(item.priceS ?? 0).toFixed(2)} € (
                                  <strong className={(item.stockS ?? 0) <= 0 ? 'text-rose-400' : 'text-slate-200'}>
                                    {item.stockS ?? 0}x
                                  </strong>
                                  ) &nbsp;|&nbsp; L: {(item.priceL ?? 0).toFixed(2)} € (
                                  <strong className={(item.stockL ?? 0) <= 0 ? 'text-rose-400' : 'text-slate-200'}>
                                    {item.stockL ?? 0}x
                                  </strong>
                                  )
                                </span>
                              ) : (
                                <span>
                                  {(item.price ?? 0).toFixed(2)} € ·{' '}
                                  <span className={outOfStock ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                                    {item.stock ?? 0}x vorrätig
                                  </span>
                                  {item.cost ? ` · EK: ${(item.cost).toFixed(2)} €` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1.5 flex-none">
                            <button
                              type="button"
                              onClick={() => handleEdit(prodName)}
                              className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                              title="Bearbeiten"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(prodName)}
                              className="text-rose-400 hover:text-rose-300 p-2 hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
