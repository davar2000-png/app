export interface PersonGroup {
  id: string;
  name: string;
  color: string;
}

export interface PersonDocument {
  id: string;
  name: string;
  type: string;
  data: string;
  date: string;
}

export interface Guarantor {
  id: string;
  name: string;
  mobile?: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  job?: string;
  image?: string;
  documents: PersonDocument[];
}

export interface Person {
  id: string;
  type: 'customer' | 'supplier' | 'guarantor' | 'employee' | 'other';
  groupId?: string;
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
  documents: PersonDocument[];
  guarantor?: Guarantor;
  isDeleted: boolean;
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
  serialNumber?: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  reorderPoint: number;
  allowNegativeStock: boolean;
  description?: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface CardexEntry {
  id: string;
  productId: string;
  type: 'purchase_in' | 'sale_out' | 'return_in' | 'return_out' | 'adjustment';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  balance: number;
  balanceValue: number;
  invoiceId?: string;
  date: string;
  description?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
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
  returnInvoiceId?: string;
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
  isDeleted: boolean;
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

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'RETURN' | 'PAYMENT';
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: string;
  timestamp: string;
}

export type Section =
  | 'dashboard'
  | 'inventory'
  | 'cardex'
  | 'people'
  | 'purchase'
  | 'sale'
  | 'invoices'
  | 'returns'
  | 'cheques'
  | 'installments'
  | 'banks'
  | 'reports'
  | 'audit'
  | 'import'
  | 'settings';
