
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { CashCount } from '../../types';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const POSKassensturz: React.FC = () => {
  const navigate = useNavigate();
  const settings = storage.getSettings();
  const orders = storage.getOrders();
  
  const [counts, setCounts] = useState<CashCount>({
    '100_note': 0, '50_note': 0, '20_note': 0, '10_note': 0, '5_note': 0,
    '2_coin': 0, '1_coin': 0, '50_cent': 0, '20_cent': 0, '10_cent': 0, '5_cent': 0
  });

  const barRevenue = orders.filter(o => o.paymentMethod === 'Bar').reduce((sum, o) => sum + o.total, 0);
  const expectedTotal = settings.activeEventInitialBalance + barRevenue;

  const actualTotal = 
    counts['100_note'] * 100 + counts['50_note'] * 50 + counts['20_note'] * 20 + counts['10_note'] * 10 + counts['5_note'] * 5 +
    counts['2_coin'] * 2 + counts['1_coin'] * 1 + counts['50_cent'] * 0.5 + counts['20_cent'] * 0.2 + 
    counts['10_cent'] * 0.1 + counts['5_cent'] * 0.05;

  const difference = actualTotal - expectedTotal;

  const handleUpdate = (key: keyof CashCount, val: string) => {
    setCounts(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  return (
    <div className="px-6 pb-20">
      <div className="flex items-center gap-4 mb-8 mt-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm"><ArrowLeft size={24} /></button>
        <h1 className="text-3xl font-black text-slate-800">Kassensturz</h1>
      </div>

      <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-xl mb-8 text-white">
        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">SOLL-WERTE</h3>
        <div className="flex justify-between items-center mb-2"><span>Anfangsbestand:</span><span>{settings.activeEventInitialBalance.toFixed(2)} €</span></div>
        <div className="flex justify-between items-center mb-4"><span>Bar-Einnahmen:</span><span>{barRevenue.toFixed(2)} €</span></div>
        <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xl font-black">
          <span>Gesamt-Soll:</span><span>{expectedTotal.toFixed(2)} €</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-white/40 shadow-sm mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">GELD ZÄHLEN</h3>
        <div className="space-y-4">
          <DenomRow label="100 € Scheine" val={counts['100_note']} onChange={v => handleUpdate('100_note', v)} />
          <DenomRow label="50 € Scheine" val={counts['50_note']} onChange={v => handleUpdate('50_note', v)} />
          <DenomRow label="20 € Scheine" val={counts['20_note']} onChange={v => handleUpdate('20_note', v)} />
          <DenomRow label="10 € Scheine" val={counts['10_note']} onChange={v => handleUpdate('10_note', v)} />
          <DenomRow label="5 € Scheine" val={counts['5_note']} onChange={v => handleUpdate('5_note', v)} />
          <DenomRow label="2 € Münzen" val={counts['2_coin']} onChange={v => handleUpdate('2_coin', v)} />
          <DenomRow label="1 € Münzen" val={counts['1_coin']} onChange={v => handleUpdate('1_coin', v)} />
          <DenomRow label="50 Cent" val={counts['50_cent']} onChange={v => handleUpdate('50_cent', v)} />
          <DenomRow label="20 Cent" val={counts['20_cent']} onChange={v => handleUpdate('20_cent', v)} />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-white/40 shadow-sm mb-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">ERGEBNIS</h3>
        <div className="flex justify-between items-center mb-2 text-slate-500"><span>Ist-Stand (gezählt):</span><span>{actualTotal.toFixed(2)} €</span></div>
        <div className="flex justify-between items-center mb-4 text-slate-500"><span>Soll-Stand:</span><span>{expectedTotal.toFixed(2)} €</span></div>
        <div className="border-t border-slate-50 pt-6 flex justify-between items-center">
          <span className="text-xl font-black text-slate-800">Differenz:</span>
          <div className={`flex items-center gap-2 text-2xl font-black ${difference === 0 ? 'text-emerald-500' : difference > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {difference === 0 ? <CheckCircle size={24} /> : difference < 0 ? <AlertCircle size={24} /> : null}
            {difference > 0 ? '+' : ''}{difference.toFixed(2)} €
          </div>
        </div>
      </div>

      <button onClick={() => navigate(-1)} className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all">SPEICHERN</button>
    </div>
  );
};

const DenomRow: React.FC<{label: string, val: number, onChange: (v: string) => void}> = ({label, val, onChange}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-slate-600">{label}</span>
    <input type="number" value={val} onChange={e => onChange(e.target.value)} className="w-20 bg-slate-50 border border-slate-100 p-2 rounded-xl text-center font-black" />
  </div>
);

export default POSKassensturz;
