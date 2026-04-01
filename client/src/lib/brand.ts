// Mr. Green Brand Assets - CDN URLs
export const BRAND = {
  logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/logo-white_47b57f46.svg",
  images: {
    amsterdam: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/amsterdam_9ecc8111.jpg",
    rotterdam: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/rotterdam_c2a474f5.jpg",
    zwolle: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/zwolle_652ae54a.jpg",
    zwolleCommunity: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/zwolle-community_48d2d94e.jpg",
    ede: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/ede_ae2e4611.jpg",
    apeldoorn: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/apeldoorn_7e4f9f14.jpg",
    klarenbeek: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/klarenbeek_f20b4d38.jpg",
    spijkenisse: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/spijkenisse_560d9e53.jpg",
    boutiqueOffice: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/mDvGyHKfUjrJPbgE7f5Bn3/boutique-office_5639fb42.jpg",
  },
  colors: {
    green: "#627653",
    greenDark: "#3a4a34",
    cream: "#f6f5f2",
    black: "#111",
    gold: "#b8a472",
    gray: "#888",
  },
} as const;

// Map location slugs to images
export const LOCATION_IMAGES: Record<string, string> = {
  amsterdam: BRAND.images.amsterdam,
  rotterdam: BRAND.images.rotterdam,
  zwolle: BRAND.images.zwolle,
  ede: BRAND.images.ede,
  apeldoorn: BRAND.images.apeldoorn,
  klarenbeek: BRAND.images.klarenbeek,
  spijkenisse: BRAND.images.spijkenisse,
};

export function getLocationImage(slug: string): string {
  return LOCATION_IMAGES[slug] || BRAND.images.boutiqueOffice;
}
