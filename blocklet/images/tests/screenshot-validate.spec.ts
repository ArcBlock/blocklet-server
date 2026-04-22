import { describe, test, expect, it } from 'bun:test';
import path from 'path';
import { validateScreenshots } from '../src/screenshot-validate';

const extractedFilepath = path.join(__dirname, './assets/logo-screenshots-demo');

describe('validateScreenshots', () => {
  test('should no error with default options', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath });
    expect(result).toEqual([]);
  });

  it.each([
    ['.png', '800x450.png'],
    ['.jpg', '16x9.jpg'],
    ['.jpeg', '16x9.jpeg'],
    ['.gif', '16x9.gif'],
    ['.bmp', '16x9.bmp'],
    ['.webp', '16x9.webp'],
  ])('should no error when the image format is supported [%s]', (imageType, screenshot) => {
    const result = validateScreenshots([screenshot], { extractedFilepath });
    expect(result).toEqual([]);
  });

  test('should get error when the extractedFilepath is invalid', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath: 'invalid' });
    expect(result).toEqual(['The 1st[800x450.png] screenshot file not found.']);
  });

  test('should get error when the screenshot not exist', () => {
    const result2 = validateScreenshots(['800x450.png', 'invalid.png', 'invalid2.png'], { extractedFilepath });
    expect(result2).toEqual([
      'The 2nd[invalid.png] screenshot file not found.',
      'The 3rd[invalid2.png] screenshot file not found.',
    ]);
  });

  test('should show duplicated error when the screenshot is duplicated', () => {
    const result = validateScreenshots(['800x450.png', '16x9.jpg', '800x450.png', '800x450.png', '16x9.jpg'], {
      extractedFilepath,
    });
    expect(result).toEqual([
      'The 3rd screenshot(800x450.png) is duplicated with the 1st screenshot.',
      'The 4th screenshot(800x450.png) is duplicated with the 1st screenshot.',
      'The 5th screenshot(16x9.jpg) is duplicated with the 2nd screenshot.',
    ]);
  });

  test('should get error when the screenshot count is less than minCount 1', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath, minCount: 2 });
    expect(result).toEqual(['At least 2 screenshots are required, but just got 1.']);
  });

  test('should get error when the screenshot count is more than maxCount 2', () => {
    const result = validateScreenshots(['800x450.png', '16x9.jpg', '16x9.bmp'], {
      extractedFilepath,
      maxCount: 2,
    });
    expect(result).toEqual(['At most 2 screenshots are supported, but just got 3.']);
  });

  test('should get error when the screenshot size exceeds maxSize', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath, maxSize: 0.01 });
    expect(result).toEqual(['The 1st[800x450.png] screenshot size exceeds 0.01 MB, but got 0.01 MB.']);
  });

  test('should get error when the screenshot width is less than minWidth 1600', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath, minWidth: 1600 });
    expect(result).toEqual(['The 1st[800x450.png] screenshot minimum size must be 1600x900, but got 800x450.']);
  });

  test('should get error when the screenshot height is less than minHeight 900', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath, minHeight: 900 });
    expect(result).toEqual(['The 1st[800x450.png] screenshot minimum size must be 1600x900, but got 800x450.']);
  });

  test('should get error when the screenshot aspect ratio is not 16:9', () => {
    const result = validateScreenshots(['400x400.png'], { extractedFilepath });
    expect(result).toEqual([
      'The 1st[400x400.png] screenshot aspect ratio must be approximately 16:9, but got 16:16 (400x400).',
    ]);
  });

  test('should get error when the screenshot extension is not match the real file extension', () => {
    const result = validateScreenshots(['error-extension.png'], { extractedFilepath });
    expect(result).toEqual([
      'The 1st[error-extension.png] screenshot extension is not match the real file extension [.jpg].',
    ]);
  });

  test('should get error when the screenshot width is less than minWidth 1600 and height is less than minHeight 900', () => {
    const result = validateScreenshots(['800x450.png'], { extractedFilepath, minWidth: 1600, minHeight: 100 });
    expect(result).toEqual(['The 1st[800x450.png] screenshot minimum size must be 1600x100, but got 800x450.']);
  });

  test('should get all error list when the screenshots is invalid', () => {
    const result = validateScreenshots(
      ['800x450.png', '400x400.png', '16x9.jpg', '16x9.bmp', '800x450.png', 'invalid.png'],
      { extractedFilepath, minWidth: 1600, minHeight: 900, maxSize: 0.01, minCount: 8 }
    );
    expect(result).toEqual([
      'At least 8 screenshots are required, but just got 5.',
      'The 5th screenshot(800x450.png) is duplicated with the 1st screenshot.',
      'The 1st[800x450.png] screenshot size exceeds 0.01 MB, but got 0.01 MB.',
      'The 1st[800x450.png] screenshot minimum size must be 1600x900, but got 800x450.',
      'The 2nd[400x400.png] screenshot minimum size must be 1600x900, but got 400x400.',
      'The 2nd[400x400.png] screenshot aspect ratio must be approximately 16:9, but got 16:16 (400x400).',
      'The 3rd[16x9.jpg] screenshot minimum size must be 1600x900, but got 16x9.',
      'The 4th[16x9.bmp] screenshot minimum size must be 1600x900, but got 16x9.',
      'The 5th[invalid.png] screenshot file not found.',
    ]);
  });
});
