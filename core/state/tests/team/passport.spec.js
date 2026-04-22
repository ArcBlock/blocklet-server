const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const path = require('path');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletEvents } = require('@blocklet/constant');
const sleep = require('@abtnode/util/lib/sleep');

const { setupInstance, tearDownInstance } = require('../../tools/fixture');

const appWallet = fromRandom({ role: types.RoleType.ROLE_APPLICATION });
const appDid = appWallet.address;
const appSk = appWallet.secretKey;

describe('Team Passport issuance session', () => {
  let instance = null;
  let teamAPI = null;
  let context = {};
  let nodeDid = '';
  let userDid = '';
  let installStaticDemo = () => {};
  let removeStaticDemo = () => {};
  let blockletInstalled = false;
  const staticDemoDid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';

  beforeAll(async () => {
    instance = await setupInstance('team-passport');
    teamAPI = instance.teamAPI;
    context = {
      hostname: 'test.abtnode.com',
      user: {
        did: fromRandom().address,
      },
    };
    nodeDid = (await instance.states.node.read()).did;

    const manager = instance.blockletManager;

    installStaticDemo = async () => {
      if (blockletInstalled) return;
      const url = `file://${path.join(__dirname, `../assets/api/blocklets/${staticDemoDid}/blocklet.json`)}`;
      await manager.install({ url, appSk }, context);
      await new Promise((resolve) => manager.on(BlockletEvents.installed, resolve));
      blockletInstalled = true;
    };

    removeStaticDemo = async (keepData = false) => {
      if (!blockletInstalled) return;
      const blocklet = await instance.states.blocklet.getBlocklet(appDid);
      if (blocklet) {
        await manager.delete({ did: appDid, keepData });
        blockletInstalled = false;
      }
    };

    userDid = fromRandom().address;
  });

  afterAll(async () => {
    await removeStaticDemo();
    await tearDownInstance(instance);
  });

  describe('Passport issuance session', () => {
    test('Api should be a function', () => {
      expect(typeof teamAPI.createPassportIssuance).toEqual('function');
      expect(typeof teamAPI.getPassportIssuances).toEqual('function');
      expect(typeof teamAPI.processPassportIssuance).toEqual('function');
      expect(typeof teamAPI.deletePassportIssuance).toEqual('function');
    });

    test('Should create and delete issuance session for abtnode', async () => {
      const res = await teamAPI.createPassportIssuance(
        { teamDid: nodeDid, ownerDid: userDid, name: 'member' },
        context
      );

      expect(typeof res.id).toBe('string');
      expect(res.name).toBe('member');
      expect(res.title).toBe('Member');
      expect(res.ownerDid).toBe(userDid);
      expect(res.teamDid).toBe(nodeDid);

      await teamAPI.deletePassportIssuance({ teamDid: nodeDid, sessionId: res.id });
    });

    test('Should create and delete passport issuance session for blocklet', async () => {
      await installStaticDemo();
      try {
        const res = await teamAPI.createPassportIssuance(
          { teamDid: appDid, ownerDid: userDid, name: 'member' },
          context
        );

        expect(typeof res.id).toBe('string');
        expect(res.name).toBe('member');
        expect(res.title).toBe('Member');
        expect(res.ownerDid).toBe(userDid);
        expect(res.teamDid).toBe(appDid);

        await teamAPI.deletePassportIssuance({ teamDid: appDid, sessionId: res.id });
      } finally {
        await removeStaticDemo();
      }
    });

    test('Should throw error if passport does not exist', async () => {
      await installStaticDemo();
      try {
        // should be failed
        await expect(
          teamAPI.createPassportIssuance({ teamDid: appDid, ownerDid: userDid, name: 'no-exist-role' }, context)
        ).rejects.toBeTruthy();

        // should be success
        await teamAPI.createRole({ teamDid: appDid, name: 'developer', title: 'Developer', description: 'desc' });
        const { id, name } = await teamAPI.createPassportIssuance(
          { teamDid: appDid, ownerDid: userDid, name: 'developer' },
          context
        );
        expect(name).toBe('developer');

        // should be failed
        await teamAPI.deleteRole({ teamDid: appDid, name: 'developer' });
        await expect(teamAPI.processPassportIssuance({ teamDid: appDid, sessionId: id })).rejects.toBeTruthy();
      } finally {
        await removeStaticDemo();
      }
    });

    test('Should throw error if sessionId does not exist', async () => {
      const { id } = await teamAPI.createPassportIssuance(
        { teamDid: nodeDid, ownerDid: userDid, name: 'member' },
        context
      );

      await expect(teamAPI.deletePassportIssuance({ teamDid: nodeDid })).rejects.toBeTruthy(); // session id should not be empty

      await teamAPI.deletePassportIssuance({ teamDid: nodeDid, sessionId: id });
    });

    test('Should get issuance sessions', async () => {
      const d1 = await teamAPI.getPassportIssuances({ teamDid: nodeDid });
      expect(d1.length).toBe(0);

      const { id } = await teamAPI.createPassportIssuance(
        { teamDid: nodeDid, ownerDid: userDid, name: 'member' },
        context
      );

      const d2 = await teamAPI.getPassportIssuances({ teamDid: nodeDid, ownerDid: userDid });
      expect(d2.length).toBe(1);
      expect(d2[0]).toMatchObject({ name: 'member' });

      const d3 = await teamAPI.getPassportIssuances({ teamDid: nodeDid, ownerDid: undefined });
      expect(d3.length).toBe(1);

      const d4 = await teamAPI.getPassportIssuances({ teamDid: nodeDid });
      expect(d4.length).toBe(1);

      await teamAPI.deletePassportIssuance({ teamDid: nodeDid, sessionId: id });
    });

    test('Should get issuance session', async () => {
      const { id } = await teamAPI.createPassportIssuance(
        { teamDid: nodeDid, ownerDid: userDid, name: 'member' },
        context
      );

      const d1 = await teamAPI.getPassportIssuance({ teamDid: nodeDid, sessionId: id });
      expect(d1.id).toBe(id);

      const d2 = await teamAPI.getPassportIssuance({ teamDid: nodeDid, sessionId: 'not-exist-id' });
      expect(d2).toBeFalsy();

      await teamAPI.deletePassportIssuance({ teamDid: nodeDid, sessionId: id });
    });

    test('Should process issue passport request', async () => {
      const { id } = await teamAPI.createPassportIssuance(
        { teamDid: nodeDid, ownerDid: userDid, name: 'member' },
        context
      );

      const res = await teamAPI.processPassportIssuance({ teamDid: nodeDid, sessionId: id });

      expect(res.name).toBe('member');
    });

    test('Should throw error if sessionId does not exist', async () => {
      await expect(teamAPI.processPassportIssuance({ teamDid: nodeDid, sessionId: 'no-exist' })).rejects.toBeTruthy();
    });

    test('Should throw error if passport name is empty', async () => {
      await expect(
        teamAPI.createPassportIssuance({ teamDid: nodeDid, ownerDid: userDid }, context)
      ).rejects.toBeTruthy();
    });

    test('Should throw error if ownerDid is invalid format', async () => {
      await expect(
        teamAPI.createPassportIssuance({ teamDid: nodeDid, ownerDid: 'error-format-did', name: 'member' }, context)
      ).rejects.toBeTruthy();
    });

    test('Should throw error if issuance session is expired', async () => {
      expect.assertions(1);

      teamAPI.setInviteExpireTime(10);
      const backup = teamAPI.memberInviteExpireTime;

      const { id } = await teamAPI.createPassportIssuance(
        { teamDid: nodeDid, ownerDid: userDid, name: 'member' },
        context
      );
      await sleep(15);
      await expect(teamAPI.processPassportIssuance({ teamDid: nodeDid, sessionId: id })).rejects.toBeTruthy();

      teamAPI.memberInviteExpireTime = backup;
    });
  });

  describe('Passport manage', () => {
    test('should revoke and enable trusted passports', async () => {
      const wallet = fromRandom();
      const user = {
        did: wallet.address,
        pk: wallet.publicKey,
        name: 'Bob',
      };

      const passport = {
        id: '1',
        type: ['NFTPassport', 'VerifiableCredential'],
        issuer: {
          id: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
          name: 'ArcBlock Team',
          pk: 'zH594bV5vaL4jjLKWq6eZ1ao3uLCFVUzyfr4RZRrcKc5y',
        },
        issuanceDate: '2022-11-21T03:40:32.731Z',
        endpoint: 'https://team.arcblock.io',
        name: 'admin',
        specVersion: '1.0.0',
        title: 'Admin',
        status: 'valid',
        role: 'admin',
        lastLoginAt: '2023-04-18T00:05:44.278Z',
      };

      await teamAPI.addUser({
        teamDid: nodeDid,
        user: {
          did: user.did,
          pk: user.pk,
          name: user.name,
          passports: [passport],
        },
      });

      const u1 = await teamAPI.getUser({ teamDid: nodeDid, user: { did: user.did } });
      expect(u1.passports[0].status).toBe('valid');

      await teamAPI.revokeUserPassport({ teamDid: nodeDid, userDid: user.did, passportId: '1' });
      const u2 = await teamAPI.getUser({ teamDid: nodeDid, user: { did: user.did } });
      expect(u2.passports[0].status).toBe('revoked');

      await teamAPI.enableUserPassport({ teamDid: nodeDid, userDid: user.did, passportId: '1' });
      const u3 = await teamAPI.getUser({ teamDid: nodeDid, user: { did: user.did } });
      expect(u3.passports[0].status).toBe('valid');

      await teamAPI.removeUserPassport({ teamDid: nodeDid, userDid: user.did, passportId: '1' });
      const u4 = await teamAPI.getUser({ teamDid: nodeDid, user: { did: user.did } });
      expect(u4.passports.length).toBe(0);
    });

    test('should issue passport to user', async () => {
      await installStaticDemo();
      try {
        const wallet = fromRandom();
        const user = {
          did: wallet.address,
          pk: wallet.publicKey,
          avatar: 'bn://avatar/bob.png',
          name: 'Bob',
        };

        const wallet2 = fromRandom();
        const user2 = {
          did: wallet2.address,
          pk: wallet2.publicKey,
          avatar: 'bn://avatar/alice.png',
          name: 'Alice',
        };

        const teamDid = appDid;

        await teamAPI.addUser({
          teamDid,
          user: {
            did: user.did,
            pk: user.pk,
            name: user.name,
            avatar: user.avatar,
            approved: true,
            passports: [],
          },
        });

        await teamAPI.addUser({
          teamDid,
          user: {
            did: user2.did,
            pk: user2.pk,
            name: user2.name,
            avatar: user.avatar,
            approved: false,
            passports: [],
          },
        });

        const res1 = await teamAPI.getUser({ teamDid, user: { did: user.did } });
        expect(res1.passports[0]).toBeUndefined();

        expect(
          teamAPI.issuePassportToUser({ teamDid, userDid: 'not-exist', role: 'admin', notify: false })
        ).rejects.toThrow('user does not exist');

        expect(
          teamAPI.issuePassportToUser({ teamDid, userDid: user2.did, role: 'admin', notify: false })
        ).rejects.toThrow('user is revoked');

        expect(
          teamAPI.issuePassportToUser({ teamDid, userDid: user.did, role: 'not-exist', notify: false })
        ).rejects.toThrow('passport does not exist');

        await teamAPI.issuePassportToUser({ teamDid, userDid: user.did, role: 'admin', notify: false });

        const res2 = await teamAPI.getUser({ teamDid, user: { did: user.did } });
        expect(res2.passports[0].name).toBe('admin');
        expect(res2.passports[0].title).toBe('Admin');
        expect(res2.passports[0].status).toBe('valid');
      } finally {
        await removeStaticDemo();
      }
    });
  });

  describe('Passport settings', () => {
    test('should config trusted passports', async () => {
      await installStaticDemo();
      try {
        const nodeInfo = await instance.nodeAPI.getInfo();
        expect(nodeInfo.trustedPassports).toEqual([]);

        const b1 = await instance.blockletManager.ensureBlocklet(appDid);
        expect(b1.trustedPassports).toEqual([]);

        // config trusted passports for node
        await teamAPI.configTrustedPassports({ teamDid: appDid, trustedPassports: [{ issuerDid: nodeDid }] });
        const b2 = await instance.blockletManager.ensureBlocklet(appDid);
        expect(b2.trustedPassports).toEqual([{ issuerDid: nodeDid }]);

        // did should be valid
        await expect(
          teamAPI.configTrustedPassports({ teamDid: appDid, trustedPassports: [{ issuerDid: 'invalid-did' }] })
        ).rejects.toBeTruthy();

        // config trusted passports for node
        await teamAPI.configTrustedPassports({ teamDid: nodeDid, trustedPassports: [{ issuerDid: appDid }] });
        const nodeInfo2 = await instance.nodeAPI.getInfo();
        expect(nodeInfo2.trustedPassports).toEqual([{ issuerDid: appDid }]);
      } finally {
        await removeStaticDemo();
      }
    });
  });
});
