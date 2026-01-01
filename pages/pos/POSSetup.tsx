
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Product, Category, ArchivedEvent } from '../../types';
import { Edit2, Trash2, Shield, Eye, EyeOff, LogOut, AlertTriangle, X } from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../constants';

const POSSetup: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [settings, setSettings] = useState(() => storage.getSettings());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  useEffect(() => {
    const handleSettingsChange = (e: any) => setSettings(e.detail);
    window.addEventListener('c2-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('c2-settings-changed', handleSettingsChange);
  }, []);

  const handleUpdatePasscode = (newCode: string) => {
    const newSettings = { ...settings, passcode: newCode };
    setSettings(newSettings);
    storage.updateSettings(newSettings);
  };

  const handleEventClose = () => {
    try {
      const orders = storage.getOrders();
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      
      // Neues Format: 2026-XXXX
      const seqStr = String(settings.eventSequence).padStart(4, '0');
      const eventId = `2026-${seqStr}`;

      const archivedEvent: ArchivedEvent = {
        id: eventId,
        name: settings.activeEvent || 'Unbenanntes Event',
        startDate: settings.activeEventStart || new Date().toISOString(),
        endDate: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        initialBalance: settings.activeEventInitialBalance,
        totalRevenue: totalRevenue,
        orders: orders
      };

      storage.archiveEvent(archivedEvent);
      storage.clearOrders();
      storage.updateSettings({
        activeEvent: null,
        activeEventStart: null,
        activeEventInitialBalance: 0,
        nextOrderNumber: 1,
        eventSequence: settings.eventSequence + 1
      });

      navigate('/pos');
    } catch (err) {
      console.error("Fehler beim Event-Abschluss:", err);
      alert("Fehler beim Speichern des Archivs.");
    }
  };

  return (
    <div className="px-6 pb-24">
      <div className="flex flex-col mb-8 mt-4">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">System</h1>
        <p className="text-slate-500 font-medium">Event & Einstellungen</p>
      </div>

      <div className={`${settings.activeEvent ? 'bg-slate-900' : 'bg-slate-100'} p-8 rounded-[2.5rem] shadow-2xl mb-6 relative overflow-hidden transition-colors duration-500`}>
        <div className="relative z-10">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic block mb-2 ${settings.activeEvent ? 'text-amber-500' : 'text-slate-400'}`}>
            Event-Management
          </span>
          <h2 className={`text-2xl font-black mb-6 italic uppercase tracking-tight ${settings.activeEvent ? 'text-white' : 'text-slate-400'}`}>
            {settings.activeEvent || 'Kein Event aktiv'}
          </h2>
          <button 
            onClick={() => setIsConfirmingClose(true)}
            disabled={!settings.activeEvent}
            className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase italic tracking-widest text-xs shadow-xl ${settings.activeEvent ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-400'}`}
          >
            <LogOut size={18} /> Abschluss des Events
          </button>
        </div>
        <div className={`absolute -right-8 -bottom-8 rotate-12 ${settings.activeEvent ? 'text-white/5' : 'text-slate-200/20'}`}>
          <LogOut size={160} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-white/40 shadow-sm mb-8">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase italic tracking-tight">
          <Shield size={18} className="text-amber-500" /> Sicherheit
        </h3>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Storno-Code</label>
        <div className="relative">
          <input 
            type={showPasscode ? "text" : "password"} 
            value={settings.passcode} 
            onChange={(e) => handleUpdatePasscode(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-lg tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" 
          />
          <button onClick={() => setShowPasscode(!showPasscode)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" type="button">
            {showPasscode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      
      {isConfirmingClose && (
        <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600">
                <AlertTriangle size={32} />
              </div>
              <button onClick={() => setIsConfirmingClose(false)} className="p-2 text-slate-300">
                <X size={28} />
              </button>
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase mb-2">Event beenden?</h2>
            <p className="text-slate-500 font-medium mb-8">
              Möchtest du <span className="text-slate-900 font-black">"{settings.activeEvent}"</span> wirklich abschließen? Alle Daten werden archiviert.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsConfirmingClose(false)} className="py-5 bg-slate-50 text-slate-400 font-black rounded-2xl active:scale-95 transition-all uppercase italic tracking-widest text-[10px]">Abbruch</button>
              <button onClick={handleEventClose} className="py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase italic tracking-widest text-[10px]">Abschliessen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSSetup;
