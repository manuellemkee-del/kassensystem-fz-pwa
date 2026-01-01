
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, X, CheckCircle2, Trash2, Gift, Edit3, Coins, Lock, Calculator } from 'lucide-react';
import { storage } from '../../services/storage';
import { Product, Category, CartItem, Order } from '../../types';
import { CATEGORIES } from '../../constants';

const POSKasse: React.FC = () => {
  const [settings, setSettings] = useState(() => storage.getSettings());
  const [products] = useState<Product[]>(() => storage.getProducts());
  const [activeCategory, setActiveCategory] = useState<Category>('Alle');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  
  const [eventNameInput, setEventNameInput] = useState('');
  const [initialBalanceInput, setInitialBalanceInput] = useState('0');
  const [setupStep, setSetupStep] = useState(1);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showPasscodeForPrice, setShowPasscodeForPrice] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    const handleSettingsChange = (e: any) => setSettings(e.detail);
    window.addEventListener('c2-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('c2-settings-changed', handleSettingsChange);
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Alle') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const speak = (text: string) => {
    if (settings.voiceEnabled && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupStep === 1 && eventNameInput.trim()) {
      setSetupStep(2);
      return;
    }
    const balance = parseFloat(initialBalanceInput) || 0;
    storage.updateSettings({ 
      activeEvent: eventNameInput.trim(),
      activeEventStart: new Date().toISOString(),
      activeEventInitialBalance: balance,
      nextOrderNumber: 1
    });
    setSetupStep(1);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && !item.isOverridden);
      if (existing) {
        return prev.map(item => 
          (item.productId === product.id && !item.isOverridden) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    speak(product.name);
  };

  const verifyPasscode = () => {
    if (passcodeInput === settings.passcode) {
      setShowPasscodeForPrice(false);
      setPasscodeInput('');
      setPasscodeError(false);
      const item = cart.find(i => i.productId === editingItemId);
      if (item) setNewPriceInput(item.price.toString());
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
      setTimeout(() => setPasscodeError(false), 500);
    }
  };

  const applyNewPrice = () => {
    const price = parseFloat(newPriceInput);
    if (!isNaN(price) && editingItemId) {
      setCart(prev => prev.map(item => {
        if (item.productId === editingItemId) {
          return {
            ...item,
            price: price,
            originalPrice: item.originalPrice || item.price,
            isOverridden: true
          };
        }
        return item;
      }));
      setEditingItemId(null);
      setNewPriceInput('');
    }
  };

  const handleCheckout = (method: 'Bar' | 'Karte' | 'Gratis') => {
    if (cart.length === 0 || !settings.activeEvent) return;
    const finalTotal = method === 'Gratis' ? 0 : total;
    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: settings.nextOrderNumber,
      timestamp: new Date().toISOString(),
      items: [...cart],
      total: finalTotal,
      paymentMethod: method,
      eventName: settings.activeEvent
    };
    storage.saveOrder(newOrder);
    storage.updateSettings({ nextOrderNumber: settings.nextOrderNumber + 1 });
    speak(method === 'Gratis' ? 'Gratis gebucht' : `${finalTotal.toFixed(2)} Euro ${method}.`);
    setCart([]);
    setIsCartOpen(false);
    setShowCheckoutSuccess(true);
    setTimeout(() => setShowCheckoutSuccess(false), 2000);
  };

  if (!settings.activeEvent) {
    return (
      <div className="p-6 h-full flex items-center justify-center animate-in fade-in duration-500">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50">
          {setupStep === 1 ? (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-4">
                  <Calculator size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Kassensystem FZ</h1>
                <p className="text-amber-500 font-black mt-1 uppercase text-[10px] tracking-widest italic">powered by C2</p>
                <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest italic">Bereit für ein neues Event?</p>
              </div>
              <form onSubmit={handleStartEvent} className="space-y-6">
                <input 
                  type="text" 
                  placeholder="NAME DES EVENTS"
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg text-center uppercase tracking-widest"
                  autoFocus
                />
                <button type="submit" disabled={!eventNameInput.trim()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 disabled:opacity-50 uppercase italic tracking-widest text-[10px]">WEITER</button>
              </form>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-4">
                  <Coins size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Kasse</h1>
                <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest italic">Anfangsbestand eingeben</p>
              </div>
              <form onSubmit={handleStartEvent} className="space-y-6">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 italic">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={initialBalanceInput}
                    onChange={(e) => setInitialBalanceInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl font-black text-slate-800 text-4xl text-center pl-12 focus:ring-2 focus:ring-amber-500 outline-none"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <button type="submit" className="w-full bg-amber-500 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 uppercase italic tracking-widest text-[10px]">EVENT STARTEN</button>
                <button type="button" onClick={() => setSetupStep(1)} className="w-full text-slate-400 font-black py-2 text-[8px] uppercase tracking-[0.3em] italic">Zurück zum Namen</button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20 relative min-h-full">
      <div className="flex overflow-x-auto gap-2 py-3 no-scrollbar sticky top-0 bg-[#fffbeb]/90 backdrop-blur-md z-10">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest transition-all ${activeCategory === cat ? 'bg-slate-800 text-white shadow-lg' : 'bg-white/70 text-slate-500 border border-white/50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
        {filteredProducts.map(product => (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            style={{ backgroundColor: product.color }}
            className="flex flex-col justify-between p-4 h-32 rounded-[2rem] shadow-sm text-left active:scale-[0.97] transition-all border border-black/5"
          >
            <span className="font-black text-slate-800 text-sm leading-tight italic uppercase tracking-tight">{product.name}</span>
            <div className="bg-white/40 px-2 py-1 rounded-xl self-start font-black text-[10px] text-slate-800 italic">
              {product.price.toFixed(2)} €
            </div>
          </button>
        ))}
      </div>

      {cart.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-24 left-6 right-6 bg-slate-900 text-white rounded-[2.5rem] p-5 flex items-center justify-between shadow-2xl z-40 animate-in slide-in-from-bottom-10"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 text-white rounded-2xl w-10 h-10 flex items-center justify-center font-black text-lg shadow-lg">{itemCount}</div>
            <div className="flex flex-col items-start"><span className="text-[9px] text-slate-400 font-black uppercase italic tracking-widest">Warenkorb</span><span className="font-black text-lg italic uppercase">Kasse</span></div>
          </div>
          <span className="text-2xl font-black italic">{total.toFixed(2)} €</span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex flex-col justify-end">
          <div className="bg-white rounded-t-[3rem] p-8 max-h-[95vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Bestellung #{settings.nextOrderNumber}</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-500"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              {cart.map(item => (
                <div key={`${item.productId}-${item.isOverridden}`} className="flex items-center justify-between py-5 border-b border-slate-50 last:border-0">
                  <div className="flex flex-col flex-1">
                    <span className="font-black text-slate-800 text-lg italic uppercase tracking-tight">{item.name}</span>
                    <div className="flex items-center gap-2">
                      {item.isOverridden && <span className="text-xs text-slate-400 line-through font-bold">{(item.originalPrice || 0).toFixed(2)} €</span>}
                      <span className={`text-sm font-black italic ${item.isOverridden ? 'text-amber-600' : 'text-slate-500'}`}>{item.price.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setEditingItemId(item.productId); setShowPasscodeForPrice(true); }} 
                      className="p-2 text-slate-400 active:text-amber-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <div className="flex items-center bg-slate-200 rounded-2xl p-1">
                      <button onClick={() => setCart(prev => prev.map(i => i.productId === item.productId && i.isOverridden === item.isOverridden ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="w-10 h-10 font-black text-slate-900">-</button>
                      <span className="w-8 text-center font-black text-slate-900">{item.quantity}</span>
                      <button onClick={() => setCart(prev => prev.map(i => i.productId === item.productId && i.isOverridden === item.isOverridden ? {...i, quantity: i.quantity + 1} : i))} className="w-10 h-10 font-black text-slate-900">+</button>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter(i => !(i.productId === item.productId && i.isOverridden === item.isOverridden)))} className="p-3 text-red-300"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline px-2">
                <span className="text-xl font-black text-slate-400 italic uppercase">Summe</span>
                <span className="text-4xl font-black text-slate-900 italic">{total.toFixed(2)} €</span>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleCheckout('Gratis')} className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase italic tracking-widest active:bg-slate-50 transition-all self-center">
                  <Gift size={16} /> Gratis
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleCheckout('Karte')} className="bg-slate-200 text-slate-800 font-black py-5 rounded-[1.5rem] text-xl uppercase italic tracking-widest active:bg-slate-300">Karte</button>
                  <button onClick={() => handleCheckout('Bar')} className="bg-slate-900 text-white font-black py-5 rounded-[1.5rem] text-xl uppercase italic tracking-widest active:bg-black">Bar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS FÜR PREISBEARBEITUNG */}
      {showPasscodeForPrice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className={`bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl ${passcodeError ? 'animate-shake' : ''}`}>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-600 mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Autorisierung</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Code erforderlich</p>
            </div>
            <input 
              type="password" 
              inputMode="numeric" 
              value={passcodeInput} 
              onChange={e => setPasscodeInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black text-center text-3xl mb-6 tracking-[0.5em] focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 placeholder:text-slate-300" 
              autoFocus 
              placeholder="••••"
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowPasscodeForPrice(false); setEditingItemId(null); setPasscodeInput(''); }} className="py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Abbruch</button>
              <button onClick={verifyPasscode} className="py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg uppercase tracking-widest text-[10px]">OK</button>
            </div>
          </div>
        </div>
      )}

      {editingItemId && !showPasscodeForPrice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 uppercase italic mb-6 text-center tracking-tighter">Preis anpassen</h3>
            <div className="relative mb-8">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 italic">€</span>
              <input 
                type="number" 
                step="0.01" 
                value={newPriceInput} 
                onChange={e => setNewPriceInput(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl font-black text-center text-4xl text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none pl-12" 
                autoFocus 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setEditingItemId(null); setNewPriceInput(''); }} className="py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Abbruch</button>
              <button onClick={applyNewPrice} className="py-4 bg-amber-500 text-white rounded-xl font-black shadow-lg uppercase tracking-widest text-[10px]">Speichern</button>
            </div>
          </div>
        </div>
      )}

      {showCheckoutSuccess && (
        <div className="fixed inset-0 z-[100] bg-emerald-500 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white text-emerald-600 w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 animate-bounce">
            <CheckCircle2 size={80} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-2 italic uppercase">Zahlung OK</h2>
            <p className="text-emerald-50 text-xl font-bold italic uppercase tracking-widest">Nächster Gast!</p>
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
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default POSKasse;
