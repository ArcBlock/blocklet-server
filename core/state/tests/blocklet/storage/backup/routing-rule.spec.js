const { test, expect, describe, mock, afterAll } = require('bun:test');
const realFs = require('fs-extra');

mock.module('../../../../lib/states', () => ({
  site: {
    findOne: mock(() => []),
  },
}));

mock.module('fs-extra', () => {
  return {
    ...realFs,
    outputJson: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { outputJson } = require('fs-extra');
const { join } = require('path');
const { RoutingRuleBackup } = require('../../../../lib/blocklet/storage/backup/routing-rule');
const states = require('../../../../lib/states');

describe(__filename, () => {
  const filename = 'routing_rule.json';
  const serverDir = __dirname;
  const backupDir = join(__dirname);
  const did = 'znkomkclejcfbjaxw9knzzebmzmqrxjnn9bb';
  /** @type {import('@blocklet/server-js').BlockletState} */
  const blocklet = {
    meta: {
      did,
    },
  };

  const newRoutingRuleBackup = () => {
    /**
     * @type {RoutingRuleBackup}
     */
    const routingRuleBackup = new RoutingRuleBackup({
      did,
    });
    routingRuleBackup.backupDir = backupDir;
    routingRuleBackup.blocklet = blocklet;
    routingRuleBackup.serverDir = serverDir;
    routingRuleBackup.blockletWallet = {
      address: 'address',
      secretKey: 'secretKey',
    };

    return routingRuleBackup;
  };

  describe('#export', () => {
    test('should work', async () => {
      const routingRuleBackup = newRoutingRuleBackup();

      await routingRuleBackup.export();

      expect(states.site.findOne).toBeCalledWith({
        domain: `${blocklet.meta.did}.blocklet-domain-group`,
      });

      expect(outputJson).toBeCalledWith(join(backupDir, filename), []);
    });
  });
});
