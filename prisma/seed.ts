/**
 * Database Seed Script
 * Creates initial admin user, settings, and accounting accounts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==================== CREATE ADMIN USER ====================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin user created (username: admin, password: admin123)');

  // ==================== CREATE DEFAULT SETTINGS ====================
  const settings = await prisma.setting.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      shopName: 'فروشگاه موبایل',
      shopPhone: '',
      shopAddress: '',
      defaultInputCurrency: 'TOMAN',
      defaultReportCurrency: 'RIAL',
      purchaseInvoicePrefix: 'PUR-',
      salesInvoicePrefix: 'SAL-',
      salesReturnPrefix: 'SRN-',
      purchaseReturnPrefix: 'PRN-',
      installmentContractPrefix: 'INS-',
      checkPrefix: 'CHK-',
      promissoryNotePrefix: 'PNT-',
      registerMovementPrefix: 'REG-',
      allowNegativeStock: false,
      enableLateFee: false,
      lateFeePercentage: 0.0,
    },
  });
  console.log('✅ Default settings created');

  // ==================== CREATE ACCOUNTING ACCOUNTS ====================
  const accountsData = [
    // Assets
    { code: '1001', name: 'موجودی کالا', type: 'ASSET', category: 'INVENTORY_ASSET' },
    { code: '1002', name: 'صندوق', type: 'ASSET', category: 'CASH_REGISTER_ASSET' },
    { code: '1003', name: 'حساب‌های دریافتنی', type: 'ASSET', category: 'ACCOUNTS_RECEIVABLE' },
    { code: '1004', name: 'دریافتنی اقساط', type: 'ASSET', category: 'INSTALLMENT_RECEIVABLE' },
    { code: '1005', name: 'چک‌های دریافتنی', type: 'ASSET', category: 'CHECKS_RECEIVABLE' },
    { code: '1006', name: 'سفته‌های دریافتنی', type: 'ASSET', category: 'PROMISSORY_NOTES_RECEIVABLE' },
    
    // Liabilities
    { code: '2001', name: 'حساب‌های پرداختنی', type: 'LIABILITY', category: 'ACCOUNTS_PAYABLE' },
    
    // Equity
    { code: '3001', name: 'سرمایه / تراز افتتاحیه', type: 'EQUITY', category: 'OPENING_BALANCE_OWNER_EQUITY' },
    
    // Revenue
    { code: '4001', name: 'فروش', type: 'REVENUE', category: 'SALES_REVENUE' },
    { code: '4002', name: 'برگشت از فروش', type: 'REVENUE', category: 'SALES_RETURNS' },
    { code: '4003', name: 'تخفیفات فروش', type: 'REVENUE', category: 'SALES_DISCOUNTS' },
    
    // Expense
    { code: '5001', name: 'بهای تمام شده کالای فروش رفته', type: 'EXPENSE', category: 'COST_OF_GOODS_SOLD' },
    { code: '5002', name: 'تفاوت تعدیل موجودی', type: 'EXPENSE', category: 'INVENTORY_ADJUSTMENT_VARIANCE' },
  ];

  for (const accountData of accountsData) {
    await prisma.account.upsert({
      where: { category: accountData.category },
      update: {},
      create: {
        code: accountData.code,
        name: accountData.name,
        type: accountData.type,
        category: accountData.category,
        balance: 0n,
        isActive: true,
      },
    });
    console.log(`✅ Account created: ${accountData.name} (${accountData.code})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
