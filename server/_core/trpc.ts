import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { hasPermission, type Permission, type UserRole, migrateRole } from "@shared/roles";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Migrate old role names at runtime
  const role = migrateRole(ctx.user.role) as UserRole;

  return next({
    ctx: {
      ...ctx,
      user: { ...ctx.user, role },
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Legacy admin procedure – allows administrator and host roles
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    const role = migrateRole(ctx.user.role) as UserRole;
    if (role !== 'administrator' && role !== 'host') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: { ...ctx.user, role },
      },
    });
  }),
);

/** Create a procedure that requires a specific permission */
export function requirePermission(permission: Permission) {
  return protectedProcedure.use(
    t.middleware(async ({ ctx, next }) => {
      const role = ctx.user!.role as UserRole;
      if (!hasPermission(role, permission)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient permissions: requires ${permission}`,
        });
      }
      return next({ ctx });
    }),
  );
}
