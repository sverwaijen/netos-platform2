import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import {
  resourceTypesRouter, resourceRatesRouter, resourceRulesRouter,
  bookingPoliciesRouter, resourceAmenitiesRouter, resourceSchedulesRouter,
  blockedDatesRouter, resourceCategoriesRouter,
} from "./routers/resourceAdmin";
import { productCatalogRouter, kioskOrderRouter, signingRouter } from "./routers/kioskRouter";
import { kioskQrRouter } from "./routers/kioskQrRouter";
import {
  parkingZonesRouter, parkingSpotsRouter, parkingPricingRouter,
  parkingReservationsRouter, parkingSessionsRouter, parkingPermitsRouter,
  parkingPoolsRouter, parkingAccessRouter, parkingVisitorPermitsRouter,
  parkingSlaRouter,
} from "./routers/parkingRouter";
import {
  ticketsRouter, cannedResponsesRouter, slaRouter,
  opsAgendaRouter, presenceRouter,
} from "./routers/opsRouter";
import {
  roomControlZonesRouter, roomControlPointsRouter,
  sensorReadingsRouter, automationRulesRouter, alertThresholdsRouter,
} from "./routers/roomControlRouter";
import {
  crmTriggersRouter, crmVisitorsRouter, memberProfilesRouter, reengagementRouter,
} from "./routers/crmAdvancedRouter";
import {
  signageScreensRouter, signageGroupsRouter, signageContentRouter,
  signagePlaylistsRouter, signageProvisioningRouter, wayfindingRouter,
  kitchenMenuRouter, gymScheduleRouter, signageDisplayRouter,
} from "./routers/signageRouter";
import {
  menuSeasonsRouter, menuCategoriesRouter, menuItemsRouter,
  menuSeasonItemsRouter, menuPreparationsRouter, menuArrangementsRouter,
} from "./routers/menuRouter";
import {
  rozPricingTiersRouter, rozContractsRouter, rozInvoicesRouter,
  rozResourceSettingsRouter,
} from "./routers/rozRouter";
import {
  creditPackagesRouter, budgetControlsRouter,
  commitContractsRouter, creditBonusesRouter, creditAdminRouter,
} from "./routers/creditRouter";
import { walletPaymentRouter } from "./routers/walletPaymentRouter";
import { visitorTrackingRouter } from "./routers/visitorTrackingRouter";
import { accessControlRouter, parkingAccessControlRouter } from "./routers/accessControlRouter";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrator" && ctx.user.role !== "host") {
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
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return db.getBundleBySlug(input.slug);
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getBundleById(input.id);
    }),
    create: adminProcedure.input(z.object({
      name: z.string(),
      slug: z.string(),
      creditsPerMonth: z.number(),
      priceEur: z.string(),
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
      isPopular: z.boolean().optional(),
      targetAudience: z.enum(["freelancer", "individual", "smb", "business", "corporate"]).optional(),
      contractType: z.enum(["monthly", "semi_annual", "annual", "multi_year"]).optional(),
      contractDurationMonths: z.number().optional(),
      rolloverPercent: z.number().optional(),
      pricePerCredit: z.string().optional(),
      walletType: z.enum(["personal", "company", "both"]).optional(),
      budgetControlLevel: z.enum(["none", "basic", "advanced", "enterprise"]).optional(),
      overageRate: z.string().optional(),
      minCommitMonths: z.number().optional(),
      maxRolloverCredits: z.number().optional(),
    })).mutation(async ({ input }) => {
      await db.createBundle(input as any);
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      creditsPerMonth: z.number().optional(),
      priceEur: z.string().optional(),
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
      isPopular: z.boolean().optional(),
      isActive: z.boolean().optional(),
      targetAudience: z.enum(["freelancer", "individual", "smb", "business", "corporate"]).optional(),
      contractType: z.enum(["monthly", "semi_annual", "annual", "multi_year"]).optional(),
      contractDurationMonths: z.number().optional(),
      rolloverPercent: z.number().optional(),
      pricePerCredit: z.string().optional(),
      walletType: z.enum(["personal", "company", "both"]).optional(),
      budgetControlLevel: z.enum(["none", "basic", "advanced", "enterprise"]).optional(),
      overageRate: z.string().optional(),
      maxRolloverCredits: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBundle(id, data as any);
      return { success: true };
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
    detailedBalance: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
      return db.getWalletDetailedBalance(input.walletId);
    }),
    setAutoTopUp: protectedProcedure.input(z.object({
      walletId: z.number(),
      enabled: z.boolean(),
      threshold: z.string().optional(),
      amount: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.setWalletAutoTopUp(input.walletId, input.enabled, input.threshold, input.amount);
      return { success: true };
    }),
    processRollover: adminProcedure.input(z.object({ walletId: z.number() })).mutation(async ({ input }) => {
      const result = await db.processMonthlyRollover(input.walletId);
      return { success: true, ...result };
    }),
    enhancedSummary: protectedProcedure.input(z.object({ walletId: z.number() })).query(async ({ input }) => {
      return db.getEnhancedLedgerSummary(input.walletId);
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

      // Edge case: Validate time is in the future
      if (input.startTime <= Date.now()) throw new Error("Booking time must be in the future");

      // Edge case: Validate duration (30 min to 8 hours)
      const durationMs = input.endTime - input.startTime;
      const durationHours = durationMs / (1000 * 60 * 60);
      if (durationHours < 0.5) throw new Error("Minimum booking duration is 30 minutes");
      if (durationHours > 8) throw new Error("Maximum booking duration is 8 hours");

      // Edge case: Prevent overlapping bookings for same resource
      const conflicts = await db.getResourceAvailability(input.resourceId, input.startTime, input.endTime);
      if (conflicts.length > 0) throw new Error("Resource is not available for the selected time slot");

      // Edge case: Prevent double-booking by same user at same time
      const userBookings = await db.getBookingsByUser(ctx.user.id);
      const doubleBooking = userBookings?.some((b: any) => {
        if (b.status === "cancelled") return false;
        return !(input.endTime <= b.startTime || input.startTime >= b.endTime);
      });
      if (doubleBooking) throw new Error("You already have a booking at this time");

      const hours = durationHours;
      const dayOfWeek = new Date(input.startTime).getDay();
      const multiplier = await db.getMultiplierForDay(input.locationId, dayOfWeek);
      const baseCost = parseFloat(resource.creditCostPerHour) * hours;
      const totalCost = baseCost * multiplier;

      // Deduct from wallet using FIFO credit consumption
      let walletId = input.walletId;
      if (!walletId) {
        const personal = await db.ensurePersonalWallet(ctx.user.id);
        walletId = personal?.id;
      }
      if (walletId) {
        // Check budget controls for company wallets
        const wallet = await db.getWalletById(walletId);
        if (wallet?.type === "company") {
          const allowance = await db.checkBudgetAllowance(walletId, ctx.user.id, totalCost, resource.type, input.locationId);
          if (!allowance.allowed) throw new Error(allowance.reason ?? "Budget control restriction");
        }
        // FIFO deduction: expiring credits first, then permanent
        await db.consumeCredits(
          walletId,
          totalCost,
          `Booking: ${resource.name} (${hours}h × ${multiplier}x)`,
          "booking",
          undefined,
          multiplier,
        );
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
      // If cancelling, validate restrictions and refund credits
      if (input.status === "cancelled") {
        const allBookings = await db.getBookingsByUser(ctx.user.id);
        const booking = allBookings.find(b => b.id === input.id);
        if (!booking) throw new Error("Booking not found");

        // Cancellation time restriction: only allow > 1 hour before start
        const hourBeforeStart = booking.startTime - (60 * 60 * 1000);
        if (Date.now() > hourBeforeStart) throw new Error("Cancellations must be made at least 1 hour before the booking start time");

        if (booking.walletId) {
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
    cancelBooking: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const allBookings = await db.getBookingsByUser(ctx.user.id);
      const booking = allBookings.find(b => b.id === input.id);
      if (!booking) throw new Error("Booking not found");
      if (booking.status === "cancelled") throw new Error("Booking is already cancelled");

      // Cancellation time restriction: only allow > 1 hour before start
      const hourBeforeStart = booking.startTime - (60 * 60 * 1000);
      if (Date.now() > hourBeforeStart) throw new Error("Cancellations must be made at least 1 hour before the booking start time");

      // Refund credits to wallet
      if (booking.walletId) {
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

      await db.updateBookingStatus(input.id, "cancelled");
      return { success: true, refundedCredits: booking.creditsCost };
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
      role: z.enum(["administrator", "host", "teamadmin", "member", "guest"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.createInvite({
        email: input.email,
        phone: input.phone,
        companyId: input.companyId,
        invitedByUserId: ctx.user.id,
        role: input.role ?? "member",
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

  // ─── Role Management ───
  roles: router({
    listUsers: adminProcedure.query(async () => {
      return db.getAllUsersWithRoles();
    }),
    updateRole: adminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["administrator", "host", "teamadmin", "member", "guest"]),
    })).mutation(async ({ ctx, input }) => {
      // Prevent self-demotion for safety
      if (ctx.user.id === input.userId && input.role !== "administrator") {
        throw new Error("Cannot change your own role");
      }
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
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

  // ─── CRM: Leads ───
  crmLeads: router({
    list: protectedProcedure.input(z.object({
      stage: z.string().optional(),
      source: z.string().optional(),
      search: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getCrmLeads(input);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const lead = await db.getCrmLeadById(input.id);
      if (!lead) throw new Error("Lead not found");
      return lead;
    }),
    create: protectedProcedure.input(z.object({
      companyName: z.string().min(1),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      companySize: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      locationPreference: z.string().optional(),
      budgetRange: z.string().optional(),
      source: z.enum(["website", "referral", "event", "cold_outreach", "linkedin", "partner", "inbound", "other"]).optional(),
      estimatedValue: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createCrmLead({ ...input, assignedToUserId: ctx.user.id });
      await db.addCrmLeadActivity({ leadId: id!, userId: ctx.user.id, type: "note", title: "Lead created" });
      return { success: true, id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      companySize: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      locationPreference: z.string().optional(),
      budgetRange: z.string().optional(),
      source: z.enum(["website", "referral", "event", "cold_outreach", "linkedin", "partner", "inbound", "other"]).optional(),
      stage: z.enum(["new", "qualified", "tour_scheduled", "proposal", "negotiation", "won", "lost"]).optional(),
      estimatedValue: z.string().optional(),
      notes: z.string().optional(),
      score: z.number().optional(),
      lostReason: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const oldLead = await db.getCrmLeadById(id);
      await db.updateCrmLead(id, data as any);
      if (data.stage && oldLead && data.stage !== oldLead.stage) {
        await db.addCrmLeadActivity({ leadId: id, userId: ctx.user.id, type: "stage_change", title: `Stage: ${oldLead.stage} → ${data.stage}` });
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCrmLead(input.id);
      return { success: true };
    }),
    pipelineStats: protectedProcedure.query(async () => {
      return db.getCrmPipelineStats();
    }),
    activities: protectedProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
      return db.getCrmLeadActivities(input.leadId);
    }),
    addActivity: protectedProcedure.input(z.object({
      leadId: z.number(),
      type: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.addCrmLeadActivity({ ...input, userId: ctx.user.id } as any);
      return { success: true };
    }),
    aiScore: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const lead = await db.getCrmLeadById(input.id);
      if (!lead) throw new Error("Lead not found");
      // AI scoring based on lead attributes
      let score = 0;
      if (lead.contactEmail) score += 15;
      if (lead.contactPhone) score += 10;
      if (lead.companySize) {
        const size = parseInt(lead.companySize) || 0;
        if (size >= 50) score += 25;
        else if (size >= 20) score += 20;
        else if (size >= 5) score += 15;
        else score += 5;
      }
      if (lead.estimatedValue) {
        const val = parseFloat(lead.estimatedValue);
        if (val >= 50000) score += 25;
        else if (val >= 10000) score += 20;
        else if (val >= 5000) score += 15;
        else score += 5;
      }
      if (lead.website) score += 5;
      if (lead.locationPreference) score += 10;
      if (lead.budgetRange) score += 5;
      score = Math.min(100, score);
      await db.updateCrmLead(input.id, { score });
      await db.addCrmLeadActivity({ leadId: input.id, userId: ctx.user.id, type: "score_change", title: `AI Score updated to ${score}` });
      return { success: true, score };
    }),
  }),

  // ─── CRM: Campaigns ───
  crmCampaigns: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.getCrmCampaigns(input);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const campaign = await db.getCrmCampaignById(input.id);
      if (!campaign) throw new Error("Campaign not found");
      return campaign;
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["email_sequence", "one_off", "drip", "event"]).optional(),
      targetAudience: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createCrmCampaign({ ...input, createdByUserId: ctx.user.id });
      return { success: true, id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
      targetAudience: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCrmCampaign(id, data as any);
      return { success: true };
    }),
    steps: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return db.getCrmCampaignSteps(input.campaignId);
    }),
    addStep: protectedProcedure.input(z.object({
      campaignId: z.number(),
      stepOrder: z.number(),
      delayDays: z.number().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.createCrmCampaignStep(input);
      return { success: true };
    }),
    updateStep: protectedProcedure.input(z.object({
      id: z.number(),
      subject: z.string().optional(),
      body: z.string().optional(),
      delayDays: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCrmCampaignStep(id, data);
      return { success: true };
    }),
    deleteStep: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCrmCampaignStep(input.id);
      return { success: true };
    }),
    enrollments: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return db.getCrmCampaignEnrollments(input.campaignId);
    }),
    enrollLead: protectedProcedure.input(z.object({
      campaignId: z.number(),
      leadId: z.number(),
    })).mutation(async ({ input }) => {
      await db.enrollLeadInCampaign(input.campaignId, input.leadId);
      return { success: true };
    }),
  }),

  // ─── CRM: Email Templates ───
  crmTemplates: router({
    list: protectedProcedure.query(async () => {
      return db.getCrmEmailTemplates();
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      body: z.string().min(1),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createCrmEmailTemplate({ ...input, createdByUserId: ctx.user.id });
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      category: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCrmEmailTemplate(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCrmEmailTemplate(input.id);
      return { success: true };
    }),
    aiGenerate: protectedProcedure.input(z.object({
      leadId: z.number().optional(),
      campaignType: z.string().optional(),
      tone: z.string().optional(),
      context: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Use LLM to generate email content
      const { invokeLLM } = await import("./_core/llm");
      const lead = input.leadId ? await db.getCrmLeadById(input.leadId) : null;
      const prompt = `Generate a professional outreach email for a premium coworking space (Mr. Green Offices). 
${lead ? `Company: ${lead.companyName}, Contact: ${lead.contactName}, Industry: ${lead.industry}, Size: ${lead.companySize}` : ""}
${input.context ? `Context: ${input.context}` : ""}
Tone: ${input.tone || "professional and warm"}
Campaign type: ${input.campaignType || "introduction"}

Return JSON with "subject" and "body" fields. The body should be HTML formatted.`;
      
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional B2B sales copywriter for Mr. Green Offices, a premium coworking brand. Always return valid JSON with subject and body fields." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "email_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject line" },
                body: { type: "string", description: "Email body in HTML" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        },
      });
      
      const content = JSON.parse(String(response.choices[0].message.content) || "{}");
      return { subject: content.subject || "Introduction to Mr. Green Offices", body: content.body || "" };
    }),
  }),

  // ─── CRM: AI Agent ───
  crmAgent: router({
    suggestNextAction: protectedProcedure.input(z.object({ leadId: z.number() })).mutation(async ({ input }) => {
      const lead = await db.getCrmLeadById(input.leadId);
      if (!lead) throw new Error("Lead not found");
      const activities = await db.getCrmLeadActivities(input.leadId, 10);
      
      const { invokeLLM } = await import("./_core/llm");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an AI sales agent for Mr. Green Offices, a premium coworking brand. Suggest the best next action for this lead. Return JSON with action, reason, and priority fields." },
          { role: "user", content: `Lead: ${JSON.stringify(lead)}\nRecent activities: ${JSON.stringify(activities.slice(0, 5))}\n\nWhat should we do next?` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "next_action",
            strict: true,
            schema: {
              type: "object",
              properties: {
                action: { type: "string", description: "Suggested next action" },
                reason: { type: "string", description: "Why this action" },
                priority: { type: "string", description: "high, medium, or low" },
              },
              required: ["action", "reason", "priority"],
              additionalProperties: false,
            },
          },
        },
      });
      
      return JSON.parse(String(response.choices[0].message.content) || "{}");
    }),
    enrichLead: protectedProcedure.input(z.object({ leadId: z.number() })).mutation(async ({ input }) => {
      const lead = await db.getCrmLeadById(input.leadId);
      if (!lead) throw new Error("Lead not found");
      
      const { invokeLLM } = await import("./_core/llm");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a B2B data enrichment agent. Based on the company name and any available info, estimate company details. Return JSON." },
          { role: "user", content: `Enrich this lead: ${JSON.stringify({ companyName: lead.companyName, website: lead.website, industry: lead.industry, contactName: lead.contactName })}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "enrichment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                industry: { type: "string", description: "Industry sector" },
                companySize: { type: "string", description: "Estimated employee count" },
                estimatedValue: { type: "string", description: "Estimated annual deal value in EUR" },
                insights: { type: "string", description: "Key insights about the company" },
              },
              required: ["industry", "companySize", "estimatedValue", "insights"],
              additionalProperties: false,
            },
          },
        },
      });
      
      const enrichment = JSON.parse(String(response.choices[0].message.content) || "{}");
      const updates: any = {};
      if (enrichment.industry && !lead.industry) updates.industry = enrichment.industry;
      if (enrichment.companySize && !lead.companySize) updates.companySize = enrichment.companySize;
      if (enrichment.estimatedValue && !lead.estimatedValue) updates.estimatedValue = enrichment.estimatedValue;
      if (Object.keys(updates).length > 0) {
        await db.updateCrmLead(input.leadId, updates);
      }
      await db.addCrmLeadActivity({ leadId: input.leadId, type: "note", title: "AI Enrichment", description: enrichment.insights });
      return { success: true, enrichment };
    }),
  }),

  // ─── Resource Management (Admin) ───
  resourceTypes: resourceTypesRouter,
  resourceRates: resourceRatesRouter,
  resourceRules: resourceRulesRouter,
  bookingPolicies: bookingPoliciesRouter,
  resourceAmenities: resourceAmenitiesRouter,
  resourceSchedules: resourceSchedulesRouter,
  blockedDates: blockedDatesRouter,
  resourceCategories: resourceCategoriesRouter,
  // ─── Butler Kiosk & Signing ───
  products: productCatalogRouter,
  kioskOrders: kioskOrderRouter,
  kioskQr: kioskQrRouter,
  signing: signingRouter,
  // ─── Smart Parking ───
  parkingZones: parkingZonesRouter,
  parkingSpots: parkingSpotsRouter,
  parkingPricing: parkingPricingRouter,
  parkingReservations: parkingReservationsRouter,
  parkingSessions: parkingSessionsRouter,
  parkingPermits: parkingPermitsRouter,
  parkingPools: parkingPoolsRouter,
  parkingAccess: parkingAccessRouter,
  parkingVisitorPermits: parkingVisitorPermitsRouter,
  parkingSla: parkingSlaRouter,
  // ─── Access Control (Salto KS) ───
  accessControl: accessControlRouter,
  parkingAccessControl: parkingAccessControlRouter,
  // ─── Operations ───
  tickets: ticketsRouter,
  cannedResponses: cannedResponsesRouter,
  sla: slaRouter,
  opsAgenda: opsAgendaRouter,
  presence: presenceRouter,
  // ─── Room Control ───
  roomControlZones: roomControlZonesRouter,
  roomControlPoints: roomControlPointsRouter,
  sensorReadings: sensorReadingsRouter,
  automationRules: automationRulesRouter,
  alertThresholds: alertThresholdsRouter,
  // ─── CRM Advanced ───
  crmTriggers: crmTriggersRouter,
  crmVisitors: crmVisitorsRouter,
  memberProfiles: memberProfilesRouter,
  reengagement: reengagementRouter,
  visitorTracking: visitorTrackingRouter,
  // ─── Signage Module ───
  signageScreens: signageScreensRouter,
  signageGroups: signageGroupsRouter,
  signageContent: signageContentRouter,
  signagePlaylists: signagePlaylistsRouter,
  signageProvisioning: signageProvisioningRouter,
  wayfinding: wayfindingRouter,
  kitchenMenu: kitchenMenuRouter,
  gymSchedule: gymScheduleRouter,
  signageDisplay: signageDisplayRouter,
  // ─── Menukaart Module ───
  menuSeasons: menuSeasonsRouter,
  menuCategories: menuCategoriesRouter,
  menuItems: menuItemsRouter,
  menuSeasonItems: menuSeasonItemsRouter,
  menuPreparations: menuPreparationsRouter,
  menuArrangements: menuArrangementsRouter,
  // ─── ROZ Huurovereenkomsten ───
  rozPricingTiers: rozPricingTiersRouter,
  rozContracts: rozContractsRouter,
  rozInvoices: rozInvoicesRouter,
  rozResourceSettings: rozResourceSettingsRouter,
  // ─── Credit System ───
  creditPackages: creditPackagesRouter,
  budgetControls: budgetControlsRouter,
  commitContracts: commitContractsRouter,
  creditBonuses: creditBonusesRouter,
  creditAdmin: creditAdminRouter,
  // ─── Wallet Payments ───
  walletPayment: walletPaymentRouter,
});

export type AppRouter = typeof appRouter;
