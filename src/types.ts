export interface Product {
  id: string; code: string; name: string; category: string; brand: string; model: string;
  color?: string; ram?: string; storage?: string; buyPrice: number; sellPrice: number;
  stock: number; minStock: number; reorderPoint: number; serialNumbers: string[];
  description?: string; createdAt: string;
}
export interface Customer {
  id: string; name: string; phone: string; address?: string; nationalId?: string;
  job?: string; city?: string; employeeId?: string; bankCardNumber?: string;
  creditor?: number; debtor?: number; image?: string; documents: Doc[];
  groupId?: string; guarantor?: Guarantor; notes?: string; createdAt: string;
}
export interface Doc { id: string; name: string; type: string; data: string; date: string; }
export interface Guarantor {
  id: string; name: string; phone: string; address?: string; job?: string;
  nationalId?: string; image?: string; documents: Doc[];
}
export interface CustomerGroup { id: string; name: string; icon: string; color: string; }
export interface ProductCategory { id: string; name: string; icon: string; }
export interface ProductBrand { id: string; categoryId: string; name: string; }
export interface ProductModel { id: string; brandId: string; name: string; }
export interface ProductColor { id: string; name: string; code: string; }
export interface InvoiceItem {
  id: string; productId: string; productName: string; quantity: number;
  buyPrice: number; sellPrice: number; discount: number; total: number;
}
export interface Payment {
  id: string; method: 'cash'|'card'|'check'|'transfer'|'installment'|'credit';
  amount: number; date: string; description?: string;
}
export interface Invoice {
  id: string; invoiceNumber: string; type: 'purchase'|'sale'|'return_purchase'|'return_sale'|'pre_invoice';
  date: string; personId: string; personName: string; items: InvoiceItem[];
  subtotal: number; discount: number; tax: number; total: number;
  paid: number; remaining: number; payments: Payment[];
  status: 'pending'|'partial'|'completed'; deliveryStatus: 'pending'|'received'|'partial';
  deliveryDate?: string; description?: string; websiteUrl?: string; orderNumber?: string;
  siteImage?: string; createdAt: string;
}
export interface Check {
  id: string; checkNumber: string; type: 'received'|'paid'; amount: number;
  dueDate: string; bankName: string; personId: string; personName: string;
  invoiceId?: string; status: 'pending'|'cleared'|'bounced'; description?: string; createdAt: string;
}
export interface Reminder {
  id: string; title: string; description?: string; date: string; time?: string;
  priority: 'low'|'medium'|'high'; isDone: boolean; createdAt: string;
}
export interface DailyNote { id: string; title: string; content: string; date: string; createdAt: string; }
