const { describe, expect, beforeEach, test, spyOn, afterEach } = require('bun:test');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { WEB_WALLET_URL, CONFIG_FOLDER_NAME, CONFIG_FILENAME, MAX_UPLOAD_FILE_SIZE } = require('@abtnode/constant');

const init = require('../../../lib/commands/server/init');

describe('Command.Node.init', () => {
  const cwd = process.cwd();
  const tmp = path.join(os.tmpdir(), Date.now().toString());

  beforeEach(() => {
    fs.ensureDirSync(tmp);
    process.chdir(tmp);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true });
    process.chdir(cwd);
  });

  test('should generate correct config', async () => {
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    try {
      await init.run({ force: true, webWalletUrl: WEB_WALLET_URL });
      expect(mockExit).toHaveBeenCalledWith(0);

      const configFile = path.join(tmp, `${CONFIG_FOLDER_NAME}/${CONFIG_FILENAME}`);
      expect(fs.existsSync(configFile)).toEqual(true);
      const config = yaml.load(fs.readFileSync(configFile).toString(), { json: true });

      expect(config.node.version).toBeTruthy();
      expect(config.node.sk).toBeTruthy();
      expect(config.node.did).toBeTruthy();
      expect(config.node.port).toEqual(8089);
      expect(config.node.routing.maxUploadFileSize).toEqual(MAX_UPLOAD_FILE_SIZE);
      expect(config.node.owner).toBeTruthy();
      expect(config.node.routing).toBeTruthy();
      expect(config.node.routing.provider).toBeTruthy();
      expect(config.node.routing.adminPath).toEqual('/.well-known/server/admin/');
      expect(config.blocklet.port).toEqual(8089);

      // 1.0.21
      expect(config.node.mode).toEqual('production');

      // 1.0.23
      expect(config.node.routing.httpPort).toBeTruthy();
      expect(config.node.routing.httpsPort).toBeTruthy();

      // 1.0.24
      expect(config.node.runtimeConfig.daemonMaxMemoryLimit).toEqual(819);
      expect(config.node.runtimeConfig.blockletMaxMemoryLimit).toEqual(819);

      // 1.0.32
      expect(config.node.routing.https).toEqual(true);

      // 1.2.6
      expect(config.node.ownerNft).toBeTruthy();
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }
  }, 60_000);
});
