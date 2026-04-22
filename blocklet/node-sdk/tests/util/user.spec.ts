import { describe, it, expect } from 'bun:test';

import { fixAvatar } from '../../src/util/user';

describe('util/user', () => {
  it('should fix avatar', () => {
    const avatar = 'bn://avatar/1234567890';
    const fixedAvatar = fixAvatar(avatar);
    expect(fixedAvatar).toBe('/.well-known/service/user/avatar/1234567890');
  });

  it('should return original avatar if it is not a bn://avatar URL', () => {
    const avatar = 'https://example.com/avatar/1234567890';
    const fixedAvatar = fixAvatar(avatar);
    expect(fixedAvatar).toBe(avatar);
  });

  it('should return original avatar if it is not a string', () => {
    const avatar: any = null;
    const fixedAvatar = fixAvatar(avatar);
    expect(fixedAvatar).toBeNull();
  });

  it('should return original avatar if it is undefined', () => {
    const avatar: any = undefined;
    const fixedAvatar = fixAvatar(avatar);
    expect(fixedAvatar).toBeUndefined();
  });
});
