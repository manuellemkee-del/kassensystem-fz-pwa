
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
}

export interface CashCount {
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
  id: string; // Wird nun das Format 2026-XXXX haben
  name: string;
  startDate: string;
  endDate: string;
  closedAt?: string;
  initialBalance: number;
  totalRevenue?: number;
  orders: Order[];
  cashCount?: CashCount;
  finalDifference?: number;
}

export interface POSSettings {
  voiceEnabled: boolean;
  nextOrderNumber: number;
  activeEvent: string | null;
  activeEventStart: string | null;
  activeEventInitialBalance: number;
  passcode: string;
  eventSequence: number; // Für das Format 2026-XXXX
}
