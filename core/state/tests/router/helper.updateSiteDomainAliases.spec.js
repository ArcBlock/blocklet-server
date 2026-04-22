/* eslint-disable import/order */
const { mock, describe, it, expect, beforeAll, afterAll, beforeEach } = require('bun:test');

const realBlockletUtil = require('../../lib/util/blocklet');

mock.module('../../lib/util/blocklet', () => ({
  ...realBlockletUtil,
  getBlockletDidDomainList: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const pm2 = require('@abtnode/util/lib/pm2/async-pm2');

const helper = require('../../lib/router/helper');
const { setupInstance, tearDownInstance } = require('../../tools/fixture');
const blockletUtil = require('../../lib/util/blocklet');

describe('helper.updateSiteDomainAliases', () => {
  let mockUpdateDomainAliasList;
  let instance = null;
  let helpers = null;

  beforeAll(async () => {
    instance = await setupInstance('helper-updateSiteDomainAliases');
    helpers = helper(instance);
  });

  afterAll(async () => {
    await tearDownInstance(instance);
    try {
      await pm2.deleteAsync('abt-node-router');
    } catch {
      // Do nothing
    }
  });

  beforeEach(() => {
    mock.clearAllMocks();
    mockUpdateDomainAliasList = mock();
    instance.states.site.updateDomainAliasList = mockUpdateDomainAliasList;
  });

  it('should update domain aliases when there are new aliases', async () => {
    // Arrange
    const existingSite = {
      id: 'test-site',
      domainAliases: [{ value: 'existing.domain.com', certificateId: 'existing-cert-id' }],
    };
    const blocklet = {
      name: 'test-blocklet',
    };
    const nodeInfo = {
      did: 'test-did',
    };
    blockletUtil.getBlockletDidDomainList.mockReturnValue([
      { value: 'existing.domain.com' },
      { value: 'new.domain.com' },
    ]);
    // Act
    await helpers.updateSiteDomainAliases(existingSite, blocklet, nodeInfo);
    // Assert
    expect(blockletUtil.getBlockletDidDomainList).toHaveBeenCalledWith(blocklet, nodeInfo);
    expect(mockUpdateDomainAliasList).toHaveBeenCalledWith('test-site', [
      { value: 'existing.domain.com', certificateId: 'existing-cert-id' },
      { value: 'new.domain.com' },
    ]);
  });

  it('should not update when domain aliases are identical', async () => {
    const existingSite = {
      id: 'test-site',
      domainAliases: [{ value: 'existing.domain.com' }],
    };
    const blocklet = {
      name: 'test-blocklet',
    };
    const nodeInfo = {
      did: 'test-did',
    };

    blockletUtil.getBlockletDidDomainList.mockReturnValue([{ value: 'existing.domain.com' }]);
    await helpers.updateSiteDomainAliases(existingSite, blocklet, nodeInfo);

    expect(blockletUtil.getBlockletDidDomainList).toHaveBeenCalledWith(blocklet, nodeInfo);
    expect(mockUpdateDomainAliasList).not.toHaveBeenCalled();
  });

  it('should handle empty domain aliases', async () => {
    const existingSite = {
      id: 'test-site',
      domainAliases: [],
    };
    const blocklet = {
      name: 'test-blocklet',
    };
    const nodeInfo = {
      did: 'test-did',
    };

    blockletUtil.getBlockletDidDomainList.mockReturnValue([{ value: 'new.domain.com' }]);
    await helpers.updateSiteDomainAliases(existingSite, blocklet, nodeInfo);

    expect(blockletUtil.getBlockletDidDomainList).toHaveBeenCalledWith(blocklet, nodeInfo);
    expect(mockUpdateDomainAliasList).toHaveBeenCalledWith('test-site', [{ value: 'new.domain.com' }]);
  });

  it('should handle null domain aliases', async () => {
    const existingSite = {
      id: 'test-site',
      domainAliases: null,
    };
    const blocklet = {
      name: 'test-blocklet',
    };
    const nodeInfo = {
      did: 'test-did',
    };

    blockletUtil.getBlockletDidDomainList.mockReturnValue([{ value: 'new.domain.com' }]);
    await helpers.updateSiteDomainAliases(existingSite, blocklet, nodeInfo);

    expect(blockletUtil.getBlockletDidDomainList).toHaveBeenCalledWith(blocklet, nodeInfo);
    expect(mockUpdateDomainAliasList).toHaveBeenCalledWith('test-site', [{ value: 'new.domain.com' }]);
  });
});
