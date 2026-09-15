/**
 * Money/Currency Utilities
 * All monetary values are stored as BigInt in Rial internally.
 * Users input amounts in Toman by default.
 */

/**
 * Convert Toman to Rial (multiply by 10)
 */
export function toRialFromToman(toman: bigint | number | string): bigint {
  const tomanBigInt = typeof toman === 'string' 
    ? BigInt(Math.floor(parseFloat(toman))) 
    : typeof toman === 'number' 
      ? BigInt(Math.floor(toman)) 
      : toman;
  return tomanBigInt * 10n;
}

/**
 * Convert Rial to Toman (divide by 10)
 */
export function toTomanFromRial(rial: bigint | number | string): bigint {
  const rialBigInt = typeof rial === 'string' 
    ? BigInt(rial) 
    : typeof rial === 'number' 
      ? BigInt(Math.floor(rial)) 
      : rial;
  return rialBigInt / 10n;
}

/**
 * Format Rial amount with thousand separators for display
 * Example: 1,234,567 ریال
 */
export function formatRial(rial: bigint | number | string): string {
  const rialBigInt = typeof rial === 'string' 
    ? BigInt(rial) 
    : typeof rial === 'number' 
      ? BigInt(Math.floor(rial)) 
      : rial;
  
  const absoluteValue = rialBigInt < 0n ? -rialBigInt : rialBigInt;
  const formatted = absoluteValue.toLocaleString('fa-IR');
  
  if (rialBigInt < 0n) {
    return `-${formatted} ریال`;
  }
  return `${formatted} ریال`;
}

/**
 * Format Toman amount with thousand separators for display
 * Example: 123,456 تومان
 */
export function formatToman(toman: bigint | number | string): string {
  const tomanBigInt = typeof toman === 'string' 
    ? BigInt(Math.floor(parseFloat(toman))) 
    : typeof toman === 'number' 
      ? BigInt(Math.floor(toman)) 
      : toman;
  
  const absoluteValue = tomanBigInt < 0n ? -tomanBigInt : tomanBigInt;
  const formatted = absoluteValue.toLocaleString('fa-IR');
  
  if (tomanBigInt < 0n) {
    return `-${formatted} تومان`;
  }
  return `${formatted} تومان`;
}

/**
 * Parse a Persian formatted number string to BigInt
 * Handles Persian digits and removes thousand separators
 */
export function parsePersianNumber(str: string): bigint {
  // Replace Persian/Arabic digits with English digits
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let normalized = str;
  persianDigits.forEach((digit, index) => {
    normalized = normalized.replace(new RegExp(digit, 'g'), index.toString());
  });
  
  // Remove thousand separators and non-numeric characters except minus
  normalized = normalized.replace(/[^0-9-]/g, '');
  
  if (!normalized || normalized === '-') {
    return 0n;
  }
  
  return BigInt(normalized);
}

/**
 * Validate that a value is a valid positive monetary amount
 */
export function isValidMoneyAmount(value: bigint | number | string): boolean {
  try {
    const bigValue = typeof value === 'string' 
      ? BigInt(value) 
      : typeof value === 'number' 
        ? BigInt(Math.floor(value)) 
        : value;
    return bigValue >= 0n;
  } catch {
    return false;
  }
}

/**
 * Add two monetary values (in Rial)
 */
export function addRial(a: bigint, b: bigint): bigint {
  return a + b;
}

/**
 * Subtract two monetary values (in Rial)
 */
export function subtractRial(a: bigint, b: bigint): bigint {
  return a - b;
}

/**
 * Multiply a monetary value by a scalar
 */
export function multiplyRial(amount: bigint, scalar: number | bigint): bigint {
  const scalarBigInt = typeof scalar === 'number' ? BigInt(scalar) : scalar;
  return amount * scalarBigInt;
}

/**
 * Calculate percentage of a monetary value
 */
export function percentageOfRial(amount: bigint, percentage: number): bigint {
  return (amount * BigInt(Math.floor(percentage * 100))) / 10000n;
}

/**
 * Compare two monetary values
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareRial(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
