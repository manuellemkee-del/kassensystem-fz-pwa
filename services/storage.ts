
import { Product, Order, POSSettings, ArchivedEvent } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const KEYS = {
  PRODUCTS: 'c2_pos_products',
  ORDERS: 'c2_pos_orders',
  SETTINGS: 'c2_pos_settings',
  ARCHIVE: 'c2_pos_archive'
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = storage.getOrders();
    localStorage.setItem(KEYS.ORDERS, JSON.stringify([...orders, order]));
  },
  clearOrders: () => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
  },
  deleteOrder: (id: string) => {
    const orders = storage.getOrders();
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders.filter(o => o.id !== id)));
  },
  getSettings: (): POSSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    const defaultSettings: POSSettings = { 
      voiceEnabled: false, 
      nextOrderNumber: 1,
      activeEvent: null,
      activeEventStart: null,
      activeEventInitialBalance: 0,
      passcode: '1234',
      eventSequence: 1
    };
    return data ? JSON.parse(data) : defaultSettings;
  },
  updateSettings: (settings: Partial<POSSettings>) => {
    const current = storage.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('c2-settings-changed', { detail: updated }));
  },
  getArchive: (): ArchivedEvent[] => {
    const data = localStorage.getItem(KEYS.ARCHIVE);
    return data ? JSON.parse(data) : [];
  },
  archiveEvent: (event: ArchivedEvent) => {
    const archive = storage.getArchive();
    localStorage.setItem(KEYS.ARCHIVE, JSON.stringify([event, ...archive]));
  }
};
