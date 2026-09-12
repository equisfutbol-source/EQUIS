export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  image?: string;
  quantity: number;
  color?: string;
  size?: string;
}

/**
 * Two cart lines with the same productId but different size/color are
 * distinct purchases (e.g. "Camiseta, Talla M" vs "Camiseta, Talla L") and
 * must not be merged or targeted interchangeably by remove/updateQuantity.
 */
export function cartLineKey(item: { productId: string; color?: string; size?: string }): string {
  return `${item.productId}|${item.color ?? ""}|${item.size ?? ""}`;
}
