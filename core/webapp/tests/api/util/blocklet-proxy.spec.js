const { describe, test, expect } = require('bun:test');
const { getMimeTypes } = require('../../../api/util/blocklet-proxy');

describe('blocklet-proxy util', () => {
  test('should return mime types for common file extensions', () => {
    expect(getMimeTypes('test.html')).toContain('text/html');
    expect(getMimeTypes('style.css')).toContain('text/css');
    expect(getMimeTypes('script.js')).toContain('text/javascript');
    expect(getMimeTypes('data.json')).toContain('application/json');
  });

  test('should return image/* glob for image files', () => {
    const result = getMimeTypes('image.jpg');
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    // 应该包含常见的图片类型
    expect(result).toContain('image/jpeg');
    expect(result).toContain('image/png');
    expect(result).toContain('image/gif');
    expect(result).toContain('image/webp');
  });

  test('should handle png images', () => {
    const result = getMimeTypes('photo.png');
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('image/png');
  });

  test('should handle gif images', () => {
    const result = getMimeTypes('animation.gif');
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('image/gif');
  });

  test('should handle webp images', () => {
    const result = getMimeTypes('image.webp');
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('image/webp');
  });

  test('should return single mime type for non-image files', () => {
    const htmlResult = getMimeTypes('index.html');
    expect(htmlResult).toContain('text/html');
    // 非图片文件不应该返回所有图片类型
    expect(htmlResult).not.toContain('image/jpeg');

    const cssResult = getMimeTypes('style.css');
    expect(cssResult).toContain('text/css');
    expect(cssResult).not.toContain('image/png');
  });

  test('should handle files without extension', () => {
    const result = getMimeTypes('file');
    expect(result).toBeInstanceOf(Array);
    // 没有扩展名的文件可能返回 application/octet-stream 或空数组
  });

  test('should handle empty string', () => {
    const result = getMimeTypes('');
    expect(result).toBeInstanceOf(Array);
  });

  test('should return both text/javascript and application/javascript for JavaScript files', () => {
    const result = getMimeTypes('script.js');
    expect(result).toBeInstanceOf(Array);
    expect(result).toContain('text/javascript');
    expect(result).toContain('application/javascript');

    // 确保至少包含这两种类型
    expect(result).toEqual(expect.arrayContaining(['text/javascript', 'application/javascript']));
  });

  test('should handle JavaScript files with different extensions', () => {
    // .js 和 .mjs 文件应该返回 JavaScript 类型
    const jsResult = getMimeTypes('script.js');
    expect(jsResult).toContain('text/javascript');
    expect(jsResult).toContain('application/javascript');

    const mjsResult = getMimeTypes('module.mjs');
    expect(mjsResult).toContain('text/javascript');
    expect(mjsResult).toContain('application/javascript');

    // .cjs 文件返回的是 application/node，这是正常行为
    const cjsResult = getMimeTypes('module.cjs');
    expect(cjsResult).toContain('application/node');
  });

  test('should include basic JavaScript MIME types', () => {
    const result = getMimeTypes('app.js');

    // 应该包含基本的 JavaScript MIME 类型
    const basicJavascriptTypes = ['text/javascript', 'application/javascript'];

    basicJavascriptTypes.forEach(type => {
      expect(result).toContain(type);
    });
  });

  test('should handle favicon.ico files with query parameters', () => {
    // 测试包含查询参数的 favicon.ico URL
    const result = getMimeTypes(
      '.blocklet/proxy/z8ia2YcGbZWnwgWW4fWVyWBPEdm723N4ip6YM/favicon.ico?imageFilter=convert&f=png&w=32'
    );

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);

    // 应该包含 ICO 文件的正确 MIME 类型
    expect(result).toContain('image/vnd.microsoft.icon');

    // 也应该包含其他图片类型（因为它是图片文件）
    expect(result).toContain('image/png');
    expect(result).toContain('image/jpeg');
    expect(result).toContain('image/x-icon');
  });

  test('should handle simple favicon.ico files', () => {
    const result = getMimeTypes('favicon.ico');

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);

    // 应该包含 ICO 文件的正确 MIME 类型
    expect(result).toContain('image/vnd.microsoft.icon');

    // 也应该包含其他图片类型（因为它是图片文件）
    expect(result).toContain('image/png');
    expect(result).toContain('image/jpeg');
    expect(result).toContain('image/x-icon');
  });
});
