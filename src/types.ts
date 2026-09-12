export interface Person {
  id: string;
  type: 'customer' | 'supplier' | 'guarantor' | 'employee' | 'other';
  name: string;
  familyName?: string;
  nationalId?: string;
  job?: string;
  employeeId?: string;
  phone?: string;
  mobile?: string;
  bankCard?: string;
  address?: string;
  city?: string;
  image?: string;
  notes?: string;
  creditor: number;
  debtor: number;
  createdAt: string;
}

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
  description?: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  productId: string;
  serialNumber: string;
  purchasePrice: number;
  purchaseInvoiceId?: string;
  status: 'in_stock' | 'sold' | 'returned';
  saleInvoiceId?: string;
  soldDate?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productItemId?: string;
  productName: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  buyPrice?: number;
  total: number;
  profit?: number;
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'purchase' | 'sale' | 'proforma';
  personId: string;
  items: InvoiceItem[];
  total: number;
  discount: number;
  paid: number;
  remaining: number;
  paymentType: 'cash' | 'installment' | 'mixed' | 'cheque';
  installments?: Installment[];
  status: 'active' | 'cancelled' | 'returned';
  description?: string;
  date: string;
  createdAt: string;
}

export interface Cheque {
  id: string;
  chequeNumber: string;
  bankName: string;
  amount: number;
  issuerName?: string;
  issuerNationalId?: string;
  dueDate: string;
  type: 'received' | 'paid';
  status: 'pending' | 'cashed' | 'bounced' | 'cancelled';
  relatedInvoiceId?: string;
  relatedPersonId?: string;
  description?: string;
  createdAt: string;
}

export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  cardNumber?: string;
  balance: number;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  bankId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description?: string;
  relatedChequeId?: string;
  date: string;
  createdAt: string;
}

export interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  entityType: string;
  entityId: string;
  items: AccountingEntryItem[];
  createdAt: string;
}

export interface AccountingEntryItem {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export type Section = 
  | 'dashboard' 
  | 'inventory' 
  | 'people' 
  | 'purchase' 
  | 'sale' 
  | 'invoices' 
  | 'cheques' 
  | 'installments'
  | 'banks'
  | 'reports'
  | 'settings';
