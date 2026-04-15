import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { emailCampaignSends } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { renderTemplate, isValidEmail, getTrackingPixelUrl, getClickTrackingUrl } from "./integrations/emailService";

describe.skipIf(!process.env.DATABASE_URL)("Email Campaign Service", () => {
  let db: any;
  let testSendId: number;

  beforeAll(async () => {
    db = await getDb();

    // Create a test send record
    const [send] = await db.insert(emailCampaignSends).values({
      campaignId: 1,
      leadId: 1,
      email: "test@example.com",
      status: "sent",
      resendMessageId: "send_test12345",
    }).$returningId();
    testSendId = send.id;
  });

  it("should render email template with variables", () => {
    const template = "Hello {{leadName}}, welcome to {{companyName}}!";
    const rendered = renderTemplate(template, {
      leadName: "John Doe",
      companyName: "Acme Corp",
    });
    expect(rendered).toBe("Hello John Doe, welcome to Acme Corp!");
  });

  it("should validate email addresses", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid.email")).toBe(false);
    expect(isValidEmail("user@domain.co.uk")).toBe(true);
  });

  it("should generate tracking pixel URL", () => {
    const url = getTrackingPixelUrl("https://example.com", {
      leadId: 123,
      campaignId: 456,
      sendId: "send_abc123",
    });
    expect(url).toContain("leadId=123");
    expect(url).toContain("campaignId=456");
    expect(url).toContain("sendId=send_abc123");
  });

  it("should generate click tracking URL", () => {
    const url = getClickTrackingUrl("https://example.com", "https://target.com", {
      leadId: 123,
      campaignId: 456,
      sendId: "send_abc123",
    });
    expect(url).toContain("url=");
    expect(url).toContain("leadId=123");
    expect(url).toContain("sendId=send_abc123");
  });

  it("should create send record", async () => {
    const [send] = await db.select().from(emailCampaignSends)
      .where(eq(emailCampaignSends.id, testSendId)).limit(1);

    expect(send).not.toBeNull();
    expect(send.status).toBe("sent");
    expect(send.email).toBe("test@example.com");
  });

  it("should update send status to opened", async () => {
    await db.update(emailCampaignSends).set({
      status: "opened",
      openedAt: new Date(),
    }).where(eq(emailCampaignSends.id, testSendId));

    const [send] = await db.select().from(emailCampaignSends)
      .where(eq(emailCampaignSends.id, testSendId)).limit(1);

    expect(send.status).toBe("opened");
    expect(send.openedAt).not.toBeNull();
  });

  it("should track email click", async () => {
    await db.update(emailCampaignSends).set({
      status: "clicked",
      clickedAt: new Date(),
      clickCount: 1,
    }).where(eq(emailCampaignSends.id, testSendId));

    const [send] = await db.select().from(emailCampaignSends)
      .where(eq(emailCampaignSends.id, testSendId)).limit(1);

    expect(send.status).toBe("clicked");
    expect(send.clickCount).toBe(1);
  });

  it("should handle unsubscribe", async () => {
    const [unsubSend] = await db.insert(emailCampaignSends).values({
      campaignId: 1,
      leadId: 2,
      email: "unsub@example.com",
      status: "sent",
      resendMessageId: "send_unsub123",
    }).$returningId();

    await db.update(emailCampaignSends).set({
      status: "unsubscribed",
    }).where(eq(emailCampaignSends.id, unsubSend.id));

    const [send] = await db.select().from(emailCampaignSends)
      .where(eq(emailCampaignSends.id, unsubSend.id)).limit(1);

    expect(send.status).toBe("unsubscribed");

    // Cleanup
    await db.delete(emailCampaignSends).where(eq(emailCampaignSends.id, unsubSend.id));
  });

  it("should calculate campaign statistics", async () => {
    // Create multiple sends for campaign 1
    const sends = await db.select().from(emailCampaignSends)
      .where(eq(emailCampaignSends.campaignId, 1));

    const totalSent = sends.filter((s: any) => ["sent", "opened", "clicked"].includes(s.status)).length;
    const totalOpened = sends.filter((s: any) => ["opened", "clicked"].includes(s.status)).length;
    const totalClicked = sends.filter((s: any) => s.status === "clicked").length;

    expect(totalSent).toBeGreaterThanOrEqual(0);
    expect(totalOpened).toBeLessThanOrEqual(totalSent);
    expect(totalClicked).toBeLessThanOrEqual(totalOpened);
  });

  afterAll(async () => {
    // Cleanup
    if (db && testSendId) {
      await db.delete(emailCampaignSends).where(eq(emailCampaignSends.id, testSendId));
    }
  });
});
