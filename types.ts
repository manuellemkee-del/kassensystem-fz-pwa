
export type Category = 'Alle' | 'Flammkuchen' | 'Getränke' | 'Eis';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  color: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  isOverridden?: boolean;
}

export interface Order {
  id: string;
  orderNumber: number;
  timestamp: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'Bar' | 'Karte' | 'Gratis';
  eventName: string;
  tax_rate: 7 | 19;
  tax_type: 'togo' | 'onsite';
  cancelled?: boolean;
  cancel_reason?: string;
  cancel_timestamp?: string;
}

export interface Tip {
  id: string;
  amount: number;
  timestamp: string;
  eventName: string;
}

export interface InventoryItem {
  start: number;
  current: number;
}

export interface InventoryRefill {
  timestamp: string;
  items: Record<string, number>;
}

export interface CashCount {
  '100_note': number;
  '50_note': number;
  '20_note': number;
  '10_note': number;
  '5_note': number;
  '2_coin': number;
  '1_coin': number;
  '50_cent': number;
  '20_cent': number;
  '10_cent': number;
  '5_cent': number;
}

export interface ArchivedEvent {
  id: string; // Format 2026-XXXX
  name: string;
  startDate: string;
  endDate: string;
  closedAt?: string;
  initialBalance: number;
  totalRevenue?: number;
  orders: Order[];
  tips?: Tip[];
  cashCount?: CashCount;
  finalDifference?: number;
  inventory?: Record<string, InventoryItem>;
  refills?: InventoryRefill[];
}

export interface POSSettings {
  voiceEnabled: boolean;
  nextOrderNumber: number;
  activeEvent: string | null;
  activeEventStart: string | null;
  activeEventInitialBalance: number;
  passcode: string;
  eventSequence: number;
  // Laufzeit-Inventar für das aktive Event
  activeInventory?: Record<string, InventoryItem>;
  activeRefills?: InventoryRefill[];
  activeTips?: Tip[];
}
