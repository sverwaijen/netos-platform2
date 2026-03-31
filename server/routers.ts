import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Locations ───
  locations: router({
    list: publicProcedure.query(async () => {
      return db.getAllLocations();
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return db.getLocationBySlug(input.slug);
    }),
  }),

  // ─── Resources ───
  resources: router({
    byLocation: publicProcedure.input(z.object({ locationId: z.number() })).query(async ({ input }) => {
      return db.getResourcesByLocation(input.locationId);
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getResourceById(input.id);
    }),
    stats: publicProcedure.query(async () => {
      return db.getResourceStats();
    }),
  }),

  // ─── Companies ───
  companies: router({
    list: protectedProcedure.query(async () => {
      return db.getAllCompanies();
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getCompanyById(input.id);
    }),
  }),

  // ─── Credit Bundles ───
  bundles: router({
    list: publicProcedure.query(async () => {
      return db.getAllBundles();
    }),
  }),

  // ─── Wallets & Credits ───
  wallets: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getWalletsByUserId(ctx.user.id);
    }),
    companyWallet: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getCompanyWallet(input.companyId);
    }),
    create: protectedProcedure.input(z.object({
      type: z.enum(["company", "personal"]),
      ownerId: z.number(),
      bundleId: z.number().optional(),
      maxRollover: z.number().optional(),
      balance: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.createWallet(input);
      return { success: true };
    }),
    topup: protectedProcedure.input(z.object({
      walletId: z.number(),
      amount: z.number().min(1),
    })).mutation(async ({ input }) => {
      const walletList = await db.getWalletsByUserId(0); // placeholder
      // In production: Stripe charge, then update wallet
      return { success: true, message: "Top-up processed (Stripe integration pending)" };
    }),
    ledger: protectedProcedure.input(z.object({ walletId: z.number(), limit: z.number().optional() })).query(async ({ input }) => {
      return db.getLedgerByWallet(input.walletId, input.limit ?? 50);
    }),
  }),

  // ─── Bookings ───
  bookings: router({
    create: protectedProcedure.input(z.object({
      resourceId: z.number(),
      locationId: z.number(),
      startTime: z.number(),
      endTime: z.number(),
      walletId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resource = await db.getResourceById(input.resourceId);
      if (!resource) throw new Error("Resource not found");

      const hours = (input.endTime - input.startTime) / (1000 * 60 * 60);
      const dayOfWeek = new Date(input.startTime).getDay();
      const multiplier = await db.getMultiplierForDay(input.locationId, dayOfWeek);
      const baseCost = parseFloat(resource.creditCostPerHour) * hours;
      const totalCost = baseCost * multiplier;

      await db.createBooking({
        userId: ctx.user.id,
        resourceId: input.resourceId,
        locationId: input.locationId,
        walletId: input.walletId,
        startTime: input.startTime,
        endTime: input.endTime,
        creditsCost: totalCost.toFixed(2),
        multiplierApplied: multiplier.toFixed(2),
      });

      return { success: true, creditsCost: totalCost, multiplier };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getBookingsByUser(ctx.user.id);
    }),
    byLocation: protectedProcedure.input(z.object({
      locationId: z.number(),
      startAfter: z.number(),
      endBefore: z.number(),
    })).query(async ({ input }) => {
      return db.getBookingsByLocation(input.locationId, input.startAfter, input.endBefore);
    }),
    all: adminProcedure.query(async () => {
      return db.getAllBookings();
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["confirmed", "checked_in", "completed", "cancelled", "no_show"]),
    })).mutation(async ({ input }) => {
      await db.updateBookingStatus(input.id, input.status);
      return { success: true };
    }),
  }),

  // ─── Multipliers ───
  multipliers: router({
    byLocation: publicProcedure.input(z.object({ locationId: z.number() })).query(async ({ input }) => {
      return db.getMultipliersForLocation(input.locationId);
    }),
    forDay: publicProcedure.input(z.object({ locationId: z.number(), dayOfWeek: z.number() })).query(async ({ input }) => {
      const m = await db.getMultiplierForDay(input.locationId, input.dayOfWeek);
      return { multiplier: m };
    }),
  }),

  // ─── Visitors ───
  visitors: router({
    create: protectedProcedure.input(z.object({
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      licensePlate: z.string().optional(),
      visitDate: z.number(),
      locationId: z.number(),
      companyId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const token = nanoid(32);
      await db.createVisitor({
        invitedByUserId: ctx.user.id,
        companyId: input.companyId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        licensePlate: input.licensePlate,
        visitDate: input.visitDate,
        locationId: input.locationId,
        accessToken: token,
      });
      return { success: true, accessToken: token };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getVisitorsByUser(ctx.user.id);
    }),
    byLocation: protectedProcedure.input(z.object({ locationId: z.number() })).query(async ({ input }) => {
      return db.getVisitorsByLocation(input.locationId);
    }),
  }),

  // ─── Devices & IoT ───
  devices: router({
    byLocation: protectedProcedure.input(z.object({ locationId: z.number() })).query(async ({ input }) => {
      return db.getDevicesByLocation(input.locationId);
    }),
    stats: protectedProcedure.query(async () => {
      return db.getDeviceStats();
    }),
  }),

  // ─── Notifications ───
  notifications: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationsForUser(ctx.user.id);
    }),
    all: adminProcedure.query(async () => {
      return db.getNotificationsForUser(null);
    }),
  }),

  // ─── Dashboard (Admin) ───
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
    users: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
