export type Pagination = { page: number; limit: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
export type ImageAsset = { id: string; urlSnapshot: string; altText: string | null; isPrimary?: boolean; sortOrder?: number };
export type Taxonomy = { id: string; name: string; slug: string; imageUrl?: string | null; logoUrl?: string | null; description?: string | null };
export type Size = Taxonomy & { sortOrder?: number };
export type Color = Taxonomy & { hexCode: string; sortOrder?: number };

export type ProductCardData = {
  id: string; name: string; slug: string; shortDescription: string | null;
  basePrice: number; salePrice: number | null; effectivePrice: number;
  minVariantPrice: number | null; maxVariantPrice: number | null;
  isFeatured: boolean; category: Taxonomy; brand: Taxonomy;
  primaryImage: ImageAsset | null; totalStock: number; variantCount: number;
  averageRating: number; ratingCount: number; soldCount: number;
};

export type Variant = {
  id: string; sku: string; price: number | null; salePrice: number | null;
  stock: number; isActive: boolean; size: Size; color: Color;
};

export type Review = { id: string; rating: number; title: string | null; content: string | null; createdAt: string; user: { id: string; fullName: string; avatarUrl: string | null } };
export type ProductDetail = {
  id: string; name: string; slug: string; shortDescription: string | null; description: string | null;
  basePrice: number; salePrice: number | null; category: Taxonomy; brand: Taxonomy;
  images: ImageAsset[]; variants: Variant[]; reviews: Review[];
  ratingSummary: { average: number; count: number };
};

export type User = { id: string; email: string; fullName: string; phone: string | null; avatarUrl: string | null; role: "CUSTOMER" | "ADMIN" };
export type Address = { id: string; recipientName: string; phone: string; line1: string; line2: string | null; ward: string; district: string; province: string; postalCode: string | null; isDefault: boolean };

export type CartItem = {
  id: string; quantity: number; unitPrice: number; lineTotal: number; isAvailable: boolean; availabilityCode: string | null;
  variant: { id: string; sku: string; stock: number; price: number | null; salePrice: number | null; size: Size; color: Color };
  product: { id: string; name: string; slug: string; basePrice: number; salePrice: number | null; image: ImageAsset | null };
};
export type Cart = { id: string; items: CartItem[]; summary: { distinctItems: number; itemCount: number; subtotal: number; discount: number; shipping: number; total: number; hasUnavailableItems: boolean } };

export type Order = {
  id: string; orderCode: string; status: "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  paymentMethod: "COD"; paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  receiverName: string; receiverPhone: string; receiverEmail: string; addressLine1: string; addressLine2: string | null;
  ward: string; district: string; province: string; couponCode: string | null; note: string | null;
  subtotal: number; discount: number; shippingFee: number; total: number; createdAt: string; deliveredAt: string | null; cancelledAt: string | null;
  items: Array<{ id: string; productId: string | null; productName: string; sku: string; size: string; color: string; imageUrl: string | null; unitPrice: number; quantity: number; subtotal: number; review: { id: string; rating: number; status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" } | null }>;
  statusHistory: Array<{ id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }>;
};

export type ApiErrorBody = { success: false; message: string; code: string; errors?: Array<{ field?: string; message: string }> };
