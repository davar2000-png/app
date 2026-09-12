export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  method: 'cash' | 'check' | 'transfer';
  amount: number;
  description?: string;
  date: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'purchase' | 'sale';
  date: string;
  personId: string;
  personName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  payments: Payment[];
  status: 'pending' | 'partial' | 'completed';
  deliveryStatus: 'pending' | 'received' | 'partial';
  deliveryDate?: string;
  description?: string;
}
