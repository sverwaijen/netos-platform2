/**
 * Image utility functions for handling missing product images
 */

const PLACEHOLDER_BASE_URL = 'https://images.unsplash.com';

const PLACEHOLDER_IMAGES: Record<string, string> = {
  // Product category placeholders
  'beverage': `${PLACEHOLDER_BASE_URL}/photo-1495521821757-a1efb6729352?w=300&h=300&fit=crop`, // Coffee cup
  'food': `${PLACEHOLDER_BASE_URL}/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop`, // Sandwich
  'snack': `${PLACEHOLDER_BASE_URL}/photo-1585301040419-46aa89efb55c?w=300&h=300&fit=crop`, // Donut
  'dessert': `${PLACEHOLDER_BASE_URL}/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop`, // Cake
  'default': `${PLACEHOLDER_BASE_URL}/photo-1599599810694-b5ac4dd94b9b?w=300&h=300&fit=crop`, // Gray/neutral image
};

/**
 * Get image URL for a product, falling back to placeholder if none exists
 * @param imageUrl - The product's image URL (if available)
 * @param productName - Product name for generating context-specific placeholder
 * @param category - Optional product category for category-specific placeholders
 * @returns A valid image URL (either the product's or a placeholder)
 */
export function getProductImageUrl(
  imageUrl: string | null | undefined,
  productName?: string,
  category?: string
): string {
  // If a real image URL is provided, use it
  if (imageUrl && imageUrl.trim()) {
    return imageUrl;
  }

  // Fall back to category-specific placeholder if available
  if (category && PLACEHOLDER_IMAGES[category.toLowerCase()]) {
    return PLACEHOLDER_IMAGES[category.toLowerCase()];
  }

  // Use default placeholder as last resort
  return PLACEHOLDER_IMAGES.default;
}

/**
 * Generate a simple placeholder image using a text-based service
 * Useful for quick placeholders without external dependencies
 * @param text - Text to display on placeholder (e.g., product name)
 * @param width - Width in pixels (default 300)
 * @param height - Height in pixels (default 300)
 * @returns A data URL for the placeholder
 */
export function generateTextPlaceholder(
  text: string,
  width = 300,
  height = 300
): string {
  const colors = ['627653', 'b8a472', '888888', '3a4a34', '6b5b4a'];
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = colors[hash % colors.length];
  const encodedText = encodeURIComponent(text.substring(0, 15));

  return `https://via.placeholder.com/${width}x${height}/${bgColor}/ffffff?text=${encodedText}`;
}

/**
 * Check if an image URL is valid by attempting to load it
 * @param url - Image URL to validate
 * @returns Promise that resolves to true if valid, false otherwise
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}
