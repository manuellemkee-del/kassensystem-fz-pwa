
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Order, ArchivedEvent } from '../../types';
import { Trash2, CreditCard, Banknote, Calculator, Gift, Edit3, ChevronDown, Calendar, FileText, Info, Lock } from 'lucide-react';

const POSVerlauf: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [archive, setArchive] = useState<ArchivedEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPasscodeModal, setShowPasscodeModal] = useState<string | 'all' | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [error, setError] = useState(false);
  const settings = storage.getSettings();

  useEffect(() => {
    setOrders(storage.getOrders().reverse());
    setArchive(storage.getArchive());
  }, []);

  const confirmPasscode = () => {
    if (passcodeInput === settings.passcode) {
      if (showPasscodeModal === 'all') { 
        storage.clearOrders(); 
        setOrders([]); 
      } else if (typeof showPasscodeModal === 'string') { 
        storage.deleteOrder(showPasscodeModal); 
        setOrders(storage.getOrders().reverse()); 
      }
      setShowPasscodeModal(null); 
      setPasscodeInput('');
      setError(false);
    } else { 
      setError(true); 
      setPasscodeInput(''); 
      setTimeout(() => setError(false), 500); 
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const badgeBase = "px-2.5 py-1 rounded-md text-[8px] font-black uppercase italic tracking-[0.15em] border flex items-center gap-1.5";

  return (
    <div className="px-6 pb-24">
      <div className="flex flex-col mb-6 mt-4">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Verlauf</h1>
        <p className="text-slate-500 font-medium">Aktuelle Schicht</p>
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={() => navigate('/pos/kassensturz')} className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all italic uppercase tracking-widest text-[10px]">
          <Calculator size={18} /> Kassensturz
        </button>
        <button onClick={() => setShowPasscodeModal('all')} className="flex-1 bg-white text-slate-400 font-black py-4 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 active:scale-95 transition-all text-[10px] italic uppercase tracking-widest">
          <Trash2 size={16} /> Reset
        </button>
      </div>

      <div className="space-y-3 mb-12">
        {orders.length === 0 ? (
           <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-slate-300 text-slate-400 font-bold text-sm italic">
             Noch keine Buchungen vorhanden.
           </div>
        ) : (
          orders.map(order => {
            const isReduced = order.items.some(i => i.isOverridden);
            
            const getPaymentBadge = () => {
              if (order.paymentMethod === 'Gratis') {
                return <div className={`${badgeBase} bg-purple-50 text-purple-700 border-purple-200`}><Gift size={10} /> Gratis</div>;
              }
              if (order.paymentMethod === 'Karte') {
                return <div className={`${badgeBase} bg-amber-50 text-amber-700 border-amber-200`}><CreditCard size={10} /> Karte</div>;
              }
              return <div className={`${badgeBase} bg-slate-50 text-slate-700 border-slate-200`}><Banknote size={10} /> Bar</div>;
            };

            return (
              <div key={order.id} className="bg-white px-5 py-4 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center justify-between gap-4 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-lg font-black text-slate-800 italic tracking-tighter">#{order.orderNumber}</span>
                    {getPaymentBadge()}
                    {isReduced && (
                      <div className={`${badgeBase} bg-sky-50 text-sky-700 border-sky-200`}>
                        <Edit3 size={10} /> Reduziert
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-widest">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {isReduced && <Edit3 size={14} className="text-sky-400" />}
                    <span className="text-lg font-black text-slate-800 italic tracking-tight">
                      {order.total.toFixed(2)} €
                    </span>
                  </div>
                  <button onClick={() => setShowPasscodeModal(order.id)} className="p-2.5 text-slate-300 active:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 mb-6">
        <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">Archivierte Events</h2>
      </div>

      <div className="space-y-4">
        {archive.length === 0 ? (
          <div className="text-center py-10 bg-slate-200/50 rounded-3xl text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
            Keine abgeschlossenen Events
          </div>
        ) : (
          archive.map(event => {
            const isExpanded = expandedId === event.id;
            const barRevenue = event.orders?.filter(o => o.paymentMethod === 'Bar').reduce((s, o) => s + o.total, 0) || 0;
            const cardRevenue = event.orders?.filter(o => o.paymentMethod === 'Karte').reduce((s, o) => s + o.total, 0) || 0;

            return (
              <div key={event.id} className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleExpand(event.id)}
                  className="w-full p-6 flex justify-between items-center text-left active:bg-slate-100"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Calendar size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">{new Date(event.startDate).toLocaleDateString('de-DE')}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter leading-tight">{event.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5">Umsatz</p>
                       <p className="text-xl font-black text-slate-800 italic tracking-tight">{(event.totalRevenue || 0).toFixed(2)} €</p>
                    </div>
                    <div className={`p-2 bg-slate-100 text-slate-400 rounded-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Banknote size={14} className="text-slate-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest italic text-slate-500">Bar</span>
                        </div>
                        <p className="text-lg font-black text-slate-900 italic">{barRevenue.toFixed(2)} €</p>
                      </div>
                      <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CreditCard size={14} className="text-slate-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest italic text-slate-500">Karte</span>
                        </div>
                        <p className="text-lg font-black text-slate-900 italic">{cardRevenue.toFixed(2)} €</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 px-2">
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Anfangsbestand</span>
                         <span className="font-bold text-slate-700 text-sm">{(event.initialBalance || 0).toFixed(2)} €</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Anzahl Bons</span>
                         <span className="font-bold text-slate-700 text-sm">{event.orders?.length || 0}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Abgeschlossen</span>
                         <span className="font-bold text-slate-700 text-sm">{event.closedAt ? new Date(event.closedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                       <button 
                         onClick={() => navigate(`/pos/print/${event.id}`)}
                         className="bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase italic tracking-[0.2em] shadow-lg shadow-slate-200"
                       >
                         <FileText size={16} /> PDF Export
                       </button>
                       <button 
                         className="bg-slate-100 text-slate-500 font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase italic tracking-[0.2em]"
                       >
                         <Info size={16} /> Details
                       </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showPasscodeModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className={`bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl transition-all ${error ? 'animate-shake' : ''}`}>
             <div className="flex flex-col items-center mb-6">
               <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-600 mb-4">
                 <Lock size={32} />
               </div>
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Storno-Code</h2>
             </div>
             <input 
              type="password" 
              inputMode="numeric" 
              placeholder="••••" 
              value={passcodeInput} 
              onChange={e => setPasscodeInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black text-center text-3xl mb-6 tracking-[0.5em] focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 placeholder:text-slate-200" 
              autoFocus 
             />
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setShowPasscodeModal(null); setPasscodeInput(''); setError(false); }} className="py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Abbruch</button>
                <button onClick={confirmPasscode} className="py-4 bg-slate-800 rounded-xl font-black text-white shadow-lg active:scale-95 uppercase tracking-widest text-[10px]">Bestätigen</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default POSVerlauf;
