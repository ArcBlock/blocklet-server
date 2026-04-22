/* eslint-disable no-console */

/**
 * 2023.08.10 remove auto create and validate this props: main, group
 * 2023.08.10 remove auto create 'path' prop
 */

import { describe, test, expect, mock } from 'bun:test';
// @ts-ignore
import Joi from 'joi';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import omit from 'lodash/omit';
import yaml from 'js-yaml';
import { parse, toBlockletDid } from '../src/index';
import {
  BLOCKLET_DEFAULT_VERSION,
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_LATEST_REQUIREMENT_SERVER,
} from '../src/constants';
import { setService } from '../src/service';

const baseMeta = {
  name: 'mock',
  did: 'z8iZomNqCtrWMyFvavTRLmbFv1bf8S8VfPp8N',
  version: '1.0.0',
  description: 'mock',
  group: 'dapp',
  main: 'index.js',
};

const createResult = (custom?: any) => ({
  did: 'z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt',
  name: 'kitchen-sink-blocklet',
  description: 'Demo blocklet that showing how blocklet works in ABT node',
  group: 'dapp',
  version: '0.9.4',
  main: 'index.js',
  title: 'Kitchen Sink',
  gitHash: '44202c6d80e046382148c7d66de6a7be76f6fa9b',
  logo: 'logo.png',
  author: {
    name: 'user-a',
    email: 'user-a@example.com',
    url: 'https://example.com/user-a',
  },
  contributors: [
    {
      name: 'user-b',
      email: 'user-b@example.com',
      url: 'https://example.com/user-b',
    },
  ],
  maintainers: [
    {
      name: 'user-a',
      email: 'user-a@example.com',
      url: 'https://github.com/user-a',
    },
  ],
  repository: {
    type: 'git',
    url: 'git+https://github.com/ArcBlock/abt-node.git',
  },
  keywords: ['dapp', 'demo'],
  scripts: {
    postInstall: 'node post-install.js',
    preStop: 'node pre-stop.js',
    preInstall: 'node pre-install.js',
    preStart: 'node pre-start.js',
    postStart: 'node post-start.js',
    preUninstall: 'node pre-uninstall.js',
  },
  path: '/dapp/kitchen-sink-blocklet',
  nftFactory: '',
  payment: { price: [], share: [] },
  license: 'Apache-2.0',
  community: '',
  components: [],
  homepage: '',
  documentation: '',
  egress: true,
  screenshots: ['1-start.png'],
  interfaces: [],
  environments: [],
  files: ['post-install.js'],
  specVersion: '1.0.0',
  timeout: {
    start: 60,
  },
  requirements: {
    server: BLOCKLET_LATEST_REQUIREMENT_SERVER,
    os: '*',
    cpu: '*',
    nodejs: '*',
  },
  capabilities: {},
  ...custom,
});

const packageMeta = {
  name: 'kitchen-sink-blocklet',
  title: 'Kitchen Sink',
  version: '0.9.4',
  description: 'Demo blocklet that showing how blocklet works in ABT node',
  keywords: ['dapp', 'demo'],
  author: 'user-a <user-a@example.com> (https://example.com/user-a)',
  contributors: ['user-b <user-b@example.com> (https://example.com/user-b)'],
  maintainers: [
    {
      name: 'user-a',
      email: 'user-a@example.com',
      url: 'https://github.com/user-a',
    },
  ],
  gitHash: '44202c6d80e046382148c7d66de6a7be76f6fa9b',
  repository: 'ArcBlock/abt-node',
  license: 'Apache-2.0',
  screenshots: ['1-start.png'],
};

const blockletMeta = {
  main: 'index.js',
  logo: 'logo.png',
  scripts: {
    'post-install': 'node post-install.js',
    'pre-stop': 'node pre-stop.js',
    'pre-install': 'node pre-install.js',
    'pre-start': 'node pre-start.js',
    'post-start': 'node post-start.js',
    'pre-uninstall': 'node pre-uninstall.js',
  },
  files: ['post-install.js'],
  environments: [] as any,
  specVersion: '1.0.0',
};

describe('parse', () => {
  test('should be a function', () => {
    expect(typeof parse).toEqual('function');
  });
  const expectMetaDefaults = {
    version: BLOCKLET_DEFAULT_VERSION,
    group: 'static',
    main: '.',
    payment: { price: [] as any, share: [] as any },
    nftFactory: '',
    timeout: { start: 60 },
    requirements: {
      server: BLOCKLET_LATEST_REQUIREMENT_SERVER,
      os: '*',
      cpu: '*',
      nodejs: '*',
    },
    license: '',
    community: '',
    homepage: '',
    documentation: '',
    egress: true,
    screenshots: [] as any,
    interfaces: [] as any,
    environments: [] as any,
    components: [] as any,
    capabilities: {},
  };

  test('should assign sensible defaults with minimal context', () => {
    const name = `blocklet-${Date.now()}`;

    const dir = path.join(os.tmpdir(), name);
    const did = toBlockletDid(name);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump({ name, did }));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html></html>');
    const expectMeta = {
      ...omit(expectMetaDefaults, ['main', 'group', 'path']),
      name,
      did,
      description: `Blocklet from ${dir}`,
    };

    const meta = parse(dir);

    expect(meta).toEqual(expectMeta as any);
    fs.removeSync(path.join(dir, 'index.html'));
    fs.writeFileSync(path.join(dir, 'index.htm'), '<!DOCTYPE html></html>');
    const meta2 = parse(dir);

    expect(meta2).toEqual(expectMeta as any);
    fs.removeSync(dir);
  });
  test('should pass without name, when did is new did mode', () => {
    const did = 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9';
    const dir = path.join(os.tmpdir(), did);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump({ did }));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html></html>');
    const expectMeta = {
      ...omit(expectMetaDefaults, ['main', 'group', 'path']),
      name: did,
      did,
      description: `Blocklet from ${dir}`,
    };

    const meta = parse(dir);

    expect(meta).toEqual(expectMeta as any);
    fs.removeSync(path.join(dir, 'index.html'));
    fs.writeFileSync(path.join(dir, 'index.htm'), '<!DOCTYPE html></html>');
    const meta2 = parse(dir);

    expect(meta2).toEqual(expectMeta as any);
    fs.removeSync(dir);
  });
  test('should parse name to did, when did is new did mode', () => {
    const name = `blocklet-${Date.now()}`;

    const dir = path.join(os.tmpdir(), name);
    const did = 'z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9';

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump({ name, did }));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html></html>');
    const expectMeta = {
      ...omit(expectMetaDefaults, ['main', 'group', 'path']),
      name: did,
      did,
      description: `Blocklet from ${dir}`,
    };

    const meta = parse(dir);

    expect(meta).toEqual(expectMeta as unknown as typeof meta);
    fs.removeSync(path.join(dir, 'index.html'));
    fs.writeFileSync(path.join(dir, 'index.htm'), '<!DOCTYPE html></html>');
    const meta2 = parse(dir);

    expect(meta2).toEqual(expectMeta as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should assign sensible defaults with minimal context and nested static', () => {
    const name = `blocklet-${Date.now()}`;
    const did = toBlockletDid(name);

    const dir = path.join(os.tmpdir(), name);

    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'static'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump({ name, did }));
    fs.writeFileSync(path.join(dir, 'static/index.html'), '<!DOCTYPE html></html>');
    const meta = parse(dir);

    expect(meta).toEqual({
      ...omit(expectMetaDefaults, ['main', 'group', 'path']),
      name,
      did,
      description: `Blocklet from ${dir}`,
    } as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should allow caller customize required attrs', () => {
    const name = `blocklet-${Date.now()}`;
    const did = toBlockletDid(name);

    const dir = path.join(os.tmpdir(), name);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump({ name, did }));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html></html>');
    try {
      parse(dir, { enableDefaults: false, extraAttrSpec: { main: false } });
    } catch (err) {
      expect((err as Error).message.indexOf('Missing required blocklet fields') > -1).toBeTruthy();
    }
    const meta = parse(dir, { enableDefaults: true, extraAttrSpec: { main: false } });

    expect(meta).toEqual({
      ...omit(expectMetaDefaults, ['main', 'group', 'path']),
      name,
      did,
      description: `Blocklet from ${dir}`,
    } as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should throw error if no spec file', () => {
    const name = `blocklet-${Date.now()}`;

    const dir = path.join(os.tmpdir(), name);

    const onError = mock(() => {});

    fs.mkdirSync(dir, { recursive: true });
    try {
      const meta = parse(dir);

      console.log(meta.main);
    } catch (err) {
      expect((err as Error).message).toEqual('no blocklet.yml or blocklet.yaml found');
      onError();
    }
    expect(onError.mock.calls.length).toBe(1);
    fs.removeSync(dir);
  });
  test('should NOT throw error if minimal context has not entry file', () => {
    const name = `blocklet-${Date.now()}`;
    const did = toBlockletDid(name);

    const dir = path.join(os.tmpdir(), name);

    const onError = mock(() => {});

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump({ name, did }));
    try {
      const meta = parse(dir);

      console.log(meta.main);
    } catch (err) {
      expect((err as Error).message).toEqual(`Invalid blocklet.yml:
"main" is required`);
      onError();
    }
    expect(onError.mock.calls.length).toBe(0);
    fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html></html>');
    const meta = parse(dir);

    expect(meta).toEqual({
      ...omit(expectMetaDefaults, ['main', 'group', 'path']),
      name,
      did,
      description: `Blocklet from ${dir}`,
    } as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should use blocklet config from blocklet.yml', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    const did = toBlockletDid(packageMeta.name);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(Object.assign({ did }, packageMeta, blockletMeta)));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'post-install.js'), 'console.log("Hell");');
    const meta = parse(dir);

    expect(meta).toEqual(omit(createResult(), ['path', 'group']) as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should use blocklet config from blocklet.yaml', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    const did = toBlockletDid(packageMeta.name);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump(Object.assign({ did }, packageMeta, blockletMeta)));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'post-install.js'), 'console.log("Hell");');
    const meta = parse(dir);

    expect(meta).toEqual(omit(createResult(), ['path', 'group']) as unknown as typeof meta);
    fs.removeSync(dir);
  });
  const raw = {
    name: 'kitchen-sink-blocklet',
    description: 'Demo blocklet that showing how blocklet works in ABT node',
    version: '0.9.4',
    main: 'index.js',
    title: 'Kitchen Sink',
    logo: 'logo.png',
    keywords: ['dapp', 'demo'],
    author: 'user-a <user-a@example.com> (https://example.com/user-a)',
    environments: [
      { name: 'XXXX', description: 'XXXX' },
      { name: 'XXXX2', description: 'XXXX', default: 'ABC', required: true },
    ],
    scripts: {
      'post-install': 'node post-install.js',
      'pre-stop': 'node pre-stop.js',
      'pre-install': 'node pre-install.js',
      'pre-start': 'node pre-start.js',
      'post-start': 'node post-start.js',
      'pre-uninstall': 'node pre-uninstall.js',
    },
    files: ['post-install.js'],
    gitHash: '44202c6d80e046382148c7d66de6a7be76f6fa9b',
    specVersion: '1.0.0',
    group: 'dapp',
    path: '/dapp/kitchen-sink-blocklet',
    did: 'z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt',
    interfaces: [
      {
        type: 'web',
        name: 'publicUrl',
        path: '/',
        prefix: '*',
        cacheable: ['/uploads/', 'api/resolve/'],
        services: [{ name: 'abc', config: { a: 'A', b: 'B' } }],
      },
      {
        type: 'service',
        name: 'dns',
        protocol: 'udp',
        port: {
          internal: 'blocklet_dns_port',
          external: 53,
        },
      },
      {
        type: 'service',
        name: 'p2p',
        port: {
          internal: 'blocklet_p2p_port',
          external: 26535,
        },
      },
    ],
  };

  const parsed = {
    name: 'kitchen-sink-blocklet',
    description: 'Demo blocklet that showing how blocklet works in ABT node',
    version: '0.9.4',
    main: 'index.js',
    title: 'Kitchen Sink',
    logo: 'logo.png',
    author: {
      name: 'user-a',
      email: 'user-a@example.com',
      url: 'https://example.com/user-a',
    },
    environments: [
      {
        name: 'XXXX',
        description: 'XXXX',
        default: '',
        required: false,
        secure: false,
      },
      {
        name: 'XXXX2',
        description: 'XXXX',
        default: 'ABC',
        required: true,
        secure: false,
      },
    ],
    files: ['post-install.js'],
    gitHash: '44202c6d80e046382148c7d66de6a7be76f6fa9b',
    specVersion: '1.0.0',
    group: 'dapp',
    path: '/dapp/kitchen-sink-blocklet',
    did: 'z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt',
    interfaces: [
      {
        type: 'web',
        name: 'publicUrl',
        path: '/',
        prefix: BLOCKLET_DYNAMIC_PATH_PREFIX,
        protocol: 'http',
        port: BLOCKLET_DEFAULT_PORT_NAME,
        proxyBehavior: 'service',
        cacheable: ['/uploads', '/api/resolve'],
        services: [{ name: 'abc', config: { a: 'A', b: 'B' } }],
      },
      {
        type: 'service',
        name: 'dns',
        protocol: 'udp',
        port: {
          internal: 'BLOCKLET_DNS_PORT',
          external: 53,
        },
        path: '/',
        proxyBehavior: 'service',
        prefix: BLOCKLET_DYNAMIC_PATH_PREFIX,
      },
      {
        type: 'service',
        name: 'p2p',
        port: {
          internal: 'BLOCKLET_P2P_PORT',
          external: 26535,
        },
        path: '/',
        proxyBehavior: 'service',
        prefix: BLOCKLET_DYNAMIC_PATH_PREFIX,
        protocol: 'http',
      },
    ],
    scripts: {
      preInstall: 'node pre-install.js',
      postInstall: 'node post-install.js',
      preStart: 'node pre-start.js',
      postStart: 'node post-start.js',
      preStop: 'node pre-stop.js',
      preUninstall: 'node pre-uninstall.js',
    },
    keywords: ['dapp', 'demo'],
    community: '',
    documentation: '',
    egress: true,
    homepage: '',
    license: '',
    payment: { price: [] as any, share: [] as any },
    nftFactory: '',
    screenshots: [] as any,
    timeout: {
      start: 60,
    },
    requirements: {
      server: BLOCKLET_LATEST_REQUIREMENT_SERVER,
      os: '*',
      cpu: '*',
      nodejs: '*',
    },
    components: [] as any,
    capabilities: {},
  };

  const serviceMeta = {
    name: 'abc',
    schema: Joi.object({
      a: Joi.string().default('A'),
      b: Joi.string().default('B'),
    }),
    default: {
      a: 'A',
      b: 'B',
    },
  };

  setService(serviceMeta);
  test('should support meta spec v1.0.1', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump(raw));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'post-install.js'), 'console.log("Hell");');
    const meta = parse(dir);

    expect(meta).toEqual(parsed as any);
    fs.removeSync(dir);
  });
  test('should support extra attributes', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump(raw));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'post-install.js'), 'console.log("Hell");');
    const meta = parse(dir, {
      extraRawAttrs: {
        author: 'user-b <user-b@example.com> (https://example.com/user-b)',
      },
    });

    expect(meta).toEqual({
      ...parsed,
      author: {
        name: 'user-b',
        email: 'user-b@example.com',
        url: 'https://example.com/user-b',
      },
    } as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should parse meta.interfaces[].services[] successfully', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump(raw));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'post-install.js'), 'console.log("Hell");');
    const meta = parse(dir);

    expect(meta).toEqual(parsed as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should skip "resolved" and "mountPoints" in children', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    const children = [
      {
        name: 'a',
        source: { url: 'https://xx' },
        resolved: 'http://a.com',
        mountPoints: [
          {
            root: {
              interfaceName: 'parentInterfaceName',
              prefix: '/',
            },
            child: {
              interfaceName: 'childInterfaceName',
            },
          },
        ],
      },
    ];

    fs.writeFileSync(
      path.join(dir, 'blocklet.yaml'),
      yaml.dump({
        ...raw,
        children,
      })
    );
    const meta = parse(dir);

    expect(meta).toEqual({
      ...parsed,
      components: [omit(children[0], ['resolved', 'mountPoints'])],
    } as unknown as typeof meta);
    fs.removeSync(dir);
  });
  test('should throw error if children is invalid', () => {
    expect.assertions(1);
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    const children = [
      {
        name: '',
        resolved: '',
      },
    ];

    fs.writeFileSync(
      path.join(dir, 'blocklet.yaml'),
      yaml.dump({
        ...raw,
        children,
      })
    );
    try {
      parse(dir);
    } catch (error) {
      expect(error).toBeTruthy();
    }
    fs.removeSync(dir);
  });
  test('should NOT throw error if group is gateway and has main field', () => {
    expect.assertions(0);
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'blocklet.yaml'),
      yaml.dump({
        ...raw,
        group: 'gateway',
      })
    );
    try {
      parse(dir);
    } catch (error) {
      expect(error).toBeTruthy();
    }
    fs.removeSync(dir);
  });
  test('should support files check exist', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump(raw));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    try {
      parse(dir, { ensureFiles: true });
    } catch (err) {
      expect((err as Error).message).toEqual(`Invalid blocklet.yml:
file "post-install.js" does not exist`);
    }
    fs.writeFileSync(path.join(dir, 'post-install.js'), 'console.log("Hell");');
    const meta = parse(dir, { ensureFiles: true });

    expect(meta).toEqual(parsed as unknown as typeof meta);
  });
  test('should support files check glob path', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump({ ...raw, files: ['extra/\\@(extra).js'] }));
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("Hell");');
    fs.writeFileSync(path.join(dir, 'logo.png'), 'console.log("Hell");');
    fs.mkdirSync(path.join(dir, 'extra'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'extra/extra.js'), 'console.log("Hell");');
    try {
      parse(dir, { ensureFiles: true });
    } catch (err) {
      expect((err as Error).message).toEqual(`Invalid blocklet.yml:
file "extra/\\@(extra).js" does not exist`);
    }
    fs.writeFileSync(path.join(dir, 'blocklet.yaml'), yaml.dump({ ...raw, files: ['extra/*.js'] }));
    const meta = parse(dir, { ensureFiles: true });

    expect(meta).toEqual({ ...parsed, files: ['extra/*.js'] } as unknown as typeof meta);
  });
  test('meta.environments[].shared', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    const meta1 = {
      ...baseMeta,
      environments: [
        {
          name: 'key1',
          description: 'key1 desc',
        },
      ],
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta1));
    const res1 = parse(dir);

    expect(res1.environments).toEqual([
      {
        name: 'key1',
        description: 'key1 desc',
        required: false,
        secure: false,
        default: '',
      },
    ]);
    const meta2 = {
      ...baseMeta,
      environments: [
        {
          name: 'key1',
          description: 'key1 desc',
          secure: true,
        },
      ],
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta2));
    const res2 = parse(dir);

    expect(res2.environments).toEqual([
      {
        name: 'key1',
        description: 'key1 desc',
        required: false,
        secure: true,
        shared: false,
        default: '',
      },
    ]);
    fs.removeSync(dir);
  });
  test('meta.requirements.fuels', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    const meta1 = {
      ...baseMeta,
      requirements: {
        fuels: [
          {
            endpoint: 'https://beta.abtnetwork.io/api/',
            value: '1',
            reason: 'test',
          },
        ],
      },
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta1));
    const res1 = parse(dir);

    expect(res1.requirements?.fuels).toEqual([
      {
        endpoint: 'https://beta.abtnetwork.io/api/',
        value: '1',
        reason: 'test',
      },
    ]);
    const meta2 = {
      ...baseMeta,
      requirements: {
        fuels: [
          {
            endpoint: 'https://beta.abtnetwork.io/api/',
            value: '1',
            address: 'xxx',
            reason: 'test',
          },
        ],
      },
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta2));
    const res2 = parse(dir);

    expect(res2.requirements?.fuels).toEqual([
      {
        endpoint: 'https://beta.abtnetwork.io/api/',
        value: '1',
        address: 'xxx',
        reason: 'test',
      },
    ]);
    // endpoint should not be empty
    const meta3 = {
      ...baseMeta,
      requirements: {
        fuels: [
          {
            value: '1',
            reason: 'test',
          },
        ],
      },
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta3));
    expect(() => parse(dir)).toThrow();
    // value should not be empty
    const meta4 = {
      ...baseMeta,
      requirements: {
        fuels: [
          {
            endpoint: 'https://beta.abtnetwork.io/api/',
            reason: 'test',
          },
        ],
      },
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta4));
    expect(() => parse(dir)).toThrow();
    fs.removeSync(dir);
  });
  test('should not set default value to secure env', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    const meta1 = {
      ...baseMeta,
      environments: [
        {
          name: 'SECURE_PROP',
          description: 'mock',
          secure: true,
          default: 'shound not have default',
        },
      ],
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta1));
    expect(() => parse(dir)).toThrowError('Cannot declare default value for secure env');
    fs.removeSync(dir);
  });

  test('should allow empty component source store', () => {
    const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

    fs.mkdirSync(dir, { recursive: true });
    const componentConfig = {
      name: 'component-did-comments',
      mountPoint: '/a',
      source: {
        name: 'did-comments',
        version: 'latest',
      },
    };
    const meta1 = {
      ...baseMeta,
      components: [componentConfig],
    };

    fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta1));
    expect(() => parse(dir)).toThrowError(/missing 'store'/);
    const res1 = parse(dir, { ensureComponentStore: false });
    expect((res1 as any).components[0].source.store).toBeUndefined();

    const defaultStoreUrl = mock().mockReturnValue('https://a.com');
    const res2 = parse(dir, { defaultStoreUrl });
    expect((res2 as any).components[0].source.store).toBe('https://a.com');
    expect(defaultStoreUrl.mock.calls[0][0]).toEqual(componentConfig);
    fs.removeSync(dir);
  });
});

test('should allow empty static component source store', () => {
  const dir = path.join(os.tmpdir(), `blocklet-${Date.now()}`);

  fs.mkdirSync(dir, { recursive: true });
  const componentConfig = {
    mountPoint: '/a',
    source: {
      name: 'did-comments',
      version: 'latest',
    },
  };

  const meta1 = {
    ...baseMeta,
    components: [componentConfig],
  };

  fs.writeFileSync(path.join(dir, 'blocklet.yml'), yaml.dump(meta1));
  expect(() => parse(dir)).toThrowError(/missing 'store'/);
  const res1 = parse(dir, { ensureComponentStore: false });
  expect((res1 as any).components[0].source.store).toBeUndefined();

  const defaultStoreUrl = mock(() => 'https://a.com');
  const res2 = parse(dir, { defaultStoreUrl });
  expect((res2 as any).components[0].source.store).toBe('https://a.com');
  expect((defaultStoreUrl.mock.calls as any)[0][0]).toEqual(componentConfig as any);
  fs.removeSync(dir);
});
