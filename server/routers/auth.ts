import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import {
  hashPassword,
  verifyPassword,
  getUserByEmail,
  getUserById,
  createPasswordResetToken,
  getValidPasswordResetToken,
  markPasswordResetTokenAsUsed,
  updateUserPassword,
  getUserPermissions,
  hasPermission,
} from '../db';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  /**
   * Local login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const users = await getUserByEmail(input.email);
      const user = users[0];

      if (!user || !user.passwordHash || !user.localAuthEnabled) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou senha inválidos',
        });
      }

      const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou senha inválidos',
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  /**
   * Request password reset token
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const users = await getUserByEmail(input.email);
      const user = users[0];

      if (!user) {
        // Don't reveal if email exists for security
        return { success: true, message: 'Se o email existir, um link de recuperação será enviado' };
      }

      await createPasswordResetToken(user.id, 24);

      // In production, send email with reset link
      // For now, just return success
      return {
        success: true,
        message: 'Link de recuperação enviado para o email',
      };
    }),

  /**
   * Validate password reset token
   */
  validateResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const resetToken = await getValidPasswordResetToken(input.token);
      return { valid: !!resetToken };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const resetToken = await getValidPasswordResetToken(input.token);

      if (!resetToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Token inválido ou expirado',
        });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await updateUserPassword(resetToken.userId, passwordHash);
      await markPasswordResetTokenAsUsed(resetToken.id);

      return { success: true, message: 'Senha alterada com sucesso' };
    }),

  /**
   * Get current user permissions
   */
  getPermissions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // admin_master has all permissions
    if (ctx.user.role === 'admin_master') {
      return {
        canAccessAP: true,
        canAccessAR: true,
        canAccessMetrics: true,
        canAccessStatistics: true,
        canAccessAdmin: true,
        role: 'admin_master',
      };
    }

    // Regular users have limited access
    return {
      canAccessAP: true,
      canAccessAR: true,
      canAccessMetrics: false,
      canAccessStatistics: false,
      canAccessAdmin: false,
      role: ctx.user.role,
    };
  }),

  /**
   * Check if user has specific permission
   */
  hasPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const result = await hasPermission(ctx.user.id, input.permission);
      return { hasPermission: result };
    }),

  /**
   * Get user info
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const users = await getUserById(ctx.user.id);
    const user = users[0];

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    // Clear session cookie
    const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const };
    ctx.res.clearCookie('session', { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});
