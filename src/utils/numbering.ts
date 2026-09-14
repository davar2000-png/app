/**
 * Document Numbering Utilities
 * Generates unique document numbers for invoices, contracts, checks, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate the next document number based on prefix and type
 * @param prefix - Document prefix (e.g., "SAL-", "PUR-")
 * @param date - Date for the document (for sequential numbering per day)
 * @returns Unique document number string
 */
export async function generateDocumentNumber(
  prefix: string,
  tableName: string,
  date: Date = new Date()
): Promise<string> {
  // Get the year-month part for daily/monthly sequencing
  const yearMonth = date.toISOString().slice(0, 7).replace('-', ''); // YYYYMM
  
  // Find the highest existing number for this prefix and period
  const result = await prisma.$queryRawUnsafe<{ maxNum: number }[]>(
    `SELECT MAX(CAST(SUBSTR(invoice_number, LENGTH(?) + 7) AS INTEGER)) as maxNum 
     FROM "${tableName}" 
     WHERE invoice_number LIKE ? || ? || '%'`,
    prefix,
    prefix,
    yearMonth
  );
  
  const maxNum = result[0]?.maxNum || 0;
  const nextNum = maxNum + 1;
  
  // Format: PREFIX-YYYYMMNNNN (e.g., SAL-1403010001)
  return `${prefix}${yearMonth}${String(nextNum).padStart(4, '0')}`;
}

/**
 * Generate a simple sequential number
 * @param prefix - Prefix for the number
 * @param tableName - Database table name to check existing numbers
 * @param fieldName - Field name that stores the number (default: 'invoiceNumber')
 * @returns Next sequential number
 */
export async function generateSequentialNumber(
  prefix: string,
  tableName: string,
  fieldName: string = 'invoiceNumber'
): Promise<string> {
  // Query to get the max numeric part
  const result = await prisma.$queryRawUnsafe<{ maxNum: number }[]>(
    `SELECT MAX(CAST(SUBSTR(${fieldName}, LENGTH(?) + 1) AS INTEGER)) as maxNum 
     FROM "${tableName}" 
     WHERE ${fieldName} LIKE ? || '%'`,
    fieldName,
    prefix
  );
  
  const maxNum = result[0]?.maxNum || 0;
  const nextNum = maxNum + 1;
  
  return `${prefix}${String(nextNum).padStart(6, '0')}`;
}

/**
 * Validate document number format
 * @param number - Document number to validate
 * @param prefix - Expected prefix
 * @returns true if valid format
 */
export function isValidDocumentNumber(number: string, prefix: string): boolean {
  if (!number.startsWith(prefix)) {
    return false;
  }
  
  // Check that the rest is alphanumeric
  const suffix = number.slice(prefix.length);
  return /^[A-Z0-9]+$/.test(suffix);
}

/**
 * Parse document number to extract components
 * @param number - Full document number
 * @param prefix - Document prefix
 * @returns Object with prefix and sequence number, or null if invalid
 */
export function parseDocumentNumber(
  number: string,
  prefix: string
): { prefix: string; sequence: string; datePart?: string } | null {
  if (!number.startsWith(prefix)) {
    return null;
  }
  
  const suffix = number.slice(prefix.length);
  
  // Try to parse as PREFIX-YYYYMMNNNN format
  const dateMatch = suffix.match(/^(\d{6})(\d+)$/);
  if (dateMatch) {
    return {
      prefix,
      datePart: dateMatch[1],
      sequence: dateMatch[2]
    };
  }
  
  // Simple sequential format
  return {
    prefix,
    sequence: suffix
  };
}

/**
 * Get settings-based prefixes for document types
 */
export interface DocumentPrefixes {
  purchaseInvoice: string;
  salesInvoice: string;
  salesReturn: string;
  purchaseReturn: string;
  installmentContract: string;
  check: string;
  promissoryNote: string;
  registerMovement: string;
}

/**
 * Fetch document prefixes from settings
 */
export async function getDocumentPrefixes(): Promise<DocumentPrefixes> {
  const settings = await prisma.setting.findFirst();
  
  if (!settings) {
    // Return defaults if no settings found
    return {
      purchaseInvoice: 'PUR-',
      salesInvoice: 'SAL-',
      salesReturn: 'SRN-',
      purchaseReturn: 'PRN-',
      installmentContract: 'INS-',
      check: 'CHK-',
      promissoryNote: 'PNT-',
      registerMovement: 'REG-'
    };
  }
  
  return {
    purchaseInvoice: settings.purchaseInvoicePrefix,
    salesInvoice: settings.salesInvoicePrefix,
    salesReturn: settings.salesReturnPrefix,
    purchaseReturn: settings.purchaseReturnPrefix,
    installmentContract: settings.installmentContractPrefix,
    check: settings.checkPrefix,
    promissoryNote: settings.promissoryNotePrefix,
    registerMovement: settings.registerMovementPrefix
  };
}

/**
 * Generate payment number
 */
export async function generatePaymentNumber(): Promise<string> {
  return generateSequentialNumber('PAY-', 'Payment', 'paymentNumber');
}

/**
 * Generate movement number for register
 */
export async function generateRegisterMovementNumber(): Promise<string> {
  const settings = await prisma.setting.findFirst();
  const prefix = settings?.registerMovementPrefix || 'REG-';
  return generateSequentialNumber(prefix, 'RegisterMovement', 'movementNumber');
}
