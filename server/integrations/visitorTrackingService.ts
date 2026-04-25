/**
 * Visitor Tracking Service
 * LeadInfo-style IP-based company detection
 * Uses ipinfo.io API for IP geolocation and company lookup
 */

import { createLogger } from "../_core/logger";
const log = createLogger("VisitorTracking");

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

  async lookupCompanyByIp(ip: string): Promise<CompanyInfo> {
    try {
      if (!ip || ip === "::1" || ip === "127.0.0.1") {
        return { ip, companyName: "Localhost" };
      }

      const cleanIp = ip.split(":")[0];
      const url = `${this.apiBaseUrl}/${cleanIp}?token=${this.ipinfoToken}`;
      const response = await fetch(url);

      if (!response.ok) {
        log.warn("IP lookup failed", { ip, status: response.status });
        return { ip: cleanIp };
      }

      const data: IpInfoResponse = await response.json();

      let companyName: string | undefined;
      let companyDomain: string | undefined;

      if (data.org) {
        const parts = data.org.split(" ");
        if (parts.length > 1) {
          companyName = parts.slice(1).join(" ");
        } else {
          companyName = data.org;
        }
        companyDomain = this.extractDomainFromOrg(companyName);
      }

      return {
        ip: cleanIp,
        companyName,
        companyDomain,
        city: data.city,
        country: data.country,
      };
    } catch (err: any) {
      log.error("IP lookup error", { error: err?.message });
      return { ip };
    }
  }

  private extractDomainFromOrg(orgName: string): string | undefined {
    const normalized = orgName
      .toLowerCase()
      .replace(/\s+inc\.?$/, "")
      .replace(/\s+ltd\.?$/, "")
      .replace(/\s+gmbh$/, "")
      .replace(/\s+/g, "");

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

  generateTrackingPixelUrl(baseUrl: string, visitId: string): string {
    return `${baseUrl}/api/tracking/pixel?id=${visitId}`;
  }

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

  ${
    trackPageViews
      ? `window.addEventListener('load', function() {
    const utm = parseUtmParams();
    trackVisit(window.location.pathname, document.referrer, utm);
  });`
      : ""
  }

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
