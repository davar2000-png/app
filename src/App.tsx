import { useState, useEffect } from 'react';
import type { Product, Customer, Invoice, InvoiceItem, Installment, ProductCategory, ProductBrand, ProductModel, ProductColor } from './types';
import { generateId, formatNumber, getTodayDate, generateInvoiceNumber, calculateInstallments } from './utils';

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
  const [brands, setBrands] = useLocalStorage<ProductBrand[]>('brands', [
    { id: 'apple', categoryId: 'phone', name: 'Apple' },
    { id: 'samsung', categoryId: 'phone', name: 'Samsung' },
    { id: 'xiaomi', categoryId: 'phone', name: 'Xiaomi' },
    { id: 'hp', categoryId: 'laptop', name: 'HP' },
    { id: 'dell', categoryId: 'laptop', name: 'Dell' },
    { id: 'asus', categoryId: 'laptop', name: 'ASUS' },
    { id: 'lenovo', categoryId: 'laptop', name: 'Lenovo' },
    { id: 'ps5', categoryId: 'console', name: 'PS5' },
    { id: 'hp-printer', categoryId: 'printer', name: 'HP' },
    { id: 'canon', categoryId: 'printer', name: 'Canon' },
    { id: 'brother', categoryId: 'printer', name: 'Brother' },
  ]);
  const [models, setModels] = useLocalStorage<ProductModel[]>('models', []);
  const [colors, setColors] = useLocalStorage<ProductColor[]>('colors', [
    { id: 'black', name: 'مشکی', code: '#000000' },
    { id: 'white', name: 'سفید', code: '#ffffff' },
    { id: 'blue', name: 'آبی', code: '#3b82f6' },
    { id: 'red', name: 'قرمز', code: '#ef4444' },
  ]);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleExport = () => {
    const data = { products, customers, invoices, categories, brands, models, colors, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup-${getTodayDate()}.json`;
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
        if (data.categories) setCategories(data.categories);
        if (data.brands) setBrands(data.brands);
        if (data.models) setModels(data.models);
        if (data.colors) setColors(data.colors);
        alert('✅ داده‌ها بازیابی شدند!');
      } catch { alert('❌ خطا در خواندن فایل'); }
    };
    reader.readAsText(file);
  };

  const getProductName = (p: Product) => {
    const brand = brands.find(b => b.id === p.brandId);
    const model = models.find(m => m.id === p.modelId);
    return [brand?.name, model?.name, p.color, p.ram && `${p.ram}GB`, p.storage && `${p.storage}GB`].filter(Boolean).join(' - ');
  };

  // Dashboard
  const Dashboard = () => {
    const today = getTodayDate();
    const todayInvoices = invoices.filter(inv => inv.date === today);
    const todaySales = todayInvoices.filter(inv => inv.type === 'sale').reduce((sum, inv) => sum + inv.total, 0);
    const todayPurchases = todayInvoices.filter(inv => inv.type === 'purchase').reduce((sum, inv) => sum + inv.total, 0);
    const totalDebt = invoices.reduce((sum, inv) => sum + inv.remaining, 0);
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🏠 داشبورد</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
            <p className="text-emerald-200 text-sm">فروش امروز</p>
            <p className="text-3xl font-bold mt-2">{formatNumber(todaySales)}</p>
            <p className="text-emerald-200 text-xs">تومان</p>
          </div>
          <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-6 text-white">
            <p className="text-rose-200 text-sm">خرید امروز</p>
            <p className="text-3xl font-bold mt-2">{formatNumber(todayPurchases)}</p>
            <p className="text-rose-200 text-xs">تومان</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
            <p className="text-blue-200 text-sm">تعداد کالاها</p>
            <p className="text-3xl font-bold mt-2">{products.length}</p>
            <p className="text-blue-200 text-xs">محصول</p>
          </div>
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-6 text-white">
            <p className="text-violet-200 text-sm">بدهی کل</p>
            <p className="text-3xl font-bold mt-2">{formatNumber(totalDebt)}</p>
            <p className="text-violet-200 text-xs">تومان</p>
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
            <h3 className="text-rose-400 font-bold mb-2">⚠️ کالاهای با موجودی کم</h3>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-white">{getProductName(p)}</span>
                  <span className="text-rose-400">موجودی: {p.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inventory Manager
  const InventoryManager = () => {
    const [tab, setTab] = useState<'categories' | 'brands' | 'models' | 'colors' | 'products'>('products');
    const [newCatName, setNewCatName] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('📦');
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandCat, setNewBrandCat] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [newModelBrand, setNewModelBrand] = useState('');
    const [newColorName, setNewColorName] = useState('');
    const [newColorCode, setNewColorCode] = useState('#000000');

    // Product form
    const [pCat, setPCat] = useState('');
    const [pBrand, setPBrand] = useState('');
    const [pModel, setPModel] = useState('');
    const [pColor, setPColor] = useState('');
    const [pRam, setPRam] = useState('');
    const [pStorage, setPStorage] = useState('');
    const [pBuy, setPBuy] = useState('');
    const [pSell, setPSell] = useState('');
    const [pStock, setPStock] = useState('0');
    const [pMin, setPMin] = useState('0');
    const [pReorder, setPReorder] = useState('0');
    const [pSerials, setPSerials] = useState('');
    const [pAllowNeg, setPAllowNeg] = useState(false);

    const addProduct = () => {
      if (!pCat || !pBrand || !pModel || !pBuy || !pSell) return;
      const brand = brands.find(b => b.id === pBrand);
      const model = models.find(m => m.id === pModel);
      const color = colors.find(c => c.id === pColor);
      const name = [brand?.name, model?.name, color?.name, pRam && `${pRam}GB RAM`, pStorage && `${pStorage}GB`].filter(Boolean).join(' - ');
      
      const product: Product = {
        id: generateId(),
        code: `PRD-${Date.now()}`,
        name,
        categoryId: pCat,
        brandId: pBrand,
        modelId: pModel,
        color: color?.name,
        ram: pRam,
        storage: pStorage,
        buyPrice: Number(pBuy),
        sellPrice: Number(pSell),
        stock: Number(pStock),
        minStock: Number(pMin),
        reorderPoint: Number(pReorder),
        allowNegativeStock: pAllowNeg,
        serialNumbers: pSerials.split('\n').filter(s => s.trim()),
        createdAt: new Date().toISOString(),
      };
      setProducts(prev => [product, ...prev]);
      setPCat(''); setPBrand(''); setPModel(''); setPColor(''); setPRam(''); setPStorage('');
      setPBuy(''); setPSell(''); setPStock('0'); setPMin('0'); setPReorder('0'); setPSerials(''); setPAllowNeg(false);
    };

    const filteredBrands = brands.filter(b => b.categoryId === pCat);
    const filteredModels = models.filter(m => m.brandId === pBrand);

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🏭 کالا و انبار</h2>
        
        <div className="flex gap-2 flex-wrap border-b border-slate-700 pb-2">
          {[
            { id: 'products', label: '➕ ثبت کالا', icon: '📦' },
            { id: 'categories', label: '📁 گروه‌ها', icon: '📁' },
            { id: 'brands', label: '🏷️ برندها', icon: '🏷️' },
            { id: 'models', label: '📱 مدل‌ها', icon: '📱' },
            { id: 'colors', label: '🎨 رنگ‌ها', icon: '🎨' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold mb-4">ثبت کالای جدید</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">گروه *</label>
                  <select value={pCat} onChange={e => { setPCat(e.target.value); setPBrand(''); setPModel(''); }} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                    <option value="">انتخاب...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">برند *</label>
                  <select value={pBrand} onChange={e => { setPBrand(e.target.value); setPModel(''); }} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!pCat}>
                    <option value="">انتخاب...</option>
                    {filteredBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">مدل *</label>
                  <select value={pModel} onChange={e => setPModel(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!pBrand}>
                    <option value="">انتخاب...</option>
                    {filteredModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">رنگ</label>
                  <select value={pColor} onChange={e => setPColor(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                    <option value="">انتخاب...</option>
                    {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">رم (GB)</label>
                  <input type="text" value={pRam} onChange={e => setPRam(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="8" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">حافظه (GB)</label>
                  <input type="text" value={pStorage} onChange={e => setPStorage(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="128" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">قیمت خرید *</label>
                  <input type="number" value={pBuy} onChange={e => setPBuy(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">قیمت فروش *</label>
                  <input type="number" value={pSell} onChange={e => setPSell(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">موجودی</label>
                  <input type="number" value={pStock} onChange={e => setPStock(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">حداقل موجودی</label>
                  <input type="number" value={pMin} onChange={e => setPMin(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">نقطه سفارش</label>
                  <input type="number" value={pReorder} onChange={e => setPReorder(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="neg" checked={pAllowNeg} onChange={e => setPAllowNeg(e.target.checked)} className="w-5 h-5" />
                  <label htmlFor="neg" className="text-slate-300 text-sm">اجازه موجودی منفی</label>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-slate-300 text-sm mb-1">شماره سریال‌ها (هر خط یکی)</label>
                <textarea value={pSerials} onChange={e => setPSerials(e.target.value)} rows={2} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              </div>
              <button onClick={addProduct} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">✓ ثبت کالا</button>
            </div>

            {/* لیست کالاها */}
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold mb-4">لیست کالاها ({products.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map(p => (
                  <div key={p.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-slate-400 text-xs">کد: {p.code} | موجودی: {p.stock}</p>
                    </div>
                    <button onClick={() => { if (confirm('حذف؟')) setProducts(prev => prev.filter(x => x.id !== p.id)); }} className="text-rose-400 hover:text-rose-300">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold mb-4">گروه‌های کالا</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="نام گروه" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="text" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="📦" className="w-20 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white text-center text-xl" />
              <button onClick={() => { if (newCatName) { setCategories([...categories, { id: generateId(), name: newCatName, icon: newCatIcon }]); setNewCatName(''); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-white">{c.icon} {c.name}</span>
                  <button onClick={() => { if (confirm('حذف؟')) { setCategories(categories.filter(x => x.id !== c.id)); setBrands(brands.filter(b => b.categoryId !== c.id)); } }} className="text-rose-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'brands' && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold mb-4">برندها</h3>
            <div className="flex gap-2 mb-4">
              <select value={newBrandCat} onChange={e => setNewBrandCat(e.target.value)} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">گروه...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="نام برند" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <button onClick={() => { if (newBrandCat && newBrandName) { setBrands([...brands, { id: generateId(), categoryId: newBrandCat, name: newBrandName }]); setNewBrandName(''); setNewBrandCat(''); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            <div className="space-y-2">
              {brands.map(b => {
                const cat = categories.find(c => c.id === b.categoryId);
                return (
                  <div key={b.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-white">{cat?.icon} {b.name} ({cat?.name})</span>
                    <button onClick={() => { if (confirm('حذف؟')) { setBrands(brands.filter(x => x.id !== b.id)); setModels(models.filter(m => m.brandId !== b.id)); } }} className="text-rose-400">🗑️</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'models' && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold mb-4">مدل‌ها</h3>
            <div className="flex gap-2 mb-4">
              <select value={newModelBrand} onChange={e => setNewModelBrand(e.target.value)} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">برند...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="نام مدل" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <button onClick={() => { if (newModelBrand && newModelName) { setModels([...models, { id: generateId(), brandId: newModelBrand, name: newModelName }]); setNewModelName(''); setNewModelBrand(''); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            <div className="space-y-2">
              {models.map(m => {
                const brand = brands.find(b => b.id === m.brandId);
                return (
                  <div key={m.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-white">{brand?.name} - {m.name}</span>
                    <button onClick={() => { if (confirm('حذف؟')) setModels(models.filter(x => x.id !== m.id)); }} className="text-rose-400">🗑️</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'colors' && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold mb-4">رنگ‌ها</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="نام رنگ" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="color" value={newColorCode} onChange={e => setNewColorCode(e.target.value)} className="w-20 h-10 bg-slate-700/50 border border-slate-600 rounded-xl cursor-pointer" />
              <button onClick={() => { if (newColorName) { setColors([...colors, { id: generateId(), name: newColorName, code: newColorCode }]); setNewColorName(''); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {colors.map(c => (
                <div key={c.id} className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c.code }} />
                    <span className="text-white text-sm">{c.name}</span>
                  </div>
                  <button onClick={() => { if (confirm('حذف؟')) setColors(colors.filter(x => x.id !== c.id)); }} className="text-rose-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Customer Manager
  const CustomerManager = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [job, setJob] = useState('');
    const [city, setCity] = useState('');
    const [notes, setNotes] = useState('');
    const [search, setSearch] = useState('');

    const addCustomer = () => {
      if (!name || !phone) return;
      const customer: Customer = {
        id: generateId(), name, phone, address, nationalId, job, city, notes,
        creditor: 0, debtor: 0, createdAt: new Date().toISOString(),
      };
      setCustomers(prev => [customer, ...prev]);
      setName(''); setPhone(''); setAddress(''); setNationalId(''); setJob(''); setCity(''); setNotes('');
    };

    const filtered = customers.filter(c => 
      c.name.includes(search) || c.phone.includes(search) || c.nationalId?.includes(search) || c.city?.includes(search)
    );

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">👥 مدیریت اشخاص</h2>
        
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold mb-4">ثبت شخص جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="نام *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="تلفن *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="text" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="text" value={job} onChange={e => setJob(e.target.value)} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="شهر" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="آدرس" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="یادداشت" rows={2} className="mt-4 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          <button onClick={addCustomer} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">✓ ثبت شخص</button>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">لیست اشخاص ({filtered.length})</h3>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 جستجو..." className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white w-64" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map(c => (
              <div key={c.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{c.name}</p>
                  <p className="text-slate-400 text-xs">{c.phone} {c.city && `| ${c.city}`} {c.job && `| ${c.job}`}</p>
                </div>
                <button onClick={() => { if (confirm('حذف؟')) setCustomers(prev => prev.filter(x => x.id !== c.id)); }} className="text-rose-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Invoice Form
  const InvoiceForm = ({ type }: { type: 'purchase' | 'sale' }) => {
    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState('');
    const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');
    const [downPayment, setDownPayment] = useState('');
    const [months, setMonths] = useState(3);
    const [description, setDescription] = useState('');

    const addItem = () => {
      const product = products.find(p => p.id === selectedProduct);
      if (!product || !unitPrice) return;
      const item: InvoiceItem = {
        id: generateId(),
        productId: product.id,
        productName: getProductName(product),
        quantity,
        unitPrice: Number(unitPrice),
        total: quantity * Number(unitPrice),
      };
      setItems([...items, item]);
      setSelectedProduct(''); setQuantity(1); setUnitPrice('');
    };

    const total = items.reduce((sum, i) => sum + i.total, 0);

    const submitInvoice = () => {
      if (!customerId || items.length === 0) return;
      const paid = paymentType === 'cash' ? total : Number(downPayment) || 0;
      let installments: Installment[] | undefined;
      
      if (paymentType === 'installment' && Number(downPayment) < total) {
        const { amount, dates } = calculateInstallments(total, paid, months);
        installments = dates.map((date, i) => ({
          id: generateId(),
          amount: i === dates.length - 1 ? amount + (total - paid - amount * months) : amount,
          dueDate: date,
          status: 'pending',
        }));
      }

      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(type),
        type,
        customerId,
        items,
        total,
        paid,
        remaining: total - paid,
        paymentType,
        installments,
        date: getTodayDate(),
        description,
      };

      setInvoices(prev => [invoice, ...prev]);
      
      // Update stock
      items.forEach(item => {
        setProducts(prev => prev.map(p => {
          if (p.id === item.productId) {
            const newStock = type === 'sale' ? p.stock - item.quantity : p.stock + item.quantity;
            return { ...p, stock: newStock };
          }
          return p;
        }));
      });

      // Reset
      setCustomerId(''); setItems([]); setDownPayment(''); setDescription('');
      alert('✅ فاکتور ثبت شد!');
    };

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">{type === 'purchase' ? '🛒 فاکتور خرید' : '💰 فاکتور فروش'}</h2>
        
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1">{type === 'purchase' ? 'تأمین‌کننده' : 'مشتری'} *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">انتخاب...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">نوع پرداخت</label>
              <div className="flex gap-2">
                <button onClick={() => setPaymentType('cash')} className={`flex-1 py-2 rounded-xl ${paymentType === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>💵 نقدی</button>
                <button onClick={() => setPaymentType('installment')} className={`flex-1 py-2 rounded-xl ${paymentType === 'installment' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>💳 اقساطی</button>
              </div>
            </div>
          </div>

          {paymentType === 'installment' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">پیش‌پرداخت</label>
                <input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">تعداد اقساط</label>
                <select value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  {[3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} ماه</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-lg font-bold mb-3">افزودن کالا</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); const p = products.find(x => x.id === e.target.value); if (p) setUnitPrice(type === 'purchase' ? p.buyPrice.toString() : p.sellPrice.toString()); }} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">کالا...</option>
                {products.map(p => <option key={p.id} value={p.id}>{getProductName(p)}</option>)}
              </select>
              <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="تعداد" />
              <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="قیمت واحد" />
              <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">➕ افزودن</button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-4 space-y-2">
              {items.map(item => (
                <div key={item.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white">{item.productName}</p>
                    <p className="text-slate-400 text-xs">{item.quantity} × {formatNumber(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">{formatNumber(item.total)}</span>
                    <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-rose-400">✕</button>
                  </div>
                </div>
              ))}
              <div className="bg-blue-600/20 rounded-xl p-4 text-center">
                <span className="text-blue-300">جمع کل: </span>
                <span className="text-white text-2xl font-bold">{formatNumber(total)} تومان</span>
              </div>
            </div>
          )}

          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات" rows={2} className="mt-4 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          <button onClick={submitInvoice} disabled={!customerId || items.length === 0} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">✓ ثبت فاکتور</button>
        </div>
      </div>
    );
  };

  // Invoice List
  const InvoiceList = () => {
    const [filter, setFilter] = useState<'all' | 'purchase' | 'sale'>('all');
    const filtered = filter === 'all' ? invoices : invoices.filter(i => i.type === filter);

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📋 لیست فاکتورها</h2>
        
        <div className="flex gap-2">
          {[['all', 'همه'], ['purchase', 'خرید'], ['sale', 'فروش']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as any)} className={`px-4 py-2 rounded-xl ${filter === v ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>{l}</button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map(inv => {
            const customer = customers.find(c => c.id === inv.customerId);
            return (
              <div key={inv.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-bold">{inv.invoiceNumber}</p>
                    <p className="text-slate-400 text-sm">{customer?.name} | {inv.date}</p>
                    <p className="text-slate-500 text-xs">{inv.items.length} کالا | {inv.paymentType === 'cash' ? 'نقدی' : 'اقساطی'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-emerald-400 font-bold">{formatNumber(inv.total)} تومان</p>
                    {inv.remaining > 0 && <p className="text-rose-400 text-sm">باقیمانده: {formatNumber(inv.remaining)}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Settings
  const Settings = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">⚙️ تنظیمات</h2>
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold mb-4">پشتیبان‌گیری و بازیابی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 پشتیبان‌گیری</button>
          <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center cursor-pointer">
            📥 بازیابی
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventoryManager />;
      case 'customers': return <CustomerManager />;
      case 'invoice-purchase': return <InvoiceForm type="purchase" />;
      case 'invoice-sale': return <InvoiceForm type="sale" />;
      case 'invoices': return <InvoiceList />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 w-64 z-40">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
            <div><h2 className="text-white font-bold text-sm">حسابداری فروشگاه</h2><p className="text-slate-400 text-xs">نسخه 3.0</p></div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {[
            { id: 'dashboard', label: 'داشبورد', icon: '🏠' },
            { id: 'inventory', label: 'کالا و انبار', icon: '🏭' },
            { id: 'customers', label: 'اشخاص', icon: '👥' },
            { id: 'invoice-purchase', label: 'فاکتور خرید', icon: '🛒' },
            { id: 'invoice-sale', label: 'فاکتور فروش', icon: '💰' },
            { id: 'invoices', label: 'لیست فاکتورها', icon: '📋' },
            { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === item.id ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800/50'}`}>
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="lg:mr-64">
        <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
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

        <main className="max-w-7xl mx-auto px-4 py-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
