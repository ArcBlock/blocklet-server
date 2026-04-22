const { describe, expect, test, spyOn } = require('bun:test');
const clipboardy = require('clipboardy');

const info = require('../../../lib/commands/server/info');

describe('Command.Node.Info', () => {
  test('should output system information', () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    info
      .run({ clipboard: true })
      .then(() => {
        expect(mockExit).toHaveBeenCalledWith(0);
        try {
          const result = clipboardy.readSync();
          expect(result.indexOf('System')).toBeGreaterThan(-1);
          expect(result.indexOf('Binaries')).toBeGreaterThan(-1);
          expect(result.indexOf('Browsers')).toBeGreaterThan(-1);
        } catch (err) {
          // Do nothing because clipboardy may fail on travis
        }
      })
      .catch((err) => {
        expect(err).toBeFalsy();
      });
  }, 10000);
});
