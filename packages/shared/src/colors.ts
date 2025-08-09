/**
 * Color palette used throughout the Redis Place application
 */
export const COLORS = [
  '#ffffff', '#e4e4e4', '#888888', '#222222',
  '#ffa7d1', '#e50000', '#e59500', '#a06a42',
  '#e5d900', '#94e044', '#02be01', '#00d3dd',
  '#0083c7', '#0000ea', '#cf6ee4', '#820080'
] as const;

/**
 * Convert a color index to its corresponding hex value
 * @param colorIndex The color index (0-15)
 * @returns The hex color string
 */
export function colorIndexToHex(colorIndex: number): string {
  return COLORS[colorIndex] || COLORS[0];
}

/**
 * Convert a hex color to its corresponding index
 * @param hex The hex color string
 * @returns The color index (0-15), or 0 if not found
 */
export function hexToColorIndex(hex: string): number {
  const index = COLORS.indexOf(hex.toLowerCase() as any);
  return index >= 0 ? index : 0;
}