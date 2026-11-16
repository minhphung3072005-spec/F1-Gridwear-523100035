import { Router } from "express";

import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { adminProductVariantRouter } from "../variants/variant.routes.js";
import { adminProductImageRouter } from "./product-image.routes.js";
import {
  createProductController,
  deleteProductController,
  getAdminProductController,
  getPublicProductController,
  getRelatedProductsController,
  listAdminProductsController,
  listFeaturedProductsController,
  listPublicProductsController,
  updateProductController,
  updateProductStatusController,
} from "./product.controller.js";
import {
  adminProductListQuerySchema,
  productCreateSchema,
  productListQuerySchema,
  productParamsSchema,
  productSlugParamsSchema,
  productStatusSchema,
  productUpdateSchema,
} from "./product.schema.js";

export const productRouter = Router();
export const adminProductRouter = Router();

productRouter.get(
  "/",
  validateRequest({ query: productListQuerySchema }),
  asyncHandler(listPublicProductsController),
);
productRouter.get(
  "/featured",
  validateRequest({ query: productListQuerySchema }),
  asyncHandler(listFeaturedProductsController),
);
productRouter.get(
  "/:slug/related",
  validateRequest({ params: productSlugParamsSchema }),
  asyncHandler(getRelatedProductsController),
);
productRouter.get(
  "/:slug",
  validateRequest({ params: productSlugParamsSchema }),
  asyncHandler(getPublicProductController),
);

adminProductRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminProductRouter.use("/:productId/variants", adminProductVariantRouter);
adminProductRouter.use("/:productId/images", adminProductImageRouter);
adminProductRouter.get(
  "/",
  validateRequest({ query: adminProductListQuerySchema }),
  asyncHandler(listAdminProductsController),
);
adminProductRouter.get(
  "/:productId",
  validateRequest({ params: productParamsSchema }),
  asyncHandler(getAdminProductController),
);
adminProductRouter.post(
  "/",
  validateRequest({ body: productCreateSchema }),
  asyncHandler(createProductController),
);
adminProductRouter.put(
  "/:productId",
  validateRequest({ params: productParamsSchema, body: productUpdateSchema }),
  asyncHandler(updateProductController),
);
adminProductRouter.patch(
  "/:productId/status",
  validateRequest({ params: productParamsSchema, body: productStatusSchema }),
  asyncHandler(updateProductStatusController),
);
adminProductRouter.delete(
  "/:productId",
  validateRequest({ params: productParamsSchema }),
  asyncHandler(deleteProductController),
);
