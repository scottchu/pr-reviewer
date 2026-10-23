/** User-approved pigment sets. Shared by both appearances; not body-text colors. */
export const palettes = {
  'soft-milk': { sky: '#98D0EC', pink: '#EFBFD0', mint: '#AFDDC3', apricot: '#F5C39E', yellow: '#FFEB98' },
  'soft-milk-gray': { sky: '#A3C9DC', pink: '#DEC1CC', mint: '#B5D3C2', apricot: '#E3C4AD', yellow: '#E8DCAE' }
} as const;
export type PaletteName = keyof typeof palettes;
export type AccentName = keyof typeof palettes['soft-milk'];
export const accentForeground = '#3B3F42';
export const paletteLabels: Record<PaletteName, string> = { 'soft-milk': 'Soft Milk', 'soft-milk-gray': 'Soft Milk Gray' };
/** Small supporting shade changes; approved default pigments remain exact. */
export function mixColor(first: string, second: string, amount: number): string {
  return '#' + [1, 3, 5].map(i => Math.round(parseInt(first.slice(i, i + 2), 16) * (1 - amount) + parseInt(second.slice(i, i + 2), 16) * amount).toString(16).padStart(2, '0')).join('').toUpperCase();
}
