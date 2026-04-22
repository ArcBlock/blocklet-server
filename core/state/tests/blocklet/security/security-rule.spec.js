const { describe, it, expect } = require('bun:test');
const { parseUpdateBlockletSecurityRule } = require('../../../lib/blocklet/security/security-rule');

describe('parseUpdateBlockletSecurityRule', () => {
  const defaultData = {
    pathPattern: '*',
    priority: 1,
    responseHeaderPolicyId: 'testResponseHeaderPolicyId',
    accessPolicyId: 'testAccessPolicyId',
    enabled: true,
    remark: 'test remark',
  };
  it('should update blocklet security rule', async () => {
    const { value, error } = await parseUpdateBlockletSecurityRule({
      ...defaultData,
      id: 'test',
      componentDid: 'test',
    });
    expect(error).toBeFalsy();
    expect(value).toEqual({
      ...defaultData,
      id: 'test',
      componentDid: 'test',
    });
  });

  it('should update blocklet security rule with default id', async () => {
    const { value, error } = await parseUpdateBlockletSecurityRule({ ...defaultData, id: 'default' });
    expect(error).toBeFalsy();
    expect(value).toEqual({
      ...defaultData,
      id: 'default',
    });
  });
  it('should update blocklet security rule with default id (strip componentDid)', async () => {
    const { value, error } = await parseUpdateBlockletSecurityRule({
      ...defaultData,
      id: 'default',
      componentDid: 'test',
    });
    expect(error).toBeFalsy();
    expect(value).toEqual({
      ...defaultData,
      id: 'default',
    });
  });
});
