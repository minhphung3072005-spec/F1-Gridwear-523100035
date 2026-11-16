import type { Request, Response } from "express";
import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { ProductImageCreateInput } from "./product-image.schema.js";
import { createProductImage, deleteProductImage } from "./product-image.service.js";
export async function createProductImageController(request: Request, response: Response) { return sendSuccess(response, { statusCode: 201, message: "Product image created successfully", data: { image: await createProductImage(request.params.productId as string, request.body as ProductImageCreateInput) } }); }
export async function deleteProductImageController(request: Request, response: Response) { await deleteProductImage(request.params.productId as string, request.params.imageId as string); return sendNoContent(response); }
