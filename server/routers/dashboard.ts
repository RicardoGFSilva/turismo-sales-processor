import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getValidationStats, getValidationTrends } from '../db';

export const dashboardRouter = router({
  /**
   * Get validation statistics for a given period
   */
  getValidationStats: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const stats = await getValidationStats(input.daysBack);
      
      if (!stats) {
        return {
          totalInvoices: 0,
          invoicesByStatus: [],
          validationLogsByType: [],
          commonErrors: [],
          errorsByField: [],
          daysBack: input.daysBack,
          successRate: 0,
          errorRate: 0,
        };
      }

      // Calculate success and error rates
      const validCount = stats.invoicesByStatus.find(s => s.status === 'valid')?.count || 0;
      const errorCount = stats.invoicesByStatus.find(s => s.status === 'error')?.count || 0;
      const warningCount = stats.invoicesByStatus.find(s => s.status === 'warning')?.count || 0;
      const pendingCount = stats.invoicesByStatus.find(s => s.status === 'pending')?.count || 0;

      const successRate = stats.totalInvoices > 0 
        ? Math.round((validCount / stats.totalInvoices) * 100) 
        : 0;
      
      const errorRate = stats.totalInvoices > 0 
        ? Math.round(((errorCount + warningCount) / stats.totalInvoices) * 100) 
        : 0;

      return {
        ...stats,
        successRate,
        errorRate,
        validCount,
        errorCount,
        warningCount,
        pendingCount,
      };
    }),

  /**
   * Get validation trends over time
   */
  getValidationTrends: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const trends = await getValidationTrends(input.daysBack);
      
      if (!trends) {
        return {
          dailyInvoices: [],
          dailyErrors: [],
          daysBack: input.daysBack,
        };
      }

      return trends;
    }),
});
