import { describe, test, expect, beforeEach, mock } from 'bun:test';
import path from 'path';

import { getBlurhash } from '../src/blurhash';

describe('getBlurhash', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    mock.restore();
  });

  test('should generate blurhash for a valid image file', async () => {
    const testFilePath = path.resolve(__dirname, './assets/logo-screenshots-demo/logo.png');
    const result = await getBlurhash(testFilePath);
    expect(result).toBe('U07OGgt:0SlCpffRj@fR09WD~Oodt:j[WWa}');
  });

  test('should generate empty blurhash for a svg file', async () => {
    const testFilePath = path.resolve(__dirname, './assets/logo-screenshots-demo/screenshots/16x9.svg');
    const result = await getBlurhash(testFilePath);
    expect(result).toBe('');
  });

  test('should throw error when file does not exist', async () => {
    const testFilePath = path.resolve(__dirname, './assets/logo-screenshots-demo/logo2.png');
    await expect((getBlurhash as any)(testFilePath)).rejects.toThrow(/File not found/);
  });

  test('should throw error when file is not an image', async () => {
    const testFilePath = path.resolve(__dirname, './assets/logo-screenshots-demo/blocklet.yml');
    await expect((getBlurhash as any)(testFilePath)).rejects.toThrow(/File is not a valid image/);
  });
});
