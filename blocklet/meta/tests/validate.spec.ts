import Joi from 'joi';
import omit from 'lodash/omit';
import { describe, test, expect } from 'bun:test';
import { BLOCKLET_LATEST_REQUIREMENT_SERVER } from '../src/constants';
import { validateMeta, fixAndValidateService } from '../src/index';
import { setService } from '../src/service';

const dAppMeta = {
  name: 'blockchain-manager',
  did: 'z8iZn18zGRm5veEdhmrS2FRrUyw5ZAQcewVMH',
  version: '1.0.20',
  description: 'Official blocklet to help you manage forge powered chain nodes',
  group: 'dapp',
  main: 'blocklet.zip',
  author: {
    name: 'polunzh',
    email: 'user-a@example.com',
    url: 'http://github.com/polunzh',
  },
  dist: {
    tarball: 'a',
    integrity: 'a',
  },
  payment: {
    share: [
      {
        name: 'developer',
        address: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        value: 0.1,
      },
      {
        name: 'store',
        address: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        value: 0.9,
      },
    ],
  },
};

const staticMeta = {
  name: 'static-demo-blocklet',
  did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
  version: '1.0.21',
  description: 'static demo blocklet',
  group: 'static',
  author: {
    name: 'polunzh',
    email: 'user-a@example.com',
    url: 'http://github.com/polunzh',
  },
  main: 'path/to',
  dist: {
    tarball: 'a',
    integrity: 'a',
  },
};

const staticMetaWithoutMain = {
  ...staticMeta,
  main: '',
};

const metaWithWrongDid = {
  ...staticMeta,
  did: '123',
};

const metaWithInvalidGroup = {
  ...staticMeta,
  group: 'xxxx',
};

const metaWithInvalidTitle = {
  ...staticMeta,
  title: 'static demo 我是中文 我是中文哈哈哈哈哈哈哈哈哈哈啊哈哈哈我是中文哈哈哈哈哈哈哈哈哈哈啊哈哈哈',
};

const metaWithInvalidPaymentShare = {
  ...staticMeta,
  payment: {
    share: [
      {
        name: 'developer',
        address: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        value: 0.1,
      },
      {
        name: 'store',
        address: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        value: 0.2,
      },
    ],
  },
};

const miniMeta = {
  name: 'xxx',
  did: 'z8iZxXUaMZvXeQn37pCZFLQC5jFHTAtAuBGvx',
  version: '0.1.0',
  description: 'xxx',
  group: 'dapp',
  main: 'xxx',
};

const miniDelegationBlockletMeta = {
  ...miniMeta,
  signatures: [
    {
      type: 'ED25519',
      name: 'express-test',
      signer: 'z1QmvXnBGwWHW6fPCxaS9R9r2efbapV1Ye7',
      pk: 'zAG7tTxi4a1apgdRRaRDQLdh5KTT5V1mte4xasmf8Vc9T',
      delegatee: 'zNKtjUQNGzAHziDS3Gqmw7dePhB8JEWemaTi',
      delegateePk: 'z5vwnMQAUhQ28hvSFfhpgnSGppZSeDm5GzE3JzKGW4VKT',
      delegation:
        'eyJhbGciOiJFZDI1NTE5IiwidHlwZSI6IkpXVCJ9.eyJleHAiOjQ4MDYyODYxNDIuNDEzLCJmcm9tIjoiejFRbXZYbkJHd1dIVzZmUEN4YVM5UjlyMmVmYmFwVjFZZTciLCJpYXQiOiIxNjUwNjEyNTQyIiwiaXNzIjoiZGlkOmFidDp6MVFtdlhuQkd3V0hXNmZQQ3hhUzlSOXIyZWZiYXBWMVllNyIsIm5iZiI6IjE2NTA2MTI1NDIiLCJwZXJtaXNzaW9ucyI6WyJwdWJsaXNoX2Jsb2NrbGV0Il0sInRvIjoiek5LdGpVUU5HekFIemlEUzNHcW13N2RlUGhCOEpFV2VtYVRpIiwidXNlclBrIjoiekFHN3RUeGk0YTFhcGdkUlJhUkRRTGRoNUtUVDVWMW10ZTR4YXNtZjhWYzlUIiwidmVyc2lvbiI6IjEuMS4wIn0.9HOt1j4ESjWHQYXLaBFhnshBr-8Qp-t7F2GEPyGvOoeuSIY4PRQqiYwbYZw-CeisfSImEYwsd4OkYFjFb1zzAw',
      excludes: ['htmlAst', 'lastPublishedAt', 'stats', 'readme'],
      appended: ['htmlAst', 'lastPublishedAt', 'stats', 'readme'],
      created: '2022-04-22T07:29:43.282Z',
      sig: 'z3qbHmAmtGLcnwudpCynaDHiNSin2uT2DTfNRz4qt1JMrhbD7rbKkhWad3iuHqDJ4UM1wAzQH4XcBFogHChdoZyrq',
    },
  ],
};

const serviceMeta = {
  name: 'abc',
  schema: Joi.object({
    name: Joi.string().default('arcblock'),
    age: Joi.number().default(11),
    description: Joi.string(),
  }),
  default: {
    name: 'arcblock',
    age: 11,
  },
};

setService(serviceMeta);
describe('validateMeta', () => {
  test('should pass if dapp meta has required props', () => {
    const result = validateMeta(dAppMeta);

    expect(result).toBeTruthy();
  });
  test('should pass if static meta has required props', () => {
    const result = validateMeta(staticMeta);

    expect(result).toBeTruthy();
  });
  test('should pass if delegationBlockletMeta has delegation field', () => {
    const result = validateMeta(miniDelegationBlockletMeta);

    expect(result).toBeTruthy();
    expect(result.signatures[0].delegatee).not.toBeUndefined();
    expect(result.signatures[0].delegateePk).not.toBeUndefined();
    expect(result.signatures[0].delegation).not.toBeUndefined();
  });
  test('should throw error if meta has too long title', () => {
    expect(() => validateMeta(metaWithInvalidTitle)).toThrowError(/title length should not exceed 40/);
  });
  test('should throw error if static meta has no main field', () => {
    expect(() => validateMeta(staticMetaWithoutMain)).toThrowError(/main/);
  });
  test('should throw error if meta did is wrong', () => {
    expect(() => validateMeta(metaWithWrongDid)).toThrowError(/did/);
  });
  test('should throw error if meta group is invalid', () => {
    expect(() => validateMeta(metaWithInvalidGroup)).toThrowError(/group/);
  });
  test('should throw error if meta has invalid payment share', () => {
    expect(() => validateMeta(metaWithInvalidPaymentShare)).toThrowError(/share config/);
  });
  test('should fill default values', () => {
    const rawMeta = {
      name: 'xxx',
      did: 'z8iZxXUaMZvXeQn37pCZFLQC5jFHTAtAuBGvx',
      version: '0.1.0',
      description: 'xxx',
      group: 'dapp',
      main: 'xxx',
    };

    const meta = validateMeta(rawMeta);

    expect(meta).toEqual({
      ...rawMeta,
      community: '',
      documentation: '',
      egress: true,
      homepage: '',
      license: '',
      nftFactory: '',
      capabilities: {},
      components: [],
      environments: [],
      interfaces: [],
      payment: { price: [], share: [] },
      requirements: {
        server: BLOCKLET_LATEST_REQUIREMENT_SERVER,
        os: '*',
        cpu: '*',
        nodejs: '*',
      },
      screenshots: [],
      timeout: {
        start: 60,
      },
    } as unknown as typeof meta);
  });
  test('mini meta', () => {
    expect(() =>
      validateMeta({
        ...miniMeta,
      })
    ).toBeTruthy();
  });
  test('bundleId and bundleName', () => {
    const res = validateMeta({
      ...miniMeta,
      bundleDid: miniMeta.did,
      bundleName: miniMeta.name,
    });

    expect(res.bundleDid).toBe(miniMeta.did);
    expect(res.bundleName).toBe(miniMeta.name);
    expect(() =>
      validateMeta({
        ...miniMeta,
        bundleDid: '',
      })
    ).toThrow();
    expect(() =>
      validateMeta({
        ...miniMeta,
        bundleName: '',
      })
    ).toThrow();
  });
});
describe('children/components (dynamic)', () => {
  test('should children spec work as expected', () => {
    expect(
      validateMeta({
        ...miniMeta,
        children: [],
      })
    ).toBeTruthy();
    // should not have resolved
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'a',
            resolved: 'b',
            mountPoint: '/c',
          },
        ],
      })
    ).toThrow('source" is required');
    // should not have mountPoints
    // mountPoint is not required
    expect(
      (
        validateMeta({
          ...miniMeta,
          children: [
            {
              name: 'a',
              source: { url: 'https://xxx' },
              mountPoints: [
                { root: { interfaceName: 'publicUrl', prefix: '/a' }, child: { interfaceName: 'publicUrl' } },
              ],
            },
          ],
        }) as any
      ).mountPoint
    ).toBeUndefined();
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'a',
            source: { url: 'https://xxx' },
          },
        ],
      })
    ).not.toThrow(); // skip check mountPoint in dynamic component
    // title & description
    const res = validateMeta({
      ...miniMeta,
      children: [
        {
          name: 'a',
          source: { url: 'https://xxx' },
          mountPoint: '/',
          title: 'abcd',
          description: 'abcd',
        },
      ],
    });

    expect(res.components[0].title).toBe('abcd');
    expect(res.components[0].description).toBe('abcd');
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'a',
            source: { url: 'https://xxx' },
            mountPoint: '/',
            title: new Array(49).fill('a').join(''),
          },
        ],
      })
    ).toThrow('length should not exceed 40');
    // description length
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'a',
            source: { url: 'https://xxx' },
            mountPoint: '/',
            description: new Array(2).fill('a').join(''),
          },
        ],
      })
    ).toThrow('length must be at least 3');
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'a',
            source: { url: 'https://xxx' },
            mountPoint: '/',
            description: new Array(161).fill('a').join(''),
          },
        ],
      })
    ).toThrow('length must be less than or equal to 160');
  });
  test('child.source', () => {
    // source.url
    expect(
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              url: 'http://a.com/meta',
            },
          },
        ],
      })
    ).toBeTruthy();
    // url can be array
    expect(
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              url: ['http://a.com/meta', 'http://b.com/meta'],
            },
          },
        ],
      })
    ).toBeTruthy();
    // url is required
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              url: [],
            },
          },
        ],
      })
    ).toThrow();
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              url: [''],
            },
          },
        ],
      })
    ).toThrow();
    // source.store
    expect(
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              store: 'http://a.com',
              name: 'abc',
              version: '1.0.0',
            },
          },
        ],
      })
    ).toBeTruthy();
    // latest version
    expect(
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              store: 'http://a.com',
              name: 'abc',
              version: 'latest',
            },
          },
        ],
      })
    ).toBeTruthy();
    // invalid version
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              store: 'http://a.com',
              name: 'abc',
              version: 'abc',
            },
          },
        ],
      })
    ).toThrow();
    // default version
    const res1 = validateMeta({
      ...miniMeta,
      children: [
        {
          name: 'abc',
          mountPoint: '/',
          source: {
            store: 'http://a.com',
            name: 'abc',
          },
        },
      ],
    });

    expect(res1.components[0].source.version).toBe('latest');
    // store is required
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              name: 'abc',
            },
          },
        ],
      })
    ).toThrow();
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              store: '',
              name: 'abc',
            },
          },
        ],
      })
    ).toThrow();
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              store: [],
              name: 'abc',
            },
          },
        ],
      })
    ).toThrow();
    // name is required
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            source: {
              store: 'http://a.com',
            },
          },
        ],
      })
    ).toThrow();
    // one of url or store must exist
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [{ name: 'abc', mountPoint: '/', source: {} }],
      })
    ).toThrow();
    // resolved is not supported
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
            resolved: 'https://a.com/blocklet.json',
          },
        ],
      })
    ).toThrow('source" is required');
    // one of source or resolved must exist
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'abc',
            mountPoint: '/',
          },
        ],
      })
    ).toThrow('source" is required');
  });
  test('name', () => {
    // static component's name should be unique
    // dynamic component's name is useless
    expect(() =>
      validateMeta({
        ...miniMeta,
        children: [
          {
            name: 'a',
            source: { url: 'https://xxx' },
            mountPoint: '/a1',
          },
          {
            name: 'a',
            source: { url: 'https://xxx' },
            mountPoint: '/a2',
          },
        ],
      })
    ).not.toThrow('duplicate name "a"');

    // name is useless in dynamic components
    expect(
      validateMeta({
        ...miniMeta,
        children: [
          {
            source: { url: 'https://xxx' },
            mountPoint: '/',
          },
        ],
      })
    ).toBeTruthy();
  });
  test('source version', () => {
    const storeSource = (v?: string) => ({
      ...miniMeta,
      components: [
        {
          source: {
            store: 'http://a.com',
            name: 'abc',
            version: v,
          },
        },
      ],
    });
    const urlSource = (v?: string) => ({
      ...miniMeta,
      components: [
        {
          source: {
            url: 'https://xx',
            version: v,
          },
        },
      ],
    });
    expect(validateMeta(storeSource()).components[0].source.version).toBe('latest');
    expect(validateMeta(storeSource('latest')).components[0].source.version).toBe('latest');
    expect(validateMeta(storeSource('1.1.1')).components[0].source.version).toBe('1.1.1');
    expect(validateMeta(storeSource('1')).components[0].source.version).toBe('1');
    expect(validateMeta(storeSource('>1')).components[0].source.version).toBe('>1');
    expect(validateMeta(storeSource('>=1')).components[0].source.version).toBe('>=1');

    expect(validateMeta(urlSource()).components[0].source.version).toBeUndefined();
    expect(validateMeta(urlSource('latest')).components[0].source.version).toBe('latest');
    expect(validateMeta(urlSource('1.1.1')).components[0].source.version).toBe('1.1.1');
    expect(validateMeta(urlSource('1')).components[0].source.version).toBe('1');
    expect(validateMeta(urlSource('>1')).components[0].source.version).toBe('>1');
    expect(validateMeta(urlSource('>=1')).components[0].source.version).toBe('>=1');
  });
});
describe('validateMeta: service', () => {
  test('should pass and fix service in meta', () => {
    const meta: any = { ...staticMeta };

    const i = {
      type: 'web',
      name: 'publicUrl',
      path: '/',
      prefix: '*',
      services: [{ name: 'abc', config: { name: 'A', age: 1 } }],
    };

    meta.interfaces = [
      {
        ...i,
        services: [{ name: 'abc', config: { name: 'A' } }],
      },
    ];
    fixAndValidateService(meta);
    expect(meta.interfaces).toEqual([
      {
        ...i,
        services: [{ name: 'abc', config: { name: 'A', age: 11 } }],
      },
    ]);
  });
  test('should throw error if service name does not exist', () => {
    expect.assertions(1);
    const meta: any = { ...staticMeta };

    const i = {
      type: 'web',
      name: 'publicUrl',
      path: '/',
      prefix: '*',
      services: [{ name: 'no-exist-service' }],
    };

    meta.interfaces = [i];
    try {
      fixAndValidateService(meta);
    } catch (error) {
      expect((error as Error).message).toMatch('does not exist');
    }
  });
});
describe('validateMeta: blocklet interface', () => {
  const webInterface = (name = 'publicUrl') => ({
    type: 'web',
    name,
    path: '/',
    prefix: '*',
  });

  const wellknownInterface = (name = 'acmeChallenge', prefix = '/.well-known/acme-challenge') => ({
    type: 'wellknown',
    name,
    path: '/',
    prefix,
  });

  test('should pass if blocklet has one web interface', () => {
    const meta = { ...dAppMeta, interfaces: [webInterface()] };

    const result = validateMeta(meta);

    expect(result).toBeTruthy();
  });
  test('should throw error if blocklet has two web interfaces', () => {
    const meta = { ...dAppMeta, interfaces: [webInterface(), webInterface('adminUrl')] };

    const result = () => validateMeta(meta);

    expect(result).toThrowError('one');
  });
  test('should pass if blocklet has wellknown interface', () => {
    const meta = { ...dAppMeta, interfaces: [wellknownInterface()] };

    const result = validateMeta(meta);

    expect(result).toBeTruthy();
  });
  test('should throw error if wellknown interfaces does not start with "/.wellknown"', () => {
    const meta = { ...dAppMeta, interfaces: [wellknownInterface('a', '/a'), webInterface()] };

    const result = () => validateMeta(meta);

    expect(result).toThrowError();
  });
});
test('navigation in meta', () => {
  const meta1 = {
    ...miniMeta,
    navigation: [
      { id: 'a', title: 'a', link: '/a' },
      { id: 'b', title: 'b', child: 'child2' },
      {
        id: 'c',
        title: 'c',
        items: [
          { id: 'c1', title: 'c-1', link: '/c-1' },
          { id: 'c2', title: 'c-2', child: 'child2' },
        ],
      },
    ],
  };

  expect(validateMeta(meta1).navigation).toEqual([
    { id: 'a', title: 'a', link: '/a' },
    { id: 'b', title: 'b', component: 'child2' },
    {
      id: 'c',
      title: 'c',
      items: [
        { id: 'c1', title: 'c-1', link: '/c-1' },
        { id: 'c2', title: 'c-2', component: 'child2' },
      ],
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: {
            zh: '你好',
            en: 'Hello',
          },
          link: '/a',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: {
        zh: '你好',
        en: 'Hello',
      },
      link: '/a',
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          section: 'header',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
      section: ['header'],
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          section: ['header', 'footer'],
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
      section: ['header', 'footer'],
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          icon: 'mdi:home',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
      icon: 'mdi:home',
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          icon: 'https://a.com',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
      icon: 'https://a.com',
    },
  ]);
  // title must exist
  expect(() =>
    validateMeta({
      ...miniMeta,
      navigation: [{ title: '' }],
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      navigation: [{ title: {} }],
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      navigation: [{ title: { zh: '' } }],
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      navigation: [{ title: { unknown: 'a' } }],
    })
  ).toThrow();
  // role
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          role: 'admin',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
      role: ['admin'],
    },
  ]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          role: ['owner', 'admin'],
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
      role: ['owner', 'admin'],
    },
  ]);
  // skip unknown
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [
        {
          id: 'a',
          title: 'a',
          aaa: 'b',
          unknownProp: 'c',
        },
      ],
    }).navigation
  ).toEqual([
    {
      id: 'a',
      title: 'a',
    },
  ]);
});
test('copyright in meta', () => {
  expect(
    validateMeta({
      ...miniMeta,
      copyright: {
        owner: 'ArcBlock',
      },
    }).copyright
  ).toEqual({
    owner: 'ArcBlock',
  });
  expect(
    validateMeta({
      ...miniMeta,
      copyright: {
        owner: 'ArcBlock',
        year: 2022,
      },
    }).copyright
  ).toEqual({
    owner: 'ArcBlock',
    year: 2022,
  });
  expect(
    validateMeta({
      ...miniMeta,
      copyright: {
        owner: 'ArcBlock',
        year: '2022',
      },
    }).copyright
  ).toEqual({
    owner: 'ArcBlock',
    year: '2022',
  });
  expect(
    validateMeta({
      ...miniMeta,
      copyright: {},
    }).copyright
  ).toEqual({});
  expect(() =>
    validateMeta({
      ...miniMeta,
      copyright: {
        owner: '',
      },
    })
  ).toThrow();
});
test('theme in meta', () => {
  expect(
    validateMeta({
      ...miniMeta,
      theme: {
        background: '#ff0000',
      },
    }).theme
  ).toEqual({
    background: '#ff0000',
  });
  expect(
    validateMeta({
      ...miniMeta,
      theme: {
        background: {
          default: '#111',
        },
      },
    }).theme
  ).toEqual({
    background: {
      default: '#111',
    },
  });
  expect(
    validateMeta({
      ...miniMeta,
      theme: {
        background: {
          default: '#111',
          header: '#222',
          footer: '#333',
        },
      },
    }).theme
  ).toEqual({
    background: {
      default: '#111',
      header: '#222',
      footer: '#333',
    },
  });
  expect(() =>
    validateMeta({
      ...miniMeta,
      theme: {
        background: '',
      },
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      theme: {
        background: {},
      },
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      theme: {
        background: {
          default: '',
        },
      },
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      theme: {
        background: {
          unknownProp: '111',
        },
      },
    })
  ).toThrow();
});
test('componentPrice', () => {
  expect(
    validateMeta({
      ...miniMeta,
    }).payment
  ).toEqual({ price: [], share: [] });
  expect(
    validateMeta({
      ...miniMeta,
      payment: {},
    }).payment
  ).toEqual({ price: [], share: [] });
  expect(
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: { type: 'fixed', value: 2 },
      },
    }).payment.componentPrice
  ).toEqual([{ type: 'fixed', value: 2 }]);
  expect(
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: [{ type: 'percentage', value: 0.5 }],
      },
    }).payment.componentPrice
  ).toEqual([{ type: 'percentage', value: 0.5 }]);
  expect(
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: [
          { parentPriceRange: [0, 10], type: 'fixed', value: 2 },
          { type: 'percentage', value: 0.2 },
        ],
      },
    }).payment.componentPrice
  ).toEqual([
    { parentPriceRange: [0, 10], type: 'fixed', value: 2 },
    { type: 'percentage', value: 0.2 },
  ]);
  expect(() =>
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: [
          { parentPriceRange: [0, 10, 3], type: 'fixed', value: 2 },
          { type: 'percentage', value: 0.2 },
        ],
      },
    })
  ).toThrowError('should be 2');
  expect(() =>
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: [{ parentPriceRange: [0], type: 'fixed', value: 2 }],
      },
    })
  ).toThrowError('should be 2');
  expect(() =>
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: [{ parentPriceRange: [-1, 2], type: 'fixed', value: 2 }],
      },
    })
  ).toThrowError('less than 0');
  expect(() =>
    validateMeta({
      ...miniMeta,
      payment: {
        componentPrice: [{ parentPriceRange: [2, 1], type: 'fixed', value: 2 }],
      },
    })
  ).toThrowError('should greater than the first');
});

test('rename children to components', () => {
  expect(
    validateMeta({
      ...miniMeta,
      children: [],
    }).components
  ).toEqual([]);
  expect(
    validateMeta({
      ...miniMeta,
      components: [],
    }).components
  ).toEqual([]);
  const children1 = [{ name: 'a', mountPoint: 'a', source: { store: 'http://a.com', name: 'a', version: '1.1.1' } }];

  expect(
    validateMeta({
      ...miniMeta,
      children: children1,
    }).components
  ).toEqual(children1);
  expect(
    validateMeta({
      ...miniMeta,
      components: children1,
    }).components
  ).toEqual(children1);
  // component in navigation
  expect(
    validateMeta({
      ...miniMeta,
      // keep one navigation without id
      navigation: [{ title: 'a', child: 'b' }],
    }).navigation
  ).toEqual([{ title: 'a', component: 'b' }]);
  expect(
    validateMeta({
      ...miniMeta,
      navigation: [{ id: 'a', title: 'a', component: 'b' }],
    }).navigation
  ).toEqual([{ id: 'a', title: 'a', component: 'b' }]);
  expect(() =>
    validateMeta({
      ...miniMeta,
      navigation: [{ id: 'a', title: 'a', component: '' }],
    })
  ).toThrow();
  expect(() =>
    validateMeta({
      ...miniMeta,
      navigation: [{ id: 'a', title: 'a', child: '' }],
    })
  ).toThrow();
});

test('did and name should match', () => {
  const meta = { ...miniMeta, name: 'abcdefg' };
  expect(() => validateMeta(meta)).toThrowError(/The did of name "abcdefg" should be/);
});

test('environments should not duplicate', () => {
  const meta = {
    ...miniMeta,
    environments: [
      {
        name: 'a',
        description: 'a1',
      },
      {
        name: 'b',
        description: 'b',
      },
      {
        name: 'a',
        description: 'a2',
      },
    ],
  };
  expect(() => validateMeta(meta)).toThrowError(/find duplicate environment/);
});

test('should allow empty component source store', () => {
  const meta = {
    ...miniMeta,
    components: [
      {
        name: 'did-comments',
        mountPoint: '/a',
        source: {
          name: 'did-comments',
          version: 'latest',
        },
      },
    ],
  };
  expect(() => validateMeta(meta)).toThrowError(/missing 'store'/);
  expect(() => validateMeta(meta, { ensureComponentStore: false })).not.toThrowError();
});

test('should allow empty interfaces', () => {
  expect(() =>
    validateMeta({
      ...omit(miniMeta, ['interfaces']),
    })
  ).toBeTruthy();
});

test('should allow empty main && group', () => {
  expect(() =>
    validateMeta({
      ...omit(miniMeta, ['main', 'group']),
    })
  ).toBeTruthy();
});

test('resources2', () => {
  const did = 'z2qa1qw8rvggfu1wkbHFHYFBdbLYeWH8uLttu';
  expect(
    validateMeta({
      ...miniMeta,
      resource: { bundles: [{ did, type: 'page' }] },
    }).resource
  ).toEqual({ bundles: [{ did, type: 'page' }] });

  expect(
    validateMeta({
      ...miniMeta,
      resource: { bundles: [{ did, type: 'page', public: true }] },
    }).resource
  ).toEqual({ bundles: [{ did, type: 'page', public: true }] });

  [
    { did: 'type id required' },
    { did: 'type id required', type: '' },
    { type: 'did id required' },
    { did: '', type: 'did id required' },
    { did: 'invalid did', type: 'page' },
  ].forEach((bundle) => {
    expect(() =>
      validateMeta({
        ...miniMeta,
        resource: { bundles: [bundle] },
      })
    ).toThrow();
  });
});

test('resourceTypes', () => {
  const res1 = validateMeta({
    ...miniMeta,
    resource: { types: [] },
  });

  expect(res1.resource.types).toEqual([]);

  const res2 = validateMeta({
    ...miniMeta,
    resource: {
      types: [
        {
          type: 'page',
          description: 'a',
        },
      ],
    },
  });
  expect(res2.resource.types[0]).toEqual({ type: 'page', description: 'a' });

  const res3 = validateMeta({
    ...miniMeta,
    resource: {
      types: [
        {
          type: 'page',
        },
      ],
    },
  });
  expect(res3.resource.types[0]).toEqual({ type: 'page' });

  expect(() =>
    validateMeta({
      ...miniMeta,
      resource: { types: {} },
    })
  ).toThrow();

  expect(() =>
    validateMeta({
      ...miniMeta,
      resource: { types: [{ type: '' }] },
    })
  ).toThrow();

  expect(() =>
    validateMeta({
      ...miniMeta,
      resource: { types: [{ type: 'page', description: '' }] },
    })
  ).toThrow();
});

test('mountPoint', () => {
  expect(
    validateMeta({
      ...miniMeta,
      components: [
        {
          name: 'a',
          mountPoint: '/z2qaBSYsgYsVVEisboDG3r1EcxsKdmJ9QNXZN',
          source: { url: 'https://xxx' },
        },
      ],
    }).components[0].mountPoint
  ).toBe('/z2qaBSYsgYsVVEisboDG3r1EcxsKdmJ9QNXZN');
});
