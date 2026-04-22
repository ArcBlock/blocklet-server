const { describe, expect, test } = require('bun:test');
const createTranslator = require('../lib/translate');

describe('translate', () => {
  const translations = {
    en: { greeting: 'Hello, {name}', farewell: 'Goodbye' },
    fr: { greeting: 'Bonjour' },
  };

  const t = createTranslator({ translations });

  test('should translate key in the specified locale', () => {
    const key = 'greeting';
    const locale = 'en';
    const result = t(key, locale);
    expect(result).toBe('Hello, ');
  });

  test('should handle missing translation for the locale', () => {
    const key = 'farewell';
    const locale = 'fr';
    const result = t(key, locale);
    expect(result).toBe('Goodbye');
  });

  test('should handle missing translation for both locale and fallbackLocale', () => {
    const key = 'farewell';
    const locale = 'fr';
    const result = t(key, locale);
    expect(result).toBe('Goodbye');
  });

  test('should replace placeholders in the translation', () => {
    const key = 'greeting';
    const locale = 'en';
    const data = { name: 'John' };
    const result = t(key, locale, data);
    expect(result).toBe('Hello, John');
  });

  test('should log a warning for missing translation', () => {
    const key = 'farewell';
    const locale = 'fr';
    const result = t(key, locale);
    expect(result).toBe('Goodbye');
  });
});
