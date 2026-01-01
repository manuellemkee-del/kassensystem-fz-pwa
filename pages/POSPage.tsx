
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, BarChart3, History, Settings } from 'lucide-react';
import POSKasse from './pos/POSKasse';
import POSBerichte from './pos/POSBerichte';
import POSVerlauf from './pos/POSVerlauf';
import POSSetup from './pos/POSSetup';
import POSKassensturz from './pos/POSKassensturz';
import POSPrintView from './pos/POSPrintView';
import { storage } from '../services/storage';

const POSPage: React.FC = () => {
  const location = useLocation();
  const [settings, setSettings] = useState(() => storage.getSettings());

  useEffect(() => {
    const handleSettingsChange = (e: any) => {
      setSettings(e.detail);
    };
    window.addEventListener('c2-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('c2-settings-changed', handleSettingsChange);
  }, []);

  const isPrintView = location.pathname.includes('/print');

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isPrintView ? 'bg-white' : 'bg-slate-50/50'}`}>
      {!isPrintView && (
        <header className="px-6 pt-6 pb-2 flex justify-between items-center z-20">
          <div className="flex flex-col">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 italic ${settings.activeEvent ? 'text-emerald-600' : 'text-slate-400'}`}>
              {settings.activeEvent ? 'Event aktiv' : 'Standby'}
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-800 truncate max-w-[200px] italic uppercase tracking-tighter leading-tight">
                Kassensystem FZ
              </span>
              <span className="text-[10px] font-black italic text-amber-500 lowercase tracking-tight -mt-0.5">
                powered by C2
              </span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center font-black text-amber-500 text-sm shadow-sm">C2</div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto ${isPrintView ? '' : 'pb-32'}`}>
        <Routes>
          <Route index element={<POSKasse />} />
          <Route path="berichte" element={<POSBerichte />} />
          <Route path="verlauf" element={<POSVerlauf />} />
          <Route path="setup" element={<POSSetup />} />
          <Route path="kassensturz" element={<POSKassensturz />} />
          <Route path="print/:id" element={<POSPrintView />} />
        </Routes>
      </main>

      {!isPrintView && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-slate-700/50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-50">
          <div className="max-w-md mx-auto flex justify-around items-center h-20 px-4">
            <NavItem to="/pos" end icon={<LayoutGrid size={22} />} label="Kasse" />
            <NavItem to="/pos/berichte" icon={<BarChart3 size={22} />} label="Berichte" />
            <NavItem to="/pos/verlauf" icon={<History size={22} />} label="Verlauf" />
            <NavItem to="/pos/setup" icon={<Settings size={22} />} label="System" />
          </div>
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{to: string, icon: React.ReactNode, label: string, end?: boolean}> = ({ to, icon, label, end }) => {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
  
  return (
    <NavLink
      to={to}
      end={end}
      className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${isActive ? 'text-amber-400 translate-y-[-4px]' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`mb-1.5 p-2 rounded-xl transition-colors ${isActive ? 'bg-amber-400/10' : ''}`}>{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-[0.1em] italic">{label}</span>
    </NavLink>
  );
};

export default POSPage;
