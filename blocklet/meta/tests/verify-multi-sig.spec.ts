import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import stableStringify from 'json-stable-stringify';
import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import { types } from '@ocap/mcrypto';
import { toBase58 } from '@ocap/util';
import { fromRandom } from '@ocap/wallet';
import { sign as signJwt } from '@arcblock/jwt';
import { verifyMultiSig as verify } from '../src/verify-multi-sig';
// @see: https://gist.github.com/acatl/965865aae86cf135f1cfc621a4a86fcc

const normalBlockletMetaSource = {
  name: 'kitchen-sink-blocklet',
  version: '1.2.9',
  description: 'Demo blocklet that showing how blocklet works in ABT node',
  keywords: ['dapp', 'demo'],
  author: {
    name: 'polunzh',
    email: 'user-a@example.com',
    url: 'http://github.com/polunzh',
  },
  title: 'Kitchen Sink',
  license: 'MIT',
  group: 'dapp',
  main: 'blocklet.zip',
  logo: 'logo.png',
  specVersion: '1.0.1',
  did: 'z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt',
  homepage: '',
  screenshots: [] as any[],
  dist: {
    tarball: 'kitchen-sink-blocklet-1.2.9.tgz',
    integrity: 'sha512-rnOs2aQStjOrcaJZ8/JwrRQSSF0NpUp4JidKn5XPRHAN6mCXGQrUWflxq002TcyQiqfUg08kg4qv2RP1ICt+2A==',
  },
  signatures: [
    {
      type: 'ED25519',
      name: 'development',
      signer: 'z1ZcK7Ubku6wurxnxMhUA341hQDQM9ygpM1',
      pk: 'zZFcJgiBHzdLpmU9Rf4MF9R1ufYQ1AJpbgFq6ca8anDW',
      excludes: ['htmlAst', 'stats'],
      appended: ['htmlAst', 'lastPublishedAt', 'stats'],
      created: '2021-03-05T03:36:45.186Z',
      sig: 'z3LYTEwfyaqTMUTo8rmdqJMxHoqSzRtM9YqeihX9VAoq9V5H4ymLuMisnX8TMVHVUpBNhcNeDHH3h2dxkbYhVebzF',
    },
    {
      type: 'ED25519',
      name: 'kitchen-sink-blocklet',
      signer: 'z1SkncdA262H1R2xuChEkqvNZZKCMi9z6jd',
      pk: 'zGuq3j7Pb7xeenNyKSVw4zi3NMqU9JGiQVW7Ffb8xBJ2F',
      created: '2021-03-05T03:36:44.991Z',
      sig: 'z4xosaiaf6bxCH37FJgwRYf1PyGu84MCv53J2fEW4yYtzhkJ5UMSXBxRyvM8eLTG4Ww8Sxo6Vgxjend5kijwn8P2E',
    },
  ],
  lastPublishedAt: '2021-03-05T03:36:45.177Z',
  htmlAst: {
    type: 'root',
  },
  stats: {
    downloads: 0,
    updated_at: '2021-03-05T03:36:45.230Z',
  },
};

const delegationBlockletMetaSource = {
  name: 'express-test',
  version: '0.1.62',
  description: 'A Blocklet Api blocklet',
  keywords: ['blocklet', 'react'],
  author: {
    name: 'skypesky ye',
    email: 'user-b@example.com',
  },
  title: 'express-test',
  group: 'dapp',
  did: 'z8iZwXrqHDwGW7DtYNtvUqWW3wkNagcXdipXa',
  main: 'blocklet.zip',
  repository: {
    type: 'git',
    url: 'git+https://github.com/blocklet/create-blocklet.git',
  },
  specVersion: '1.1.1',
  logo: 'logo.png',
  files: ['logo.png', 'README.md', 'blocklet.md', 'screenshots', 'api/hooks/pre-start.js'],
  interfaces: [
    {
      type: 'web',
      name: 'publicUrl',
      path: '/',
      prefix: '*',
      port: 'BLOCKLET_PORT',
      protocol: 'http',
    },
  ],
  community: '',
  documentation: '',
  homepage: '',
  license: '',
  payment: {
    price: [] as number[],
    share: [] as { name: string; address: string; value: number }[],
  },
  timeout: {
    start: 60,
  },
  requirements: {
    server: '>=1.6.29',
    os: '*',
    cpu: '*',
  },
  scripts: {
    preStart: 'node api/hooks/pre-start.js',
    dev: 'npm run start',
  },
  environments: [
    {
      name: 'CHAIN_HOST',
      description: "What's endpoint of the chain?",
      required: true,
      default: 'https://beta.abtnetwork.io/api/',
      secure: false,
      shared: true,
    },
  ],
  capabilities: {
    clusterMode: false,
    component: true,
  },
  screenshots: ['0-image0.jpeg', '1-image1.webp'],
  children: [] as any[],
  gitHash: '27c7044344ffb27159e529df4691913ed406fc66',
  path: '/dapp/express-test',
  nftFactory: '',
  dist: {
    tarball: 'express-test-0.1.62.tgz',
    integrity: 'sha512-BOo++mdZq44k1HXOckqyQUQktX2R6/HLVx87r2WavzLVv6RepPDJrA+ouFGObGvdiQyEezNpJrrcUF1HcEOUOw==',
  },
  signatures: [
    {
      type: 'ED25519',
      name: 'Blocklet Store',
      signer: 'zNKtjUQNGzAHziDS3Gqmw7dePhB8JEWemaTi',
      pk: 'z5vwnMQAUhQ28hvSFfhpgnSGppZSeDm5GzE3JzKGW4VKT',
      excludes: ['htmlAst', 'lastPublishedAt', 'stats', 'readme'],
      appended: ['htmlAst', 'lastPublishedAt', 'stats', 'readme'],
      created: '2022-04-22T07:29:43.284Z',
      sig: 'z2EmiPGkc3vSEsGVXhShVeiHr2zN48LSX3BSGE2dPRnenaNyR4GjuDQiAq86EVEcADHTk4HU7ZC2fNT7DSueRfyAE',
    },
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
    {
      type: 'ED25519',
      name: 'express-test',
      signer: 'z1a4JZKKgMDK3qJNcxMhuobMVDVJe2g1DxE',
      pk: 'z7zdPat4eNoTiSGr2b8gkjv66CDaPmSHeGcC84Z1Lz8Qd',
      created: '2022-04-22T07:29:42.890Z',
      sig: 'z47VFmH6rAkK5DEugjhcFzHFmSmV1eBioRh8PUkhAN2KegnN4pHidZE2f3NnoCmQWFrmTYr4LfzLWaiFqx54xFD6q',
    },
  ],
  readme:
    '# Meilisearch\n\nA blocklet built on meilisearch 234.\n\n## core functions\n\n- Support all functions of [meilisearch](https://docs.meilisearch.com/)\n\n## configuration\n\n<!-- @see: https://github.com/blocklet/blocklet-specification/blob/main/docs/meta.md#blocklet-definition -->\n\n## help\n\n- Learn more about the usage of **meilisearh**: <https://docs.meilisearch.com/learn/getting_started/quick_start.html>\n',
  stats: {
    downloads: 18,
  },
  lastPublishedAt: '2022-04-22T07:29:43.391Z',
};

const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const createSignatureData = (
  wallet: ReturnType<typeof createAppWallet>,
  name: string,
  extra: Record<string, any> = {}
) => {
  const walletJSON = wallet.toJSON();

  return {
    type: walletJSON.type.pk,
    name,
    signer: walletJSON.address,
    pk: toBase58(walletJSON.pk),
    created: new Date('2026-04-22T00:00:00.000Z').toISOString(),
    ...extra,
  };
};

const signSignature = async (
  meta: Record<string, any>,
  signature: Record<string, any>,
  signatures: Record<string, any>[],
  wallet: ReturnType<typeof createAppWallet>,
  omitFields: string[] = []
) => {
  const payload = omit({ ...meta, signatures }, omitFields);
  return toBase58(await wallet.sign(stableStringify(payload)));
};

const signNormalBlockletMeta = async (source: Record<string, any>) => {
  const meta = omit(cloneDeep(source), 'signatures');
  const storeWallet = createAppWallet();
  const blockletWallet = createAppWallet();

  const blockletSignature = createSignatureData(blockletWallet, 'kitchen-sink-blocklet');
  blockletSignature.sig = await signSignature(meta, blockletSignature, [blockletSignature], blockletWallet, [
    'htmlAst',
    'lastPublishedAt',
    'stats',
  ]);

  const storeSignature = createSignatureData(storeWallet, 'development', {
    excludes: ['htmlAst', 'stats'],
    appended: ['htmlAst', 'lastPublishedAt', 'stats'],
  });
  storeSignature.sig = await signSignature(meta, storeSignature, [storeSignature, blockletSignature], storeWallet, [
    'htmlAst',
    'stats',
  ]);

  return { ...meta, signatures: [storeSignature, blockletSignature] };
};

const signDelegationBlockletMeta = async (source: Record<string, any>) => {
  const meta = omit(cloneDeep(source), 'signatures');
  const storeWallet = createAppWallet();
  const appWallet = createAppWallet();
  const blockletWallet = createAppWallet();
  const storeWalletJSON = storeWallet.toJSON();
  const appWalletJSON = appWallet.toJSON();
  const appended = ['htmlAst', 'lastPublishedAt', 'stats', 'readme'];

  const blockletSignature = createSignatureData(blockletWallet, 'express-test');
  blockletSignature.sig = await signSignature(meta, blockletSignature, [blockletSignature], blockletWallet, appended);

  const delegation = await signJwt(
    appWalletJSON.address,
    appWalletJSON.sk,
    {
      exp: 4806286142,
      from: appWalletJSON.address,
      permissions: ['publish_blocklet'],
      to: storeWalletJSON.address,
      userPk: toBase58(appWalletJSON.pk),
    },
    true,
    '1.1.0'
  );
  const delegatedSignature = createSignatureData(appWallet, 'express-test', {
    delegatee: storeWalletJSON.address,
    delegateePk: toBase58(storeWalletJSON.pk),
    delegation,
    excludes: appended,
    appended,
  });
  delegatedSignature.sig = await signSignature(
    meta,
    delegatedSignature,
    [delegatedSignature, blockletSignature],
    storeWallet,
    appended
  );

  const storeSignature = createSignatureData(storeWallet, 'Blocklet Store', {
    excludes: appended,
    appended,
  });
  storeSignature.sig = await signSignature(
    meta,
    storeSignature,
    [storeSignature, delegatedSignature, blockletSignature],
    storeWallet,
    appended
  );

  return { ...meta, signatures: [storeSignature, delegatedSignature, blockletSignature] };
};

describe('verify-multi-sig.spec', () => {
  let normalBlockletMeta: any;
  let delegationBlockletMeta: any;
  beforeEach(async () => {
    mock.restore();
    normalBlockletMeta = await signNormalBlockletMeta(normalBlockletMetaSource);
    delegationBlockletMeta = await signDelegationBlockletMeta(delegationBlockletMetaSource);
  });
  test('should throw error if the signatures field is not an array', () => {
    expect(verify({ name: 'test' } as any)).rejects.toThrow(/signatures should be an array/);
    expect(verify({ name: 'test', signatures: null } as any)).rejects.toThrow(/signatures should be an array/);
  });
  test('should throw error if the signatures field is an empty array', () => {
    expect(verify({ name: 'test', signatures: [] } as any)).rejects.toThrow(/found empty/);
  });
  describe('normalBlockletMeta', () => {
    test('should return true if the signatures are valid', async () => {
      expect(await verify(normalBlockletMeta)).toBe(true);
    });
    test('should return false if the meta was modified', async () => {
      normalBlockletMeta.name = 'fake name';
      expect(await verify(normalBlockletMeta)).toBe(false);
    });
    test('should return false if the signature was modified', async () => {
      normalBlockletMeta.signatures[1].sig = 'fake sign';
      expect(await verify(normalBlockletMeta)).toBe(false);
    });
  });
  describe('delegationBlockletMeta', () => {
    test('should be return true if the signatures are valid', async () => {
      expect(await verify(delegationBlockletMeta)).toBeTruthy();
    });
    test('should return false if the meta was modified', async () => {
      delegationBlockletMeta.name = 'fake name';
      expect(await verify(delegationBlockletMeta)).toBeFalsy();
    });
    test('should be return false if the signatures was modified', async () => {
      delegationBlockletMeta.signatures[1].sig = 'fake sign';
      expect(await verify(delegationBlockletMeta)).toBeFalsy();
    });
    test('should be return false if verify payload.from failed', async () => {
      const [, signature] = delegationBlockletMeta.signatures;

      delegationBlockletMeta.signatures = [signature];
      signature.signer = 'fake signer';
      const result = await verify(delegationBlockletMeta);
      expect(result).toBe(false);
    });
    test('should be return false if verify payload.to failed', async () => {
      const [, signature] = delegationBlockletMeta.signatures;

      delegationBlockletMeta.signatures = [signature];
      signature.delegatee = 'fake delegatee';
      const result = await verify(delegationBlockletMeta);
      expect(result).toBe(false);
    });
    test('should be return false if verify payload.permissions failed', async () => {
      const [, signature] = delegationBlockletMeta.signatures;

      delegationBlockletMeta.signatures = [signature];
      const jsonParseSpy = spyOn(JSON, 'parse').mockImplementation(() => {
        return {
          from: signature.singer,
          to: signature.delegatee,
          permissions: ['error publish'],
        };
      });

      const result = await verify(delegationBlockletMeta);
      expect(result).toBe(false);
      jsonParseSpy.mockRestore();
    });
    test('should be return false if verify delegation token failed', async () => {
      const [, signature] = delegationBlockletMeta.signatures;

      delegationBlockletMeta.signatures = [signature];
      signature.pk = 'fake pk';
      const result = await verify(delegationBlockletMeta);
      expect(result).toBe(false);
    });
  });
});
