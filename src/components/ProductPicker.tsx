import { useState } from 'react';
import type { Product, ProductCategory, ProductBrand, ProductModel, ProductColor } from '../types';
import { generateId, formatNumber, getTodayDate, generateProductCode } from '../utils';

interface ProductPickerProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  models: ProductModel[];
  colors: ProductColor[];
  onAddProduct: (product: Product) => void;
  onAddToInvoice: (product: Product) => void;
  type?: 'purchase' | 'sale';
}

export default function ProductPicker({
  products,
  categories,
  brands,
  models,
  colors,
  onAddProduct,
  onAddToInvoice,
  type = 'sale'
}: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    stock: 0, minStock: 0, reorderPoint: 0, allowNegativeStock: false
  });

  const filteredProducts = search
    ? products.filter(p => 
        !p.isDeleted &&
        (p.name.includes(search) || 
         p.serialNumber?.includes(search) ||
         p.code.includes(search) ||
         models.find(m => m.id === p.modelId)?.name.includes(search))
      ).slice(0, 8)
    : [];

  const handleSelect = (product: Product) => {
    if (type === 'sale' && product.stock <= 0 && !product.allowNegativeStock) {
      alert('⚠️ موجودی این کالا صفر است!');
      return;
    }
    onAddToInvoice(product);
    setSearch('');
    setShowDropdown(false);
  };

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.categoryId || !newProduct.brandId || !newProduct.modelId) {
      alert('فیلدهای الزامی را پر کنید');
      return;
    }
    
    const category = categories.find(c => c.id === newProduct.categoryId);
    const brand = brands.find(b => b.id === newProduct.brandId);
    const model = models.find(m => m.id === newProduct.modelId);
    const color = newProduct.color ? colors.find(c => c.name === newProduct.color) : undefined;
    
    const product: Product = {
      ...newProduct,
      id: generateId(),
      code: newProduct.code || generateProductCode(),
      name: [brand?.name, model?.name, color?.name, newProduct.ram && `${newProduct.ram}GB`, newProduct.storage && `${newProduct.storage}GB`].filter(Boolean).join(' - '),
      buyPrice: Number(newProduct.buyPrice) || 0,
      sellPrice: Number(newProduct.sellPrice) || 0,
      stock: Number(newProduct.stock) || 0,
      minStock: Number(newProduct.minStock) || 0,
      reorderPoint: Number(newProduct.reorderPoint) || 0,
      isDeleted: false,
      createdAt: new Date().toISOString()
    } as Product;
    
    onAddProduct(product);
    onAddToInvoice(product);
    setShowAddModal(false);
    setNewProduct({ stock: 0, minStock: 0, reorderPoint: 0, allowNegativeStock: false });
  };

  const filteredBrands = brands.filter(b => b.categoryId === newProduct.categoryId);
  const filteredModels = models.filter(m => m.brandId === newProduct.brandId);

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="🔍 جستجوی کالا (نام، مدل، سریال، کد)..."
        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />

      {showDropdown && filteredProducts.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => handleSelect(product)}
              className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">{product.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {product.serialNumber && <span>🔑 {product.serialNumber}</span>}
                    <span>📦 موجودی: {product.stock}</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-emerald-400 text-sm font-bold">{formatNumber(type === 'sale' ? product.sellPrice : product.buyPrice)}</p>
                  <p className="text-slate-500 text-xs">تومان</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-sm font-bold"
      >
        ＋ کالای جدید
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">➕ ثبت کالای جدید</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">گروه *</label>
                <select value={newProduct.categoryId || ''} onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value, brandId: '', modelId: '' })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  <option value="">انتخاب...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">برند *</label>
                <select value={newProduct.brandId || ''} onChange={e => setNewProduct({ ...newProduct, brandId: e.target.value, modelId: '' })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!newProduct.categoryId}>
                  <option value="">انتخاب...</option>
                  {filteredBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">مدل *</label>
                <select value={newProduct.modelId || ''} onChange={e => setNewProduct({ ...newProduct, modelId: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" disabled={!newProduct.brandId}>
                  <option value="">انتخاب...</option>
                  {filteredModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">رنگ</label>
                <select value={newProduct.color || ''} onChange={e => setNewProduct({ ...newProduct, color: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white">
                  <option value="">انتخاب...</option>
                  {colors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <input value={newProduct.ram || ''} onChange={e => setNewProduct({ ...newProduct, ram: e.target.value })} placeholder="رم (GB)" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newProduct.storage || ''} onChange={e => setNewProduct({ ...newProduct, storage: e.target.value })} placeholder="حافظه (GB)" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newProduct.serialNumber || ''} onChange={e => setNewProduct({ ...newProduct, serialNumber: e.target.value })} placeholder="شماره سریال" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={newProduct.buyPrice || ''} onChange={e => setNewProduct({ ...newProduct, buyPrice: Number(e.target.value) })} placeholder="قیمت خرید *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={newProduct.sellPrice || ''} onChange={e => setNewProduct({ ...newProduct, sellPrice: Number(e.target.value) })} placeholder="قیمت فروش *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={newProduct.stock || ''} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} placeholder="موجودی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={newProduct.minStock || ''} onChange={e => setNewProduct({ ...newProduct, minStock: Number(e.target.value) })} placeholder="حداقل موجودی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input type="number" value={newProduct.reorderPoint || ''} onChange={e => setNewProduct({ ...newProduct, reorderPoint: Number(e.target.value) })} placeholder="نقطه سفارش" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره و افزودن</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
