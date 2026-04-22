const { test, expect, describe, mock } = require('bun:test');
const { getStateCrons } = require('../../lib/util');

describe('getStateCrons', () => {
  test('should return cleanup-audit-logs cron', () => {
    const states = { auditLog: {}, blocklet: {} };
    const crons = getStateCrons(states);
    expect(crons).toHaveLength(1);
    expect(crons[0].name).toBe('cleanup-audit-logs');
    expect(crons[0].time).toBe('0 0 6 * * *');
  });

  test('should clean server audit logs with 90-day cutoff', async () => {
    const removeMock = mock(() => 5);
    const states = {
      auditLog: { remove: removeMock },
      blocklet: { getBlocklets: mock(() => []) },
    };
    const crons = getStateCrons(states);
    await crons[0].fn();

    expect(removeMock).toHaveBeenCalledTimes(1);
    const arg = removeMock.mock.calls[0][0];
    expect(arg.createdAt).toBeDefined();
    expect(arg.createdAt.$lt).toBeInstanceOf(Date);

    // Verify 90-day cutoff (allow 5s tolerance)
    const expectedCutoff = Date.now() - 1000 * 60 * 60 * 24 * 90;
    expect(Math.abs(arg.createdAt.$lt.getTime() - expectedCutoff)).toBeLessThan(5000);
  });

  test('should clean blocklet-level audit logs when teamManager is provided', async () => {
    const serverRemove = mock(() => 2);
    const blockletRemove = mock(() => 10);
    const blockletAuditLogState = { remove: blockletRemove };

    const states = {
      auditLog: { remove: serverRemove },
      blocklet: { getBlocklets: mock(() => [{ id: 'blocklet-1' }, { id: 'blocklet-2' }]) },
    };
    const teamManager = {
      getAuditLogState: mock(() => blockletAuditLogState),
    };

    const crons = getStateCrons(states, teamManager);
    await crons[0].fn();

    expect(serverRemove).toHaveBeenCalledTimes(1);
    expect(teamManager.getAuditLogState).toHaveBeenCalledTimes(2);
    expect(blockletRemove).toHaveBeenCalledTimes(2);
  });

  test('should handle errors from individual blocklet cleanup gracefully', async () => {
    const serverRemove = mock(() => 0);

    const states = {
      auditLog: { remove: serverRemove },
      blocklet: { getBlocklets: mock(() => [{ id: 'good-blocklet' }, { id: 'bad-blocklet' }]) },
    };
    const teamManager = {
      getAuditLogState: mock((did) => {
        if (did === 'bad-blocklet') {
          throw new Error('db not found');
        }
        return { remove: mock(() => 3) };
      }),
    };

    const crons = getStateCrons(states, teamManager);
    // Should not throw
    await crons[0].fn();
    expect(serverRemove).toHaveBeenCalledTimes(1);
  });

  test('should skip blocklet cleanup when teamManager is not provided', async () => {
    const serverRemove = mock(() => 0);
    const getBlocklets = mock(() => []);
    const states = {
      auditLog: { remove: serverRemove },
      blocklet: { getBlocklets },
    };

    const crons = getStateCrons(states);
    await crons[0].fn();

    expect(serverRemove).toHaveBeenCalledTimes(1);
    expect(getBlocklets).not.toHaveBeenCalled();
  });
});
