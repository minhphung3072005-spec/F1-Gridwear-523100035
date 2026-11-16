import { z } from "zod";

const id = z.string().trim().min(1).max(32);
const money = z.number().finite().min(0).max(9_999_999_999.99).refine(
  (value) => Number.isInteger(value * 100),
  "Price can have at most two decimal places",
);
const nullableMoney = money.nullable().optional();
const sku = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9][A-Z0-9._-]*$/.test(value), "SKU format is invalid");

export const productVariantParamsSchema = z.object({ productId: id });
export const variantParamsSchema = z.object({ variantId: id });
export const sizeParamsSchema = z.object({ sizeId: id });
export const colorParamsSchema = z.object({ colorId: id });

const validatePrices = (value: { price?: number | null | undefined; salePrice?: number | null | undefined }) =>
  value.salePrice === undefined ||
  value.salePrice === null ||
  value.price === undefined ||
  value.price === null ||
  value.salePrice < value.price;

export const variantCreateSchema = z
  .object({
    sizeId: id,
    colorId: id,
    sku,
    price: nullableMoney,
    salePrice: nullableMoney,
    isActive: z.boolean().default(true),
  })
  .strict()
  .refine(validatePrices, { path: ["salePrice"], message: "salePrice must be less than price" });

export const variantUpdateSchema = z
  .object({
    sizeId: id,
    colorId: id,
    sku,
    price: money.nullable(),
    salePrice: money.nullable(),
    isActive: z.boolean(),
  })
  .strict()
  .refine(validatePrices, { path: ["salePrice"], message: "salePrice must be less than price" });

export const variantBulkCreateSchema = z
  .object({ items: z.array(variantCreateSchema).min(1).max(100) })
  .strict()
  .superRefine(({ items }, context) => {
    const skus = new Set<string>();
    const combinations = new Set<string>();
    items.forEach((item, index) => {
      const combination = `${item.sizeId}:${item.colorId}`;
      if (skus.has(item.sku)) {
        context.addIssue({ code: "custom", path: ["items", index, "sku"], message: "Duplicate SKU in request" });
      }
      if (combinations.has(combination)) {
        context.addIssue({
          code: "custom",
          path: ["items", index],
          message: "Duplicate size/color combination in request",
        });
      }
      skus.add(item.sku);
      combinations.add(combination);
    });
  });

export const sizeCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    slug: z.string().trim().min(1).max(60).optional(),
    sortOrder: z.number().int().min(0).max(10000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

export const sizeUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    slug: z.string().trim().min(1).max(60).optional(),
    sortOrder: z.number().int().min(0).max(10000),
    isActive: z.boolean(),
  })
  .strict();

export const colorCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(1).max(120).optional(),
    hexCode: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).transform((value) => value.toUpperCase()).nullable().optional(),
    sortOrder: z.number().int().min(0).max(10000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

export const colorUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(1).max(120).optional(),
    hexCode: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).transform((value) => value.toUpperCase()).nullable(),
    sortOrder: z.number().int().min(0).max(10000),
    isActive: z.boolean(),
  })
  .strict();

export type VariantCreateInput = z.infer<typeof variantCreateSchema>;
export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>;
export type VariantBulkCreateInput = z.infer<typeof variantBulkCreateSchema>;
export type SizeCreateInput = z.infer<typeof sizeCreateSchema>;
export type SizeUpdateInput = z.infer<typeof sizeUpdateSchema>;
export type ColorCreateInput = z.infer<typeof colorCreateSchema>;
export type ColorUpdateInput = z.infer<typeof colorUpdateSchema>;
