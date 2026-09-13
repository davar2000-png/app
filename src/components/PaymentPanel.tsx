import { useState, useEffect } from 'react';
import type { Payment, Cheque, Installment } from '../types';
import { generateId, formatNumber, getTodayDate } from '../utils';

interface PaymentRow {
  id: string;
  method: 'cash' | 'card' | 'check' | 'installment' | 'voucher' | 'credit';
  amount: number;
  // فیلدهای ویژه چک
  checkNumber?: string;
  bankName?: string;
  dueDate?: string;
  // فیلدهای ویژه اقساط
  installmentCount?: number;
  firstDueDate?: string;
  monthInterval?: number;
  note?: string;
}

interface PaymentPanelProps {
  totalAmount: number;
  discount: number;
  invoiceId: string;
  personId: string;
  type: 'sale' | 'purchase';
  existingPayments?: Payment[];
  onPaymentsChange: (payments: PaymentRow[]) => void;
}

export default function PaymentPanel({
  totalAmount,
  discount,
  invoiceId,
  personId,
  type,
  existingPayments = [],
  onPaymentsChange
}: PaymentPanelProps) {
  const [rows, setRows] = useState<PaymentRow[]>([
    { id: generateId(), method: 'cash', amount: totalAmount - discount }
  ]);

  useEffect(() => {
    onPaymentsChange(rows);
  }, [rows]);

  const payableAmount = totalAmount - discount;
  const paidAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  const remaining = payableAmount - paidAmount;

  const addRow = () => {
    setRows([...rows, { id: generateId(), method: 'cash', amount: 0 }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<PaymentRow>) => {
    setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const setFullCash = () => {
    setRows([{ id: generateId(), method: 'cash', amount: payableAmount }]);
  };

  const clearAll = () => {
    setRows([]);
  };

  const methodLabels: Record<string, string> = {
    cash: '💵 نقدی',
    card: '💳 کارت',
    check: '📝 چک',
    installment: '📅 اقساط',
    voucher: '🧾 فیش',
    credit: '🤝 نسیه'
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">💰 پنل تسویه</h3>
        <div className="flex gap-2">
          <button onClick={setFullCash} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm">تسویه کامل نقدی</button>
          <button onClick={clearAll} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm">پاک کردن</button>
        </div>
      </div>

      {/* محاسبه زنده */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-500/10 rounded-xl p-3 text-center">
          <p className="text-blue-400 text-xs">قابل پرداخت</p>
          <p className="text-white font-bold">{formatNumber(payableAmount)}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
          <p className="text-emerald-400 text-xs">پرداختی</p>
          <p className="text-white font-bold">{formatNumber(paidAmount)}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${remaining === 0 ? 'bg-emerald-500/10' : remaining > 0 ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}>
          <p className={`text-xs ${remaining === 0 ? 'text-emerald-400' : remaining > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
            {remaining === 0 ? '✅ تسویه' : remaining > 0 ? '⚠️ مانده' : '❌ بیش از مبلغ'}
          </p>
          <p className={`font-bold ${remaining === 0 ? 'text-emerald-400' : remaining > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
            {formatNumber(Math.abs(remaining))}
          </p>
        </div>
      </div>

      {/* ردیف‌های پرداخت */}
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="bg-slate-700/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-400 text-sm">ردیف {index + 1}</span>
              <select
                value={row.method}
                onChange={e => updateRow(row.id, { method: e.target.value as any })}
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm"
              >
                {Object.entries(methodLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="number"
                value={row.amount || ''}
                onChange={e => updateRow(row.id, { amount: Number(e.target.value) })}
                placeholder="مبلغ"
                className="w-32 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm"
              />
              <button onClick={() => removeRow(row.id)} className="text-rose-400 hover:text-rose-300">✕</button>
            </div>

            {/* فیلدهای ویژه چک */}
            {row.method === 'check' && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input value={row.checkNumber || ''} onChange={e => updateRow(row.id, { checkNumber: e.target.value })} placeholder="شماره چک" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
                <input value={row.bankName || ''} onChange={e => updateRow(row.id, { bankName: e.target.value })} placeholder="بانک" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
                <input type="date" value={row.dueDate || ''} onChange={e => updateRow(row.id, { dueDate: e.target.value })} className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
              </div>
            )}

            {/* فیلدهای ویژه اقساط */}
            {row.method === 'installment' && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input type="number" value={row.installmentCount || ''} onChange={e => updateRow(row.id, { installmentCount: Number(e.target.value) })} placeholder="تعداد قسط" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
                <input type="date" value={row.firstDueDate || ''} onChange={e => updateRow(row.id, { firstDueDate: e.target.value })} placeholder="سررسید اول" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
                <input type="number" value={row.monthInterval || ''} onChange={e => updateRow(row.id, { monthInterval: Number(e.target.value) })} placeholder="فاصله (ماه)" className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
              </div>
            )}

            {/* یادداشت */}
            <input value={row.note || ''} onChange={e => updateRow(row.id, { note: e.target.value })} placeholder="یادداشت" className="w-full mt-2 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" />
          </div>
        ))}
      </div>

      <button onClick={addRow} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-bold">
        ＋ افزودن ردیف پرداخت
      </button>

      {/* اعتبارسنجی */}
      {remaining < 0 && (
        <div className="mt-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
          <p className="text-rose-400 text-sm">❌ مبلغ پرداختی بیشتر از قابل پرداخت است!</p>
        </div>
      )}
    </div>
  );
}

export type { PaymentRow };
