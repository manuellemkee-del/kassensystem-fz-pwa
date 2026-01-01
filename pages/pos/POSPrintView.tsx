
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { ArchivedEvent } from '../../types';
import { ArrowLeft, Printer } from 'lucide-react';

const POSPrintView: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ArchivedEvent | null>(null);

  useEffect(() => {
    const archive = storage.getArchive();
    const found = archive.find(e => e.id === id);
    if (found) {
      setEvent(found);
    }
  }, [id]);

  if (!event) return <div className="p-10 text-center font-bold">Event nicht gefunden.</div>;

  const stats = event.orders.reduce((acc, o) => {
    if (o.paymentMethod === 'Bar') acc.bar += o.total;
    if (o.paymentMethod === 'Karte') acc.karte += o.total;
    if (o.paymentMethod === 'Gratis') {
      acc.gratis += o.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    }
    return acc;
  }, { bar: 0, karte: 0, gratis: 0 });

  const productSummary = event.orders.reduce((acc: Record<string, number>, o) => {
    o.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const revenue = stats.bar + stats.karte;
  const expectedEndBalance = event.initialBalance + stats.bar;

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans print:p-0">
      <div className="max-w-4xl mx-auto p-6 flex justify-between items-center border-b print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 bg-slate-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase italic tracking-widest active:scale-95 transition-all text-slate-700"
        >
          <ArrowLeft size={16} /> Zurück zur App
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase italic tracking-widest active:scale-95 transition-all shadow-xl"
        >
          <Printer size={16} /> Jetzt Drucken
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-10 print:p-0" id="print-area">
        <header className="border-b-4 border-slate-900 pb-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Abschluss-Bericht</h1>
            <p className="text-2xl font-black text-slate-500 uppercase italic tracking-tight">{event.name}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="font-black italic text-lg">{new Date(event.startDate).toLocaleDateString('de-DE')}</p>
            <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">
              {new Date(event.startDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-12">
          <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] italic text-slate-500 mb-6 border-b-2 border-slate-200 pb-2">Umsatz-Check</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Bargeld</span>
                <span className="font-black text-xl italic text-slate-900">{stats.bar.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Kartenzahlung</span>
                <span className="font-black text-xl italic text-slate-900">{stats.karte.toFixed(2)} €</span>
              </div>
              <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-800 italic uppercase">Gesamtumsatz</span>
                <span className="font-black text-3xl italic text-emerald-700">{revenue.toFixed(2)} €</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 italic text-right mt-2">* Exklusive Gratis-Buchungen ({stats.gratis.toFixed(2)} €)</p>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] italic text-slate-400 mb-6 border-b border-white/20 pb-2">Kassen-Rechnung</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold">Anfangsbestand</span>
                <span className="font-bold">{event.initialBalance.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold">Bar-Umsatz (+)</span>
                <span className="font-bold">{stats.bar.toFixed(2)} €</span>
              </div>
              <div className="pt-6 border-t border-white/20 flex justify-between items-center">
                <span className="font-black italic uppercase text-amber-500">Soll-Endbestand</span>
                <span className="font-black text-4xl italic text-white">{expectedEndBalance.toFixed(2)} €</span>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-4 leading-relaxed">Der physische Kassenbestand muss diesem Wert entsprechen.</p>
            </div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-4">
            <span className="bg-slate-900 text-white px-4 py-1 rounded-lg">Mengen</span> Verkaufte Produkte
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(productSummary).sort((a,b) => b[1] - a[1]).map(([name, count]) => (
              <div key={name} className="border-2 border-slate-100 p-4 rounded-2xl flex justify-between items-center bg-white">
                <span className="font-bold text-slate-800">{name}</span>
                <span className="bg-slate-100 px-3 py-1 rounded-xl font-black italic text-lg text-slate-900 border border-slate-200">{count}x</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 overflow-x-auto">
          <h2 className="text-xl font-black italic uppercase tracking-tight mb-6 border-b-4 border-slate-900 pb-2">Detaillierte Buchungsliste</h2>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left font-black text-slate-500 uppercase tracking-widest text-[10px] border-b-2">
                <th className="py-4 px-2">Bon #</th>
                <th className="py-4 px-2">Zeit</th>
                <th className="py-4 px-2">Zahlart</th>
                <th className="py-4 px-2">Positionen</th>
                <th className="py-4 px-2 text-right">Summe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {event.orders.map(o => (
                <tr key={o.id}>
                  <td className="py-4 px-2 font-black italic text-slate-900">#{o.orderNumber}</td>
                  <td className="py-4 px-2 font-bold text-slate-500">{new Date(o.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-4 px-2">
                    <span className="px-3 py-1 rounded text-[9px] font-black uppercase italic tracking-widest border-2 border-slate-900 text-slate-900 bg-white">
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-xs font-bold text-slate-700">
                    {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="py-4 px-2 text-right font-black italic text-lg text-slate-900">{o.total.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-20 pt-8 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic gap-4">
          <div className="flex flex-col items-center md:items-start">
            <span>Kassensystem FZ Archiv-System</span>
            <span className="text-amber-500 lowercase">powered by C2</span>
          </div>
          <span>Event-ID: {event.id}</span>
          <span>Gedruckt am: {new Date().toLocaleString('de-DE')}</span>
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print-hidden { display: none !important; }
          #print-area { padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          table { border-collapse: collapse; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default POSPrintView;
