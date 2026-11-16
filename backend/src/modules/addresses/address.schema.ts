import { z } from "zod";

const id = z.string().trim().min(1).max(32);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const addressParamsSchema = z.object({ addressId: id });

export const addressCreateSchema = z
  .object({
    recipientName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(20),
    line1: z.string().trim().min(3).max(255),
    line2: optionalText(255),
    ward: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    province: z.string().trim().min(1).max(100),
    postalCode: optionalText(20),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export const addressUpdateSchema = addressCreateSchema
  .omit({ isDefault: true })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, { message: "At least one field is required" });

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
