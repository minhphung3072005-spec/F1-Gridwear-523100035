import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { addressRouter } from "../modules/addresses/address.routes.js";
import { adminBrandRouter, brandRouter } from "../modules/brands/brand.routes.js";
import { cartRouter } from "../modules/cart/cart.routes.js";
import { couponRouter } from "../modules/coupons/coupon.routes.js";
import { adminDashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { adminCustomerRouter } from "../modules/customers/customer.routes.js";
import { adminReviewRouter, reviewRouter } from "../modules/reviews/review.routes.js";
import { adminCouponRouter } from "../modules/coupons/admin-coupon.routes.js";
import {
  adminCategoryRouter,
  categoryRouter,
} from "../modules/categories/category.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { adminInventoryRouter } from "../modules/inventory/inventory.routes.js";
import { adminOrderRouter, orderRouter } from "../modules/orders/order.routes.js";
import { adminProductRouter, productRouter } from "../modules/products/product.routes.js";
import {
  adminColorRouter,
  adminSizeRouter,
  adminVariantRouter,
  colorRouter,
  sizeRouter,
} from "../modules/variants/variant.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/brands", brandRouter);
apiRouter.use("/sizes", sizeRouter);
apiRouter.use("/colors", colorRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/addresses", addressRouter);
apiRouter.use("/coupons", couponRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/admin/products", adminProductRouter);
apiRouter.use("/admin/categories", adminCategoryRouter);
apiRouter.use("/admin/brands", adminBrandRouter);
apiRouter.use("/admin/sizes", adminSizeRouter);
apiRouter.use("/admin/colors", adminColorRouter);
apiRouter.use("/admin/variants", adminVariantRouter);
apiRouter.use("/admin/inventory", adminInventoryRouter);
apiRouter.use("/admin/orders", adminOrderRouter);
apiRouter.use("/admin/dashboard", adminDashboardRouter);
apiRouter.use("/admin/customers", adminCustomerRouter);
apiRouter.use("/admin/reviews", adminReviewRouter);
apiRouter.use("/admin/coupons", adminCouponRouter);
