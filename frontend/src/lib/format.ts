export function formatMoney(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function effectiveVariantPrice(variant: { price: number | null; salePrice: number | null }, product: { basePrice: number; salePrice: number | null }): number {
  return variant.salePrice ?? variant.price ?? product.salePrice ?? product.basePrice;
}

export function discountPercent(base: number, sale: number | null): number | null {
  return sale && sale < base ? Math.round((1 - sale / base) * 100) : null;
}
