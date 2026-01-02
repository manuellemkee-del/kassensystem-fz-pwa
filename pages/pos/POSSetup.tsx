
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Product, Category, ArchivedEvent, InventoryItem } from '../../types';
import { Edit2, Trash2, Shield, Eye, EyeOff, LogOut, AlertTriangle, X, Plus, Package, Save, Boxes, PlusCircle } from 'lucide-react';
import { CATEGORIES } from '../../constants';

const POSSetup: React.FC = () => {
  const navigate = useNavigate();
  const [products] = useState<Product[]>(() => storage.getProducts());
  const [settings, setSettings] = useState(() => storage.getSettings());
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'start' | 'refill'>('start');
  const [inventoryForm, setInventoryForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleSettingsChange = (e: any) => setSettings(e.detail);
    window.addEventListener('c2-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('c2-settings-changed', handleSettingsChange);
  }, []);

  const handleUpdatePasscode = (newCode: string) => {
    storage.updateSettings({ passcode: newCode });
  };

  const saveInventory = () => {
    const updatedInventory = { ...(settings.activeInventory || {}) };
    const newRefillItems: Record<string, number> = {};

    products.forEach(p => {
      const val = parseInt(inventoryForm[p.id]) || 0;
      if (inventoryTab === 'start') {
        updatedInventory[p.id] = { start: val, current: val };
      } else {
        if (val > 0) {
          updatedInventory[p.id] = {
            start: (updatedInventory[p.id]?.start || 0) + val,
            current: (updatedInventory[p.id]?.current || 0) + val
          };
          newRefillItems[p.id] = val;
        }
      }
    });

    const newRefills = [...(settings.activeRefills || [])];
    if (inventoryTab === 'refill' && Object.keys(newRefillItems).length > 0) {
      newRefills.push({ timestamp: new Date().toISOString(), items: newRefillItems });
    }

    storage.updateSettings({ activeInventory: updatedInventory, activeRefills: newRefills });
    setShowInventoryModal(false);
    setInventoryForm({});
  };

  const handleEventClose = () => {
    const orders = storage.getOrders();
    const archivedEvent: ArchivedEvent = {
      id: `2026-${String(settings.eventSequence).padStart(4, '0')}`,
      name: settings.activeEvent || 'Unbekanntes Event',
      startDate: settings.activeEventStart || new Date().toISOString(),
      endDate: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      initialBalance: settings.activeEventInitialBalance,
      totalRevenue: orders.filter(o => !o.cancelled).reduce((sum, o) => sum + o.total, 0),
      orders: orders,
      tips: settings.activeTips || [],
      inventory: settings.activeInventory,
      refills: settings.activeRefills
    };
    storage.archiveEvent(archivedEvent);
    storage.clearOrders();
    storage.updateSettings({ 
      activeEvent: null, 
      activeInventory: {}, 
      activeRefills: [], 
      activeTips: [],
      nextOrderNumber: 1, 
      eventSequence: settings.eventSequence + 1 
    });
    navigate('/pos');
  };

  const hasInventory = settings.activeInventory && Object.keys(settings.activeInventory).length > 0;

  return (
    <div className="px-6 pb-24">
      <div className="flex flex-col mb-8 mt-4">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase leading-none">System</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Event & Einstellungen</p>
      </div>

      <div className={`${settings.activeEvent ? 'bg-slate-900 shadow-slate-200' : 'bg-slate-100'} p-8 rounded-[2.5rem] shadow-2xl mb-6 relative overflow-hidden transition-all duration-500 border border-black/5`}>
        <div className="relative z-10">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic block mb-2 ${settings.activeEvent ? 'text-amber-500' : 'text-slate-400'}`}>Event-Management</span>
          <h2 className={`text-2xl font-black mb-6 italic uppercase tracking-tight ${settings.activeEvent ? 'text-white' : 'text-slate-400'}`}>
            {settings.activeEvent || 'Kein Event aktiv'}
          </h2>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                setInventoryTab(hasInventory ? 'refill' : 'start');
                setShowInventoryModal(true);
              }}
              disabled={!settings.activeEvent}
              className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase italic tracking-widest text-[10px] shadow-xl ${settings.activeEvent ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}
            >
              <Boxes size={18} /> {hasInventory ? 'BESTAND AUFSTOCKEN' : 'BESTAND VERWALTEN'}
            </button>
            <button onClick={() => setIsConfirmingClose(true)} disabled={!settings.activeEvent} className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase italic tracking-widest text-[10px] shadow-xl ${settings.activeEvent ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-400'}`}>
              <LogOut size={18} /> ABSCHLUSS DES EVENTS
            </button>
          </div>
        </div>
      </div>

      {/* INVENTORY MODAL */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">Bestand für {settings.activeEvent}</h2>
              <button onClick={() => setShowInventoryModal(false)} className="p-2 text-slate-300"><X size={28}/></button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button onClick={() => setInventoryTab('start')} className={`flex-1 py-3 font-black text-[9px] uppercase italic tracking-widest rounded-xl transition-all ${inventoryTab === 'start' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>START-BESTAND</button>
              <button onClick={() => setInventoryTab('refill')} className={`flex-1 py-3 font-black text-[9px] uppercase italic tracking-widest rounded-xl transition-all ${inventoryTab === 'refill' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>AUFSTOCKEN</button>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 italic">
              {inventoryTab === 'start' ? 'Trage ein, wie viele Einheiten du zum Event mitnimmst' : 'Zusätzliche Mengen hinzufügen'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: p.color}} />
                    <span className="font-black italic uppercase text-xs text-slate-800">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {inventoryTab === 'refill' && (
                      <span className="text-[10px] font-black text-slate-400 italic">({settings.activeInventory?.[p.id]?.current || 0}) +</span>
                    )}
                    <input 
                      type="number" 
                      placeholder="0"
                      value={inventoryForm[p.id] || ''}
                      onChange={e => setInventoryForm({...inventoryForm, [p.id]: e.target.value})}
                      className="w-20 bg-white border border-slate-200 p-3 rounded-xl font-black text-center text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={saveInventory} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all uppercase italic tracking-widest text-[10px]">
              <Save size={18} /> {inventoryTab === 'start' ? 'START-BESTAND SPEICHERN' : 'AUFSTOCKUNG SPEICHERN'}
            </button>
          </div>
        </div>
      )}

      {/* SAFETY & PASSCODE */}
      <div className="bg-white p-6 rounded-[2rem] border border-white/40 shadow-sm mb-8">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase italic tracking-tight"><Shield size={18} className="text-amber-500" /> Sicherheit</h3>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Storno-Code</label>
        <input type="password" value={settings.passcode} onChange={e => handleUpdatePasscode(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-lg tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      {isConfirmingClose && (
        <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 mb-6"><AlertTriangle size={32} /></div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase mb-2">Event beenden?</h2>
            <p className="text-slate-500 font-medium mb-8">Möchtest du <span className="text-slate-900 font-black">"{settings.activeEvent}"</span> wirklich abschließen? Alle Daten werden archiviert.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsConfirmingClose(false)} className="py-5 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase italic tracking-widest text-[10px]">Abbruch</button>
              <button onClick={handleEventClose} className="py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase italic tracking-widest text-[10px]">Abschliessen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSSetup;
