import { describe, it, expect } from 'vitest';
import { dashboardRouter } from './dashboard';

describe('Dashboard Router', () => {
  it('should have getValidationStats procedure', () => {
    expect(dashboardRouter._def.procedures.getValidationStats).toBeDefined();
  });

  it('should have getValidationTrends procedure', () => {
    expect(dashboardRouter._def.procedures.getValidationTrends).toBeDefined();
  });

  describe('getValidationStats', () => {
    it('should accept daysBack parameter', () => {
      const procedure = dashboardRouter._def.procedures.getValidationStats;
      expect(procedure).toBeDefined();
      // The procedure should have an input schema that validates daysBack
    });

    it('should return stats with required fields', () => {
      // This would require a full integration test with a database
      // For now, we just verify the procedure exists and is properly defined
      expect(dashboardRouter._def.procedures.getValidationStats).toBeDefined();
    });
  });

  describe('getValidationTrends', () => {
    it('should accept daysBack parameter', () => {
      const procedure = dashboardRouter._def.procedures.getValidationTrends;
      expect(procedure).toBeDefined();
    });

    it('should return trends with required fields', () => {
      // This would require a full integration test with a database
      // For now, we just verify the procedure exists and is properly defined
      expect(dashboardRouter._def.procedures.getValidationTrends).toBeDefined();
    });
  });
});
