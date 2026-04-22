const { describe, test, expect, beforeAll, beforeEach, afterEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');
const { SERVER_ROLES } = require('@abtnode/constant');

const OrgState = require('../../lib/states/org');
const { setupInMemoryBlockletModels } = require('../../tools/fixture');

describe('OrgState', () => {
  let ownerDid = '';
  let userDid = '';

  let models = null;
  let state = null;

  beforeAll(async () => {
    models = await setupInMemoryBlockletModels();
    state = new OrgState(models.Org, {}, models);
  });

  beforeEach(async () => {
    const ownerWallet = fromRandom();
    ownerDid = ownerWallet.address;

    const userWallet = fromRandom();
    userDid = userWallet.address;

    // Create users in database to satisfy foreign key constraints
    await state.user.insert({ did: ownerDid, pk: ownerWallet.publicKey, fullName: 'Owner User' });
    await state.user.insert({ did: userDid, pk: userWallet.publicKey, fullName: 'Regular User' });
  });

  afterEach(async () => {
    await state.reset();
    await state.userOrgs.reset();
    await state.orgResource.reset();
    await state.passport.reset();
    await state.session.reset();
    await state.user.reset();
  });

  describe('Org Management', () => {
    test('create org with different scenarios', async () => {
      // Scenario 1: create org successfully with ownerDid
      const orgData = {
        name: 'Test Org',
        description: 'This is a test organization',
      };
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create(orgData, context);
      expect(org).toMatchObject({
        name: 'Test Org',
        description: 'This is a test organization',
        ownerDid,
      });
      expect(org.id).toBeDefined();
      const userOrg = await state.userOrgs.findOne({ where: { orgId: org.id, userDid: ownerDid } });
      expect(userOrg).toBeDefined();
      expect(userOrg.status).toBe('active');

      // Scenario 2: create org without ownerDid, should use context user
      const org2 = await state.create({ name: 'Test Org 2', description: 'Test description' }, context);
      expect(org2.ownerDid).toBe(ownerDid);

      // Scenario 3: non-SDK user cannot create org for another user
      await expect(
        state.create({ name: 'Test Org 3', description: 'Test description', ownerDid: userDid }, context)
      ).rejects.toThrow('You cannot create org for other users');

      // Scenario 4: SDK user can create org for another user
      const sdkContext = { user: { did: ownerDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      const org3 = await state.create(
        { name: 'Test Org 3', description: 'Test description', ownerDid: userDid },
        sdkContext
      );
      expect(org3.ownerDid).toBe(userDid);

      // Scenario 5: throw error when ownerDid is not provided and context user has no did
      await expect(
        state.create({ name: 'Test Org 4', description: 'Test description' }, { user: { role: 'owner' } })
      ).rejects.toThrow('Owner did is required');
    });

    test('updateOrg with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Original description', ownerDid }, context);

      // Scenario 1: owner can update org successfully
      const updatedOrg = await state.updateOrg(
        { org: { id: org.id, name: 'Updated Org', description: 'Updated description' } },
        context
      );
      expect(updatedOrg).toMatchObject({
        name: 'Updated Org',
        description: 'Updated description',
        ownerDid,
      });

      // Scenario 2: non-owner cannot update org
      const nonOwnerContext = { user: { did: userDid, role: 'user' } };
      await expect(
        state.updateOrg({ org: { id: org.id, name: 'Hacked Org', description: 'Hacked' } }, nonOwnerContext)
      ).rejects.toThrow("You cannot edit other user's org");
    });

    test('deleteOrg with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test description', ownerDid }, context);

      // Scenario 1: non-owner cannot delete org
      const nonOwnerContext = { user: { did: userDid, role: 'user' } };
      await expect(state.deleteOrg({ id: org.id }, nonOwnerContext)).rejects.toThrow(
        "You cannot delete other user's org"
      );

      // Scenario 2: owner can delete org successfully
      await state.deleteOrg({ id: org.id }, context);
      const deletedOrg = await state.findOne({ where: { id: org.id } });

      expect(deletedOrg).toBeUndefined();
    });

    test('get org with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test description', ownerDid }, context);

      // Scenario 1: owner can get org successfully
      const retrievedOrg = await state.get({ id: org.id }, context);
      expect(retrievedOrg).toMatchObject({ name: 'Test Org', description: 'Test description', ownerDid });

      // Scenario 2: org member can get org successfully
      await state.addOrgMember({ orgId: org.id, userDid, status: 'active' });
      const memberContext = { user: { did: userDid, role: 'user' } };
      const retrievedOrgByMember = await state.get({ id: org.id }, memberContext);
      expect(retrievedOrgByMember).toMatchObject({ name: 'Test Org', description: 'Test description', ownerDid });

      // Scenario 3: non-member cannot get org
      const anotherUserWallet = fromRandom();
      const anotherUserDid = anotherUserWallet.address;
      const nonMemberContext = { user: { did: anotherUserDid, role: 'user' } };
      await expect(state.get({ id: org.id }, nonMemberContext)).rejects.toThrow("You cannot access other user's org");

      // Scenario 4: throw error when org not found
      await expect(state.get({ id: 'non-existent-id' }, context)).rejects.toThrow('Org not found');
    });

    test('list orgs with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };

      // Scenario 1: list owned orgs
      await state.create({ name: 'Org 1', description: 'First org', ownerDid }, context);
      await state.create({ name: 'Org 2', description: 'Second org', ownerDid }, context);
      const ownedResult = await state.list({ type: 'owned', userDid: ownerDid }, context);
      expect(ownedResult.orgs).toHaveLength(2);
      expect(ownedResult.paging.total).toBe(2);

      // Scenario 2: list joined orgs
      const anotherOwnerWallet = fromRandom();
      const anotherOwnerDid = anotherOwnerWallet.address;
      const anotherContext = { user: { did: anotherOwnerDid, role: 'owner' } };
      await state.user.insert({
        did: anotherOwnerDid,
        pk: anotherOwnerWallet.publicKey,
        fullName: 'Another Owner User',
      });
      const joinedOrg = await state.create(
        { name: 'Joined Org', description: 'Joined org', ownerDid: anotherOwnerDid },
        anotherContext
      );
      await state.addOrgMember({ orgId: joinedOrg.id, userDid: ownerDid, status: 'active' });
      const joinedResult = await state.list({ type: 'joined', userDid: ownerDid }, context);
      expect(joinedResult.orgs).toHaveLength(1);
      expect(joinedResult.orgs[0].name).toBe('Joined Org');

      // Scenario 3: list all orgs (owned and joined)
      const allResult = await state.list({ type: '', userDid: ownerDid }, context);
      expect(allResult.orgs).toHaveLength(3);
      expect(allResult.paging.total).toBe(3);

      // Scenario 4: filter orgs by name
      const filteredResult = await state.list({ type: 'owned', userDid: ownerDid, org: { name: 'Org 1' } }, context);
      expect(filteredResult.orgs).toHaveLength(1);
      expect(filteredResult.orgs[0].name).toBe('Org 1');

      // Scenario 5: throw error when user is not logged in
      await expect(state.list({}, {})).rejects.toThrow('You are not logged in');

      // Scenario 6: non-SDK user cannot list other user's orgs
      await expect(state.list({ userDid: anotherOwnerDid }, context)).rejects.toThrow(
        "You cannot access other user's org"
      );

      // Scenario 7: SDK user can list other user's orgs
      const sdkContext = { user: { did: userDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      const sdkResult = await state.list({ type: 'owned', userDid: ownerDid }, sdkContext);
      expect(sdkResult.orgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Org User Management', () => {
    test('addOrgMember with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Scenario 1: successfully add member to org
      const member = await state.addOrgMember({ orgId: org.id, userDid, status: 'active' });
      expect(member).toBeDefined();
      expect(member.orgId).toBe(org.id);
      expect(member.userDid).toBe(userDid);
      expect(member.status).toBe('active');

      // Scenario 2: throw error when org not found
      await expect(state.addOrgMember({ orgId: 'non-existent-org', userDid, status: 'active' })).rejects.toThrow(
        'Org not found'
      );

      // Scenario 3: throw error when user not found
      await expect(
        state.addOrgMember({ orgId: org.id, userDid: 'non-existent-user', status: 'active' })
      ).rejects.toThrow('User not found');

      // Scenario 4: throw error when user already in org
      await expect(state.addOrgMember({ orgId: org.id, userDid, status: 'active' })).rejects.toThrow(
        'User already in the org, cannot add again'
      );
    });

    test('removeOrgMember with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Add a member first
      await state.addOrgMember({ orgId: org.id, userDid, status: 'active' });

      // Scenario 1: non-owner cannot remove member
      const nonOwnerWallet = fromRandom();
      const nonOwnerDid = nonOwnerWallet.address;
      await state.user.insert({ did: nonOwnerDid, pk: nonOwnerWallet.publicKey, fullName: 'Non Owner' });
      const nonOwnerContext = { user: { did: nonOwnerDid, role: 'user' } };
      await expect(state.removeOrgMember({ orgId: org.id, userDid }, nonOwnerContext)).rejects.toThrow(
        "You cannot remove members from other users' org"
      );

      // Scenario 2: owner cannot be removed from org
      await expect(state.removeOrgMember({ orgId: org.id, userDid: ownerDid }, context)).rejects.toThrow(
        'Owner cannot be removed from the org'
      );

      // Scenario 3: throw error when user not in org
      const anotherUserWallet = fromRandom();
      const anotherUserDid = anotherUserWallet.address;
      await state.user.insert({ did: anotherUserDid, pk: anotherUserWallet.publicKey, fullName: 'Another User' });
      await expect(state.removeOrgMember({ orgId: org.id, userDid: anotherUserDid }, context)).rejects.toThrow(
        'User not in the org, cannot remove'
      );

      // Scenario 4: owner successfully removes member
      await state.removeOrgMember({ orgId: org.id, userDid }, context);
      const userOrg = await state.userOrgs.findOne({ where: { orgId: org.id, userDid } });
      expect(userOrg).toBeUndefined();

      // Scenario 5: throw error when org or user not found
      await expect(state.removeOrgMember({ orgId: 'non-existent-org', userDid }, context)).rejects.toThrow(
        'Org or user not found'
      );
    });

    test('getOrgMembers with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Add a member
      await state.addOrgMember({ orgId: org.id, userDid, status: 'active' });

      // Scenario 1: owner can get org members
      const result = await state.getOrgMembers({ orgId: org.id, paging: { page: 1, pageSize: 10 } }, context);
      expect(result.users).toHaveLength(2); // owner + added member
      expect(result.paging).toBeDefined();
      expect(result.paging.total).toBe(2);

      // Scenario 2: org member can get org members
      const memberContext = { user: { did: userDid, role: 'user' } };
      const memberResult = await state.getOrgMembers(
        { orgId: org.id, paging: { page: 1, pageSize: 10 } },
        memberContext
      );
      expect(memberResult.users).toHaveLength(2);

      // Scenario 3: non-member cannot get org members
      const nonMemberWallet = fromRandom();
      const nonMemberDid = nonMemberWallet.address;
      await state.user.insert({ did: nonMemberDid, pk: nonMemberWallet.publicKey, fullName: 'Non Member' });
      const nonMemberContext = { user: { did: nonMemberDid, role: 'user' } };
      await expect(
        state.getOrgMembers({ orgId: org.id, paging: { page: 1, pageSize: 10 } }, nonMemberContext)
      ).rejects.toThrow("You cannot access other user's org");

      // Scenario 4: SDK user can get org members
      const sdkContext = { user: { did: nonMemberDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      const sdkResult = await state.getOrgMembers({ orgId: org.id, paging: { page: 1, pageSize: 10 } }, sdkContext);
      expect(sdkResult.users).toHaveLength(2);
    });

    test('updateOrgMember with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Add a member with pending status
      await state.addOrgMember({ orgId: org.id, userDid, status: 'pending' });

      // Scenario 1: successfully update member status
      await state.updateOrgMember({ orgId: org.id, userDid, status: 'active' });
      const userOrg = await state.userOrgs.findOne({ where: { orgId: org.id, userDid } });
      expect(userOrg.status).toBe('active');

      // Scenario 2: throw error when org not found
      await expect(state.updateOrgMember({ orgId: 'non-existent-org', userDid, status: 'inactive' })).rejects.toThrow(
        'Org not found'
      );

      // Scenario 3: throw error when user not found
      await expect(
        state.updateOrgMember({ orgId: org.id, userDid: 'non-existent-user', status: 'inactive' })
      ).rejects.toThrow('User not found');

      // Scenario 4: throw error when user not in org
      const anotherUserWallet = fromRandom();
      const anotherUserDid = anotherUserWallet.address;
      await state.user.insert({ did: anotherUserDid, pk: anotherUserWallet.publicKey, fullName: 'Another User' });
      await expect(state.updateOrgMember({ orgId: org.id, userDid: anotherUserDid, status: 'active' })).rejects.toThrow(
        'User not in the org, cannot update'
      );

      // Scenario 5: throw error when status is same
      await expect(state.updateOrgMember({ orgId: org.id, userDid, status: 'active' })).rejects.toThrow(
        'User not in the org, cannot update'
      );
    });

    test('getOrgInvitableUsers with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Create additional users that can be invited
      const invitableUser1Wallet = fromRandom();
      const invitableUser1Did = invitableUser1Wallet.address;
      await state.user.insert({
        did: invitableUser1Did,
        pk: invitableUser1Wallet.publicKey,
        fullName: 'Invitable User 1',
        approved: true,
      });

      const invitableUser2Wallet = fromRandom();
      const invitableUser2Did = invitableUser2Wallet.address;
      await state.user.insert({
        did: invitableUser2Did,
        pk: invitableUser2Wallet.publicKey,
        fullName: 'Invitable User 2',
        approved: true,
      });

      // Scenario 1: owner can get invitable users (should not include org members and unapproved users)
      const result = await state.getOrgInvitableUsers({ id: org.id, paging: { page: 1, pageSize: 10 } }, context);
      expect(result.users.length).toBeGreaterThanOrEqual(2);
      expect(result.paging).toBeDefined();
      // Should not include ownerDid or userDid who are already members
      const userDids = result.users.map((u) => u.did);
      expect(userDids).not.toContain(ownerDid);
      expect(userDids).toContain(invitableUser1Did);
      expect(userDids).toContain(invitableUser2Did);

      // Scenario 2: non-owner cannot get invitable users
      const nonOwnerContext = { user: { did: userDid, role: 'user' } };
      await expect(
        state.getOrgInvitableUsers({ id: org.id, paging: { page: 1, pageSize: 10 } }, nonOwnerContext)
      ).rejects.toThrow("You cannot access other user's org");

      // Scenario 3: throw error when org not found
      await expect(
        state.getOrgInvitableUsers({ id: 'non-existent-org', paging: { page: 1, pageSize: 10 } }, context)
      ).rejects.toThrow('Org not found');

      // Scenario 4: search users by name
      const searchResult = await state.getOrgInvitableUsers(
        { id: org.id, query: { search: 'Invitable' }, paging: { page: 1, pageSize: 10 } },
        context
      );
      expect(searchResult.users.length).toBeGreaterThanOrEqual(2);

      // Scenario 5: throw error when search text is too long
      await expect(
        state.getOrgInvitableUsers(
          { id: org.id, query: { search: 'a'.repeat(51) }, paging: { page: 1, pageSize: 10 } },
          context
        )
      ).rejects.toThrow('the length of search text should not more than 50');
    });

    test('removeInvitation with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Create invitation with multiple users
      const invitation = await state.session.insert({
        type: 'invite',
        __data: {
          orgId: org.id,
          inviteUserDids: [userDid, 'another-user-did'],
        },
      });

      // Scenario 1: remove specific user from invitation
      await state.removeInvitation({ userDid, orgId: org.id });
      const updatedInvitation = await state.session.findOne({ where: { id: invitation.id } });
      expect(updatedInvitation.__data.inviteUserDids).toHaveLength(1);
      expect(updatedInvitation.__data.inviteUserDids).not.toContain(userDid);

      // Scenario 2: remove last user should delete entire invitation
      await state.removeInvitation({ userDid: 'another-user-did', orgId: org.id });
      const deletedInvitation = await state.session.findOne({ where: { id: invitation.id } });
      expect(deletedInvitation).toBeUndefined();

      // Scenario 3: throw error when orgId is missing
      await expect(state.removeInvitation({ userDid })).rejects.toThrow('orgId is required');

      // Scenario 4: no error when no invitations found
      try {
        await state.removeInvitation({ userDid, orgId: org.id });
      } catch (error) {
        throw new Error(`should not throw error: ${error.message}`);
      }

      // Scenario 5: remove all invitations for org (without userDid)
      await state.session.insert({
        type: 'invite',
        __data: { orgId: org.id, inviteUserDids: ['user1', 'user2'] },
      });
      await state.session.insert({
        type: 'invite',
        __data: { orgId: org.id, inviteUserDids: ['user3', 'user4'] },
      });
      await state.removeInvitation({ orgId: org.id });
      const remainingInvitations = await state.session.find({
        where: { '__data.orgId': org.id, type: 'invite' },
      });
      expect(remainingInvitations).toHaveLength(0);

      // Scenario 6: throw error when user not in invitation list
      await state.session.insert({
        type: 'invite',
        __data: { orgId: org.id, inviteUserDids: ['other-user'] },
      });
      await expect(state.removeInvitation({ userDid: 'non-existent-user', orgId: org.id })).rejects.toThrow(
        'Invitation not found for user'
      );
    });
  });

  describe('Org Resource Management', () => {
    test('addOrgResource with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Scenario 1: owner successfully adds resources
      const result = await state.addOrgResource(
        {
          orgId: org.id,
          resourceIds: ['resource-1', 'resource-2', 'resource-3'],
          type: 'blocklet',
          metadata: { key: 'value' },
        },
        context
      );
      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.success).toContain('resource-1');
      expect(result.success).toContain('resource-2');
      expect(result.success).toContain('resource-3');

      // Scenario 2: adding duplicate resources should fail
      const duplicateResult = await state.addOrgResource(
        {
          orgId: org.id,
          resourceIds: ['resource-1', 'resource-4'],
          type: 'blocklet',
        },
        context
      );
      expect(duplicateResult.success).toHaveLength(1);
      expect(duplicateResult.success).toContain('resource-4');
      expect(duplicateResult.failed).toHaveLength(1);
      expect(duplicateResult.failed).toContain('resource-1');

      // Scenario 3: non-owner cannot add resources
      const nonOwnerContext = { user: { did: userDid, role: 'user' } };
      await expect(
        state.addOrgResource({ orgId: org.id, resourceIds: ['resource-5'], type: 'blocklet' }, nonOwnerContext)
      ).rejects.toThrow("You cannot add resources to other users' org");

      // Scenario 4: SDK user can add resources
      const sdkContext = { user: { did: userDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      const sdkResult = await state.addOrgResource(
        { orgId: org.id, resourceIds: ['resource-5'], type: 'blocklet' },
        sdkContext
      );
      expect(sdkResult.success).toHaveLength(1);
      expect(sdkResult.success).toContain('resource-5');

      // Scenario 5: throw error when org not found
      await expect(
        state.addOrgResource({ orgId: 'non-existent-org', resourceIds: ['resource-6'], type: 'blocklet' }, context)
      ).rejects.toThrow('Org not found');

      // Scenario 6: return empty arrays when no resourceIds provided
      const emptyResult = await state.addOrgResource({ orgId: org.id, resourceIds: [], type: 'blocklet' }, context);
      expect(emptyResult.success).toHaveLength(0);
      expect(emptyResult.failed).toHaveLength(0);
    });
    test('getOrgResource with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Add resources
      await state.addOrgResource(
        { orgId: org.id, resourceIds: ['resource-1', 'resource-2'], type: 'blocklet' },
        context
      );

      // Scenario 1: owner can get all org resources
      const allResources = await state.getOrgResource({ orgId: org.id }, context);
      expect(allResources).toHaveLength(2);

      // Scenario 2: owner can get specific resource
      const specificResource = await state.getOrgResource({ orgId: org.id, resourceId: 'resource-1' }, context);
      expect(specificResource).toHaveLength(1);
      expect(specificResource[0].resourceId).toBe('resource-1');

      // Scenario 3: org member can get org resources
      await state.addOrgMember({ orgId: org.id, userDid, status: 'active' });
      const memberContext = { user: { did: userDid, role: 'user' } };
      const memberResources = await state.getOrgResource({ orgId: org.id }, memberContext);
      expect(memberResources).toHaveLength(2);

      // Scenario 4: non-member cannot get org resources
      const nonMemberWallet = fromRandom();
      const nonMemberDid = nonMemberWallet.address;
      await state.user.insert({ did: nonMemberDid, pk: nonMemberWallet.publicKey, fullName: 'Non Member' });
      const nonMemberContext = { user: { did: nonMemberDid, role: 'user' } };
      await expect(state.getOrgResource({ orgId: org.id }, nonMemberContext)).rejects.toThrow(
        "You cannot access resources under other users' org"
      );

      // Scenario 5: SDK user can get org resources
      const sdkContext = { user: { did: nonMemberDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      const sdkResources = await state.getOrgResource({ orgId: org.id }, sdkContext);
      expect(sdkResources).toHaveLength(2);

      // Scenario 6: throw error when org not found
      await expect(state.getOrgResource({ orgId: 'non-existent-org' }, context)).rejects.toThrow('Org not found');
    });
    test('migrateOrgResource with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };

      // User A (ownerDid) creates two orgs
      const fromOrg = await state.create({ name: 'From Org', description: 'Source org', ownerDid }, context);
      const toOrg = await state.create({ name: 'To Org', description: 'Target org', ownerDid }, context);

      // Add resources to source org
      await state.addOrgResource(
        { orgId: fromOrg.id, resourceIds: ['resource-1', 'resource-2', 'resource-3'], type: 'blocklet' },
        context
      );

      // Add some resources to target org
      await state.addOrgResource({ orgId: toOrg.id, resourceIds: ['resource-4'], type: 'blocklet' }, context);

      // Scenario 1: throw error when from or to is missing
      await expect(
        state.migrateOrgResource({ from: fromOrg.id, resourceIds: ['resource-1'] }, context)
      ).rejects.toThrow('Both from and to parameters are required');

      await expect(state.migrateOrgResource({ to: toOrg.id, resourceIds: ['resource-1'] }, context)).rejects.toThrow(
        'Both from and to parameters are required'
      );

      // Scenario 2: throw error when target org not found
      await expect(
        state.migrateOrgResource({ from: fromOrg.id, to: 'non-existent-org', resourceIds: ['resource-1'] }, context)
      ).rejects.toThrow('Org not found');

      // Scenario 3: return empty arrays when resourceIds is empty or not array
      const emptyResult = await state.migrateOrgResource({ from: fromOrg.id, to: toOrg.id, resourceIds: [] }, context);
      expect(emptyResult.success).toHaveLength(0);
      expect(emptyResult.failed).toHaveLength(0);

      // Scenario 4: owner successfully migrates resources between their own orgs
      const result = await state.migrateOrgResource(
        { from: fromOrg.id, to: toOrg.id, resourceIds: ['resource-1', 'resource-2'] },
        context
      );
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.success).toContain('resource-1');
      expect(result.success).toContain('resource-2');

      // Verify resources are moved
      const fromResources = await state.getOrgResource({ orgId: fromOrg.id }, context);
      expect(fromResources).toHaveLength(1);
      expect(fromResources[0].resourceId).toBe('resource-3');

      const toResources = await state.getOrgResource({ orgId: toOrg.id }, context);
      expect(toResources).toHaveLength(3); // resource-4 + resource-1 + resource-2
      const toResourceIds = toResources.map((r) => r.resourceId);
      expect(toResourceIds).toContain('resource-1');
      expect(toResourceIds).toContain('resource-2');
      expect(toResourceIds).toContain('resource-4');

      // Scenario 5: migrate non-existent resources should create new bindings
      const newResourceResult = await state.migrateOrgResource(
        { from: fromOrg.id, to: toOrg.id, resourceIds: ['new-resource'] },
        context
      );
      expect(newResourceResult.success).toHaveLength(1);
      expect(newResourceResult.success).toContain('new-resource');

      const toResourcesAfter = await state.getOrgResource({ orgId: toOrg.id }, context);
      expect(toResourcesAfter).toHaveLength(4);

      // Scenario 6: non-owner cannot migrate resources to other user's org
      // Create another user's org
      const anotherUserWallet = fromRandom();
      const anotherUserDid = anotherUserWallet.address;
      await state.user.insert({ did: anotherUserDid, pk: anotherUserWallet.publicKey, fullName: 'Another User' });
      const anotherUserContext = { user: { did: anotherUserDid, role: 'owner' } };
      const anotherOrg = await state.create(
        { name: 'Another Org', description: 'Another user org', ownerDid: anotherUserDid },
        anotherUserContext
      );

      // Try to migrate from ownerDid's org to another user's org should fail
      await expect(
        state.migrateOrgResource({ from: fromOrg.id, to: anotherOrg.id, resourceIds: ['resource-3'] }, context)
      ).rejects.toThrow("You cannot migrate resources to other users' org");

      // Scenario 7: SDK user can migrate resources
      const sdkContext = { user: { did: userDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      const sdkResult = await state.migrateOrgResource(
        { from: fromOrg.id, to: toOrg.id, resourceIds: ['resource-3'] },
        sdkContext
      );
      expect(sdkResult.success).toHaveLength(1);
      expect(sdkResult.success).toContain('resource-3');
    });
    test('removeOrgResource with different scenarios', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Add resources first
      await state.addOrgResource(
        { orgId: org.id, resourceIds: ['resource-1', 'resource-2', 'resource-3'], type: 'blocklet' },
        context
      );

      // Scenario 1: owner successfully removes resources
      await state.removeOrgResource({ orgId: org.id, resourceIds: ['resource-1', 'resource-2'] }, context);
      const remainingResources = await state.getOrgResource({ orgId: org.id }, context);
      expect(remainingResources).toHaveLength(1);
      expect(remainingResources[0].resourceId).toBe('resource-3');

      // Scenario 2: non-owner cannot remove resources
      const nonOwnerContext = { user: { did: userDid, role: 'user' } };
      await expect(
        state.removeOrgResource({ orgId: org.id, resourceIds: ['resource-3'] }, nonOwnerContext)
      ).rejects.toThrow("You cannot remove resources from other users' org");

      // Scenario 3: SDK user can remove resources
      const sdkContext = { user: { did: userDid, role: SERVER_ROLES.BLOCKLET_SDK } };
      await state.removeOrgResource({ orgId: org.id, resourceIds: ['resource-3'] }, sdkContext);
      const afterSdkRemove = await state.getOrgResource({ orgId: org.id }, context);
      expect(afterSdkRemove).toHaveLength(0);

      // Scenario 4: throw error when org not found
      await expect(
        state.removeOrgResource({ orgId: 'non-existent-org', resourceIds: ['resource-1'] }, context)
      ).rejects.toThrow('Org not found');

      // Scenario 5: removing non-existent resources should not throw error
      await state.addOrgResource({ orgId: org.id, resourceIds: ['resource-4'], type: 'blocklet' }, context);
      try {
        await state.removeOrgResource({ orgId: org.id, resourceIds: ['non-existent-resource'] }, context);
      } catch (error) {
        throw new Error(`should not throw error: ${error.message}`);
      }
    });
  });

  // 基于外键约束进行删除测试
  describe('Data deletion with foreign key constraints', () => {
    test('deleting user should cascade delete their owned orgs', async () => {
      // Create a new user
      const testUserWallet = fromRandom();
      const testUserDid = testUserWallet.address;
      await state.user.insert({ did: testUserDid, pk: testUserWallet.publicKey, fullName: 'Test User' });

      const testUserContext = { user: { did: testUserDid, role: 'owner' } };

      // User creates orgs
      const org1 = await state.create(
        { name: 'Org 1', description: 'First org', ownerDid: testUserDid },
        testUserContext
      );
      const org2 = await state.create(
        { name: 'Org 2', description: 'Second org', ownerDid: testUserDid },
        testUserContext
      );

      // Add resources to orgs
      await state.addOrgResource(
        { orgId: org1.id, resourceIds: ['resource-1', 'resource-2'], type: 'blocklet' },
        testUserContext
      );
      await state.addOrgResource({ orgId: org2.id, resourceIds: ['resource-3'], type: 'blocklet' }, testUserContext);

      // Add members to org
      await state.addOrgMember({ orgId: org1.id, userDid: ownerDid, status: 'active' });

      // Verify orgs exist
      let orgs = await state.find({ where: { ownerDid: testUserDid } });
      expect(orgs).toHaveLength(2);

      // Delete the user
      await state.user.remove({ did: testUserDid });

      // Verify user is deleted
      const deletedUser = await state.user.findOne({ where: { did: testUserDid } });
      expect(deletedUser).toBeUndefined();

      // Verify orgs owned by the user are also deleted (cascade delete)
      orgs = await state.find({ where: { ownerDid: testUserDid } });
      expect(orgs).toHaveLength(0);

      // Verify org resources are deleted
      const org1Resources = await state.orgResource.find({ where: { orgId: org1.id } });
      expect(org1Resources).toHaveLength(0);

      const org2Resources = await state.orgResource.find({ where: { orgId: org2.id } });
      expect(org2Resources).toHaveLength(0);

      // Verify org members are deleted
      const org1Members = await state.userOrgs.find({ where: { orgId: org1.id } });
      expect(org1Members).toHaveLength(0);
    });

    test('deleting org should cascade delete related data (resources and members)', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };

      // Create org
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Add resources to org
      await state.addOrgResource(
        { orgId: org.id, resourceIds: ['resource-1', 'resource-2', 'resource-3'], type: 'blocklet' },
        context
      );

      // Add members to org
      await state.addOrgMember({ orgId: org.id, userDid, status: 'active' });

      // Create another member
      const member2Wallet = fromRandom();
      const member2Did = member2Wallet.address;
      await state.user.insert({ did: member2Did, pk: member2Wallet.publicKey, fullName: 'Member 2' });
      await state.addOrgMember({ orgId: org.id, userDid: member2Did, status: 'pending' });

      // Verify org and related data exist
      const orgBefore = await state.findOne({ where: { id: org.id } });
      expect(orgBefore).toBeDefined();

      const resourcesBefore = await state.orgResource.find({ where: { orgId: org.id } });
      expect(resourcesBefore).toHaveLength(3);

      const membersBefore = await state.userOrgs.find({ where: { orgId: org.id } });
      expect(membersBefore).toHaveLength(3); // owner + userDid + member2Did

      // Delete the org
      await state.deleteOrg({ id: org.id }, context);

      // Verify org is deleted
      const orgAfter = await state.findOne({ where: { id: org.id } });
      expect(orgAfter).toBeUndefined();

      // Verify org resources are deleted (cascade delete)
      const resourcesAfter = await state.orgResource.find({ where: { orgId: org.id } });
      expect(resourcesAfter).toHaveLength(0);

      // Verify org members are deleted (cascade delete)
      const membersAfter = await state.userOrgs.find({ where: { orgId: org.id } });
      expect(membersAfter).toHaveLength(0);

      // Verify users still exist (should not be deleted)
      const ownerStillExists = await state.user.findOne({ where: { did: ownerDid } });
      expect(ownerStillExists).toBeDefined();

      const userStillExists = await state.user.findOne({ where: { did: userDid } });
      expect(userStillExists).toBeDefined();

      const member2StillExists = await state.user.findOne({ where: { did: member2Did } });
      expect(member2StillExists).toBeDefined();
    });

    test('manually remove org related data (passports and invitations)', async () => {
      const context = { user: { did: ownerDid, role: 'owner' } };
      const org = await state.create({ name: 'Test Org', description: 'Test org', ownerDid }, context);

      // Helper function to create passport
      const createPassport = (did, name, role, orgId) =>
        state.passport.insert({
          id: fromRandom().address,
          userDid: did,
          name,
          title: name,
          role,
          status: 'valid',
          type: ['NFTPassport', 'VerifiableCredential'],
          issuer: { id: orgId, name: 'Test Org' },
        });

      // Test revokeUserPassportsByRoles
      const passport1 = await createPassport(ownerDid, 'admin-role', 'admin', org.id);
      const passport2 = await createPassport(userDid, 'member-role', 'member', org.id);
      const passport3 = await createPassport(ownerDid, 'viewer-role', 'viewer', org.id);

      // Revoke specific role for specific user
      await state.revokeUserPassportsByRoles({ roles: [{ name: 'admin-role' }], userDid: ownerDid });
      expect((await state.passport.findOne({ where: { id: passport1.id } })).status).toBe('revoked');
      expect((await state.passport.findOne({ where: { id: passport2.id } })).status).toBe('valid');

      // Revoke multiple roles for all users
      await state.revokeUserPassportsByRoles({ roles: [{ name: 'member-role' }, { name: 'viewer-role' }] });
      expect((await state.passport.findOne({ where: { id: passport2.id } })).status).toBe('revoked');
      expect((await state.passport.findOne({ where: { id: passport3.id } })).status).toBe('revoked');

      // Test removeOrgRelatedData
      const org2 = await state.create({ name: 'Test Org 2', description: 'Test org 2', ownerDid }, context);
      const org2Passport1 = await createPassport(ownerDid, 'org2-admin', 'admin', org2.id);
      const org2Passport2 = await createPassport(userDid, 'org2-member', 'member', org2.id);

      const org2Invitation = await state.session.insert({
        type: 'invite',
        __data: { orgId: org2.id, inviteUserDids: [userDid, ownerDid] },
      });

      // Remove specific user's data
      await state.removeOrgRelatedData({ roles: [{ name: 'org2-admin' }], orgId: org2.id, userDid: ownerDid });
      expect((await state.passport.findOne({ where: { id: org2Passport1.id } })).status).toBe('revoked');
      expect((await state.passport.findOne({ where: { id: org2Passport2.id } })).status).toBe('valid');

      const updatedInvitation = await state.session.findOne({ where: { id: org2Invitation.id } });
      expect(updatedInvitation.__data.inviteUserDids).toEqual([userDid]);

      // Remove all org related data
      await state.removeOrgRelatedData({ roles: [{ name: 'org2-member' }], orgId: org2.id });
      expect((await state.passport.findOne({ where: { id: org2Passport2.id } })).status).toBe('revoked');

      const remainingInvitations = await state.session.find({ where: { '__data.orgId': org2.id, type: 'invite' } });
      expect(remainingInvitations).toHaveLength(0);
    });
  });
});
