import { Router } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { dashboardOrdersController, dashboardRevenueController, dashboardSummaryController, dashboardTopCategoriesController, dashboardTopProductsController } from "./dashboard.controller.js";
import { dashboardRangeSchema, dashboardTimelineSchema, dashboardTopSchema } from "./dashboard.schema.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminDashboardRouter.get("/summary", validateRequest({ query: dashboardRangeSchema }), asyncHandler(dashboardSummaryController));
adminDashboardRouter.get("/revenue", validateRequest({ query: dashboardTimelineSchema }), asyncHandler(dashboardRevenueController));
adminDashboardRouter.get("/orders", validateRequest({ query: dashboardRangeSchema }), asyncHandler(dashboardOrdersController));
adminDashboardRouter.get("/top-products", validateRequest({ query: dashboardTopSchema }), asyncHandler(dashboardTopProductsController));
adminDashboardRouter.get("/top-categories", validateRequest({ query: dashboardTopSchema }), asyncHandler(dashboardTopCategoriesController));
