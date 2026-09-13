import { useState, useEffect } from 'react';
import type {
  Person, PersonDocument, PersonGroup, Guarantor, Product, CardexEntry,
  Invoice, InvoiceItem, Installment, Cheque, Bank,
  Payment, ReturnInvoice, Proforma, StoreSettings, SecuritySettings, InvoiceTag,
  ProductCategory, ProductBrand, ProductModel, ProductColor,
  AuditLog, Section
} from './types';
import {
  generateId, formatNumber, formatCurrency, getTodayDate,
  generateInvoiceNumber, generateProductCode, jalaliDate, isOverdue, parseExcelFile
} from './utils';
import PersonPicker from './components/PersonPicker';
import ProductPicker from './components/ProductPicker';
import PaymentPanel, { PaymentRow } from './components/PaymentPanel';

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
  const [payments, setPayments] = useLS<Payment[]>('tk_payments', []);
  const [returnInvoices, setReturnInvoices] = useLS<ReturnInvoice[]>('tk_returns', []);
  const [proformas, setProformas] = useLS<Proforma[]>('tk_proformas', []);
  const [cheques, setCheques] = useLS<Cheque[]>('tk_cheques', []);
  const [banks, setBanks] = useLS<Bank[]>('tk_banks', []);
  const [storeSettings, setStoreSettings] = useLS<StoreSettings>('tk_store_settings', {
    storeName: 'تکنوکالا',
    manager: '',
    address: '',
    phone: '',
    mobile: '',
    printFooter: 'با تشکر از خرید شما',
    defaultPaper: 'A5',
  });
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
  const [securitySettings, setSecuritySettings] = useLS<SecuritySettings>('tk_security', {
    pinEnabled: false,
    autoLockMinutes: 10,
  });
  const [invoiceTags, setInvoiceTags] = useLS<InvoiceTag[]>('tk_tags', [
    { id: 'urgent', name: 'فوری', color: '#ef4444' },
    { id: 'vip', name: 'VIP', color: '#f59e0b' },
    { id: 'wholesale', name: 'عمده', color: '#10b981' },
  ]);
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

    // نمودار فروش ۷ روز اخیر
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    const salesByDay = last7Days.map(date => 
      invoices.filter(i => i.date === date && i.type === 'sale' && i.status === 'active').reduce((s, i) => s + i.total, 0)
    );
    const maxSale = Math.max(...salesByDay, 1);

    // یادآوری‌ها
    const overdueInstallments = invoices.flatMap(i => i.installments || []).filter(i => i.status === 'pending' && isOverdue(i.dueDate));
    const reminders = [
      ...overdueCheques.map(c => ({ type: 'چک', person: people.find(p => p.id === c.relatedPersonId)?.name || 'نامشخص', amount: c.amount, date: c.dueDate })),
      ...overdueInstallments.map(i => ({ type: 'قسط', person: 'نامشخص', amount: i.amount, date: i.dueDate })),
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">🏠 داشبورد</h2>
        
        {/* آمار کلی */}
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

        {/* نمودار فروش ۷ روز */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">📊 نمودار فروش ۷ روز اخیر</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {salesByDay.map((sale, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-500 hover:to-emerald-300" style={{ height: `${(sale / maxSale) * 100}%`, minHeight: sale > 0 ? '20px' : '0' }} title={`${formatNumber(sale)} تومان`} />
                <span className="text-xs text-slate-400">{new Date(last7Days[i]).toLocaleDateString('fa-IR', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* یادآوری‌ها */}
        {reminders.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
            <h3 className="text-rose-400 font-bold mb-3">🔔 یادآوری‌ها ({reminders.length})</h3>
            <div className="space-y-2">
              {reminders.slice(0, 5).map((r, i) => (
                <div key={i} className="flex justify-between items-center text-sm bg-slate-800/50 rounded-lg p-3">
                  <div>
                    <span className="text-rose-400 font-bold">{r.type}</span>
                    <span className="text-slate-300 mr-2">- {r.person}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-rose-400 font-bold">{formatNumber(r.amount)} تومان</p>
                    <p className="text-slate-400 text-xs">{jalaliDate(r.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* کم‌موجود */}
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
    const [form, setForm] = useState<Partial<Person>>({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: generateId(), name: '', mobile: '', phone: '', nationalId: '', address: '', job: '', documents: [] } });
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
      setForm({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: generateId(), name: '', mobile: '', phone: '', nationalId: '', address: '', job: '', documents: [] } });
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
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ type: 'customer', creditor: 0, debtor: 0, documents: [], guarantor: { id: generateId(), name: '', mobile: '', phone: '', nationalId: '', address: '', job: '', documents: [] } }); }}
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
            
            {/* نوع شخص - اولین فیلد */}
            <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <label className="text-blue-400 text-sm font-bold mb-2 block">🏷️ نوع شخص *</label>
              <select 
                value={form.type || 'customer'} 
                onChange={e => {
                  const newType = e.target.value;
                  setForm({ 
                    ...form, 
                    type: newType as any,
                    // اگر فروشنده باشد، ضامن حذف شود
                    guarantor: newType === 'supplier' ? undefined : form.guarantor
                  });
                }} 
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white"
              >
                <option value="customer">🛒 خریدار (مشتری)</option>
                <option value="supplier">🏪 فروشنده (تأمین‌کننده)</option>
                <option value="pensioner">💰 مستمری‌بگیر</option>
                <option value="employee_irib">📺 کارمند صدا و سیما</option>
                <option value="employee_azad">🎓 کارمند دانشگاه آزاد</option>
                <option value="employee_mohaghegh">🎓 کارمند دانشگاه محقق اردبیلی</option>
                <option value="employee_faranja">👮 پرسنل فراجا</option>
                <option value="welfare_card">🎫 دارنده کارت رفاهی (اوراق گام)</option>
              </select>
            </div>
            
            {/* Image Upload - 3:2 ratio */}
            <div className="mb-4">
              <ImageUpload image={form.image} onImageChange={(img) => setForm({...form, image: img || undefined})} label="📷 عکس پروفایل (از روی کارت ملی)" size="md" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* نام و نام خانوادگی در یک فیلد */}
              <input 
                value={`${form.name || ''} ${form.familyName || ''}`.trim()} 
                onChange={e => {
                  const fullName = e.target.value.trim();
                  const parts = fullName.split(' ');
                  const firstName = parts[0] || '';
                  const lastName = parts.slice(1).join(' ') || '';
                  setForm({...form, name: firstName, familyName: lastName});
                }} 
                placeholder="نام و نام خانوادگی *" 
                className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white md:col-span-2" 
              />
              <select value={form.groupId||''} onChange={e=>setForm({...form,groupId:e.target.value||undefined})} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">بدون گروه</option>
                {personGroups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
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
            
            {/* Guarantor Section - فقط برای غیر فروشنده */}
            {form.type !== 'supplier' && (
            <div className="mt-4 border-2 border-amber-500/30 rounded-xl p-5 bg-gradient-to-br from-amber-500/5 to-amber-600/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h4 className="text-amber-400 font-bold text-lg">ضامن</h4>
                    <p className="text-slate-400 text-xs">اطلاعات ضامن شخص (اختیاری)</p>
                  </div>
                </div>
                {!form.guarantor?.name && (
                  <button 
                    onClick={()=>setForm({...form, guarantor: { id: generateId(), name: '', mobile: '', phone: '', nationalId: '', address: '', job: '', documents: [] }})} 
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
                  >
                    ➕ افزودن ضامن
                  </button>
                )}
              </div>
              
              {form.guarantor?.name !== undefined && form.guarantor?.name !== '' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Guarantor Image */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <ImageUpload 
                      image={form.guarantor.image} 
                      onImageChange={(img) => setForm({...form, guarantor: {...form.guarantor!, image: img || undefined}})} 
                      label="📷 عکس پروفایل ضامن (از روی کارت ملی)" 
                      size="md" 
                    />
                  </div>
                  
                  {/* Guarantor Info Fields */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <h5 className="text-slate-300 text-sm font-bold mb-3">📝 اطلاعات ضامن</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">نام و نام خانوادگی *</label>
                        <input 
                          value={form.guarantor.name||''} 
                          onChange={e=>setForm({...form, guarantor:{...form.guarantor!, name:e.target.value}})} 
                          placeholder="نام کامل ضامن" 
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">شماره موبایل *</label>
                        <input 
                          value={form.guarantor.mobile||''} 
                          onChange={e=>setForm({...form, guarantor:{...form.guarantor!, mobile:e.target.value}})} 
                          placeholder="09xxxxxxxxx" 
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">کد ملی</label>
                        <input 
                          value={form.guarantor.nationalId||''} 
                          onChange={e=>setForm({...form, guarantor:{...form.guarantor!, nationalId:e.target.value}})} 
                          placeholder="xxxxxxxxxx" 
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">شغل</label>
                        <input 
                          value={form.guarantor.job||''} 
                          onChange={e=>setForm({...form, guarantor:{...form.guarantor!, job:e.target.value}})} 
                          placeholder="شغل ضامن" 
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-slate-400 text-xs mb-1 block">تلفن ثابت</label>
                        <input 
                          value={form.guarantor.phone||''} 
                          onChange={e=>setForm({...form, guarantor:{...form.guarantor!, phone:e.target.value}})} 
                          placeholder="021xxxxxxxx" 
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-slate-400 text-xs mb-1 block">آدرس</label>
                        <textarea 
                          value={form.guarantor.address||''} 
                          onChange={e=>setForm({...form, guarantor:{...form.guarantor!, address:e.target.value}})} 
                          placeholder="آدرس کامل ضامن" 
                          rows={2}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors resize-none" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Guarantor Documents */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <h5 className="text-slate-300 text-sm font-bold mb-3">📎 مدارک ضامن</h5>
                    <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-2 border-dashed border-amber-500/50 rounded-xl p-4 cursor-pointer hover:from-amber-600/30 hover:to-amber-700/30 transition-all">
                      <span className="text-3xl">📎</span>
                      <div className="text-center">
                        <span className="text-amber-400 font-bold text-sm block">انتخاب فایل‌های مدارک ضامن</span>
                        <span className="text-slate-400 text-xs">کارت ملی، قرارداد و سایر مدارک</span>
                      </div>
                      <input type="file" multiple accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, true)} className="hidden" />
                    </label>
                    {form.guarantor.documents && form.guarantor.documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-slate-400 text-xs">📁 مدارک بارگذاری شده ({form.guarantor.documents.length}):</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {form.guarantor.documents.map(d => (
                            <div key={d.id} className="bg-slate-700/50 rounded-lg p-2 flex items-center gap-2 group relative">
                              <span className="text-lg">{d.type.includes('image') ? '🖼️' : '📄'}</span>
                              <span className="text-xs text-slate-300 truncate flex-1">{d.name}</span>
                              <button 
                                onClick={() => setForm({...form, guarantor: {...form.guarantor!, documents: form.guarantor!.documents.filter(x=>x.id!==d.id)}})} 
                                className="text-rose-400 hover:text-rose-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="حذف مدرک"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Remove Guarantor Button */}
                  <button 
                    onClick={()=>setForm({...form, guarantor: undefined})} 
                    className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    🗑️ حذف ضامن
                  </button>
                </div>
              )}
            </div>
            )}
            
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
                    <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      تصویر و اطلاعات ضامن
                    </h4>
                    
                    {/* Guarantor Image */}
                    {viewDocs.person.guarantor.image && (
                      <div className="mb-3">
                        <img 
                          src={viewDocs.person.guarantor.image} 
                          alt="ضامن" 
                          className="w-full h-40 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setLightboxImage(viewDocs.person.guarantor!.image!)} 
                        />
                      </div>
                    )}
                    
                    {/* Guarantor Info */}
                    <div className="bg-slate-700/30 rounded-xl p-3 mb-3">
                      <h6 className="text-slate-300 text-sm font-bold mb-2">📝 اطلاعات ضامن</h6>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">نام:</span>
                          <span className="text-white">{viewDocs.person.guarantor.name}</span>
                        </div>
                        {viewDocs.person.guarantor.mobile && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">موبایل:</span>
                            <span className="text-white">{viewDocs.person.guarantor.mobile}</span>
                          </div>
                        )}
                        {viewDocs.person.guarantor.phone && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">تلفن:</span>
                            <span className="text-white">{viewDocs.person.guarantor.phone}</span>
                          </div>
                        )}
                        {viewDocs.person.guarantor.nationalId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">کد ملی:</span>
                            <span className="text-white">{viewDocs.person.guarantor.nationalId}</span>
                          </div>
                        )}
                        {viewDocs.person.guarantor.job && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">شغل:</span>
                            <span className="text-white">{viewDocs.person.guarantor.job}</span>
                          </div>
                        )}
                        {viewDocs.person.guarantor.address && (
                          <div className="pt-1">
                            <span className="text-slate-400 block mb-1">آدرس:</span>
                            <span className="text-white text-xs">{viewDocs.person.guarantor.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Guarantor Documents */}
                    {viewDocs.person.guarantor.documents.length > 0 && (
                      <div>
                        <h6 className="text-slate-300 text-sm font-bold mb-2">📎 مدارک ضامن ({viewDocs.person.guarantor.documents.length})</h6>
                        <div className="grid grid-cols-2 gap-2">
                          {viewDocs.person.guarantor.documents.map(d => (
                            <div key={d.id} className="bg-slate-700/30 rounded-xl p-2">
                              {d.type.includes('image') ? (
                                <img src={d.data} alt={d.name} className="w-full h-24 object-cover rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxImage(d.data)} />
                              ) : (
                                <div className="w-full h-24 bg-slate-600/50 rounded-lg mb-1 flex items-center justify-center text-2xl">📄</div>
                              )}
                              <p className="text-[10px] text-slate-300 truncate">{d.name}</p>
                            </div>
                          ))}
                        </div>
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
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');
    const [pinInput, setPinInput] = useState('');

    const handleExport = () => {
      const data = { 
        people, products, cardex, invoices, payments, returnInvoices, proformas,
        cheques, banks, categories, brands, models, colors, audit, 
        storeSettings, securitySettings, invoiceTags,
        exportDate: new Date().toISOString() 
      };
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
          if(data.invoices)setInvoices(data.invoices);
          if(data.payments)setPayments(data.payments);
          if(data.returnInvoices)setReturnInvoices(data.returnInvoices);
          if(data.proformas)setProformas(data.proformas);
          if(data.cheques)setCheques(data.cheques);
          if(data.banks)setBanks(data.banks);
          if(data.audit)setAudit(data.audit);
          if(data.storeSettings)setStoreSettings(data.storeSettings);
          if(data.securitySettings)setSecuritySettings(data.securitySettings);
          if(data.invoiceTags)setInvoiceTags(data.invoiceTags);
          alert('✅ بازیابی شد!');
        } catch { alert('❌ خطا'); }
      };
      reader.readAsText(file);
    };
    const handleReset = () => {
      if (!confirm('⚠️ تمام اطلاعات حذف خواهد شد!\nآیا مطمئن هستید؟')) return;
      if (!confirm('⚠️ تأیید نهایی: این عمل قابل بازگشت نیست!')) return;
      setPeople([]);setProducts([]);setCardex([]);setInvoices([]);setPayments([]);
      setReturnInvoices([]);setProformas([]);setCheques([]);setBanks([]);setAudit([]);
      localStorage.clear();
      alert('✅ تمام اطلاعات حذف شد!');
      window.location.reload();
    };

    const handleSetPin = () => {
      if (pinInput.length !== 4) return alert('پین باید ۴ رقم باشد');
      setSecuritySettings({ ...securitySettings, pinEnabled: true, pinHash: pinInput });
      setPinInput('');
      alert('✅ پین تنظیم شد');
    };

    const handleDisablePin = () => {
      setSecuritySettings({ ...securitySettings, pinEnabled: false, pinHash: undefined });
      alert('✅ پین غیرفعال شد');
    };

    const handleAddTag = () => {
      if (!newTagName) return;
      setInvoiceTags([...invoiceTags, { id: generateId(), name: newTagName, color: newTagColor }]);
      setNewTagName('');
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">⚙️ تنظیمات</h2>
        
        {/* تنظیمات فروشگاه */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">🏪 تنظیمات فروشگاه</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">نام فروشگاه</label>
              <input value={storeSettings.storeName} onChange={e => setStoreSettings({ ...storeSettings, storeName: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">مدیر</label>
              <input value={storeSettings.manager} onChange={e => setStoreSettings({ ...storeSettings, manager: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">تلفن</label>
              <input value={storeSettings.phone} onChange={e => setStoreSettings({ ...storeSettings, phone: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">موبایل</label>
              <input value={storeSettings.mobile} onChange={e => setStoreSettings({ ...storeSettings, mobile: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs mb-1 block">آدرس</label>
              <input value={storeSettings.address} onChange={e => setStoreSettings({ ...storeSettings, address: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs mb-1 block">پاورقی چاپ</label>
              <input value={storeSettings.printFooter} onChange={e => setStoreSettings({ ...storeSettings, printFooter: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">اندازه پیش‌فرض کاغذ</label>
              <select value={storeSettings.defaultPaper} onChange={e => setStoreSettings({ ...storeSettings, defaultPaper: e.target.value as 'A4' | 'A5' })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="A4">A4</option>
                <option value="A5">A5</option>
              </select>
            </div>
          </div>
        </div>

        {/* امنیت */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">🔒 امنیت</h3>
          {!securitySettings.pinEnabled ? (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">پین فعال نیست</p>
              <div className="flex gap-2">
                <input type="password" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="پین ۴ رقمی" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
                <button onClick={handleSetPin} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl">فعال‌سازی پین</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-emerald-400 text-sm">✅ پین فعال است</p>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">قفل خودکار پس از (دقیقه)</label>
                <input type="number" value={securitySettings.autoLockMinutes} onChange={e => setSecuritySettings({ ...securitySettings, autoLockMinutes: Number(e.target.value) })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              </div>
              <button onClick={handleDisablePin} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl">غیرفعال‌سازی پین</button>
            </div>
          )}
        </div>

        {/* برچسب‌ها */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">🏷️ برچسب‌های فاکتور</h3>
          <div className="flex gap-2 mb-4">
            <input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="نام برچسب" className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-16 h-10 bg-slate-700/50 border border-slate-600 rounded-xl cursor-pointer" />
            <button onClick={handleAddTag} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">➕ افزودن</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {invoiceTags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border group" style={{ borderColor: tag.color + '50', backgroundColor: tag.color + '15' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="text-sm" style={{ color: tag.color }}>{tag.name}</span>
                <button onClick={() => setInvoiceTags(invoiceTags.filter(t => t.id !== tag.id))} className="opacity-0 group-hover:opacity-100 text-rose-400 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* پشتیبان‌گیری */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">💾 پشتیبان‌گیری و بازیابی</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 پشتیبان‌گیری</button>
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center cursor-pointer">📥 بازیابی<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
          </div>
        </div>

        {/* خام کردن */}
        <div className="bg-rose-900/30 rounded-2xl p-6 border border-rose-500/50">
          <h3 className="text-lg font-bold mb-4 text-rose-400">⚠️ خام کردن برنامه</h3>
          <p className="text-slate-300 mb-4">این دکمه تمام اطلاعات را حذف می‌کند. قبل از خام کردن، حتماً پشتیبان‌گیری کنید!</p>
          <button onClick={handleReset} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors">🗑️ خام کردن برنامه</button>
        </div>

        {/* آمار */}
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

  // Payments Section (تسویه و تاریخچه پرداخت)
  const PaymentsSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<Payment>>({ kind: 'sale', method: 'cash', amount: 0 });
    const [filter, setFilter] = useState<'all' | 'sale' | 'purchase'>('all');

    const filteredPayments = payments.filter(p => filter === 'all' || p.kind === filter).sort((a, b) => b.date.localeCompare(a.date));
    const totalReceived = payments.filter(p => p.kind === 'sale').reduce((s, p) => s + p.amount, 0);
    const totalPaid = payments.filter(p => p.kind === 'purchase').reduce((s, p) => s + p.amount, 0);

    const save = () => {
      if (!form.invoiceId || !form.personId || !form.amount) return alert('فیلدهای الزامی را پر کنید');
      const newPayment: Payment = {
        ...form,
        id: generateId(),
        amount: Number(form.amount),
        date: form.date || getTodayDate(),
        createdAt: new Date().toISOString(),
      } as Payment;
      setPayments(prev => [newPayment, ...prev]);
      log('CREATE', 'payment', newPayment.id, `پرداخت ${formatNumber(newPayment.amount)}`);
      setForm({ kind: 'sale', method: 'cash', amount: 0 });
      setShowForm(false);
    };

    const methodLabel: Record<string, string> = { cash: 'نقدی', card: 'کارت', check: 'چک', voucher: 'تهاتر', transfer: 'انتقال' };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">💰 تسویه و تاریخچه پرداخت</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕ بستن' : '➕ ثبت پرداخت'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">ثبت پرداخت جدید</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as any })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="sale">دریافت از مشتری</option>
                <option value="purchase">پرداخت به تأمین‌کننده</option>
              </select>
              <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value as any })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="cash">نقدی</option>
                <option value="card">کارت</option>
                <option value="check">چک</option>
                <option value="voucher">تهاتر</option>
                <option value="transfer">انتقال</option>
              </select>
              <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} placeholder="مبلغ *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <select value={form.personId || ''} onChange={e => setForm({ ...form, personId: e.target.value })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">انتخاب شخص *</option>
                {people.filter(p => !p.isDeleted).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={form.invoiceId || ''} onChange={e => setForm({ ...form, invoiceId: e.target.value })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">انتخاب فاکتور *</option>
                {invoices.filter(i => i.status === 'active' && i.type === form.kind).map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - {formatNumber(i.remaining)} باقیمانده</option>)}
              </select>
              <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <textarea value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="توضیحات" rows={2} className="mt-3 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={save} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
            <p className="text-emerald-400 text-sm">کل دریافتی</p>
            <p className="text-xl font-bold text-white">{formatNumber(totalReceived)}</p>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-3 text-center">
            <p className="text-rose-400 text-sm">کل پرداختی</p>
            <p className="text-xl font-bold text-white">{formatNumber(totalPaid)}</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-3 text-center">
            <p className="text-blue-400 text-sm">تعداد پرداخت‌ها</p>
            <p className="text-xl font-bold text-white">{payments.length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'sale', 'purchase'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
              {f === 'all' ? 'همه' : f === 'sale' ? 'دریافتی' : 'پرداختی'}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {filteredPayments.map(p => (
              <div key={p.id} className="p-3 hover:bg-slate-700/20 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.kind === 'sale' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {p.kind === 'sale' ? 'دریافت' : 'پرداخت'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{methodLabel[p.method]}</span>
                  </div>
                  <p className="text-white text-sm mt-1">{people.find(p2 => p2.id === p.personId)?.name || 'نامشخص'}</p>
                  <p className="text-slate-400 text-xs">{jalaliDate(p.date)} {p.note && `| ${p.note}`}</p>
                </div>
                <p className={`font-bold ${p.kind === 'sale' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatNumber(p.amount)} تومان</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Returns Section (برگشت از فروش/خرید)
  const ReturnsSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<ReturnInvoice>>({ type: 'sale', items: [] });
    const [selInvoice, setSelInvoice] = useState('');

    const handleInvoiceSelect = (invoiceId: string) => {
      setSelInvoice(invoiceId);
      const invoice = invoices.find(i => i.id === invoiceId);
      if (invoice) {
        setForm({ ...form, sourceInvoiceId: invoiceId, personId: invoice.personId, items: invoice.items, total: invoice.total });
      }
    };

    const save = () => {
      if (!form.sourceInvoiceId || !form.personId) return alert('فاکتور مبدأ را انتخاب کنید');
      const newReturn: ReturnInvoice = {
        ...form,
        id: generateId(),
        total: Number(form.total),
        date: getTodayDate(),
        createdAt: new Date().toISOString(),
      } as ReturnInvoice;
      setReturnInvoices(prev => [newReturn, ...prev]);
      
      // بازگشت موجودی به انبار
      form.items?.forEach(item => {
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p));
      });
      
      log('CREATE', 'return', newReturn.id, `برگشت ${formatNumber(newReturn.total)}`);
      setForm({ type: 'sale', items: [] });
      setSelInvoice('');
      setShowForm(false);
      alert('✅ برگشت ثبت شد و موجودی به‌روزرسانی شد');
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🔄 برگشت از فروش/خرید</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕ بستن' : '➕ ثبت برگشت'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">ثبت برگشت جدید</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="sale">برگشت از فروش</option>
                <option value="purchase">برگشت از خرید</option>
              </select>
              <select value={selInvoice} onChange={e => handleInvoiceSelect(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">انتخاب فاکتور مبدأ *</option>
                {invoices.filter(i => i.status === 'active' && i.type === form.type).map(i => (
                  <option key={i.id} value={i.id}>{i.invoiceNumber} - {people.find(p => p.id === i.personId)?.name} - {formatNumber(i.total)}</option>
                ))}
              </select>
            </div>
            {form.items && form.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-slate-300 text-sm mb-2">اقلام برگشتی:</h4>
                <div className="space-y-2">
                  {form.items.map(item => (
                    <div key={item.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between">
                      <span className="text-white">{item.productName}</span>
                      <span className="text-slate-300">{item.quantity} × {formatNumber(item.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-left">
                  <span className="text-slate-400">مبلغ کل: </span>
                  <span className="text-amber-400 font-bold text-lg">{formatNumber(form.total || 0)} تومان</span>
                </div>
              </div>
            )}
            <textarea value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="دلیل برگشت" rows={2} className="mt-3 w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            <button onClick={save} className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl">💾 ثبت برگشت</button>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">{returnInvoices.length} برگشت</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {returnInvoices.map(r => (
              <div key={r.id} className="p-3 hover:bg-slate-700/20 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'sale' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {r.type === 'sale' ? 'برگشت فروش' : 'برگشت خرید'}
                    </span>
                  </div>
                  <p className="text-white text-sm mt-1">{people.find(p => p.id === r.personId)?.name || 'نامشخص'}</p>
                  <p className="text-slate-400 text-xs">{jalaliDate(r.date)} {r.reason && `| ${r.reason}`}</p>
                </div>
                <p className="text-amber-400 font-bold">{formatNumber(r.total)} تومان</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Proformas Section (پیش‌فاکتور)
  const ProformasSection = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<Proforma>>({ items: [], status: 'active' });
    const [selProduct, setSelProduct] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState('');

    const addItem = () => {
      const product = products.find(p => p.id === selProduct);
      if (!product || !price) return;
      const item: InvoiceItem = {
        id: generateId(),
        productId: product.id,
        productName: getProductName(product),
        quantity: qty,
        unitPrice: Number(price),
        total: qty * Number(price),
      };
      setForm({ ...form, items: [...(form.items || []), item], total: (form.total || 0) + item.total });
      setSelProduct(''); setQty(1); setPrice('');
    };

    const save = () => {
      if (!form.personId || !form.items?.length) return alert('شخص و اقلام را انتخاب کنید');
      const newProforma: Proforma = {
        ...form,
        id: generateId(),
        total: Number(form.total),
        date: getTodayDate(),
        createdAt: new Date().toISOString(),
      } as Proforma;
      setProformas(prev => [newProforma, ...prev]);
      log('CREATE', 'proforma', newProforma.id, `پیش‌فاکتور ${formatNumber(newProforma.total)}`);
      setForm({ items: [], status: 'active' });
      setShowForm(false);
    };

    const convertToInvoice = (proformaId: string) => {
      const proforma = proformas.find(p => p.id === proformaId);
      if (!proforma) return;
      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber('sale'),
        type: 'sale',
        personId: proforma.personId,
        items: proforma.items,
        total: proforma.total,
        discount: 0,
        paid: 0,
        remaining: proforma.total,
        paymentType: 'cash',
        status: 'active',
        date: getTodayDate(),
        createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [invoice, ...prev]);
      setProformas(prev => prev.map(p => p.id === proformaId ? { ...p, status: 'converted' as const, convertedInvoiceId: invoice.id } : p));
      log('UPDATE', 'proforma', proformaId, 'تبدیل به فاکتور');
      alert('✅ پیش‌فاکتور به فاکتور تبدیل شد');
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📄 پیش‌فاکتورها</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl">
            {showForm ? '✕ بستن' : '➕ پیش‌فاکتور جدید'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">ثبت پیش‌فاکتور جدید</h3>
            <select value={form.personId || ''} onChange={e => setForm({ ...form, personId: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white mb-3">
              <option value="">انتخاب مشتری *</option>
              {people.filter(p => !p.isDeleted && p.type === 'customer').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <select value={selProduct} onChange={e => { setSelProduct(e.target.value); const p = products.find(x => x.id === e.target.value); if (p) setPrice(p.sellPrice.toString()); }} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                <option value="">کالا...</option>
                {products.filter(p => !p.isDeleted).map(p => <option key={p.id} value={p.id}>{getProductName(p)}</option>)}
              </select>
              <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min="1" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="تعداد" />
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" placeholder="قیمت" />
            </div>
            <button onClick={addItem} className="w-full bg-blue-600 text-white py-2 rounded-xl mb-3">➕ افزودن قلم</button>
            {form.items && form.items.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.items.map(item => (
                  <div key={item.id} className="bg-slate-700/30 rounded-xl p-3 flex justify-between">
                    <span className="text-white">{item.productName}</span>
                    <span className="text-violet-400">{formatNumber(item.total)}</span>
                  </div>
                ))}
                <div className="text-left text-lg">
                  <span className="text-slate-400">مبلغ کل: </span>
                  <span className="text-violet-400 font-bold">{formatNumber(form.total || 0)} تومان</span>
                </div>
              </div>
            )}
            <button onClick={save} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl">💾 ثبت پیش‌فاکتور</button>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">{proformas.length} پیش‌فاکتور</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/50">
            {proformas.map(p => (
              <div key={p.id} className="p-3 hover:bg-slate-700/20 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-violet-500/20 text-violet-400' : p.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {p.status === 'active' ? 'فعال' : p.status === 'converted' ? 'تبدیل شده' : 'لغو شده'}
                    </span>
                  </div>
                  <p className="text-white text-sm mt-1">{people.find(p2 => p2.id === p.personId)?.name || 'نامشخص'}</p>
                  <p className="text-slate-400 text-xs">{jalaliDate(p.date)} | {p.items.length} قلم</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-violet-400 font-bold">{formatNumber(p.total)} تومان</p>
                  {p.status === 'active' && (
                    <button onClick={() => convertToInvoice(p.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm">تبدیل به فاکتور</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Reports Section
  const ReportsSection = () => {
    const [reportType, setReportType] = useState<'lowStock' | 'sellers' | 'products'>('lowStock');
    const [selProduct, setSelProduct] = useState('');
    const [selSupplier, setSelSupplier] = useState('');

    // Low Stock Report
    const lowStockProducts = products.filter(p => !p.isDeleted && (p.stock <= p.minStock || p.stock <= p.reorderPoint));

    // Sellers of a Product
    const productSellers = selProduct ? invoices.filter(inv => 
      inv.status === 'active' && 
      inv.type === 'purchase' && 
      inv.items.some(item => item.productId === selProduct)
    ).map(inv => ({
      invoice: inv,
      supplier: people.find(p => p.id === inv.personId),
      item: inv.items.find(item => item.productId === selProduct)!
    })) : [];

    // Products of a Supplier
    const supplierProducts = selSupplier ? invoices.filter(inv => 
      inv.status === 'active' && 
      inv.type === 'purchase' && 
      inv.personId === selSupplier
    ).flatMap(inv => inv.items).reduce((acc, item) => {
      const existing = acc.find(a => a.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalValue += item.total;
      } else {
        acc.push({ ...item, totalValue: item.total });
      }
      return acc;
    }, [] as (InvoiceItem & { totalValue: number })[]) : [];

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📈 گزارش‌ها</h2>
        
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setReportType('lowStock')} className={`px-4 py-2 rounded-xl ${reportType === 'lowStock' ? 'bg-amber-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>⚠️ کمبود کالا</button>
          <button onClick={() => setReportType('sellers')} className={`px-4 py-2 rounded-xl ${reportType === 'sellers' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>👥 فروشندگان یک کالا</button>
          <button onClick={() => setReportType('products')} className={`px-4 py-2 rounded-xl ${reportType === 'products' ? 'bg-emerald-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>📦 کالاهای یک فروشنده</button>
        </div>

        {reportType === 'lowStock' && (
          <div className="bg-slate-800/60 rounded-2xl border border-amber-500/30 p-6">
            <h3 className="text-lg font-bold text-amber-400 mb-4">⚠️ کالاهای با موجودی کم ({lowStockProducts.length})</h3>
            {lowStockProducts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">✅ همه کالاها موجودی کافی دارند</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-3 py-2 text-right text-slate-300">کد</th>
                      <th className="px-3 py-2 text-right text-slate-300">نام کالا</th>
                      <th className="px-3 py-2 text-right text-slate-300">موجودی فعلی</th>
                      <th className="px-3 py-2 text-right text-slate-300">حداقل موجودی</th>
                      <th className="px-3 py-2 text-right text-slate-300">نقطه سفارش</th>
                      <th className="px-3 py-2 text-right text-slate-300">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {lowStockProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-700/20">
                        <td className="px-3 py-2 text-slate-300">{p.code}</td>
                        <td className="px-3 py-2 text-white">{getProductName(p)}</td>
                        <td className="px-3 py-2 text-amber-400 font-bold">{p.stock}</td>
                        <td className="px-3 py-2 text-slate-300">{p.minStock}</td>
                        <td className="px-3 py-2 text-slate-300">{p.reorderPoint}</td>
                        <td className="px-3 py-2">
                          {p.stock === 0 ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-400">ناموجود</span>
                          ) : p.stock <= p.minStock ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">بحرانی</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">کم</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {reportType === 'sellers' && (
          <div className="bg-slate-800/60 rounded-2xl border border-blue-500/30 p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-4">👥 فروشندگان یک کالا</h3>
            <select value={selProduct} onChange={e => setSelProduct(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white mb-4">
              <option value="">انتخاب کالا...</option>
              {products.filter(p => !p.isDeleted).map(p => <option key={p.id} value={p.id}>{getProductName(p)} ({p.code})</option>)}
            </select>
            {selProduct && (
              <>
                {productSellers.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">این کالا هنوز خریداری نشده است</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-right text-slate-300">شماره فاکتور</th>
                          <th className="px-3 py-2 text-right text-slate-300">فروشنده</th>
                          <th className="px-3 py-2 text-right text-slate-300">تاریخ</th>
                          <th className="px-3 py-2 text-right text-slate-300">تعداد</th>
                          <th className="px-3 py-2 text-right text-slate-300">قیمت واحد</th>
                          <th className="px-3 py-2 text-right text-slate-300">مبلغ کل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {productSellers.map(({ invoice, supplier, item }) => (
                          <tr key={invoice.id} className="hover:bg-slate-700/20">
                            <td className="px-3 py-2 text-white">{invoice.invoiceNumber}</td>
                            <td className="px-3 py-2 text-slate-300">{supplier?.name || 'نامشخص'}</td>
                            <td className="px-3 py-2 text-slate-300">{jalaliDate(invoice.date)}</td>
                            <td className="px-3 py-2 text-slate-300">{item.quantity}</td>
                            <td className="px-3 py-2 text-slate-300">{formatNumber(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-emerald-400 font-bold">{formatNumber(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {reportType === 'products' && (
          <div className="bg-slate-800/60 rounded-2xl border border-emerald-500/30 p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4">📦 کالاهای یک فروشنده</h3>
            <select value={selSupplier} onChange={e => setSelSupplier(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white mb-4">
              <option value="">انتخاب فروشنده...</option>
              {people.filter(p => !p.isDeleted && p.type === 'supplier').map(p => <option key={p.id} value={p.id}>{p.name} ({p.mobile})</option>)}
            </select>
            {selSupplier && (
              <>
                {supplierProducts.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">این فروشنده هنوز کالایی نفروخته است</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-right text-slate-300">کد کالا</th>
                          <th className="px-3 py-2 text-right text-slate-300">نام کالا</th>
                          <th className="px-3 py-2 text-right text-slate-300">تعداد کل</th>
                          <th className="px-3 py-2 text-right text-slate-300">میانگین قیمت</th>
                          <th className="px-3 py-2 text-right text-slate-300">ارزش کل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {supplierProducts.map(item => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <tr key={item.productId} className="hover:bg-slate-700/20">
                              <td className="px-3 py-2 text-slate-300">{product?.code || '-'}</td>
                              <td className="px-3 py-2 text-white">{product ? getProductName(product) : 'نامشخص'}</td>
                              <td className="px-3 py-2 text-slate-300">{item.quantity}</td>
                              <td className="px-3 py-2 text-slate-300">{formatNumber(Math.round(item.totalValue / item.quantity))}</td>
                              <td className="px-3 py-2 text-emerald-400 font-bold">{formatNumber(item.totalValue)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Purchase Invoice Section
  const PurchaseInvoiceSection = () => {
    const [personId, setPersonId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
    const [description, setDescription] = useState('');

    const total = items.reduce((s, i) => s + i.total, 0);
    const payable = total - discount;

    const addToItems = (product: Product) => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
      } else {
        setItems([...items, {
          id: generateId(),
          productId: product.id,
          productName: getProductName(product),
          serialNumber: product.serialNumber,
          quantity: 1,
          unitPrice: product.buyPrice,
          buyPrice: product.buyPrice,
          total: product.buyPrice,
        }]);
      }
    };

    const updateItem = (id: string, field: string, value: number) => {
      setItems(items.map(i => {
        if (i.id === id) {
          if (field === 'quantity') return { ...i, quantity: value, total: value * i.unitPrice };
          if (field === 'unitPrice') return { ...i, unitPrice: value, total: i.quantity * value };
        }
        return i;
      }));
    };

    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

    const handleAddPerson = (person: Person) => {
      setPeople(prev => [person, ...prev]);
    };

    const handleAddProduct = (product: Product) => {
      setProducts(prev => [product, ...prev]);
    };

    const save = () => {
      if (!personId || items.length === 0) return alert('شخص و اقلام را انتخاب کنید');
      
      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber('purchase'),
        type: 'purchase',
        personId,
        items,
        total: payable,
        discount,
        paid: paymentRows.reduce((s, r) => s + r.amount, 0),
        remaining: payable - paymentRows.reduce((s, r) => s + r.amount, 0),
        paymentType: paymentRows.length > 1 ? 'mixed' : paymentRows[0]?.method === 'cash' ? 'cash' : 'cheque',
        status: 'active',
        description,
        date: getTodayDate(),
        createdAt: new Date().toISOString(),
      };

      setInvoices(prev => [invoice, ...prev]);

      // ذخیره پرداخت‌ها
      paymentRows.forEach(row => {
        const payment: Payment = {
          id: generateId(),
          kind: 'purchase',
          invoiceId: invoice.id,
          personId,
          amount: row.amount,
          method: row.method as any,
          date: getTodayDate(),
          note: row.note,
          createdAt: new Date().toISOString(),
        };
        setPayments(prev => [payment, ...prev]);

        // ذخیره چک
        if (row.method === 'check' && row.checkNumber) {
          const cheque: Cheque = {
            id: generateId(),
            chequeNumber: row.checkNumber,
            bankName: row.bankName || '',
            amount: row.amount,
            dueDate: row.dueDate || getTodayDate(),
            type: 'paid',
            status: 'pending',
            relatedInvoiceId: invoice.id,
            relatedPersonId: personId,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          };
          setCheques(prev => [cheque, ...prev]);
        }
      });

      // به‌روزرسانی موجودی
      items.forEach(item => {
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p));
      });

      log('CREATE', 'invoice', invoice.id, `فاکتور خرید ${formatNumber(payable)}`);
      alert(`✅ فاکتور خرید ${invoice.invoiceNumber} ثبت شد`);
      
      // ریست فرم
      setPersonId(''); setItems([]); setDiscount(0); setPaymentRows([]); setDescription('');
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🛒 فاکتور خرید</h2>
        
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 space-y-4">
          <PersonPicker
            people={people}
            personGroups={personGroups}
            value={personId}
            onChange={setPersonId}
            onAddPerson={handleAddPerson}
            type="supplier"
            label="فروشنده"
          />

          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">اقلام فاکتور</label>
            <ProductPicker
              products={products}
              categories={categories}
              brands={brands}
              models={models}
              colors={colors}
              onAddProduct={handleAddProduct}
              onAddToInvoice={addToItems}
              type="purchase"
            />
          </div>

          {items.length > 0 && (
            <div className="bg-slate-700/30 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-3 py-2 text-right text-slate-300">کالا</th>
                    <th className="px-3 py-2 text-right text-slate-300">سریال</th>
                    <th className="px-3 py-2 text-right text-slate-300">تعداد</th>
                    <th className="px-3 py-2 text-right text-slate-300">قیمت واحد</th>
                    <th className="px-3 py-2 text-right text-slate-300">جمع</th>
                    <th className="px-3 py-2 text-right text-slate-300">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-700/20">
                      <td className="px-3 py-2 text-white">{item.productName}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{item.serialNumber || '-'}</td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} min="1" className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-center" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} className="w-24 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-center" />
                      </td>
                      <td className="px-3 py-2 text-emerald-400 font-bold">{formatNumber(item.total)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-300">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-slate-300 text-sm mb-1 block">تخفیف (تومان)</label>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-sm">جمع کل:</p>
              <p className="text-2xl font-bold text-emerald-400">{formatNumber(total)}</p>
              <p className="text-slate-400 text-sm">قابل پرداخت:</p>
              <p className="text-2xl font-bold text-white">{formatNumber(payable)}</p>
            </div>
          </div>

          <PaymentPanel
            totalAmount={total}
            discount={discount}
            invoiceId=""
            personId={personId}
            type="purchase"
            onPaymentsChange={setPaymentRows}
          />

          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات" rows={2} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />

          <button onClick={save} disabled={!personId || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">💾 ثبت فاکتور خرید</button>
        </div>
      </div>
    );
  };

  // Sale Invoice Section
  const SaleInvoiceSection = () => {
    const [personId, setPersonId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
    const [description, setDescription] = useState('');

    const total = items.reduce((s, i) => s + i.total, 0);
    const payable = total - discount;

    const selectedPerson = people.find(p => p.id === personId);
    const personBalance = selectedPerson ? (selectedPerson.debtor || 0) - (selectedPerson.creditor || 0) : 0;

    const addToItems = (product: Product) => {
      if (product.stock <= 0 && !product.allowNegativeStock) {
        if (!confirm(`⚠️ موجودی ${getProductName(product)} صفر است. ادامه می‌دهید؟`)) return;
      }
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
      } else {
        setItems([...items, {
          id: generateId(),
          productId: product.id,
          productName: getProductName(product),
          serialNumber: product.serialNumber,
          quantity: 1,
          unitPrice: product.sellPrice,
          buyPrice: product.buyPrice,
          total: product.sellPrice,
          profit: product.sellPrice - product.buyPrice,
        }]);
      }
    };

    const updateItem = (id: string, field: string, value: number) => {
      setItems(items.map(i => {
        if (i.id === id) {
          if (field === 'quantity') return { ...i, quantity: value, total: value * i.unitPrice, profit: (i.unitPrice - (i.buyPrice || 0)) * value };
          if (field === 'unitPrice') return { ...i, unitPrice: value, total: i.quantity * value, profit: (value - (i.buyPrice || 0)) * i.quantity };
        }
        return i;
      }));
    };

    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

    const handleAddPerson = (person: Person) => {
      setPeople(prev => [person, ...prev]);
    };

    const handleAddProduct = (product: Product) => {
      setProducts(prev => [product, ...prev]);
    };

    const save = () => {
      if (!personId || items.length === 0) return alert('شخص و اقلام را انتخاب کنید');
      
      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber('sale'),
        type: 'sale',
        personId,
        items,
        total: payable,
        discount,
        paid: paymentRows.reduce((s, r) => s + r.amount, 0),
        remaining: payable - paymentRows.reduce((s, r) => s + r.amount, 0),
        paymentType: paymentRows.length > 1 ? 'mixed' : paymentRows[0]?.method === 'cash' ? 'cash' : 'cheque',
        status: 'active',
        description,
        date: getTodayDate(),
        createdAt: new Date().toISOString(),
      };

      setInvoices(prev => [invoice, ...prev]);

      // ذخیره پرداخت‌ها
      paymentRows.forEach(row => {
        const payment: Payment = {
          id: generateId(),
          kind: 'sale',
          invoiceId: invoice.id,
          personId,
          amount: row.amount,
          method: row.method as any,
          date: getTodayDate(),
          note: row.note,
          createdAt: new Date().toISOString(),
        };
        setPayments(prev => [payment, ...prev]);

        // ذخیره چک
        if (row.method === 'check' && row.checkNumber) {
          const cheque: Cheque = {
            id: generateId(),
            chequeNumber: row.checkNumber,
            bankName: row.bankName || '',
            amount: row.amount,
            dueDate: row.dueDate || getTodayDate(),
            type: 'received',
            status: 'pending',
            relatedInvoiceId: invoice.id,
            relatedPersonId: personId,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          };
          setCheques(prev => [cheque, ...prev]);
        }

        // ذخیره اقساط
        if (row.method === 'installment' && row.installmentCount) {
          const instAmount = Math.round(row.amount / row.installmentCount);
          const installments: Installment[] = Array.from({ length: row.installmentCount }, (_, i) => {
            const date = new Date(row.firstDueDate || getTodayDate());
            date.setMonth(date.getMonth() + i * (row.monthInterval || 1));
            return {
              id: generateId(),
              amount: i === row.installmentCount! - 1 ? row.amount - instAmount * (row.installmentCount! - 1) : instAmount,
              dueDate: date.toISOString().split('T')[0],
              paidAmount: 0,
              status: 'pending' as const,
            };
          });
          invoice.installments = installments;
        }
      });

      // به‌روزرسانی موجودی
      items.forEach(item => {
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock - item.quantity } : p));
      });

      log('CREATE', 'invoice', invoice.id, `فاکتور فروش ${formatNumber(payable)}`);
      alert(`✅ فاکتور فروش ${invoice.invoiceNumber} ثبت شد`);
      
      // ریست فرم
      setPersonId(''); setItems([]); setDiscount(0); setPaymentRows([]); setDescription('');
    };

    const totalProfit = items.reduce((s, i) => s + (i.profit || 0), 0);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">💰 فاکتور فروش</h2>
        
        {/* مانده زنده مشتری */}
        {selectedPerson && personBalance > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
            <p className="text-rose-400 font-bold">⚠️ مانده بدهی مشتری: {formatNumber(personBalance)} تومان</p>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 space-y-4">
          <PersonPicker
            people={people}
            personGroups={personGroups}
            value={personId}
            onChange={setPersonId}
            onAddPerson={handleAddPerson}
            type="customer"
            label="مشتری"
          />

          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">اقلام فاکتور</label>
            <ProductPicker
              products={products}
              categories={categories}
              brands={brands}
              models={models}
              colors={colors}
              onAddProduct={handleAddProduct}
              onAddToInvoice={addToItems}
              type="sale"
            />
          </div>

          {items.length > 0 && (
            <div className="bg-slate-700/30 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-3 py-2 text-right text-slate-300">کالا</th>
                    <th className="px-3 py-2 text-right text-slate-300">سریال</th>
                    <th className="px-3 py-2 text-right text-slate-300">تعداد</th>
                    <th className="px-3 py-2 text-right text-slate-300">قیمت واحد</th>
                    <th className="px-3 py-2 text-right text-slate-300">سود</th>
                    <th className="px-3 py-2 text-right text-slate-300">جمع</th>
                    <th className="px-3 py-2 text-right text-slate-300">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const isPriceBelowCost = item.unitPrice < (item.buyPrice || 0);
                    const isOverStock = product && item.quantity > product.stock;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-700/20 ${isPriceBelowCost ? 'bg-rose-500/10' : ''} ${isOverStock ? 'bg-amber-500/10' : ''}`}>
                        <td className="px-3 py-2 text-white">{item.productName}</td>
                        <td className="px-3 py-2 text-slate-400 text-xs">{item.serialNumber || '-'}</td>
                        <td className="px-3 py-2">
                          <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} min="1" className={`w-16 bg-slate-700/50 border rounded px-2 py-1 text-white text-center ${isOverStock ? 'border-amber-500' : 'border-slate-600'}`} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} className={`w-24 bg-slate-700/50 border rounded px-2 py-1 text-white text-center ${isPriceBelowCost ? 'border-rose-500' : 'border-slate-600'}`} />
                        </td>
                        <td className="px-3 py-2 text-emerald-400">{formatNumber(item.profit || 0)}</td>
                        <td className="px-3 py-2 text-emerald-400 font-bold">{formatNumber(item.total)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-300">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-slate-300 text-sm mb-1 block">تخفیف (تومان)</label>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="text-left">
              <p className="text-slate-400 text-sm">جمع کل:</p>
              <p className="text-2xl font-bold text-emerald-400">{formatNumber(total)}</p>
              <p className="text-slate-400 text-sm">سود کل:</p>
              <p className="text-xl font-bold text-amber-400">{formatNumber(totalProfit)}</p>
              <p className="text-slate-400 text-sm">قابل پرداخت:</p>
              <p className="text-2xl font-bold text-white">{formatNumber(payable)}</p>
            </div>
          </div>

          <PaymentPanel
            totalAmount={total}
            discount={discount}
            invoiceId=""
            personId={personId}
            type="sale"
            onPaymentsChange={setPaymentRows}
          />

          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات" rows={2} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />

          <button onClick={save} disabled={!personId || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">💾 ثبت فاکتور فروش</button>
        </div>
      </div>
    );
  };

  // Invoice List Section
  const InvoiceListSection = () => {
    const [filter, setFilter] = useState<'all' | 'sale' | 'purchase'>('all');
    const [search, setSearch] = useState('');

    const filtered = invoices.filter(i => 
      i.status === 'active' &&
      (filter === 'all' || i.type === filter) &&
      (!search || i.invoiceNumber.includes(search) || getPersonName(i.personId).includes(search))
    ).sort((a, b) => b.date.localeCompare(a.date));

    const getPaymentStatus = (invoice: Invoice) => {
      if (invoice.remaining === 0) return { label: '✅ تسویه', color: 'bg-emerald-500/20 text-emerald-400' };
      if (invoice.paid > 0) return { label: '⚠️ جزئی', color: 'bg-amber-500/20 text-amber-400' };
      return { label: '❌ بدهکار', color: 'bg-rose-500/20 text-rose-400' };
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">📋 لیست فاکتورها</h2>
        
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 جستجو (شماره فاکتور، نام شخص)..." className="flex-1 min-w-48 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
          {(['all', 'sale', 'purchase'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300'}`}>
              {f === 'all' ? 'همه' : f === 'sale' ? 'فروش' : 'خرید'}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <span className="text-slate-400 text-sm">{filtered.length} فاکتور</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(inv => {
              const status = getPaymentStatus(inv);
              return (
                <div key={inv.id} className="p-4 hover:bg-slate-700/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{inv.invoiceNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${inv.type === 'sale' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {inv.type === 'sale' ? 'فروش' : 'خرید'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-slate-300 text-sm">{getPersonName(inv.personId)}</p>
                      <p className="text-slate-400 text-xs">{jalaliDate(inv.date)} | {inv.items.length} قلم</p>
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
      </div>
    );
  };

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventorySection />;
      case 'cardex': return <CardexSection />;
      case 'people': return <PeopleSection />;
      case 'purchase': return <PurchaseInvoiceSection />;
      case 'sale': return <SaleInvoiceSection />;
      case 'invoices': return <InvoiceListSection />;
      case 'payments': return <PaymentsSection />;
      case 'returns': return <ReturnsSection />;
      case 'proformas': return <ProformasSection />;
      case 'reports': return <ReportsSection />;
      case 'settings': return <SettingsSection />;
      default: return <div className="text-center py-12 text-slate-400"><span className="text-5xl block mb-4">🚧</span>بخش در حال توسعه</div>;
    }
  };

  const menuItems: { id: Section; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: '🏠' },
    { id: 'purchase', label: 'فاکتور خرید', icon: '🛒' },
    { id: 'sale', label: 'فاکتور فروش', icon: '💰' },
    { id: 'invoices', label: 'لیست فاکتورها', icon: '📋' },
    { id: 'inventory', label: 'کالا و انبار', icon: '🏭' },
    { id: 'cardex', label: 'کاردکس', icon: '📊' },
    { id: 'people', label: 'اشخاص', icon: '👥' },
    { id: 'payments', label: 'تسویه حساب', icon: '💳' },
    { id: 'returns', label: 'برگشت از فروش', icon: '🔄' },
    { id: 'proformas', label: 'پیش‌فاکتور', icon: '📄' },
    { id: 'reports', label: 'گزارش‌ها', icon: '📈' },
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
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700">☰</button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">🏪</div>
              <div><h1 className="text-lg font-bold">{storeSettings.storeName || 'تکنوکالا'}</h1><p className="text-xs text-slate-500">سیستم حسابداری</p></div>
            </div>
            
            {/* جستجوی سریع */}
            <div className="flex-1 max-w-md">
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 جستجوی سریع (Ctrl+K)..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery) {
                    const product = products.find(p => !p.isDeleted && (p.serialNumber === searchQuery || p.code === searchQuery));
                    if (product) {
                      alert(`✅ کالا یافت شد:\n${getProductName(product)}\nموجودی: ${product.stock}\nقیمت: ${formatNumber(product.sellPrice)} تومان`);
                      setSearchQuery('');
                    } else {
                      alert('❌ کالا یافت نشد');
                    }
                  }
                }}
              />
            </div>

            {/* دکمه PDF */}
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm" title="ذخیره PDF">
              📄 PDF
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{renderSection()}</main>
      </div>
    </div>
  );
}
