import { z } from "zod";

const id = z.string().trim().min(1).max(32);
const quantity = z.number().int().min(1).max(99);

export const cartItemParamsSchema = z.object({ itemId: id });

export const cartItemCreateSchema = z
  .object({
    variantId: id,
    quantity,
  })
  .strict();

export const cartItemUpdateSchema = z.object({ quantity }).strict();

export const cartMergeSchema = z
  .object({
    items: z.array(z.object({ variantId: id, quantity }).strict()).min(1).max(100),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const variants = new Set<string>();
    items.forEach((item, index) => {
      if (variants.has(item.variantId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "variantId"],
          message: "Duplicate variant in guest cart",
        });
      }
      variants.add(item.variantId);
    });
  });

export type CartItemCreateInput = z.infer<typeof cartItemCreateSchema>;
export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;
export type CartMergeInput = z.infer<typeof cartMergeSchema>;
