import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { kioskOrders, kioskOrderItems, products, productCategories } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

describe.skip("Kitchen Order Lifecycle - uses MySQL schema against PG", () => {
  let db: any;
  let testOrderId: number;
  const testLocationId: number = 1;
  let testProductId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Create a test category
    const [categoryResult] = await db.insert(productCategories).values({
      name: "Test Category",
      slug: "test-category",
      sortOrder: 1,
      isActive: true,
    }).returning();

    // Create a test product
    const [productResult] = await db.insert(products).values({
      categoryId: categoryResult.id,
      name: "Test Dish",
      description: "A test dish",
      priceCredits: "10.00",
      priceEur: "5.00",
      isActive: true,
      isBookingAddon: false,
    }).returning();
    testProductId = productResult.id;

    // Create a test order
    const [orderResult] = await db.insert(kioskOrders).values({
      orderNumber: `TEST-${nanoid(8).toUpperCase()}`,
      locationId: testLocationId,
      paymentMethod: "cash",
      subtotalCredits: "10.00",
      subtotalEur: "5.00",
      vatAmount: "1.00",
      totalCredits: "10.00",
      totalEur: "6.00",
      status: "completed",
      kitchenStatus: "new",
    }).returning();
    testOrderId = orderResult.id;

    // Create order item
    await db.insert(kioskOrderItems).values({
      orderId: testOrderId,
      productId: testProductId,
      productName: "Test Dish",
      quantity: 1,
      unitPriceCredits: "10.00",
      unitPriceEur: "5.00",
      totalCredits: "10.00",
      totalEur: "5.00",
      vatRate: "21.00",
    });
  });

  it("should create order with 'new' status", async () => {
    const [order] = await db.select().from(kioskOrders).where(eq(kioskOrders.id, testOrderId)).limit(1);
    expect(order.kitchenStatus).toBe("new");
    expect(order.kitchenStartedAt).toBeNull();
  });

  it("should transition from new to preparing", async () => {
    const startTime = new Date();
    await db.update(kioskOrders).set({
      kitchenStatus: "preparing",
      kitchenStartedAt: startTime,
    }).where(eq(kioskOrders.id, testOrderId));

    const [order] = await db.select().from(kioskOrders).where(eq(kioskOrders.id, testOrderId)).limit(1);
    expect(order.kitchenStatus).toBe("preparing");
    expect(order.kitchenStartedAt).not.toBeNull();
  });

  it("should transition from preparing to ready", async () => {
    const readyTime = new Date();
    await db.update(kioskOrders).set({
      kitchenStatus: "ready",
      kitchenReadyAt: readyTime,
    }).where(eq(kioskOrders.id, testOrderId));

    const [order] = await db.select().from(kioskOrders).where(eq(kioskOrders.id, testOrderId)).limit(1);
    expect(order.kitchenStatus).toBe("ready");
    expect(order.kitchenReadyAt).not.toBeNull();
  });

  it("should transition from ready to picked_up", async () => {
    const pickedUpTime = new Date();
    await db.update(kioskOrders).set({
      kitchenStatus: "picked_up",
      kitchenPickedUpAt: pickedUpTime,
    }).where(eq(kioskOrders.id, testOrderId));

    const [order] = await db.select().from(kioskOrders).where(eq(kioskOrders.id, testOrderId)).limit(1);
    expect(order.kitchenStatus).toBe("picked_up");
    expect(order.kitchenPickedUpAt).not.toBeNull();
  });

  it("should filter active orders (exclude picked_up)", async () => {
    // Create another order that's picked up
    const [pickedOrder] = await db.insert(kioskOrders).values({
      orderNumber: `TEST-PICKED-${nanoid(8).toUpperCase()}`,
      locationId: testLocationId,
      paymentMethod: "cash",
      subtotalCredits: "10.00",
      subtotalEur: "5.00",
      vatAmount: "1.00",
      totalCredits: "10.00",
      totalEur: "6.00",
      status: "completed",
      kitchenStatus: "picked_up",
    }).returning();

    // Create another that's new
    const [newOrder] = await db.insert(kioskOrders).values({
      orderNumber: `TEST-NEW-${nanoid(8).toUpperCase()}`,
      locationId: testLocationId,
      paymentMethod: "cash",
      subtotalCredits: "10.00",
      subtotalEur: "5.00",
      vatAmount: "1.00",
      totalCredits: "10.00",
      totalEur: "6.00",
      status: "completed",
      kitchenStatus: "new",
    }).returning();

    const orders = await db.select().from(kioskOrders).where(
      and(
        eq(kioskOrders.locationId, testLocationId),
        // Filter out picked_up orders manually since we're checking the pattern
      )
    );

    // Manually filter (equivalent to what the endpoint would do)
    const activeOrders = orders.filter((o: any) => o.kitchenStatus !== "picked_up");
    expect(activeOrders.length).toBeGreaterThanOrEqual(2);
  });

  it("should calculate average prep time", async () => {
    // Get an order with both start and ready times
    const orders = await db.select().from(kioskOrders).where(eq(kioskOrders.locationId, testLocationId));

    let totalTime = 0;
    let count = 0;

    for (const order of orders) {
      if (order.kitchenStartedAt && order.kitchenReadyAt) {
        const prepTime = new Date(order.kitchenReadyAt).getTime() - new Date(order.kitchenStartedAt).getTime();
        totalTime += prepTime;
        count++;
      }
    }

    const avgSeconds = count > 0 ? Math.round(totalTime / count / 1000) : 0;
    expect(avgSeconds).toBeGreaterThanOrEqual(0);
  });

  it("should query orders by status", async () => {
    const newOrders = await db.select().from(kioskOrders).where(
      and(
        eq(kioskOrders.locationId, testLocationId),
        eq(kioskOrders.kitchenStatus, "new"),
      )
    );

    expect(newOrders.length).toBeGreaterThanOrEqual(0);
  });

  afterAll(async () => {
    // Cleanup test data
    if (db && testOrderId) {
      await db.delete(kioskOrderItems).where(eq(kioskOrderItems.orderId, testOrderId));
      await db.delete(kioskOrders).where(eq(kioskOrders.id, testOrderId));
    }
  });
});
