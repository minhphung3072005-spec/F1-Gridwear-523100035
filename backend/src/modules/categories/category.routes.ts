import { Router } from "express";

import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createCategoryController,
  deleteCategoryController,
  getPublicCategoryController,
  listAdminCategoriesController,
  listPublicCategoriesController,
  updateCategoryController,
} from "./category.controller.js";
import {
  categoryCreateSchema,
  categoryListQuerySchema,
  categoryParamsSchema,
  categorySlugParamsSchema,
  categoryUpdateSchema,
} from "./category.schema.js";

export const categoryRouter = Router();
export const adminCategoryRouter = Router();

categoryRouter.get("/", asyncHandler(listPublicCategoriesController));
categoryRouter.get(
  "/:slug",
  validateRequest({ params: categorySlugParamsSchema }),
  asyncHandler(getPublicCategoryController),
);

adminCategoryRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminCategoryRouter.get(
  "/",
  validateRequest({ query: categoryListQuerySchema }),
  asyncHandler(listAdminCategoriesController),
);
adminCategoryRouter.post(
  "/",
  validateRequest({ body: categoryCreateSchema }),
  asyncHandler(createCategoryController),
);
adminCategoryRouter.put(
  "/:categoryId",
  validateRequest({ params: categoryParamsSchema, body: categoryUpdateSchema }),
  asyncHandler(updateCategoryController),
);
adminCategoryRouter.delete(
  "/:categoryId",
  validateRequest({ params: categoryParamsSchema }),
  asyncHandler(deleteCategoryController),
);
