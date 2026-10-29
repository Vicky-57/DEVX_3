export function formatPaise(paise: number, currency = 'INR'): string {
  const rupees = paise / 100;
  // Format with Indian numbering system (lakhs, crores)
  const isWhole = rupees % 1 === 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return formatted;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}
