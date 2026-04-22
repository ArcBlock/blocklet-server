const { describe, it, expect } = require('bun:test');
const { getScope } = require('../../lib/util/audit-log');

describe('audit-log utils', () => {
  describe('getScope', () => {
    it('should return correct scope based on priority: teamDid > rootDid > did', () => {
      // 测试优先级和各种场景
      const testCases = [
        [{ teamDid: 'team-123', rootDid: 'root-456', did: 'did-789' }, 'team-123'], // teamDid 优先
        [{ rootDid: 'root-456', did: 'did-789' }, 'root-456'], // rootDid 次之
        [{ did: 'did-789' }, 'did-789'], // did 字符串
        [{ did: ['did-111', 'did-222'] }, 'did-111'], // did 数组取第一个
        [{ did: [] }, undefined], // 空数组
        [{}, null], // 空对象
        [undefined, null], // undefined
        [{ someOtherParam: 'value' }, null], // 无效参数
        [{ teamDid: null, rootDid: null, did: null }, null], // null 值
      ];

      testCases.forEach(([input, expected]) => {
        expect(getScope(input)).toBe(expected);
      });
    });
  });
});
