const { describe, expect, beforeEach, mock, spyOn, it, afterAll } = require('bun:test');

mock.module('@blocklet/meta/lib/util-meta', () => ({
  getBlockletMetaFromUrls: mock(() => {}),
  getSourceUrlsFromConfig: mock(() => {}),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { getBlockletMetaFromUrls, getSourceUrlsFromConfig } = require('@blocklet/meta/lib/util-meta');
const { default: axios } = require('axios');
const { getAccessibleUrl, findMountPointConflicts } = require('../../../lib/commands/blocklet/dev');

describe('dev', () => {
  describe('getAccessibleUrl', () => {
    it('should return empty string when urls is empty', async () => {
      const mockGet = spyOn(axios, 'get');

      expect(await getAccessibleUrl()).toEqual('');
      expect(await getAccessibleUrl([])).toEqual('');
      expect(mockGet).toHaveBeenCalledTimes(0);

      mockGet.mockRestore();
    });

    it('should return custom domain name as a priority', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200 });
      const urls = [
        'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei.did.abtnet.io',
        'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei-192-168-0-10.ip.abtnet.io',
        'https://testabc.arcblock.io',
      ];

      const url = await getAccessibleUrl(urls);
      expect(url).toEqual('https://testabc.arcblock.io');
      expect(mockGet).toHaveBeenCalledTimes(urls.length);

      mockGet.mockRestore();
    });

    it('should return accessible url', async () => {
      const accessibleUrl = 'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei-192-168-0-10.ip.abtnet.io';
      const urls = [
        'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei.did.abtnet.io',
        accessibleUrl,
        'https://testabc.arcblock.io',
      ];
      const accessibleUrlObj = new URL(accessibleUrl);

      const mockGet = spyOn(axios, 'get').mockImplementation((url) => {
        if (new URL(url).hostname === accessibleUrlObj.hostname) {
          return { status: 200 };
        }

        throw new Error('404');
      });

      const url = await getAccessibleUrl(urls);
      expect(url).toEqual(accessibleUrl);
      expect(mockGet).toHaveBeenCalledTimes(urls.length);

      mockGet.mockRestore();
    });

    it('should return did domain url if no accessible url', async () => {
      const didUrl = 'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei.did.abtnet.io';
      const urls = [
        'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei-192-168-0-10.ip.abtnet.io',
        didUrl,
        'https://testabc.arcblock.io',
      ];

      const mockGet = spyOn(axios, 'get').mockImplementation(() => {
        throw new Error('404');
      });

      const url = await getAccessibleUrl(urls);
      expect(url).toEqual(didUrl);
      expect(mockGet).toHaveBeenCalledTimes(urls.length);

      mockGet.mockRestore();
    });

    it('should return first url if no accessible url and no did domain url', async () => {
      const urls = [
        'https://bbqas6qr5pmwozqe4dmndjmeb2i5dfqszgl2sfu3gei-192-168-0-10.ip.abtnet.io',
        'https://testabc.arcblock.io',
      ];

      const mockGet = spyOn(axios, 'get').mockImplementation(() => {
        throw new Error('404');
      });

      const url = await getAccessibleUrl(urls);
      expect(url).toEqual(urls[0]);
      expect(mockGet).toHaveBeenCalledTimes(urls.length);

      mockGet.mockRestore();
    });
  });

  describe('dev command mountPoint conflict detection', () => {
    beforeEach(() => {
      getBlockletMetaFromUrls.mockReset();
      getSourceUrlsFromConfig.mockReset();
    });

    it('should prevent components with same mountPoint', async () => {
      const meta = {
        did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt4mwm',
        title: 'Test App',
        components: [
          {
            mountPoint: '/comp1',
            did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt1',
            title: 'Component 1',
          },
          {
            mountPoint: '/comp2',
            did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt2',
            title: 'Component 2',
          },
          {
            mountPoint: '/comp2',
            did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt3',
            title: 'Component 3',
          },
        ],
      };

      const existedApp = {
        children: [
          {
            mountPoint: '/comp1',
            meta: {
              did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCtE',
              title: 'Component E',
            },
          },
        ],
      };

      const conflicts = await findMountPointConflicts(meta, existedApp);
      expect(conflicts).toHaveLength(2);
      expect(conflicts[0]).toContain(
        "'Component 1' attempted to mount on '/comp1', but it is already occupied by 'Component E'"
      );
      expect(conflicts[1]).toContain(
        "'Component 3' attempted to mount on '/comp2', but it is already occupied by 'Component 2'"
      );
    });

    it('should prevent root component with same mountPoint ', async () => {
      const meta = {
        mountPoint: '/root',
        did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt4mwm',
        title: 'Test App',
      };

      const existedApp = {
        children: [
          {
            mountPoint: '/root',
            meta: {
              did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCtE',
              title: 'Component E',
            },
          },
        ],
      };

      const conflicts = await findMountPointConflicts(meta, existedApp);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toContain(
        "'Test App' attempted to mount on '/root', but it is already occupied by 'Component E'"
      );
    });

    it('should allow root component with different mountPoint ', async () => {
      const meta = {
        mountPoint: '/root',
        did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt4mwm',
        title: 'Test App',
      };

      const existedApp = {
        children: [
          {
            mountPoint: '/other',
            meta: {
              did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCtE',
              title: 'Component E',
            },
          },
        ],
      };

      const conflicts = await findMountPointConflicts(meta, existedApp);
      expect(conflicts).toHaveLength(0);
    });

    it('should allow components without mountPoint', async () => {
      const meta = {
        did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt4mwm',
        title: 'Test App',
        components: [
          {
            // no mountPoint
            did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt1',
            title: 'Component 1',
          },
          {
            mountPoint: '/comp2',
            did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt2',
            title: 'Component 2',
          },
        ],
      };

      const existedApp = {
        children: [],
      };

      const conflicts = await findMountPointConflicts(meta, existedApp);
      expect(conflicts).toHaveLength(0);
    });

    it('should allow components without did', async () => {
      const meta = {
        did: 'z8ia1LrGPJHNNdwn8Gzt6dKz8emPGRbCt4mwm',
        title: 'Test App',
        components: [
          {
            name: 'Component 1',
            title: 'Component 1',
            mountPoint: '/comp1',
          },
          {
            name: 'Component 2',
            title: 'Component 2',
            mountPoint: '/comp2',
          },
        ],
      };

      getSourceUrlsFromConfig.mockImplementation((config) => {
        return [`/${config.name.replace(/ /g, '/')}`];
      });

      getBlockletMetaFromUrls.mockImplementation((urls) => {
        return {
          did: urls[0], // ex: '/component/1'
          title: `Component ${urls[0].split('/').pop()}`, // ex: 'Component 1'
        };
      });

      const existedApp = {
        children: [],
      };

      const conflicts = await findMountPointConflicts(meta, existedApp);
      expect(conflicts).toHaveLength(0);
    });
  });
});
