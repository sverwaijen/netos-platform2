import axios from "axios";

interface ScrapedBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: string[];
  images: string[];
  fonts: string[];
  title: string | null;
  description: string | null;
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function extractColors(html: string, css: string): string[] {
  const colors = new Set<string>();
  const combined = html + " " + css;

  // Hex colors (#xxx, #xxxxxx)
  const hexMatches = combined.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
  hexMatches.forEach((c) => {
    const lower = c.toLowerCase();
    // Skip common non-brand colors
    if (!["#fff", "#ffffff", "#000", "#000000", "#333", "#333333", "#666", "#666666", "#999", "#ccc", "#ddd", "#eee", "#f5f5f5", "#fafafa"].includes(lower)) {
      colors.add(lower);
    }
  });

  // rgb/rgba colors
  const rgbMatches = combined.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g) || [];
  rgbMatches.forEach((c) => colors.add(c));

  // hsl colors
  const hslMatches = combined.match(/hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+)?\s*\)/g) || [];
  hslMatches.forEach((c) => colors.add(c));

  return Array.from(colors).slice(0, 12);
}

function extractLogo(html: string, baseUrl: string): string | null {
  // Try og:image first
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch) return resolveUrl(baseUrl, ogMatch[1]);

  // Try logo in img tags
  const logoPatterns = [
    /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*id=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']*logo[^"']+)["']/i,
    /<a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
  ];

  for (const pattern of logoPatterns) {
    const match = html.match(pattern);
    if (match) return resolveUrl(baseUrl, match[1]);
  }

  // Try SVG logo
  const svgMatch = html.match(/<a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?(<svg[\s\S]*?<\/svg>)/i);
  if (svgMatch) return null; // SVG inline, can't extract as URL easily

  return null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const patterns = [
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return resolveUrl(baseUrl, match[1]);
  }

  return resolveUrl(baseUrl, "/favicon.ico");
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = resolveUrl(baseUrl, match[1]);
    // Skip tiny images, icons, tracking pixels
    if (
      !src.includes("1x1") &&
      !src.includes("pixel") &&
      !src.includes("tracking") &&
      !src.includes("data:image") &&
      !src.includes(".svg") &&
      !src.includes("icon") &&
      !src.includes("favicon")
    ) {
      images.push(src);
    }
  }

  // Also check CSS background images
  const bgRegex = /background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    const src = resolveUrl(baseUrl, match[1]);
    if (!src.includes("data:image")) {
      images.push(src);
    }
  }

  return Array.from(new Set(images)).slice(0, 20);
}

function extractFonts(html: string, css: string): string[] {
  const fonts = new Set<string>();
  const combined = html + " " + css;

  // font-family declarations
  const fontFamilyRegex = /font-family\s*:\s*["']?([^;"'}\n]+)/gi;
  let match;
  while ((match = fontFamilyRegex.exec(combined)) !== null) {
    const fontList = match[1].split(",").map((f) => f.trim().replace(/["']/g, ""));
    fontList.forEach((f) => {
      if (!["sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "inherit", "initial", "unset", "-apple-system", "BlinkMacSystemFont", "Segoe UI"].includes(f)) {
        fonts.add(f);
      }
    });
  }

  // Google Fonts links
  const googleFontRegex = /fonts\.googleapis\.com\/css2?\?family=([^"&]+)/gi;
  while ((match = googleFontRegex.exec(combined)) !== null) {
    const fontName = decodeURIComponent(match[1]).replace(/\+/g, " ").split(":")[0];
    fonts.add(fontName);
  }

  return Array.from(fonts).slice(0, 8);
}

function extractTitle(html: string): string | null {
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogTitle) return ogTitle[1];

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractDescription(html: string): string | null {
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  if (ogDesc) return ogDesc[1];

  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  return metaDesc ? metaDesc[1] : null;
}

export async function scrapeWebsiteBranding(url: string): Promise<ScrapedBranding> {
  // Normalize URL
  if (!url.startsWith("http")) url = "https://" + url;

  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    maxRedirects: 5,
  });

  const html = response.data as string;

  // Try to fetch main CSS files for color extraction
  let cssContent = "";
  const cssLinks = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [];
  for (const link of cssLinks.slice(0, 3)) {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      try {
        const cssUrl = resolveUrl(url, hrefMatch[1]);
        const cssResp = await axios.get(cssUrl, { timeout: 8000 });
        cssContent += cssResp.data + " ";
      } catch {
        // Skip failed CSS fetches
      }
    }
  }

  // Extract inline styles too
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  styleBlocks.forEach((block) => {
    const content = block.replace(/<\/?style[^>]*>/gi, "");
    cssContent += content + " ";
  });

  return {
    logoUrl: extractLogo(html, url),
    faviconUrl: extractFavicon(html, url),
    colors: extractColors(html, cssContent),
    images: extractImages(html, url),
    fonts: extractFonts(html, cssContent),
    title: extractTitle(html),
    description: extractDescription(html),
  };
}
