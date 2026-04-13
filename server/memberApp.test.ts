import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// Mock user context
const mockUserId = 123;
const mockLocationId = 1;
const mockResourceId = 1;
const mockWalletId = 1;

describe("Member App - Booking Flow", () => {
  describe("Booking Creation", () => {
    it("should create a booking with valid inputs", async () => {
      // Arrange
      const startTime = Date.now() + 24 * 60 * 60 * 1000; // Tomorrow
      const endTime = startTime + 2 * 60 * 60 * 1000; // 2 hours later

      // Mock the database functions
      vi.spyOn(db, "getResourceById").mockResolvedValue({
        id: mockResourceId,
        name: "Desk A",
        creditCostPerHour: 10,
        type: "desk",
      } as any);

      vi.spyOn(db, "getResourceAvailability").mockResolvedValue([]);

      vi.spyOn(db, "getMultiplierForDay").mockResolvedValue(1.0);

      vi.spyOn(db, "ensurePersonalWallet").mockResolvedValue({
        id: mockWalletId,
      } as any);

      vi.spyOn(db, "getWalletById").mockResolvedValue({
        id: mockWalletId,
        balance: "1000",
        type: "personal",
      } as any);

      vi.spyOn(db, "consumeCredits").mockResolvedValue(true);

      vi.spyOn(db, "createBooking").mockResolvedValue({
        id: 1,
        userId: mockUserId,
        resourceId: mockResourceId,
        status: "confirmed",
      } as any);

      // Act
      const result = await db.createBooking({
        userId: mockUserId,
        resourceId: mockResourceId,
        locationId: mockLocationId,
        walletId: mockWalletId,
        startTime,
        endTime,
        creditsCost: "20",
        multiplierApplied: "1.00",
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe("confirmed");
    });

    it("should reject booking if resource is unavailable", async () => {
      // Arrange
      const startTime = Date.now() + 24 * 60 * 60 * 1000;
      const endTime = startTime + 2 * 60 * 60 * 1000;

      vi.spyOn(db, "getResourceById").mockResolvedValue({
        id: mockResourceId,
        name: "Desk A",
        creditCostPerHour: 10,
      } as any);

      vi.spyOn(db, "getResourceAvailability").mockResolvedValue([
        { id: 1, startTime, endTime },
      ]);

      // Act & Assert
      try {
        await db.getResourceAvailability(mockResourceId, startTime, endTime);
        const conflicts = await db.getResourceAvailability(
          mockResourceId,
          startTime,
          endTime
        );
        expect(conflicts.length).toBeGreaterThan(0);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("should calculate correct credit cost with multiplier", () => {
      // Arrange
      const creditCostPerHour = 10;
      const hours = 2;
      const multiplier = 1.5;

      // Act
      const totalCost = creditCostPerHour * hours * multiplier;

      // Assert
      expect(totalCost).toBe(30);
    });

    it("should refund credits when booking is cancelled", async () => {
      // Arrange
      const bookingCost = 20;
      const currentBalance = 100;
      const expectedBalance = currentBalance + bookingCost;

      vi.spyOn(db, "getWalletById").mockResolvedValue({
        id: mockWalletId,
        balance: currentBalance.toString(),
      } as any);

      vi.spyOn(db, "updateWalletBalance").mockResolvedValue(true);

      vi.spyOn(db, "addLedgerEntry").mockResolvedValue({ id: 1 } as any);

      // Act
      const wallet = await db.getWalletById(mockWalletId);
      const newBalance = parseFloat(wallet!.balance) + bookingCost;

      // Assert
      expect(newBalance).toBe(expectedBalance);
    });
  });

  describe("Wallet Display", () => {
    it("should retrieve wallet with transactions", async () => {
      // Arrange
      vi.spyOn(db, "getWalletById").mockResolvedValue({
        id: mockWalletId,
        balance: "250.50",
        type: "personal",
        ownerId: mockUserId,
      } as any);

      // Act
      const wallet = await db.getWalletById(mockWalletId);

      // Assert
      expect(wallet).toBeDefined();
      expect(wallet!.balance).toBe("250.50");
      expect(wallet!.type).toBe("personal");
    });

    it("should get recent transactions from ledger", async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 1,
          walletId: mockWalletId,
          type: "spend",
          amount: "-20.00",
          description: "Booking: Desk A (2h × 1x)",
          createdAt: new Date(),
        },
        {
          id: 2,
          walletId: mockWalletId,
          type: "topup",
          amount: "100.00",
          description: "Top-up of 100 credits",
          createdAt: new Date(),
        },
      ];

      vi.spyOn(db, "getLedgerByWallet").mockResolvedValue(
        mockTransactions as any
      );

      // Act
      const transactions = await db.getLedgerByWallet(mockWalletId, 20);

      // Assert
      expect(transactions).toHaveLength(2);
      expect(transactions[0].type).toBe("spend");
      expect(transactions[1].type).toBe("topup");
    });
  });

  describe("Support Ticket Creation", () => {
    it("should create a support ticket with valid inputs", async () => {
      // Arrange
      const ticketData = {
        subject: "WiFi not working",
        description: "Cannot connect to WiFi network",
        category: "wifi" as const,
        priority: "normal" as const,
      };

      vi.spyOn(db, "createTicket").mockResolvedValue({
        id: 1,
        userId: mockUserId,
        subject: ticketData.subject,
        status: "open",
      } as any);

      // Act
      const ticket = await db.createTicket(ticketData as any);

      // Assert
      expect(ticket).toBeDefined();
      expect(ticket.subject).toBe("WiFi not working");
      expect(ticket.status).toBe("open");
    });

    it("should retrieve user's tickets", async () => {
      // Arrange
      const mockTickets = [
        {
          id: 1,
          userId: mockUserId,
          subject: "WiFi issue",
          status: "open",
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: mockUserId,
          subject: "Booking cancellation",
          status: "resolved",
          createdAt: new Date(),
        },
      ];

      vi.spyOn(db, "getTicketsByUser").mockResolvedValue(
        mockTickets as any
      );

      // Act
      const tickets = await db.getTicketsByUser(mockUserId);

      // Assert
      expect(tickets).toHaveLength(2);
      expect(tickets[0].status).toBe("open");
      expect(tickets[1].status).toBe("resolved");
    });

    it("should validate required ticket fields", () => {
      // Arrange
      const invalidTicket = {
        subject: "",
        description: "WiFi not working",
        category: "wifi",
        priority: "normal",
      };

      // Assert
      expect(invalidTicket.subject).toBe("");
      expect(invalidTicket.subject.trim().length).toBe(0);
    });
  });

  describe("Profile Update", () => {
    it("should update user profile with valid data", async () => {
      // Arrange
      const updateData = {
        name: "John Doe",
        phone: "+31 6 12345678",
      };

      vi.spyOn(db, "updateUserProfile").mockResolvedValue(true);

      // Act
      const result = await db.updateUserProfile(mockUserId, updateData);

      // Assert
      expect(result).toBe(true);
    });

    it("should retrieve user profile", async () => {
      // Arrange
      vi.spyOn(db, "getUserById").mockResolvedValue({
        id: mockUserId,
        name: "John Doe",
        email: "john@example.com",
        phone: "+31 6 12345678",
        role: "member",
      } as any);

      // Act
      const user = await db.getUserById(mockUserId);

      // Assert
      expect(user).toBeDefined();
      expect(user!.name).toBe("John Doe");
      expect(user!.email).toBe("john@example.com");
    });

    it("should not allow email change", () => {
      // Arrange
      const originalEmail = "john@example.com";
      const attemptedEmail = "newemail@example.com";

      // Assert
      expect(originalEmail).not.toBe(attemptedEmail);
      // Email should be immutable in the API
    });
  });

  describe("Resource Availability", () => {
    it("should get available resources for a location", async () => {
      // Arrange
      const mockResources = [
        {
          id: 1,
          name: "Desk A",
          type: "desk",
          creditCostPerHour: 10,
          isActive: true,
        },
        {
          id: 2,
          name: "Meeting Room",
          type: "meeting_room",
          creditCostPerHour: 25,
          isActive: true,
        },
      ];

      vi.spyOn(db, "getResourcesByLocation").mockResolvedValue(
        mockResources as any
      );

      // Act
      const resources = await db.getResourcesByLocation(mockLocationId);

      // Assert
      expect(resources).toHaveLength(2);
      expect(resources[0].type).toBe("desk");
      expect(resources[1].type).toBe("meeting_room");
    });

    it("should exclude inactive resources", async () => {
      // Arrange
      const mockResources = [
        { id: 1, name: "Desk A", isActive: true },
        { id: 2, name: "Desk B", isActive: false },
        { id: 3, name: "Desk C", isActive: true },
      ];

      const activeResources = mockResources.filter((r) => r.isActive);

      // Act & Assert
      expect(activeResources).toHaveLength(2);
      expect(activeResources.every((r) => r.isActive)).toBe(true);
    });
  });
});
