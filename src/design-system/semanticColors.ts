import { palettes, accentForeground, mixColor, type PaletteName, type AccentName } from './palettes.js';

/** Concrete paired roles for a supported palette and primary accent. */
export function themeColors(palette: PaletteName = 'soft-milk', accent: AccentName = 'sky') {
  const pigments = palettes[palette];
  const fill = pigments[accent];
  const light = {
    surface: '#FFFFFD', surfaceSubtle: '#FAFAF7', surfaceRaised: '#FFFFFF',
    text: '#302E2B', textMuted: '#706B63', textSubtle: '#706B63', textInverse: '#FFFFFD',
    actionText: accentForeground, actionBorder: '#74716C',
    border: '#E5DFD5', borderStrong: '#74716C',
    interactive: fill, interactiveHover: mixColor(fill, '#FFFFFF', .15), interactiveActive: mixColor(fill, accentForeground, .08),
    hover: '#F2F1EC', active: '#E5E3DC',
    selected: mixColor(fill, '#FFFFFF', .58), selectedHover: mixColor(fill, '#FFFFFF', .42), selectedActive: mixColor(fill, '#FFFFFF', .24),
    selectedBorder: '#6D706E', selectedText: '#302E2B', focus: '#526A77',
    disabledSurface: '#E7E6E1', disabledText: '#666761', readonlySurface: '#FAFAF7',
    neutralAction: pigments.apricot, neutralActionHover: mixColor(pigments.apricot, '#FFFFFF', .15), neutralActionActive: mixColor(pigments.apricot, accentForeground, .08),
    positive: '#36644E', positiveSurface: '#E8F4EC', warning: '#756016', warningSurface: '#FFF7D6',
    critical: '#954A60', criticalSurface: '#FBEAF0', informational: '#3E667D', informationalSurface: '#E7F3FA'
  };
  const dark: Record<keyof typeof light, string> = {
    ...light, surface: '#222426', surfaceSubtle: '#1E2022', surfaceRaised: '#2B2E30',
    text: '#F3F1EC', textMuted: '#BABBB7', textSubtle: '#BABBB7', textInverse: '#222426',
    actionBorder: fill, border: '#45494B', borderStrong: '#969B9D',
    hover: '#35393B', active: '#454A4D',
    selected: mixColor(fill, '#222426', .80), selectedHover: mixColor(fill, '#222426', .73), selectedActive: mixColor(fill, '#222426', .65),
    selectedBorder: fill, selectedText: '#F3F1EC', focus: fill,
    disabledSurface: '#363A3C', disabledText: '#A2A6A5', readonlySurface: '#1E2022',
    positive: pigments.mint, positiveSurface: '#2A3B32', warning: pigments.yellow, warningSurface: '#3F3927',
    critical: pigments.pink, criticalSurface: '#402E35', informational: pigments.sky, informationalSurface: '#293A44'
  };
  return { light, dark };
}
export const { light: lightColors, dark: darkColors } = themeColors();
export type SemanticColorRole = keyof typeof lightColors;

export const semanticColors = {
  surface: `var(--dz-color-surface, ${lightColors.surface})`,
  surfaceSubtle: `var(--dz-color-surfaceSubtle, ${lightColors.surfaceSubtle})`,
  surfaceRaised: `var(--dz-color-surfaceRaised, ${lightColors.surfaceRaised})`,
  text: `var(--dz-color-text, ${lightColors.text})`,
  textMuted: `var(--dz-color-textMuted, ${lightColors.textMuted})`,
  textSubtle: `var(--dz-color-textSubtle, ${lightColors.textSubtle})`,
  actionText: `var(--dz-color-actionText, ${lightColors.actionText})`,
  actionBorder: `var(--dz-color-actionBorder, ${lightColors.actionBorder})`,
  textInverse: `var(--dz-color-textInverse, ${lightColors.textInverse})`,
  border: `var(--dz-color-border, ${lightColors.border})`,
  borderStrong: `var(--dz-color-borderStrong, ${lightColors.borderStrong})`,
  interactive: `var(--dz-color-interactive, ${lightColors.interactive})`,
  interactiveHover: `var(--dz-color-interactiveHover, ${lightColors.interactiveHover})`,
  interactiveActive: `var(--dz-color-interactiveActive, ${lightColors.interactiveActive})`,
  hover: `var(--dz-color-hover, ${lightColors.hover})`,
  active: `var(--dz-color-active, ${lightColors.active})`,
  selected: `var(--dz-color-selected, ${lightColors.selected})`,
  selectedHover: `var(--dz-color-selectedHover, ${lightColors.selectedHover})`,
  selectedActive: `var(--dz-color-selectedActive, ${lightColors.selectedActive})`,
  selectedBorder: `var(--dz-color-selectedBorder, ${lightColors.selectedBorder})`,
  selectedText: `var(--dz-color-selectedText, ${lightColors.selectedText})`,
  focus: `var(--dz-color-focus, ${lightColors.focus})`,
  disabledSurface: `var(--dz-color-disabledSurface, ${lightColors.disabledSurface})`,
  disabledText: `var(--dz-color-disabledText, ${lightColors.disabledText})`,
  readonlySurface: `var(--dz-color-readonlySurface, ${lightColors.readonlySurface})`,
  neutralAction: `var(--dz-color-neutralAction, ${lightColors.neutralAction})`,
  neutralActionHover: `var(--dz-color-neutralActionHover, ${lightColors.neutralActionHover})`,
  neutralActionActive: `var(--dz-color-neutralActionActive, ${lightColors.neutralActionActive})`,
  positive: `var(--dz-color-positive, ${lightColors.positive})`,
  positiveSurface: `var(--dz-color-positiveSurface, ${lightColors.positiveSurface})`,
  warning: `var(--dz-color-warning, ${lightColors.warning})`,
  warningSurface: `var(--dz-color-warningSurface, ${lightColors.warningSurface})`,
  critical: `var(--dz-color-critical, ${lightColors.critical})`,
  criticalSurface: `var(--dz-color-criticalSurface, ${lightColors.criticalSurface})`,
  informational: `var(--dz-color-informational, ${lightColors.informational})`,
  informationalSurface: `var(--dz-color-informationalSurface, ${lightColors.informationalSurface})`,
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
/** Native color-scheme handles system appearance before hydration. */
export const themeStyle = (mode: ThemeMode, palette: PaletteName = 'soft-milk', accent: AccentName = 'sky'): string => {
  const scheme = mode === 'system' ? 'light dark' : mode;
  const { light, dark } = themeColors(palette, accent);
  const variables = Object.entries(light).map(([key, value]) => `--dz-color-${key}:light-dark(${value},${dark[key as SemanticColorRole]})`).join(';');
  const pigments = Object.entries(palettes[palette]).map(([key, value]) => `--dz-accent-${key}:${value}`).join(';');
  return `color-scheme:${scheme};${variables};${pigments};color:${semanticColors.text};background-color:${semanticColors.surface};`;
};
