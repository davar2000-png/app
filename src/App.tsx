import { useState, useEffect } from 'react';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface Invoice {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  date: string;
  paymentType: 'cash' | 'installment';
  installments?: { amount: number; dueDate: string; paid: boolean }[];
}

// LocalStorage Hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default function App() {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Product Form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productCategory, setProductCategory] = useState('');

  // Customer Form
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Invoice Form
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');

  // Add Product
  const addProduct = () => {
    if (!productName || !productPrice || !productStock) {
      alert('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
      category: productCategory,
    };

    setProducts([...products, newProduct]);
    setProductName('');
    setProductPrice('');
    setProductStock('');
    setProductCategory('');
    setShowProductForm(false);
    alert('محصول با موفقیت اضافه شد');
  };

  // Add Customer
  const addCustomer = () => {
    if (!customerName || !customerPhone) {
      alert('لطفاً نام و تلفن را وارد کنید');
      return;
    }

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
    };

    setCustomers([...customers, newCustomer]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setShowCustomerForm(false);
    alert('مشتری با موفقیت اضافه شد');
  };

  // Create Invoice
  const createInvoice = () => {
    if (!selectedCustomer || selectedProducts.length === 0) {
      alert('لطفاً مشتری و محصولات را انتخاب کنید');
      return;
    }

    const items = selectedProducts.map(sp => {
      const product = products.find(p => p.id === sp.productId);
      return {
        productId: sp.productId,
        quantity: sp.quantity,
        price: product?.price || 0,
      };
    });

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      customerId: selectedCustomer,
      items,
      total,
      date: new Date().toLocaleDateString('fa-IR'),
      paymentType,
      installments: paymentType === 'installment' ? [
        { amount: total / 3, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'), paid: false },
        { amount: total / 3, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'), paid: false },
        { amount: total / 3, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR'), paid: false },
      ] : undefined,
    };

    setInvoices([...invoices, newInvoice]);
    setSelectedCustomer('');
    setSelectedProducts([]);
    setShowInvoiceForm(false);
    alert('فاکتور با موفقیت ایجاد شد');
  };

  // Dashboard Stats
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-indigo-600">🏪 سیستم حسابداری فروشگاه</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex space-x-4 space-x-reverse">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              📊 داشبورد
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              📦 محصولات
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'customers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              👥 مشتریان
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 font-medium transition ${activeTab === 'invoices' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              🧾 فاکتورها
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 داشبورد</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">کل فروش</p>
                    <p className="text-3xl font-bold text-indigo-600">{totalSales.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div className="text-5xl">💰</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">تعداد محصولات</p>
                    <p className="text-3xl font-bold text-green-600">{totalProducts}</p>
                  </div>
                  <div className="text-5xl">📦</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">تعداد مشتریان</p>
                    <p className="text-3xl font-bold text-blue-600">{totalCustomers}</p>
                  </div>
                  <div className="text-5xl">👥</div>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">آخرین فاکتورها</h3>
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">هنوز فاکتوری ثبت نشده است</p>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(-5).reverse().map(invoice => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{customer?.name}</p>
                          <p className="text-sm text-gray-500">{invoice.date}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-indigo-600">{invoice.total.toLocaleString('fa-IR')} تومان</p>
                          <span className={`text-xs px-2 py-1 rounded ${invoice.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {invoice.paymentType === 'cash' ? 'نقدی' : 'اقساطی'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📦 محصولات</h2>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                {showProductForm ? 'بستن' : '+ محصول جدید'}
              </button>
            </div>

            {showProductForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">افزودن محصول جدید</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نام محصول</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="نام محصول"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">قیمت (تومان)</label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={e => setProductPrice(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">موجودی</label>
                    <input
                      type="number"
                      value={productStock}
                      onChange={e => setProductStock(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
                    <input
                      type="text"
                      value={productCategory}
                      onChange={e => setProductCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="دسته‌بندی"
                    />
                  </div>
                </div>
                <button
                  onClick={addProduct}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  ✓ ثبت محصول
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">هنوز محصولی ثبت نشده است</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-right py-3 px-4 font-medium text-gray-700">نام</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">قیمت</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">موجودی</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">دسته‌بندی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{product.name}</td>
                          <td className="py-3 px-4">{product.price.toLocaleString('fa-IR')} تومان</td>
                          <td className="py-3 px-4">{product.stock}</td>
                          <td className="py-3 px-4">{product.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">👥 مشتریان</h2>
              <button
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                {showCustomerForm ? 'بستن' : '+ مشتری جدید'}
              </button>
            </div>

            {showCustomerForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">افزودن مشتری جدید</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نام</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="نام مشتری"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تلفن</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="09xxxxxxxxx"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">آدرس</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="آدرس"
                    />
                  </div>
                </div>
                <button
                  onClick={addCustomer}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  ✓ ثبت مشتری
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              {customers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">هنوز مشتری ثبت نشده است</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-right py-3 px-4 font-medium text-gray-700">نام</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">تلفن</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">آدرس</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{customer.name}</td>
                          <td className="py-3 px-4">{customer.phone}</td>
                          <td className="py-3 px-4">{customer.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices */}
        {activeTab === 'invoices' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">🧾 فاکتورها</h2>
              <button
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                {showInvoiceForm ? 'بستن' : '+ فاکتور جدید'}
              </button>
            </div>

            {showInvoiceForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">ایجاد فاکتور جدید</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مشتری</label>
                    <select
                      value={selectedCustomer}
                      onChange={e => setSelectedCustomer(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">انتخاب مشتری</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">محصولات</label>
                    {products.map(product => (
                      <div key={product.id} className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1 }]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(sp => sp.productId !== product.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">{product.name}</span>
                        <span className="text-gray-500">{product.price.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع پرداخت</label>
                    <select
                      value={paymentType}
                      onChange={e => setPaymentType(e.target.value as 'cash' | 'installment')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="cash">نقدی</option>
                      <option value="installment">اقساطی</option>
                    </select>
                  </div>

                  <button
                    onClick={createInvoice}
                    className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    ✓ ایجاد فاکتور
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">هنوز فاکتوری ثبت نشده است</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map(invoice => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    return (
                      <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-800">مشتری: {customer?.name}</p>
                            <p className="text-sm text-gray-500">تاریخ: {invoice.date}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold text-indigo-600">{invoice.total.toLocaleString('fa-IR')} تومان</p>
                            <span className={`text-xs px-2 py-1 rounded ${invoice.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {invoice.paymentType === 'cash' ? 'نقدی' : 'اقساطی'}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">محصولات:</p>
                          {invoice.items.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                              <div key={idx} className="flex justify-between text-sm text-gray-600">
                                <span>{product?.name} × {item.quantity}</span>
                                <span>{(item.price * item.quantity).toLocaleString('fa-IR')} تومان</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
