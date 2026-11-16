import type { Request, Response } from "express";

import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type {
  AdminProductListQuery,
  ProductCreateInput,
  ProductListQuery,
  ProductStatusInput,
  ProductUpdateInput,
} from "./product.schema.js";
import {
  createProduct,
  deleteProduct,
  getAdminProduct,
  getPublicProduct,
  getRelatedProducts,
  listAdminProducts,
  listFeaturedProducts,
  listPublicProducts,
  updateProduct,
  updateProductStatus,
} from "./product.service.js";

export async function listPublicProductsController(request: Request, response: Response) {
  const result = await listPublicProducts(request.query as unknown as ProductListQuery);
  return sendSuccess(response, { message: "Products fetched successfully", data: result });
}

export async function listFeaturedProductsController(request: Request, response: Response) {
  const result = await listFeaturedProducts(request.query as unknown as ProductListQuery);
  return sendSuccess(response, { message: "Featured products fetched successfully", data: result });
}

export async function getPublicProductController(request: Request, response: Response) {
  const product = await getPublicProduct(request.params.slug as string);
  return sendSuccess(response, { message: "Product fetched successfully", data: { product } });
}

export async function getRelatedProductsController(request: Request, response: Response) {
  const items = await getRelatedProducts(request.params.slug as string);
  return sendSuccess(response, { message: "Related products fetched successfully", data: { items } });
}

export async function listAdminProductsController(request: Request, response: Response) {
  const result = await listAdminProducts(request.query as unknown as AdminProductListQuery);
  return sendSuccess(response, { message: "Products fetched successfully", data: result });
}

export async function getAdminProductController(request: Request, response: Response) {
  const product = await getAdminProduct(request.params.productId as string);
  return sendSuccess(response, { message: "Product fetched successfully", data: { product } });
}

export async function createProductController(request: Request, response: Response) {
  const product = await createProduct(request.body as ProductCreateInput);
  return sendSuccess(response, {
    statusCode: 201,
    message: "Product created successfully",
    data: { product },
  });
}

export async function updateProductController(request: Request, response: Response) {
  const product = await updateProduct(
    request.params.productId as string,
    request.body as ProductUpdateInput,
  );
  return sendSuccess(response, { message: "Product updated successfully", data: { product } });
}

export async function updateProductStatusController(request: Request, response: Response) {
  const product = await updateProductStatus(
    request.params.productId as string,
    request.body as ProductStatusInput,
  );
  return sendSuccess(response, { message: "Product status updated successfully", data: { product } });
}

export async function deleteProductController(request: Request, response: Response) {
  await deleteProduct(request.params.productId as string);
  return sendNoContent(response);
}
