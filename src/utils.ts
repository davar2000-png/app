export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatNumber(num: number): string {
  if (num === 0) return '۰';
  return Math.abs(num).toLocaleString('fa-IR');
}

export function formatCurrency(num: number): string {
  const sign = num < 0 ? '-' : '';
  return `${sign}${formatNumber(Math.abs(num))} تومان`;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateInvoiceNumber(type: 'purchase' | 'sale' | 'proforma'): string {
  const prefix = type === 'purchase' ? 'خرید' : type === 'sale' ? 'فروش' : 'پیش';
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${num}`;
}

export function generateProductCode(): string {
  return `PRD-${Date.now().toString().slice(-6)}`;
}

export function jalaliDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return dateStr || '';
  }
}

export function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(getTodayDate());
}

export function daysUntil(dateStr: string): number {
  const today = new Date(getTodayDate());
  const target = new Date(dateStr);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
