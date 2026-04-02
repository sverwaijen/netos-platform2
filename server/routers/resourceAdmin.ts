import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return next({ ctx });
});

export const resourceTypesRouter = router({
  list: protectedProcedure.query(async () => db.getResourceTypes()),
  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getResourceTypeById(input.id)),
  create: adminProcedure.input(z.object({
    name: z.string(), slug: z.string(), description: z.string().optional(),
    icon: z.string().optional(), defaultCapacity: z.number().optional(),
    chargingUnit: z.enum(["per_hour", "per_day", "per_use", "per_week", "per_month"]).optional(),
    timeSlotMinutes: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createResourceType(input);
    return { id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(), name: z.string().optional(), description: z.string().optional(),
    icon: z.string().optional(), defaultCapacity: z.number().optional(),
    chargingUnit: z.enum(["per_hour", "per_day", "per_use", "per_week", "per_month"]).optional(),
    timeSlotMinutes: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateResourceType(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteResourceType(input.id);
    return { success: true };
  }),
});

export const resourceRatesRouter = router({
  list: protectedProcedure.input(z.object({ resourceTypeId: z.number().optional() }).optional()).query(async ({ input }) => db.getResourceRates(input?.resourceTypeId)),
  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getResourceRateById(input.id)),
  create: adminProcedure.input(z.object({
    name: z.string(), resourceTypeId: z.number(), creditCost: z.string(),
    chargingUnit: z.enum(["per_hour", "per_day", "per_use", "per_week", "per_month"]).optional(),
    maxPriceCap: z.string().optional(), initialFixedCost: z.string().optional(),
    initialFixedMinutes: z.number().optional(), perAttendeePricing: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    appliesToCustomerType: z.enum(["all", "members_only", "guests_only", "specific_plans", "specific_tiers"]).optional(),
    appliesToTiers: z.array(z.string()).optional(),
    validDaysOfWeek: z.array(z.number()).optional(),
    validTimeStart: z.string().optional(), validTimeEnd: z.string().optional(),
    maxBookingLengthMinutes: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createResourceRate(input as any);
    return { id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(), name: z.string().optional(), creditCost: z.string().optional(),
    chargingUnit: z.enum(["per_hour", "per_day", "per_use", "per_week", "per_month"]).optional(),
    maxPriceCap: z.string().optional(), initialFixedCost: z.string().optional(),
    initialFixedMinutes: z.number().optional(), perAttendeePricing: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    appliesToCustomerType: z.enum(["all", "members_only", "guests_only", "specific_plans", "specific_tiers"]).optional(),
    validDaysOfWeek: z.array(z.number()).optional(),
    validTimeStart: z.string().optional(), validTimeEnd: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateResourceRate(id, data as any);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteResourceRate(input.id);
    return { success: true };
  }),
});

export const resourceRulesRouter = router({
  list: protectedProcedure.input(z.object({ scope: z.string().optional() }).optional()).query(async ({ input }) => db.getResourceRules(input?.scope)),
  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getResourceRuleById(input.id)),
  create: adminProcedure.input(z.object({
    name: z.string(), description: z.string().optional(),
    scope: z.enum(["global", "individual"]).optional(),
    resourceId: z.number().optional(), resourceTypeId: z.number().optional(),
    conditionType: z.enum(["customer_type", "plan_type", "tier_type", "time_of_day", "day_of_week", "advance_booking", "booking_length", "zone_access"]),
    conditionValue: z.record(z.string(), z.unknown()).optional(),
    limitType: z.enum(["block_booking", "restrict_hours", "max_duration", "min_duration", "max_advance_days", "min_advance_hours", "max_bookings_per_day", "max_bookings_per_week", "require_approval"]),
    limitValue: z.record(z.string(), z.unknown()).optional(),
    evaluationOrder: z.number().optional(),
    stopEvaluation: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createResourceRule(input as any);
    return { id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(), name: z.string().optional(), description: z.string().optional(),
    conditionValue: z.record(z.string(), z.unknown()).optional(),
    limitValue: z.record(z.string(), z.unknown()).optional(),
    evaluationOrder: z.number().optional(),
    stopEvaluation: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateResourceRule(id, data as any);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteResourceRule(input.id);
    return { success: true };
  }),
});

export const bookingPoliciesRouter = router({
  list: protectedProcedure.query(async () => db.getBookingPolicies()),
  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getBookingPolicyById(input.id)),
  create: adminProcedure.input(z.object({
    name: z.string(), locationId: z.number().optional(), resourceTypeId: z.number().optional(),
    bufferMinutes: z.number().optional(), minAdvanceMinutes: z.number().optional(),
    maxAdvanceDays: z.number().optional(), minDurationMinutes: z.number().optional(),
    maxDurationMinutes: z.number().optional(), freeCancelMinutes: z.number().optional(),
    lateCancelFeePercent: z.number().optional(), noShowFeePercent: z.number().optional(),
    autoCheckInMinutes: z.number().optional(), autoCancelNoCheckIn: z.boolean().optional(),
    allowRecurring: z.boolean().optional(), requireApproval: z.boolean().optional(),
    allowGuestBooking: z.boolean().optional(), maxAttendeesOverride: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createBookingPolicy(input as any);
    return { id };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(), name: z.string().optional(),
    bufferMinutes: z.number().optional(), minAdvanceMinutes: z.number().optional(),
    maxAdvanceDays: z.number().optional(), minDurationMinutes: z.number().optional(),
    maxDurationMinutes: z.number().optional(), freeCancelMinutes: z.number().optional(),
    lateCancelFeePercent: z.number().optional(), noShowFeePercent: z.number().optional(),
    autoCheckInMinutes: z.number().optional(), autoCancelNoCheckIn: z.boolean().optional(),
    allowRecurring: z.boolean().optional(), requireApproval: z.boolean().optional(),
    allowGuestBooking: z.boolean().optional(), maxAttendeesOverride: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateBookingPolicy(id, data as any);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBookingPolicy(input.id);
    return { success: true };
  }),
});

export const resourceAmenitiesRouter = router({
  list: protectedProcedure.query(async () => db.getResourceAmenities()),
  forResource: protectedProcedure.input(z.object({ resourceId: z.number() })).query(async ({ input }) => db.getAmenitiesForResource(input.resourceId)),
  setForResource: adminProcedure.input(z.object({
    resourceId: z.number(), amenityIds: z.array(z.number()),
  })).mutation(async ({ input }) => {
    await db.setResourceAmenities(input.resourceId, input.amenityIds);
    return { success: true };
  }),
});

export const resourceSchedulesRouter = router({
  list: protectedProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => db.getResourceSchedules(input?.locationId)),
  update: adminProcedure.input(z.object({
    id: z.number(), openTime: z.string().optional(), closeTime: z.string().optional(), isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateResourceSchedule(id, data);
    return { success: true };
  }),
  create: adminProcedure.input(z.object({
    resourceId: z.number().optional(), resourceTypeId: z.number().optional(),
    locationId: z.number().optional(), dayOfWeek: z.number(), openTime: z.string(), closeTime: z.string(),
  })).mutation(async ({ input }) => {
    await db.createResourceSchedule(input);
    return { success: true };
  }),
});

export const blockedDatesRouter = router({
  list: protectedProcedure.input(z.object({ locationId: z.number().optional() }).optional()).query(async ({ input }) => db.getBlockedDates(input?.locationId)),
  create: adminProcedure.input(z.object({
    resourceId: z.number().optional(), locationId: z.number().optional(),
    startDate: z.number(), endDate: z.number(), reason: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.createBlockedDate(input);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBlockedDate(input.id);
    return { success: true };
  }),
});

export const resourceCategoriesRouter = router({
  list: protectedProcedure.query(async () => db.getResourceCategories()),
});
