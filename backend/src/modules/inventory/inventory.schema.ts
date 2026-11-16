import { z } from "zod";

import { InventoryTransactionType } from "../../generated/prisma/enums.js";

const id = z.string().trim().min(1).max(32);

export const inventoryParamsSchema = z.object({ variantId: id });

export const inventoryListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  status: z.enum(["OUT_OF_STOCK", "LOW_STOCK", "IN_STOCK"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const inventoryTransactionQuerySchema = z
  .object({
    type: z.nativeEnum(InventoryTransactionType).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ["to"],
    message: "to must be greater than or equal to from",
  });

export const inventoryAdjustmentSchema = z
  .object({
    mode: z.enum(["SET", "INCREMENT", "DECREMENT"]),
    quantity: z.number().int().min(0).max(1_000_000),
    reason: z.string().trim().min(5).max(500),
  })
  .strict()
  .refine(({ mode, quantity }) => mode === "SET" || quantity > 0, {
    path: ["quantity"],
    message: "quantity must be greater than zero for increment or decrement",
  });

const importItemSchema = z.object({
  variantId: id,
  quantity: z.number().int().min(1).max(1_000_000),
});

export const inventoryImportSchema = z
  .object({
    items: z.array(importItemSchema).min(1).max(100),
    reference: z.string().trim().min(2).max(100).optional(),
    reason: z.string().trim().min(5).max(500),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const ids = new Set<string>();
    items.forEach((item, index) => {
      if (ids.has(item.variantId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "variantId"],
          message: "Duplicate variant in import request",
        });
      }
      ids.add(item.variantId);
    });
  });

export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
export type InventoryTransactionQuery = z.infer<typeof inventoryTransactionQuerySchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type InventoryImportInput = z.infer<typeof inventoryImportSchema>;
