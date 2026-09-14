'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // بررسی احراز هویت در کلاینت (اختیاری - middleware هم بررسی می‌کند)
    const session = document.cookie.includes('session=authenticated');
    if (!session) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 font-vazir text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 font-vazir">داشبورد مدیریت</h1>
          <button
            onClick={() => router.push('/api/auth/logout')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-vazir"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 font-vazir">خوش آمدید!</h2>
            <p className="text-gray-600 font-vazir mb-6">
              سیستم مدیریت فروشگاه موبایل با موفقیت اجرا شد.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-vazir font-semibold text-lg mb-2">محصولات</h3>
                <p className="text-gray-600 text-sm font-vazir mb-4">مدیریت محصولات و سریال‌ها</p>
                <button
                  onClick={() => router.push('/products')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full font-vazir"
                >
                  مشاهده محصولات
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-vazir font-semibold text-lg mb-2">فروش</h3>
                <p className="text-gray-600 text-sm font-vazir mb-4">ثبت فاکتور فروش جدید</p>
                <button
                  onClick={() => router.push('/sales')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full font-vazir"
                >
                  ثبت فروش
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-vazir font-semibold text-lg mb-2">خرید</h3>
                <p className="text-gray-600 text-sm font-vazir mb-4">ثبت فاکتور خرید جدید</p>
                <button
                  onClick={() => router.push('/purchases')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full font-vazir"
                >
                  ثبت خرید
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-vazir font-semibold text-lg mb-2">اقساط</h3>
                <p className="text-gray-600 text-sm font-vazir mb-4">مدیریت قراردادهای اقساطی</p>
                <button
                  onClick={() => router.push('/installments')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded w-full font-vazir"
                >
                  اقساط
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-vazir font-semibold text-lg mb-2">چک و سفته</h3>
                <p className="text-gray-600 text-sm font-vazir mb-4">مدیریت چک‌های دریافتنی</p>
                <button
                  onClick={() => router.push('/checks')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded w-full font-vazir"
                >
                  چک‌ها
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-vazir font-semibold text-lg mb-2">گزارشات</h3>
                <p className="text-gray-600 text-sm font-vazir mb-4">مشاهده گزارش‌های جامع</p>
                <button
                  onClick={() => router.push('/reports')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded w-full font-vazir"
                >
                  گزارشات
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
