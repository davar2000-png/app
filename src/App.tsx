import { useState, useEffect } from 'react';
import type {
  Person, Product, ProductItem, Invoice, InvoiceItem, Installment,
  Cheque, Bank, BankTransaction, ProductCategory, ProductBrand, ProductModel, ProductColor,
  AuditLog, Section
} from './types';
import {
  generateId, formatNumber, formatCurrency, getTodayDate,
  generateInvoiceNumber, generateProductCode, jalaliDate, isOverdue, daysUntil
} from './utils';

function useLS<T>(key: string, init: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : init; }
    catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

export default function App() {
  const [people, setPeople] = useLS<Person[]>('tk_people', []);
  const [products, setProducts] = useLS<Product[]>('tk_products', []);
  const [productItems, setProductItems] = useLS<ProductItem[]>('tk_product_items', []);
  const [invoices, setInvoices] = useLS<Invoice[]>('tk_invoices', []);
  const [cheques, setCheques] = useLS<Cheque[]>('tk_cheques', []);
  const [banks, setBanks] = useLS<Bank[]>('tk_banks', []);
  const [categories, setCategories] = useLS<ProductCategory[]>('tk_categories', [
    { id: 'phone', name: 'گوشی موبایل', icon: '📱' },
    { id: 'laptop', name: 'لپ‌تاپ', icon: '💻' },
    { id: 'console', name: 'کنسول بازی', icon: '🎮' },
    { id: 'printer', name: 'پرینتر', icon: '🖨️' },
    { id: 'misc', name: 'متفرقه', icon: '📦' },
  ]);
  const [brands, setBrands] = useLS<ProductBrand[]>('tk_brands', [
    { id: 'apple', categoryId: 'phone', name: 'Apple' },
    { id: 'samsung', categoryId: 'phone', name: 'Samsung' },
    { id: 'xiaomi', categoryId: 'phone', name: 'Xiaomi' },
    { id: 'hp', categoryId: 'laptop', name: 'HP' },
    { id: 'dell', categoryId: 'laptop', name: 'Dell' },
    { id: 'asus', categoryId: 'laptop', name: 'ASUS' },
    { id: 'lenovo', categoryId: 'laptop', name: 'Lenovo' },
    { id: 'ps5', categoryId: 'console', name: 'PS5' },
    { id: 'hp-p', categoryId: 'printer', name: 'HP' },
    { id: 'canon', categoryId: 'printer', name: 'Canon' },
    { id: 'brother', categoryId: 'printer', name: 'Brother' },
  ]);
  const [models, setModels] = useLS<ProductModel[]>('tk_models', []);
  const [colors, setColors] = useLS<ProductColor[]>('tk_colors', [
    { id: 'black', name: 'مشکی', code: '#000000' },
    { id: 'white', name: 'سفید', code: '#ffffff' },
    { id: 'blue', name: 'آبی', code: '#3b82f6' },
    { id: 'red', name: 'قرمز', code: '#ef4444' },
    { id: 'gold', name: 'طلایی', code: '#f59e0b' },
  ]);
  const [auditLog, setAuditLog] = useLS<AuditLog[]>('tk_audit', []);
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const log = (action: string, entityType: string, entityId: string) => {
    setAuditLog(prev => [{ id: generateId(), action, entityType, entityId, timestamp: new Date().toISOString() }, ...prev].slice(0, 1000));
  };

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name || 'نامشخص';
  const getProductName = (p: Product) => {
    const b = brands.find(x => x.id === p.brandId)?.name || '';
    const m = models.find(x => x.id === p.modelId)?.name || '';
    return [b, m, p.color, p.ram && `${p.ram}GB`, p.storage && `${p.storage}GB`].filter(Boolean).join(' - ');
  };

  // ===== DASHBOARD =====
  const Dashboard = () => {
    const today = getTodayDate();
    const todayInv = invoices.filter(i => i.date === today && i.status === 'active');
    const todaySales = todayInv.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
    const todayPurchases = todayInv.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
    const totalDebt = invoices.filter(i => i.status === 'active').reduce((s, i) => s + i.remaining, 0);
    const totalProfit = invoices.filter(i => i.type === 'sale' && i.status === 'active')
      .reduce((s, inv) => s + inv.items.reduce((ss, it) => ss + (it.profit || 0), 0), 0);
    const lowStock = products.filter(p => p.stock <= p.minStock);
    const overdueCheques = cheques.filter(c => c.type === 'received' && c.status === 'pending' && isOverdue(c.dueDate));
    const overdueInst = invoices.flatMap(i => i.installments || []).filter(i => i.status === 'pending' && isOverdue(i.dueDate));
    const invValue = products.reduce((s, p) => s + (p.stock * p.buyPrice), 0);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">🏠 داشبورد</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">فروش امروز</span><span className="text-xl">💰</span></div>
            <p className="text-xl font-bold">{formatNumber(todaySales)}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">خرید امروز</span><span className="text-xl">🛒</span></div>
            <p className="text-xl font-bold">{formatNumber(todayPurchases)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">سود کل</span><span className="text-xl">📈</span></div>
            <p className="text-xl font-bold">{formatNumber(totalProfit)}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">بدهی کل</span><span className="text-xl">💳</span></div>
            <p className="text-xl font-bold">{formatNumber(totalDebt)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">تعداد کالا</span><span className="text-xl">📦</span></div>
            <p className="text-xl font-bold">{formatNumber(products.length)}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">تعداد اشخاص</span><span className="text-xl">👥</span></div>
            <p className="text-xl font-bold">{formatNumber(people.length)}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">ارزش انبار</span><span className="text-xl">🏭</span></div>
            <p className="text-xl font-bold">{formatNumber(invValue)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">چک معوق</span><span className="text-xl">📝</span></div>
            <p className="text-xl font-bold">{formatNumber(overdueCheques.length)}</p>
          </div>
        </div>

        {overdueInst.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
            <h3 className="text-rose-400 font-bold mb-2">⚠️ اقساط معوق ({overdueInst.length})</h3>
            <div className="space-y-1">
              {overdueInst.slice(0, 5).map(i => (
                <div key={i.id} className="flex justify-between text-sm text-slate-300">
                  <span>سررسید: {jalaliDate(i.dueDate)}</span>
                  <span className="text-rose-400">{formatCurrency(i.amount - i.paidAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStock.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <h3 className="text-amber-400 font-bold mb-2">⚠️ کالاهای کم‌موجود ({lowStock.length})</h3>
            <div className="space-y-1">
              {lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="flex justify-between text-sm text-slate-300">
                  <span>{getProductName(p)}</span>
                  <span className="text-amber-400">موجودی: {p.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== PEOPLE =====
  const PeopleSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [form, setForm] = useState<Partial<Person>>({ type: 'customer', creditor: 0, debtor: 0 });
    const [editId, setEditId] = useState<string | null>(null);

    const filtered = people.filter(p => {
      const matchSearch = !search || p.name.includes(search) || p.mobile?.includes(search) || p.nationalId?.includes(search) || p.phone?.includes(search);
      const matchFilter = filter === 'all' || p.type === filter;
      return matchSearch && matchFilter;
    });

    const save = () => {
      if (!form.name || !form.mobile) return alert('نام و موبایل الزامی است');
      if (editId) {
        setPeople(prev => prev.map(p => p.id === editId ? { ...p, ...form } as Person : p));
        log('UPDATE', 'person', editId);
      } else {
        const newP: Person = { ...form, id: generateId(), creditor: 0, debtor: 0, createdAt: new Date().toISOString() } as Person;
        setPeople(prev => [newP, ...prev]);
        log('CREATE', 'person', newP.id);
      }
      setForm({ type: 'customer', creditor: 0, debtor: 0 });
      setShowForm(false);
      setEditId(null);
    };

    const edit = (p: Person) => { setForm(p); setEditId(p.id); setShowForm(true); };
    const del = (id: string) => { if (confirm('حذف شود؟')) { setPeople(prev => prev.filter(p => p.id !== id)); log('DELETE', 'person', id); } };

    const typeLabel = (t: string) => ({ customer: 'مشتری', supplier: 'تأمین‌کننده', guarantor: 'ضامن', employee: 'کارمند', other: 'سایر' }[t] || t);
    const typeBadgeClass = (t: string) => ({
      customer: 'bg-blue-500/20 text-blue-400',
      supplier: 'bg-emerald-500/20 text-emerald-400',
      guarantor: 'bg-amber-500/20 text-amber-400',
      employee: 'bg-violet-500/20 text-violet-400',
      other: 'bg-slate-500/20 text-slate-400',
    }[t] || 'bg-slate-500/20 text-slate-400');

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">👥 مدیریت اشخاص</h2>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ type: 'customer', creditor: 0, debtor: 0 }); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕ بستن' : '➕ شخص جدید'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">{editId ? '✏️ ویرایش' : '➕ ثبت'} شخص</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="customer">مشتری</option>
                <option value="supplier">تأمین‌کننده</option>
                <option value="guarantor">ضامن</option>
                <option value="employee">کارمند</option>
                <option value="other">سایر</option>
              </select>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="نام *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.familyName || ''} onChange={e => setForm({ ...form, familyName: e.target.value })} placeholder="نام خانوادگی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="موبایل *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="تلفن" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.nationalId || ''} onChange={e => setForm({ ...form, nationalId: e.target.value })} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.job || ''} onChange={e => setForm({ ...form, job: e.target.value })} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.employeeId || ''} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="شماره کارمندی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.bankCard || ''} onChange={e => setForm({ ...form, bankCard: e.target.value })} placeholder="شماره کارت بانکی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="شهر" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="آدرس" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white md:col-span-2" />
            </div>
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="توضیحات" rows={2} className="mt-3 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={save} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 جستجو..." className="flex-1 min-w-48 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          {['all', 'customer', 'supplier', 'guarantor', 'employee'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-3 py-2 rounded-xl text-sm ${filter === t ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
              {t === 'all' ? 'همه' : typeLabel(t)}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">{filtered.length} نفر</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(p => (
              <div key={p.id} className="p-3 hover:bg-slate-700/20 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {p.image ? <img src={p.image} className="w-10 h-10 rounded-xl object-cover" /> :
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">👤</div>}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{p.name} {p.familyName || ''}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeClass(p.type)}`}>{typeLabel(p.type)}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex gap-3">
                      {p.mobile && <span>📱 {p.mobile}</span>}
                      {p.job && <span>💼 {p.job}</span>}
                      {p.city && <span>🏙️ {p.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(p.debtor || 0) > 0 && <span className="text-rose-400 text-sm">بدهی: {formatNumber(p.debtor || 0)}</span>}
                  <button onClick={() => edit(p)} className="opacity-0 group-hover:opacity-100 text-amber-400 px-2">✏️</button>
                  <button onClick={() => del(p.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 px-2">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ===== INVENTORY =====
  const InventorySection = () => {
    const [tab, setTab] = useState<'add' | 'list' | 'cat' | 'brand' | 'model' | 'color'>('add');
    const [pCat, setPCat] = useState(''); const [pBrand, setPBrand] = useState(''); const [pModel, setPModel] = useState('');
    const [pColor, setPColor] = useState(''); const [pRam, setPRam] = useState(''); const [pStorage, setPStorage] = useState('');
    const [pBuy, setPBuy] = useState(''); const [pSell, setPSell] = useState(''); const [pStock, setPStock] = useState('0');
    const [pMin, setPMin] = useState('0'); const [pReorder, setPReorder] = useState('0'); const [pNeg, setPNeg] = useState(false);
    const [newCat, setNewCat] = useState({ name: '', icon: '📦' });
    const [newBrand, setNewBrand] = useState({ name: '', categoryId: '' });
    const [newModel, setNewModel] = useState({ name: '', brandId: '' });
    const [newColor, setNewColor] = useState({ name: '', code: '#000000' });

    const addProduct = () => {
      if (!pCat || !pBrand || !pModel || !pBuy || !pSell) return alert('فیلدهای ستاره‌دار الزامی است');
      const p: Product = {
        id: generateId(), code: generateProductCode(), name: '', categoryId: pCat, brandId: pBrand, modelId: pModel,
        color: colors.find(c => c.id === pColor)?.name, ram: pRam, storage: pStorage,
        buyPrice: Number(pBuy), sellPrice: Number(pSell), stock: Number(pStock),
        minStock: Number(pMin), reorderPoint: Number(pReorder), allowNegativeStock: pNeg,
        createdAt: new Date().toISOString(),
      };
      p.name = getProductName(p);
      setProducts(prev => [p, ...prev]);
      log('CREATE', 'product', p.id);
      setPCat(''); setPBrand(''); setPModel(''); setPColor(''); setPRam(''); setPStorage('');
      setPBuy(''); setPSell(''); setPStock('0'); setPMin('0'); setPReorder('0'); setPNeg(false);
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🏭 کالا و انبار</h2>
        <div className="flex gap-2 flex-wrap border-b border-slate-700 pb-2">
          {([['add', '➕ ثبت کالا'], ['list', '📋 لیست'], ['cat', '📁 گروه‌ها'], ['brand', '🏷️ برندها'], ['model', '📱 مدل‌ها'], ['color', '🎨 رنگ‌ها']] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-sm ${tab === id ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>{l}</button>
          ))}
        </div>

        {tab === 'add' && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-slate-400 text-xs">گروه *</label>
                <select value={pCat} onChange={e => { setPCat(e.target.value); setPBrand(''); setPModel(''); }} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  <option value="">انتخاب...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">برند *</label>
                <select value={pBrand} onChange={e => { setPBrand(e.target.value); setPModel(''); }} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!pCat}>
                  <option value="">انتخاب...</option>{brands.filter(b => b.categoryId === pCat).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">مدل *</label>
                <select value={pModel} onChange={e => setPModel(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!pBrand}>
                  <option value="">انتخاب...</option>{models.filter(m => m.brandId === pBrand).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">رنگ</label>
                <select value={pColor} onChange={e => setPColor(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  <option value="">انتخاب...</option>{colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">رم (GB)</label>
                <input value={pRam} onChange={e => setPRam(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">حافظه (GB)</label>
                <input value={pStorage} onChange={e => setPStorage(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">قیمت خرید *</label>
                <input type="number" value={pBuy} onChange={e => setPBuy(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">قیمت فروش *</label>
                <input type="number" value={pSell} onChange={e => setPSell(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">موجودی</label>
                <input type="number" value={pStock} onChange={e => setPStock(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">حداقل موجودی</label>
                <input type="number" value={pMin} onChange={e => setPMin(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">نقطه سفارش</label>
                <input type="number" value={pReorder} onChange={e => setPReorder(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div className="flex items-end gap-2 pb-2">
                <input type="checkbox" checked={pNeg} onChange={e => setPNeg(e.target.checked)} className="w-5 h-5" id="neg" />
                <label htmlFor="neg" className="text-slate-300 text-sm">موجودی منفی مجاز</label>
              </div>
            </div>
            <button onClick={addProduct} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">✓ ثبت کالا</button>
          </div>
        )}

        {tab === 'list' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50"><span className="text-slate-400 text-sm">{products.length} کالا</span></div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
              {products.map(p => (
                <div key={p.id} className="p-3 hover:bg-slate-700/20 flex justify-between items-center group">
                  <div>
                    <p className="text-white font-medium">{getProductName(p)}</p>
                    <p className="text-slate-400 text-xs">کد: {p.code} | موجودی: {p.stock} | خرید: {formatNumber(p.buyPrice)} | فروش: {formatNumber(p.sellPrice)}</p>
                  </div>
                  <button onClick={() => { if (confirm('حذف؟')) { setProducts(prev => prev.filter(x => x.id !== p.id)); log('DELETE', 'product', p.id); } }}
                    className="opacity-0 group-hover:opacity-100 text-rose-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cat' && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex gap-2 mb-4">
              <input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="نام گروه" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} className="w-16 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white text-center text-xl" />
              <button onClick={() => { if (newCat.name) { setCategories([...categories, { id: generateId(), ...newCat }]); setNewCat({ name: '', icon: '📦' }); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            {categories.map(c => (
              <div key={c.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between items-center">
                <span className="text-white">{c.icon} {c.name}</span>
                <button onClick={() => { if (confirm('حذف؟')) setCategories(categories.filter(x => x.id !== c.id)) }} className="text-rose-400">🗑️</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'brand' && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex gap-2 mb-4">
              <select value={newBrand.categoryId} onChange={e => setNewBrand({ ...newBrand, categoryId: e.target.value })} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">گروه...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} placeholder="نام برند" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <button onClick={() => { if (newBrand.categoryId && newBrand.name) { setBrands([...brands, { id: generateId(), ...newBrand }]); setNewBrand({ name: '', categoryId: '' }); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            {brands.map(b => {
              const cat = categories.find(c => c.id === b.categoryId);
              return (
                <div key={b.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between items-center">
                  <span className="text-white">{cat?.icon} {b.name} ({cat?.name})</span>
                  <button onClick={() => { if (confirm('حذف؟')) setBrands(brands.filter(x => x.id !== b.id)) }} className="text-rose-400">🗑️</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'model' && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex gap-2 mb-4">
              <select value={newModel.brandId} onChange={e => setNewModel({ ...newModel, brandId: e.target.value })} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">برند...</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} placeholder="نام مدل" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <button onClick={() => { if (newModel.brandId && newModel.name) { setModels([...models, { id: generateId(), ...newModel }]); setNewModel({ name: '', brandId: '' }); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            {models.map(m => {
              const brand = brands.find(b => b.id === m.brandId);
              return (
                <div key={m.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between items-center">
                  <span className="text-white">{brand?.name} - {m.name}</span>
                  <button onClick={() => { if (confirm('حذف؟')) setModels(models.filter(x => x.id !== m.id)) }} className="text-rose-400">🗑️</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'color' && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex gap-2 mb-4">
              <input value={newColor.name} onChange={e => setNewColor({ ...newColor, name: e.target.value })} placeholder="نام رنگ" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="color" value={newColor.code} onChange={e => setNewColor({ ...newColor, code: e.target.value })} className="w-16 h-10 bg-slate-700/50 border border-slate-600 rounded-xl cursor-pointer" />
              <button onClick={() => { if (newColor.name) { setColors([...colors, { id: generateId(), ...newColor }]); setNewColor({ name: '', code: '#000000' }); } }} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {colors.map(c => (
                <div key={c.id} className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c.code }} />
                    <span className="text-white text-sm">{c.name}</span>
                  </div>
                  <button onClick={() => { if (confirm('حذف؟')) setColors(colors.filter(x => x.id !== c.id)) }} className="text-rose-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== INVOICE FORM =====
  const InvoiceForm = ({ type }: { type: 'purchase' | 'sale' }) => {
    const [personId, setPersonId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [selProduct, setSelProduct] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState('');
    const [payType, setPayType] = useState<'cash' | 'installment'>('cash');
    const [downPay, setDownPay] = useState('');
    const [months, setMonths] = useState(6);
    const [desc, setDesc] = useState('');
    const [discount, setDiscount] = useState(0);

    const addItem = () => {
      const p = products.find(x => x.id === selProduct);
      if (!p || !price) return;
      const buyP = p.buyPrice;
      const sellP = Number(price);
      const item: InvoiceItem = {
        id: generateId(), productId: p.id, productName: getProductName(p),
        quantity: qty, unitPrice: sellP, buyPrice: buyP,
        total: qty * sellP, profit: type === 'sale' ? (sellP - buyP) * qty : 0,
      };
      setItems([...items, item]);
      setSelProduct(''); setQty(1); setPrice('');
    };

    const total = items.reduce((s, i) => s + i.total, 0);
    const finalTotal = total - discount;

    const submit = () => {
      if (!personId || items.length === 0) return alert('شخص و کالا الزامی است');
      const paid = payType === 'cash' ? finalTotal : Number(downPay) || 0;
      let installments: Installment[] | undefined;
      if (payType === 'installment' && paid < finalTotal) {
        const remaining = finalTotal - paid;
        const instAmount = Math.round(remaining / months);
        const today = new Date();
        installments = Array.from({ length: months }, (_, i) => {
          const d = new Date(today); d.setMonth(d.getMonth() + i + 1);
          return {
            id: generateId(), amount: i === months - 1 ? remaining - instAmount * (months - 1) : instAmount,
            dueDate: d.toISOString().split('T')[0], paidAmount: 0, status: 'pending' as const,
          };
        });
      }
      const inv: Invoice = {
        id: generateId(), invoiceNumber: generateInvoiceNumber(type), type, personId, items,
        total: finalTotal, discount, paid, remaining: finalTotal - paid,
        paymentType: payType, installments, status: 'active', description: desc,
        date: getTodayDate(), createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [inv, ...prev]);
      items.forEach(it => {
        setProducts(prev => prev.map(p => {
          if (p.id === it.productId) {
            const newStock = type === 'sale' ? p.stock - it.quantity : p.stock + it.quantity;
            return { ...p, stock: newStock };
          }
          return p;
        }));
      });
      log('CREATE', 'invoice', inv.id);
      setPersonId(''); setItems([]); setDownPay(''); setDesc(''); setDiscount(0);
      alert(`✅ فاکتور ${inv.invoiceNumber} ثبت شد`);
    };

    const personType = type === 'purchase' ? 'supplier' : 'customer';
    const availPeople = people.filter(p => p.type === personType || p.type === 'other');

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{type === 'purchase' ? '🛒 فاکتور خرید' : '💰 فاکتور فروش'}</h2>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-400 text-xs">{type === 'purchase' ? 'تأمین‌کننده' : 'مشتری'} *</label>
              <select value={personId} onChange={e => setPersonId(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">انتخاب...</option>
                {availPeople.map(p => <option key={p.id} value={p.id}>{p.name} - {p.mobile}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs">نوع پرداخت</label>
              <div className="flex gap-2">
                <button onClick={() => setPayType('cash')} className={`flex-1 py-2 rounded-xl ${payType === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>💵 نقدی</button>
                <button onClick={() => setPayType('installment')} className={`flex-1 py-2 rounded-xl ${payType === 'installment' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>💳 اقساطی</button>
              </div>
            </div>
          </div>
          {payType === 'installment' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="text-slate-400 text-xs">پیش‌پرداخت</label>
                <input type="number" value={downPay} onChange={e => setDownPay(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">تعداد اقساط</label>
                <select value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  {[3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} ماه</option>)}
                </select></div>
            </div>
          )}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-lg font-bold mb-3">افزودن کالا</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={selProduct} onChange={e => { setSelProduct(e.target.value); const p = products.find(x => x.id === e.target.value); if (p) setPrice(type === 'purchase' ? p.buyPrice.toString() : p.sellPrice.toString()); }} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">کالا...</option>{products.map(p => <option key={p.id} value={p.id}>{getProductName(p)} (موجودی: {p.stock})</option>)}
              </select>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min="1" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="تعداد" />
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="قیمت واحد" />
              <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">➕</button>
            </div>
          </div>
          {items.length > 0 && (
            <div className="mt-4 space-y-2">
              {items.map(it => (
                <div key={it.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                  <div><p className="text-white">{it.productName}</p><p className="text-slate-400 text-xs">{it.quantity} × {formatNumber(it.unitPrice)}</p></div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">{formatNumber(it.total)}</span>
                    <button onClick={() => setItems(items.filter(i => i.id !== it.id))} className="text-rose-400">✕</button>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 items-center">
                <label className="text-slate-400 text-sm">تخفیف:</label>
                <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-32 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-1 text-white" />
              </div>
              <div className="bg-blue-600/20 rounded-xl p-4 text-center">
                <span className="text-blue-300">جمع کل: </span>
                <span className="text-white text-2xl font-bold">{formatNumber(finalTotal)} تومان</span>
              </div>
            </div>
          )}
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="توضیحات" rows={2} className="mt-4 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          <button onClick={submit} disabled={!personId || items.length === 0} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">✓ ثبت فاکتور</button>
        </div>
      </div>
    );
  };

  // ===== INVOICE LIST =====
  const InvoiceList = () => {
    const [filter, setFilter] = useState<'all' | 'purchase' | 'sale'>('all');
    const [search, setSearch] = useState('');
    const filtered = invoices.filter(i => {
      const matchType = filter === 'all' || i.type === filter;
      const matchSearch = !search || i.invoiceNumber.includes(search) || getPersonName(i.personId).includes(search);
      return matchType && matchSearch && i.status === 'active';
    });

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📋 لیست فاکتورها</h2>
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 جستجو..." className="flex-1 min-w-48 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          {([['all', 'همه'], ['sale', 'فروش'], ['purchase', 'خرید']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-xl ${filter === v ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>{l}</button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map(inv => (
            <div key={inv.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{inv.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.type === 'sale' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {inv.type === 'sale' ? 'فروش' : 'خرید'}
                    </span>
                    {inv.paymentType === 'installment' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">اقساطی</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{getPersonName(inv.personId)} | {jalaliDate(inv.date)}</p>
                  <p className="text-slate-500 text-xs">{inv.items.length} کالا</p>
                </div>
                <div className="text-left">
                  <p className="text-emerald-400 font-bold">{formatNumber(inv.total)} تومان</p>
                  {inv.remaining > 0 && <p className="text-rose-400 text-sm">باقیمانده: {formatNumber(inv.remaining)}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== CHEQUES =====
  const ChequesSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<Cheque>>({ type: 'received', status: 'pending' });

    const save = () => {
      if (!form.chequeNumber || !form.bankName || !form.amount || !form.dueDate) return alert('فیلدهای الزامی را پر کنید');
      const c: Cheque = { ...form, id: generateId(), amount: Number(form.amount), createdAt: new Date().toISOString() } as Cheque;
      setCheques(prev => [c, ...prev]);
      log('CREATE', 'cheque', c.id);
      setForm({ type: 'received', status: 'pending' });
      setShowForm(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📝 مدیریت چک‌ها</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕ بستن' : '➕ چک جدید'}
          </button>
        </div>
        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="received">دریافتی</option><option value="paid">پرداختی</option>
              </select>
              <input value={form.chequeNumber || ''} onChange={e => setForm({ ...form, chequeNumber: e.target.value })} placeholder="شماره چک *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.bankName || ''} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="بانک *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} placeholder="مبلغ *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.issuerName || ''} onChange={e => setForm({ ...form, issuerName: e.target.value })} placeholder="صادرکننده" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="date" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <button onClick={save} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
          </div>
        )}
        <div className="space-y-2">
          {cheques.map(c => (
            <div key={c.id} className={`bg-slate-800/60 rounded-2xl p-4 border ${c.type === 'received' ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {c.type === 'received' ? 'دریافتی' : 'پرداختی'}
                    </span>
                    <span className="text-white font-bold">{c.bankName} - {c.chequeNumber}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{c.issuerName} | سررسید: {jalaliDate(c.dueDate)}</p>
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">{formatNumber(c.amount)} تومان</p>
                  {isOverdue(c.dueDate) && c.status === 'pending' && <p className="text-rose-400 text-xs">⚠️ معوق</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== INSTALLMENTS =====
  const InstallmentsSection = () => {
    const allInst = invoices.flatMap(inv =>
      (inv.installments || []).map(inst => ({ ...inst, invoiceNumber: inv.invoiceNumber, personName: getPersonName(inv.personId), invoiceId: inv.id }))
    );
    const pending = allInst.filter(i => i.status === 'pending');
    const overdue = pending.filter(i => isOverdue(i.dueDate));

    const payInstallment = (invId: string, instId: string) => {
      setInvoices(prev => prev.map(inv => {
        if (inv.id !== invId) return inv;
        const newInst = inv.installments?.map(i => i.id === instId ? { ...i, status: 'paid' as const, paidAmount: i.amount, paidDate: getTodayDate() } : i);
        const newPaid = inv.paid + (inv.installments?.find(i => i.id === instId)?.amount || 0);
        return { ...inv, installments: newInst, paid: newPaid, remaining: inv.total - newPaid };
      }));
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">💳 اقساط</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-600/20 rounded-2xl p-4 text-center">
            <p className="text-blue-300 text-sm">کل اقساط</p>
            <p className="text-2xl font-bold text-white">{pending.length}</p>
          </div>
          <div className="bg-rose-600/20 rounded-2xl p-4 text-center">
            <p className="text-rose-300 text-sm">معوق</p>
            <p className="text-2xl font-bold text-rose-400">{overdue.length}</p>
          </div>
          <div className="bg-emerald-600/20 rounded-2xl p-4 text-center">
            <p className="text-emerald-300 text-sm">مبلغ معوق</p>
            <p className="text-lg font-bold text-emerald-400">{formatNumber(overdue.reduce((s, i) => s + i.amount, 0))}</p>
          </div>
        </div>
        <div className="space-y-2">
          {pending.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(inst => (
            <div key={inst.id} className={`bg-slate-800/60 rounded-2xl p-4 border ${isOverdue(inst.dueDate) ? 'border-rose-500/30' : 'border-slate-700/50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{inst.personName} - {inst.invoiceNumber}</p>
                  <p className="text-slate-400 text-sm">سررسید: {jalaliDate(inst.dueDate)} {isOverdue(inst.dueDate) && <span className="text-rose-400">(معوق)</span>}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{formatNumber(inst.amount)} تومان</span>
                  <button onClick={() => payInstallment(inst.invoiceId, inst.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm">✓ پرداخت</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== BANKS =====
  const BanksSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<Bank>>({ balance: 0 });

    const save = () => {
      if (!form.name || !form.accountNumber) return alert('نام و شماره حساب الزامی است');
      const b: Bank = { ...form, id: generateId(), balance: Number(form.balance) || 0, createdAt: new Date().toISOString() } as Bank;
      setBanks(prev => [b, ...prev]);
      setForm({ balance: 0 }); setShowForm(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🏦 بانک‌ها</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕' : '➕ حساب جدید'}
          </button>
        </div>
        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="نام بانک *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.accountNumber || ''} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="شماره حساب *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={form.balance || ''} onChange={e => setForm({ ...form, balance: Number(e.target.value) })} placeholder="موجودی اولیه" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <button onClick={save} className="mt-3 w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">💾 ذخیره</button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {banks.map(b => (
            <div key={b.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{b.name}</p>
                  <p className="text-slate-400 text-sm">{b.accountNumber}</p>
                </div>
                <p className="text-emerald-400 font-bold">{formatNumber(b.balance)} تومان</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== REPORTS =====
  const ReportsSection = () => {
    const activeInvoices = invoices.filter(i => i.status === 'active');
    const sales = activeInvoices.filter(i => i.type === 'sale');
    const purchases = activeInvoices.filter(i => i.type === 'purchase');
    const totalSales = sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);
    const totalProfit = sales.reduce((s, inv) => s + inv.items.reduce((ss, it) => ss + (it.profit || 0), 0), 0);
    const totalReceived = cheques.filter(c => c.type === 'received').reduce((s, c) => s + c.amount, 0);
    const totalPaid = cheques.filter(c => c.type === 'paid').reduce((s, c) => s + c.amount, 0);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📊 گزارش‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-3">💰 خلاصه مالی</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">کل فروش:</span><span className="text-emerald-400 font-bold">{formatCurrency(totalSales)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">کل خرید:</span><span className="text-rose-400 font-bold">{formatCurrency(totalPurchases)}</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-300 font-bold">سود خالص:</span><span className="text-amber-400 font-bold">{formatCurrency(totalProfit)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">تعداد فاکتور فروش:</span><span className="text-white">{sales.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">تعداد فاکتور خرید:</span><span className="text-white">{purchases.length}</span></div>
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-3">📝 چک‌ها</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">چک دریافتی:</span><span className="text-emerald-400 font-bold">{formatCurrency(totalReceived)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">چک پرداختی:</span><span className="text-rose-400 font-bold">{formatCurrency(totalPaid)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">چک معوق:</span><span className="text-rose-400 font-bold">{cheques.filter(c => c.status === 'pending' && isOverdue(c.dueDate)).length}</span></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-3">📦 وضعیت انبار</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">تعداد کالاها:</span><span className="text-white">{products.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">ارزش انبار:</span><span className="text-white font-bold">{formatCurrency(products.reduce((s, p) => s + p.stock * p.buyPrice, 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">کالاهای کم‌موجود:</span><span className="text-amber-400">{products.filter(p => p.stock <= p.minStock).length}</span></div>
          </div>
        </div>
      </div>
    );
  };

  // ===== SETTINGS =====
  const SettingsSection = () => {
    const handleExport = () => {
      const data = { people, products, productItems, invoices, cheques, banks, categories, brands, models, colors, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `backup-${getTodayDate()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.people) setPeople(data.people);
          if (data.products) setProducts(data.products);
          if (data.invoices) setInvoices(data.invoices);
          if (data.cheques) setCheques(data.cheques);
          if (data.banks) setBanks(data.banks);
          alert('✅ بازیابی شد!');
        } catch { alert('❌ خطا'); }
      };
      reader.readAsText(file);
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">⚙️ تنظیمات</h2>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">پشتیبان‌گیری و بازیابی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 پشتیبان‌گیری</button>
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center cursor-pointer">
              📥 بازیابی<input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">📊 آمار سیستم</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center"><p className="text-2xl font-bold text-white">{people.length}</p><p className="text-slate-400 text-sm">شخص</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-white">{products.length}</p><p className="text-slate-400 text-sm">کالا</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-white">{invoices.length}</p><p className="text-slate-400 text-sm">فاکتور</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-white">{cheques.length}</p><p className="text-slate-400 text-sm">چک</p></div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventorySection />;
      case 'people': return <PeopleSection />;
      case 'purchase': return <InvoiceForm type="purchase" />;
      case 'sale': return <InvoiceForm type="sale" />;
      case 'invoices': return <InvoiceList />;
      case 'cheques': return <ChequesSection />;
      case 'installments': return <InstallmentsSection />;
      case 'banks': return <BanksSection />;
      case 'reports': return <ReportsSection />;
      case 'settings': return <SettingsSection />;
      default: return <Dashboard />;
    }
  };

  const menuItems: { id: Section; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: '🏠' },
    { id: 'inventory', label: 'کالا و انبار', icon: '🏭' },
    { id: 'people', label: 'اشخاص', icon: '👥' },
    { id: 'purchase', label: 'فاکتور خرید', icon: '🛒' },
    { id: 'sale', label: 'فاکتور فروش', icon: '💰' },
    { id: 'invoices', label: 'لیست فاکتورها', icon: '📋' },
    { id: 'cheques', label: 'چک‌ها', icon: '📝' },
    { id: 'installments', label: 'اقساط', icon: '💳' },
    { id: 'banks', label: 'بانک‌ها', icon: '🏦' },
    { id: 'reports', label: 'گزارش‌ها', icon: '📊' },
    { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16'} overflow-hidden`}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-xl shrink-0">🏪</div>
            {sidebarOpen && <div><h2 className="text-white font-bold text-sm">تکنوکالا</h2><p className="text-slate-400 text-xs">حسابداری فروشگاه</p></div>}
          </div>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-80px)]">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${section === item.id ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800/50'}`}>
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-16'}`}>
        <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700">☰</button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">🏪</div>
              <div><h1 className="text-lg font-bold">تکنوکالا</h1><p className="text-xs text-slate-500">سیستم حسابداری</p></div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{renderSection()}</main>
      </div>
    </div>
  );
}
