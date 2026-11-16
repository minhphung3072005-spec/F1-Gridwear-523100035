import { z } from "zod";

import { ProductStatus } from "../../generated/prisma/enums.js";

const decimalMoney = z.number().finite().min(0).max(9_999_999_999.99).refine(
  (value) => Number.isInteger(value * 100),
  "Price can have at most two decimal places",
);

const commaSeparated = z
  .string()
  .trim()
  .max(500)
  .transform((value) => [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))])
  .optional();

export const productSlugParamsSchema = z.object({ slug: z.string().trim().min(1).max(220) });
export const productParamsSchema = z.object({ productId: z.string().trim().min(1).max(32) });

export const productListQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    brand: commaSeparated,
    category: commaSeparated,
    sizes: commaSeparated,
    colors: commaSeparated,
    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),
    inStock: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    featured: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    sortBy: z.enum(["newest", "price", "name", "popular", "rating"]).default("newest"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  })
  .refine(
    ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { path: ["maxPrice"], message: "maxPrice must be greater than or equal to minPrice" },
  );

export const adminProductListQuerySchema = productListQuerySchema.and(
  z.object({
    status: z.nativeEnum(ProductStatus).optional(),
  }),
);

const productFields = {
  categoryId: z.string().trim().min(1).max(32),
  brandId: z.string().trim().min(1).max(32),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(1).max(220).optional(),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(50_000).nullable().optional(),
  basePrice: decimalMoney,
  salePrice: decimalMoney.nullable().optional(),
  status: z.nativeEnum(ProductStatus),
  isFeatured: z.boolean(),
};

const validateSalePrice = (value: { basePrice: number; salePrice?: number | null | undefined }) =>
  value.salePrice === undefined || value.salePrice === null || value.salePrice < value.basePrice;

export const productCreateSchema = z
  .object({
    ...productFields,
    status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
    isFeatured: z.boolean().default(false),
  })
  .strict()
  .refine(validateSalePrice, { path: ["salePrice"], message: "salePrice must be less than basePrice" });

export const productUpdateSchema = z
  .object(productFields)
  .strict()
  .refine(validateSalePrice, { path: ["salePrice"], message: "salePrice must be less than basePrice" });

export const productStatusSchema = z
  .object({
    status: z.nativeEnum(ProductStatus).optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.isFeatured !== undefined, {
    message: "At least one status field is required",
  });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductStatusInput = z.infer<typeof productStatusSchema>;
