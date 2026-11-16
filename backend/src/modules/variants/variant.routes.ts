import { Router } from "express";

import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createColorController,
  createSizeController,
  createVariantController,
  createVariantsBulkController,
  deactivateColorController,
  deactivateSizeController,
  deactivateVariantController,
  listAdminColorsController,
  listAdminSizesController,
  listProductVariantsController,
  listPublicColorsController,
  listPublicSizesController,
  updateColorController,
  updateSizeController,
  updateVariantController,
} from "./variant.controller.js";
import {
  colorCreateSchema,
  colorParamsSchema,
  colorUpdateSchema,
  productVariantParamsSchema,
  sizeCreateSchema,
  sizeParamsSchema,
  sizeUpdateSchema,
  variantBulkCreateSchema,
  variantCreateSchema,
  variantParamsSchema,
  variantUpdateSchema,
} from "./variant.schema.js";

export const sizeRouter = Router();
export const colorRouter = Router();
export const adminSizeRouter = Router();
export const adminColorRouter = Router();
export const adminProductVariantRouter = Router({ mergeParams: true });
export const adminVariantRouter = Router();

sizeRouter.get("/", asyncHandler(listPublicSizesController));
colorRouter.get("/", asyncHandler(listPublicColorsController));

adminSizeRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminSizeRouter.get("/", asyncHandler(listAdminSizesController));
adminSizeRouter.post("/", validateRequest({ body: sizeCreateSchema }), asyncHandler(createSizeController));
adminSizeRouter.put(
  "/:sizeId",
  validateRequest({ params: sizeParamsSchema, body: sizeUpdateSchema }),
  asyncHandler(updateSizeController),
);
adminSizeRouter.delete(
  "/:sizeId",
  validateRequest({ params: sizeParamsSchema }),
  asyncHandler(deactivateSizeController),
);

adminColorRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminColorRouter.get("/", asyncHandler(listAdminColorsController));
adminColorRouter.post("/", validateRequest({ body: colorCreateSchema }), asyncHandler(createColorController));
adminColorRouter.put(
  "/:colorId",
  validateRequest({ params: colorParamsSchema, body: colorUpdateSchema }),
  asyncHandler(updateColorController),
);
adminColorRouter.delete(
  "/:colorId",
  validateRequest({ params: colorParamsSchema }),
  asyncHandler(deactivateColorController),
);

adminProductVariantRouter.get(
  "/",
  validateRequest({ params: productVariantParamsSchema }),
  asyncHandler(listProductVariantsController),
);
adminProductVariantRouter.post(
  "/bulk",
  validateRequest({ params: productVariantParamsSchema, body: variantBulkCreateSchema }),
  asyncHandler(createVariantsBulkController),
);
adminProductVariantRouter.post(
  "/",
  validateRequest({ params: productVariantParamsSchema, body: variantCreateSchema }),
  asyncHandler(createVariantController),
);

adminVariantRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminVariantRouter.put(
  "/:variantId",
  validateRequest({ params: variantParamsSchema, body: variantUpdateSchema }),
  asyncHandler(updateVariantController),
);
adminVariantRouter.delete(
  "/:variantId",
  validateRequest({ params: variantParamsSchema }),
  asyncHandler(deactivateVariantController),
);
