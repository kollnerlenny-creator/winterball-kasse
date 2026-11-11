import React, { useState } from 'react';
import { DollarSign, TrendingUp, Percent, ShoppingCart, Wallet, Check, AlertCircle } from 'lucide-react';
import { Order, InventoryItem, FinanceStats } from '../../types';

interface Props {
  orders: Order[];
  inventory: Record<string, InventoryItem>;
  stats: FinanceStats;
  onSaveExpenses: (amount: number) => Promise<void>;
  onSaveCashStart: (amount: number) => Promise<void>;
}

export const DashboardView: React.FC<Props> = ({
  orders,
  inventory,
  stats,
  onSaveExpenses,
  onSaveCashStart,
}) => {
  const [expenseInput, setExpenseInput] = useState<string>(stats.expenses.toString());
  const [cashStartInput, setCashStartInput] = useState<string>(stats.cashStart.toString());
  const [cashActualInput, setCashActualInput] = useState<string>('');
  const [isSavingExpenses, setIsSavingExpenses] = useState(false);
  const [isSavingCashStart, setIsSavingCashStart] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState<'expenses' | 'cashStart' | null>(null);

  // Sync inputs if stats from remote Firestore changes and input was not modified
  React.useEffect(() => {
    setExpenseInput(stats.expenses.toString());
  }, [stats.expenses]);

  React.useEffect(() => {
    setCashStartInput(stats.cashStart.toString());
  }, [stats.cashStart]);

  const validOrders = orders.filter(o => !o.storniert);
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Wareneinsatz (COGS) berechnen
  let cogs = 0;
  validOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!item.parent || item.isDonation) return;
      const invItem = inventory[item.parent];
      if (!invItem) return;
      if (item.isVariant) {
        cogs += item.isLarge ? (invItem.costL ?? 0) : (invItem.costS ?? 0);
      } else {
        cogs += invItem.cost ?? 0;
      }
    });
  });

  const totalCosts = cogs + stats.expenses;
  const netProfit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const avgOrder = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Top Products calculation
  const productCounts: Record<string, number> = {};
  validOrders.forEach(o => {
    (o.items || []).forEach(i => {
      productCounts[i.name] = (productCounts[i.name] || 0) + 1;
    });
  });

  const sortedTopProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxProductCount = sortedTopProducts.length > 0 ? sortedTopProducts[0][1] : 1;

  // Kassensturz
  const sollCash = stats.cashStart + totalRevenue;
  const actualCash = parseFloat(cashActualInput);
  const hasActual = !isNaN(actualCash) && cashActualInput.trim() !== '';
  const diffCash = hasActual ? actualCash - sollCash : null;

  const handleSaveExpenses = async () => {
    const val = parseFloat(expenseInput) || 0;
    setIsSavingExpenses(true);
    try {
      await onSaveExpenses(val);
      setShowSavedMsg('expenses');
      setTimeout(() => setShowSavedMsg(null), 2000);
    } finally {
      setIsSavingExpenses(false);
    }
  };

  const handleSaveCashStart = async () => {
    const val = parseFloat(cashStartInput) || 0;
    setIsSavingCashStart(true);
    try {
      await onSaveCashStart(val);
      setShowSavedMsg('cashStart');
      setTimeout(() => setShowSavedMsg(null), 2000);
    } finally {
      setIsSavingCashStart(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Brutto-Umsatz</p>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-3xl font-black text-white font-mono">{totalRevenue.toFixed(2)} €</h3>
            <p className="text-[11px] text-slate-500 mt-1">{validOrders.length} gültige Verkäufe</p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Netto-Gewinn</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className={`text-3xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit.toFixed(2)} €
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Umsatz abzüglich Wareneinsatz & Kosten</p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gewinnmarge</p>
              <Percent className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-3xl font-black text-sky-400 font-mono">{Math.round(margin)}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">Durchschnittl. Gewinnanteil</p>
          </div>
        </div>

        {/* Sonstige Kosten Box */}
        <div className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <ShoppingCart className="text-indigo-400 w-5 h-5" />
                Sonstige Kosten
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                Zusätzliche Ausgaben wie Deko, Raummiete, GEMA, etc. Der Wareneinsatz ({cogs.toFixed(2)} €) wird automatisch aus den hinterlegten Einkaufspreisen je verkauftem Artikel berechnet.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={expenseInput}
                  onChange={(e) => setExpenseInput(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-xl w-36 sm:w-40 outline-none focus:border-indigo-500 transition-all text-right pr-8"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
              </div>
              <button
                onClick={handleSaveExpenses}
                disabled={isSavingExpenses}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                {showSavedMsg === 'expenses' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" /> Gespeichert
                  </>
                ) : (
                  'Speichern'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Kassensturz (Bargeld-Abgleich) */}
        <div className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-lg">
          <div className="mb-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-1">
              <Wallet className="text-amber-400 w-5 h-5" />
              Kassensturz (Bargeld-Abgleich)
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Vergleiche den tatsächlich nachgezählten Bargeldbestand mit dem errechneten Soll-Bestand aus Anfangsgeld und Bar-Umsätzen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 truncate block">
                Kassenstart (Wechselgeld)
              </label>
              <div className="flex gap-2 items-center min-w-0">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cashStartInput}
                  onChange={(e) => setCashStartInput(e.target.value)}
                  placeholder="0.00"
                  className="min-w-0 flex-1 w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono outline-none focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveCashStart}
                  disabled={isSavingCashStart}
                  className="flex-none bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-sm"
                >
                  {showSavedMsg === 'cashStart' ? '✓ Gespeichert' : 'Sichern'}
                </button>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 truncate block">
                Soll (Start + Umsatz)
              </label>
              <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2.5 font-mono text-slate-200 text-lg font-bold truncate">
                {sollCash.toFixed(2)} €
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 truncate block">
                Ist (nachgezähltes Bargeld)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={cashActualInput}
                onChange={(e) => setCashActualInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-lg outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 truncate block">
                Differenz (Ist - Soll)
              </label>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono truncate ${
                  diffCash === null
                    ? 'text-slate-600'
                    : Math.abs(diffCash) < 0.01
                    ? 'text-emerald-400'
                    : diffCash < 0
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {diffCash === null ? '--' : `${diffCash >= 0 ? '+' : ''}${diffCash.toFixed(2)} €`}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom charts & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-lg">
            <h3 className="font-bold text-white mb-6 text-base">Top 5 Meistverkaufte Produkte</h3>
            {sortedTopProducts.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">Noch keine Verkäufe verzeichnet.</p>
            ) : (
              <div className="space-y-4">
                {sortedTopProducts.map(([name, count]) => (
                  <div key={name} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold">
                      <span className="truncate pr-2">{name}</span>
                      <span className="font-mono text-indigo-400 font-bold flex-none">{count}x</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (count / maxProductCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-lg">
            <h3 className="font-bold text-white mb-6 text-base">Finanzübersicht</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Verkäufe gesamt</span>
                <span className="text-white font-bold font-mono">{validOrders.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Wareneinsatz (Einkauf)</span>
                <span className="text-amber-400 font-bold font-mono">-{cogs.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Sonstige Ausgaben</span>
                <span className="text-rose-400 font-bold font-mono">-{stats.expenses.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400 font-semibold">Gesamtkosten (-)</span>
                <span className="text-rose-400 font-bold font-mono">-{totalCosts.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Durchschn. Bon-Wert</span>
                <span className="text-white font-bold font-mono">{avgOrder.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 font-medium tracking-wider pt-2">
          Winterball Kasse Pro • © Lenny Köllner
        </div>
      </div>
    </div>
  );
};
