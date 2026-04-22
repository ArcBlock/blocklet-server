const { it, expect, describe } = require('bun:test');
const { validateNodeInfo } = require('../../lib/validators/node');

describe('validator.nodeInfo', () => {
  it('should return error on empty name', async () => {
    try {
      await validateNodeInfo({ name: '', description: '' });
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('should return valid on empty web wallet url and register url', async () => {
    const data = {
      name: '1',
      description: '2',
      enableDocker: false,
      enableDockerNetwork: false,
      isDockerInstalled: false,
      enableSessionHardening: false,
      webWalletUrl: '',
      registerUrl: '',
    };
    const result = await validateNodeInfo(data);
    expect(result).toEqual(data);
  });

  it('should return valid on valid web wallet url and register url', async () => {
    const data = {
      name: '1',
      description: '2',
      enableDocker: false,
      enableDockerNetwork: false,
      isDockerInstalled: false,
      enableSessionHardening: false,
      webWalletUrl: 'http://web.abtwallet.io',
      registerUrl: 'http://launcher.arcblock.io',
    };
    const result = await validateNodeInfo(data);
    expect(result).toEqual(data);
  });
});
