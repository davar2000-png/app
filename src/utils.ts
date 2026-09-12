export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatNumber(num: number): string {
  return num.toLocaleString('fa-IR');
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateInvoiceNumber(type: 'purchase' | 'sale'): string {
  const prefix = type === 'purchase' ? 'P' : 'S';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

export function calculateInstallments(totalAmount: number, downPayment: number, months: number): { amount: number; dates: string[] } {
  const remaining = totalAmount - downPayment;
  const installmentAmount = Math.round(remaining / months);
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i);
    dates.push(dueDate.toISOString().split('T')[0]);
  }
  
  return { amount: installmentAmount, dates };
}
