const { test, expect, describe } = require('bun:test');
const { parseTmpfs } = require('../../lib/util/docker/parse-tmpfs');

describe('parseTmpfs', () => {
  describe('invalid input handling', () => {
    test('returns empty result when tmpfs is undefined', () => {
      const result = parseTmpfs(undefined);
      expect(result).toEqual({
        tmpfs: '',
        size: '0m',
        fullDir: '',
      });
    });

    test('returns empty result when tmpfs is null', () => {
      const result = parseTmpfs(null);
      expect(result).toEqual({
        tmpfs: '',
        size: '0m',
        fullDir: '',
      });
    });

    test('returns empty result when tmpfs is empty string', () => {
      const result = parseTmpfs('');
      expect(result).toEqual({
        tmpfs: '',
        size: '0m',
        fullDir: '',
      });
    });

    test('returns empty result when tmpfs has no colon separator', () => {
      const result = parseTmpfs('/tmp/data');
      expect(result).toEqual({
        tmpfs: '',
        size: '0m',
        fullDir: '',
      });
    });

    test('returns empty result when fsPath is empty', () => {
      const result = parseTmpfs(':1g');
      expect(result).toEqual({
        tmpfs: '',
        size: '0m',
        fullDir: '',
      });
    });

    test('returns empty result when size is empty', () => {
      const result = parseTmpfs('/tmp/data:');
      expect(result).toEqual({
        tmpfs: '',
        size: '0m',
        fullDir: '',
      });
    });
  });

  describe('size in gigabytes', () => {
    test('parses size in gigabytes within default limit', () => {
      const result = parseTmpfs('/tmp/data:1g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('parses size in gigabytes at default limit', () => {
      const result = parseTmpfs('/tmp/data:2g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=2048m',
        size: '2048m',
        fullDir: '/tmp/data',
      });
    });

    test('caps size at default max when exceeding limit', () => {
      const result = parseTmpfs('/tmp/data:5g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=4096m',
        size: '4096m',
        fullDir: '/tmp/data',
      });
    });

    test('respects custom maxTmpfsSize', () => {
      const result = parseTmpfs('/tmp/data:3g', '4g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=3072m',
        size: '3072m',
        fullDir: '/tmp/data',
      });
    });

    test('caps at custom maxTmpfsSize when exceeding', () => {
      const result = parseTmpfs('/tmp/data:10g', '4g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=4096m',
        size: '4096m',
        fullDir: '/tmp/data',
      });
    });

    test('respects maxTmpfsSize in megabytes format (2048m)', () => {
      const result = parseTmpfs('/tmp/data:1g', '2048m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('caps size when exceeding maxTmpfsSize in megabytes format', () => {
      const result = parseTmpfs('/tmp/data:5g', '2048m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=2048m',
        size: '2048m',
        fullDir: '/tmp/data',
      });
    });

    test('handles maxTmpfsSize in megabytes with size in megabytes', () => {
      const result = parseTmpfs('/tmp/data:512m', '1024m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=512m',
        size: '512m',
        fullDir: '/tmp/data',
      });
    });

    test('caps megabytes size at maxTmpfsSize in megabytes format', () => {
      const result = parseTmpfs('/tmp/data:4096m', '2048m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=2048m',
        size: '2048m',
        fullDir: '/tmp/data',
      });
    });
  });

  describe('size in megabytes', () => {
    test('keeps megabytes format', () => {
      const result = parseTmpfs('/tmp/data:512m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=512m',
        size: '512m',
        fullDir: '/tmp/data',
      });
    });

    test('keeps 1024m as 1024m', () => {
      const result = parseTmpfs('/tmp/data:1024m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('caps megabytes at maxTmpfsSize when exceeds limit', () => {
      const result = parseTmpfs('/tmp/data:4096m', '2g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=2048m',
        size: '2048m',
        fullDir: '/tmp/data',
      });
    });

    test('handles small megabyte values', () => {
      const result = parseTmpfs('/tmp/data:256m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=256m',
        size: '256m',
        fullDir: '/tmp/data',
      });
    });
  });

  describe('prefixDir handling', () => {
    test('uses default prefixDir of /', () => {
      const result = parseTmpfs('tmp/data:1g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('applies custom prefixDir', () => {
      const result = parseTmpfs('data:1g', '2g', '/app');
      expect(result).toEqual({
        tmpfs: '--tmpfs /app/data:size=1024m',
        size: '1024m',
        fullDir: '/app/data',
      });
    });

    test('handles absolute path with custom prefixDir', () => {
      const result = parseTmpfs('/tmp/data:1g', '2g', '/prefix');
      expect(result).toEqual({
        tmpfs: '--tmpfs /prefix/tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/prefix/tmp/data',
      });
    });

    test('handles nested directories', () => {
      const result = parseTmpfs('var/cache/data:1g', '2g', '/mnt');
      expect(result).toEqual({
        tmpfs: '--tmpfs /mnt/var/cache/data:size=1024m',
        size: '1024m',
        fullDir: '/mnt/var/cache/data',
      });
    });

    test('handles deeply nested prefixDir', () => {
      const result = parseTmpfs('cache:1g', '2g', '/var/lib/blocklet/app');
      expect(result).toEqual({
        tmpfs: '--tmpfs /var/lib/blocklet/app/cache:size=1024m',
        size: '1024m',
        fullDir: '/var/lib/blocklet/app/cache',
      });
    });

    test('handles prefixDir with trailing slash', () => {
      const result = parseTmpfs('data:1g', '2g', '/app/');
      expect(result).toEqual({
        tmpfs: '--tmpfs /app/data:size=1024m',
        size: '1024m',
        fullDir: '/app/data',
      });
    });

    test('handles empty prefixDir', () => {
      const result = parseTmpfs('tmp/data:1g', '2g', '');
      expect(result).toEqual({
        tmpfs: '--tmpfs tmp/data:size=1024m',
        size: '1024m',
        fullDir: 'tmp/data',
      });
    });

    test('handles dot prefixDir (current directory)', () => {
      const result = parseTmpfs('data:1g', '2g', '.');
      expect(result).toEqual({
        tmpfs: '--tmpfs data:size=1024m',
        size: '1024m',
        fullDir: 'data',
      });
    });

    test('handles prefixDir with blocklet runtime path pattern', () => {
      const result = parseTmpfs('.tmp:512m', '2g', '/var/lib/blocklet/runtime/z1abc123');
      expect(result).toEqual({
        tmpfs: '--tmpfs /var/lib/blocklet/runtime/z1abc123/.tmp:size=512m',
        size: '512m',
        fullDir: '/var/lib/blocklet/runtime/z1abc123/.tmp',
      });
    });

    test('handles prefixDir with path containing numbers', () => {
      const result = parseTmpfs('cache:1g', '2g', '/opt/app-v2.0/instance-001');
      expect(result).toEqual({
        tmpfs: '--tmpfs /opt/app-v2.0/instance-001/cache:size=1024m',
        size: '1024m',
        fullDir: '/opt/app-v2.0/instance-001/cache',
      });
    });

    test('handles prefixDir with underscore and hyphen', () => {
      const result = parseTmpfs('temp_dir:1g', '2g', '/my-app/data_store');
      expect(result).toEqual({
        tmpfs: '--tmpfs /my-app/data_store/temp_dir:size=1024m',
        size: '1024m',
        fullDir: '/my-app/data_store/temp_dir',
      });
    });
  });

  describe('unsupported size units', () => {
    test('returns 0m size for unsupported unit', () => {
      const result = parseTmpfs('/tmp/data:1k');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=0m',
        size: '0m',
        fullDir: '/tmp/data',
      });
    });

    test('returns 0m size for size without unit', () => {
      const result = parseTmpfs('/tmp/data:1024');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=0m',
        size: '0m',
        fullDir: '/tmp/data',
      });
    });
  });

  describe('edge cases', () => {
    test('handles 0g size', () => {
      const result = parseTmpfs('/tmp/data:0g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=0m',
        size: '0m',
        fullDir: '/tmp/data',
      });
    });

    test('handles 0m size', () => {
      const result = parseTmpfs('/tmp/data:0m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=0m',
        size: '0m',
        fullDir: '/tmp/data',
      });
    });

    test('handles decimal gigabyte values', () => {
      const result = parseTmpfs('/tmp/data:1.5g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1536m',
        size: '1536m',
        fullDir: '/tmp/data',
      });
    });

    test('handles maxTmpfsSize as number (treated as GB)', () => {
      const result = parseTmpfs('/tmp/data:5g', 3);
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=3072m',
        size: '3072m',
        fullDir: '/tmp/data',
      });
    });
  });

  describe('invalid maxTmpfsSize handling', () => {
    test('falls back to default 4g when maxTmpfsSize is invalid string', () => {
      const result = parseTmpfs('/tmp/data:1g', 'invalid');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('falls back to default 4g when maxTmpfsSize has no valid unit', () => {
      const result = parseTmpfs('/tmp/data:1g', '2x');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('falls back to default 4g when maxTmpfsSize is empty string', () => {
      const result = parseTmpfs('/tmp/data:5g', '');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=4096m',
        size: '4096m',
        fullDir: '/tmp/data',
      });
    });

    test('falls back to default 4g when maxTmpfsSize is NaN', () => {
      const result = parseTmpfs('/tmp/data:5g', NaN);
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=4096m',
        size: '4096m',
        fullDir: '/tmp/data',
      });
    });

    test('falls back to default 4g when maxTmpfsSize is negative', () => {
      const result = parseTmpfs('/tmp/data:1g', '-1g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('handles invalid size value gracefully', () => {
      const result = parseTmpfs('/tmp/data:invalidg');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=0m',
        size: '0m',
        fullDir: '/tmp/data',
      });
    });

    test('handles invalid size value with m suffix gracefully', () => {
      const result = parseTmpfs('/tmp/data:abcm');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=0m',
        size: '0m',
        fullDir: '/tmp/data',
      });
    });
  });

  describe('rw option handling', () => {
    test('handles size with trailing rw option (1g,rw)', () => {
      const result = parseTmpfs('/tmp/data:1g,rw');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('handles size with trailing rw option in megabytes (512m,rw)', () => {
      const result = parseTmpfs('/tmp/data:512m,rw');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=512m',
        size: '512m',
        fullDir: '/tmp/data',
      });
    });

    test('handles rw,size format (rw,1g)', () => {
      const result = parseTmpfs('/tmp/data:rw,1g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('handles rw,size format in megabytes (rw,1024m)', () => {
      const result = parseTmpfs('/tmp/data:rw,1024m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('handles size with rw and respects maxTmpfsSize limit', () => {
      const result = parseTmpfs('/tmp/data:5g,rw', '2g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=2048m',
        size: '2048m',
        fullDir: '/tmp/data',
      });
    });
  });

  describe('Docker style size= format', () => {
    test('handles size=512m format (Docker style)', () => {
      const result = parseTmpfs('/dog/cat/fish:size=512m');
      expect(result).toEqual({
        tmpfs: '--tmpfs /dog/cat/fish:size=512m',
        size: '512m',
        fullDir: '/dog/cat/fish',
      });
    });

    test('handles size=1g format (Docker style)', () => {
      const result = parseTmpfs('/tmp/data:size=1g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('handles size=5g format with maxTmpfsSize limit', () => {
      const result = parseTmpfs('/tmp/data:size=5g', '2g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=2048m',
        size: '2048m',
        fullDir: '/tmp/data',
      });
    });

    test('handles size=512m,rw format (Docker style with rw)', () => {
      const result = parseTmpfs('/tmp/data:size=512m,rw');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=512m',
        size: '512m',
        fullDir: '/tmp/data',
      });
    });

    test('handles rw,size=1g format (rw before size)', () => {
      const result = parseTmpfs('/tmp/data:rw,size=1g');
      expect(result).toEqual({
        tmpfs: '--tmpfs /tmp/data:size=1024m',
        size: '1024m',
        fullDir: '/tmp/data',
      });
    });

    test('handles size=1024m format with custom prefixDir', () => {
      const result = parseTmpfs('cache:size=1024m', '2g', '/var/lib/blocklet');
      expect(result).toEqual({
        tmpfs: '--tmpfs /var/lib/blocklet/cache:size=1024m',
        size: '1024m',
        fullDir: '/var/lib/blocklet/cache',
      });
    });
  });
});
