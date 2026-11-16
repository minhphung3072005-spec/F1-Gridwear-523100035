import { api } from "../lib/api";
import type { Color, Pagination, ProductCardData, ProductDetail, Size, Taxonomy } from "../types/api";

export type ProductFilters = Record<string, string | number | boolean | undefined>;

function queryString(filters: ProductFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const catalogService = {
  products: (filters: ProductFilters = {}) => api.get<{ items: ProductCardData[]; pagination: Pagination }>(`/products${queryString(filters)}`),
  featured: (limit = 8) => api.get<{ items: ProductCardData[]; pagination: Pagination }>(`/products/featured?limit=${limit}`),
  product: (slug: string) => api.get<{ product: ProductDetail }>(`/products/${slug}`),
  related: (slug: string) => api.get<{ items: ProductCardData[] }>(`/products/${slug}/related`),
  categories: () => api.get<{ items: Array<Taxonomy & { imageUrl: string | null; _count: { products: number } }> }>("/categories"),
  brands: () => api.get<{ items: Array<Taxonomy & { logoUrl: string | null; _count: { products: number } }> }>("/brands"),
  sizes: () => api.get<{ items: Size[] }>("/sizes"),
  colors: () => api.get<{ items: Color[] }>("/colors"),
};
