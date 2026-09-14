'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در ورود');
      }

      // موفقیت - ریدایرکت به داشبورد
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'نام کاربری یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 font-vazir">
            ورود به سیستم مدیریت فروشگاه
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-vazir">
            لطفاً نام کاربری و رمز عبور خود را وارد کنید
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-vazir text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 font-vazir">
              نام کاربری
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-vazir"
              placeholder="نام کاربری را وارد کنید"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-vazir">
              رمز عبور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-vazir"
              placeholder="رمز عبور را وارد کنید"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-vazir"
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500 font-vazir">
            <p>پیش‌فرض: admin / admin123</p>
            <p className="text-red-500 mt-1">⚠️ حتماً رمز عبور را تغییر دهید</p>
          </div>
        </form>
      </div>
    </div>
  );
}
