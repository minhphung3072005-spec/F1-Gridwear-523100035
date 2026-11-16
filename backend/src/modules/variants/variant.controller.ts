import type { Request, Response } from "express";

import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type {
  ColorCreateInput,
  ColorUpdateInput,
  SizeCreateInput,
  SizeUpdateInput,
  VariantBulkCreateInput,
  VariantCreateInput,
  VariantUpdateInput,
} from "./variant.schema.js";
import {
  createColor,
  createSize,
  createVariant,
  createVariantsBulk,
  deactivateColor,
  deactivateSize,
  deactivateVariant,
  listAdminColors,
  listAdminSizes,
  listProductVariants,
  listPublicColors,
  listPublicSizes,
  updateColor,
  updateSize,
  updateVariant,
} from "./variant.service.js";

export async function listPublicSizesController(_request: Request, response: Response) {
  return sendSuccess(response, { data: { items: await listPublicSizes() } });
}

export async function listPublicColorsController(_request: Request, response: Response) {
  return sendSuccess(response, { data: { items: await listPublicColors() } });
}

export async function listAdminSizesController(_request: Request, response: Response) {
  return sendSuccess(response, { data: { items: await listAdminSizes() } });
}

export async function createSizeController(request: Request, response: Response) {
  const size = await createSize(request.body as SizeCreateInput);
  return sendSuccess(response, { statusCode: 201, message: "Size created successfully", data: { size } });
}

export async function updateSizeController(request: Request, response: Response) {
  const size = await updateSize(request.params.sizeId as string, request.body as SizeUpdateInput);
  return sendSuccess(response, { message: "Size updated successfully", data: { size } });
}

export async function deactivateSizeController(request: Request, response: Response) {
  await deactivateSize(request.params.sizeId as string);
  return sendNoContent(response);
}

export async function listAdminColorsController(_request: Request, response: Response) {
  return sendSuccess(response, { data: { items: await listAdminColors() } });
}

export async function createColorController(request: Request, response: Response) {
  const color = await createColor(request.body as ColorCreateInput);
  return sendSuccess(response, { statusCode: 201, message: "Color created successfully", data: { color } });
}

export async function updateColorController(request: Request, response: Response) {
  const color = await updateColor(request.params.colorId as string, request.body as ColorUpdateInput);
  return sendSuccess(response, { message: "Color updated successfully", data: { color } });
}

export async function deactivateColorController(request: Request, response: Response) {
  await deactivateColor(request.params.colorId as string);
  return sendNoContent(response);
}

export async function listProductVariantsController(request: Request, response: Response) {
  const items = await listProductVariants(request.params.productId as string);
  return sendSuccess(response, { message: "Variants fetched successfully", data: { items } });
}

export async function createVariantController(request: Request, response: Response) {
  const variant = await createVariant(
    request.params.productId as string,
    request.body as VariantCreateInput,
  );
  return sendSuccess(response, { statusCode: 201, message: "Variant created successfully", data: { variant } });
}

export async function createVariantsBulkController(request: Request, response: Response) {
  const items = await createVariantsBulk(
    request.params.productId as string,
    request.body as VariantBulkCreateInput,
  );
  return sendSuccess(response, { statusCode: 201, message: "Variants created successfully", data: { items } });
}

export async function updateVariantController(request: Request, response: Response) {
  const variant = await updateVariant(
    request.params.variantId as string,
    request.body as VariantUpdateInput,
  );
  return sendSuccess(response, { message: "Variant updated successfully", data: { variant } });
}

export async function deactivateVariantController(request: Request, response: Response) {
  await deactivateVariant(request.params.variantId as string);
  return sendNoContent(response);
}
