
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Order, ArchivedEvent } from '../../types';
import { Trash2, CreditCard, Banknote, Calculator, Gift, Edit3, ChevronDown, Calendar, FileText, Info, Lock, Package, UtensilsCrossed, X, AlertCircle } from 'lucide-react';

const POSVerlauf: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [archive, setArchive] = useState<ArchivedEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Storno State
  const [showPasscodeModal, setShowPasscodeModal] = useState<string | 'all' | null>(null);
  const [showReasonModal, setShowReasonModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  
  const [passcodeInput, setPasscodeInput] = useState('');
  const [error, setError] = useState(false);
  const [settings, setSettings] = useState(() => storage.getSettings());

  useEffect(() => {
    const handleSettingsChange = (e: any) => setSettings(e.detail);
    window.addEventListener('c2-settings-changed', handleSettingsChange);
    loadOrders();
    return () => window.removeEventListener('c2-settings-changed', handleSettingsChange);
  }, []);

  const loadOrders = () => {
    setOrders(storage.getOrders().reverse());
    setArchive(storage.getArchive());
  };

  const confirmPasscode = () => {
    if (passcodeInput === settings.passcode) {
      if (showPasscodeModal === 'all') { 
        storage.clearOrders(); 
        loadOrders();
        setShowPasscodeModal(null);
      } else if (typeof showPasscodeModal === 'string') { 
        // Start Reason Workflow
        setShowReasonModal(showPasscodeModal);
        setShowPasscodeModal(null);
      }
      setPasscodeInput('');
      setError(false);
    } else { 
      setError(true); 
      setPasscodeInput(''); 
      setTimeout(() => setError(false), 500); 
    }
  };

  const finalizeCancellation = () => {
    const orderId = showReasonModal;
    if (!orderId || !cancelReason) return;

    const reason = cancelReason === 'SONSTIGES' ? customReason : cancelReason;
    const orders = storage.getOrders();
    const orderToCancel = orders.find(o => o.id === orderId);

    if (orderToCancel) {
      const updatedOrder: Order = {
        ...orderToCancel,
        cancelled: true,
        cancel_reason: reason,
        cancel_timestamp: new Date().toISOString()
      };

      // Bestandsrückführung
      if (settings.activeInventory) {
        const updatedInventory = { ...settings.activeInventory };
        orderToCancel.items.forEach(item => {
          if (updatedInventory[item.productId]) {
            updatedInventory[item.productId] = {
              ...updatedInventory[item.productId],
              current: updatedInventory[item.productId].current + item.quantity
            };
          }
        });
        storage.updateSettings({ activeInventory: updatedInventory });
      }

      storage.updateOrder(updatedOrder);
      loadOrders();
    }

    setShowReasonModal(null);
    setCancelReason(null);
    setCustomReason('');
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const badgeBase = "px-2 py-0.5 rounded-md text-[7px] font-black uppercase italic tracking-[0.1em] border flex items-center gap-1";

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

      <div className="space-y-4 mb-12">
        {orders.length === 0 ? (
           <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-slate-300 text-slate-400 font-bold text-sm italic">
             Noch keine Buchungen vorhanden.
           </div>
        ) : (
          orders.map(order => {
            const getPaymentBadge = () => {
              if (order.paymentMethod === 'Gratis') {
                return <div className={`${badgeBase} bg-purple-50 text-purple-700 border-purple-200`}><Gift size={10} /> Gratis</div>;
              }
              if (order.paymentMethod === 'Karte') {
                return <div className={`${badgeBase} bg-amber-50 text-amber-700 border-amber-200`}><CreditCard size={10} /> Karte</div>;
              }
              return <div className={`${badgeBase} bg-slate-50 text-slate-700 border-slate-200`}><Banknote size={10} /> Bar</div>;
            };

            const taxBadge = order.tax_type === 'togo' ? (
              <div className={`${badgeBase} bg-emerald-50 text-emerald-700 border-emerald-200`}><Package size={10} /> ToGo</div>
            ) : (
              <div className={`${badgeBase} bg-orange-50 text-orange-700 border-orange-200`}><UtensilsCrossed size={10} /> Vor Ort</div>
            );

            const glowStyle = order.cancelled 
              ? 'border-slate-200 grayscale opacity-60' 
              : order.tax_type === 'togo' 
                ? 'border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : 'border-orange-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]';

            return (
              <div key={order.id} className={`bg-white px-5 py-4 rounded-[1.5rem] border-2 flex items-center justify-between gap-4 transition-all ${glowStyle}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-lg font-black italic tracking-tighter ${order.cancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      #{order.orderNumber}
                    </span>
                    {getPaymentBadge()}
                    {taxBadge}
                    {order.cancelled && (
                      <div className="bg-red-50 text-red-600 border-red-100 px-2 py-0.5 rounded-md text-[7px] font-black uppercase italic tracking-widest border">
                        STORNO: {order.cancel_reason}
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] font-bold truncate uppercase tracking-widest ${order.cancelled ? 'text-slate-300' : 'text-slate-500'}`}>
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-lg font-black italic tracking-tight ${order.cancelled ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                    {order.total.toFixed(2)} €
                  </span>
                  {!order.cancelled && (
                    <button onClick={() => setShowPasscodeModal(order.id)} className="p-2.5 text-slate-300 active:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
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
        ) : (archive.map(event => (
          <div key={event.id} className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => toggleExpand(event.id)} className="w-full p-6 flex justify-between items-center text-left">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-amber-600">
                  <Calendar size={12} /><span className="text-[9px] font-black uppercase tracking-widest italic">{new Date(event.startDate).toLocaleDateString('de-DE')}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter leading-tight">{event.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5">Umsatz</p>
                   <p className="text-xl font-black text-slate-800 italic tracking-tight">{(event.totalRevenue || 0).toFixed(2)} €</p>
                </div>
                <div className={`p-2 bg-slate-100 text-slate-400 rounded-xl transition-transform duration-300 ${expandedId === event.id ? 'rotate-180' : ''}`}><ChevronDown size={20} /></div>
              </div>
            </button>
            {expandedId === event.id && (
              <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4">
                <button onClick={() => navigate(`/pos/print/${event.id}`)} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase italic tracking-[0.2em] shadow-lg shadow-slate-200">
                  <FileText size={16} /> PDF Export
                </button>
              </div>
            )}
          </div>
        )))}
      </div>

      {/* PASSCODE MODAL */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className={`bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl transition-all ${error ? 'animate-shake' : ''}`}>
             <div className="flex flex-col items-center mb-6">
               <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-600 mb-4"><Lock size={32} /></div>
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Autorisierung</h2>
             </div>
             <input type="password" inputMode="numeric" placeholder="••••" value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black text-center text-3xl mb-6 tracking-[0.5em] focus:ring-2 focus:ring-amber-500 outline-none" autoFocus />
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setShowPasscodeModal(null); setPasscodeInput(''); setError(false); }} className="py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Abbruch</button>
                <button onClick={confirmPasscode} className="py-4 bg-slate-800 rounded-xl font-black text-white shadow-lg active:scale-95 uppercase tracking-widest text-[10px]">Bestätigen</button>
             </div>
          </div>
        </div>
      )}

      {/* REASON MODAL */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-slate-800 uppercase italic">Grund der Storno</h2>
               <button onClick={() => setShowReasonModal(null)} className="text-slate-300"><X size={24}/></button>
             </div>
             
             <div className="space-y-2 mb-6">
                {['FEHLBUCHUNG', 'REKLAMATION', 'RETOURE', 'BRUCH', 'SONSTIGES'].map(reason => (
                  <button 
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full py-4 px-6 rounded-2xl font-black italic uppercase tracking-widest text-[10px] text-left border-2 transition-all ${cancelReason === reason ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-50 active:bg-slate-100'}`}
                  >
                    {reason}
                  </button>
                ))}
             </div>

             {cancelReason === 'SONSTIGES' && (
                <textarea 
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Grund eingeben..."
                  maxLength={100}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 mb-6 h-24"
                />
             )}

             <button 
                disabled={!cancelReason || (cancelReason === 'SONSTIGES' && !customReason.trim())}
                onClick={finalizeCancellation}
                className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 disabled:opacity-30 uppercase italic tracking-widest text-[10px]"
             >
                BESTÄTIGEN
             </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default POSVerlauf;
