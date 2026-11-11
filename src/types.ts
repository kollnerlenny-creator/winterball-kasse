export type PosType = 0 | 1 | 2; // 0 = Alle, 1 = Getränke, 2 = Speisen

export interface InventoryItem {
  id?: string;
  name?: string;
  hasVariants: boolean;
  assignedPos: PosType;
  price?: number;
  stock?: number;
  cost?: number;
  priceS?: number;
  stockS?: number;
  costS?: number;
  priceL?: number;
  stockL?: number;
  costL?: number;
}

export interface CartItem {
  name: string;
  price: number;
  isVariant: boolean;
  isLarge: boolean;
  parent: string | null;
  isDonation?: boolean;
}

export interface OrderItem {
  name: string;
  price: number;
  isVariant?: boolean;
  isLarge?: boolean;
  parent?: string | null;
  isDonation?: boolean;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  tip?: number;
  timestamp?: { seconds: number; nanoseconds: number } | null | any;
  storniert?: boolean;
  pos?: number;
}

export interface SyncCartData {
  items: { name: string; price: number }[];
  total: number;
  isPaying: boolean;
  given: number;
  change: number;
  tip?: number;
  justCompleted?: boolean;
  completedTotal?: number;
  completedAt?: number;
  lastUpdate?: any;
}

export interface FinanceStats {
  expenses: number;
  cashStart: number;
}

export type ViewType = 'order' | 'customer-select' | 'customer' | 'dashboard' | 'history' | 'inventory';
