/* eslint-disable global-require */
/* eslint-disable import/order */
/* eslint-disable no-underscore-dangle */

const { describe, beforeEach, test, expect, mock, afterAll, beforeAll } = require('bun:test');
const os = require('os');
const path = require('path');
const getLogger = require('@abtnode/logger');

const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

mock.module('@arcblock/pm2-events', () => ({
  __esModule: true,
  default: function Pm2EventsMock() {
    this._on = null;
    this._error = null;

    this.on = (cb) => {
      this._on = cb;
      return this;
    };

    this.error = (cb) => {
      this._error = cb;
      return this;
    };

    this.emitEvent = (name, details) => {
      this._on?.(name, details);
    };

    this.emitError = (err) => {
      this._error?.(err);
    };
  },
}));

const PM2_HOME = path.join(os.homedir(), '.arcblock/abtnode-test');

describe('BlockletPm2Events', () => {
  let events;
  let logger;

  beforeAll(() => {
    process.env.PM2_HOME = PM2_HOME;
    logger = getLogger('@abtnode/core:pm2-events');
    logger.debug = mock(() => {});
    logger.error = mock(() => {});
    events = require('../../../lib/blocklet/manager/pm2-events');
  });

  beforeEach(() => {
    mock.clearAllMocks();
    events.pause();
  });

  afterAll(() => {
    mock.restore();
  });

  test('should not emit when paused', async () => {
    events.emit = mock(() => {});
    events.pm2Events.emitEvent('start', { process: { BLOCKLET_DID: 'test', PM2_HOME } });
    await sleep(0);
    expect(events.emit.mock.calls.length).toBe(0);
  });

  test('should emit when resumed and PM2_HOME matches', async () => {
    events.resume();
    events.emit = mock(() => {});
    events.pm2Events.emitEvent('start', {
      process: { BLOCKLET_DID: 'did:test', BLOCKLET_COMPONENT_DID: 'comp:x', PM2_HOME },
    });
    await sleep(0);
    expect(events.emit.mock.calls.length).toBe(1);
    const [eventName, payload] = events.emit.mock.calls[0];
    expect(eventName).toBe('start');
    expect(payload).toMatchObject({
      blockletDid: 'did:test',
      componentDid: 'comp:x',
    });
  });

  test('should not emit when PM2_HOME mismatched', async () => {
    events.resume();
    events.emit = mock(() => {});
    events.pm2Events.emitEvent('start', {
      process: { BLOCKLET_DID: 'test', PM2_HOME: '/wrong' },
    });
    await sleep(0);
    expect(events.emit.mock.calls.length).toBe(0);
  });

  test('should not emit when blockletDid missing', async () => {
    events.resume();
    events.emit = mock(() => {});
    events.pm2Events.emitEvent('start', { process: { PM2_HOME } });
    await sleep(0);
    expect(events.emit.mock.calls.length).toBe(0);
  });

  test('should log error when pm2 emits error', () => {
    const err = new Error('boom');
    events.pm2Events.emitError(err);
    expect(logger.error.mock.calls.length).toBe(1);
    expect(logger.error.mock.calls[0][0]).toBe('listen pm2 event error');
  });
});
