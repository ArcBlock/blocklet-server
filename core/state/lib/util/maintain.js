/* eslint-disable no-param-reassign */
const sleep = require('@abtnode/util/lib/sleep');
const SysInfo = require('systeminformation');
const { NODE_MODES, NODE_MAINTAIN_PROGRESS, EVENTS } = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:maintain');

const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const states = require('../states');
const { doRpcCall, startRpcServer } = require('./rpc');

const lock = new DBCache(() => ({
  prefix: 'node-upgrade-lock',
  ttl: 1000 * 10,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const triggerMaintain = async ({ action, next }) => {
  if (['upgrade', 'restart'].includes(action) === false) {
    throw new Error(`Unrecognized server maintain action: ${action}`);
  }

  const info = await states.node.read();

  if (action === 'upgrade') {
    if (!info.nextVersion) {
      throw new Error('Do nothing since there is no next version to upgrade');
    }

    // ensure we have enough memory for upgrading since the upgrading will consume a lot of memory
    const { mem } = await SysInfo.get({ mem: '*' });
    const freeMemory = mem.free / 1024 / 1024;
    const availableMemory = mem.available / 1024 / 1024;
    if (freeMemory < 200 && availableMemory < 300) {
      throw new Error('Upgrade aborted because free memory not enough, please stop some blocklets and try again');
    }
  }

  const from = info.version;
  const to = action === 'upgrade' ? info.nextVersion : info.version;

  // ensure we have an maintain session, we need a session to recover from crash
  let sessionId = info.upgradeSessionId;
  if (!sessionId) {
    const result = await states.session.start({
      action,
      from,
      to,
      stage: NODE_MAINTAIN_PROGRESS.SETUP,
      history: [],
      startedAt: Date.now(),
    });
    sessionId = result.id;
    logger.info(`generate new session for ${action}`, { from, to, sessionId });
    await states.node.updateNodeInfo({ upgradeSessionId: sessionId });
  }
  const session = await states.session.read(sessionId);
  if (!session) {
    throw new Error(`${action} aborted due to invalid session: ${sessionId}`);
  }

  await startRpcServer();

  process.nextTick(async () => {
    await next(session);
  });

  return sessionId;
};

const resumeMaintain = async (session) => {
  await lock.acquire('lock');

  try {
    const sessionId = session.id;
    const { action, from, to } = session;

    const goNextState = async (stage, previousSucceed) => {
      session = await states.session.update(sessionId, {
        stage,
        history: [...(session.history || []), { stage: session.stage, succeed: previousSucceed }],
      });
      // Emit events so client will keep up
      states.node.emit(EVENTS.NODE_MAINTAIN_PROGRESS, session);
    };

    // 1. enter maintenance mode
    if (session.stage === NODE_MAINTAIN_PROGRESS.SETUP) {
      logger.info('enter maintenance mode', { from, to, sessionId });
      await states.node.enterMode(NODE_MODES.MAINTENANCE);
      if (action === 'upgrade') {
        await goNextState(NODE_MAINTAIN_PROGRESS.INSTALLING, true);
      }
      if (action === 'restart') {
        await goNextState(NODE_MAINTAIN_PROGRESS.VERIFYING, true);
      }
    }

    // 2. install new version
    if (session.stage === NODE_MAINTAIN_PROGRESS.INSTALLING) {
      const result = await doRpcCall({ command: 'install', version: to });
      logger.info('new version installed', { from, to, sessionId });
      if (result.code !== 0) {
        await sleep(3000);
      }
      await goNextState(NODE_MAINTAIN_PROGRESS.VERIFYING, result.code === 0);
    }

    // 2. verify new version
    if (session.stage === NODE_MAINTAIN_PROGRESS.VERIFYING) {
      const result = await doRpcCall({ command: 'verify', version: to });
      await sleep(3000);
      if (result.code === 0) {
        logger.info('new version verified', { from, to, sessionId });
        await goNextState(NODE_MAINTAIN_PROGRESS.RESTARTING, true);
      } else {
        logger.info('new version verify failed', { from, to, sessionId });
        await goNextState(NODE_MAINTAIN_PROGRESS.ROLLBACK, false);
      }
    }

    // 4. reset node.nextVersion/upgradeSessionId and exit maintenance mode
    if (session.stage === NODE_MAINTAIN_PROGRESS.ROLLBACK) {
      logger.info('rollback', { from, to, sessionId });
      await sleep(3000);
      await goNextState(NODE_MAINTAIN_PROGRESS.COMPLETE, true);
      await sleep(5000);
      await states.node.updateNodeInfo({ nextVersion: '', version: from, upgradeSessionId: '' });
      try {
        await states.node.exitMode(NODE_MODES.MAINTENANCE);
        await doRpcCall({ command: 'shutdown' });
      } catch (error) {
        logger.error('Failed to rollback', { error });
      }
      return;
    }

    // 3. restarting update version in node config and state
    if (session.stage === NODE_MAINTAIN_PROGRESS.RESTARTING) {
      logger.info('restart server', { from, to, sessionId });
      await sleep(3000);
      await goNextState(NODE_MAINTAIN_PROGRESS.CLEANUP, true);
      await sleep(3000);
      await doRpcCall({ command: 'restart', dataDir: process.env.ABT_NODE_DATA_DIR });
      return; // we should abort here and resume after restart
    }

    // 4. reset node.nextVersion/upgradeSessionId and exit maintenance mode
    if (session.stage === NODE_MAINTAIN_PROGRESS.CLEANUP) {
      logger.info('cleanup', { from, to, sessionId });
      await goNextState(NODE_MAINTAIN_PROGRESS.COMPLETE, true);
      await sleep(8000);
      await states.node.updateNodeInfo({ nextVersion: '', version: to, upgradeSessionId: '' });
      try {
        await states.node.exitMode(NODE_MODES.MAINTENANCE);
        await doRpcCall({ command: 'shutdown' });
      } catch (error) {
        logger.error('Failed to exit maintenance mode', { error });
      }
    }
  } finally {
    await lock.releaseLock('lock');
  }
};

const isBeingMaintained = async () => {
  const info = await states.node.read();
  if (!info.upgradeSessionId) {
    return false;
  }

  const session = await states.session.read(info.upgradeSessionId);
  if (!session) {
    return false;
  }

  if (session.action === 'upgrade' && !info.nextVersion) {
    return false;
  }

  return session;
};

module.exports = { resumeMaintain, triggerMaintain, isBeingMaintained };
