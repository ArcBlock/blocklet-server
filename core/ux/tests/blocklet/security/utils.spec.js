import { describe, expect, it } from 'bun:test';
import { WHO_CAN_ACCESS } from '@abtnode/constant';
import {
  formartAccessPolicyParams,
  convertAccessPolicyParams,
  formatResponseHeaderPolicy,
  convertResponseHeaderPolicy,
  convertHeaderParams,
  formatHeaderParams,
  convertCORSParams,
  formatCORSParams,
} from '../../../src/blocklet/security/utils';

describe('formartAccessPolicyParams', () => {
  it('should format params with roles as null and reverse as false', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: null,
      reverse: false,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.ALL,
      roles: null,
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with roles as empty array and reverse as true', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: [],
      reverse: true,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.INVITED,
      roles: [],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with roles as [OWNER, ADMIN] and reverse as false', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN],
      reverse: false,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.ADMIN,
      roles: [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with custom roles and reverse as true', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: ['custom_role'],
      reverse: true,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: 'roles_reverse',
      roles: ['custom_role'],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with custom roles and reverse as false', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: ['custom_role'],
      reverse: false,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: 'roles',
      roles: ['custom_role'],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });
});

describe('formartAccessPolicyParams', () => {
  it('should format params with roles as null and reverse as false', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: null,
      reverse: false,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.ALL,
      roles: null,
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with roles as empty array and reverse as true', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: [],
      reverse: true,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.INVITED,
      roles: [],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with roles as [OWNER, ADMIN] and reverse as false', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN],
      reverse: false,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.ADMIN,
      roles: [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with custom roles and reverse as true', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: ['custom_role'],
      reverse: true,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: 'roles_reverse',
      roles: ['custom_role'],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });

  it('should format params with custom roles and reverse as false', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: ['custom_role'],
      reverse: false,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: 'roles',
      roles: ['custom_role'],
    };
    expect(formartAccessPolicyParams(params)).toEqual(expected);
  });
});

describe('convertAccessPolicyParams', () => {
  it('should convert params with whoCanAccess as ALL', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.ALL,
      roles: null,
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: null,
      reverse: false,
    };
    expect(convertAccessPolicyParams(params)).toEqual(expected);
  });

  it('should convert params with whoCanAccess as INVITED', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.INVITED,
      roles: [],
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: [],
      reverse: true,
    };
    expect(convertAccessPolicyParams(params)).toEqual(expected);
  });

  it('should convert params with whoCanAccess as ADMIN', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: WHO_CAN_ACCESS.ADMIN,
      roles: [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN],
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN],
      reverse: false,
    };
    expect(convertAccessPolicyParams(params)).toEqual(expected);
  });

  it('should convert params with whoCanAccess as roles_reverse', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: 'roles_reverse',
      roles: ['custom_role'],
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: ['custom_role'],
      reverse: true,
    };
    expect(convertAccessPolicyParams(params)).toEqual(expected);
  });

  it('should convert params with whoCanAccess as roles', () => {
    const params = {
      name: 'Test Policy',
      description: 'Test Description',
      whoCanAccess: 'roles',
      roles: ['custom_role'],
    };
    const expected = {
      name: 'Test Policy',
      description: 'Test Description',
      roles: ['custom_role'],
      reverse: false,
    };
    expect(convertAccessPolicyParams(params)).toEqual(expected);
  });
});
describe('formatCORSParams', () => {
  it('should format valid CORS params', () => {
    const params = {
      origin: { override: true, value: ['http://example.com'], smart: true },
      methods: 'GET,POST',
      allowedHeaders: { override: true, value: ['Content-Type'] },
      exposedHeaders: { override: true, value: ['Authorization'] },
      maxAge: 3600,
      optionsSuccessStatus: 204,
      preflightContinue: false,
      credentials: true,
    };
    const expected = {
      origin: { override: true, value: 'http://example.com', smart: true },
      methods: 'GET,POST',
      allowedHeaders: { override: true, value: 'Content-Type' },
      exposedHeaders: { override: true, value: 'Authorization' },
      maxAge: 3600,
      optionsSuccessStatus: 204,
      preflightContinue: false,
      credentials: true,
    };
    expect(formatCORSParams(params)).toEqual(expected);
  });

  it('should return undefined for invalid input', () => {
    expect(formatCORSParams(null)).toBeUndefined();
  });
});

describe('convertCORSParams', () => {
  it('should convert valid CORS params', () => {
    const params = {
      origin: { override: true, value: 'http://example.com', smart: true },
      methods: 'GET,POST',
      allowedHeaders: { override: true, value: 'Content-Type' },
      exposedHeaders: { override: true, value: 'Authorization' },
      maxAge: 3600,
      optionsSuccessStatus: 204,
      preflightContinue: false,
      credentials: true,
    };
    const expected = {
      origin: { override: true, value: ['http://example.com'], smart: true },
      methods: 'GET,POST',
      allowedHeaders: { override: true, value: ['Content-Type'] },
      exposedHeaders: { override: true, value: ['Authorization'] },
      maxAge: 3600,
      optionsSuccessStatus: 204,
      preflightContinue: false,
      credentials: true,
    };
    expect(convertCORSParams(params)).toEqual(expected);
  });

  it('should return undefined for invalid input', () => {
    expect(convertCORSParams(null)).toBeUndefined();
  });
});

describe('formatHeaderParams', () => {
  it('should format valid header params', () => {
    const params = {
      contentSecurityPolicy: "default-src 'self'",
      referrerPolicy: 'no-referrer',
      xFrameOptions: 'DENY',
      xPoweredBy: 'Express',
      xXssProtection: '1; mode=block',
    };
    const expected = {
      contentSecurityPolicy: "default-src 'self'",
      referrerPolicy: 'no-referrer',
      xFrameOptions: 'DENY',
      xPoweredBy: 'Express',
      xXssProtection: '1; mode=block',
    };
    expect(formatHeaderParams(params)).toEqual(expected);
  });

  it('should return undefined for invalid input', () => {
    expect(formatHeaderParams(null)).toBeUndefined();
  });
});

describe('convertHeaderParams', () => {
  it('should convert valid header params', () => {
    const params = {
      contentSecurityPolicy: "default-src 'self'",
      referrerPolicy: 'no-referrer',
      xFrameOptions: 'DENY',
      xPoweredBy: 'Express',
      xXssProtection: '1; mode=block',
    };
    const expected = {
      contentSecurityPolicy: "default-src 'self'",
      referrerPolicy: 'no-referrer',
      xFrameOptions: 'DENY',
      xPoweredBy: 'Express',
      xXssProtection: '1; mode=block',
    };
    expect(convertHeaderParams(params)).toEqual(expected);
  });

  it('should return undefined for invalid input', () => {
    expect(convertHeaderParams(null)).toBeUndefined();
  });
});

describe('formatResponseHeaderPolicy', () => {
  it('should format valid response header policy', () => {
    const data = {
      securityHeader: '{"contentSecurityPolicy":"default-src \'self\'"}',
      cors: '{"origin":{"override":true,"value":["http://example.com"],"smart":true}}',
    };
    const expected = {
      securityHeader: { contentSecurityPolicy: "default-src 'self'" },
      cors: { origin: { override: true, value: ['http://example.com'], smart: true } },
    };
    expect(formatResponseHeaderPolicy(data)).toEqual(expected);
  });

  it('should handle invalid JSON strings', () => {
    const data = {
      securityHeader: 'invalid-json',
      cors: 'invalid-json',
    };
    const expected = {
      securityHeader: null,
      cors: null,
    };
    expect(formatResponseHeaderPolicy(data)).toEqual(expected);
  });
});

describe('convertResponseHeaderPolicy', () => {
  it('should convert valid response header policy', () => {
    const data = {
      securityHeader: { contentSecurityPolicy: "default-src 'self'" },
      cors: { origin: { override: true, value: ['http://example.com'], smart: true } },
    };
    const expected = {
      securityHeader: '{"contentSecurityPolicy":"default-src \'self\'"}',
      cors: '{"origin":{"override":true,"value":["http://example.com"],"smart":true}}',
    };
    expect(convertResponseHeaderPolicy(data)).toEqual(expected);
  });
});
