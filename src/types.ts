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
  category: 'phone' | 'laptop' | 'console' | 'printer' | 'misc';
  categoryId?: string;
  brand: string;
  brandId?: string;
  model: string;
  modelId?: string;
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
  employeeId?: string;
  bankCardNumber?: string;
  city?: string;
  creditor?: number;
  debtor?: number;
  image?: string;
  documents: Document[];
  groupId?: string;
  guarantor?: Guarantor;
  notes?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  data: string;
  date: string;
}

export interface Guarantor {
  id: string;
  name: string;
  phone: string;
  address?: string;
  job?: string;
  nationalId?: string;
  image?: string;
  documents: Document[];
}

export interface CustomerGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type PaymentMethod = 'cash' | 'card' | 'check' | 'installment' | 'fish' | 'credit' | 'combined';



export interface Sale {
  id: string;
  invoiceNumber: string;
  type: 'sale' | 'return' | 'prefactor';
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discount: number;
  paymentType: PaymentMethod;
  paymentMethod?: PaymentMethod;
  downPayment: number;
  installments?: Installment[];
  items?: InvoiceItem[];
  date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'returned';
  description?: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  type: 'purchase' | 'return';
  supplierId: string;
  items: InvoiceItem[];
  totalAmount: number;
  discount: number;
  paymentType: PaymentMethod;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  description?: string;
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: PaymentMethod;
}

export interface Check {
  id: string;
  type: 'received' | 'paid';
  number: string;
  bankId: string;
  amount: number;
  dueDate: string;
  issuedDate: string;
  issuer?: string;
  receiver?: string;
  status: 'pending' | 'cashed' | 'bounced' | 'returned';
  relatedInvoiceId?: string;
  description?: string;
}

export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  cardNumber?: string;
  sheba?: string;
  balance: number;
}

export interface StockTransaction {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  description?: string;
  relatedSaleId?: string;
  relatedPurchaseId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  isDone: boolean;
  createdAt: string;
}

export interface DailyNote {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  relatedSaleId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export type FilterType = 'all' | 'income' | 'expense';
export type SortType = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  method: 'cash' | 'check' | 'transfer';
  amount: number;
  date: string;
  description?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'purchase' | 'sale' | 'return';
  date: string;
  personId: string;
  personName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  payments: Payment[];
  status: 'completed' | 'partial' | 'pending';
  deliveryStatus: 'pending' | 'received' | 'partial';
  deliveryDate?: string;
  createdAt: string;
}
