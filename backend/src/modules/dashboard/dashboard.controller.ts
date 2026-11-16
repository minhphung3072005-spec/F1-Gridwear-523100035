import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import type { DashboardRangeQuery, DashboardTimelineQuery, DashboardTopQuery } from "./dashboard.schema.js";
import { getDashboardOrderDistribution, getDashboardRevenue, getDashboardSummary, getDashboardTopCategories, getDashboardTopProducts } from "./dashboard.service.js";

export async function dashboardSummaryController(request: Request, response: Response) {
  const summary = await getDashboardSummary(request.query as unknown as DashboardRangeQuery);
  return sendSuccess(response, { message: "Dashboard summary fetched successfully", data: { summary } });
}

export async function dashboardRevenueController(request: Request, response: Response) {
  const timeline = await getDashboardRevenue(request.query as unknown as DashboardTimelineQuery);
  return sendSuccess(response, { message: "Dashboard timeline fetched successfully", data: { timeline } });
}

export async function dashboardOrdersController(request: Request, response: Response) {
  const distribution = await getDashboardOrderDistribution(request.query as unknown as DashboardRangeQuery);
  return sendSuccess(response, { message: "Order distribution fetched successfully", data: { distribution } });
}

export async function dashboardTopProductsController(request: Request, response: Response) {
  const result = await getDashboardTopProducts(request.query as unknown as DashboardTopQuery);
  return sendSuccess(response, { message: "Top products fetched successfully", data: result });
}

export async function dashboardTopCategoriesController(request: Request, response: Response) {
  const result = await getDashboardTopCategories(request.query as unknown as DashboardTopQuery);
  return sendSuccess(response, { message: "Top categories fetched successfully", data: result });
}
