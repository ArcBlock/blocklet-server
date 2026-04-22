/**
 * Google Fonts utilities for email templates
 * Used to dynamically load fonts from Google Fonts based on theme configuration
 */

// System fonts that don't need to be loaded from Google Fonts
const SYSTEM_FONTS = new Set([
  // Windows
  'arial',
  'helvetica',
  'times new roman',
  'times',
  'courier new',
  'courier',
  'verdana',
  'georgia',
  'palatino',
  'garamond',
  'comic sans ms',
  'trebuchet ms',
  'arial black',
  'impact',
  'tahoma',
  'calibri',
  'cambria',
  'consolas',
  'segoe ui',
  // macOS
  '-apple-system',
  'blinkmacsystemfont',
  'sf pro',
  'sf mono',
  'helvetica neue',
  'helveticaneue',
  'lucida grande',
  // Linux
  'ubuntu',
  'cantarell',
  'dejavu sans',
  'liberation sans',
  'fira sans',
  'droid sans',
  'roboto',
  'oxygen',
  // Generic
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  // CSS keywords
  'inherit',
  'initial',
  'unset',
  'revert',
]);

/**
 * Parse font family string and extract fonts that need to be loaded from Google Fonts
 * @param fontFamily - CSS font-family value, e.g. '"Roboto", "Open Sans", Arial, sans-serif'
 * @returns Array of font names that should be loaded from Google Fonts
 *
 * @example
 * parseGoogleFonts('"Roboto", Arial, sans-serif')
 * // => ['Roboto']
 *
 * parseGoogleFonts('"Roboto", "Open Sans", Helvetica')
 * // => ['Roboto', 'Open Sans']
 */
export function parseGoogleFonts(fontFamily: string): string[] {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return [];
  }

  return fontFamily
    .replace(/["']/g, '') // Remove quotes
    .split(',')
    .map((font) => font.trim())
    .filter((font) => font && !SYSTEM_FONTS.has(font.toLowerCase()));
}

export interface BuildGoogleFontsUrlOptions {
  /**
   * Font weights to load
   * @default [400, 500, 700]
   */
  weights?: number[];
  /**
   * Whether to include italic variants
   * @default false
   */
  italic?: boolean;
  /**
   * Font display strategy
   * @default 'swap'
   */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

/**
 * Build Google Fonts CSS URL from font names
 * @param fonts - Array of font names to load
 * @param options - Configuration options
 * @returns Google Fonts CSS URL or null if no fonts to load
 *
 * @example
 * buildGoogleFontsUrl(['Roboto', 'Open Sans'])
 * // => 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;500;700&display=swap'
 */
export function buildGoogleFontsUrl(fonts: string[], options: BuildGoogleFontsUrlOptions = {}): string | null {
  if (!fonts || fonts.length === 0) {
    return null;
  }

  const { weights = [400, 500, 700], italic = false, display = 'swap' } = options;

  const weightStr = weights.sort((a, b) => a - b).join(';');

  const familyParams = fonts
    .map((font) => {
      // Google Fonts URL format: family=Font+Name:wght@400;700 or family=Font+Name:ital,wght@0,400;1,400
      if (italic) {
        const variants = weights.flatMap((w) => [`0,${w}`, `1,${w}`]).join(';');
        return `family=${encodeURIComponent(font)}:ital,wght@${variants}`;
      }
      return `family=${encodeURIComponent(font)}:wght@${weightStr}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${familyParams}&display=${display}`;
}

/**
 * Generate CSS @import rule for Google Fonts
 * Convenience function that combines parseGoogleFonts and buildGoogleFontsUrl
 *
 * @param fontFamily - CSS font-family value
 * @param options - Configuration options
 * @returns CSS @import rule string or empty string if no fonts to load
 *
 * @example
 * buildGoogleFontsImport('"Roboto", Arial, sans-serif')
 * // => "@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');"
 */
export function buildGoogleFontsImport(fontFamily: string, options: BuildGoogleFontsUrlOptions = {}): string {
  const fonts = parseGoogleFonts(fontFamily);
  const url = buildGoogleFontsUrl(fonts, options);

  if (!url) {
    return '';
  }

  return `@import url('${url}');`;
}

/**
 * Build Google Fonts import from multiple font family strings
 * Deduplicates fonts across all font families before building URL
 *
 * @param fontFamilies - Array of CSS font-family values
 * @param options - Configuration options
 * @returns CSS @import rule string or empty string if no fonts to load
 *
 * @example
 * buildGoogleFontsImportFromMultiple(['"Roboto", Arial', '"Open Sans", sans-serif'])
 * // => "@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;500;700&display=swap');"
 */
export function buildGoogleFontsImportFromMultiple(
  fontFamilies: (string | undefined)[],
  options: BuildGoogleFontsUrlOptions = {}
): string {
  const allFonts = fontFamilies
    .filter((f): f is string => !!f)
    .flatMap((f) => parseGoogleFonts(f));

  // Deduplicate fonts
  const uniqueFonts = [...new Set(allFonts)];
  const url = buildGoogleFontsUrl(uniqueFonts, options);

  if (!url) {
    return '';
  }

  return `@import url('${url}');`;
}
