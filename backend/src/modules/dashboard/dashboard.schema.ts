import { z } from "zod";

const MAX_RANGE_MS = 2 * 366 * 24 * 60 * 60 * 1000;

export const dashboardRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ["to"],
    message: "to must be greater than or equal to from",
  })
  .refine(({ from, to }) => !from || !to || to.getTime() - from.getTime() <= MAX_RANGE_MS, {
    path: ["to"],
    message: "Dashboard range cannot exceed two years",
  });

export const dashboardTimelineSchema = dashboardRangeSchema.extend({
  groupBy: z.enum(["day", "month"]).default("month"),
});

export const dashboardTopSchema = dashboardRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type DashboardRangeQuery = z.infer<typeof dashboardRangeSchema>;
export type DashboardTimelineQuery = z.infer<typeof dashboardTimelineSchema>;
export type DashboardTopQuery = z.infer<typeof dashboardTopSchema>;
