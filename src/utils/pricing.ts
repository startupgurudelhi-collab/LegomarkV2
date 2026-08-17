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
