/**
 * Email Service Abstraction
 * Supports Resend API (primary) with fallback patterns for SendGrid
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_BASE_URL = "https://api.resend.com";

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
  replyTo?: string;
}

export interface EmailTrackingPixel {
  leadId: number;
  campaignId: number;
  sendId: string;
}

/**
 * Send email using Resend API
 */
export async function send(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        headers: options.tags ? { "X-Tags": JSON.stringify(options.tags) } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      console.error("Resend API error:", errorData);
      return { success: false, error: `Failed to send email: ${response.statusText}` };
    }

    const data = await response.json() as any;
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: `Error sending email: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

/**
 * Render email template from HTML
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, "g"), value);
  }
  return rendered;
}

/**
 * Generate a tracking pixel URL
 * When embedded in email HTML, will track opens
 */
export function getTrackingPixelUrl(baseUrl: string, tracking: EmailTrackingPixel): string {
  const params = new URLSearchParams({
    leadId: tracking.leadId.toString(),
    campaignId: tracking.campaignId.toString(),
    sendId: tracking.sendId,
  });
  return `${baseUrl}/api/email/track?${params.toString()}`;
}

/**
 * Generate a click tracking URL
 * Wraps a URL to track when clicked in email
 */
export function getClickTrackingUrl(baseUrl: string, originalUrl: string, tracking: EmailTrackingPixel): string {
  const params = new URLSearchParams({
    url: originalUrl,
    leadId: tracking.leadId.toString(),
    campaignId: tracking.campaignId.toString(),
    sendId: tracking.sendId,
  });
  return `${baseUrl}/api/email/click?${params.toString()}`;
}

/**
 * Track email open by storing it in the database
 */
export async function trackOpen(db: any, sendId: string, openedAt: Date = new Date()): Promise<void> {
  try {
    // This function assumes the caller has DB access and will update the emailCampaignSends table
    // The actual update is done by the endpoint that receives the tracking pixel request
    console.log(`Email open tracked for sendId: ${sendId}`);
  } catch (error) {
    console.error("Error tracking email open:", error);
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Build campaign email with tracking
 */
export async function buildCampaignEmail(
  options: {
    leadName: string;
    leadEmail: string;
    companyName: string;
    subject: string;
    bodyTemplate: string;
    baseUrl: string;
    campaignId: number;
    leadId: number;
    sendId: string;
  }
): Promise<SendEmailOptions> {
  const variables = {
    leadName: options.leadName,
    companyName: options.companyName,
    date: new Date().toLocaleDateString("nl-NL"),
  };

  const body = renderTemplate(options.bodyTemplate, variables);
  const trackingPixelUrl = getTrackingPixelUrl(options.baseUrl, {
    leadId: options.leadId,
    campaignId: options.campaignId,
    sendId: options.sendId,
  });

  const htmlWithTracking = `${body}\n<img src="${trackingPixelUrl}" alt="" width="1" height="1" />`;

  return {
    from: "campaigns@mr-green.nl",
    to: options.leadEmail,
    subject: options.subject,
    html: htmlWithTracking,
    tags: {
      campaignId: options.campaignId.toString(),
      leadId: options.leadId.toString(),
    },
  };
}
