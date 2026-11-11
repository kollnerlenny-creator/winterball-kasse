import React from 'react';
import { History, FileDown, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Order } from '../../types';

interface Props {
  orders: Order[];
  onStornoOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onToast: (msg: string) => void;
}

export const HistoryView: React.FC<Props> = ({ orders, onStornoOrder, onDeleteOrder, onToast }) => {
  const sortedOrders = [...orders].sort((a, b) => {
    const tsA = a.timestamp?.seconds || 0;
    const tsB = b.timestamp?.seconds || 0;
    return tsB - tsA;
  });

  const exportPDF = () => {
    const validOrders = orders.filter(o => !o.storniert);
    if (validOrders.length === 0) {
      onToast("Keine aktiven Verkäufe zum Exportieren");
      return;
    }

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const marginX = 15;
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;

      const ensureSpace = (lines: number) => {
        if (y + lines * 5 > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }
      };

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Winterball Kasse - Kassenbelege & Journal', marginX, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`, marginX, y);
      y += 4;

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.8);
      doc.line(marginX, y, 195, y);
      y += 8;

      let grandTotal = 0;
      let grandTips = 0;
      const chronological = [...validOrders].sort(
        (a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
      );

      chronological.forEach((order, idx) => {
        ensureSpace(4 + (order.items?.length || 1));
        const time = order.timestamp?.seconds
          ? new Date(order.timestamp.seconds * 1000).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '--:--';

        const posLabel = order.pos === 1 ? 'Getränke' : order.pos === 2 ? 'Speisen' : 'Kasse';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`Beleg #${idx + 1} (${posLabel})`, marginX, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`${time} Uhr`, marginX + 45, y);
        doc.setTextColor(15, 23, 42);
        y += 6;

        doc.setFontSize(10);
        (order.items || []).forEach(item => {
          ensureSpace(1);
          doc.text(`• ${item.name}`, marginX + 3, y);
          doc.text(`${item.price.toFixed(2)} €`, 195, y, { align: 'right' });
          y += 5;
        });

        if (order.tip && order.tip > 0) {
          ensureSpace(1);
          doc.setTextColor(180, 83, 9);
          doc.text(`+ Trinkgeld`, marginX + 3, y);
          doc.text(`${order.tip.toFixed(2)} €`, 195, y, { align: 'right' });
          y += 5;
          doc.setTextColor(15, 23, 42);
          grandTips += order.tip;
        }

        ensureSpace(2);
        doc.setFont('helvetica', 'bold');
        doc.text(`Summe: ${(order.total || 0).toFixed(2)} €`, marginX + 3, y);
        doc.setFont('helvetica', 'normal');
        y += 4;

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginX, y, 195, y);
        y += 6;

        grandTotal += order.total || 0;
      });

      // Summary section
      ensureSpace(8);
      y += 4;
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, 180, 28, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginX, y, 180, 28, 'S');

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`Gesamtumsatz: ${grandTotal.toFixed(2)} €`, marginX + 5, y);

      if (grandTips > 0) {
        doc.setFontSize(10);
        doc.setTextColor(180, 83, 9);
        doc.text(`(zzgl. Trinkgeld: ${grandTips.toFixed(2)} €)`, marginX + 90, y);
        doc.setTextColor(15, 23, 42);
      }

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Anzahl erfasste Verkäufe: ${chronological.length}`, marginX + 5, y);

      const stornoCount = orders.filter(o => o.storniert).length;
      if (stornoCount > 0) {
        y += 6;
        doc.setTextColor(225, 29, 72);
        doc.text(`Stornierte Belege (nicht gewertet): ${stornoCount}`, marginX + 5, y);
      }

      const filename = `Winterball_Kassenbericht_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      onToast("PDF erfolgreich heruntergeladen");
    } catch (e) {
      console.error(e);
      onToast("Fehler beim Erstellen der PDF");
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Buchungsverlauf</h2>
              <p className="text-xs text-slate-400">Verkäufe einsehen, stornieren oder einzelne Belege löschen</p>
            </div>
          </div>

          <button
            type="button"
            onClick={exportPDF}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-indigo-400" /> Als PDF exportieren
          </button>
        </div>

        {sortedOrders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">Bisher keine Buchungen vorhanden</p>
            <p className="text-xs text-slate-600 mt-1">Abgeschlossene Verkäufe erscheinen sofort hier.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sortedOrders.map((order, idx) => {
              const dateStr = order.timestamp?.seconds
                ? new Date(order.timestamp.seconds * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Gerade eben';

              const posName = order.pos === 1 ? 'GETRÄNKE' : order.pos === 2 ? 'SPEISEN' : 'KASSE';

              return (
                <div
                  key={order.id || idx}
                  className={`bg-slate-800/80 p-5 rounded-2xl border transition-all ${
                    order.storniert
                      ? 'border-rose-500/30 opacity-70 bg-slate-900/50'
                      : 'border-slate-700/80 hover:border-slate-600 shadow-md'
                  } flex flex-col gap-3 group`}
                >
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {dateStr}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {posName}
                      </span>
                      <span
                        className={`text-xl font-black font-mono text-white ${
                          order.storniert ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {(order.total || 0).toFixed(2)} €
                      </span>

                      {(order.tip ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                          +{(order.tip ?? 0).toFixed(2)} € Trinkgeld
                        </span>
                      )}

                      {order.storniert && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                          Storniert
                        </span>
                      )}
                    </div>

                    {/* Action buttons: Storno and Delete */}
                    <div className="flex items-center gap-1.5">
                      {!order.storniert && (
                        <button
                          type="button"
                          onClick={() => onStornoOrder(order)}
                          className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1 transition-all cursor-pointer"
                          title="Buchung stornieren (Bestand wird zurückgebucht)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Stornieren</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order)}
                        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/20 flex items-center gap-1 transition-all cursor-pointer"
                        title="Diesen Beleg endgültig aus der Datenbank und dem Buchungsverlauf löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 space-y-1">
                    {(order.items || []).map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs py-1 border-b border-slate-800/60 last:border-0"
                      >
                        <span className="text-slate-300 font-medium">{item.name}</span>
                        <span className="text-slate-400 font-mono">{item.price.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
