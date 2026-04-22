const { describe, expect, mock, it, afterAll } = require('bun:test');

mock.module('fs-extra', () => {
  return {
    existsSync: mock(),
  };
});

mock.module('../lib/axios', () => ({
  get: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { existsSync } = require('fs-extra');
const { join } = require('path');
const { getLogoUrl } = require('../lib/logo');
const axios = require('../lib/axios');

describe(__filename, () => {
  const remoteCustomLogoSquareUrl = 'https://bbqaycathbxnllrqihj5xsoqyiuoic7jl3jeguwgyy4.did.abtnet.io/logo.svg';
  const customLogoSquareUrl = __dirname;
  const appDir = __dirname;
  const dataDir = __dirname;
  const logo = 'logo.png';

  describe('#getLogoUrl', () => {
    it('should return customLogoSquareUrl when customLogoSquareUrl is remote url && request successfully!', async () => {
      axios.get.mockResolvedValue({
        data: 'not empty',
      });

      const url = await getLogoUrl({
        customLogoSquareUrl: remoteCustomLogoSquareUrl,
      });
      expect(url).toEqual(remoteCustomLogoSquareUrl);
    });

    it('should return customLogoSquareUrl when customLogoSquareUrl is remote url && request failed!', async () => {
      axios.get.mockRejectedValue(() => {
        throw new Error('api error');
      });

      const url = await getLogoUrl({
        customLogoSquareUrl: remoteCustomLogoSquareUrl,
      });
      expect(url).toBeUndefined();
    });

    it('should return localCustomLogoSquareUrl when localCustomLogoSquareUrl path exists', async () => {
      existsSync.mockReturnValue(true);

      const localCustomLogoSquareUrl = await getLogoUrl({
        dataDir,
        customLogoSquareUrl,
      });
      expect(localCustomLogoSquareUrl).toEqual(join(customLogoSquareUrl, customLogoSquareUrl));
    });

    it('should return metaLogoPath when logo path exists', async () => {
      existsSync.mockReturnValue(true);

      const url = await getLogoUrl({
        appDir,
        logo,
      });
      expect(url).toEqual(join(appDir, logo));
    });

    it('should return undefined when app not exists', async () => {
      const url = await getLogoUrl({
        logo,
      });
      expect(url).toBeUndefined();
    });

    it('should return undefined when all param is undefined', async () => {
      const url = await getLogoUrl({});
      expect(url).toBeUndefined();
    });
  });
});
