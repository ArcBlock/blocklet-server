import { describe, test, expect } from 'bun:test';
import path from 'path';
import { validateLogo } from '../src/logo-validate';

const extractedFilepath = path.join(__dirname, './assets/logo-screenshots-demo');
describe('validateLogo', () => {
  test('should no error with default options', () => {
    const result = validateLogo('logo.png', { extractedFilepath });
    expect(result).toEqual([]);
  });

  test('should no error with default options and logo.jpg logo', () => {
    const result = validateLogo('logo.jpg', { extractedFilepath });
    expect(result).toEqual([]);
  });

  test('should no error with default options and logo.jpeg logo', () => {
    const result = validateLogo('logo.jpeg', { extractedFilepath });
    expect(result).toEqual([]);
  });

  test('should get error with the logo name is empty', () => {
    const result = validateLogo('', { extractedFilepath });
    expect(result).toEqual(['The logo field is required in blocklet.yml.']);
  });

  test('should get error with not existed logo', () => {
    const result = validateLogo('invalid.png', { extractedFilepath });
    expect(result).toEqual(['The logo(invalid.png) file not found.']);
  });

  test('should get error with invalid logo format [.png] when the logoType not include [.png]', () => {
    const result = validateLogo('logo.png', { extractedFilepath, logoType: ['jpg', 'webp'] });
    expect(result).toEqual(['The logo(logo.png) format is not supported, expected: [jpg,webp].']);
  });

  test('should get error when the logo size exceeds maxSize', () => {
    const result = validateLogo('logo.png', { extractedFilepath, maxSize: 1 });
    expect(result).toEqual(['The logo(logo.png) size exceeds 1 KB, but got 2.72 KB.']);
  });

  test('should get error when the logo width is less than minWidth', () => {
    const result = validateLogo('logo.png', { extractedFilepath, minWidth: 300 });
    expect(result).toEqual(['The logo(logo.png) minimum size must be 300x300, but got 256x256.']);
  });

  test('should get error when the logo height is less than minHeight', () => {
    const result = validateLogo('logo350x256.png', { extractedFilepath, minWidth: 256 });
    expect(result).toEqual([
      'The logo(logo350x256.png) aspect ratio must be approximately 1:1, but got 1:0.73 (350x256).',
    ]);
  });

  test('should get error when the extractedFilepath is invalid', () => {
    const result = validateLogo('logo.png', { extractedFilepath: 'invalid' });
    expect(result).toEqual(['The logo(logo.png) file not found.']);
  });

  test('should get error when the logo extension is not match the real file extension', () => {
    const result = validateLogo('logo.bmp', { extractedFilepath });
    expect(result).toEqual(['The logo(logo.bmp) extension is not match the real file extension [.png].']);
  });

  test('should get error list with invalid logo', () => {
    const result = validateLogo('logo.png', { extractedFilepath, minWidth: 500, maxSize: 1, logoType: ['webp'] });
    expect(result).toEqual([
      'The logo(logo.png) size exceeds 1 KB, but got 2.72 KB.',
      'The logo(logo.png) format is not supported, expected: [webp].',
      'The logo(logo.png) minimum size must be 500x500, but got 256x256.',
    ]);
  });
});
