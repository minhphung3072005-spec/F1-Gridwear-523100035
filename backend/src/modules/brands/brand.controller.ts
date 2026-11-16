import type { Request, Response } from "express";

import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { BrandCreateInput, BrandListQuery, BrandUpdateInput } from "./brand.schema.js";
import {
  createBrand,
  deleteBrand,
  getPublicBrand,
  listAdminBrands,
  listPublicBrands,
  updateBrand,
} from "./brand.service.js";

export async function listPublicBrandsController(_request: Request, response: Response) {
  const items = await listPublicBrands();
  return sendSuccess(response, { message: "Brands fetched successfully", data: { items } });
}

export async function getPublicBrandController(request: Request, response: Response) {
  const brand = await getPublicBrand(request.params.slug as string);
  return sendSuccess(response, { message: "Brand fetched successfully", data: { brand } });
}

export async function listAdminBrandsController(request: Request, response: Response) {
  const result = await listAdminBrands(request.query as unknown as BrandListQuery);
  return sendSuccess(response, { message: "Brands fetched successfully", data: result });
}

export async function createBrandController(request: Request, response: Response) {
  const brand = await createBrand(request.body as BrandCreateInput);
  return sendSuccess(response, {
    statusCode: 201,
    message: "Brand created successfully",
    data: { brand },
  });
}

export async function updateBrandController(request: Request, response: Response) {
  const brand = await updateBrand(
    request.params.brandId as string,
    request.body as BrandUpdateInput,
  );
  return sendSuccess(response, { message: "Brand updated successfully", data: { brand } });
}

export async function deleteBrandController(request: Request, response: Response) {
  await deleteBrand(request.params.brandId as string);
  return sendNoContent(response);
}
