const { test, describe, expect, beforeEach, afterEach, beforeAll, spyOn, mock } = require('bun:test');
const path = require('path');
const fs = require('fs');
const states = require('../../lib/states');
const util = require('../../lib/event/util');
const { setupInstance } = require('../../tools/fixture');

beforeAll(async () => {
  await setupInstance('event-util');
});

describe('event/util', () => {
  describe('backupBlockletSites', () => {
    let tmpDir;
    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('should backup sites and return file path', async () => {
      const fakeSites = [
        { id: 'site1', rules: [{ to: { did: 'did:foo' } }] },
        { id: 'site2', rules: [{ to: { did: 'did:foo' } }] },
      ];
      const spy = spyOn(states.site, 'getSitesByBlocklet').mockResolvedValue(fakeSites);
      const loggerInfo = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'info') // eslint-disable-line global-require
        .mockImplementation(() => {});
      const blocklet = {
        meta: { did: 'did:foo', name: 'test' },
        env: { cacheDir: tmpDir },
      };
      const { sites, backupFile } = await util.backupBlockletSites(blocklet);
      expect(sites).toEqual(fakeSites);
      expect(backupFile.startsWith(tmpDir)).toBe(true);
      expect(fs.existsSync(backupFile)).toBe(true);
      const content = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      expect(content).toEqual(fakeSites);
      spy.mockRestore();
      loggerInfo.mockRestore();
    });

    test('should handle fs error gracefully', async () => {
      const fakeSites = [{ id: 'site1', rules: [] }];
      spyOn(states.site, 'getSitesByBlocklet').mockResolvedValue(fakeSites);
      const loggerError = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'error') // eslint-disable-line global-require
        .mockImplementation(() => {});
      const blocklet = {
        meta: { did: 'did:foo', name: 'test' },
        env: { cacheDir: '/not-exist-dir' },
      };
      const { sites, backupFile } = await util.backupBlockletSites(blocklet);
      expect(sites).toEqual(fakeSites);
      expect(typeof backupFile === 'string' || backupFile === null).toBe(true);
      loggerError.mockRestore();
    });
  });

  describe('cleanBlockletSitesBackup', () => {
    let tmpDir;
    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    });
    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
    test('should remove backup file if exists', () => {
      const file = path.join(tmpDir, 'backup.json');
      fs.writeFileSync(file, '[]');
      const loggerInfo = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'info') // eslint-disable-line global-require
        .mockImplementation(() => {});
      util.cleanBlockletSitesBackup(file);
      expect(fs.existsSync(file)).toBe(false);
      loggerInfo.mockRestore();
    });
    test('should do nothing if file does not exist', () => {
      const file = path.join(tmpDir, 'not-exist.json');
      const loggerInfo = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'info') // eslint-disable-line global-require
        .mockImplementation(() => {});
      util.cleanBlockletSitesBackup(file);
      expect(fs.existsSync(file)).toBe(false);
      loggerInfo.mockRestore();
    });
  });

  describe('rollbackBlockletSites', () => {
    let tmpDir;
    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    });
    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
    test('should restore sites from argument', async () => {
      const fakeSites = [
        { id: 'site1', rules: [{ foo: 1 }] },
        { id: 'site2', rules: [{ foo: 2 }] },
      ];
      const updateSpy = spyOn(states.site, 'update').mockResolvedValue();
      const loggerInfo = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'info') // eslint-disable-line global-require
        .mockImplementation(() => {});
      const handleBlockletRouting = mock().mockResolvedValue('hash');
      const blocklet = { meta: { did: 'did:foo', name: 'test' } };
      await util.rollbackBlockletSites({
        blocklet,
        sites: fakeSites,
        backupFile: null,
        handleBlockletRouting,
        context: {},
      });
      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(handleBlockletRouting).toHaveBeenCalled();
      updateSpy.mockRestore();
      loggerInfo.mockRestore();
    });
    test('should restore sites from backup file', async () => {
      const fakeSites = [
        { id: 'site1', rules: [{ foo: 1 }] },
        { id: 'site2', rules: [{ foo: 2 }] },
      ];
      const file = path.join(tmpDir, 'backup.json');
      fs.writeFileSync(file, JSON.stringify(fakeSites));
      const updateSpy = spyOn(states.site, 'update').mockResolvedValue();
      const loggerInfo = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'info') // eslint-disable-line global-require
        .mockImplementation(() => {});
      const handleBlockletRouting = mock().mockResolvedValue('hash');
      const blocklet = { meta: { did: 'did:foo', name: 'test' } };
      await util.rollbackBlockletSites({ blocklet, sites: null, backupFile: file, handleBlockletRouting, context: {} });
      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(handleBlockletRouting).toHaveBeenCalled();
      updateSpy.mockRestore();
      loggerInfo.mockRestore();
    });
    test('should handle error gracefully', async () => {
      const loggerError = spyOn(require('@abtnode/logger')('@abtnode/core:event'), 'error') // eslint-disable-line global-require
        .mockImplementation(() => {});
      const blocklet = { meta: { did: 'did:foo', name: 'test' } };
      await util.rollbackBlockletSites({
        blocklet,
        sites: null,
        backupFile: '/not-exist',
        handleBlockletRouting: mock(),
        context: {},
      });
      loggerError.mockRestore();
    });
  });
});
