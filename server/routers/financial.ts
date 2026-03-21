import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getAccountsPayable, getAccountsReceivable, getAPSummary, getARSummary, getFinancialAnalysisByInvoice } from '../db';

export const financialRouter = router({
  /**
   * Get accounts payable records
   */
  getAccountsPayable: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const apData = await getAccountsPayable(input.daysBack);
      
      if (!apData) {
        return {
          records: [],
          daysBack: input.daysBack,
        };
      }

      return {
        records: apData,
        daysBack: input.daysBack,
      };
    }),

  /**
   * Get accounts receivable records
   */
  getAccountsReceivable: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const arData = await getAccountsReceivable(input.daysBack);
      
      if (!arData) {
        return {
          records: [],
          daysBack: input.daysBack,
        };
      }

      return {
        records: arData,
        daysBack: input.daysBack,
      };
    }),

  /**
   * Get AP summary statistics
   */
  getAPSummary: protectedProcedure
    .query(async () => {
      const summary = await getAPSummary();
      
      if (!summary) {
        return {
          totalRecords: 0,
          pendingCount: 0,
          overdueCount: 0,
          paidCount: 0,
          totalPending: 0,
          totalOverdue: 0,
        };
      }

      return {
        totalRecords: summary.totalRecords || 0,
        pendingCount: summary.pendingCount || 0,
        overdueCount: summary.overdueCount || 0,
        paidCount: summary.paidCount || 0,
        totalPending: summary.totalPending || 0,
        totalOverdue: summary.totalOverdue || 0,
      };
    }),

  /**
   * Get AR summary statistics
   */
  getARSummary: protectedProcedure
    .query(async () => {
      const summary = await getARSummary();
      
      if (!summary) {
        return {
          totalRecords: 0,
          pendingCount: 0,
          overdueCount: 0,
          paidCount: 0,
          totalPending: 0,
          totalOverdue: 0,
        };
      }

      return {
        totalRecords: summary.totalRecords || 0,
        pendingCount: summary.pendingCount || 0,
        overdueCount: summary.overdueCount || 0,
        paidCount: summary.paidCount || 0,
        totalPending: summary.totalPending || 0,
        totalOverdue: summary.totalOverdue || 0,
      };
    }),

  /**
   * Get financial analysis for an invoice
   */
  getFinancialAnalysis: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const analysis = await getFinancialAnalysisByInvoice(input.invoiceId);
      
      if (!analysis) {
        return {
          found: false,
          data: null,
        };
      }

      return {
        found: true,
        data: analysis,
      };
    }),
});
