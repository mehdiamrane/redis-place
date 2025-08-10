/**
 * Color ID to hex value mapping
 * ID 0 is reserved for empty/unplaced pixels (no color)
 */
const COLOR_MAP = {
  // ID 0 reserved for empty pixels
  1: "#ffffff", // White
  2: "#c0c0c0", // Light Gray
  3: "#808080", // Gray
  4: "#404040", // Dark Gray
  5: "#000000", // Black
  6: "#ffb3ba", // Light Pink
  7: "#e60000", // Red
  8: "#990000", // Dark Red
  9: "#ff8c00", // Orange
  10: "#90ee90", // Light Green
  11: "#00cc00", // Green
  12: "#006600", // Dark Green
  13: "#4169e1", // Blue
  14: "#87ceeb", // Light Blue
  15: "#00ffff", // Cyan
  16: "#dda0dd", // Plum
  17: "#9932cc", // Purple
  18: "#ffa500", // Gold
  19: "#ffff00", // Yellow
} as const;

/**
 * Get all available color IDs (excluding 0 which is reserved for empty pixels)
 */
export function getAvailableColorIds(): number[] {
  return Object.keys(COLOR_MAP).map((id) => parseInt(id));
}

/**
 * Convert a color ID to its corresponding hex value
 * @param colorId The color ID (1-20), 0 is reserved for empty pixels
 * @returns The hex color string, or null for empty pixels (ID 0)
 */
export function colorIdToHex(colorId: number): string | null {
  if (colorId === 0) {
    return null; // Empty pixel has no color
  }
  return COLOR_MAP[colorId as keyof typeof COLOR_MAP] || COLOR_MAP[1]; // Default to white
}

/**
 * Convert a hex color to its corresponding ID
 * @param hex The hex color string
 * @returns The color ID (1-20), or 1 if not found (defaults to white)
 */
export function hexToColorId(hex: string): number {
  const normalizedHex = hex.toLowerCase();
  for (const [id, color] of Object.entries(COLOR_MAP)) {
    if (color.toLowerCase() === normalizedHex) {
      return parseInt(id);
    }
  }
  return 1; // Default to white if color not found
}

/**
 * Check if a color ID represents an empty pixel
 * @param colorId The color ID to check
 * @returns True if the pixel is empty (ID 0), false otherwise
 */
export function isEmptyPixel(colorId: number): boolean {
  return colorId === 0;
}

/**
 * Legacy functions for backward compatibility - will be removed
 * @deprecated Use colorIdToHex instead
 */
export function colorIndexToHex(colorIndex: number): string {
  const hex = colorIdToHex(colorIndex);
  return hex || "#ffffff"; // Return white for empty pixels in legacy mode
}

/**
 * @deprecated Use hexToColorId instead
 */
export function hexToColorIndex(hex: string): number {
  return hexToColorId(hex);
}
