const { describe, expect, test, spyOn } = require('bun:test');
const path = require('path');
const fs = require('fs');

const { BLOCKLET_LATEST_SPEC_VERSION } = require('@blocklet/constant');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');

const version = require('../../../lib/commands/blocklet/version');

describe('Command.blocklet.version', () => {
  test('should successfully bundle version', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-version');
    const file = path.join(dir, 'blocklet.yml');
    const tmp = fs.readFileSync(file);
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

    const curMeta = getBlockletMeta(dir);
    expect(curMeta.version).toBe('1.0.0');
    expect(curMeta.specVersion).toBe('1.1.0');

    await version.run(undefined, {});
    expect(mockExit).toHaveBeenCalledWith(0);

    const newMeta = getBlockletMeta(dir);
    expect(newMeta.version).toBe('1.0.1');
    expect(newMeta.specVersion).toBe(BLOCKLET_LATEST_SPEC_VERSION);

    fs.writeFileSync(file, tmp);
  });
});
