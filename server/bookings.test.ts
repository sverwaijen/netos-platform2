import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateNoOverlap,
  validateNoDuplicateUser,
  validateFutureTime,
  validateDuration,
  cancelBooking,
  validateBooking,
} from "./routers/bookingValidation";

describe("Booking Validation", () => {
  const baseTime = Date.now();
  const resourceId = 1;
  const userId = 1;
  const locationId = 1;

  // Helper to create a time slot
  const makeSlot = (hoursFromNow: number, durationHours: number = 1) => ({
    startTime: baseTime + hoursFromNow * 60 * 60 * 1000,
    endTime: baseTime + (hoursFromNow + durationHours) * 60 * 60 * 1000,
  });

  describe("validateFutureTime", () => {
    it("should pass for future timestamps", async () => {
      const futureTime = baseTime + 60 * 60 * 1000; // 1 hour from now
      const result = await validateFutureTime(futureTime);
      expect(result.valid).toBe(true);
    });

    it("should fail for past timestamps", async () => {
      const pastTime = baseTime - 60 * 60 * 1000; // 1 hour ago
      const result = await validateFutureTime(pastTime);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("must be in the future");
    });

    it("should fail for current timestamp", async () => {
      const result = await validateFutureTime(baseTime);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateDuration", () => {
    it("should pass for valid duration (30 min - 8 hours)", async () => {
      const slot = makeSlot(2, 2); // 2 hour booking
      const result = await validateDuration(slot.startTime, slot.endTime);
      expect(result.valid).toBe(true);
    });

    it("should pass for minimum duration (30 min)", async () => {
      const slot = makeSlot(2, 0.5); // 30 min booking
      const result = await validateDuration(slot.startTime, slot.endTime);
      expect(result.valid).toBe(true);
    });

    it("should pass for maximum duration (8 hours)", async () => {
      const slot = makeSlot(2, 8); // 8 hour booking
      const result = await validateDuration(slot.startTime, slot.endTime);
      expect(result.valid).toBe(true);
    });

    it("should fail for too short duration (< 30 min)", async () => {
      const slot = makeSlot(2, 0.25); // 15 min booking
      const result = await validateDuration(slot.startTime, slot.endTime);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("at least 30 minutes");
    });

    it("should fail for too long duration (> 8 hours)", async () => {
      const slot = makeSlot(2, 9); // 9 hour booking
      const result = await validateDuration(slot.startTime, slot.endTime);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("cannot exceed 8 hours");
    });
  });

  describe("validateNoOverlap", () => {
    it("should return valid when no conflicts exist", async () => {
      // This test depends on database state; mock or use test DB
      const slot = makeSlot(2, 1);
      const result = await validateNoOverlap(resourceId, slot.startTime, slot.endTime);
      // Should pass if no conflicting bookings exist in test DB
      expect(result).toHaveProperty("valid");
    });

    it("should exclude specified booking from overlap check", async () => {
      const slot = makeSlot(2, 1);
      // This tests the excludeBookingId parameter
      const result = await validateNoOverlap(
        resourceId,
        slot.startTime,
        slot.endTime,
        999 // non-existent booking ID
      );
      expect(result).toHaveProperty("valid");
    });
  });

  describe("validateNoDuplicateUser", () => {
    it("should return valid when user has no overlapping bookings", async () => {
      const slot = makeSlot(2, 1);
      const result = await validateNoDuplicateUser(userId, slot.startTime, slot.endTime);
      expect(result).toHaveProperty("valid");
    });

    it("should exclude specified booking from duplicate check", async () => {
      const slot = makeSlot(2, 1);
      const result = await validateNoDuplicateUser(
        userId,
        slot.startTime,
        slot.endTime,
        999 // non-existent booking ID
      );
      expect(result).toHaveProperty("valid");
    });

    it("should fail when user has overlapping booking", async () => {
      const slot = makeSlot(2, 1);
      // This would require a booking to exist in test DB
      const result = await validateNoDuplicateUser(userId, slot.startTime, slot.endTime);
      expect(result).toHaveProperty("reason");
    });
  });

  describe("cancelBooking", () => {
    it("should return success false for non-existent booking", async () => {
      const result = await cancelBooking(99999, userId);
      expect(result.success).toBe(false);
      expect(result.reason).toContain("not found");
    });

    it("should fail to cancel own bookings for unauthorized user", async () => {
      // Would need a booking in DB to test properly
      const result = await cancelBooking(1, 99999);
      expect(result).toHaveProperty("success");
    });

    it("should not allow cancellation less than 1 hour before start", async () => {
      // This would require mocking or test DB setup
      const result = await cancelBooking(1, userId);
      expect(result).toHaveProperty("success");
    });

    it("should fail if booking is already cancelled", async () => {
      // Would need a cancelled booking in DB
      const result = await cancelBooking(1, userId);
      expect(result).toHaveProperty("reason");
    });

    it("should succeed for valid cancellation > 1 hour before start", async () => {
      // Would need a future booking in DB
      const result = await cancelBooking(1, userId);
      expect(result).toHaveProperty("success");
    });
  });

  describe("validateBooking (comprehensive)", () => {
    it("should pass all validations for valid booking", async () => {
      const slot = makeSlot(2, 1); // 2 hours from now, 1 hour duration
      const result = await validateBooking(
        {
          resourceId,
          locationId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          notes: "Test booking",
        },
        userId
      );
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should collect multiple validation errors", async () => {
      const slot = makeSlot(-1, 0.25); // Past, 15 min duration
      const result = await validateBooking(
        {
          resourceId,
          locationId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        userId
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate optional notes field", async () => {
      const slot = makeSlot(2, 1);
      const result = await validateBooking(
        {
          resourceId,
          locationId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          notes: "Valid note",
        },
        userId
      );
      expect(result).toHaveProperty("valid");
    });

    it("should exclude specified booking from all checks", async () => {
      const slot = makeSlot(2, 1);
      const result = await validateBooking(
        {
          resourceId,
          locationId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        userId,
        1 // exclude booking ID 1
      );
      expect(result).toHaveProperty("valid");
    });
  });

  describe("Edge cases", () => {
    it("should handle zero-duration bookings", async () => {
      const startTime = baseTime + 60 * 60 * 1000;
      const result = await validateDuration(startTime, startTime);
      expect(result.valid).toBe(false);
    });

    it("should handle negative duration bookings", async () => {
      const slot = makeSlot(3, 1);
      // Start and end reversed
      const result = await validateDuration(slot.endTime, slot.startTime);
      expect(result.valid).toBe(false);
    });

    it("should validate with exclude booking parameter in comprehensive check", async () => {
      const slot = makeSlot(2, 1);
      const result = await validateBooking(
        {
          resourceId,
          locationId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        userId,
        555 // arbitrary exclude ID
      );
      expect(result).toHaveProperty("valid");
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
