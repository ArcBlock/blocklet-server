const { describe, expect, beforeAll, afterAll, test, spyOn } = require('bun:test');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const init = require('../../../lib/commands/blocklet/init');

// FIXME: how to add did-connect gen-key-pair step
describe('Command.blocklet.init', () => {
  const cwd = process.cwd();
  const name = Date.now().toString();
  const tmp = path.join(os.tmpdir(), name);
  fs.ensureDirSync(tmp);

  beforeAll(() => {
    process.chdir(tmp);
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true });
    process.chdir(cwd);
  });

  test('should be a function', () => {
    expect(typeof init.run).toBe('function');
  });

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('should generate correct blocklet yml when add force param', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    const interfaces = [
      {
        type: 'web',
        name: 'publicUrl',
        path: '/',
        prefix: '*',
        port: 'BLOCKLET_PORT',
        protocol: 'http',
      },
    ];

    try {
      await init.run({ force: true });
      expect(mockExit).toHaveBeenCalledWith(0);

      const blockletFile = path.join(tmp, 'blocklet.yml');
      expect(fs.existsSync(blockletFile)).toEqual(true);
      const config = yaml.load(fs.readFileSync(blockletFile).toString(), { json: true });

      expect(config.name).toEqual(name);
      expect(config.files).toEqual(['blocklet.md', 'screenshots']);
      expect(config.group).toEqual('dapp');
      expect(config.description).toEqual('Blocklet Project');
      expect(config.main).toEqual('.');
      expect(config.interfaces).toEqual(interfaces);
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }
  });

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('should generate correct blocklet yml when add yes param', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    const interfaces = [
      {
        type: 'web',
        name: 'publicUrl',
        path: '/',
        prefix: '*',
        port: 'BLOCKLET_PORT',
        protocol: 'http',
      },
    ];

    try {
      await init.run({ yes: true });
      expect(mockExit).toHaveBeenCalledWith(0);

      const blockletFile = path.join(tmp, 'blocklet.yml');
      expect(fs.existsSync(blockletFile)).toEqual(true);
      const config = yaml.load(fs.readFileSync(blockletFile).toString(), { json: true });

      expect(config.name).toEqual(name);
      expect(config.files).toEqual(['blocklet.md', 'screenshots']);
      expect(config.group).toEqual('dapp');
      expect(config.description).toEqual('Blocklet Project');
      expect(config.main).toEqual('.');
      expect(config.interfaces).toEqual(interfaces);
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }
  });
});
