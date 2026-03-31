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

  // ─── User Profile ───
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),
    update: protectedProcedure.input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      avatarUrl: z.string().optional(),
      companyId: z.number().optional(),
      onboardingComplete: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
    search: adminProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      return db.searchUsers(input.query);
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
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getLocationById(input.id);
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
    search: publicProcedure.input(z.object({
      locationId: z.number().optional(),
      type: z.string().optional(),
      zone: z.string().optional(),
      minCapacity: z.number().optional(),
      maxCostPerHour: z.number().optional(),
      query: z.string().optional(),
    })).query(async ({ input }) => {
      return db.searchResources(input);
    }),
    availability: publicProcedure.input(z.object({
      resourceId: z.number(),
      dateStart: z.number(),
      dateEnd: z.number(),
    })).query(async ({ input }) => {
      return db.getResourceAvailability(input.resourceId, input.dateStart, input.dateEnd);
    }),
    typeDistribution: publicProcedure.query(async () => {
      return db.getResourceTypeDistribution();
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
    members: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getCompanyMembers(input.companyId);
    }),
    bookings: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getCompanyBookings(input.companyId);
    }),
    branding: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getBrandingByCompany(input.companyId);
    }),
    updateBranding: protectedProcedure.input(z.object({
      companyId: z.number(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      welcomeMessage: z.string().optional(),
      backgroundImageUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { companyId, ...data } = input;
      await db.upsertBranding(companyId, data);
      return { success: true };
    }),
    employeePhotos: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getEmployeePhotosByCompany(input.companyId);
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
      const personal = await db.ensurePersonalWallet(ctx.user.id);
      const all = await db.getWalletsByUserId(ctx.user.id);
      return all;
    }),
    byId: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
      return db.getWalletById(input.walletId);
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
      const wallet = await db.getWalletById(input.walletId);
      if (!wallet) throw new Error("Wallet not found");
      const newBalance = (parseFloat(wallet.balance) + input.amount).toFixed(2);
      await db.updateWalletBalance(input.walletId, newBalance);
      await db.addLedgerEntry({
        walletId: input.walletId,
        type: "topup",
        amount: input.amount.toFixed(2),
        balanceAfter: newBalance,
        description: `Top-up of ${input.amount} credits`,
      });
      return { success: true, newBalance };
    }),
    ledger: protectedProcedure.input(z.object({ walletId: z.number(), limit: z.number().optional() })).query(async ({ input }) => {
      return db.getLedgerByWallet(input.walletId, input.limit ?? 50);
    }),
    ledgerSummary: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
      return db.getLedgerSummary(input.walletId);
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
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resource = await db.getResourceById(input.resourceId);
      if (!resource) throw new Error("Resource not found");

      // Check availability
      const conflicts = await db.getResourceAvailability(input.resourceId, input.startTime, input.endTime);
      if (conflicts.length > 0) throw new Error("Resource is not available for the selected time slot");

      const hours = (input.endTime - input.startTime) / (1000 * 60 * 60);
      const dayOfWeek = new Date(input.startTime).getDay();
      const multiplier = await db.getMultiplierForDay(input.locationId, dayOfWeek);
      const baseCost = parseFloat(resource.creditCostPerHour) * hours;
      const totalCost = baseCost * multiplier;

      // Deduct from wallet if provided
      let walletId = input.walletId;
      if (!walletId) {
        const personal = await db.ensurePersonalWallet(ctx.user.id);
        walletId = personal?.id;
      }
      if (walletId) {
        const wallet = await db.getWalletById(walletId);
        if (wallet) {
          const currentBalance = parseFloat(wallet.balance);
          if (currentBalance < totalCost) throw new Error(`Insufficient credits. Need ${totalCost.toFixed(1)}, have ${currentBalance.toFixed(1)}`);
          const newBalance = (currentBalance - totalCost).toFixed(2);
          await db.updateWalletBalance(walletId, newBalance);
          await db.addLedgerEntry({
            walletId,
            type: "spend",
            amount: (-totalCost).toFixed(2),
            balanceAfter: newBalance,
            description: `Booking: ${resource.name} (${hours}h × ${multiplier}x)`,
            referenceType: "booking",
            multiplier: multiplier.toFixed(2),
          });
        }
      }

      await db.createBooking({
        userId: ctx.user.id,
        resourceId: input.resourceId,
        locationId: input.locationId,
        walletId,
        startTime: input.startTime,
        endTime: input.endTime,
        creditsCost: totalCost.toFixed(2),
        multiplierApplied: multiplier.toFixed(2),
        notes: input.notes,
      });

      return { success: true, creditsCost: totalCost, multiplier };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getBookingsWithDetails(ctx.user.id);
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
    recent: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
      return db.getRecentBookings(input.limit ?? 10);
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["confirmed", "checked_in", "completed", "cancelled", "no_show"]),
    })).mutation(async ({ ctx, input }) => {
      // If cancelling, refund credits
      if (input.status === "cancelled") {
        const allBookings = await db.getBookingsByUser(ctx.user.id);
        const booking = allBookings.find(b => b.id === input.id);
        if (booking && booking.walletId) {
          const wallet = await db.getWalletById(booking.walletId);
          if (wallet) {
            const refundAmount = parseFloat(booking.creditsCost);
            const newBalance = (parseFloat(wallet.balance) + refundAmount).toFixed(2);
            await db.updateWalletBalance(booking.walletId, newBalance);
            await db.addLedgerEntry({
              walletId: booking.walletId,
              type: "refund",
              amount: refundAmount.toFixed(2),
              balanceAfter: newBalance,
              description: `Refund for cancelled booking #${input.id}`,
              referenceType: "booking",
              referenceId: input.id,
            });
          }
        }
      }
      await db.updateBookingStatus(input.id, input.status);
      return { success: true };
    }),
    byDayOfWeek: protectedProcedure.query(async () => {
      return db.getBookingsByDayOfWeek();
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
      return { success: true, accessToken: token, deepLink: `https://netos.mrgreenoffices.nl/visit/${token}` };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getVisitorsByUser(ctx.user.id);
    }),
    byLocation: protectedProcedure.input(z.object({ locationId: z.number() })).query(async ({ input }) => {
      return db.getVisitorsByLocation(input.locationId);
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["invited", "checked_in", "checked_out", "cancelled"]),
    })).mutation(async ({ input }) => {
      await db.updateVisitorStatus(input.id, input.status);
      return { success: true };
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
    sensors: protectedProcedure.input(z.object({ deviceId: z.number() })).query(async ({ input }) => {
      return db.getSensorsByDevice(input.deviceId);
    }),
    sensorStats: protectedProcedure.query(async () => {
      return db.getSensorStats();
    }),
  }),

  // ─── Access Log ───
  access: router({
    myLog: protectedProcedure.query(async ({ ctx }) => {
      return db.getAccessLogByUser(ctx.user.id);
    }),
    byLocation: adminProcedure.input(z.object({ locationId: z.number() })).query(async ({ input }) => {
      return db.getAccessLogByLocation(input.locationId);
    }),
    logEntry: protectedProcedure.input(z.object({
      locationId: z.number(),
      resourceId: z.number().optional(),
      zone: z.string().optional(),
      action: z.enum(["entry", "exit", "denied", "key_provisioned"]),
      method: z.enum(["ble", "nfc", "qr", "manual"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createAccessLogEntry({ ...input, userId: ctx.user.id });
      return { success: true };
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
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Invites ───
  invites: router({
    create: protectedProcedure.input(z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      companyId: z.number().optional(),
      role: z.enum(["admin", "user", "guest"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.createInvite({
        email: input.email,
        phone: input.phone,
        companyId: input.companyId,
        invitedByUserId: ctx.user.id,
        role: input.role ?? "user",
        token,
        expiresAt,
      });
      return { success: true, token, inviteLink: `https://netos.mrgreenoffices.nl/invite/${token}`, expiresAt };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getInvitesByUser(ctx.user.id);
    }),
    byToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      return db.getInviteByToken(input.token);
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
    recentBookings: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
      return db.getRecentBookings(input.limit ?? 10);
    }),
    bookingsByDay: protectedProcedure.query(async () => {
      return db.getBookingsByDayOfWeek();
    }),
    locationStats: protectedProcedure.query(async () => {
      return db.getLocationBookingStats();
    }),
    resourceDistribution: protectedProcedure.query(async () => {
      return db.getResourceTypeDistribution();
    }),
  }),
});

export type AppRouter = typeof appRouter;
