import { createLogger } from "../_core/logger";

const log = createLogger("VisitorTracking");

/**
 * Visitor Tracking Service
 * LeadInfo-style IP-based company detection
 * Uses ipinfo.io API for IP geolocation and company lookup
 */

interface IpInfoResponse {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
}

interface CompanyInfo {
  ip: string;
  companyName?: string;
  companyDomain?: string;
  city?: string;
  country?: string;
}

export class VisitorTrackingService {
  private ipinfoToken: string;
  private apiBaseUrl = "https://ipinfo.io";

  constructor(token?: string) {
    this.ipinfoToken = token || process.env.IPINFO_TOKEN || "";
  }

  /**
   * Look up company info from IP address using ipinfo.io API
   */
  async lookupCompanyByIp(ip: string): Promise<CompanyInfo> {
    try {
      if (!ip || ip === "::1" || ip === "127.0.0.1") {
        return { ip, companyName: "Localhost" };
      }

      // Remove port if present
      const cleanIp = ip.split(":")[0];

      const url = `${this.apiBaseUrl}/${cleanIp}?token=${this.ipinfoToken}`;
      const response = await fetch(url);

      if (!response.ok) {
        log.warn("IP lookup failed", { ip, status: response.status });
        return { ip: cleanIp };
      }

      const data: IpInfoResponse = await response.json();

      // Parse organization info to extract company name
      // Format is usually: "AS12345 Company Name" or "Company Name"
      let companyName: string | undefined;
      let companyDomain: string | undefined;

      if (data.org) {
        // Extract company name from "ASxxxx Company Name" format
        const parts = data.org.split(" ");
        if (parts.length > 1) {
          companyName = parts.slice(1).join(" ");
        } else {
          companyName = data.org;
        }

        // Try to extract domain if possible
        // For company names like "Google Inc", we might want to normalize
        companyDomain = this.extractDomainFromOrg(companyName);
      }

      return {
        ip: cleanIp,
        companyName,
        companyDomain,
        city: data.city,
        country: data.country,
      };
    } catch (error) {
      log.error("IP lookup error", error);
      return { ip };
    }
  }

  /**
   * Extract potential domain from company name
   * e.g., "Google Inc" → "google.com"
   */
  private extractDomainFromOrg(orgName: string): string | undefined {
    // This is a simplification - in production you'd use a proper domain lookup
    const normalized = orgName
      .toLowerCase()
      .replace(/\s+inc\.?$/, "")
      .replace(/\s+ltd\.?$/, "")
      .replace(/\s+gmbh$/, "")
      .replace(/\s+/g, "");

    // Known mappings for common companies
    const domainMap: Record<string, string> = {
      google: "google.com",
      microsoft: "microsoft.com",
      apple: "apple.com",
      meta: "meta.com",
      amazon: "amazon.com",
      netflix: "netflix.com",
      github: "github.com",
    };

    return domainMap[normalized] || undefined;
  }

  /**
   * Generate a tracking pixel URL
   */
  generateTrackingPixelUrl(baseUrl: string, visitId: string): string {
    return `${baseUrl}/api/tracking/pixel?id=${visitId}`;
  }

  /**
   * Generate a tracking script snippet for embedding on websites
   */
  generateTrackingScript(
    accountId: string,
    options: {
      trackPageViews?: boolean;
      trackClicks?: boolean;
      trackFormSubmissions?: boolean;
    } = {}
  ): string {
    const trackPageViews = options.trackPageViews !== false;
    const trackClicks = options.trackClicks !== false;
    const trackFormSubmissions = options.trackFormSubmissions !== false;

    return `<!-- Mr. Green Visitor Tracking Script -->
<script>
(function() {
  const accountId = '${accountId}';
  const baseUrl = window.location.origin;

  // Generate or retrieve session ID
  function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('mg_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('mg_session_id', sessionId);
    }
    return sessionId;
  }

  async function trackVisit(page, referrer, utm) {
    try {
      const sessionId = getOrCreateSessionId();
      const data = {
        sessionId,
        page,
        referrer: referrer || document.referrer,
        ${trackPageViews ? "userAgent: navigator.userAgent," : ""}
        ${trackPageViews ? `utmSource: utm && utm.source ? utm.source : undefined,
        utmMedium: utm && utm.medium ? utm.medium : undefined,
        utmCampaign: utm && utm.campaign ? utm.campaign : undefined,` : ""}
      };

      await fetch('/api/tracking/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.log('Tracking request failed (silently)', err);
    }
  }

  function parseUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    };
  }

  // Track page view on load
  ${
    trackPageViews
      ? `window.addEventListener('load', function() {
    const utm = parseUtmParams();
    trackVisit(window.location.pathname, document.referrer, utm);
  });`
      : ""
  }

  // Track link clicks
  ${
    trackClicks
      ? `document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      const utm = parseUtmParams();
      trackVisit(e.target.href, window.location.pathname, utm);
    }
  });`
      : ""
  }

  // Track form submissions
  ${
    trackFormSubmissions
      ? `document.addEventListener('submit', function(e) {
    const utm = parseUtmParams();
    trackVisit(e.target.action || window.location.pathname, window.location.pathname, utm);
  });`
      : ""
  }
})();
</script>`;
  }

  /**
   * Deduplicate visitors - check if we've already tracked this IP in the last 30 minutes
   */
  async shouldTrackAsNewVisit(
    ip: string,
    existingVisits: Array<{ ip: string; visitedAt: number }>
  ): Promise<boolean> {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    const recentVisit = existingVisits.find(
      (v) => v.ip === ip && v.visitedAt > thirtyMinutesAgo
    );

    return !recentVisit;
  }
}

export default new VisitorTrackingService();
