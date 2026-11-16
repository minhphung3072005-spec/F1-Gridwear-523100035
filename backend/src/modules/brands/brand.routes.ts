import { Router } from "express";

import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createBrandController,
  deleteBrandController,
  getPublicBrandController,
  listAdminBrandsController,
  listPublicBrandsController,
  updateBrandController,
} from "./brand.controller.js";
import {
  brandCreateSchema,
  brandListQuerySchema,
  brandParamsSchema,
  brandSlugParamsSchema,
  brandUpdateSchema,
} from "./brand.schema.js";

export const brandRouter = Router();
export const adminBrandRouter = Router();

brandRouter.get("/", asyncHandler(listPublicBrandsController));
brandRouter.get(
  "/:slug",
  validateRequest({ params: brandSlugParamsSchema }),
  asyncHandler(getPublicBrandController),
);

adminBrandRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminBrandRouter.get(
  "/",
  validateRequest({ query: brandListQuerySchema }),
  asyncHandler(listAdminBrandsController),
);
adminBrandRouter.post(
  "/",
  validateRequest({ body: brandCreateSchema }),
  asyncHandler(createBrandController),
);
adminBrandRouter.put(
  "/:brandId",
  validateRequest({ params: brandParamsSchema, body: brandUpdateSchema }),
  asyncHandler(updateBrandController),
);
adminBrandRouter.delete(
  "/:brandId",
  validateRequest({ params: brandParamsSchema }),
  asyncHandler(deleteBrandController),
);
