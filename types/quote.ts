export const ITBMS_RATE = 0.07;

/** Tiered quantity discount brackets applied per line item. */
export const QUANTITY_DISCOUNT_TIERS = [
  { minQuantity: 25, rate: 0.3 },
  { minQuantity: 10, rate: 0.15 },
] as const;

export function discountRateForQuantity(quantity: number): number {
  const tier = QUANTITY_DISCOUNT_TIERS.find((t) => quantity >= t.minQuantity);
  return tier ? tier.rate : 0;
}

export interface QuoteLineItem {
  productId: string;
  sku: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface QuoteTotals {
  grossSubtotal: number;
  totalDiscount: number;
  netSubtotal: number;
  itbms: number;
  total: number;
}

export function computeQuoteTotals(lineItems: QuoteLineItem[]): QuoteTotals {
  let grossSubtotal = 0;
  let totalDiscount = 0;

  for (const item of lineItems) {
    const gross = item.unit_price * item.quantity;
    const discountRate = discountRateForQuantity(item.quantity);
    grossSubtotal += gross;
    totalDiscount += gross * discountRate;
  }

  const netSubtotal = grossSubtotal - totalDiscount;
  const itbms = netSubtotal * ITBMS_RATE;
  const total = netSubtotal + itbms;

  return { grossSubtotal, totalDiscount, netSubtotal, itbms, total };
}
