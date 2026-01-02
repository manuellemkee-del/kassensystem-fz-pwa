
import React, { useMemo } from 'react';
import { storage } from '../../services/storage';
import { Euro, TrendingUp, Gift, PieChart as PieIcon, Percent, Clock, Zap, Boxes, History, Coins } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const POSBerichte: React.FC = () => {
  const settings = storage.getSettings();
  const allOrders = storage.getOrders();
  const activeOrders = allOrders.filter(o => o.eventName === settings.activeEvent && !o.cancelled);
  const products = storage.getProducts();
  const tips = settings.activeTips || [];

  const stats = useMemo(() => activeOrders.reduce((acc, o) => {
    if (o.paymentMethod === 'Gratis') {
      const gValue = o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      acc.gratis += gValue;
    } else {
      acc.revenue += o.total;
      if (o.paymentMethod === 'Bar') acc.bar += o.total;
      if (o.paymentMethod === 'Karte') acc.karte += o.total;
    }
    return acc;
  }, { revenue: 0, gratis: 0, bar: 0, karte: 0 }), [activeOrders]);

  const tipStats = useMemo(() => {
    const total = tips.reduce((sum, t) => sum + t.amount, 0);
    const count = tips.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [tips]);

  // Diagramm-Daten: Produktverteilung
  const productDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activeOrders]);

  // Diagramm-Daten: Stunden-Auslastung
  const hourlyLoad = useMemo(() => {
    const hours: Record<string, number> = {};
    activeOrders.forEach(o => {
      const hour = new Date(o.timestamp).getHours();
      const label = `${hour}:00`;
      const fkCount = o.items.reduce((sum, i) => sum + i.quantity, 0);
      hours[label] = (hours[label] || 0) + fkCount;
    });

    const data = Object.entries(hours).map(([hour, count]) => ({ hour, count }));
    const max = Math.max(...data.map(d => d.count), 0);
    const avg = data.length > 0 ? (data.reduce((s, d) => s + d.count, 0) / data.length).toFixed(1) : 0;
    const peak = data.find(d => d.count === max)?.hour || '-';

    return { 
      data: data.sort((a,b) => parseInt(a.hour) - parseInt(b.hour)), 
      peak, 
      avg, 
      max 
    };
  }, [activeOrders]);

  const inventorySummary = useMemo(() => {
    if (!settings.activeInventory) return [];
    
    return products.map(p => {
      const inv = settings.activeInventory?.[p.id];
      if (!inv) return null;

      const soldCount = allOrders
        .filter(o => o.eventName === settings.activeEvent && !o.cancelled)
        .reduce((sum, o) => {
          const item = o.items.find(i => i.productId === p.id);
          return sum + (item?.quantity || 0);
        }, 0);

      const refillCount = settings.activeRefills?.reduce((sum, r) => sum + (r.items[p.id] || 0), 0) || 0;
      const restPercent = inv.start > 0 ? Math.round((inv.current / inv.start) * 100) : 0;

      return {
        name: p.name,
        start: inv.start - refillCount,
        sold: soldCount,
        refill: refillCount,
        current: inv.current,
        percent: restPercent
      };
    }).filter(x => x !== null);
  }, [settings.activeInventory, allOrders, settings.activeRefills, products]);

  const COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#fb7185', '#2dd4bf'];

  return (
    <div className="px-6 pb-24">
      <div className="flex flex-col mb-8 mt-4">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Berichte</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">{settings.activeEvent}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={<Euro size={20}/>} iconBg="bg-amber-100 text-amber-600" label="Netto-Umsatz" value={`${stats.revenue.toFixed(2).replace('.', ',')} €`} subtitle="Ohne Stornos & Gratis" />
        <StatCard icon={<Gift size={20}/>} iconBg="bg-slate-100 text-slate-500" label="Gratis-Wert" value={`${stats.gratis.toFixed(2).replace('.', ',')} €`} />
      </div>

      {/* Trinkgeld Sektion */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mt-6">
        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center gap-2">
          <Coins size={14} className="text-amber-500" /> Trinkgeld
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase italic">Gesamt</p>
            <p className="text-xl font-black text-amber-600 italic leading-none mt-1">{tipStats.total.toFixed(2).replace('.', ',')} €</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase italic">Anzahl</p>
            <p className="text-xl font-black text-slate-800 italic leading-none mt-1">{tipStats.count}x</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase italic">Ø Buchung</p>
            <p className="text-xl font-black text-slate-800 italic leading-none mt-1">{tipStats.avg.toFixed(2).replace('.', ',')} €</p>
          </div>
        </div>
        
        {tips.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Letzte Buchungen</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {tips.slice().reverse().map(tip => (
                <div key={tip.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-[9px] font-bold italic uppercase tracking-tight">
                  <span className="text-slate-400">{new Date(tip.timestamp).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})} Uhr</span>
                  <span className="text-amber-600">+{tip.amount.toFixed(2).replace('.', ',')} €</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Produktverteilung (Pie Chart) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mt-6">
        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center gap-2">
          <PieIcon size={14} className="text-amber-500" /> Verkaufs-Mischung
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={productDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5}>
                {productDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {productDistribution.slice(0, 4).map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-[10px] font-black text-slate-800 uppercase italic truncate flex-1">{item.name}</span>
              <span className="text-[10px] font-black text-slate-400">{item.value}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stunden-Auslastung (Bar Chart) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mt-6">
        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center gap-2">
          <Clock size={14} className="text-blue-500" /> Verkaufs-Verlauf
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyLoad.data}>
              <XAxis dataKey="hour" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800}} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {hourlyLoad.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hour === hourlyLoad.peak ? '#fbbf24' : '#60a5fa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="bg-white p-3 rounded-xl text-blue-500"><Zap size={24} /></div>
          <div>
            <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest italic mb-0.5">Stosszeit</p>
            <p className="text-lg font-black text-slate-800 italic uppercase leading-none">{hourlyLoad.peak} Uhr ({hourlyLoad.max} Stk)</p>
            <p className="text-[9px] text-slate-400 font-bold mt-1">Schnitt: {hourlyLoad.avg} Verkäufe / Stunde</p>
          </div>
        </div>
      </div>

      {/* Bestandsübersicht */}
      {inventorySummary.length > 0 && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mt-6">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Boxes size={14} className="text-emerald-500" /> Bestandsverlauf
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px] uppercase italic font-black">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3">PRODUKT</th>
                  <th className="pb-3 text-center">START</th>
                  <th className="pb-3 text-center">SOLD</th>
                  <th className="pb-3 text-center">REST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventorySummary.map(item => item && (
                  <tr key={item.name} className="text-slate-700">
                    <td className="py-3">{item.name}</td>
                    <td className="py-3 text-center text-slate-400">{item.start + item.refill}</td>
                    <td className="py-3 text-center text-slate-900">{item.sold}</td>
                    <td className={`py-3 text-center ${item.percent < 20 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {item.current} <span className="text-[7px]">({item.percent}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{icon: any, iconBg: string, label: string, value: string, subtitle?: string}> = ({icon, iconBg, label, value, subtitle}) => (
  <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${iconBg}`}>{icon}</div>
    <div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-bold italic">{subtitle}</p>}
    </div>
  </div>
);

export default POSBerichte;
