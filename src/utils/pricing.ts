/**
 * Safely parse a display price string (e.g. '₹6,999', '₹14,999 / year', '₹1,499', 'Starting ₹999') into a numeric INR amount
 */
export function parsePriceToNumber(price: string | number | undefined | null, fallback = 0): number {
  if (typeof price === 'number') {
    return isNaN(price) ? fallback : price;
  }
  if (!price || typeof price !== 'string') {
    return fallback;
  }
  // Strip currency symbols (₹, Rs, INR), commas, spaces, and any non-numeric except dot
  const cleaned = price.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Format a number into Indian Rupee format (e.g. 6999 -> ₹6,999)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Ensures any price string or numeric price contains the ₹ Indian Rupee symbol.
 * Handles bare numbers (4999 -> ₹4,999), strings with existing symbols, and custom text.
 */
export function ensureRupeePrice(price: string | number | undefined | null): string {
  if (price === undefined || price === null || price === '') {
    return '₹0';
  }

  if (typeof price === 'number') {
    return isNaN(price) ? '₹0' : formatINR(price);
  }

  const trimmed = String(price).trim();
  if (!trimmed) return '₹0';

  // If it already has the Rupee symbol, return as is
  if (trimmed.includes('₹')) {
    return trimmed;
  }

  // If it has foreign currency symbol (e.g. $, €, £), preserve it
  if (trimmed.includes('$') || trimmed.includes('€') || trimmed.includes('£')) {
    return trimmed;
  }

  // If it starts with Rs., Rs, INR, replace with ₹
  if (/^(Rs\.?|INR)\s*/i.test(trimmed)) {
    return trimmed.replace(/^(Rs\.?|INR)\s*/i, '₹');
  }

  // If the string is purely numeric or numeric with commas (e.g. "4999", "16,999")
  const numOnly = parseFloat(trimmed.replace(/[^\d.]/g, ''));
  if (!isNaN(numOnly) && /^\d[\d,.]*$/.test(trimmed)) {
    return formatINR(numOnly);
  }

  // If the string contains a number (e.g. "4999 / year" or "Starting 999")
  const numMatch = trimmed.match(/\d[\d,.]*/);
  if (numMatch) {
    const numVal = parseFloat(numMatch[0].replace(/,/g, ''));
    if (!isNaN(numVal)) {
      const formattedNum = numVal.toLocaleString('en-IN');
      return trimmed.replace(numMatch[0], `₹${formattedNum}`);
    }
  }

  // Fallback prefix
  return `₹${trimmed}`;
}

