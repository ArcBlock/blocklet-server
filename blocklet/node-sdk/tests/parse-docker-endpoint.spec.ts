import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import {
  parseDockerComponentHost,
  parseDockerComponentEndpoint,
  getServerHost,
} from '../src/util/parse-docker-endpoint';

beforeAll(() => {
  (globalThis as any).processEnv = { ...process.env };
});
afterAll(() => {
  process.env = (globalThis as any).processEnv;
});

describe('parseDockerComponentHost', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return parsed host for BLOCKLET_HOST', () => {
    process.env.BLOCKLET_DOCKER_NETWORK = 'docker-network-application-did';
    process.env.BLOCKLET_HOST = 'docker-network-host';
    const component = {
      title: 'Example Component',
      did: 'did:example:123456',
      version: '1.0.0',
      mountPoint: '/example',
      webEndpoint: 'http://example.com',
    };
    expect(parseDockerComponentHost(component)).toBe('blocklet-application-did-did-example-123456');
  });

  it('should return parsed host for BLOCKLET_HOST', () => {
    delete process.env.BLOCKLET_DOCKER_NETWORK;
    delete process.env.BLOCKLET_HOST;
    const component = {
      title: 'Example Component',
      did: 'did:example:123456',
      version: '1.0.0',
      mountPoint: '/example',
      webEndpoint: 'http://example.com',
    };
    expect(parseDockerComponentHost(component)).toBe('127.0.0.1');
  });

  it('should return 127.0.0.1 if BLOCKLET_DOCKER_NETWORK is host', () => {
    process.env.BLOCKLET_DOCKER_NETWORK = 'host';
    const component = {
      title: 'Example Component',
      did: 'did:example:123456',
      version: '1.0.0',
      mountPoint: '/example',
      webEndpoint: 'http://example.com',
    };
    expect(parseDockerComponentHost(component)).toBe('127.0.0.1');
  });

  it('should return 127.0.0.1 if BLOCKLET_DOCKER_NETWORK is not set', () => {
    delete process.env.BLOCKLET_DOCKER_NETWORK;
    const component = {
      title: 'Example Component',
      did: 'did:example:123456',
      version: '1.0.0',
      mountPoint: '/example',
      webEndpoint: 'http://example.com',
    };
    expect(parseDockerComponentHost(component)).toBe('127.0.0.1');
  });
});

describe('parseDockerComponentEndpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should replace host in endpoint when BLOCKLET_DOCKER_NETWORK is set', () => {
    process.env.BLOCKLET_DOCKER_NETWORK = 'docker-network-application-did';
    const component = {
      title: 'Example Component',
      did: 'did:example:123456',
      version: '1.0.0',
      mountPoint: '/example',
      webEndpoint: 'http://example.com',
    };
    const endpoint = 'http://127.0.0.1:8080';
    expect(parseDockerComponentEndpoint(endpoint, component)).toBe(
      'http://blocklet-application-did-did-example-123456:8080/'
    );
  });

  it('should empty host if endpoint is empty', () => {
    process.env.BLOCKLET_DOCKER_NETWORK = 'docker-network-application-did';
    const component = {
      title: 'Example Component',
      did: 'did:example:123456',
      version: '1.0.0',
      mountPoint: '',
      webEndpoint: '',
    };
    const endpoint = '';
    expect(parseDockerComponentEndpoint(endpoint, component)).toBe('');
  });
});

describe('getServerHost', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return BLOCKLET_HOST if set', () => {
    process.env.BLOCKLET_HOST = '192.168.0.1';
    expect(getServerHost()).toBe('192.168.0.1');
  });

  it('should return 127.0.0.1 if BLOCKLET_HOST is not set', () => {
    delete process.env.BLOCKLET_HOST;
    expect(getServerHost()).toBe('127.0.0.1');
  });
});
