const { test, expect, describe, mock, afterEach, spyOn, it, afterAll } = require('bun:test');

const realFs = require('fs-extra');

mock.module('@abtnode/util/lib/axios', () => ({
  get: mock(() => 'ok'),
}));
mock.module('fs-extra', () => {
  return {
    ...realFs,
    createReadStream: mock(),
    createWriteStream: mock(),
    ensureDir: mock(),
  };
});
mock.module('@abtnode/util/lib/logo', () => {
  return {
    getLogoUrl: mock(() => 'logo.png'),
  };
});
mock.module('stream-to-promise', () => {
  return {
    __esModule: true,
    default: mock(() => 'ok'),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { join } = require('path');

const { readJSONSync, removeSync, existsSync, createReadStream, createWriteStream, ensureDir } = require('fs-extra');

const { getLogoUrl } = require('@abtnode/util/lib/logo');
const streamToPromise = require('stream-to-promise');

const axios = require('@abtnode/util/lib/axios');
const { BlockletBackup } = require('../../../../lib/blocklet/storage/backup/blocklet');

describe('backup blocklet', () => {
  const filename = 'blocklet.json';
  const backupDir = __dirname;
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  const backupPath = join(backupDir, filename);
  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    id: 1234547566,
    createdAt: 1234547566,
    startedAt: 1234547566,
    installedAt: 1234547566,
    status: 'installed',
    ports: [80],
    environments: [
      {
        key: 'BLOCKLET_APP_DIR',
        value: __dirname,
      },
    ],
    meta: {
      did,
      name: 'super blocklet',
      logo: 'logo.png',
    },
    children: [
      {
        status: 'installed',
        ports: [801],
        environments: [],
      },
    ],
  };

  const newBlockletBackup = () => {
    /**
     * @type {BlockletBackup}
     */
    const blockletBackup = new BlockletBackup({
      did,
    });
    blockletBackup.backupDir = backupDir;
    blockletBackup.blocklet = blocklet;
    blockletBackup.serverDir = __dirname;
    blockletBackup.securityContext = {
      encrypt: mock(() => 'encrypted'),
    };

    return blockletBackup;
  };

  describe('#export', () => {
    test('should work', async () => {
      const blockletBackup = newBlockletBackup();

      spyOn(blockletBackup, 'writeLogoFile').mockResolvedValue('logo.png');

      await blockletBackup.export();

      /** @type {import('@blocklet/server-js').BlockletState & {meta: {appLogo: string}} } */
      const finalBlocklet = readJSONSync(backupPath);

      // 检测父组件
      expect(finalBlocklet.id).toBeUndefined();
      expect(finalBlocklet.createdAt).toBeUndefined();
      expect(finalBlocklet.startedAt).toBeUndefined();
      expect(finalBlocklet.installedAt).toBeUndefined();

      expect(finalBlocklet.status).toBeUndefined();
      expect(finalBlocklet.ports).toBeUndefined();
      expect(finalBlocklet.environments).toBeUndefined();

      // 检测子组件
      expect(finalBlocklet.children[0].status).toBeUndefined();
      expect(finalBlocklet.children[0].ports).toBeUndefined();
      expect(finalBlocklet.children[0].environments).toBeUndefined();

      // 检测 meta.appLogo 是否有值
      expect(finalBlocklet.meta.appLogo).toEqual('logo.png');

      expect(ensureDir).toBeCalledWith(backupDir);
    });
  });

  describe('#getLogoStream', () => {
    it('should return stream if logoUrl is local url', async () => {
      const logoUrl = join(__dirname, 'logo.png');

      createReadStream.mockReturnValue('ok');

      const blockletBackup = newBlockletBackup();
      const stream = await blockletBackup.getLogoStream(logoUrl);

      expect(createReadStream).toBeCalledWith(logoUrl);

      expect(stream).toEqual('ok');
    });

    it('should return stream if logoUrl is http url', async () => {
      axios.get.mockResolvedValue({
        data: 'has value',
      });

      const logoUrl = 'https://test.store.blocklet.dev/.well-known/service/blocklet/logo';

      const blockletBackup = newBlockletBackup();
      const stream = await blockletBackup.getLogoStream(logoUrl);

      expect(axios.get).toBeCalledWith(logoUrl, {
        responseType: 'stream',
      });
      expect(stream).toEqual('has value');
    });

    it('should throw an error if logoUrl is empty', async () => {
      const logoUrl = '';
      const blockletBackup = newBlockletBackup();
      try {
        await blockletBackup.getLogoStream(logoUrl);
      } catch (error) {
        expect(error.message).toBe(`logoUrl(${logoUrl}) cannot be empty`);
      }
    });
  });

  describe('#encrypt', () => {
    it('should work when blocklet.migratedFrom is a array', () => {
      const blockletBackup = newBlockletBackup();

      expect(
        blockletBackup.encrypt(
          {
            migratedFrom: [
              {
                appSk: 'appSk',
              },
            ],
          },
          { salt: 'salt' }
        )
      ).toEqual({
        migratedFrom: [
          {
            appSk: 'encrypted',
          },
        ],
      });
    });

    it('should work when blocklet.migratedFrom is not a array', () => {
      const blockletBackup = newBlockletBackup();

      expect(blockletBackup.encrypt(undefined)).toEqual(undefined);
      expect(blockletBackup.encrypt({})).toEqual({});
    });
  });

  describe('#writeLogoFile', () => {
    it('should return targetLogoPath', async () => {
      const blockletBackup = newBlockletBackup();

      getLogoUrl.mockReturnValue(join(__dirname, blocklet.meta.logo));
      spyOn(blockletBackup, 'getLogoStream').mockImplementation(() => {
        return {
          pipe: () => 'ok',
        };
      });
      createWriteStream.mockReturnValue('ok');
      streamToPromise.mockResolvedValue('ok');

      const targetLogoPath = await blockletBackup.writeLogoFile();

      expect(getLogoUrl).toBeCalled();
      expect(targetLogoPath).toEqual(join(__dirname, 'data', blocklet.meta.logo));
    });
  });

  afterEach(() => {
    if (existsSync(backupPath)) {
      removeSync(backupPath);
    }
  });
});
