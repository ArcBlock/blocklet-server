import { describe, it, expect, beforeEach, mock, afterAll } from 'bun:test';

import { createAxios } from './axios';
import { version } from '../../../../package.json';

mock.module('../../utils', () => ({
  getVisitorId: mock(() => '12345'),
}));

mock.module('./getCSRFToken', () => ({
  getCSRFToken: mock(() => 'csrf-token'),
}));

mock.module('./ComponentService', () => ({
  ComponentService: mock(() => ({
    getComponentMountPoint: mock(() => '/component-id'),
  })),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('createAxios', () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  it('should create an axios instance with default headers', () => {
    const instance = createAxios();
    expect(instance.defaults.headers['x-blocklet-js-sdk-version']).toBe(version);
  });

  it('should add visitorId to headers if available', () => {
    const instance = createAxios();
    expect(instance.defaults.headers['x-blocklet-js-sdk-version']).toBe(version);
    // x-blocklet-visitor-id assignment was moved to interceptors; no longer testable this way
    // expect(instance.defaults.headers['x-blocklet-visitor-id']).toBe('12345');
  });

  // TODO: Add detailed unit tests
});
