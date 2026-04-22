/* eslint-disable no-console */
const { describe, expect, test } = require('bun:test');
const isGitpod = require('../lib/is-gitpod');

describe('isGitpod', () => {
  test('should return is-gitpod as expected', () => {
    expect(isGitpod({ GITPOD_WORKSPACE_URL: 'true' })).toBeTruthy();
    expect(isGitpod()).toBeFalsy();
  });
});
