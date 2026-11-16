import { api } from "../lib/api";
import type { AdminCoupon, AdminCustomer, AdminOrder, AdminProduct, AdminReview, AdminTaxonomy, DashboardDistribution, DashboardSummary, DashboardTimeline, DashboardTop, InventoryItem, Paged } from "../types/admin";

export const query = (values: Record<string, string | number | boolean | undefined | null>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") params.set(key, String(value)); });
  const text = params.toString(); return text ? `?${text}` : "";
};
export const adminApi = {
  dashboard: (range: string) => Promise.all([
    api.get<{ summary: DashboardSummary }>(`/admin/dashboard/summary${range}`), api.get<{ timeline: DashboardTimeline }>(`/admin/dashboard/revenue${range}${range ? "&" : "?"}groupBy=day`),
    api.get<{ distribution: DashboardDistribution }>(`/admin/dashboard/orders${range}`), api.get<DashboardTop>(`/admin/dashboard/top-products${range}${range ? "&" : "?"}limit=5`), api.get<DashboardTop>(`/admin/dashboard/top-categories${range}${range ? "&" : "?"}limit=5`),
  ]),
  products: (params: Record<string, unknown>) => api.get<Paged<AdminProduct>>(`/admin/products${query(params as Record<string, string | number | boolean>)}`),
  product: (id: string) => api.get<{ product: AdminProduct }>(`/admin/products/${id}`),
  saveProduct: (id: string | null, body: unknown) => id ? api.put<{ product: AdminProduct }>(`/admin/products/${id}`, body) : api.post<{ product: AdminProduct }>("/admin/products", body),
  productStatus: (id: string, body: unknown) => api.patch(`/admin/products/${id}/status`, body),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  sizes: () => api.get<{ items: Array<{ id: string; name: string }> }>("/admin/sizes"),
  colors: () => api.get<{ items: Array<{ id: string; name: string; hexCode: string | null }> }>("/admin/colors"),
  addVariant: (productId: string, body: unknown) => api.post(`/admin/products/${productId}/variants`, body),
  updateVariant: (id: string, body: unknown) => api.put(`/admin/variants/${id}`, body),
  deleteVariant: (id: string) => api.delete(`/admin/variants/${id}`),
  addProductImage: (productId: string, body: unknown) => api.post(`/admin/products/${productId}/images`, body),
  deleteProductImage: (productId: string, imageId: string) => api.delete(`/admin/products/${productId}/images/${imageId}`),
  taxonomy: (kind: "categories" | "brands", params: Record<string, unknown> = {}) => api.get<Paged<AdminTaxonomy>>(`/admin/${kind}${query(params as Record<string, string | number | boolean>)}`),
  saveTaxonomy: (kind: "categories" | "brands", id: string | null, body: unknown) => id ? api.put(`/admin/${kind}/${id}`, body) : api.post(`/admin/${kind}`, body),
  deleteTaxonomy: (kind: "categories" | "brands", id: string) => api.delete(`/admin/${kind}/${id}`),
  inventory: (params: Record<string, unknown>) => api.get<Paged<InventoryItem> & { summary: { outOfStock: number; lowStock: number; inStock: number } }>(`/admin/inventory${query(params as Record<string, string | number | boolean>)}`),
  adjustStock: (id: string, body: unknown) => api.patch(`/admin/inventory/${id}`, body),
  transactions: (id: string) => api.get<Paged<Record<string, unknown>>>(`/admin/inventory/${id}/transactions?page=1&limit=30`),
  orders: (params: Record<string, unknown>) => api.get<Paged<AdminOrder>>(`/admin/orders${query(params as Record<string, string | number | boolean>)}`),
  orderStatus: (id: string, status: string) => api.patch(`/admin/orders/${id}/status`, { status }),
  paymentStatus: (id: string, status: string) => api.patch(`/admin/orders/${id}/payment-status`, { status }),
  customers: (params: Record<string, unknown>) => api.get<Paged<AdminCustomer>>(`/admin/customers${query(params as Record<string, string | number | boolean>)}`),
  customerStatus: (id: string, isActive: boolean) => api.patch(`/admin/customers/${id}/status`, { isActive }),
  reviews: (params: Record<string, unknown>) => api.get<Paged<AdminReview>>(`/admin/reviews${query(params as Record<string, string | number | boolean>)}`),
  reviewStatus: (id: string, status: string) => api.patch(`/admin/reviews/${id}/status`, { status }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
  coupons: (params: Record<string, unknown>) => api.get<Paged<AdminCoupon>>(`/admin/coupons${query(params as Record<string, string | number | boolean>)}`),
  saveCoupon: (id: string | null, body: unknown) => id ? api.put(`/admin/coupons/${id}`, body) : api.post("/admin/coupons", body),
  couponStatus: (id: string, isActive: boolean) => api.patch(`/admin/coupons/${id}/status`, { isActive }),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
};
