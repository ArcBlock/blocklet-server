import { test, expect } from 'bun:test';
import {
  getAppPublicChannel,
  getAppPublicChannelRegex,
  getRelayChannel,
  getRelayChannelRegex,
  parseChannel,
  getComponentChannel,
  getComponentChannelRegex,
  getEventBusChannel,
  getEventBusChannelRegex,
} from '../src/channel';

test('getAppPublicChannel', () => {
  expect(getAppPublicChannel('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z')).toBe(
    'app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:public'
  );
});

test('getAppPublicChannelRegex', () => {
  expect(getAppPublicChannelRegex().test('app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:public')).toBeTruthy();
});

test('getRelayChannel', () => {
  expect(getRelayChannel('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z', 'abc')).toBe(
    'relay:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:abc'
  );
});

test('getRelayChannelRegex', () => {
  expect(getRelayChannelRegex().test('relay:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:abc')).toBeTruthy();
});

test('parseChannel', () => {
  expect(parseChannel('app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:public').type).toBe('APP');
  expect(parseChannel('app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:public').appDid).toBe(
    'z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z'
  );
  expect(parseChannel('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z').type).toBe('DID');
  expect(parseChannel('relay:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:abc').type).toBe('RELAY');
  expect(parseChannel('relay:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:abc').appDid).toBe(
    'z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z'
  );
  expect(parseChannel('relay:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:abc').topic).toBe('abc');
  expect(() => parseChannel('app:abc:public')).toThrowError('Invalid channel format');
  expect(() => parseChannel('app:123:abc')).toThrowError('Invalid channel format');
  expect(() => parseChannel('app')).toThrowError('Invalid channel format');
  expect(() => parseChannel('non-did-format')).toThrowError('Invalid channel format');
  expect(() => parseChannel('')).toThrowError('should not be empty');
});

test('getComponentChannel', () => {
  expect(getComponentChannel('appDid', 'componentDid')).toBe('component:appDid:componentDid');
});

test('getComponentChannelRegex', () => {
  expect(getComponentChannelRegex().test('component:appDid:componentDid')).toBeTruthy();
});

test('parse component channel', () => {
  const channel = 'component:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:z2qaBzdWPqdvRHVwB8c31EBgKVb63i6JJTexG';
  const channel2 = 'component:invalidAppDid:z2qaBzdWPqdvRHVwB8c31EBgKVb63i6JJTexG';
  const channel3 = 'component:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:invalidComponentDid';
  expect(parseChannel(channel).type).toBe('COMPONENT');
  expect(parseChannel(channel).appDid).toBe('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z');
  expect(parseChannel(channel).componentDid).toBe('z2qaBzdWPqdvRHVwB8c31EBgKVb63i6JJTexG');

  expect(() => parseChannel(channel2)).toThrow('Invalid appDid');
  expect(() => parseChannel(channel3)).toThrow('Invalid componentDid');
});

test('getEventBusChannelRegex', () => {
  expect(getEventBusChannelRegex().test('app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:eventbus')).toBeTruthy();
});

test('getEventBusChannel', () => {
  expect(getEventBusChannel('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z')).toBe(
    'app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:eventbus'
  );
});

test('parse eventbus channel', () => {
  const channel = 'app:z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z:eventbus';
  const channel2 = 'app:invalidAppDid:eventbus';
  expect(parseChannel(channel).type).toBe('EVENT_BUS');
  expect(parseChannel(channel).appDid).toBe('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z');

  expect(() => parseChannel(channel2)).toThrow('Invalid channel format');
});
