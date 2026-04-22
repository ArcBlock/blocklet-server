const { describe, test, expect, beforeAll, afterEach } = require('bun:test');
const { NOTIFICATION_SEND_CHANNEL } = require('@abtnode/constant');

const JobState = require('../../lib/states/job');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('JobState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new JobState(models.Job, {});
  });

  afterEach(async () => {
    await state.reset();
  });

  describe('getPendingNotifications', () => {
    test('should throw error when teamDids or channels is empty', async () => {
      await expect(
        state.getPendingNotifications({ teamDids: [], channels: [NOTIFICATION_SEND_CHANNEL.WALLET] })
      ).rejects.toThrow('teamDids and channels are required');

      await expect(state.getPendingNotifications({ teamDids: ['did:abt:test'], channels: [] })).rejects.toThrow(
        'teamDids and channels are required'
      );
    });

    test('should return correct pending counts for each channel', async () => {
      const teamDid1 = 'did:abt:team1';
      const teamDid2 = 'did:abt:team2';

      await models.Job.bulkCreate([
        { id: 'job1', queue: 'send-notification-wallet', entityId: teamDid1, job: { teamDid: teamDid1 } },
        { id: 'job2', queue: 'send-notification-wallet', entityId: teamDid2, job: { teamDid: teamDid2 } },
        { id: 'job3', queue: 'send-notification-email', entityId: teamDid1, job: { teamDid: teamDid1 } },
        { id: 'job4', queue: 'send-notification-push', entityId: teamDid2, job: { teamDid: teamDid2 } },
        { id: 'job5', queue: 'send-notification-wallet', entityId: 'other-team', job: { teamDid: 'other-team' } }, // should not count
      ]);

      const result = await state.getPendingNotifications({
        teamDids: [teamDid1, teamDid2],
        channels: [NOTIFICATION_SEND_CHANNEL.WALLET, NOTIFICATION_SEND_CHANNEL.EMAIL, NOTIFICATION_SEND_CHANNEL.PUSH],
      });

      expect(result[NOTIFICATION_SEND_CHANNEL.WALLET]).toBe(2);
      expect(result[NOTIFICATION_SEND_CHANNEL.EMAIL]).toBe(1);
      expect(result[NOTIFICATION_SEND_CHANNEL.PUSH]).toBe(1);
    });
  });
});
