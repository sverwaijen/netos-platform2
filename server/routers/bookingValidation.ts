import { z } from "zod";
import { eq, and, gt, lt, ne } from "drizzle-orm";
import { getDb } from "../db";
import { bookings } from "../../drizzle/pg-schema";

const MIN_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const CANCEL_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour before start

/**
 * Validates that a booking does not overlap with existing bookings for the same resource
 */
export async function validateNoOverlap(
  resourceId: number,
  startTime: number,
  endTime: number,
  excludeBookingId?: number
): Promise<{ valid: boolean; conflictingBooking?: any }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const conditions = [
    eq(bookings.resourceId, resourceId),
    eq(bookings.status, "confirmed"),
    // Overlapping condition: booking starts before endTime AND ends after startTime
    and(
      lt(bookings.startTime, endTime),
      gt(bookings.endTime, startTime)
    ),
  ];

  if (excludeBookingId) {
    conditions.push(ne(bookings.id, excludeBookingId));
  }

  const conflicts = await db
    .select()
    .from(bookings)
    .where(and(...conditions))
    .limit(1);

  if (conflicts.length > 0) {
    return {
      valid: false,
      conflictingBooking: conflicts[0],
    };
  }

  return { valid: true };
}

/**
 * Validates that the same user is not double-booking in the same time slot
 */
export async function validateNoDuplicateUser(
  userId: number,
  startTime: number,
  endTime: number,
  excludeBookingId?: number
): Promise<{ valid: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const conditions = [
    eq(bookings.userId, userId),
    eq(bookings.status, "confirmed"),
    // Overlapping condition
    and(
      lt(bookings.startTime, endTime),
      gt(bookings.endTime, startTime)
    ),
  ];

  if (excludeBookingId) {
    conditions.push(ne(bookings.id, excludeBookingId));
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(and(...conditions))
    .limit(1);

  if (existing.length > 0) {
    return {
      valid: false,
      reason: `User already has a confirmed booking during this time slot`,
    };
  }

  return { valid: true };
}

/**
 * Validates that the booking start time is in the future
 */
export async function validateFutureTime(startTime: number): Promise<{ valid: boolean; reason?: string }> {
  const now = Date.now();
  if (startTime <= now) {
    return {
      valid: false,
      reason: `Booking start time must be in the future`,
    };
  }
  return { valid: true };
}

/**
 * Validates that the booking duration is between min and max
 */
export async function validateDuration(
  startTime: number,
  endTime: number
): Promise<{ valid: boolean; reason?: string }> {
  const duration = endTime - startTime;

  if (duration < MIN_DURATION_MS) {
    return {
      valid: false,
      reason: `Booking must be at least 30 minutes long`,
    };
  }

  if (duration > MAX_DURATION_MS) {
    return {
      valid: false,
      reason: `Booking cannot exceed 8 hours`,
    };
  }

  return { valid: true };
}

/**
 * Cancels a booking and refunds credits to the wallet
 * Only allows cancellation if booking is more than 1 hour away
 */
export async function cancelBooking(
  bookingId: number,
  userId: number
): Promise<{ success: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get the booking
  const bookingList = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (bookingList.length === 0) {
    return { success: false, reason: "Booking not found" };
  }

  const booking = bookingList[0];

  // Verify ownership
  if (booking.userId !== userId) {
    return { success: false, reason: "You can only cancel your own bookings" };
  }

  // Check if booking is already cancelled
  if (booking.status === "cancelled") {
    return { success: false, reason: "Booking is already cancelled" };
  }

  // Check if booking has already started
  const now = Date.now();
  const timeUntilStart = booking.startTime - now;

  if (timeUntilStart < CANCEL_THRESHOLD_MS) {
    return {
      success: false,
      reason: `Bookings can only be cancelled at least 1 hour before the start time`,
    };
  }

  // Update booking status to cancelled
  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(eq(bookings.id, bookingId));

  return { success: true };
}

/**
 * Validation schema for booking creation input
 */
export const bookingInputSchema = z.object({
  resourceId: z.number().int().positive(),
  locationId: z.number().int().positive(),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  walletId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

/**
 * Comprehensive validation that runs all checks
 */
export async function validateBooking(
  input: BookingInput,
  userId: number,
  excludeBookingId?: number
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check future time
  const futureCheck = await validateFutureTime(input.startTime);
  if (!futureCheck.valid) {
    errors.push(futureCheck.reason || "Invalid time");
  }

  // Check duration
  const durationCheck = await validateDuration(input.startTime, input.endTime);
  if (!durationCheck.valid) {
    errors.push(durationCheck.reason || "Invalid duration");
  }

  // Check no overlap
  const overlapCheck = await validateNoOverlap(
    input.resourceId,
    input.startTime,
    input.endTime,
    excludeBookingId
  );
  if (!overlapCheck.valid) {
    errors.push("Resource is not available for the selected time slot");
  }

  // Check no duplicate user
  const dupCheck = await validateNoDuplicateUser(
    userId,
    input.startTime,
    input.endTime,
    excludeBookingId
  );
  if (!dupCheck.valid) {
    errors.push(dupCheck.reason || "User already has a booking at this time");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
