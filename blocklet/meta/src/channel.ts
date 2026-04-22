/* eslint-disable @typescript-eslint/indent */
import { isValid as isValidDid } from '@arcblock/did';

const getAppPublicChannelRegex = (): RegExp => /app:(\w+):public/;
const getComponentChannelRegex = (): RegExp => /component:(\w+):(\w+)/;
const getRelayChannelRegex = (): RegExp => /relay:(\w+):(\w+)/;
const getEventBusChannelRegex = (): RegExp => /app:(\w+):event/;

const getAppPublicChannel = (appDid: string): string => `app:${appDid}:public`;
const getComponentChannel = (appDid: string, componentDid: string): string => `component:${appDid}:${componentDid}`;
const getRelayChannel = (appDid: string, topic: string): string => `relay:${appDid}:${topic}`;
const getEventBusChannel = (appDid: string): string => `app:${appDid}:eventbus`;

const CHANNEL_TYPE = {
  DID: 'DID',
  APP: 'APP',
  COMPONENT: 'COMPONENT',
  RELAY: 'RELAY',
  EVENT_BUS: 'EVENT_BUS',
};

const parseChannel = (channel: string): { type: string; appDid?: string; topic?: string; componentDid?: string } => {
  if (!channel) {
    throw new Error('Channel should not be empty');
  }

  let match = getRelayChannelRegex().exec(channel);
  if (match && isValidDid(match[1])) {
    return {
      type: CHANNEL_TYPE.RELAY,
      appDid: match[1],
      topic: match[2],
    };
  }

  match = getEventBusChannelRegex().exec(channel);
  if (match && isValidDid(match[1])) {
    return {
      type: CHANNEL_TYPE.EVENT_BUS,
      appDid: match[1],
    };
  }

  match = getAppPublicChannelRegex().exec(channel);
  if (match && isValidDid(match[1])) {
    return {
      type: CHANNEL_TYPE.APP,
      appDid: match[1],
    };
  }

  match = getComponentChannelRegex().exec(channel);
  if (match) {
    if (!isValidDid(match[1])) {
      throw Error(`Invalid appDid in component channel: ${match[1]}`);
    }

    if (!isValidDid(match[2])) {
      throw Error(`Invalid componentDid in component channel: ${match[2]}`);
    }

    return {
      type: CHANNEL_TYPE.COMPONENT,
      appDid: match[1],
      componentDid: match[2],
    };
  }

  if (isValidDid(channel)) {
    return {
      type: CHANNEL_TYPE.DID,
    };
  }

  throw new Error(`Invalid channel format: ${channel}`);
};

export {
  CHANNEL_TYPE,
  getAppPublicChannel,
  getAppPublicChannelRegex,
  getComponentChannel,
  getComponentChannelRegex,
  getRelayChannel,
  getRelayChannelRegex,
  parseChannel,
  getEventBusChannel,
  getEventBusChannelRegex,
};

export default {
  CHANNEL_TYPE,
  getAppPublicChannel,
  getAppPublicChannelRegex,
  getComponentChannel,
  getComponentChannelRegex,
  getRelayChannel,
  getRelayChannelRegex,
  parseChannel,
  getEventBusChannel,
  getEventBusChannelRegex,
};
