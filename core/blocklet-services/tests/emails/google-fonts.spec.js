const { describe, test, expect } = require('bun:test');
const {
  parseGoogleFonts,
  buildGoogleFontsUrl,
  buildGoogleFontsImport,
  buildGoogleFontsImportFromMultiple,
} = require('../../api/emails/_libs/google-fonts');

// Note: 'Roboto' is in SYSTEM_FONTS list (Linux), so we use other Google Fonts for testing
describe('google-fonts utilities', () => {
  describe('parseGoogleFonts', () => {
    test('should extract Google Fonts from font family string', () => {
      expect(parseGoogleFonts('"Poppins", Arial, sans-serif')).toEqual(['Poppins']);
      expect(parseGoogleFonts('"Poppins", "Noto Sans SC", Helvetica')).toEqual(['Poppins', 'Noto Sans SC']);
    });

    test('should return empty array for system fonts only', () => {
      expect(parseGoogleFonts('Arial, sans-serif')).toEqual([]);
      expect(parseGoogleFonts('Helvetica, Georgia')).toEqual([]);
      // Roboto is in SYSTEM_FONTS
      expect(parseGoogleFonts('Roboto, sans-serif')).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(parseGoogleFonts('')).toEqual([]);
      expect(parseGoogleFonts(null)).toEqual([]);
      expect(parseGoogleFonts(undefined)).toEqual([]);
    });
  });

  describe('buildGoogleFontsUrl', () => {
    test('should build URL for single font', () => {
      const url = buildGoogleFontsUrl(['Poppins']);
      expect(url).toContain('https://fonts.googleapis.com/css2');
      expect(url).toContain('family=Poppins');
      expect(url).toContain('display=swap');
    });

    test('should build URL for multiple fonts', () => {
      const url = buildGoogleFontsUrl(['Poppins', 'Noto Sans SC']);
      expect(url).toContain('family=Poppins');
      expect(url).toContain('family=Noto%20Sans%20SC');
    });

    test('should return null for empty array', () => {
      expect(buildGoogleFontsUrl([])).toBeNull();
      expect(buildGoogleFontsUrl(null)).toBeNull();
    });
  });

  describe('buildGoogleFontsImport', () => {
    test('should generate @import rule', () => {
      const importRule = buildGoogleFontsImport('"Poppins", Arial, sans-serif');
      expect(importRule).toContain("@import url('https://fonts.googleapis.com/css2");
      expect(importRule).toContain('family=Poppins');
    });

    test('should return empty string for system fonts', () => {
      expect(buildGoogleFontsImport('Arial, sans-serif')).toBe('');
    });
  });

  describe('buildGoogleFontsImportFromMultiple', () => {
    test('should combine fonts from multiple font families', () => {
      const importRule = buildGoogleFontsImportFromMultiple(['"Poppins", Arial', '"Noto Sans SC", sans-serif']);
      expect(importRule).toContain('family=Poppins');
      expect(importRule).toContain('family=Noto%20Sans%20SC');
    });

    test('should deduplicate fonts across families', () => {
      const importRule = buildGoogleFontsImportFromMultiple(['"Poppins", Arial', '"Poppins", "Noto Sans SC"']);
      const matches = importRule.match(/family=Poppins/g);
      expect(matches).toHaveLength(1);
    });

    test('should handle undefined values in array', () => {
      const importRule = buildGoogleFontsImportFromMultiple(['"Poppins", Arial', undefined, '"Noto Sans SC"']);
      expect(importRule).toContain('family=Poppins');
      expect(importRule).toContain('family=Noto%20Sans%20SC');
    });

    test('should return empty string when no Google Fonts needed', () => {
      expect(buildGoogleFontsImportFromMultiple(['Arial, sans-serif', 'Helvetica'])).toBe('');
      expect(buildGoogleFontsImportFromMultiple([undefined, undefined])).toBe('');
    });

    test('should handle mixed Google Fonts and system fonts', () => {
      const importRule = buildGoogleFontsImportFromMultiple([
        '"Noto Sans SC", sans-serif',
        'HelveticaNeue,Helvetica,Arial,sans-serif',
      ]);
      expect(importRule).toContain('family=Noto%20Sans%20SC');
      expect(importRule).not.toContain('HelveticaNeue');
    });
  });
});
