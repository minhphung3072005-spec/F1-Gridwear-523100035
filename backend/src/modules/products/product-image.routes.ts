import { Router } from "express";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createProductImageController, deleteProductImageController } from "./product-image.controller.js";
import { imageParamsSchema, productImageCreateSchema, productImageParamsSchema } from "./product-image.schema.js";
export const adminProductImageRouter = Router({ mergeParams: true });
adminProductImageRouter.post("/", validateRequest({ params: productImageParamsSchema, body: productImageCreateSchema }), asyncHandler(createProductImageController));
adminProductImageRouter.delete("/:imageId", validateRequest({ params: imageParamsSchema }), asyncHandler(deleteProductImageController));
