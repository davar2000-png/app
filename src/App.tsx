import { useState, useEffect } from 'react';
import type {
  Person, PersonDocument, PersonGroup, Guarantor, Product, CardexEntry,
  Invoice, InvoiceItem, Installment, Cheque, Bank,
  ProductCategory, ProductBrand, ProductModel, ProductColor,
  AuditLog, Section
} from './types';
import {
  generateId, formatNumber, formatCurrency, getTodayDate,
  generateInvoiceNumber, generateProductCode, jalaliDate, isOverdue, parseExcelFile
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
    { id: 'surface', categoryId: 'laptop', name: 'Surface' },
    { id: 'lenovo', categoryId: 'laptop', name: 'Lenovo' },
    { id: 'ps4', categoryId: 'console', name: 'PS4' },
    { id: 'ps5', categoryId: 'console', name: 'PS5' },
    { id: 'hp-p', categoryId: 'printer', name: 'HP' },
    { id: 'canon', categoryId: 'printer', name: 'Canon' },
    { id: 'brother', categoryId: 'printer', name: 'Brother' },
  ]);
  const [models, setModels] = useLS<ProductModel[]>('tk_models', [
    { id: 'hp-laser', brandId: 'hp-p', name: 'LaserJet Pro M404n' },
    { id: 'canon-pixma', brandId: 'canon', name: 'PIXMA G3420' },
    { id: 'brother-hl', brandId: 'brother', name: 'HL-L2350DW' },
  ]);
  const [colors, setColors] = useLS<ProductColor[]>('tk_colors', [
    { id: 'black', name: 'مشکی', code: '#000000' },
    { id: 'white', name: 'سفید', code: '#ffffff' },
  ]);
  const [audit, setAudit] = useLS<AuditLog[]>('tk_audit', []);
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const log = (action: AuditLog['action'], entityType: string, entityId: string, entityName?: string, details?: string) => {
    setAudit(prev => [{ id: generateId(), action, entityType, entityId, entityName, details, timestamp: new Date().toISOString() }, ...prev].slice(0, 5000));
  };

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name || 'نامشخص';
  const getProductName = (p: Product) => {
    const b = brands.find(x => x.id === p.brandId)?.name || '';
    const m = models.find(x => x.id === p.modelId)?.name || '';
    return [b, m, p.color, p.ram && `${p.ram}GB`, p.storage && `${p.storage}GB`].filter(Boolean).join(' - ');
  };

  // Lightbox Component
  const Lightbox = () => lightboxImage && (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setLightboxImage(null)}>
      <button className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full text-2xl" onClick={() => setLightboxImage(null)}>✕</button>
      <img src={lightboxImage} alt="تصویر بزرگ" className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
    </div>
  );

  // Image Upload Component with 3:2 aspect ratio
  const ImageUpload = ({ image, onImageChange, label = 'عکس پروفایل', size = 'md' }: { image?: string; onImageChange: (img: string) => void; label?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'w-20 h-14', md: 'w-48 h-32', lg: 'w-60 h-40' };
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('حجم فایل بیش از 5 مگابایت است'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 320; canvas.height = 200;
          const ctx = canvas.getContext('2d')!;
          const targetRatio = 320 / 200;
          const imgRatio = img.width / img.height;
          let cropWidth, cropHeight, startX, startY;
          if (imgRatio > targetRatio) {
            cropHeight = img.height; cropWidth = img.height * targetRatio;
            startX = (img.width - cropWidth) / 2; startY = 0;
          } else {
            cropWidth = img.width; cropHeight = img.width / targetRatio;
            startX = 0; startY = (img.height - cropHeight) / 2;
          }
          ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, 320, 200);
          onImageChange(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    return (
      <div className="flex flex-col items-center gap-2">
        <label className="text-slate-300 text-sm">{label}</label>
        <div className={`${sizes[size]} rounded-xl overflow-hidden border-2 border-blue-500/30 relative group cursor-pointer`}>
          {image ? (
            <>
              <img src={image} alt="پروفایل" className="w-full h-full object-cover" onClick={() => setLightboxImage(image)} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <span className="text-white text-xs">📷 تغییر</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-slate-700/50 flex flex-col items-center justify-center gap-1">
              <span className="text-3xl">📷</span>
              <span className="text-[10px] text-slate-500">آپلود تصویر</span>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        {image && <button onClick={() => onImageChange('')} className="text-rose-400 text-xs">✕ حذف</button>}
      </div>
    );
  };

  // Dashboard
  const Dashboard = () => {
    const today = getTodayDate();
    const activeInv = invoices.filter(i => i.status === 'active');
    const todaySales = activeInv.filter(i => i.date === today && i.type === 'sale').reduce((s, i) => s + i.total, 0);
    const todayPurchases = activeInv.filter(i => i.date === today && i.type === 'purchase').reduce((s, i) => s + i.total, 0);
    const totalDebt = activeInv.reduce((s, i) => s + i.remaining, 0);
    const totalProfit = activeInv.filter(i => i.type === 'sale').reduce((s, inv) => s + inv.items.reduce((ss, it) => ss + (it.profit || 0), 0), 0);
    const lowStock = products.filter(p => !p.isDeleted && p.stock <= p.minStock);
    const overdueCheques = cheques.filter(c => !c.isDeleted && c.type === 'received' && c.status === 'pending' && isOverdue(c.dueDate));
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
            { l: 'چک معوق', v: formatNumber(overdueCheques.length), c: 'from-orange-600 to-orange-800', i: '📝' },
          ].map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.c} rounded-2xl p-4 text-white`}>
              <div className="flex items-center justify-between mb-2"><span className="text-sm opacity-80">{c.l}</span><span className="text-xl">{c.i}</span></div>
              <p className="text-xl font-bold">{c.v}</p>
            </div>
          ))}
        </div>
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
    );
  };

  // People Section with full features
  const PeopleSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [showGroupManager, setShowGroupManager] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [form, setForm] = useState<Partial<Person>>({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: generateId(), name: '', documents: [] } });
    const [editId, setEditId] = useState<string | null>(null);
    const [viewDocs, setViewDocs] = useState<{person: Person, type: 'person' | 'guarantor'} | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

    const filtered = people.filter(p => !p.isDeleted &&
      (filter === 'all' || p.type === filter) &&
      (groupFilter === 'all' || p.groupId === groupFilter) &&
      (!search || p.name.includes(search) || p.mobile?.includes(search) || p.nationalId?.includes(search))
    );

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, isGuarantor = false) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const doc: PersonDocument = { id: generateId(), name: file.name, type: file.type, data: ev.target?.result as string, date: getTodayDate() };
          if (isGuarantor) {
            setForm(prev => ({ ...prev, guarantor: { ...prev.guarantor!, documents: [...(prev.guarantor!.documents || []), doc] } }));
          } else {
            setForm(prev => ({ ...prev, documents: [...(prev.documents || []), doc] }));
          }
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
      setForm({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: generateId(), name: '', documents: [] } });
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
            <button onClick={() => setShowGroupManager(!showGroupManager)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl">📁 گروه‌ها</button>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: generateId(), name: '', documents: [] } }); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">{showForm ? '✕ بستن' : '➕ شخص جدید'}</button>
          </div>
        </div>

        {/* Group Manager */}
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
              }} className="px-4 bg-violet-600 text-white rounded-xl">➕</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {personGroups.map(g => (
                <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border group" style={{borderColor: g.color+'50', backgroundColor: g.color+'15'}}>
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: g.color}} />
                  <span className="text-sm" style={{color: g.color}}>{g.name}</span>
                  <button onClick={()=>{if(confirm('حذف؟')){setPersonGroups(personGroups.filter(x=>x.id!==g.id));setPeople(people.map(p=>p.groupId===g.id?{...p,groupId:undefined}:p));}}} className="opacity-0 group-hover:opacity-100 text-rose-400 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Person Form */}
        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">{editId ? '✏️ ویرایش' : '➕ ثبت'} شخص</h3>
            
            {/* Image Upload - 3:2 ratio */}
            <div className="mb-4">
              <ImageUpload image={form.image} onImageChange={(img) => setForm({...form, image: img || undefined})} label="📷 عکس پروفایل (از روی کارت ملی)" size="md" />
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
            
            {/* Documents */}
            <div className="mt-4">
              <label className="text-slate-300 text-sm mb-2 block">📎 مدارک شخص</label>
              <label className="flex items-center justify-center gap-2 bg-slate-600/50 border border-dashed border-slate-500 rounded-xl p-3 cursor-pointer hover:bg-slate-600">
                <span>📎 انتخاب فایل</span>
                <input type="file" multiple accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, false)} className="hidden" />
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
            
            {/* Guarantor Section */}
            <div className="mt-4 border border-amber-500/30 rounded-xl p-4 bg-amber-500/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-amber-400 font-bold">🛡️ ضامن (اختیاری)</h4>
                {(!form.guarantor?.name) && (
                  <button onClick={()=>setForm({...form, guarantor: { id: generateId(), name: '', documents: [] }})} className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg">➕ افزودن ضامن</button>
                )}
              </div>
              {form.guarantor?.name !== undefined && form.guarantor?.name !== '' && (
                <div className="space-y-3">
                  {/* Guarantor Image */}
                  <ImageUpload image={form.guarantor.image} onImageChange={(img) => setForm({...form, guarantor: {...form.guarantor!, image: img || undefined}})} label="📷 عکس ضامن" size="sm" />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.guarantor.name||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, name:e.target.value}})} placeholder="نام ضامن *" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                    <input value={form.guarantor.mobile||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, mobile:e.target.value}})} placeholder="موبایل" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                    <input value={form.guarantor.nationalId||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, nationalId:e.target.value}})} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                    <input value={form.guarantor.job||''} onChange={e=>setForm({...form, guarantor:{...form.guarantor!, job:e.target.value}})} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm" />
                  </div>
                  
                  {/* Guarantor Documents */}
                  <div>
                    <label className="flex items-center justify-center gap-2 bg-slate-600/50 border border-dashed border-amber-500/50 rounded-xl p-2 cursor-pointer hover:bg-slate-600">
                      <span className="text-xs">📎 مدارک ضامن</span>
                      <input type="file" multiple accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, true)} className="hidden" />
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

        {/* Filters */}
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

        {/* People List */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50"><span className="text-slate-400 text-sm">{filtered.length} نفر</span></div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(p => (
              <div key={p.id} className="p-3 hover:bg-slate-700/20 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {p.image ? <img src={p.image} className="w-20 h-14 rounded-xl object-cover cursor-pointer" onClick={() => setLightboxImage(p.image!)} /> : <div className="w-20 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">👤</div>}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{p.name} {p.familyName||''}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{typeLabel[p.type]}</span>
                      {p.groupId && (() => {
                        const g = personGroups.find(x => x.id === p.groupId);
                        return g ? <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: g.color+'30', color: g.color}}>{g.name}</span> : null;
                      })()}
                      {(p.documents?.length || 0) > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">📎 {p.documents.length}</span>}
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
                  {p.image && <button onClick={() => setLightboxImage(p.image!)} className="text-blue-400 text-sm">🖼️</button>}
                  {(p.documents?.length || 0) > 0 && <button onClick={() => setViewDocs({person: p, type: 'person'})} className="text-cyan-400 text-sm">📎</button>}
                  {p.guarantor && <button onClick={() => setViewDocs({person: p, type: 'guarantor'})} className="text-amber-400 text-sm">🛡️</button>}
                  <button onClick={()=>{setForm(p);setEditId(p.id);setShowForm(true);}} className="opacity-0 group-hover:opacity-100 text-amber-400">✏️</button>
                  <button onClick={()=>del(p.id)} className="opacity-0 group-hover:opacity-100 text-rose-400">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Documents/Guarantor Modal */}
        {viewDocs && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={()=>setViewDocs(null)}>
            <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">
                {viewDocs.type === 'person' ? `📎 ${viewDocs.person.name}` : `🛡️ ضامن ${viewDocs.person.name}`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Person Image & Documents */}
                <div>
                  <h4 className="text-blue-400 font-bold mb-3">👤 تصویر و مدارک شخص</h4>
                  {viewDocs.person.image && (
                    <img src={viewDocs.person.image} alt="شخص" className="w-full h-40 object-cover rounded-xl mb-3 cursor-pointer" onClick={() => setLightboxImage(viewDocs.person.image!)} />
                  )}
                  {viewDocs.person.documents.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {viewDocs.person.documents.map(d => (
                        <div key={d.id} className="bg-slate-700/30 rounded-xl p-2">
                          {d.type.includes('image') ? (
                            <img src={d.data} alt={d.name} className="w-full h-24 object-cover rounded-lg mb-1 cursor-pointer" onClick={() => setLightboxImage(d.data)} />
                          ) : (
                            <div className="w-full h-24 bg-slate-600/50 rounded-lg mb-1 flex items-center justify-center text-2xl">📄</div>
                          )}
                          <p className="text-[10px] text-slate-300 truncate">{d.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Guarantor Image & Documents */}
                {viewDocs.person.guarantor && (
                  <div>
                    <h4 className="text-amber-400 font-bold mb-3">🛡️ تصویر و مدارک ضامن</h4>
                    {viewDocs.person.guarantor.image && (
                      <img src={viewDocs.person.guarantor.image} alt="ضامن" className="w-full h-40 object-cover rounded-xl mb-3 cursor-pointer" onClick={() => setLightboxImage(viewDocs.person.guarantor!.image!)} />
                    )}
                    {viewDocs.person.guarantor.documents.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {viewDocs.person.guarantor.documents.map(d => (
                          <div key={d.id} className="bg-slate-700/30 rounded-xl p-2">
                            {d.type.includes('image') ? (
                              <img src={d.data} alt={d.name} className="w-full h-24 object-cover rounded-lg mb-1 cursor-pointer" onClick={() => setLightboxImage(d.data)} />
                            ) : (
                              <div className="w-full h-24 bg-slate-600/50 rounded-lg mb-1 flex items-center justify-center text-2xl">📄</div>
                            )}
                            <p className="text-[10px] text-slate-300 truncate">{d.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={()=>setViewDocs(null)} className="mt-4 w-full bg-slate-700 text-white py-2 rounded-xl">بستن</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inventory Section
  const InventorySection = () => {
    const [tab, setTab] = useState<'add'|'list'|'cat'|'brand'|'model'|'color'>('add');
    const [pCat,setPCat]=useState('');const [pBrand,setPBrand]=useState('');const [pModel,setPModel]=useState('');
    const [pColor,setPColor]=useState('');const [pRam,setPRam]=useState('');const [pStorage,setPStorage]=useState('');
    const [pSerial,setPSerial]=useState('');const [pBuy,setPBuy]=useState('');const [pSell,setPSell]=useState('');
    const [pStock,setPStock]=useState('0');const [pMin,setPMin]=useState('0');const [pReorder,setPReorder]=useState('0');
    const [pNeg,setPNeg]=useState(false);
    const [newCat,setNewCat]=useState({name:'',icon:'📦'});
    const [newBrand,setNewBrand]=useState({name:'',categoryId:''});
    const [newModel,setNewModel]=useState({name:'',brandId:''});
    const [newColor,setNewColor]=useState({name:'',code:'#000000'});

    const addProduct = () => {
      if (!pCat||!pBrand||!pModel||!pBuy||!pSell) return alert('فیلدهای ستاره‌دار الزامی');
      const p: Product = {
        id:generateId(), code:generateProductCode(), name:'', categoryId:pCat, brandId:pBrand, modelId:pModel,
        color:colors.find(c=>c.id===pColor)?.name, ram:pRam, storage:pStorage, serialNumber:pSerial,
        buyPrice:Number(pBuy), sellPrice:Number(pSell), stock:Number(pStock),
        minStock:Number(pMin), reorderPoint:Number(pReorder), allowNegativeStock:pNeg,
        isDeleted:false, createdAt:new Date().toISOString(),
      };
      p.name = getProductName(p);
      setProducts(prev=>[p,...prev]);
      log('CREATE','product',p.id,p.name);
      setPCat('');setPBrand('');setPModel('');setPColor('');setPRam('');setPStorage('');setPSerial('');
      setPBuy('');setPSell('');setPStock('0');setPMin('0');setPReorder('0');setPNeg(false);
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
              <div><label className="text-slate-400 text-xs">شماره سریال</label><input value={pSerial} onChange={e=>setPSerial(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">قیمت خرید *</label><input type="number" value={pBuy} onChange={e=>setPBuy(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">قیمت فروش *</label><input type="number" value={pSell} onChange={e=>setPSell(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">موجودی</label><input type="number" value={pStock} onChange={e=>setPStock(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">حداقل موجودی</label><input type="number" value={pMin} onChange={e=>setPMin(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div><label className="text-slate-400 text-xs">نقطه سفارش</label><input type="number" value={pReorder} onChange={e=>setPReorder(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" /></div>
              <div className="flex items-end gap-2 pb-2">
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
                    <p className="text-white font-medium">{getProductName(p)}</p>
                    <p className="text-slate-400 text-xs">کد: {p.code} | موجودی: {p.stock} | سریال: {p.serialNumber||'-'} | خرید: {formatNumber(p.buyPrice)} | فروش: {formatNumber(p.sellPrice)}</p>
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
          {categories.map(c=>(<div key={c.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between"><span className="text-white">{c.icon} {c.name}</span><button onClick={()=>{if(confirm('حذف؟')){setCategories(categories.filter(x=>x.id!==c.id));setBrands(brands.filter(b=>b.categoryId!==c.id));}}} className="text-rose-400">🗑️</button></div>))}
        </div>)}
        {tab==='brand' && (<div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex gap-2 mb-4">
            <select value={newBrand.categoryId} onChange={e=>setNewBrand({...newBrand,categoryId:e.target.value})} className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white"><option value="">گروه...</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input value={newBrand.name} onChange={e=>setNewBrand({...newBrand,name:e.target.value})} placeholder="نام برند" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={()=>{if(newBrand.categoryId&&newBrand.name){setBrands([...brands,{id:generateId(),...newBrand}]);setNewBrand({name:'',categoryId:''});}}} className="px-4 bg-blue-600 text-white rounded-xl">➕</button>
          </div>
          {brands.map(b=>{const cat=categories.find(c=>c.id===b.categoryId);return(<div key={b.id} className="bg-slate-700/30 rounded-xl p-3 mb-2 flex justify-between"><span className="text-white">{cat?.icon} {b.name}</span><button onClick={()=>{if(confirm('حذف؟')){setBrands(brands.filter(x=>x.id!==b.id));setModels(models.filter(m=>m.brandId!==b.id));}}} className="text-rose-400">🗑️</button></div>);})}
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

  // Cardex Section with Search
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
                      <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${c.type==='purchase_in'?'bg-emerald-500/20 text-emerald-400':c.type==='sale_out'?'bg-rose-500/20 text-rose-400':'bg-blue-500/20 text-blue-400'}`}>{c.type==='purchase_in'?'خرید':c.type==='sale_out'?'فروش':'اصلاح'}</span></td>
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

  // Settings Section
  const SettingsSection = () => {
    const handleExport = () => {
      const data = { people, products, cardex, invoices, cheques, banks, categories, brands, models, colors, audit, exportDate: new Date().toISOString() };
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
          if(data.cardex)setCardex(data.cardex);
          if(data.invoices)setInvoices(data.invoices);if(data.cheques)setCheques(data.cheques);
          if(data.banks)setBanks(data.banks);if(data.audit)setAudit(data.audit);
          alert('✅ بازیابی شد!');
        } catch { alert('❌ خطا'); }
      };
      reader.readAsText(file);
    };
    const handleReset = () => {
      if (!confirm('⚠️ تمام اطلاعات حذف خواهد شد!\nآیا مطمئن هستید؟')) return;
      if (!confirm('⚠️ تأیید نهایی: این عمل قابل بازگشت نیست!')) return;
      setPeople([]);setProducts([]);setCardex([]);setInvoices([]);setCheques([]);setBanks([]);setAudit([]);
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
        <div className="bg-rose-900/30 rounded-2xl p-6 border border-rose-500/50">
          <h3 className="text-lg font-bold mb-4 text-rose-400">⚠️ خام کردن برنامه</h3>
          <p className="text-slate-300 mb-4">این دکمه تمام اطلاعات را حذف می‌کند. قبل از خام کردن، حتماً پشتیبان‌گیری کنید!</p>
          <button onClick={handleReset} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors">🗑️ خام کردن برنامه</button>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">📊 آمار</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center"><p className="text-2xl font-bold">{people.filter(p=>!p.isDeleted).length}</p><p className="text-slate-400 text-sm">شخص</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{products.filter(p=>!p.isDeleted).length}</p><p className="text-slate-400 text-sm">کالا</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{invoices.length}</p><p className="text-slate-400 text-sm">فاکتور</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{cheques.filter(c=>!c.isDeleted).length}</p><p className="text-slate-400 text-sm">چک</p></div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventorySection />;
      case 'cardex': return <CardexSection />;
      case 'people': return <PeopleSection />;
      case 'settings': return <SettingsSection />;
      default: return <div className="text-center py-12 text-slate-400"><span className="text-5xl block mb-4">🚧</span>بخش در حال توسعه</div>;
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
      <Lightbox />
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
