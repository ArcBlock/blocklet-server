import Joi from 'joi';
import { describe, test, expect } from 'bun:test';
// eslint-disable-next-line import/no-extraneous-dependencies
import { parsePerson, formatPerson, fixInterfaces, fixService, fixName } from '../src/index';
import { setService, getDefaultServiceConfig } from '../src/service';

const author = 'user-a <user-a@example.com> (https://example.com/user-a)';

const author2 = 'user-a <user-a@example.com>';

const person = { name: 'user-a', email: 'user-a@example.com', url: 'https://example.com/user-a' };

const person2 = { name: 'user-a', email: 'user-a@example.com' };

const serviceMetas = [
  {
    name: 'abc',
    schema: Joi.object({
      a: Joi.string().valid('A1', 'A2').default('A1'),
      b: Joi.string().default('B'),
    }),
    default: {
      a: 'A1',
      b: 'B',
    },
  },
];

setService(serviceMetas[0]);
describe('parsePerson', () => {
  test('should return entire object', () => {
    const result = parsePerson(author);

    expect(result.name).toEqual(person.name);
    expect(result.email).toEqual(person.email);
    expect(result.url).toEqual(person.url);
  });
  test('should return partial object', () => {
    const result = parsePerson(author2);

    expect(result.name).toEqual(person.name);
    expect(result.email).toEqual(person.email);
  });
});
describe('formatPerson', () => {
  test('should format to string', () => {
    const result = formatPerson(person);

    expect(result).toEqual(author);
  });
  test('should format partial to string', () => {
    const result = formatPerson(person2);

    expect(result).toEqual(author2);
  });
});
describe('fixInterfaces', () => {
  test('should attach interfaces field if not exist', () => {
    expect(fixInterfaces({})).toEqual({ interfaces: [] });
  });
  test('should convert legacy fields to interfaces', () => {
    expect(
      fixInterfaces({
        publicUrl: '/',
        capabilities: { dynamicPathPrefix: true },
        exposeServices: [
          {
            protocol: 'udp',
            port: 53,
            upstreamPort: 8088,
          },
        ],
      })
    ).toEqual({
      capabilities: {},
      interfaces: [
        {
          type: 'web',
          name: 'publicUrl',
          path: '/',
          protocol: 'http',
          prefix: '*',
          port: 'BLOCKLET_PORT',
        },
        {
          type: 'service',
          name: 'udp',
          path: '/',
          protocol: 'udp',
          prefix: '*',
          port: {
            external: 53,
            internal: 'BLOCKLET_UDP_PORT',
          },
        },
      ],
    });
  });
  test('should change protocol to http for web interfaces', () => {
    expect(
      fixInterfaces({
        interfaces: [
          {
            type: 'web',
            name: 'publicUrl',
            path: '/',
            protocol: 'tcp',
            prefix: '*',
            port: 'BLOCKLET_PORT',
          },
        ],
      })
    ).toEqual({
      interfaces: [
        {
          type: 'web',
          name: 'publicUrl',
          path: '/',
          protocol: 'http',
          prefix: '*',
          port: 'BLOCKLET_PORT',
        },
      ],
    });
  });
});
describe('fixService', () => {
  const metaSrc1 = {
    interfaces: [
      {
        services: [{ name: 'abc', config: { a: 'A', b: 'B' } }],
      },
    ],
  };

  const metaSrc2 = {
    interfaces: [
      {
        services: [
          {
            name: 'abc',
            config: { a: 'A1', b: 'B' },
          },
        ],
      },
    ],
  };

  const metaResult2 = {
    interfaces: [
      {
        services: [{ name: 'abc', config: { a: 'A1', b: 'B' } }],
      },
    ],
  };

  const metaSrc3 = {
    interfaces: [
      {
        services: [
          {
            name: 'abc',
          },
        ],
      },
    ],
  };

  const metaResult3 = metaResult2;

  const metaSrc4 = {
    interfaces: [
      {
        services: [
          {
            config: { a: 'A2', b: 'B' },
          },
        ],
      },
    ],
  };

  const metaSrc5 = {
    interfaces: [
      {
        services: [
          {
            name: 'invalid name',
            config: { a: 'A2', b: 'B' },
          },
        ],
      },
    ],
  };

  const metaSrc6 = {
    interfaces: [
      {
        services: [
          {
            name: 'auth',
            config: { whoCanAccess: 'owner' },
          },
        ],
      },
    ],
  };

  const metaResult6 = {
    interfaces: [
      {
        services: [{ name: 'auth', config: { ...getDefaultServiceConfig('auth'), whoCanAccess: 'owner' } }],
      },
    ],
  };

  test('should validate and stringify services[].config successfully', () => {
    // invalid value
    expect(() => fixService(metaSrc1 as any)).toThrow('must be one of [A1, A2]');
    // valid value
    expect(fixService(metaSrc2 as any)).toEqual(metaResult2 as any);
    // default value
    expect(fixService(metaSrc3 as any)).toEqual(metaResult3 as any);
    // empty name
    expect(() => fixService(metaSrc4 as any)).toThrow();
    // invalid name
    expect(() => fixService(metaSrc4 as any)).toThrow();
    // auth config
    expect(() => fixService(metaSrc5 as any)).toThrow();
    // default value
    expect(fixService(metaSrc6 as any)).toEqual(metaResult6 as any);
  });
});

describe('fixName', () => {
  test('should parse name to did, when blocklet is new did mode', () => {
    expect(
      fixName({
        name: 'test-blocklet',
        did: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9',
      })
    ).toEqual({ name: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9', did: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9' });

    expect(
      fixName({
        name: 'error-name',
        did: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9',
      })
    ).toEqual({ name: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9', did: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9' });

    expect(
      fixName({
        did: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9',
      })
    ).toEqual({ name: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9', did: 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9' });
  });

  test('should  not parse name to did, when blocklet is old did mode', () => {
    expect(
      fixName({
        name: 'static-demo-blocklet',
        did: 'zNKqRZMZpX49Ct2byuFJKX2H4siZARnfQLiy',
      })
    ).toEqual({ name: 'static-demo-blocklet', did: 'zNKqRZMZpX49Ct2byuFJKX2H4siZARnfQLiy' });
  });
});
