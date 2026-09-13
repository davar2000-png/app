import { useState } from 'react';

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
  type: string;
}

interface Invoice {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  date: string;
  paymentType: 'cash' | 'installment';
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
  const [customerType, setCustomerType] = useState('عادی');

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
      type: customerType,
    };

    setCustomers([...customers, newCustomer]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerType('عادی');
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', direction: 'rtl' }}>
      {/* Header */}
      <header style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea', margin: 0 }}>🏪 سیستم حسابداری فروشگاه</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '20px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '15px 25px',
              fontWeight: '500',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'dashboard' ? '3px solid #667eea' : 'none',
              color: activeTab === 'dashboard' ? '#667eea' : '#666',
            }}
          >
            📊 داشبورد
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '15px 25px',
              fontWeight: '500',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'products' ? '3px solid #667eea' : 'none',
              color: activeTab === 'products' ? '#667eea' : '#666',
            }}
          >
            📦 محصولات
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            style={{
              padding: '15px 25px',
              fontWeight: '500',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'customers' ? '3px solid #667eea' : 'none',
              color: activeTab === 'customers' ? '#667eea' : '#666',
            }}
          >
            👥 مشتریان
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            style={{
              padding: '15px 25px',
              fontWeight: '500',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'invoices' ? '3px solid #667eea' : 'none',
              color: activeTab === 'invoices' ? '#667eea' : '#666',
            }}
          >
            🧾 فاکتورها
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>📊 داشبورد</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>کل فروش</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea', margin: 0 }}>{totalSales.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div style={{ fontSize: '48px' }}>💰</div>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>تعداد محصولات</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{totalProducts}</p>
                  </div>
                  <div style={{ fontSize: '48px' }}>📦</div>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>تعداد مشتریان</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{totalCustomers}</p>
                  </div>
                  <div style={{ fontSize: '48px' }}>👥</div>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>آخرین فاکتورها</h3>
              {invoices.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>هنوز فاکتوری ثبت نشده است</p>
              ) : (
                <div>
                  {invoices.slice(-5).reverse().map(invoice => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    return (
                      <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', marginBottom: '10px' }}>
                        <div>
                          <p style={{ fontWeight: '500', color: '#333', margin: '0 0 5px 0' }}>{customer?.name}</p>
                          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{invoice.date}</p>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: 'bold', color: '#667eea', fontSize: '18px', margin: '0 0 5px 0' }}>{invoice.total.toLocaleString('fa-IR')} تومان</p>
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: invoice.paymentType === 'cash' ? '#d1fae5' : '#fed7aa',
                            color: invoice.paymentType === 'cash' ? '#065f46' : '#92400e',
                          }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>📦 محصولات</h2>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {showProductForm ? 'بستن' : '+ محصول جدید'}
              </button>
            </div>

            {showProductForm && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>افزودن محصول جدید</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>نام محصول</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="نام محصول"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>قیمت (تومان)</label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={e => setProductPrice(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>موجودی</label>
                    <input
                      type="number"
                      value={productStock}
                      onChange={e => setProductStock(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>دسته‌بندی</label>
                    <input
                      type="text"
                      value={productCategory}
                      onChange={e => setProductCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="دسته‌بندی"
                    />
                  </div>
                </div>
                <button
                  onClick={addProduct}
                  style={{
                    marginTop: '20px',
                    background: '#10b981',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  ✓ ثبت محصول
                </button>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {products.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>هنوز محصولی ثبت نشده است</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>نام</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>قیمت</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>موجودی</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>دسته‌بندی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px' }}>{product.name}</td>
                          <td style={{ padding: '12px' }}>{product.price.toLocaleString('fa-IR')} تومان</td>
                          <td style={{ padding: '12px' }}>{product.stock}</td>
                          <td style={{ padding: '12px' }}>{product.category}</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>👥 مشتریان</h2>
              <button
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {showCustomerForm ? 'بستن' : '+ مشتری جدید'}
              </button>
            </div>

            {showCustomerForm && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>افزودن مشتری جدید</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>نام</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="نام مشتری"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>تلفن</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="09xxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>نوع مشتری</label>
                    <select
                      value={customerType}
                      onChange={e => setCustomerType(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    >
                      <option value="عادی">عادی</option>
                      <option value="ویژه">ویژه</option>
                      <option value="عمده">عمده</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>آدرس</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      placeholder="آدرس"
                    />
                  </div>
                </div>
                <button
                  onClick={addCustomer}
                  style={{
                    marginTop: '20px',
                    background: '#10b981',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  ✓ ثبت مشتری
                </button>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {customers.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>هنوز مشتری ثبت نشده است</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>نام</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>تلفن</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>آدرس</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontWeight: '500', color: '#333' }}>نوع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px' }}>{customer.name}</td>
                          <td style={{ padding: '12px' }}>{customer.phone}</td>
                          <td style={{ padding: '12px' }}>{customer.address}</td>
                          <td style={{ padding: '12px' }}>{customer.type}</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>🧾 فاکتورها</h2>
              <button
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {showInvoiceForm ? 'بستن' : '+ فاکتور جدید'}
              </button>
            </div>

            {showInvoiceForm && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>ایجاد فاکتور جدید</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>مشتری</label>
                    <select
                      value={selectedCustomer}
                      onChange={e => setSelectedCustomer(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    >
                      <option value="">انتخاب مشتری</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>محصولات</label>
                    {products.map(product => (
                      <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <input
                          type="checkbox"
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1 }]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(sp => sp.productId !== product.id));
                            }
                          }}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ flex: 1 }}>{product.name}</span>
                        <span style={{ color: '#666' }}>{product.price.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>نوع پرداخت</label>
                    <select
                      value={paymentType}
                      onChange={e => setPaymentType(e.target.value as 'cash' | 'installment')}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    >
                      <option value="cash">نقدی</option>
                      <option value="installment">اقساطی</option>
                    </select>
                  </div>

                  <button
                    onClick={createInvoice}
                    style={{
                      width: '100%',
                      background: '#10b981',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '16px',
                    }}
                  >
                    ✓ ایجاد فاکتور
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {invoices.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>هنوز فاکتوری ثبت نشده است</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {invoices.map(invoice => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    return (
                      <div key={invoice.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                          <div>
                            <p style={{ fontWeight: 'bold', color: '#333', margin: '0 0 5px 0' }}>مشتری: {customer?.name}</p>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>تاریخ: {invoice.date}</p>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ fontWeight: 'bold', color: '#667eea', fontSize: '20px', margin: '0 0 5px 0' }}>{invoice.total.toLocaleString('fa-IR')} تومان</p>
                            <span style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: invoice.paymentType === 'cash' ? '#d1fae5' : '#fed7aa',
                              color: invoice.paymentType === 'cash' ? '#065f46' : '#92400e',
                            }}>
                              {invoice.paymentType === 'cash' ? 'نقدی' : 'اقساطی'}
                            </span>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '10px' }}>محصولات:</p>
                          {invoice.items.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', marginBottom: '5px' }}>
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
