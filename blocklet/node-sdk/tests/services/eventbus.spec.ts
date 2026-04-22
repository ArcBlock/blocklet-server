import { fromRandom } from '@ocap/wallet';
import * as metaUtil from '@blocklet/meta/lib/util';
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { subscribe, unsubscribe, publish } from '../../src/service/eventbus';
import { _eventBus } from '../../src/service/notification';
import * as notification from '../../src/service/notification';
import * as eventValidator from '../../src/validators/event';
import * as sendNotificationUtil from '../../src/util/send-notification';

describe('eventbus', () => {
  let ensureClientSpy: ReturnType<typeof mock>;
  let sendToEventBusSpy: ReturnType<typeof mock>;
  let validateEventSpy: ReturnType<typeof mock>;
  let eventBusOnSpy: ReturnType<typeof mock>;
  let eventBusOffSpy: ReturnType<typeof mock>;

  beforeEach(() => {
    mock.restore();

    // Set up test environment variables
    process.env.BLOCKLET_COMPONENT_DID = 'test-did';
    process.env.BLOCKLET_APP_ID = 'test-app-id';
    process.env.BLOCKLET_APP_NAME = 'test-app-name';
    process.env.BLOCKLET_APP_DESCRIPTION = 'test-app-description';
    process.env.BLOCKLET_APP_SK = process.env.BLOCKLET_APP_SK || fromRandom().secretKey;
    process.env.BLOCKLET_APP_EK = 'test-app-ek';
    process.env.BLOCKLET_DID = 'test-blocklet-did';
    process.env.ABT_NODE_DID = 'test-node-did';
    process.env.ABT_NODE_PK = 'test-node-pk';
    process.env.ABT_NODE_PORT = '8080';
    process.env.ABT_NODE_SERVICE_PORT = '8081';
    process.env.BLOCKLET_MODE = 'test';

    // Mock the functions that make external calls
    ensureClientSpy = spyOn(notification, 'ensureClient').mockImplementation(() => Promise.resolve());
    sendToEventBusSpy = spyOn(sendNotificationUtil, 'sendToEventBus').mockResolvedValue({ success: true } as any);
    validateEventSpy = spyOn(eventValidator, 'validateEvent').mockResolvedValue({ error: null } as any);
    spyOn(metaUtil, 'nanoid').mockReturnValue('mock-nanoid');
    eventBusOnSpy = spyOn(_eventBus, 'on').mockImplementation(() => _eventBus as any);
    eventBusOffSpy = spyOn(_eventBus, 'off').mockImplementation(() => _eventBus as any);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('subscribe', () => {
    it('should subscribe to events', async () => {
      const callback = mock();
      await subscribe(callback);

      expect(ensureClientSpy).toHaveBeenCalled();
      expect(eventBusOnSpy).toHaveBeenCalledWith('event', callback);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from events', () => {
      const callback = mock();
      unsubscribe(callback);

      expect(eventBusOffSpy).toHaveBeenCalledWith('event', callback);
    });
  });

  describe('publish', () => {
    it('should publish event successfully', async () => {
      const mockDate = '2024-01-01T00:00:00.000Z';
      spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      const eventData = {
        data: {
          object_type: 'test-type',
          object_id: 'test-id',
          extra: 'data',
        },
      };

      await publish('test-event', eventData);

      expect(ensureClientSpy).toHaveBeenCalled();
      expect(validateEventSpy).toHaveBeenCalledWith({
        id: 'mock-nanoid',
        time: mockDate,
        object_type: 'test-type',
        object_id: 'test-id',
        type: 'test-event',
        data: {
          type: 'application/json',
          object_type: 'test-type',
          object_id: 'test-id',
          extra: 'data',
        },
        source: 'test-did',
        spec_version: '1.0.0',
      });
      expect(sendToEventBusSpy).toHaveBeenCalled();
    });

    it('should use provided id and time', async () => {
      const eventData = {
        id: 'custom-id',
        time: 'custom-time',
        data: {
          object_type: 'test-type',
          object_id: 'test-id',
        },
      };

      await publish('test-event', eventData);

      expect(validateEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom-id',
          time: 'custom-time',
        })
      );
    });

    it('should handle empty object_type and object_id', async () => {
      const eventData = {
        data: {
          someData: 'value',
        },
      };

      await publish('test-event', eventData);

      expect(validateEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          object_type: '',
          object_id: '',
        })
      );
    });

    it('should throw error when validation fails', async () => {
      validateEventSpy.mockResolvedValue({ error: 'Validation error' });

      const eventData = {
        data: {
          someData: 'value',
        },
      };

      await expect(publish('test-event', eventData)).rejects.toThrow('Invalid event: Validation error');
    });
  });
});
