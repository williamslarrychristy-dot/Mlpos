import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  business_id: string;
  name: string;
  sku?: string;
  category_id?: string;
  brand_id?: string;
  unit_id?: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  low_stock_threshold: number;
  image_url?: string;
  aliases?: string;
  description?: string;
  active: boolean;
  _syncStatus: 'synced' | 'pending' | 'conflicted';
  _lastModified: number;
}

export interface LocalSale {
  id: string;
  business_id: string;
  receipt_no: string;
  customer_id?: string;
  member_id?: string;
  total: number;
  discount: number;
  tax: number;
  payment_method: string;
  amount_paid: number;
  change_given: number;
  status: string;
  created_at: string;
  items: Array<{
    product_id: string;
    qty: number;
    unit_price: number;
    total: number;
    profit: number;
  }>;
  _syncStatus: 'synced' | 'pending' | 'conflicted';
  _lastModified: number;
}

export interface LocalSyncQueue {
  id?: number;
  business_id: string;
  table_name: string;
  record_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  retry_count: number;
  created_at: number;
}

export class MotoLarryLocalDB extends Dexie {
  products!: Table<LocalProduct>;
  sales!: Table<LocalSale>;
  syncQueue!: Table<LocalSyncQueue>;

  constructor() {
    super('MotoLarryDB');
    this.version(1).stores({
      products: 'id, business_id, name, sku, active, _syncStatus',
      sales: 'id, business_id, receipt_no, created_at, _syncStatus',
      syncQueue: '++id, business_id, table_name, record_id, created_at'
    });
  }
}

export const localDb = new MotoLarryLocalDB();
