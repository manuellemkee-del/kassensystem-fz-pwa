
import React, { useMemo } from 'react';
import { storage } from '../../services/storage';
import { DollarSign, Package, TrendingUp, Gift, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const POSBerichte: React.FC = () => {
  const settings = storage.getSettings();
  const allOrders = storage.getOrders();
  const orders = allOrders.filter(o => o.eventName === settings.activeEvent);

  const stats = useMemo(() => orders.reduce((acc, o) => {
    if (o.paymentMethod === 'Gratis') {
      const gValue = o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      acc.gratis += gValue;
    } else {
      acc.revenue += o.total;
      if (o.paymentMethod === 'Bar') acc.bar += o.total;
      if (o.paymentMethod === 'Karte') acc.karte += o.total;
    }
    return acc;
  }, { revenue: 0, gratis: 0, bar: 0, karte: 0 }), [orders]);

  const productVolume = useMemo(() => {
    const volumeMap: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        volumeMap[item.name] = (volumeMap[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(volumeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#fb7185', '#2dd4bf'];

  return (
    <div className="px-6 pb-20">
      <div className="flex flex-col mb-8 mt-4">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Event-Bericht</h1>
        <p className="text-slate-500 font-medium">Aktueller Stand: {settings.activeEvent}</p>
      </div>

      <div className="space-y-4">
        <StatCard icon={<DollarSign size={20} />} iconBg="bg-amber-100 text-amber-600" label="Umsatz Event" value={`${stats.revenue.toFixed(2)} €`} subtitle="Ohne Gratis-Buchungen" />
        <StatCard icon={<Gift size={20} />} iconBg="bg-slate-100 text-slate-500" label="Gratis-Ausgaben" value={`${stats.gratis.toFixed(2)} €`} />
        
        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mt-6">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px]">Zahlungsarten</h3>
          <div className="space-y-4">
            <PaymentRow label="Bargeld" value={stats.bar} total={stats.revenue} color="bg-amber-500" />
            <PaymentRow label="Karte" value={stats.karte} total={stats.revenue} color="bg-blue-500" />
          </div>
        </div>

        {/* Product Volume Charts */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mt-6">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center gap-2">
            <PieIcon size={14} /> Verkaufte Mengen
          </h3>
          
          <div className="h-64 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productVolume}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productVolume.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} 
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {productVolume.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl">{item.value}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{icon: any, iconBg: string, label: string, value: string, subtitle?: string}> = ({icon, iconBg, label, value, subtitle}) => (
  <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${iconBg}`}>{icon}</div>
    <div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-bold">{subtitle}</p>}
    </div>
  </div>
);

const PaymentRow: React.FC<{label: string, value: number, total: number, color: string}> = ({label, value, total, color}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm font-black text-slate-700">
      <span>{label}</span>
      <span>{value.toFixed(2)} €</span>
    </div>
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: total > 0 ? `${(value/total)*100}%` : '0%' }}></div>
    </div>
  </div>
);

export default POSBerichte;
