import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Delete, X, Coins, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  total: number;
  onClose: () => void;
  onProcessSale: (given: number, tip: number) => Promise<void>;
  onSyncCustomerState: (given: number, tip: number, isPaying: boolean) => void;
}

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  total,
  onClose,
  onProcessSale,
  onSyncCustomerState,
}) => {
  const [payInput, setPayInput] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize comma to dot for parsing
  const parsedGiven = parseFloat(payInput.replace(',', '.')) || 0;
  const grandTotal = Math.round((total + tipAmount) * 100) / 100;
  
  // If payInput is empty, allow direct exact payment
  const effectiveGiven = payInput === "" ? grandTotal : parsedGiven;
  const change = Math.max(0, Math.round((effectiveGiven - grandTotal) * 100) / 100);
  const isEnough = grandTotal <= 0 || effectiveGiven >= grandTotal;
  const missingAmount = Math.max(0, Math.round((grandTotal - parsedGiven) * 100) / 100);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setPayInput("");
      setTipAmount(0);
      setIsSubmitting(false);
      setErrorMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      onSyncCustomerState(0, 0, true);
    } else {
      onSyncCustomerState(0, 0, false);
    }
  }, [isOpen]);

  // Sync state to customer screen with slight debounce (never inside setState updater!)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onSyncCustomerState(effectiveGiven, tipAmount, true);
    }, 200);
    return () => clearTimeout(timer);
  }, [effectiveGiven, tipAmount, isOpen]);

  // Append a character from on-screen buttons
  const addPayNum = useCallback((char: string) => {
    setPayInput((prev) => {
      if ((char === '.' || char === ',') && (prev.includes('.') || prev.includes(','))) {
        return prev;
      }
      if ((char === '.' || char === ',') && prev === '') {
        return '0,';
      }
      // Max 2 decimal places
      const separator = prev.includes(',') ? ',' : prev.includes('.') ? '.' : null;
      if (separator) {
        const decimals = prev.split(separator)[1];
        if (decimals && decimals.length >= 2) return prev;
      }
      return prev + (char === '.' ? ',' : char);
    });
  }, []);

  const deleteLastDigit = useCallback(() => {
    setPayInput((prev) => prev.slice(0, -1));
  }, []);

  const clearPayNum = useCallback(() => {
    setPayInput("");
  }, []);

  const setExactCash = useCallback(() => {
    setPayInput(total.toFixed(2).replace('.', ','));
    setTipAmount(0);
  }, [total]);

  const setQuickCash = useCallback((amt: number) => {
    setPayInput(amt.toString());
  }, []);

  const handleInputChange = (rawVal: string) => {
    // Only allow numbers, comma and dot
    const filtered = rawVal.replace(/[^0-9,\.]/g, '');
    // Keep first dot/comma only
    let seenDecimal = false;
    let clean = '';
    for (const ch of filtered) {
      if (ch === ',' || ch === '.') {
        if (!seenDecimal) {
          seenDecimal = true;
          clean += ',';
        }
      } else {
        clean += ch;
      }
    }
    setPayInput(clean);
  };

  const setFullTip = () => {
    const rem = Math.max(0, Math.round((parsedGiven - total) * 100) / 100);
    setTipAmount(rem);
  };

  const adjustTip = (delta: number) => {
    setTipAmount((prev) => Math.max(0, Math.round((prev + delta) * 100) / 100));
  };

  const handleTipChange = (val: string) => {
    const next = Math.max(0, parseFloat(val.replace(',', '.')) || 0);
    setTipAmount(next);
  };

  const handleSubmit = useCallback(async () => {
    if (!isEnough && grandTotal > 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const finalGiven = effectiveGiven > 0 ? effectiveGiven : grandTotal;
      await onProcessSale(finalGiven, tipAmount);
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMessage(err.message || "Fehler beim Buchen");
    } finally {
      setIsSubmitting(false);
    }
  }, [isEnough, grandTotal, isSubmitting, effectiveGiven, onProcessSale, tipAmount]);

  // Global keyboard listener for modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is editing the tip input specifically, let native input handle it
      if (document.activeElement?.getAttribute('data-field') === 'tip') {
        if (e.key === 'Escape') onClose();
        return;
      }

      // Enter / NumpadEnter submits if allowed
      if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (isEnough && !isSubmitting) {
          handleSubmit();
        }
        return;
      }

      // Escape closes
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // If Gegeben input is already active, standard typing naturally updates it via onChange
      if (document.activeElement === inputRef.current) {
        return;
      }

      // Otherwise capture keyboard / physical numpad events
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        addPayNum(e.key);
      } else if (e.code.startsWith('Numpad') && e.code.length === 7 && !isNaN(Number(e.code[6]))) {
        e.preventDefault();
        addPayNum(e.code[6]);
      } else if (e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') {
        e.preventDefault();
        addPayNum(',');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteLastDigit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEnough, isSubmitting, handleSubmit, onClose, addPayNum, deleteLastDigit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[110] flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-4xl w-full bg-slate-900 rounded-3xl border border-slate-700/80 flex flex-col md:flex-row overflow-hidden shadow-2xl">
        {/* Left column: Summary & Cash Calculation */}
        <div className="p-6 md:p-8 md:w-5/12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zu zahlen</p>
              <button
                type="button"
                onClick={onClose}
                className="md:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              {total.toFixed(2)} €
            </h2>

            <div className="space-y-3">
              {/* Gegeben Box (Interactive input) */}
              <div 
                onClick={() => inputRef.current?.focus()}
                className="bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border-2 border-slate-700 hover:border-indigo-500/70 focus-within:border-indigo-500 transition-colors cursor-text"
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Gegeben (Bar)</p>
                  {payInput && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPayNum();
                      }}
                      className="text-[10px] font-semibold text-rose-400 hover:underline cursor-pointer"
                    >
                      Leeren
                    </button>
                  )}
                </div>
                <div className="flex items-baseline justify-end gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={payInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={total.toFixed(2).replace('.', ',')}
                    className="w-full bg-transparent text-right font-mono font-black text-3xl sm:text-4xl text-white outline-none placeholder:text-slate-600"
                  />
                  <span className="text-slate-400 font-mono font-bold text-2xl">€</span>
                </div>
                {payInput === "" && (
                  <p className="text-[10px] text-indigo-400/80 text-right mt-0.5">
                    Tippe Betrag oder nutze "Passend"
                  </p>
                )}
              </div>

              {/* Rückgeld Box */}
              <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-2xl border border-slate-700/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rückgeld</p>
                <div className={`text-3xl font-mono font-bold text-right ${
                  payInput === "" 
                    ? 'text-slate-300' 
                    : isEnough 
                    ? 'text-emerald-400' 
                    : 'text-rose-400'
                }`}>
                  {payInput === "" 
                    ? '0,00 € (Passend)'
                    : isEnough 
                    ? `${change.toFixed(2)} €` 
                    : `–${missingAmount.toFixed(2)} €`}
                </div>
              </div>

              {/* Trinkgeld Box */}
              <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-2xl border border-slate-700/80">
                <div className="flex items-center justify-between mb-2 gap-1">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Trinkgeld</p>
                  <button
                    type="button"
                    onClick={setFullTip}
                    disabled={parsedGiven <= total}
                    className="text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-30 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                  >
                    Rest als Trinkgeld
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustTip(-0.5)}
                    className="w-9 h-9 flex-none bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-bold text-lg active:scale-95 transition-all cursor-pointer"
                  >
                    –
                  </button>
                  <input
                    type="text"
                    data-field="tip"
                    inputMode="decimal"
                    value={tipAmount ? tipAmount.toString().replace('.', ',') : ''}
                    placeholder="0,00"
                    onChange={(e) => handleTipChange(e.target.value)}
                    className="flex-1 w-0 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-400 font-mono font-bold text-xl text-right outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => adjustTip(0.5)}
                    className="w-9 h-9 flex-none bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-bold text-lg active:scale-95 transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden md:block mt-6 text-slate-400 hover:text-white font-medium text-sm text-center py-2 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
        </div>

        {/* Right column: Quick cash & Numpad */}
        <div className="p-4 sm:p-6 md:p-8 md:w-7/12 bg-slate-800/20 flex flex-col justify-between">
          <div>
            {/* Quick cash pills with Passend */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              <button
                type="button"
                onClick={setExactCash}
                className="col-span-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white border border-indigo-400 shadow-sm active:scale-95 transition-all text-xs sm:text-sm font-sans flex flex-col items-center justify-center cursor-pointer"
                title="Genau passend kassieren"
              >
                <Coins className="w-4 h-4 mb-0.5 text-indigo-200" />
                <span>Passend</span>
              </button>

              {[5, 10, 20, 50].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickCash(val)}
                  className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-amber-400 border border-slate-700/80 shadow-sm active:scale-95 transition-all text-sm sm:text-base font-mono cursor-pointer"
                >
                  {val}€
                </button>
              ))}
            </div>

            {/* Numpad buttons */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addPayNum(n.toString())}
                  className="bg-slate-800/90 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-2xl font-bold py-3.5 sm:py-4 rounded-xl border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={deleteLastDigit}
                className="bg-slate-800/90 hover:bg-slate-700 text-rose-400 py-3.5 sm:py-4 rounded-xl border border-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm select-none"
                title="Letzte Ziffer löschen"
              >
                <Delete className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => addPayNum('0')}
                className="bg-slate-800/90 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-2xl font-bold py-3.5 sm:py-4 rounded-xl border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => addPayNum(',')}
                className="bg-slate-800/90 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-2xl font-bold py-3.5 sm:py-4 rounded-xl border border-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
              >
                ,
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            id="confirmBtn"
            onClick={handleSubmit}
            disabled={(!isEnough && payInput !== "") || isSubmitting}
            className={`w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              isSubmitting
                ? 'bg-indigo-800 cursor-wait opacity-80'
                : (!isEnough && payInput !== "")
                ? 'bg-slate-800 opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin inline-block w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
            ) : payInput === "" ? (
              <>
                <span>Passend kassieren ({grandTotal.toFixed(2)} €)</span>
                <CheckCircle className="w-6 h-6 text-emerald-200" />
              </>
            ) : isEnough ? (
              <>
                <span>Buchen ({grandTotal.toFixed(2)} €)</span>
                {change > 0 ? (
                  <span className="text-xs bg-emerald-800 px-2 py-0.5 rounded-full font-mono">
                    Rückgeld: {change.toFixed(2)} €
                  </span>
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-200" />
                )}
              </>
            ) : (
              <span>Noch {missingAmount.toFixed(2)} € fehlen</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
