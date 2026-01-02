
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { ArchivedEvent, Order, Product, InventoryItem } from '../../types';
import { ArrowLeft, Printer, Info, Package, Boxes, RotateCcw, Coins } from 'lucide-react';

const POSPrintView: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ArchivedEvent | null>(null);
  const products = storage.getProducts();

  useEffect(() => {
    const archive = storage.getArchive();
    const found = archive.find(e => e.id === id);
    if (found) setEvent(found);
  }, [id]);

  if (!event) return <div className="p-10 text-center font-bold">Event nicht gefunden.</div>;

  const calculateVAT = (orders: Order[]) => {
    const result = { togo: { gross: 0, net: 0, vat: 0 }, onsite: { gross: 0, net: 0, vat: 0 }, totalGross: 0 };
    orders.filter(o => !o.cancelled).forEach(o => {
      if (o.paymentMethod === 'Gratis') return;
      const gross = o.total;
      result.totalGross += gross;
      if (o.tax_rate === 7) {
        result.togo.gross += gross; result.togo.net += gross / 1.07; result.togo.vat += gross - (gross / 1.07);
      } else {
        result.onsite.gross += gross; result.onsite.net += gross / 1.19; result.onsite.vat += gross - (gross / 1.19);
      }
    });
    return result;
  };

  const vatStats = calculateVAT(event.orders);
  const cancelledOrders = event.orders.filter(o => o.cancelled);
  
  const stats = event.orders.reduce<{ bar: number; karte: number; gratis: number }>((acc, o) => {
    if (o.cancelled) return acc;
    if (o.paymentMethod === 'Bar') acc.bar += o.total;
    if (o.paymentMethod === 'Karte') acc.karte += o.total;
    if (o.paymentMethod === 'Gratis') {
      acc.gratis += o.items.reduce((sum: number, i) => sum + (i.price * i.quantity), 0);
    }
    return acc;
  }, { bar: 0, karte: 0, gratis: 0 });

  const totalTips = event.tips?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const tipCount = event.tips?.length || 0;

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans print:p-0">
      <div className="max-w-4xl mx-auto p-6 flex justify-between items-center border-b print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-slate-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase italic tracking-widest text-slate-700"><ArrowLeft size={16} /> Zurück</button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-xl"><Printer size={16} /> Drucken</button>
      </div>

      <div className="max-w-4xl mx-auto p-10 print:p-0">
        <header className="border-b-4 border-slate-900 pb-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div><h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Bericht</h1><p className="text-2xl font-black text-slate-500 uppercase italic tracking-tight">{event.name}</p></div>
          <div className="text-right"><p className="font-black italic text-lg">{new Date(event.startDate).toLocaleDateString('de-DE')}</p><p className="font-bold text-slate-400 text-sm">ID: {event.id}</p></div>
        </header>

        <div className="grid grid-cols-2 gap-10 mb-12">
           <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-200">
              <h2 className="text-xs font-black uppercase tracking-widest italic text-slate-500 mb-6 border-b pb-2">Zahlungen</h2>
              <div className="space-y-4">
                <div className="flex justify-between font-bold"><span>Bar</span><span>{stats.bar.toFixed(2).replace('.', ',')} €</span></div>
                <div className="flex justify-between font-bold"><span>Karte</span><span>{stats.karte.toFixed(2).replace('.', ',')} €</span></div>
                <div className="pt-4 border-t-2 border-slate-200 flex justify-between font-black text-2xl italic text-emerald-700"><span>UMSATZ</span><span>{vatStats.totalGross.toFixed(2).replace('.', ',')} €</span></div>
              </div>
           </div>
           <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
              <h2 className="text-xs font-black uppercase tracking-widest italic text-slate-400 mb-6 border-b border-white/10 pb-2">Kassen-Check</h2>
              <div className="space-y-4">
                <div className="flex justify-between"><span>Start</span><span>{event.initialBalance.toFixed(2).replace('.', ',')} €</span></div>
                <div className="flex justify-between"><span>Bar (+)</span><span>{stats.bar.toFixed(2).replace('.', ',')} €</span></div>
                <div className="pt-6 border-t border-white/20 flex justify-between font-black text-3xl italic text-amber-500"><span>SOLL</span><span>{(event.initialBalance + stats.bar).toFixed(2).replace('.', ',')} €</span></div>
              </div>
           </div>
        </div>

        <section className="mb-12 bg-amber-50 p-8 rounded-[2rem] border-2 border-amber-100">
          <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3 text-amber-700"><Coins size={24}/> Trinkgeld</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-600 italic">Gesamtsumme Trinkgeld</p>
              <p className="text-4xl font-black text-slate-900 italic mt-1">{totalTips.toFixed(2).replace('.', ',')} €</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-amber-600 italic">Anzahl Buchungen</p>
              <p className="text-4xl font-black text-slate-900 italic mt-1">{tipCount} Buchungen</p>
            </div>
          </div>
        </section>

        {event.inventory && (
          <section className="mb-12 bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
            <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Boxes size={24}/> Bestandsverlauf</h2>
            <table className="w-full text-left text-[10px] font-black uppercase italic">
              <thead><tr className="border-b-2 border-slate-200"><th className="py-2">Produkt</th><th className="py-2 text-center">Start</th><th className="py-2 text-center">Verkauft</th><th className="py-2 text-center">Aufgestockt</th><th className="py-2 text-center">Rest</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(event.inventory).map(([id, invValue]) => {
                  const inv = invValue as InventoryItem;
                  const p = products.find(x => x.id === id);
                  const sold = event.orders.filter(o => !o.cancelled).reduce((sum, o) => sum + (o.items.find(i => i.productId === id)?.quantity || 0), 0);
                  const refills = event.refills?.reduce((sum, r) => sum + (r.items[id] || 0), 0) || 0;
                  return (
                    <tr key={id}>
                      <td className="py-3">{p?.name || id}</td>
                      <td className="py-3 text-center">{inv.start - refills}</td>
                      <td className="py-3 text-center">{sold}</td>
                      <td className="py-3 text-center">{refills}</td>
                      <td className="py-3 text-center font-black text-emerald-700">{inv.current}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {cancelledOrders.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black italic uppercase text-red-600 mb-6 border-b-4 border-red-500 pb-2 flex items-center gap-3"><RotateCcw size={24}/> Stornierungen</h2>
            <div className="space-y-3">
              {cancelledOrders.map(o => (
                <div key={o.id} className="p-4 border-2 border-red-100 rounded-2xl flex justify-between items-center text-xs font-bold italic">
                  <div>
                    <span className="text-slate-900 font-black">#{o.orderNumber}</span> - {o.total.toFixed(2).replace('.', ',')} €
                    <p className="text-[10px] text-red-500 uppercase mt-1">Grund: {o.cancel_reason} • {new Date(o.cancel_timestamp || '').toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})} Uhr</p>
                  </div>
                  <div className="text-slate-400 text-[10px]">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-20 pt-8 border-t-2 text-[10px] font-bold text-slate-400 uppercase italic flex justify-between">
          <div>CrewConnect Archive</div><div>{new Date().toLocaleString('de-DE')}</div>
        </footer>
      </div>
    </div>
  );
};

export default POSPrintView;
