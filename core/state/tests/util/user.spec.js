const { test, expect, describe } = require('bun:test');
const { generateUserUpdateData } = require('../../lib/util/user');

describe('user utilities', () => {
  describe('generateUserUpdateData', () => {
    // 创建一个丰富的固定 existingUser 对象，用于所有测试用例
    const existingUser = {
      did: 'did:example:abc123',
      name: 'Existing User',
      avatar: 'https://example.com/existing-avatar.png',
      email: 'existing@example.com',
      emailVerified: true,
      phone: '9876543210',
      phoneVerified: true,
      description: 'Existing user description',
      address: {
        country: 'China',
        province: 'Shanghai',
        city: 'Shanghai',
        line1: 'Building A',
        line2: 'Floor 1',
        postcode: '200120',
      },
      metadata: {
        bio: 'value1',
        location: 'Shanghai',
        phone: {
          country: 'CN',
          phoneNumber: '9876543210',
        },
      },
    };

    test('should throw error if existingUser is not provided', () => {
      const user = { did: 'did:example:123' };
      expect(() => generateUserUpdateData(user, null)).toThrow('User not found');
    });

    test('should correctly handle basic user information', () => {
      const user = {
        did: 'did:example:123',
        name: 'New Name',
        avatar: 'https://example.com/avatar.png',
      };

      const result = generateUserUpdateData(user, existingUser);

      expect(result.did).toBe('did:example:123');
      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('https://example.com/avatar.png');
      // 不涉及 metadata 的更新 应该和原来相同
      expect(result.metadata).toEqual(existingUser.metadata);
      // 不涉及 address 的更新 应该是 undefined
      expect(result.address).toBeUndefined();
    });

    test('should only update city in address while preserving other fields', () => {
      // 只修改城市
      const user = {
        did: 'did:example:123',
        address: { city: 'Beijing' },
      };

      const result = generateUserUpdateData(user, existingUser);

      // 验证城市已更新
      expect(result.address.city).toBe('Beijing');

      // 验证地址中的其他字段保持不变
      expect(result.address.country).toEqual(existingUser.address.country);
      expect(result.address.province).toEqual(existingUser.address.province);
      expect(result.address.line1).toEqual(existingUser.address.line1);
      expect(result.address.line2).toEqual(existingUser.address.line2);
      expect(result.address.postcode).toEqual(existingUser.address.postcode);

      // 验证 metadata.location 应该反映城市变化
      expect(result.metadata.location).toBe('Beijing');

      // 验证元数据中的其他字段保持不变
      expect(result.metadata.bio).toEqual(existingUser.metadata.bio);
      expect(result.metadata.phone).toEqual(existingUser.metadata.phone);
    });

    test('should preserve verified phone number', () => {
      // 通过 user.phone 更新
      const user = {
        did: 'did:example:123',
        phone: '1234567890',
      };

      const result = generateUserUpdateData(user, existingUser);

      // 已验证的电话号码不应该被修改
      expect(result.phone).toBeUndefined();
      // 已验证的电话号码应该与 metadata 中相同
      expect(result.metadata.phone.phoneNumber).toBe(existingUser.phone);

      // 通过 user.metadata.phone 更新
      const user2 = {
        did: 'did:example:123',
        metadata: {
          phone: {
            country: 'US',
            phoneNumber: '1234567890',
          },
        },
      };

      const result2 = generateUserUpdateData(user2, existingUser);
      expect(result2.metadata.phone.phoneNumber).toBe(existingUser.phone);
      expect(result2.phone).toBeUndefined();

      // 如果 user.phone 和 user.metadata.phone 都存在，则优先使用 user.phone 更新
      const user3 = {
        did: 'did:example:123',
        phone: '13542187569',
        metadata: {
          phone: {
            country: 'US',
            phoneNumber: '1234567890',
          },
        },
      };

      const result3 = generateUserUpdateData(user3, existingUser);
      expect(result3.metadata.phone.phoneNumber).toBe(existingUser.phone);
      expect(result3.phone).toBeUndefined();
    });

    test('should update phone when not verified', () => {
      // 创建一个未验证电话的用户副本
      const unverifiedPhoneUser = {
        ...existingUser,
        phoneVerified: false,
      };
      // 通过 user.phone 更新
      const user = {
        did: 'did:example:123',
        phone: '1234567890',
      };

      const result = generateUserUpdateData(user, unverifiedPhoneUser);

      expect(result.metadata.phone.phoneNumber).toBe('1234567890');
      expect(result.phone).toBe('1234567890');

      // 通过 user.metadata.phone 更新
      const user2 = {
        did: 'did:example:123',
        metadata: {
          phone: {
            country: 'US',
            phoneNumber: '1234567890',
          },
        },
      };

      const result2 = generateUserUpdateData(user2, unverifiedPhoneUser);
      expect(result2.metadata.phone.phoneNumber).toBe('1234567890');
      expect(result2.phone).toBe('1234567890');

      // 如果 user.phone 和 user.metadata.phone 都存在，则优先使用 user.phone 更新
      const user3 = {
        did: 'did:example:123',
        phone: '13542187569',
        metadata: {
          phone: {
            country: 'US',
            phoneNumber: '1234567890',
          },
        },
      };

      const result3 = generateUserUpdateData(user3, unverifiedPhoneUser);
      expect(result3.metadata.phone.phoneNumber).toBe('13542187569');
      expect(result3.phone).toBe('13542187569');
    });

    test('should handle email from metadata and respect emailVerified flag', () => {
      // 创建一个未验证邮箱的用户副本
      const unverifiedEmailUser = {
        ...existingUser,
        emailVerified: false,
      };

      // 通过 user.metadata.email更新
      const user = {
        did: 'did:example:123',
        metadata: {
          email: 'new@example.com',
        },
      };

      const result = generateUserUpdateData(user, unverifiedEmailUser);

      expect(result.email).toBe('new@example.com');
      expect(result.metadata.email).toBeUndefined();

      // 通过 user.email 更新
      const user2 = {
        did: 'did:example:123',
        email: 'user_email@example.com',
      };

      const result2 = generateUserUpdateData(user2, unverifiedEmailUser);

      expect(result2.email).toBe('user_email@example.com');
      expect(result2.metadata.email).toBeUndefined();
    });

    test('should preserve verified email', () => {
      // 通过 user.metadata.email更新
      const user = {
        did: 'did:example:123',
        metadata: {
          email: 'new@example.com',
        },
      };

      const result = generateUserUpdateData(user, existingUser);

      expect(result.email).toBeUndefined();
      expect(result.metadata.email).toBeUndefined();

      // 通过 user.email 更新
      const user2 = {
        did: 'did:example:123',
        email: 'user_email@example.com',
      };

      const result2 = generateUserUpdateData(user2, existingUser);

      expect(result2.email).toBeUndefined();
      expect(result2.metadata.email).toBeUndefined();
    });

    test('should handle complex combinations of fields correctly', () => {
      const user = {
        did: 'did:example:123',
        name: 'Complex User',
        phone: '1234567890',
        address: { city: 'Beijing' },
        metadata: {
          email: 'complex@example.com',
          bio: 'complex bio',
        },
      };

      const result = generateUserUpdateData(user, existingUser);

      expect(result.name).toBe('Complex User');

      const expectAddress = {
        ...existingUser.address,
        city: 'Beijing',
      };

      const expectMetadata = {
        ...existingUser.metadata,
        location: 'Beijing',
        bio: 'complex bio',
      };
      // 已验证的属性应保持不变
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.address).toEqual(expectAddress);
      expect(result.metadata).toEqual(expectMetadata);
      expect(result.metadata.email).toBeUndefined();
    });
  });
});
