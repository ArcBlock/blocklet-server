import { nanoid } from '@blocklet/meta/lib/util';

import { getSender, _eventBus, ensureClient } from './notification';
import { checkBlockletEnvironment } from '../util/check-blocklet-env';
import { sendToEventBus } from '../util/send-notification';
import { validateEvent } from '../validators/event';
import { TEvent } from '../types/event';

export const subscribe = async (cb: (event: TEvent) => any | Promise<any>) => {
  await ensureClient();
  _eventBus.on('event', cb);
};

export const unsubscribe = (cb: (event: TEvent) => any | Promise<any>) => {
  _eventBus.off('event', cb);
};

export const publish = async (name: string, event: { id?: string; time?: string; data: any }) => {
  checkBlockletEnvironment();
  await ensureClient();

  const payload = {
    id: event.id || nanoid(),
    time: event.time || new Date().toISOString(),
    object_type: event.data.object_type || '',
    object_id: event.data.object_id || '',
    type: name,
    data: {
      type: 'application/json',
      ...event.data,
    },
    source: process.env.BLOCKLET_COMPONENT_DID,
    spec_version: '1.0.0',
  };

  const { error } = await validateEvent(payload);
  if (error) {
    throw new Error(`Invalid event: ${error}`);
  }

  return sendToEventBus(payload, getSender());
};

// NOTICE: Export as default to allow default import syntax
export default {
  subscribe,
  unsubscribe,
  publish,
};
