import { useState, useEffect } from 'react';
import type { Product, Customer, Invoice, InvoiceItem, Payment, CustomerGroup, ProductCategory, ProductBrand, ProductModel, ProductColor, Reminder, DailyNote, Check } from './types';
import { generateId, formatNumber, formatJalaliDate, getTodayJalali, generateInvoiceNumber } from './utils';
import InventoryManager from './components/InventoryManager';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(storedValue)); } catch {}
  }, [key, storedValue]);
  return [storedValue, setStoredValue];
}

export default function App() {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [categories, setCategories] = useLocalStorage<ProductCategory[]>('categories', [
    { id: 'phone', name: 'گوشی موبایل', icon: '📱' },
    { id: 'laptop', name: 'لپ‌تاپ', icon: '💻' },
    { id: 'console', name: 'کنسول بازی', icon: '🎮' },
    { id: 'printer', name: 'پرینتر', icon: '🖨️' },
    { id: 'misc', name: 'متفرقه', icon: '📦' },
  ]);
  const [brands, setBrands] = useLocalStorage<ProductBrand[]>('brands', []);
  const [models, setModels] = useLocalStorage<ProductModel[]>('models', []);
  const [colors, setColors] = useLocalStorage<ProductColor[]>('colors', [
    { id: 'black', name: 'مشکی', code: '#000000' },
    { id: 'white', name: 'سفید', code: '#ffffff' },
  ]);
  const [customerGroups, setCustomerGroups] = useLocalStorage<CustomerGroup[]>('customerGroups', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [notes, setNotes] = useLocalStorage<DailyNote[]>('notes', []);
  const [checks, setChecks] = useLocalStorage<Check[]>('checks', []);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleExport = () => {
    const data = { products, customers, invoices, categories, brands, models, colors, customerGroups, reminders, notes, checks, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup-${getTodayJalali()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.products) setProducts(data.products);
        if (data.customers) setCustomers(data.customers);
        if (data.invoices) setInvoices(data.invoices);
        alert('✅ داده‌ها بازیابی شدند!');
      } catch { alert('❌ خطا در خواندن فایل'); }
    };
    reader.readAsText(file);
  };

  const Dashboard = () => {
    const todayInvoices = invoices.filter(inv => inv.date === getTodayJalali());
    const todaySales = todayInvoices.filter(inv => inv.type === 'sale').reduce((sum, inv) => sum + inv.total, 0);
    const totalDebt = invoices.reduce((sum, inv) => sum + inv.remaining, 0);
    
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🏠 داشبورد</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
            <p className="text-emerald-200 text-sm">فروش امروز</p>
            <p className="text-3xl font-bold mt-2">{formatNumber(todaySales)}</p>
            <p className="text-emerald-200 text-xs">تومان</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
            <p className="text-blue-200 text-sm">تعداد کالاها</p>
            <p className="text-3xl font-bold mt-2">{products.length}</p>
            <p className="text-blue-200 text-xs">محصول</p>
          </div>
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-6 text-white">
            <p className="text-violet-200 text-sm">تعداد اشخاص</p>
            <p className="text-3xl font-bold mt-2">{customers.length}</p>
            <p className="text-violet-200 text-xs">نفر</p>
          </div>
          <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-6 text-white">
            <p className="text-rose-200 text-sm">بدهی کل</p>
            <p className="text-3xl font-bold mt-2">{formatNumber(totalDebt)}</p>
            <p className="text-rose-200 text-xs">تومان</p>
          </div>
        </div>
      </div>
    );
  };

  const PurchaseInvoiceForm = () => {
    const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber('purchase'));
    const [supplierId, setSupplierId] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierPhone, setNewSupplierPhone] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [buyPrice, setBuyPrice] = useState('');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash'|'check'|'transfer'>('cash');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');

    const filteredCustomers = customers.filter(c => 
      !supplierSearch || c.name.includes(supplierSearch) || c.phone.includes(supplierSearch)
    );
    const filteredProducts = products.filter(p =>
      !productSearch || p.name.includes(productSearch) || p.brand.includes(productSearch)
    );

    const handleAddSupplier = () => {
      if (!newSupplierName || !newSupplierPhone) return;
      const newCustomer: Customer = {
        id: generateId(), name: newSupplierName, phone: newSupplierPhone,
        documents: [], createdAt: new Date().toISOString(),
      };
      setCustomers(prev => [newCustomer, ...prev]);
      setSupplierId(newCustomer.id);
      setShowSupplierForm(false);
      setNewSupplierName(''); setNewSupplierPhone('');
    };

    const handleAddItem = () => {
      if (!selectedProductId) return;
      const product = products.find(p => p.id === selectedProductId);
      if (!product) return;
      const price = Number(buyPrice) || product.buyPrice;
      const item: InvoiceItem = {
        id: generateId(), productId: product.id, productName: product.name,
        quantity, buyPrice: price, sellPrice: product.sellPrice, discount: 0, total: price * quantity,
      };
      setItems([...items, item]);
      setSelectedProductId(''); setQuantity(1); setBuyPrice('');
    };

    const handleAddPayment = () => {
      if (!paymentAmount) return;
      const payment: Payment = {
        id: generateId(), method: paymentMethod, amount: Number(paymentAmount),
        date: new Date().toISOString(), description: paymentDesc,
      };
      setPayments([...payments, payment]);
      setPaymentAmount(''); setPaymentDesc(''); setShowPaymentForm(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!supplierId || items.length === 0) { alert('طرف حساب و کالا انتخاب کنید'); return; }
      const supplier = customers.find(c => c.id === supplierId);
      if (!supplier) return;
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const paid = payments.reduce((sum, p) => sum + p.amount, 0);
      const invoice: Invoice = {
        id: generateId(), invoiceNumber, type: 'purchase', date: getTodayJalali(),
        personId: supplierId, personName: supplier.name, items, subtotal, discount: 0, tax: 0,
        total: subtotal, paid, remaining: subtotal - paid, payments,
        status: subtotal - paid === 0 ? 'completed' : paid > 0 ? 'partial' : 'pending',
        deliveryStatus: 'pending', createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [invoice, ...prev]);
      alert(`✅ فاکتور ${invoiceNumber} ثبت شد`);
      setItems([]); setPayments([]); setSupplierId('');
      setInvoiceNumber(generateInvoiceNumber('purchase'));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-2xl font-bold mb-4">🛒 فاکتور خرید</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">تاریخ (شمسی)</label>
              <input type="text" value={getTodayJalali()} disabled className="w-full bg-slate-700/30 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">شماره فاکتور</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">وضعیت دریافت</label>
              <input type="text" value="دریافت نشده ⏳" disabled className="w-full bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 font-bold" />
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-3">
              <h4 className="text-white font-bold">👤 طرف حساب</h4>
              <button type="button" onClick={() => setShowSupplierForm(!showSupplierForm)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">+ جدید</button>
            </div>
            {showSupplierForm && (
              <div className="bg-slate-700/50 rounded-xl p-3 mb-3 space-y-2">
                <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="نام *" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                <input type="tel" value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="تلفن *" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                <button type="button" onClick={handleAddSupplier} className="w-full bg-emerald-600 text-white py-2 rounded-lg">✓ ثبت</button>
              </div>
            )}
            <input type="text" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="🔍 جستجوی فروشنده..." className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white mb-2" />
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white" required>
              <option value="">انتخاب...</option>
              {filteredCustomers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <h4 className="text-white font-bold mb-3">➕ افزودن کالا</h4>
            <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="🔍 جستجوی کالا..." className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); const p = products.find(pr => pr.id === e.target.value); if (p) setBuyPrice(p.buyPrice.toString()); }} className="md:col-span-2 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white">
                <option value="">انتخاب کالا...</option>
                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" placeholder="تعداد" className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
              <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="قیمت" className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <button type="button" onClick={handleAddItem} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg">➕ افزودن</button>
          </div>

          {items.length > 0 && (
            <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
              <h4 className="text-white font-bold mb-3">📋 اقلام فاکتور</h4>
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50"><tr><th className="px-3 py-2 text-right">کالا</th><th className="px-3 py-2 text-right">تعداد</th><th className="px-3 py-2 text-right">قیمت</th><th className="px-3 py-2 text-right">جمع</th><th className="px-3 py-2">حذف</th></tr></thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-white">{item.productName}</td>
                      <td className="px-3 py-2 text-white">{item.quantity}</td>
                      <td className="px-3 py-2 text-white">{formatNumber(item.buyPrice)}</td>
                      <td className="px-3 py-2 text-emerald-400 font-bold">{formatNumber(item.total)}</td>
                      <td className="px-3 py-2 text-center"><button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-rose-400">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-3">
              <h4 className="text-white font-bold">💳 تسویه حساب</h4>
              <button type="button" onClick={() => setShowPaymentForm(!showPaymentForm)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">+ افزودن</button>
            </div>
            {showPaymentForm && (
              <div className="bg-slate-700/50 rounded-xl p-3 mb-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={`py-2 rounded-lg text-sm ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300'}`}>💵 نقدی</button>
                  <button type="button" onClick={() => setPaymentMethod('check')} className={`py-2 rounded-lg text-sm ${paymentMethod === 'check' ? 'bg-violet-600 text-white' : 'bg-slate-600 text-slate-300'}`}>📝 چک</button>
                  <button type="button" onClick={() => setPaymentMethod('transfer')} className={`py-2 rounded-lg text-sm ${paymentMethod === 'transfer' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>🏦 حواله</button>
                </div>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="مبلغ" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                <input type="text" value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder="توضیحات" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                <button type="button" onClick={handleAddPayment} className="w-full bg-emerald-600 text-white py-2 rounded-lg">✓ ثبت</button>
              </div>
            )}
            {payments.map(p => (
              <div key={p.id} className="bg-slate-700/50 rounded-lg p-2 mb-2 flex justify-between">
                <span className="text-white">{p.method === 'cash' ? '💵' : p.method === 'check' ? '📝' : '🏦'} {formatNumber(p.amount)} {p.description && `- ${p.description}`}</span>
                <button type="button" onClick={() => setPayments(payments.filter(x => x.id !== p.id))} className="text-rose-400">🗑️</button>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-800 py-3 rounded-xl font-bold text-white">✓ ثبت فاکتور خرید</button>
        </div>
      </form>
    );
  };

  const InvoiceList = () => {
    const handleUpdateDelivery = (id: string, status: 'pending'|'received'|'partial') => {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, deliveryStatus: status, deliveryDate: status === 'received' ? getTodayJalali() : inv.deliveryDate } : inv));
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📋 لیست فاکتورها ({invoices.length})</h2>
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><span className="text-5xl block mb-4">📄</span>فاکتوری ثبت نشده</div>
        ) : (
          invoices.map(inv => (
            <div key={inv.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">{inv.invoiceNumber}</h3>
                  <p className="text-slate-400 text-sm">{inv.personName}</p>
                  <p className="text-slate-500 text-xs">{inv.date}</p>
                </div>
                <div className="text-left">
                  <p className="text-emerald-400 font-bold text-lg">{formatNumber(inv.total)} تومان</p>
                  <p className={`text-xs ${inv.status === 'completed' ? 'text-emerald-400' : inv.status === 'partial' ? 'text-amber-400' : 'text-rose-400'}`}>
                    {inv.status === 'completed' ? '✓ تسویه' : inv.status === 'partial' ? '⏳ جزئی' : '❌ پرداخت نشده'}
                  </p>
                </div>
              </div>
              {inv.type === 'purchase' && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-sm">وضعیت دریافت:</p>
                      <p className={`font-bold ${inv.deliveryStatus === 'received' ? 'text-emerald-400' : inv.deliveryStatus === 'partial' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {inv.deliveryStatus === 'received' ? '✓ دریافت شده' : inv.deliveryStatus === 'partial' ? '⏳ جزئی' : '❌ دریافت نشده'}
                      </p>
                      {inv.deliveryDate && <p className="text-slate-500 text-xs">تاریخ: {inv.deliveryDate}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateDelivery(inv.id, 'received')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm">✓ دریافت شد</button>
                      <button onClick={() => handleUpdateDelivery(inv.id, 'partial')} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-sm">⏳ جزئی</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  const Settings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ تنظیمات</h2>
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold mb-4">💾 پشتیبان‌گیری</h3>
        <button onClick={handleExport} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mb-3">💾 دانلود پشتیبان</button>
        <label className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold block text-center cursor-pointer">
          📂 بازیابی از فایل
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return (
        <InventoryManager
          categories={categories}
          brands={brands}
          models={models}
          colors={colors}
          onCategoriesChange={setCategories}
          onBrandsChange={setBrands}
          onModelsChange={setModels}
          onColorsChange={setColors}
        />
      );
      case 'invoice-purchase': return <PurchaseInvoiceForm />;
      case 'list-invoices': return <InvoiceList />;
      case 'settings-backup': return <Settings />;
      default: return <div className="text-center py-12 text-slate-400"><span className="text-5xl block mb-4">🚧</span>این بخش به زودی اضافه می‌شود</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-0 lg:w-20'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
              {sidebarOpen && <div><h2 className="text-white font-bold text-sm">حسابداری فروشگاه</h2><p className="text-slate-400 text-xs">نسخه 2.0</p></div>}
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'داشبورد', icon: '🏠' },
              { id: 'inventory', label: 'کالا و انبار', icon: '🏭' },
              { id: 'invoice-purchase', label: 'فاکتور خرید', icon: '🛒' },
              { id: 'list-invoices', label: 'لیست فاکتورها', icon: '📋' },
              { id: 'settings-backup', label: 'تنظیمات', icon: '⚙️' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === item.id ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                <span className="text-2xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : 'lg:mr-20'}`}>
        <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">☰</button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
              <div><h1 className="text-xl font-bold">حسابداری فروشگاه</h1><p className="text-xs text-slate-500">آفلاین</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs">💾 پشتیبان</button>
              <label className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs cursor-pointer">
                📥 بازیابی
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{renderContent()}</main>
      </div>
    </div>
  );
}
