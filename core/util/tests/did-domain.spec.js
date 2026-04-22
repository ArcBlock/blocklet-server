const { it, expect, describe, spyOn } = require('bun:test');
const { default: axios } = require('axios');

const { getDidDomainServiceURL, DID_DOMAIN_SERVICE_DID } = require('../lib/did-domain');

describe('did-domain', () => {
  describe('getDidDomainServiceURL', () => {
    it('should return null if url is empty', async () => {
      expect(await getDidDomainServiceURL()).toEqual(null);
      expect(await getDidDomainServiceURL(null)).toEqual(null);
      expect(await getDidDomainServiceURL('')).toEqual(null);
    });

    it('should return expected result', async () => {
      const mockAxiosGet = spyOn(axios, 'get').mockResolvedValue({
        data: {
          componentMountPoints: [
            {
              title: 'DID Domain',
              name: DID_DOMAIN_SERVICE_DID,
              did: DID_DOMAIN_SERVICE_DID,
              status: 'running',
              mountPoint: '/test-app',
              components: [],
            },
          ],
        },
      });

      const url = 'https://did-domain.blocklet.org';
      const result = await getDidDomainServiceURL(url);

      expect(result).toEqual({
        base: 'https://did-domain.blocklet.org/test-app',
        api: 'https://did-domain.blocklet.org/test-app/api',
        domain: 'https://did-domain.blocklet.org/test-app/api/domains',
      });

      expect(mockAxiosGet).toBeCalledTimes(1);
      mockAxiosGet.mockRestore();
    });
  });
});
