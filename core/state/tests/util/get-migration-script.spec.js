const { it, expect, describe } = require('bun:test');
const path = require('path');
const getMigrationScripts = require('../../lib/util/get-migration-scripts');

describe('getMigrationScripts', () => {
  const dir = path.join(__dirname, 'migration-mock');
  it('should return empty array if no migration scripts', () => {
    const scripts = getMigrationScripts(dir);
    expect(scripts).toEqual([
      {
        script: '0.2.0.js',
        version: '0.2.0',
      },
      {
        script: '0.2.18.js',
        version: '0.2.18',
      },
    ]);
  });

  it('should return empty array if no migration scripts', () => {
    const scripts = getMigrationScripts(path.join(__dirname, 'migration-mock-empty'));
    expect(scripts).toEqual([]);
  });

  it('should return all migration scripts if no version', () => {
    const scripts = getMigrationScripts(dir, null);
    expect(scripts).toEqual([
      {
        script: '0.2.0.js',
        version: '0.2.0',
      },
      {
        script: '0.2.18.js',
        version: '0.2.18',
      },
    ]);
  });

  it('should return all migration scripts if no version', () => {
    const scripts = getMigrationScripts(dir, 123);
    expect(scripts).toEqual([
      {
        script: '0.2.0.js',
        version: '0.2.0',
      },
      {
        script: '0.2.18.js',
        version: '0.2.18',
      },
    ]);
  });

  it('should return the correct migration scripts', () => {
    const scripts = getMigrationScripts(dir, '0.1.0');
    expect(scripts).toEqual([
      {
        script: '0.2.0.js',
        version: '0.2.0',
      },
      {
        script: '0.2.18.js',
        version: '0.2.18',
      },
    ]);
  });

  it('should return the correct migration scripts', () => {
    const scripts = getMigrationScripts(dir, '0.2.0');
    expect(scripts).toEqual([
      {
        script: '0.2.0.js',
        version: '0.2.0',
      },
      {
        script: '0.2.18.js',
        version: '0.2.18',
      },
    ]);
  });

  it('should return the correct migration scripts', () => {
    const scripts = getMigrationScripts(dir, '0.2.18');
    expect(scripts).toEqual([
      {
        script: '0.2.18.js',
        version: '0.2.18',
      },
    ]);
  });

  it('should return the correct migration scripts', () => {
    const scripts = getMigrationScripts(dir, '0.3.0');
    expect(scripts).toEqual([]);
  });
});
