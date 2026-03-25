import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

import { invoiceRouter } from "./routers/invoice";
import { dashboardRouter } from "./routers/dashboard";
import { financialRouter } from "./routers/financial";
import { authRouter } from "./routers/auth";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,

  invoice: invoiceRouter,
  dashboard: dashboardRouter,
  financial: financialRouter,
});

export type AppRouter = typeof appRouter;
