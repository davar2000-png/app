import { useState } from 'react';
import { ProductCategory, ProductBrand, ProductModel, ProductColor } from '../types';
import { generateId } from '../utils';

interface InventoryManagerProps {
  categories: ProductCategory[];
  brands: ProductBrand[];
  models: ProductModel[];
  colors: ProductColor[];
  onCategoriesChange: (categories: ProductCategory[]) => void;
  onBrandsChange: (brands: ProductBrand[]) => void;
  onModelsChange: (models: ProductModel[]) => void;
  onColorsChange: (colors: ProductColor[]) => void;
}

export default function InventoryManager({
  categories,
  brands,
  models,
  colors,
  onCategoriesChange,
  onBrandsChange,
  onModelsChange,
  onColorsChange,
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'models' | 'colors'>('categories');
  
  // States for adding new items
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCategoryId, setNewBrandCategoryId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelBrandId, setNewModelBrandId] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');

  // States for editing
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null);
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null);
  const [editingColor, setEditingColor] = useState<ProductColor | null>(null);

  // Category handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory: ProductCategory = {
      id: generateId(),
      name: newCategoryName.trim(),
      icon: newCategoryIcon || '📦',
    };
    onCategoriesChange([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryIcon('📦');
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('آیا از حذف این گروه مطمئن هستید؟')) {
      onCategoriesChange(categories.filter(c => c.id !== id));
      // Also delete related brands and models
      const relatedBrands = brands.filter(b => b.categoryId === id);
      const relatedBrandIds = relatedBrands.map(b => b.id);
      onBrandsChange(brands.filter(b => b.categoryId !== id));
      onModelsChange(models.filter(m => !relatedBrandIds.includes(m.brandId)));
    }
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
  };

  const handleSaveEditCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    onCategoriesChange(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
  };

  // Brand handlers
  const handleAddBrand = () => {
    if (!newBrandName.trim() || !newBrandCategoryId) return;
    const newBrand: ProductBrand = {
      id: generateId(),
      name: newBrandName.trim(),
      categoryId: newBrandCategoryId,
    };
    onBrandsChange([...brands, newBrand]);
    setNewBrandName('');
    setNewBrandCategoryId('');
  };

  const handleDeleteBrand = (id: string) => {
    if (confirm('آیا از حذف این برند مطمئن هستید؟')) {
      onBrandsChange(brands.filter(b => b.id !== id));
      // Also delete related models
      onModelsChange(models.filter(m => m.brandId !== id));
    }
  };

  const handleEditBrand = (brand: ProductBrand) => {
    setEditingBrand(brand);
  };

  const handleSaveEditBrand = () => {
    if (!editingBrand || !editingBrand.name.trim()) return;
    onBrandsChange(brands.map(b => b.id === editingBrand.id ? editingBrand : b));
    setEditingBrand(null);
  };

  // Model handlers
  const handleAddModel = () => {
    if (!newModelName.trim() || !newModelBrandId) return;
    const newModel: ProductModel = {
      id: generateId(),
      name: newModelName.trim(),
      brandId: newModelBrandId,
    };
    onModelsChange([...models, newModel]);
    setNewModelName('');
    setNewModelBrandId('');
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('آیا از حذف این مدل مطمئن هستید؟')) {
      onModelsChange(models.filter(m => m.id !== id));
    }
  };

  const handleEditModel = (model: ProductModel) => {
    setEditingModel(model);
  };

  const handleSaveEditModel = () => {
    if (!editingModel || !editingModel.name.trim()) return;
    onModelsChange(models.map(m => m.id === editingModel.id ? editingModel : m));
    setEditingModel(null);
  };

  // Color handlers
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const newColor: ProductColor = {
      id: generateId(),
      name: newColorName.trim(),
      code: newColorCode,
    };
    onColorsChange([...colors, newColor]);
    setNewColorName('');
    setNewColorCode('#000000');
  };

  const handleDeleteColor = (id: string) => {
    if (confirm('آیا از حذف این رنگ مطمئن هستید؟')) {
      onColorsChange(colors.filter(c => c.id !== id));
    }
  };

  const handleEditColor = (color: ProductColor) => {
    setEditingColor(color);
  };

  const handleSaveEditColor = () => {
    if (!editingColor || !editingColor.name.trim()) return;
    onColorsChange(colors.map(c => c.id === editingColor.id ? editingColor : c));
    setEditingColor(null);
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">🏭 مدیریت کالا و انبار</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📁 گروه‌های کالا
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'brands'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏷️ برندها
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'models'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📱 مدل‌ها
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'colors'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎨 رنگ‌ها
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">گروه‌های کالا</h3>
          
          {/* Add new category */}
          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3">➕ افزودن گروه جدید</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام گروه</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="مثلاً: لوازم جانبی"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">آیکون</label>
                <input
                  type="text"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-center text-2xl focus:outline-none focus:border-blue-500"
                  placeholder="📦"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddCategory}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ➕ افزودن
                </button>
              </div>
            </div>
          </div>

          {/* Categories list */}
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-slate-700/30 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-white font-medium">{category.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands Tab */}
      {activeTab === 'brands' && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">برندها</h3>
          
          {/* Add new brand */}
          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3">➕ افزودن برند جدید</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">گروه کالا</label>
                <select
                  value={newBrandCategoryId}
                  onChange={(e) => setNewBrandCategoryId(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">انتخاب گروه...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام برند</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="مثلاً: Nokia"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddBrand}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ➕ افزودن
                </button>
              </div>
            </div>
          </div>

          {/* Brands list */}
          <div className="space-y-2">
            {brands.map((brand) => {
              const category = categories.find((c) => c.id === brand.categoryId);
              return (
                <div
                  key={brand.id}
                  className="bg-slate-700/30 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category?.icon || '📦'}</span>
                    <div>
                      <span className="text-white font-medium">{brand.name}</span>
                      <span className="text-slate-400 text-sm mr-2">({category?.name})</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBrand(brand)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">مدل‌ها</h3>
          
          {/* Add new model */}
          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3">➕ افزودن مدل جدید</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">برند</label>
                <select
                  value={newModelBrandId}
                  onChange={(e) => setNewModelBrandId(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">انتخاب برند...</option>
                  {brands.map((brand) => {
                    const category = categories.find((c) => c.id === brand.categoryId);
                    return (
                      <option key={brand.id} value={brand.id}>
                        {category?.icon} {brand.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام مدل</label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="مثلاً: iPhone 16"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddModel}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ➕ افزودن
                </button>
              </div>
            </div>
          </div>

          {/* Models list */}
          <div className="space-y-2">
            {models.map((model) => {
              const brand = brands.find((b) => b.id === model.brandId);
              const category = categories.find((c) => c.id === brand?.categoryId);
              return (
                <div
                  key={model.id}
                  className="bg-slate-700/30 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category?.icon || '📦'}</span>
                    <div>
                      <span className="text-white font-medium">{model.name}</span>
                      <span className="text-slate-400 text-sm mr-2">({brand?.name})</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditModel(model)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">رنگ‌ها</h3>
          
          {/* Add new color */}
          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3">➕ افزودن رنگ جدید</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام رنگ</label>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="مثلاً: طلایی"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">کد رنگ</label>
                <input
                  type="color"
                  value={newColorCode}
                  onChange={(e) => setNewColorCode(e.target.value)}
                  className="w-full h-10 bg-slate-700/50 border border-slate-600 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddColor}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ➕ افزودن
                </button>
              </div>
            </div>
          </div>

          {/* Colors list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {colors.map((color) => (
              <div
                key={color.id}
                className="bg-slate-700/30 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-slate-600"
                    style={{ backgroundColor: color.code }}
                  />
                  <div>
                    <span className="text-white font-medium">{color.name}</span>
                    <span className="text-slate-400 text-sm block">{color.code}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditColor(color)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteColor(color.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">ویرایش گروه</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام گروه</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">آیکون</label>
                <input
                  type="text"
                  value={editingCategory.icon}
                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-center text-2xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEditCategory}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                💾 ذخیره
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ❌ انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {editingBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">ویرایش برند</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">گروه کالا</label>
                <select
                  value={editingBrand.categoryId}
                  onChange={(e) => setEditingBrand({ ...editingBrand, categoryId: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام برند</label>
                <input
                  type="text"
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEditBrand}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                💾 ذخیره
              </button>
              <button
                onClick={() => setEditingBrand(null)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ❌ انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">ویرایش مدل</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">برند</label>
                <select
                  value={editingModel.brandId}
                  onChange={(e) => setEditingModel({ ...editingModel, brandId: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام مدل</label>
                <input
                  type="text"
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEditModel}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                💾 ذخیره
              </button>
              <button
                onClick={() => setEditingModel(null)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ❌ انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {editingColor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">ویرایش رنگ</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">نام رنگ</label>
                <input
                  type="text"
                  value={editingColor.name}
                  onChange={(e) => setEditingColor({ ...editingColor, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">کد رنگ</label>
                <input
                  type="color"
                  value={editingColor.code}
                  onChange={(e) => setEditingColor({ ...editingColor, code: e.target.value })}
                  className="w-full h-10 bg-slate-700/50 border border-slate-600 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEditColor}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                💾 ذخیره
              </button>
              <button
                onClick={() => setEditingColor(null)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ❌ انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
