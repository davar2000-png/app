import { useState } from 'react';
import { Product, Customer, Invoice } from './types';
import { useLocalStorage } from './useLocalStorage';
import PurchaseInvoiceForm from './PurchaseInvoiceForm';
import { generateId, formatNumber, formatJalaliDate } from './utils';

export default function App() {
  const [products, setProducts] = useLocalStorage<Product[]>('store-products', [
    { id: '1', name: 'گوشی سامسونگ Galaxy S24', brand: 'Samsung', model: 'S24', buyPrice: 40000000, sellPrice: 45000000, stock: 10 },
    { id: '2', name: 'لپ‌تاپ ایسوس ROG', brand: 'ASUS', model: 'ROG', buyPrice: 50000000, sellPrice: 60000000, stock: 5 },
  ]);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('store-customers', [
    { id: '1', name: 'دیجی‌کالا', phone: '02112345678', address: 'تهران' },
    { id: '2', name: 'تکنولایف', phone: '02187654321', address: 'تهران' },
  ]);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('store-invoices', []);
  const [activeTab, setActiveTab] = useState<'invoice' | 'list'>('invoice');

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const handleUpdateDeliveryStatus = (invoiceId: string, status: 'pending' | 'received' | 'partial') => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, deliveryStatus: status, deliveryDate: status === 'received' ? new Date().toISOString() : inv.deliveryDate }
        : inv
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* هدر */}
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">
            🏪 حسابداری فروشگاه
          </h1>
          <p className="text-slate-400">سیستم مدیریت فاکتور خرید</p>
        </div>

        {/* تب‌ها */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
              activeTab === 'invoice'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🛒 فاکتور خرید
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
            }`}
          >
            📋 لیست فاکتورها ({invoices.length})
          </button>
        </div>

        {/* محتوای تب‌ها */}
        {activeTab === 'invoice' && (
          <PurchaseInvoiceForm
            products={products}
            customers={customers}
            invoices={invoices}
            onSaveInvoice={handleSaveInvoice}
            onUpdateProduct={handleUpdateProduct}
          />
        )}

        {activeTab === 'list' && (
          <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-6">📋 لیست فاکتورهای خرید</h2>
            
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-4">📄</span>
                <p className="text-slate-400">هنوز فاکتوری ثبت نشده است</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{invoice.invoiceNumber}</h3>
                        <p className="text-slate-400 text-sm">{invoice.personName}</p>
                        <p className="text-slate-500 text-xs mt-1">{formatJalaliDate(invoice.date)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-emerald-400 font-bold text-lg">{formatNumber(invoice.total)} تومان</p>
                        <p className={`text-xs mt-1 ${
                          invoice.status === 'completed' ? 'text-emerald-400' :
                          invoice.status === 'partial' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {invoice.status === 'completed' ? '✓ تسویه شده' :
                           invoice.status === 'partial' ? '⏳ تسویه جزئی' : '❌ پرداخت نشده'}
                        </p>
                      </div>
                    </div>

                    {/* وضعیت دریافت */}
                    <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">وضعیت دریافت:</p>
                          <p className={`font-bold ${
                            invoice.deliveryStatus === 'received' ? 'text-emerald-400' :
                            invoice.deliveryStatus === 'partial' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {invoice.deliveryStatus === 'received' ? '✓ دریافت شده' :
                             invoice.deliveryStatus === 'partial' ? '⏳ دریافت جزئی' : '❌ دریافت نشده'}
                          </p>
                          {invoice.deliveryDate && (
                            <p className="text-slate-500 text-xs mt-1">
                              تاریخ دریافت: {formatJalaliDate(invoice.deliveryDate)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateDeliveryStatus(invoice.id, 'received')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-all"
                          >
                            ✓ دریافت شد
                          </button>
                          <button
                            onClick={() => handleUpdateDeliveryStatus(invoice.id, 'partial')}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-all"
                          >
                            ⏳ جزئی
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* اقلام */}
                    <div className="text-sm text-slate-400">
                      <p>تعداد اقلام: {invoice.items.length}</p>
                      {invoice.description && (
                        <p className="mt-1 text-xs">{invoice.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
