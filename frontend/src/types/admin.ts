import type { Pagination, Taxonomy, Variant } from "./api";

export type Paged<T> = { items: T[]; pagination: Pagination };
export type AdminProduct = {
  id: string; name: string; slug: string; shortDescription: string | null; description?: string | null;
  basePrice: number; salePrice: number | null; status: "DRAFT" | "ACTIVE" | "INACTIVE"; isFeatured: boolean;
  createdAt: string; category: Taxonomy; brand: Taxonomy; primaryImage: { urlSnapshot: string } | null;
  totalStock: number; variantCount: number; variants?: Variant[]; images?: Array<{ id: string; urlSnapshot: string; altText: string | null; isPrimary: boolean }>;
};
export type AdminTaxonomy = Taxonomy & { isActive: boolean; sortOrder: number; createdAt: string; _count: { products: number } };
export type InventoryItem = Variant & { stockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK"; updatedAt: string; product: { id: string; name: string; slug: string; status: string; brand: Taxonomy; category: Taxonomy } };
export type AdminOrder = { id: string; orderCode: string; status: string; paymentStatus: string; paymentMethod: string; receiverName: string; receiverPhone: string; receiverEmail: string | null; total: number; createdAt: string; items: Array<{ id: string; productName: string; sku: string; quantity: number; subtotal: number; size: string; color: string }>; statusHistory: Array<{ id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }> };
export type AdminCustomer = { id: string; fullName: string; email: string; phone: string | null; avatarUrl: string | null; isActive: boolean; createdAt: string; _count: { orders: number; addresses: number; reviews: number }; totalSpent?: number };
export type AdminReview = { id: string; rating: number; title: string | null; content: string | null; status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN"; createdAt: string; user: { id: string; fullName: string; email: string }; product: { id: string; name: string; slug: string } };
export type AdminCoupon = { id: string; code: string; type: "PERCENT" | "FIXED"; value: number; minOrderValue: number; maxDiscount: number | null; startAt: string; endAt: string; usageLimit: number | null; perUserLimit: number | null; usedCount: number; isActive: boolean; createdAt: string };
export type DashboardSummary = { range: { from: string; to: string }; totalRevenue: number; totalOrders: number; totalCustomers: number; newCustomers: number; totalProducts: number; outOfStockProducts: number; lowStockProducts: number };
export type DashboardTimeline = { points: Array<{ period: string; revenue: number; orders: number }> };
export type DashboardDistribution = { total: number; items: Array<{ status: string; count: number }> };
export type DashboardTop = { items: Array<{ rank: number; name: string; quantity: number; revenue: number }> };
