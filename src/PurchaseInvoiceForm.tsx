import { useState, useMemo } from 'react';
import { Product, Customer, Invoice, InvoiceItem, Payment } from './types';
import { generateId, formatNumber, formatJalaliDate, getTodayJalali, generateInvoiceNumber } from './utils';

interface PurchaseInvoiceFormProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateProduct: (product: Product) => void;
}

export default function PurchaseInvoiceForm({
  products,
  customers,
  invoices,
  onSaveInvoice,
  onUpdateProduct,
}: PurchaseInvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber('purchase'));
  const [jalaliDate] = useState(getTodayJalali());
  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [description, setDescription] = useState('');
  
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState('');
  const [itemDiscount, setItemDiscount] = useState(0);
  
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');

  // فیلتر طرف حساب‌ها بر اساس جستجو
  const filteredCustomers = useMemo(() => {
    if (!supplierSearch) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      c.phone.includes(supplierSearch)
    );
  }, [customers, supplierSearch]);

  // فیلتر کالاها بر اساس جستجو
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.model.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // افزودن طرف حساب جدید
  const handleAddSupplier = () => {
    if (!newSupplierName || !newSupplierPhone) return;
    const newCustomer: Customer = {
      id: generateId(),
      name: newSupplierName,
      phone: newSupplierPhone,
      address: newSupplierAddress,
    };
    const customers = JSON.parse(localStorage.getItem('store-customers') || '[]');
    customers.unshift(newCustomer);
    localStorage.setItem('store-customers', JSON.stringify(customers));
    setSupplierId(newCustomer.id);
    setShowSupplierForm(false);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
  };

  // افزودن کالا
  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const price = Number(buyPrice) || product.buyPrice;
    const total = (price * quantity) - itemDiscount;

    const item: InvoiceItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity,
      buyPrice: price,
      discount: itemDiscount,
      total,
    };

    setItems([...items, item]);
    setSelectedProductId('');
    setQuantity(1);
    setBuyPrice('');
    setItemDiscount(0);
  };

  // حذف کالا
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // افزودن تسویه
  const handleAddPayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    const payment: Payment = {
      id: generateId(),
      method: paymentMethod,
      amount: Number(paymentAmount),
      date: new Date().toISOString(),
      description: paymentDescription,
    };
    setPayments([...payments, payment]);
    setPaymentAmount('');
    setPaymentDescription('');
    setShowPaymentForm(false);
  };

  // حذف تسویه
  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  // محاسبات
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - paidAmount;

  // ثبت فاکتور
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      alert('لطفاً طرف حساب و حداقل یک کالا انتخاب کنید');
      return;
    }

    const supplier = customers.find(c => c.id === supplierId);
    if (!supplier) return;

    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber,
      type: 'purchase',
      date: new Date().toISOString(),
      personId: supplierId,
      personName: supplier.name,
      items,
      subtotal,
      discount,
      total,
      paid: paidAmount,
      remaining,
      payments,
      status: remaining === 0 ? 'completed' : paidAmount > 0 ? 'partial' : 'pending',
      deliveryStatus: 'pending', // پیش‌فرض: دریافت نشده
      description: `${description}${websiteUrl ? ` | سایت: ${websiteUrl}` : ''}${orderNumber ? ` | سفارش: ${orderNumber}` : ''}`,
    };

    onSaveInvoice(invoice);

    // به‌روزرسانی موجودی
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        onUpdateProduct({
          ...product,
          stock: product.stock + item.quantity,
          buyPrice: item.buyPrice,
        });
      }
    });

    alert(`✅ فاکتور خرید ${invoiceNumber} با موفقیت ثبت شد!\nوضعیت: دریافت نشده`);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return '💵 نقدی';
      case 'check': return '📝 چک';
      case 'transfer': return '🏦 حواله';
      default: return method;
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          🛒 فاکتور خرید
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات اصلی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">تاریخ (شمسی)</label>
            <input
              type="text"
              value={jalaliDate}
              disabled
              className="w-full bg-slate-700/30 border border-slate-600 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">شماره فاکتور (شماره سفارش خرید)</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="شماره سفارش خرید"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">وضعیت دریافت</label>
            <input
              type="text"
              value="دریافت نشده ⏳"
              disabled
              className="w-full bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 font-bold"
            />
            <p className="text-xs text-slate-400 mt-1">پس از ثبت، از لیست فاکتورها قابل تغییر است</p>
          </div>
        </div>

        {/* طرف حساب */}
        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold">👤 طرف حساب (فروشنده)</h4>
            <button
              type="button"
              onClick={() => setShowSupplierForm(!showSupplierForm)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              + طرف حساب جدید
            </button>
          </div>

          {/* فرم طرف حساب جدید */}
          {showSupplierForm && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-3 space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  placeholder="نام طرف حساب *"
                  className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="tel"
                  value={newSupplierPhone}
                  onChange={e => setNewSupplierPhone(e.target.value)}
                  placeholder="شماره تماس *"
                  className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newSupplierAddress}
                  onChange={e => setNewSupplierAddress(e.target.value)}
                  placeholder="آدرس"
                  className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                >
                  ✓ ثبت
                </button>
                <button
                  type="button"
                  onClick={() => setShowSupplierForm(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}

          {/* جستجوی طرف حساب */}
          <input
            type="text"
            value={supplierSearch}
            onChange={e => setSupplierSearch(e.target.value)}
            placeholder="🔍 جستجوی طرف حساب..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3"
          />

          {/* انتخاب طرف حساب */}
          <select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">انتخاب طرف حساب...</option>
            {filteredCustomers.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
            ))}
          </select>
        </div>

        {/* اطلاعات سایت */}
        <div className="bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-white font-bold mb-3">🌐 اطلاعات سفارش آنلاین</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-2">آدرس سایت</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">شماره سفارش</label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="شماره سفارش سایت"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* افزودن کالا */}
        <div className="bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-white font-bold mb-3">➕ افزودن کالا</h4>
          
          {/* جستجوی کالا */}
          <input
            type="text"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="🔍 جستجوی کالا..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-xs mb-1">کالا</label>
              <select
                value={selectedProductId}
                onChange={e => {
                  setSelectedProductId(e.target.value);
                  const p = products.find(pr => pr.id === e.target.value);
                  if (p) setBuyPrice(p.buyPrice.toString());
                }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">انتخاب کالا...</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">تعداد</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                min="1"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">قیمت خرید</label>
              <input
                type="number"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            ➕ افزودن به فاکتور
          </button>
        </div>

        {/* لیست کالاها */}
        {items.length > 0 && (
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-white font-bold mb-3">📋 اقلام فاکتور</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-3 py-2 text-right text-slate-300">کالا</th>
                    <th className="px-3 py-2 text-right text-slate-300">تعداد</th>
                    <th className="px-3 py-2 text-right text-slate-300">قیمت</th>
                    <th className="px-3 py-2 text-right text-slate-300">جمع</th>
                    <th className="px-3 py-2 text-center text-slate-300">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-white">{item.productName}</td>
                      <td className="px-3 py-2 text-white">{item.quantity}</td>
                      <td className="px-3 py-2 text-white">{formatNumber(item.buyPrice)}</td>
                      <td className="px-3 py-2 text-emerald-400 font-bold">{formatNumber(item.total)}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* محاسبات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">جمع کل:</span>
              <span className="text-white font-bold">{formatNumber(subtotal)} تومان</span>
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">تخفیف کل</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                min="0"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-between text-lg border-t border-slate-600 pt-3">
              <span className="text-white font-bold">مبلغ نهایی:</span>
              <span className="text-emerald-400 font-bold">{formatNumber(total)} تومان</span>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold">💳 تسویه حساب</h4>
              <button
                type="button"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                + افزودن
              </button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">پرداخت شده:</span>
              <span className="text-emerald-400 font-bold">{formatNumber(paidAmount)} تومان</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">باقیمانده:</span>
              <span className={`font-bold ${remaining > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatNumber(remaining)} تومان
              </span>
            </div>

            {showPaymentForm && (
              <div className="bg-slate-700/50 rounded-xl p-3 space-y-2 animate-fadeIn">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-lg text-sm ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300'}`}
                  >
                    💵 نقدی
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('check')}
                    className={`py-2 rounded-lg text-sm ${paymentMethod === 'check' ? 'bg-violet-600 text-white' : 'bg-slate-600 text-slate-300'}`}
                  >
                    📝 چک
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 rounded-lg text-sm ${paymentMethod === 'transfer' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}
                  >
                    🏦 حواله
                  </button>
                </div>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="مبلغ"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={e => setPaymentDescription(e.target.value)}
                  placeholder="توضیحات (شماره چک، حواله و...)"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddPayment}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm hover:bg-emerald-700"
                >
                  ✓ ثبت تسویه
                </button>
              </div>
            )}

            {payments.length > 0 && (
              <div className="space-y-2 mt-2">
                {payments.map(payment => (
                  <div key={payment.id} className="bg-slate-700/50 rounded-lg p-2 flex items-center justify-between">
                    <div>
                      <span className="text-white text-sm">{getPaymentMethodLabel(payment.method)}</span>
                      <span className="text-slate-400 text-xs mx-2">|</span>
                      <span className="text-emerald-400 font-bold text-sm">{formatNumber(payment.amount)}</span>
                      {payment.description && (
                        <p className="text-slate-400 text-xs mt-1">{payment.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(payment.id)}
                      className="text-rose-400 hover:text-rose-300 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* توضیحات */}
        <div>
          <label className="block text-slate-300 text-sm mb-2">توضیحات</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* دکمه ثبت */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 py-3 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          ✓ ثبت فاکتور خرید
        </button>
      </form>
    </div>
  );
}
