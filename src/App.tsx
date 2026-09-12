import { useState, useEffect, useRef } from 'react';
import type {
  Person, PersonDocument, PersonGroup, Guarantor, Product, SerialItem, CardexEntry,
  Invoice, InvoiceItem, Installment, Cheque, Bank,
  ProductCategory, ProductBrand, ProductModel, ProductColor,
  AuditLog, Section
} from './types';
import {
  generateId, formatNumber, formatCurrency, getTodayDate,
  generateInvoiceNumber, generateProductCode, jalaliDate, isOverdue, daysUntil, parseExcelFile
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
  const [personGroups, setPersonGroups] = useLS<PersonGroup[]>('tk_person_groups', [
    { id: 'vip', name: 'مشتریان VIP', color: '#f59e0b' },
    { id: 'regular', name: 'مشتریان عادی', color: '#3b82f6' },
    { id: 'wholesale', name: 'عمده‌فروشان', color: '#10b981' },
  ]);
  const [products, setProducts] = useLS<Product[]>('tk_products', []);
  const [serials, setSerials] = useLS<SerialItem[]>('tk_serials', []);
  const [cardex, setCardex] = useLS<CardexEntry[]>('tk_cardex', []);
  const [invoices, setInvoices] = useLS<Invoice[]>('tk_invoices', []);
  const [cheques, setCheques] = useLS<Cheque[]>('tk_cheques', []);
  const [banks, setBanks] = useLS<Bank[]>('tk_banks', []);
  const [categories, setCategories] = useLS<ProductCategory[]>('tk_cat', [
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
  const [audit, setAudit] = useLS<AuditLog[]>('tk_audit', []);
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const log = (action: AuditLog['action'], entityType: string, entityId: string, entityName?: string, details?: string) => {
    setAudit(prev => [{ id: generateId(), action, entityType, entityId, entityName, details, timestamp: new Date().toISOString() }, ...prev].slice(0, 5000));
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
    const activeInv = invoices.filter(i => i.status === 'active');
    const todaySales = activeInv.filter(i => i.date === today && i.type === 'sale').reduce((s, i) => s + i.total, 0);
    const todayPurchases = activeInv.filter(i => i.date === today && i.type === 'purchase').reduce((s, i) => s + i.total, 0);
    const totalDebt = activeInv.reduce((s, i) => s + i.remaining, 0);
    const totalProfit = activeInv.filter(i => i.type === 'sale').reduce((s, inv) => s + inv.items.reduce((ss, it) => ss + (it.profit || 0), 0), 0);
    const lowStock = products.filter(p => !p.isDeleted && p.stock <= p.minStock);
    const overdueCheques = cheques.filter(c => !c.isDeleted && c.type === 'received' && c.status === 'pending' && isOverdue(c.dueDate));
    const overdueInst = activeInv.flatMap(i => i.installments || []).filter(i => i.status === 'pending' && isOverdue(i.dueDate));
    const invValue = products.filter(p => !p.isDeleted).reduce((s, p) => s + (p.stock * p.buyPrice), 0);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">🏠 داشبورد</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'فروش امروز', v: formatNumber(todaySales), c: 'from-emerald-600 to-emerald-800', i: '💰' },
            { l: 'خرید امروز', v: formatNumber(todayPurchases), c: 'from-rose-600 to-rose-800', i: '🛒' },
            { l: 'سود کل', v: formatNumber(totalProfit), c: 'from-amber-600 to-amber-800', i: '📈' },
            { l: 'بدهی کل', v: formatNumber(totalDebt), c: 'from-violet-600 to-violet-800', i: '💳' },
            { l: 'کالاها', v: formatNumber(products.filter(p=>!p.isDeleted).length), c: 'from-blue-600 to-blue-800', i: '📦' },
            { l: 'اشخاص', v: formatNumber(people.filter(p=>!p.isDeleted).length), c: 'from-cyan-600 to-cyan-800', i: '👥' },
            { l: 'ارزش انبار', v: formatNumber(invValue), c: 'from-teal-600 to-teal-800', i: '🏭' },
            { l: 'سریال‌ها', v: formatNumber(serials.filter(s=>s.status==='in_stock').length), c: 'from-indigo-600 to-indigo-800', i: '📲' },
          ].map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.c} rounded-2xl p-4 text-white`}>
              <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">{c.l}</span><span className="text-xl">{c.i}</span></div>
              <p className="text-xl font-bold">{c.v}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueInst.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
              <h3 className="text-rose-400 font-bold mb-2">⚠️ اقساط معوق ({overdueInst.length})</h3>
              {overdueInst.slice(0, 5).map(i => (
                <div key={i.id} className="flex justify-between text-sm text-slate-300 py-1">
                  <span>سررسید: {jalaliDate(i.dueDate)}</span>
                  <span className="text-rose-400">{formatCurrency(i.amount - i.paidAmount)}</span>
                </div>
              ))}
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <h3 className="text-amber-400 font-bold mb-2">⚠️ کم‌موجود ({lowStock.length})</h3>
              {lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="flex justify-between text-sm text-slate-300 py-1">
                  <span>{getProductName(p)}</span>
                  <span className="text-amber-400">موجودی: {p.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== PEOPLE =====
  const PeopleSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [showGroupManager, setShowGroupManager] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [form, setForm] = useState<Partial<Person>>({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: '', name: '', documents: [] } });
    const [editId, setEditId] = useState<string | null>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [viewDocs, setViewDocs] = useState<{person: Person, type: 'person' | 'guarantor'} | null>(null);
    
    // Group management states
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

    const filtered = people.filter(p => !p.isDeleted && (
      (filter === 'all' || p.type === filter) &&
      (groupFilter === 'all' || p.groupId === groupFilter) &&
      (!search || p.name.includes(search) || p.mobile?.includes(search) || p.nationalId?.includes(search))
    ));

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const doc: PersonDocument = {
            id: generateId(), name: file.name, type: file.type,
            data: ev.target?.result as string, date: getTodayDate(),
          };
          setForm(prev => ({ ...prev, documents: [...(prev.documents || []), doc] }));
        };
        reader.readAsDataURL(file);
      });
    };

    const save = () => {
      if (!form.name || !form.mobile) return alert('نام و موبایل الزامی است');
      if (editId) {
        setPeople(prev => prev.map(p => p.id === editId ? { ...p, ...form } as Person : p));
        log('UPDATE', 'person', editId, form.name);
      } else {
        const newP: Person = { ...form, id: generateId(), creditor: 0, debtor: 0, documents: form.documents || [], isDeleted: false, createdAt: new Date().toISOString() } as Person;
        setPeople(prev => [newP, ...prev]);
        log('CREATE', 'person', newP.id, newP.name);
      }
      setForm({ type: 'customer', creditor: 0, debtor: 0, documents: [] });
      setShowForm(false); setEditId(null);
    };

    const del = (id: string) => {
      if (confirm('حذف شود؟')) {
        setPeople(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
        log('DELETE', 'person', id, people.find(p=>p.id===id)?.name);
      }
    };

    const typeLabel: Record<string,string> = { customer: 'مشتری', supplier: 'تأمین‌کننده', guarantor: 'ضامن', employee: 'کارمند', other: 'سایر' };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">👥 مدیریت اشخاص</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowGroupManager(!showGroupManager)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl">📁 گروه‌ها</button>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: '', name: '', documents: [] } }); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">{showForm ? '✕ بستن' : '➕ شخص جدید'}</button>
          </div>
        </div>
        {/* مدیریت گروه‌ها */}
        {showGroupManager && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-violet-500/30">
            <h3 className="text-lg font-bold mb-4 text-violet-400">📁 مدیریت گروه اشخاص</h3>
            <div className="flex gap-2 mb-4">
              <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="نام گروه" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="color" value={newGroupColor} onChange={e=>setNewGroupColor(e.target.value)} className="w-16 h-10 bg-slate-700/50 border border-slate-600 rounded-xl cursor-pointer" />
              <button onClick={()=>{
                if(!newGroupName) return;
                setPersonGroups([...personGroups, { id: generateId(), name: newGroupName, color: newGroupColor }]);
                setNewGroupName(''); setNewGroupColor('#3b82f6');
              }} className="px-4 bg-violet-600 text-white rounded-xl">➕ افزودن</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {personGroups.map(g => (
                <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border group" style={{borderColor: g.color+'50', backgroundColor: g.color+'15'}}>
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: g.color}} />
                  <span className="text-sm" style={{color: g.color}}>{g.name}</span>
                  <button onClick={()=>{if(confirm('حذف گروه؟')){setPersonGroups(personGroups.filter(x=>x.id!==g.id));setPeople(people.map(p=>p.groupId===g.id?{...p,groupId:undefined}:p));}}} className="opacity-0 group-hover:opacity-100 text-rose-400 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">{editId ? '✏️ ویرایش' : '➕ ثبت'} شخص</h3>
            
            {/* آپلود عکس پروفایل */}
            <div className="mb-4 flex items-center gap-4">
              <div className="relative">
                {form.image ? (
                  <img src={form.image} alt="پروفایل" className="w-24 h-24 rounded-xl object-cover border-2 border-blue-500/50 cursor-pointer" onClick={() => setViewImage(form.image!)} />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-700/50 border-2 border-dashed border-slate-600 flex items-center justify-center text-3xl">👤</div>
                )}
                <label className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-xs text-center py-1 rounded-b-xl cursor-pointer hover:bg-blue-600">
                  📷 عکس
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setForm({...form, image: ev.target?.result as string});
                    };
                    reader.readAsDataURL(file);
                  }} className="hidden" />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-sm mb-1">📷 عکس پروفایل</p>
                <p className="text-slate-500 text-xs">از روی کارت ملی یا عکس پرسنلی آپلود کنید</p>
                {form.image && (
                  <button onClick={() => setForm({...form, image: undefined})} className="text-rose-400 text-xs mt-1">✕ حذف عکس</button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="customer">مشتری</option><option value="supplier">تأمین‌کننده</option><option value="guarantor">ضامن</option><option value="employee">کارمند</option><option value="other">سایر</option>
              </select>
              <select value={form.groupId||''} onChange={e=>setForm({...form,groupId:e.target.value||undefined})} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">بدون گروه</option>
                {personGroups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="نام *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.familyName||''} onChange={e=>setForm({...form,familyName:e.target.value})} placeholder="نام خانوادگی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.mobile||''} onChange={e=>setForm({...form,mobile:e.target.value})} placeholder="موبایل *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="تلفن" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.nationalId||''} onChange={e=>setForm({...form,nationalId:e.target.value})} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.job||''} onChange={e=>setForm({...form,job:e.target.value})} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})} placeholder="شهر" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.bankCard||''} onChange={e=>setForm({...form,bankCard:e.target.value})} placeholder="شماره کارت" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} placeholder="آدرس" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white md:col-span-3" />
            </div>
            
            {/* مدارک */}
            <div className="mt-4">
              <label className="text-slate-300 text-sm mb-2 block">📎 مدارک (کارت ملی، قرارداد و...)</label>
              <label className="flex items-center justify-center gap-2 bg-slate-600/50 border border-dashed border-slate-500 rounded-xl p-3 cursor-pointer hover:bg-slate-600">
                <span>📎 انتخاب فایل</span>
                <input type="file" multiple accept="image/*,.pdf" onChange={handleDocUpload} className="hidden" />
              </label>
              {form.documents && form.documents.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.documents.map(d => (
                    <div key={d.id} className="bg-slate-700/50 rounded-lg p-2 flex items-center gap-2">
                      <span>{d.type.includes('image') ? '🖼️' : '📄'}</span>
                      <span className="text-xs text-slate-300">{d.name}</span>
                      <button onClick={() => setForm({...form, documents: form.documents!.filter(x=>x.id!==d.id)})} className="text-rose-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* بخش ضامن */}
            <div className="mt-4 border border-amber-500/30 rounded-xl p-4 bg-amber-500/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-amber-400 font-bold">🛡️ ضامن (اختیاری)</h4>
                {!form.guarantor?.name && (
                  <button onClick={()=>setForm({...form, guarantor: { id: generateId(), name: '', documents: [] }})} className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg">➕ افزودن ضامن</button>
                )}
              </div>
              {form.guarantor?.name !== undefined && form.guarantor?.name !== '' && (
                <div className="space-y-3">
                  {/* عکس ضامن */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {form.guarantor.image ? (
                        <img src={form.guarantor.image} alt="ضامن" className="w-16 h-16 rounded-xl object-cover border-2 border-amber-500/50 cursor-pointer" onClick={() => setViewImage(form.guarantor!.image!)} />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-700/50 border-2 border-dashed border-slate-600 flex items-center justify-center text-2xl">🛡️</div>
                      )}
                      <label className="absolute bottom-0 left-0 right-0 bg-amber-600/80 text-white text-[10px] text-center py-0.5 rounded-b-xl cursor-pointer hover:bg-amber-600">
                        📷
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setForm({...form, guarantor: {...form.guarantor!, image: ev.target?.result as string}});
                          };
                          reader.readAsDataURL(file);
                        }} className="hidden" />
                      </label>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input value={form.guarantor.name||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, name:e.target.value}})} placeholder="نام ضامن *" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                      <input value={form.guarantor.mobile||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, mobile:e.target.value}})} placeholder="موبایل" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                      <input value={form.guarantor.nationalId||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, nationalId:e.target.value}})} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                      <input value={form.guarantor.job||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, job:e.target.value}})} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                    </div>
                  </div>
                  {/* مدارک ضامن */}
                  <div>
                    <label className="flex items-center justify-center gap-2 bg-slate-600/50 border border-dashed border-amber-500/50 rounded-xl p-2 cursor-pointer hover:bg-slate-600">
                      <span className="text-xs">📎 مدارک ضامن</span>
                      <input type="file" multiple accept="image/*,.pdf" onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const doc: PersonDocument = {
                              id: generateId(), name: file.name, type: file.type,
                              data: ev.target?.result as string, date: getTodayDate(),
                            };
                            setForm({...form, guarantor: {...form.guarantor!, documents: [...(form.guarantor!.documents || []), doc]}});
                          };
                          reader.readAsDataURL(file);
                        });
                      }} className="hidden" />
                    </label>
                    {form.guarantor.documents && form.guarantor.documents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.guarantor.documents.map(d => (
                          <div key={d.id} className="bg-slate-700/50 rounded-lg p-1.5 flex items-center gap-1">
                            <span className="text-xs">{d.type.includes('image') ? '🖼️' : '📄'}</span>
                            <span className="text-[10px] text-slate-300">{d.name}</span>
                            <button onClick={() => setForm({...form, guarantor: {...form.guarantor!, documents: form.guarantor!.documents.filter(x=>x.id!==d.id)}})} className="text-rose-400 text-[10px]">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>setForm({...form, guarantor: undefined})} className="text-rose-400 text-xs">✕ حذف ضامن</button>
                </div>
              )}
            </div>
            
            <textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="توضیحات" rows={2} className="mt-3 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={save} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 جستجو..." className="flex-1 min-w-48 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          {['all','customer','supplier','guarantor','employee'].map(t=>(
            <button key={t} onClick={()=>setFilter(t)} className={`px-3 py-2 rounded-xl text-sm ${filter===t?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>{t==='all'?'همه':typeLabel[t]}</button>
          ))}
          <select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm">
            <option value="all">همه گروه‌ها</option>
            {personGroups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50"><span className="text-slate-400 text-sm">{filtered.length} نفر</span></div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(p => (
              <div key={p.id} className="p-3 hover:bg-slate-700/20 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {p.image ? <img src={p.image} className="w-10 h-10 rounded-xl object-cover" /> : <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">👤</div>}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{p.name} {p.familyName||''}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{typeLabel[p.type]}</span>
                      {p.groupId && (() => {
                        const g = personGroups.find(x => x.id === p.groupId);
                        return g ? <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: g.color+'30', color: g.color}}>{g.name}</span> : null;
                      })()}
                      {p.documents && p.documents.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">📎 {p.documents.length}</span>}
                      {p.guarantor && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">🛡️ ضامن</span>}
                    </div>
                    <div className="text-xs text-slate-400 flex gap-3">
                      {p.mobile && <span>📱 {p.mobile}</span>}
                      {p.job && <span>💼 {p.job}</span>}
                      {p.city && <span>🏙️ {p.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.image && (
                    <button onClick={() => setViewImage(p.image!)} className="text-blue-400 text-sm">🖼️ تصویر</button>
                  )}
                  {(p.documents?.length || 0) > 0 && (
                    <button onClick={() => setViewDocs({person: p, type: 'person'})} className="text-cyan-400 text-sm">📎 مدارک</button>
                  )}
                  {p.guarantor && (
                    <button onClick={() => setViewDocs({person: p, type: 'guarantor'})} className="text-amber-400 text-sm">🛡️ ضامن</button>
                  )}
                  <button onClick={()=>{setForm(p);setEditId(p.id);setShowForm(true);}} className="opacity-0 group-hover:opacity-100 text-amber-400">✏️</button>
                  <button onClick={()=>del(p.id)} className="opacity-0 group-hover:opacity-100 text-rose-400">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* مودال تصویر */}
        {viewImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={()=>setViewImage(null)}>
            <img src={viewImage} alt="تصویر" className="max-w-full max-h-full object-contain" onClick={e=>e.stopPropagation()} />
          </div>
        )}
        {/* مودال مدارک و ضامن */}
        {viewDocs && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={()=>setViewDocs(null)}>
            <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">
                {viewDocs.type === 'person' ? `📎 مدارک ${viewDocs.person.name}` : `🛡️ ضامن ${viewDocs.person.name}`}
              </h3>
              {viewDocs.type === 'guarantor' && viewDocs.person.guarantor && (
                <div className="space-y-4">
                  {viewDocs.person.guarantor.image && (
                    <div>
                      <p className="text-slate-300 mb-2">تصویر ضامن:</p>
                      <img src={viewDocs.person.guarantor.image} alt="ضامن" className="w-32 h-32 object-cover rounded-xl cursor-pointer" onClick={() => setViewImage(viewDocs.person.guarantor!.image!)} />
                    </div>
                  )}
                  <div>
                    <p className="text-slate-300 mb-2">مدارک ضامن:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {viewDocs.person.guarantor.documents.map(d => (
                        <div key={d.id} className="bg-slate-700/30 rounded-xl p-3">
                          {d.type.includes('image') ? (
                            <img src={d.data} alt={d.name} className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer" onClick={() => setViewImage(d.data)} />
                          ) : (
                            <div className="w-full h-32 bg-slate-600/50 rounded-lg mb-2 flex items-center justify-center text-3xl">📄</div>
                          )}
                          <p className="text-xs text-slate-300 truncate">{d.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {viewDocs.type === 'person' && (
                <div className="grid grid-cols-2 gap-3">
                  {viewDocs.person.documents.map(d => (
                    <div key={d.id} className="bg-slate-700/30 rounded-xl p-3">
                      {d.type.includes('image') ? (
                        <img src={d.data} alt={d.name} className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer" onClick={() => setViewImage(d.data)} />
                      ) : (
                        <div className="w-full h-32 bg-slate-600/50 rounded-lg mb-2 flex items-center justify-center text-3xl">📄</div>
                      )}
                      <p className="text-xs text-slate-300 truncate">{d.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>setViewDocs(null)} className="mt-4 w-full bg-slate-700 text-white py-2 rounded-xl">بستن</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== INVENTORY =====
  const InventorySection = () => {
    const [tab, setTab] = useState<'add'|'list'|'cat'|'brand'|'model'|'color'>('add');
    const [pCat,setPCat]=useState('');const [pBrand,setPBrand]=useState('');const [pModel,setPModel]=useState('');
    const [pColor,setPColor]=useState('');const [pRam,setPRam]=useState('');const [pStorage,setPStorage]=useState('');
    const [pBuy,setPBuy]=useState('');const [pSell,setPSell]=useState('');const [pStock,setPStock]=useState('0');
    const [pMin,setPMin]=useState('0');const [pReorder,setPReorder]=useState('0');const [pNeg,setPNeg]=useState(false);
    const [pSerial,setPSerial]=useState(false);
    const [newCat,setNewCat]=useState({name:'',icon:'📦'});
    const [newBrand,setNewBrand]=useState({name:'',categoryId:''});
    const [newModel,setNewModel]=useState({name:'',brandId:''});
    const [newColor,setNewColor]=useState({name:'',code:'#000000'});

    const addProduct = () => {
      if (!pCat||!pBrand||!pModel||!pBuy||!pSell) return alert('فیلدهای ستاره‌دار الزامی');
      const p: Product = {
        id:generateId(), code:generateProductCode(), name:'', categoryId:pCat, brandId:pBrand, modelId:pModel,
        color:colors.find(c=>c.id===pColor)?.name, ram:pRam, storage:pStorage,
        buyPrice:Number(pBuy), sellPrice:Number(pSell), stock:Number(pStock),
        minStock:Number(pMin), reorderPoint:Number(pReorder), allowNegativeStock:pNeg,
        hasSerial: pSerial, isDeleted:false, createdAt:new Date().toISOString(),
      };
      p.name = getProductName(p);
      setProducts(prev=>[p,...prev]);
      log('CREATE','product',p.id,p.name);
      setPCat('');setPBrand('');setPModel('');setPColor('');setPRam('');setPStorage('');
      setPBuy('');setPSell('');setPStock('0');setPMin('0');setPReorder('0');setPNeg(false);setPSerial(false);
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🏭 کالا و انبار</h2>
        <div className="flex gap-2 flex-wrap border-b border-slate-700 pb-2">
          {([['add','➕ ثبت'],['list','📋 لیست'],['cat','📁 گروه'],['brand','🏷️ برند'],['model','📱 مدل'],['color','🎨 رنگ']] as const).map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} className={`px-3 py-2 rounded-xl text-sm ${tab===id?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>{l}</button>
          ))}
        </div>
        {tab==='add' && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-slate-400 text-xs">گروه *</label>
                <select value={pCat} onChange={e=>{setPCat(e.target.value);setPBrand('');setPModel('');}} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  <option value="">انتخاب...</option>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">برند *</label>
                <select value={pBrand} onChange={e=>{setPBrand(e.target.value);setPModel('');}} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!pCat}>
                  <option value="">انتخاب...</option>{brands.filter(b=>b.categoryId===pCat).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">مدل *</label>
                <select value={pModel} onChange={e=>setPModel(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!pBrand}>
                  <option value="">انتخاب...</option>{models.filter(m=>m.brandId===pBrand).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">رنگ</label>
                <select value={pColor} onChange={e=>setPColor(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  <option value="">انتخاب...</option>{colors.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="text-slate-400 text-xs">رم</label><input value={pRam} onChange={e=>setPRam(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">حافظه</label><input value={pStorage} onChange={e=>setPStorage(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">قیمت خرید *</label><input type="number" value={pBuy} onChange={e=>setPBuy(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">قیمت فروش *</label><input type="number" value={pSell} onChange={e=>setPSell(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">موجودی</label><input type="number" value={pStock} onChange={e=>setPStock(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">حداقل موجودی</label><input type="number" value={pMin} onChange={e=>setPMin(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">نقطه سفارش</label><input type="number" value={pReorder} onChange={e=>setPReorder(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={pSerial} onChange={e=>setPSerial(e.target.checked)} className="w-4 h-4" /><span className="text-slate-300 text-sm">سریال‌دار</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={pNeg} onChange={e=>setPNeg(e.target.checked)} className="w-4 h-4" /><span className="text-slate-300 text-sm">موجودی منفی</span></label>
              </div>
            </div>
            <button onClick={addProduct} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">✓ ثبت کالا</button>
          </div>
        )}
        {tab==='list' && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50"><span className="text-slate-400 text-sm">{products.filter(p=>!p.isDeleted).length} کالا</span></div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
              {products.filter(p=>!p.isDeleted).map(p=>(
                <div key={p.id} className="p-3 hover:bg-slate-700/20 flex justify-between items-center group">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{getProductName(p)}</p>
                      {p.hasSerial && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">📲 سریال‌دار</span>}
                    </div>
                    <p className="text-slate-400 text-xs">کد: {p.code} | موجودی: {p.stock} | خرید: {formatNumber(p.buyPrice)} | فروش: {formatNumber(p.sellPrice)}</p>
                  </div>
                  <button onClick={()=>{if(confirm('حذف؟')){setProducts(prev=>prev.map(x=>x.id===p.id?{...x,isDeleted:true}:x));log('DELETE','product',p.id,p.name);}}} className="opacity-0 group-hover:opacity-100 text-rose-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==='cat' && (<div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex gap-2 mb-4">
            <input value={newCat.name} onChange={e=>setNewCat({...newCat,name:e.target.value})} placeholder="نام" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input value={newCat.icon} onChange={e=>setNewCat({...newCat,icon:e.target.value})} className="w-16 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white text-center text-xl" />
            <button onClick={()=>{if(newCat.name){setCategories([...categories,{id:generateId(),...newCat}]);setNewCat({name:'',icon:'📦'});}}} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
          </div>
          {categories.map(c=>(<div key={c.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between"><span className="text-white">{c.icon} {c.name}</span><button onClick={()=>{if(confirm('حذف؟'))setCategories(categories.filter(x=>x.id!==c.id))}} className="text-rose-400">🗑️</button></div>))}
        </div>)}
        {tab==='brand' && (<div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex gap-2 mb-4">
            <select value={newBrand.categoryId} onChange={e=>setNewBrand({...newBrand,categoryId:e.target.value})} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white"><option value="">گروه...</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input value={newBrand.name} onChange={e=>setNewBrand({...newBrand,name:e.target.value})} placeholder="نام برند" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={()=>{if(newBrand.categoryId&&newBrand.name){setBrands([...brands,{id:generateId(),...newBrand}]);setNewBrand({name:'',categoryId:''});}}} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
          </div>
          {brands.map(b=>{const cat=categories.find(c=>c.id===b.categoryId);return(<div key={b.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between"><span className="text-white">{cat?.icon} {b.name}</span><button onClick={()=>{if(confirm('حذف؟'))setBrands(brands.filter(x=>x.id!==b.id))}} className="text-rose-400">🗑️</button></div>);})}
        </div>)}
        {tab==='model' && (<div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex gap-2 mb-4">
            <select value={newModel.brandId} onChange={e=>setNewModel({...newModel,brandId:e.target.value})} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white"><option value="">برند...</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
            <input value={newModel.name} onChange={e=>setNewModel({...newModel,name:e.target.value})} placeholder="نام مدل" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={()=>{if(newModel.brandId&&newModel.name){setModels([...models,{id:generateId(),...newModel}]);setNewModel({name:'',brandId:''});}}} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
          </div>
          {models.map(m=>{const brand=brands.find(b=>b.id===m.brandId);return(<div key={m.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between"><span className="text-white">{brand?.name} - {m.name}</span><button onClick={()=>{if(confirm('حذف؟'))setModels(models.filter(x=>x.id!==m.id))}} className="text-rose-400">🗑️</button></div>);})}
        </div>)}
        {tab==='color' && (<div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex gap-2 mb-4">
            <input value={newColor.name} onChange={e=>setNewColor({...newColor,name:e.target.value})} placeholder="نام رنگ" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="color" value={newColor.code} onChange={e=>setNewColor({...newColor,code:e.target.value})} className="w-16 h-10 bg-slate-700/50 border border-slate-600 rounded-xl cursor-pointer" />
            <button onClick={()=>{if(newColor.name){setColors([...colors,{id:generateId(),...newColor}]);setNewColor({name:'',code:'#000000'});}}} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{colors.map(c=>(<div key={c.id} className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full border-2 border-white" style={{backgroundColor:c.code}} /><span className="text-white text-sm">{c.name}</span></div><button onClick={()=>{if(confirm('حذف؟'))setColors(colors.filter(x=>x.id!==c.id))}} className="text-rose-400">🗑️</button></div>))}</div>
        </div>)}
      </div>
    );
  };

  // ===== SERIALS =====
  const SerialsSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ productId: '', serial: '', imei1: '', imei2: '', purchasePrice: '' });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all'|'in_stock'|'sold'>('all');

    const filtered = serials.filter(s => {
      const matchFilter = filter === 'all' || s.status === filter;
      const matchSearch = !search || s.serialNumber.includes(search) || s.imei1?.includes(search) || s.imei2?.includes(search);
      return matchFilter && matchSearch;
    });

    const addSerial = () => {
      if (!form.productId || !form.serial || !form.purchasePrice) return alert('فیلدهای الزامی را پر کنید');
      if (serials.find(s => s.serialNumber === form.serial)) return alert('این سریال قبلاً ثبت شده!');
      const s: SerialItem = {
        id: generateId(), productId: form.productId, serialNumber: form.serial,
        imei1: form.imei1, imei2: form.imei2, purchasePrice: Number(form.purchasePrice),
        status: 'in_stock', createdAt: new Date().toISOString(),
      };
      setSerials(prev => [s, ...prev]);
      // Update product stock
      setProducts(prev => prev.map(p => p.id === form.productId ? { ...p, stock: p.stock + 1 } : p));
      log('CREATE', 'serial', s.id, s.serialNumber);
      setForm({ productId: '', serial: '', imei1: '', imei2: '', purchasePrice: '' });
      setShowForm(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📲 مدیریت سریال</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕' : '➕ سریال جدید'}
          </button>
        </div>
        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">محصول سریال‌دار...</option>
                {products.filter(p => !p.isDeleted && p.hasSerial).map(p => <option key={p.id} value={p.id}>{getProductName(p)}</option>)}
              </select>
              <input value={form.serial} onChange={e => setForm({ ...form, serial: e.target.value })} placeholder="شماره سریال *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.imei1} onChange={e => setForm({ ...form, imei1: e.target.value })} placeholder="IMEI 1" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.imei2} onChange={e => setForm({ ...form, imei2: e.target.value })} placeholder="IMEI 2" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="قیمت خرید *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <button onClick={addSerial} className="mt-3 w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">✓ ثبت سریال</button>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 جستجو سریال/IMEI..." className="flex-1 min-w-48 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          {(['all','in_stock','sold'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-sm ${filter===f?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>
              {f==='all'?'همه':f==='in_stock'?'موجود':'فروش رفته'}
            </button>
          ))}
        </div>
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50"><span className="text-slate-400 text-sm">{filtered.length} سریال</span></div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(s => {
              const product = products.find(p => p.id === s.productId);
              return (
                <div key={s.id} className="p-3 hover:bg-slate-700/20 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold">{s.serialNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status==='in_stock'?'bg-emerald-500/20 text-emerald-400':'bg-rose-500/20 text-rose-400'}`}>
                        {s.status==='in_stock'?'موجود':'فروش رفته'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{product ? getProductName(product) : 'محصول حذف شده'} | IMEI: {s.imei1 || '-'} | خرید: {formatNumber(s.purchasePrice)}</p>
                  </div>
                  {s.status === 'sold' && s.profit !== undefined && (
                    <span className="text-emerald-400 font-bold">سود: {formatNumber(s.profit)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ===== CARDEX =====
  const CardexSection = () => {
    const [selProduct, setSelProduct] = useState('');
    const [searchProduct, setSearchProduct] = useState('');
    const filteredProducts = products.filter(p => !p.isDeleted && 
      (!searchProduct || getProductName(p).toLowerCase().includes(searchProduct.toLowerCase()) || p.code.toLowerCase().includes(searchProduct.toLowerCase()))
    );
    const productCardex = cardex.filter(c => c.productId === selProduct).sort((a, b) => a.date.localeCompare(b.date));
    const totalIn = productCardex.filter(c => ['purchase_in', 'return_in'].includes(c.type)).reduce((s, c) => s + c.quantity, 0);
    const totalOut = productCardex.filter(c => ['sale_out', 'return_out'].includes(c.type)).reduce((s, c) => s + c.quantity, 0);
    const totalInValue = productCardex.filter(c => ['purchase_in', 'return_in'].includes(c.type)).reduce((s, c) => s + c.totalPrice, 0);
    const totalOutValue = productCardex.filter(c => ['sale_out', 'return_out'].includes(c.type)).reduce((s, c) => s + c.totalPrice, 0);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📊 کاردکس انبار</h2>
        <input 
          value={searchProduct} 
          onChange={e => setSearchProduct(e.target.value)} 
          placeholder="🔍 جستجوی کالا (نام یا کد)..." 
          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500"
        />
        <select value={selProduct} onChange={e => setSelProduct(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
          <option value="">انتخاب کالا...</option>
          {filteredProducts.map(p => <option key={p.id} value={p.id}>{getProductName(p)} ({p.code})</option>)}
        </select>
        {selProduct && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-500/10 rounded-xl p-3 text-center"><p className="text-emerald-400 text-sm">ورود تعدادی</p><p className="text-xl font-bold text-white">{formatNumber(totalIn)}</p></div>
              <div className="bg-rose-500/10 rounded-xl p-3 text-center"><p className="text-rose-400 text-sm">خروج تعدادی</p><p className="text-xl font-bold text-white">{formatNumber(totalOut)}</p></div>
              <div className="bg-blue-500/10 rounded-xl p-3 text-center"><p className="text-blue-400 text-sm">ورود ریالی</p><p className="text-lg font-bold text-white">{formatNumber(totalInValue)}</p></div>
              <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-amber-400 text-sm">خروج ریالی</p><p className="text-lg font-bold text-white">{formatNumber(totalOutValue)}</p></div>
            </div>
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr><th className="px-3 py-2 text-right text-slate-300">تاریخ</th><th className="px-3 py-2 text-right text-slate-300">نوع</th><th className="px-3 py-2 text-right text-slate-300">تعداد</th><th className="px-3 py-2 text-right text-slate-300">قیمت واحد</th><th className="px-3 py-2 text-right text-slate-300">مبلغ کل</th><th className="px-3 py-2 text-right text-slate-300">مانده</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {productCardex.map(c => (
                    <tr key={c.id} className="hover:bg-slate-700/20">
                      <td className="px-3 py-2 text-slate-300">{jalaliDate(c.date)}</td>
                      <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${c.type==='purchase_in'?'bg-emerald-500/20 text-emerald-400':c.type==='sale_out'?'bg-rose-500/20 text-rose-400':'bg-blue-500/20 text-blue-400'}`}>{c.type==='purchase_in'?'خرید':c.type==='sale_out'?'فروش':c.type==='return_in'?'برگشت خرید':c.type==='return_out'?'برگشت فروش':'اصلاح'}</span></td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(c.quantity)}</td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(c.unitPrice)}</td>
                      <td className="px-3 py-2 text-white font-bold">{formatNumber(c.totalPrice)}</td>
                      <td className="px-3 py-2 text-slate-300">{formatNumber(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  // ===== INVOICE FORM (with Serial & Smart Controls) =====
  const InvoiceForm = ({ type }: { type: 'purchase' | 'sale' | 'proforma' }) => {
    const [personId, setPersonId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [selProduct, setSelProduct] = useState('');
    const [selSerial, setSelSerial] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState('');
    const [payType, setPayType] = useState<'cash'|'installment'>('cash');
    const [downPay, setDownPay] = useState('');
    const [months, setMonths] = useState(6);
    const [desc, setDesc] = useState('');
    const [discount, setDiscount] = useState(0);

    const addItem = () => {
      const p = products.find(x => x.id === selProduct);
      if (!p || !price) return;
      // Smart control: check stock
      if (type === 'sale' && !p.allowNegativeStock) {
        const existingQty = items.filter(i => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
        if (existingQty + qty > p.stock) {
          if (!confirm(`⚠️ موجودی کافی نیست! موجودی: ${p.stock}\nادامه دهید؟`)) return;
        }
      }
      const buyP = p.buyPrice;
      const sellP = Number(price);
      // Smart control: price below cost
      if (type === 'sale' && sellP < buyP) {
        if (!confirm(`⚠️ قیمت فروش (${formatNumber(sellP)}) کمتر از قیمت خرید (${formatNumber(buyP)}) است!\nادامه دهید؟`)) return;
      }
      let serialNum: string | undefined;
      let productItemId: string | undefined;
      if (p.hasSerial && selSerial) {
        const serialItem = serials.find(s => s.id === selSerial);
        if (serialItem) {
          serialNum = serialItem.serialNumber;
          productItemId = serialItem.id;
        }
      }
      const item: InvoiceItem = {
        id: generateId(), productId: p.id, productItemId, serialNumber: serialNum,
        productName: getProductName(p) + (serialNum ? ` [${serialNum}]` : ''),
        quantity: qty, unitPrice: sellP, buyPrice: buyP,
        total: qty * sellP, profit: type === 'sale' ? (sellP - buyP) * qty : 0,
      };
      setItems([...items, item]);
      setSelProduct(''); setSelSerial(''); setQty(1); setPrice('');
    };

    const total = items.reduce((s, i) => s + i.total, 0);
    const finalTotal = total - discount;

    const submit = () => {
      if (!personId || items.length === 0) return alert('شخص و کالا الزامی');
      const paid = payType === 'cash' ? finalTotal : Number(downPay) || 0;
      let installments: Installment[] | undefined;
      if (payType === 'installment' && paid < finalTotal) {
        const remaining = finalTotal - paid;
        const instAmount = Math.round(remaining / months);
        const today = new Date();
        installments = Array.from({ length: months }, (_, i) => {
          const d = new Date(today); d.setMonth(d.getMonth() + i + 1);
          return { id: generateId(), amount: i === months - 1 ? remaining - instAmount * (months - 1) : instAmount, dueDate: d.toISOString().split('T')[0], paidAmount: 0, status: 'pending' as const };
        });
      }
      const inv: Invoice = {
        id: generateId(), invoiceNumber: generateInvoiceNumber(type), type, personId, items,
        total: finalTotal, discount, paid, remaining: finalTotal - paid,
        paymentType: payType, installments, status: 'active', description: desc,
        date: getTodayDate(), createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [inv, ...prev]);
      // Update stock & serials & cardex
      items.forEach(it => {
        setProducts(prev => prev.map(p => {
          if (p.id === it.productId) {
            const newStock = type === 'sale' ? p.stock - it.quantity : p.stock + it.quantity;
            return { ...p, stock: newStock };
          }
          return p;
        }));
        // Update serial status
        if (it.productItemId) {
          setSerials(prev => prev.map(s => {
            if (s.id === it.productItemId) {
              if (type === 'sale') return { ...s, status: 'sold' as const, saleInvoiceId: inv.id, soldDate: inv.date, soldPrice: it.unitPrice, profit: it.profit };
              return { ...s, status: 'in_stock' as const, purchaseInvoiceId: inv.id, purchasePrice: it.unitPrice };
            }
            return s;
          }));
        }
        // Add cardex entry
        const cardexType = type === 'sale' ? 'sale_out' : 'purchase_in';
        const lastBalance = cardex.filter(c => c.productId === it.productId).reduce((s, c) => s + c.quantity, 0);
        const newBalance = type === 'sale' ? lastBalance - it.quantity : lastBalance + it.quantity;
        setCardex(prev => [...prev, {
          id: generateId(), productId: it.productId, type: cardexType,
          quantity: it.quantity, unitPrice: it.unitPrice, totalPrice: it.total,
          balance: newBalance, balanceValue: newBalance * it.unitPrice,
          invoiceId: inv.id, date: inv.date,
        }]);
      });
      log('CREATE', 'invoice', inv.id, inv.invoiceNumber, `${type === 'purchase' ? 'خرید' : type === 'sale' ? 'فروش' : 'پیش‌فاکتور'} - ${formatNumber(finalTotal)}`);
      setPersonId(''); setItems([]); setDownPay(''); setDesc(''); setDiscount(0);
      alert(`✅ فاکتور ${inv.invoiceNumber} ثبت شد`);
    };

    const personType = type === 'purchase' ? 'supplier' : 'customer';
    const availPeople = people.filter(p => !p.isDeleted && (p.type === personType || p.type === 'other'));
    const availSerials = selProduct ? serials.filter(s => s.productId === selProduct && s.status === 'in_stock') : [];
    const selProd = products.find(p => p.id === selProduct);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{type === 'purchase' ? '🛒 فاکتور خرید' : type === 'sale' ? '💰 فاکتور فروش' : '📄 پیش‌فاکتور'}</h2>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="text-slate-400 text-xs">{type==='purchase'?'تأمین‌کننده':'مشتری'} *</label>
              <select value={personId} onChange={e=>setPersonId(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">انتخاب...</option>{availPeople.map(p=><option key={p.id} value={p.id}>{p.name} - {p.mobile}</option>)}
              </select></div>
            <div><label className="text-slate-400 text-xs">نوع پرداخت</label>
              <div className="flex gap-2">
                <button onClick={()=>setPayType('cash')} className={`flex-1 py-2 rounded-xl ${payType==='cash'?'bg-emerald-600 text-white':'bg-slate-700 text-slate-300'}`}>💵 نقدی</button>
                <button onClick={()=>setPayType('installment')} className={`flex-1 py-2 rounded-xl ${payType==='installment'?'bg-blue-600 text-white':'bg-slate-700 text-slate-300'}`}>💳 اقساطی</button>
              </div></div>
          </div>
          {payType==='installment' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="text-slate-400 text-xs">پیش‌پرداخت</label><input type="number" value={downPay} onChange={e=>setDownPay(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">تعداد اقساط</label>
                <select value={months} onChange={e=>setMonths(Number(e.target.value))} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">{[3,6,9,12,18,24].map(m=><option key={m} value={m}>{m} ماه</option>)}</select></div>
            </div>
          )}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-lg font-bold mb-3">افزودن کالا</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select value={selProduct} onChange={e=>{setSelProduct(e.target.value);setSelSerial('');const p=products.find(x=>x.id===e.target.value);if(p)setPrice(type==='purchase'?p.buyPrice.toString():p.sellPrice.toString());}} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">کالا...</option>{products.filter(p=>!p.isDeleted).map(p=><option key={p.id} value={p.id}>{getProductName(p)} ({p.stock})</option>)}
              </select>
              {selProd?.hasSerial && (
                <select value={selSerial} onChange={e=>setSelSerial(e.target.value)} className="bg-slate-700/50 border border-indigo-500/50 rounded-xl px-3 py-2 text-white">
                  <option value="">سریال...</option>{availSerials.map(s=><option key={s.id} value={s.id}>{s.serialNumber}</option>)}
                </select>
              )}
              <input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} min="1" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="تعداد" />
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className={`bg-slate-700/50 border rounded-xl px-3 py-2 text-white ${type==='sale'&&Number(price)<(selProd?.buyPrice||0)?'border-rose-500':''}`} placeholder="قیمت" />
              <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">➕</button>
            </div>
            {type==='sale'&&selProd&&Number(price)<selProd.buyPrice&&<p className="text-rose-400 text-xs mt-1">⚠️ قیمت کمتر از بهای خرید!</p>}
          </div>
          {items.length>0&&(
            <div className="mt-4 space-y-2">
              {items.map(it=>(
                <div key={it.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between items-center">
                  <div><p className="text-white">{it.productName}</p><p className="text-slate-400 text-xs">{it.quantity} × {formatNumber(it.unitPrice)} {it.profit?`| سود: ${formatNumber(it.profit)}`:''}</p></div>
                  <div className="flex items-center gap-3"><span className="text-emerald-400 font-bold">{formatNumber(it.total)}</span><button onClick={()=>setItems(items.filter(i=>i.id!==it.id))} className="text-rose-400">✕</button></div>
                </div>
              ))}
              <div className="flex gap-4 items-center"><label className="text-slate-400 text-sm">تخفیف:</label><input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-32 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-1 text-white" /></div>
              <div className="bg-blue-600/20 rounded-xl p-4 text-center"><span className="text-blue-300">جمع کل: </span><span className="text-white text-2xl font-bold">{formatNumber(finalTotal)} تومان</span></div>
            </div>
          )}
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="توضیحات" rows={2} className="mt-4 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          <button onClick={submit} disabled={!personId||items.length===0} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">✓ ثبت فاکتور</button>
        </div>
      </div>
    );
  };

  // ===== INVOICE LIST =====
  const InvoiceList = () => {
    const [filter, setFilter] = useState<'all'|'purchase'|'sale'|'proforma'>('all');
    const [search, setSearch] = useState('');
    const filtered = invoices.filter(i => i.status === 'active' && (filter === 'all' || i.type === filter) && (!search || i.invoiceNumber.includes(search) || getPersonName(i.personId).includes(search)));

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📋 لیست فاکتورها</h2>
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍..." className="flex-1 min-w-48 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          {(['all','sale','purchase','proforma'] as const).map(v=>(
            <button key={v} onClick={()=>setFilter(v)} className={`px-4 py-2 rounded-xl ${filter===v?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>{v==='all'?'همه':v==='sale'?'فروش':v==='purchase'?'خرید':'پیش‌فاکتور'}</button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map(inv=>(
            <div key={inv.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{inv.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.type==='sale'?'bg-emerald-500/20 text-emerald-400':inv.type==='purchase'?'bg-rose-500/20 text-rose-400':'bg-blue-500/20 text-blue-400'}`}>{inv.type==='sale'?'فروش':inv.type==='purchase'?'خرید':'پیش‌فاکتور'}</span>
                    {inv.paymentType==='installment'&&<span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">اقساطی</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{getPersonName(inv.personId)} | {jalaliDate(inv.date)}</p>
                </div>
                <div className="text-left">
                  <p className="text-emerald-400 font-bold">{formatNumber(inv.total)} تومان</p>
                  {inv.remaining>0&&<p className="text-rose-400 text-sm">باقیمانده: {formatNumber(inv.remaining)}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== RETURNS =====
  const ReturnsSection = () => {
    const [returnType, setReturnType] = useState<'sale'|'purchase'>('sale');
    const [selInvoice, setSelInvoice] = useState('');
    const activeInvoices = invoices.filter(i => i.status === 'active' && i.type === returnType);

    const processReturn = () => {
      const inv = invoices.find(i => i.id === selInvoice);
      if (!inv) return;
      // Cancel original invoice
      setInvoices(prev => prev.map(i => i.id === selInvoice ? { ...i, status: 'returned' as const } : i));
      // Restore stock
      inv.items.forEach(it => {
        setProducts(prev => prev.map(p => p.id === it.productId ? { ...p, stock: p.stock + it.quantity } : p));
        // Restore serial
        if (it.productItemId) {
          setSerials(prev => prev.map(s => s.id === it.productItemId ? { ...s, status: 'in_stock' as const, saleInvoiceId: undefined, soldDate: undefined } : s));
        }
      });
      // Create return invoice
      const returnInv: Invoice = {
        id: generateId(), invoiceNumber: generateInvoiceNumber('return'),
        type: returnType === 'sale' ? 'sale' : 'purchase',
        personId: inv.personId, items: inv.items,
        total: inv.total, discount: 0, paid: -inv.paid, remaining: 0,
        paymentType: 'cash', status: 'active', returnInvoiceId: inv.id,
        description: `برگشت از فاکتور ${inv.invoiceNumber}`,
        date: getTodayDate(), createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [returnInv, ...prev]);
      log('RETURN', 'invoice', returnInv.id, returnInv.invoiceNumber, `برگشت از ${inv.invoiceNumber}`);
      setSelInvoice('');
      alert('✅ برگشت ثبت شد');
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🔄 برگشت از خرید/فروش</h2>
        <div className="flex gap-2">
          <button onClick={()=>setReturnType('sale')} className={`px-4 py-2 rounded-xl ${returnType==='sale'?'bg-emerald-600 text-white':'bg-slate-700/50 text-slate-300'}`}>برگشت از فروش</button>
          <button onClick={()=>setReturnType('purchase')} className={`px-4 py-2 rounded-xl ${returnType==='purchase'?'bg-rose-600 text-white':'bg-slate-700/50 text-slate-300'}`}>برگشت از خرید</button>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <label className="text-slate-400 text-xs">فاکتور مورد نظر</label>
          <select value={selInvoice} onChange={e=>setSelInvoice(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white mt-1">
            <option value="">انتخاب...</option>
            {activeInvoices.map(i=><option key={i.id} value={i.id}>{i.invoiceNumber} - {getPersonName(i.personId)} - {formatNumber(i.total)} تومان</option>)}
          </select>
          <button onClick={processReturn} disabled={!selInvoice} className="mt-3 w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">🔄 ثبت برگشت</button>
        </div>
      </div>
    );
  };

  // ===== CHEQUES =====
  const ChequesSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<Cheque>>({ type: 'received', status: 'pending' });

    const save = () => {
      if (!form.chequeNumber||!form.bankName||!form.amount||!form.dueDate) return alert('فیلدهای الزامی');
      const c: Cheque = { ...form, id: generateId(), amount: Number(form.amount), isDeleted: false, createdAt: new Date().toISOString() } as Cheque;
      setCheques(prev => [c, ...prev]);
      log('CREATE', 'cheque', c.id, c.chequeNumber);
      setForm({ type: 'received', status: 'pending' }); setShowForm(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📝 چک‌ها</h2>
          <button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">{showForm?'✕':'➕ چک جدید'}</button>
        </div>
        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value as any})} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white"><option value="received">دریافتی</option><option value="paid">پرداختی</option></select>
              <input value={form.chequeNumber||''} onChange={e=>setForm({...form,chequeNumber:e.target.value})} placeholder="شماره چک *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.bankName||''} onChange={e=>setForm({...form,bankName:e.target.value})} placeholder="بانک *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={form.amount||''} onChange={e=>setForm({...form,amount:Number(e.target.value)})} placeholder="مبلغ *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={form.issuerName||''} onChange={e=>setForm({...form,issuerName:e.target.value})} placeholder="صادرکننده" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="date" value={form.dueDate||''} onChange={e=>setForm({...form,dueDate:e.target.value})} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <button onClick={save} className="mt-3 w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
          </div>
        )}
        <div className="space-y-2">
          {cheques.filter(c=>!c.isDeleted).map(c=>(
            <div key={c.id} className={`bg-slate-800/60 rounded-2xl p-4 border ${c.type==='received'?'border-emerald-500/30':'border-rose-500/30'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.type==='received'?'bg-emerald-500/20 text-emerald-400':'bg-rose-500/20 text-rose-400'}`}>{c.type==='received'?'دریافتی':'پرداختی'}</span>
                    <span className="text-white font-bold">{c.bankName} - {c.chequeNumber}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{c.issuerName} | سررسید: {jalaliDate(c.dueDate)}</p>
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">{formatNumber(c.amount)} تومان</p>
                  {isOverdue(c.dueDate)&&c.status==='pending'&&<p className="text-rose-400 text-xs">⚠️ معوق</p>}
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
    const allInst = invoices.filter(i=>i.status==='active').flatMap(inv=>(inv.installments||[]).map(inst=>({...inst,invoiceNumber:inv.invoiceNumber,personName:getPersonName(inv.personId),invoiceId:inv.id})));
    const pending = allInst.filter(i=>i.status==='pending');
    const overdue = pending.filter(i=>isOverdue(i.dueDate));

    const pay = (invId:string,instId:string) => {
      setInvoices(prev=>prev.map(inv=>{
        if(inv.id!==invId)return inv;
        const newInst=inv.installments?.map(i=>i.id===instId?{...i,status:'paid' as const,paidAmount:i.amount,paidDate:getTodayDate()}:i);
        const newPaid=inv.paid+(inv.installments?.find(i=>i.id===instId)?.amount||0);
        return {...inv,installments:newInst,paid:newPaid,remaining:inv.total-newPaid};
      }));
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">💳 اقساط</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-600/20 rounded-2xl p-4 text-center"><p className="text-blue-300 text-sm">کل</p><p className="text-2xl font-bold text-white">{pending.length}</p></div>
          <div className="bg-rose-600/20 rounded-2xl p-4 text-center"><p className="text-rose-300 text-sm">معوق</p><p className="text-2xl font-bold text-rose-400">{overdue.length}</p></div>
          <div className="bg-emerald-600/20 rounded-2xl p-4 text-center"><p className="text-emerald-300 text-sm">مبلغ معوق</p><p className="text-lg font-bold text-emerald-400">{formatNumber(overdue.reduce((s,i)=>s+i.amount,0))}</p></div>
        </div>
        <div className="space-y-2">
          {pending.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(inst=>(
            <div key={inst.id} className={`bg-slate-800/60 rounded-2xl p-4 border ${isOverdue(inst.dueDate)?'border-rose-500/30':'border-slate-700/50'}`}>
              <div className="flex justify-between items-center">
                <div><p className="text-white font-medium">{inst.personName} - {inst.invoiceNumber}</p><p className="text-slate-400 text-sm">سررسید: {jalaliDate(inst.dueDate)} {isOverdue(inst.dueDate)&&<span className="text-rose-400">(معوق)</span>}</p></div>
                <div className="flex items-center gap-3"><span className="text-white font-bold">{formatNumber(inst.amount)} تومان</span><button onClick={()=>pay(inst.invoiceId,inst.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm">✓ پرداخت</button></div>
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
      if (!form.name||!form.accountNumber) return alert('نام و شماره حساب الزامی');
      const b: Bank = { ...form, id: generateId(), balance: Number(form.balance)||0, createdAt: new Date().toISOString() } as Bank;
      setBanks(prev=>[b,...prev]); setForm({balance:0}); setShowForm(false);
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">🏦 بانک‌ها</h2><button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">{showForm?'✕':'➕ حساب'}</button></div>
        {showForm && (<div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50"><div className="grid grid-cols-3 gap-3"><input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="نام بانک *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /><input value={form.accountNumber||''} onChange={e=>setForm({...form,accountNumber:e.target.value})} placeholder="شماره حساب *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /><input type="number" value={form.balance||''} onChange={e=>setForm({...form,balance:Number(e.target.value)})} placeholder="موجودی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div><button onClick={save} className="mt-3 w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">💾</button></div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{banks.map(b=>(<div key={b.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50"><div className="flex justify-between"><div><p className="text-white font-bold">{b.name}</p><p className="text-slate-400 text-sm">{b.accountNumber}</p></div><p className="text-emerald-400 font-bold">{formatNumber(b.balance)} تومان</p></div></div>))}</div>
      </div>
    );
  };

  // ===== REPORTS =====
  const ReportsSection = () => {
    const activeInv = invoices.filter(i=>i.status==='active');
    const sales = activeInv.filter(i=>i.type==='sale');
    const purchases = activeInv.filter(i=>i.type==='purchase');
    const totalSales = sales.reduce((s,i)=>s+i.total,0);
    const totalPurchases = purchases.reduce((s,i)=>s+i.total,0);
    const totalProfit = sales.reduce((s,inv)=>s+inv.items.reduce((ss,it)=>ss+(it.profit||0),0),0);
    const serialProfit = serials.filter(s=>s.status==='sold'&&s.profit).reduce((s,sr)=>s+(sr.profit||0),0);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📊 گزارش‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-3">💰 خلاصه مالی</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">کل فروش:</span><span className="text-emerald-400 font-bold">{formatCurrency(totalSales)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">کل خرید:</span><span className="text-rose-400 font-bold">{formatCurrency(totalPurchases)}</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-300 font-bold">سود خالص:</span><span className="text-amber-400 font-bold">{formatCurrency(totalProfit)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">سود سریال‌دار:</span><span className="text-emerald-400 font-bold">{formatCurrency(serialProfit)}</span></div>
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-3">📦 انبار</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">تعداد کالا:</span><span className="text-white">{products.filter(p=>!p.isDeleted).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">ارزش انبار:</span><span className="text-white font-bold">{formatCurrency(products.filter(p=>!p.isDeleted).reduce((s,p)=>s+p.stock*p.buyPrice,0))}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">سریال‌های موجود:</span><span className="text-white">{serials.filter(s=>s.status==='in_stock').length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">کم‌موجود:</span><span className="text-amber-400">{products.filter(p=>!p.isDeleted&&p.stock<=p.minStock).length}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== AUDIT LOG =====
  const AuditSection = () => {
    const [search, setSearch] = useState('');
    const filtered = audit.filter(a => !search || a.entityName?.includes(search) || a.details?.includes(search) || a.action.includes(search));
    const actionColor: Record<string,string> = { CREATE: 'bg-emerald-500/20 text-emerald-400', UPDATE: 'bg-blue-500/20 text-blue-400', DELETE: 'bg-rose-500/20 text-rose-400', CANCEL: 'bg-amber-500/20 text-amber-400', RETURN: 'bg-violet-500/20 text-violet-400', PAYMENT: 'bg-cyan-500/20 text-cyan-400' };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📜 ردیابی تغییرات (Audit)</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 جستجو..." className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-3 border-b border-slate-700/50"><span className="text-slate-400 text-sm">{filtered.length} رکورد</span></div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(a => (
              <div key={a.id} className="p-3 hover:bg-slate-700/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${actionColor[a.action]||'bg-slate-500/20 text-slate-400'}`}>{a.action}</span>
                  <div><p className="text-white text-sm">{a.entityType} - {a.entityName||a.entityId}</p>{a.details&&<p className="text-slate-400 text-xs">{a.details}</p>}</div>
                </div>
                <span className="text-slate-500 text-xs">{jalaliDate(a.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ===== EXCEL IMPORT =====
  const ImportSection = () => {
    const [importType, setImportType] = useState<'people'|'products'|'cheques'|'invoices'>('people');
    const [data, setData] = useState<any[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      try {
        const raw = await parseExcelFile(file);
        if (raw.length < 2) return alert('فایل خالی است');
        setHeaders(raw[0].map(String));
        setData(raw.slice(1));
        setErrors([]);
      } catch (err) { alert('خطا در خواندن فایل'); }
    };

    const doImport = () => {
      if (data.length === 0) {
        alert('❌ هیچ داده‌ای برای ورود وجود ندارد!');
        return;
      }
      
      const h = headers;
      console.log('Import headers:', h);
      console.log('Import data:', data);
      console.log('Import type:', importType);
      
      if (importType === 'people') {
        const newPeople: Person[] = [];
        let skipped = 0;
        
        data.forEach((row, index) => {
          const obj: any = {};
          h.forEach((key, i) => { obj[key.trim()] = row[i]; });
          
          // ساختار فایل طرف حساب‌ها:
          // توضیحات | آدرس | موبایل معرف | معرف | گروه | ایمیل | تلفن | شهر | کد ملی / شناسه ملی | موبایل | بدهکار | بستانکار | کد | نام | شماره مشتری | | ردیف
          const name = String(obj['نام'] || obj['نام '] || '').trim();
          
          if (!name) {
            skipped++;
            console.warn(`Row ${index + 2}: Skipped - no name`);
            return;
          }
          
          const person: Person = {
            id: generateId(),
            type: 'customer',
            name: name,
            mobile: String(obj['موبایل'] || obj['موبایل '] || '').trim(),
            phone: String(obj['تلفن'] || obj['تلفن '] || '').trim(),
            nationalId: String(obj['کد ملی / شناسه ملی'] || obj['کد ملی / شناسه ملی '] || '').trim(),
            job: String(obj['معرف'] || obj['معرف '] || '').trim(),
            city: String(obj['شهر'] || obj['شهر '] || '').trim(),
            address: String(obj['آدرس'] || obj['آدرس '] || '').trim(),
            creditor: Number(obj['بستانکار'] || obj['بستانکار '] || 0),
            debtor: Number(obj['بدهکار'] || obj['بدهکار '] || 0),
            notes: String(obj['توضیحات'] || obj['توضیحات '] || '').trim(),
            documents: [],
            isDeleted: false,
            createdAt: new Date().toISOString(),
          };
          
          newPeople.push(person);
        });
        
        if (newPeople.length === 0) {
          alert(`❌ هیچ شخصی وارد نشد!\n${skipped} رکورد به دلیل نبود نام رد شد.\nلطفاً نام ستون‌ها را بررسی کنید.`);
          return;
        }
        
        setPeople(prev => [...newPeople, ...prev]);
        log('CREATE', 'import', generateId(), `ورود ${newPeople.length} شخص از اکسل`);
        alert(`✅ ${newPeople.length} شخص وارد شد${skipped > 0 ? `\n⚠️ ${skipped} رکورد رد شد` : ''}`);
        
      } else if (importType === 'products') {
        const newProducts: Product[] = [];
        let skipped = 0;
        
        data.forEach((row, index) => {
          const obj: any = {};
          h.forEach((key, i) => { obj[key.trim()] = row[i]; });
          
          // ساختار فایل کالاها:
          // قیمت خرید | قیمت خرید | واحد | مقدار فعلی | کد | نام | ردیف
          const name = String(obj['نام'] || obj['نام '] || '').trim();
          const code = String(obj['کد'] || obj['کد '] || '').trim();
          const buyPrice = Number(obj['قیمت خرید'] || obj['قیمت خرید '] || 0);
          const stock = Number(obj['مقدار فعلی'] || obj['مقدار فعلی '] || 0);
          
          if (!name) {
            skipped++;
            console.warn(`Row ${index + 2}: Skipped - no name`);
            return;
          }
          
          const product: Product = {
            id: generateId(),
            code: code || generateProductCode(),
            name: name,
            categoryId: 'misc',
            brandId: '',
            modelId: '',
            color: '',
            ram: '',
            storage: '',
            buyPrice: buyPrice,
            sellPrice: buyPrice, // قیمت فروش = قیمت خرید (می‌تواند بعداً ویرایش شود)
            stock: stock,
            minStock: 0,
            reorderPoint: 0,
            allowNegativeStock: false,
            hasSerial: false,
            isDeleted: false,
            description: String(obj['واحد'] || obj['واحد '] || ''),
            createdAt: new Date().toISOString(),
          };
          
          newProducts.push(product);
        });
        
        if (newProducts.length === 0) {
          alert(`❌ هیچ کالایی وارد نشد!\n${skipped} رکورد به دلیل نبود نام رد شد.\nلطفاً نام ستون‌ها را بررسی کنید.`);
          return;
        }
        
        setProducts(prev => [...newProducts, ...prev]);
        log('CREATE', 'import', generateId(), `ورود ${newProducts.length} کالا از اکسل`);
        alert(`✅ ${newProducts.length} کالا وارد شد${skipped > 0 ? `\n⚠️ ${skipped} رکورد رد شد` : ''}`);
        
      } else if (importType === 'cheques') {
        const newCheques: Cheque[] = [];
        let skipped = 0;
        
        data.forEach((row, index) => {
          const obj: any = {};
          h.forEach((key, i) => { obj[key.trim()] = row[i]; });
          
          // ساختار فایل چک‌ها:
          // تاریخ تغییر آخرین وضعیت | آخرین وضعیت | شماره چک | | تاریخ | بانک | مبلغ | نام طرف حساب | ردیف
          const chequeNumber = String(obj['شماره چک'] || obj['شماره چک '] || '').trim();
          const bankName = String(obj['بانک'] || obj['بانک '] || '').trim();
          const amount = Number(obj['مبلغ'] || obj['مبلغ '] || 0);
          const issuerName = String(obj['نام طرف حساب'] || obj['نام طرف حساب '] || '').trim();
          const dueDate = String(obj['تاریخ'] || obj['تاریخ '] || getTodayDate()).trim();
          const status = String(obj['آخرین وضعیت'] || obj['آخرین وضعیت '] || 'pending').trim();
          
          if (!chequeNumber || !bankName || !amount) {
            skipped++;
            console.warn(`Row ${index + 2}: Skipped - missing required fields`, { chequeNumber, bankName, amount });
            return;
          }
          
          // تبدیل وضعیت
          let chequeStatus: 'pending' | 'cashed' | 'bounced' | 'cancelled' = 'pending';
          if (status.includes('وصول') || status.includes('نقد')) chequeStatus = 'cashed';
          else if (status.includes('برگشت') || status.includes('بounced')) chequeStatus = 'bounced';
          else if (status.includes('لغو') || status.includes('cancelled')) chequeStatus = 'cancelled';
          
          const cheque: Cheque = {
            id: generateId(),
            chequeNumber: chequeNumber,
            bankName: bankName,
            amount: amount,
            issuerName: issuerName,
            issuerNationalId: '',
            dueDate: dueDate,
            type: 'received', // پیش‌فرض دریافتی
            status: chequeStatus,
            description: String(obj['تاریخ تغییر آخرین وضعیت'] || '').trim(),
            isDeleted: false,
            createdAt: new Date().toISOString(),
          };
          
          newCheques.push(cheque);
        });
        
        if (newCheques.length === 0) {
          alert(`❌ هیچ چکی وارد نشد!\n${skipped} رکورد به دلیل نبود فیلدهای الزامی رد شد.\nفیلدهای الزامی: شماره چک، بانک، مبلغ\nلطفاً نام ستون‌ها را بررسی کنید.`);
          return;
        }
        
        setCheques(prev => [...newCheques, ...prev]);
        log('CREATE', 'import', generateId(), `ورود ${newCheques.length} چک از اکسل`);
        alert(`✅ ${newCheques.length} چک وارد شد${skipped > 0 ? `\n⚠️ ${skipped} رکورد رد شد` : ''}`);
        
      } else if (importType === 'invoices') {
        const newInvoices: Invoice[] = [];
        let skipped = 0;
        
        data.forEach((row, index) => {
          const obj: any = {};
          h.forEach((key, i) => { obj[key.trim()] = row[i]; });
          
          const total = Number(obj['مبلغ کل'] || obj['مبلغ کل '] || obj['مبلغ'] || obj['مبلغ '] || obj['Total'] || 0);
          
          if (!total || total <= 0) {
            skipped++;
            console.warn(`Row ${index + 2}: Skipped - no total amount`, { total });
            return;
          }
          
          // Find person by name
          const personName = String(obj['مشتری'] || obj['تأمین‌کننده'] || obj['شخص'] || obj['مشتری '] || obj['تأمین‌کننده '] || '').trim();
          const person = people.find(p => p.name === personName);
          
          const invoiceType = String(obj['نوع'] || obj['نوع '] || 'فروش');
          const paid = Number(obj['پرداخت شده'] || obj['پرداخت شده '] || obj['Paid'] || total);
          
          const invoice: Invoice = {
            id: generateId(),
            invoiceNumber: String(obj['شماره فاکتور'] || obj['شماره فاکتور '] || obj['شماره'] || obj['شماره '] || generateInvoiceNumber(invoiceType.includes('خرید') ? 'purchase' : 'sale')).trim(),
            type: invoiceType.includes('خرید') ? 'purchase' : 'sale',
            personId: person?.id || '',
            items: [],
            total: total,
            discount: Number(obj['تخفیف'] || obj['تخفیف '] || 0),
            paid: paid,
            remaining: total - paid,
            paymentType: String(obj['نوع پرداخت'] || obj['نوع پرداخت '] || 'نقدی').includes('اقساط') ? 'installment' : 'cash',
            status: 'active',
            description: String(obj['توضیحات'] || obj['توضیحات '] || '').trim(),
            date: String(obj['تاریخ'] || obj['تاریخ '] || getTodayDate()).trim(),
            createdAt: new Date().toISOString(),
          };
          
          newInvoices.push(invoice);
        });
        
        if (newInvoices.length === 0) {
          alert(`❌ هیچ فاکتوری وارد نشد!\n${skipped} رکورد به دلیل نبود مبلغ کل رد شد.\nفیلد الزامی: مبلغ کل\nلطفاً نام ستون‌ها را بررسی کنید.`);
          return;
        }
        
        setInvoices(prev => [...newInvoices, ...prev]);
        log('CREATE', 'import', generateId(), `ورود ${newInvoices.length} فاکتور از اکسل`);
        alert(`✅ ${newInvoices.length} فاکتور وارد شد${skipped > 0 ? `\n⚠️ ${skipped} رکورد رد شد` : ''}`);
      }
      
      setData([]); setHeaders([]); setFileName('');
    };

    const getRequiredColumns = () => {
      switch (importType) {
        case 'people':
          return { required: ['نام'], optional: ['موبایل', 'تلفن', 'کد ملی / شناسه ملی', 'معرف', 'گروه', 'ایمیل', 'شهر', 'آدرس', 'بستانکار', 'بدهکار', 'توضیحات', 'شماره مشتری', 'کد'] };
        case 'products':
          return { required: ['نام'], optional: ['کد', 'قیمت خرید', 'مقدار فعلی', 'واحد'] };
        case 'cheques':
          return { required: ['شماره چک', 'بانک', 'مبلغ'], optional: ['تاریخ', 'نام طرف حساب', 'آخرین وضعیت', 'تاریخ تغییر آخرین وضعیت'] };
        case 'invoices':
          return { required: ['مبلغ کل'], optional: ['شماره فاکتور', 'نوع', 'مشتری', 'تأمین‌کننده', 'تخفیف', 'پرداخت شده', 'نوع پرداخت', 'تاریخ', 'توضیحات'] };
      }
    };

    const cols = getRequiredColumns();

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📥 ورود از اکسل</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>{setImportType('people');setData([]);}} className={`px-4 py-2 rounded-xl ${importType==='people'?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>👥 اشخاص</button>
          <button onClick={()=>{setImportType('products');setData([]);}} className={`px-4 py-2 rounded-xl ${importType==='products'?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>📦 کالاها</button>
          <button onClick={()=>{setImportType('cheques');setData([]);}} className={`px-4 py-2 rounded-xl ${importType==='cheques'?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>📝 چک‌ها</button>
          <button onClick={()=>{setImportType('invoices');setData([]);}} className={`px-4 py-2 rounded-xl ${importType==='invoices'?'bg-blue-600 text-white':'bg-slate-700/50 text-slate-300'}`}>📋 فاکتورها</button>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
            <h4 className="text-blue-400 font-bold mb-2">📋 ستون‌های الزامی:</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {cols.required.map(col => (
                <span key={col} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm">{col}</span>
              ))}
            </div>
            <h4 className="text-slate-400 font-bold mb-2 text-sm">ستون‌های اختیاری:</h4>
            <div className="flex flex-wrap gap-2">
              {cols.optional.map(col => (
                <span key={col} className="bg-slate-600/30 text-slate-400 px-3 py-1 rounded-lg text-xs">{col}</span>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-center gap-2 bg-slate-600/50 border border-dashed border-slate-500 rounded-xl p-6 cursor-pointer hover:bg-slate-600">
            <span className="text-4xl">📁</span>
            <span className="text-slate-300">انتخاب فایل اکسل (.xlsx, .xls)</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          </label>
          {fileName && <p className="text-green-400 text-sm mt-2">✓ {fileName}</p>}
          {data.length > 0 && (
            <div className="mt-4">
              <h4 className="text-slate-300 text-sm mb-2">پیش‌نمایش ({data.length} ردیف):</h4>
              <div className="bg-slate-700/30 rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-700/50 sticky top-0"><tr>{headers.map(h=><th key={h} className="px-2 py-1 text-right text-slate-300">{h}</th>)}</tr></thead>
                  <tbody>{data.slice(0, 20).map((row, i) => (<tr key={i} className="hover:bg-slate-700/20">{row.map((cell, j) => (<td key={j} className="px-2 py-1 text-slate-300">{String(cell||'')}</td>))}</tr>))}</tbody>
                </table>
              </div>
              <button onClick={doImport} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">✓ وارد کردن {data.length} رکورد</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== SETTINGS =====
  const SettingsSection = () => {
    const handleExport = () => {
      const data = { people, products, serials, cardex, invoices, cheques, banks, categories, brands, models, colors, audit, exportDate: new Date().toISOString() };
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
          if(data.people)setPeople(data.people);if(data.products)setProducts(data.products);
          if(data.serials)setSerials(data.serials);if(data.cardex)setCardex(data.cardex);
          if(data.invoices)setInvoices(data.invoices);if(data.cheques)setCheques(data.cheques);
          if(data.banks)setBanks(data.banks);if(data.audit)setAudit(data.audit);
          alert('✅ بازیابی شد!');
        } catch { alert('❌ خطا'); }
      };
      reader.readAsText(file);
    };
    const handleReset = () => {
      if (!confirm('⚠️ هشدار: تمام اطلاعات حذف خواهد شد!\n\nآیا مطمئن هستید؟')) return;
      if (!confirm('⚠️ تأیید نهایی: این عمل قابل بازگشت نیست!\n\nادامه دهید؟')) return;
      setPeople([]);
      setProducts([]);
      setSerials([]);
      setCardex([]);
      setInvoices([]);
      setCheques([]);
      setBanks([]);
      setAudit([]);
      localStorage.clear();
      alert('✅ تمام اطلاعات حذف شد!');
      window.location.reload();
    };
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">⚙️ تنظیمات</h2>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">پشتیبان‌گیری و بازیابی</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 پشتیبان‌گیری</button>
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center cursor-pointer">📥 بازیابی<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">📊 آمار</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center"><p className="text-2xl font-bold">{people.filter(p=>!p.isDeleted).length}</p><p className="text-slate-400 text-sm">شخص</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{products.filter(p=>!p.isDeleted).length}</p><p className="text-slate-400 text-sm">کالا</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{serials.length}</p><p className="text-slate-400 text-sm">سریال</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{invoices.length}</p><p className="text-slate-400 text-sm">فاکتور</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{cheques.filter(c=>!c.isDeleted).length}</p><p className="text-slate-400 text-sm">چک</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{cardex.length}</p><p className="text-slate-400 text-sm">کاردکس</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{audit.length}</p><p className="text-slate-400 text-sm">Audit</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{banks.length}</p><p className="text-slate-400 text-sm">بانک</p></div>
          </div>
        </div>
        <div className="bg-rose-900/30 rounded-2xl p-6 border border-rose-500/50">
          <h3 className="text-lg font-bold mb-4 text-rose-400">⚠️ خام کردن برنامه</h3>
          <p className="text-slate-300 mb-4">این دکمه تمام اطلاعات وارد شده را حذف می‌کند. قبل از خام کردن، حتماً پشتیبان‌گیری کنید!</p>
          <button onClick={handleReset} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors">
            🗑️ خام کردن برنامه
          </button>
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventorySection />;
      case 'serials': return <SerialsSection />;
      case 'cardex': return <CardexSection />;
      case 'people': return <PeopleSection />;
      case 'purchase': return <InvoiceForm type="purchase" />;
      case 'sale': return <InvoiceForm type="sale" />;
      case 'invoices': return <InvoiceList />;
      case 'returns': return <ReturnsSection />;
      case 'cheques': return <ChequesSection />;
      case 'installments': return <InstallmentsSection />;
      case 'banks': return <BanksSection />;
      case 'reports': return <ReportsSection />;
      case 'audit': return <AuditSection />;
      case 'import': return <ImportSection />;
      case 'settings': return <SettingsSection />;
      default: return <Dashboard />;
    }
  };

  const menuItems: { id: Section; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: '🏠' },
    { id: 'inventory', label: 'کالا و انبار', icon: '🏭' },
    { id: 'cardex', label: 'کاردکس', icon: '📊' },
    { id: 'people', label: 'اشخاص', icon: '👥' },
    { id: 'purchase', label: 'فاکتور خرید', icon: '🛒' },
    { id: 'sale', label: 'فاکتور فروش', icon: '💰' },
    { id: 'invoices', label: 'لیست فاکتورها', icon: '📋' },
    { id: 'returns', label: 'برگشت', icon: '🔄' },
    { id: 'cheques', label: 'چک‌ها', icon: '📝' },
    { id: 'installments', label: 'اقساط', icon: '💳' },
    { id: 'banks', label: 'بانک‌ها', icon: '🏦' },
    { id: 'reports', label: 'گزارش‌ها', icon: '📈' },
    { id: 'audit', label: 'ردیابی', icon: '📜' },
    { id: 'import', label: 'ورود اکسل', icon: '📥' },
    { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      <div className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 transition-all duration-300 z-40 ${sidebarOpen?'w-64':'w-0 lg:w-16'} overflow-hidden`}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-xl shrink-0">🏪</div>
            {sidebarOpen && <div><h2 className="text-white font-bold text-sm">تکنوکالا</h2><p className="text-slate-400 text-xs">حسابداری فروشگاه</p></div>}
          </div>
        </div>
        <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100%-80px)]">
          {menuItems.map(item=>(
            <button key={item.id} onClick={()=>setSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-right ${section===item.id?'bg-gradient-to-r from-blue-600 to-violet-600 text-white':'text-slate-300 hover:bg-slate-800/50'}`}>
              <span className="text-lg shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="font-medium text-xs">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className={`transition-all duration-300 ${sidebarOpen?'lg:mr-64':'lg:mr-16'}`}>
        <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700">☰</button>
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
