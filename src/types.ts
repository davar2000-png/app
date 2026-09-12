export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ProductBrand {
  id: string;
  categoryId: string;
  name: string;
}

export interface ProductModel {
  id: string;
  brandId: string;
  name: string;
}

export interface ProductColor {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  brandId: string;
  modelId: string;
  color?: string;
  ram?: string;
  storage?: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  reorderPoint: number;
  allowNegativeStock: boolean;
  serialNumbers: string[];
  description?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  nationalId?: string;
  job?: string;
  city?: string;
  creditor?: number;
  debtor?: number;
  image?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'purchase' | 'sale';
  customerId: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  remaining: number;
  paymentType: 'cash' | 'installment';
  installments?: Installment[];
  date: string;
  description?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'check' | 'transfer';
  date: string;
  description?: string;
}
