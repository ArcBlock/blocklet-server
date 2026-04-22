// @ts-nocheck
import { describe, test, expect, beforeAll } from 'bun:test';
import detectPort from 'detect-port';
import express from 'express';
import * as bodyParser from 'body-parser';
import cloneDeep from 'lodash/cloneDeep';
import { fromPublicKey } from '@arcblock/did';
import { fromSecretKey, WalletType } from '@ocap/wallet';
import { types } from '@ocap/mcrypto';
import { toHex } from '@ocap/util';
import cors from 'cors';

import {
  createNftFactoryItx as createNftFactoryItx$0,
  verifyNftFactory as verifyNftFactory$0,
  verifyPaymentIntegrity as verifyPaymentIntegrity$0,
  checkFreeBlocklet as checkFreeBlocklet$0,
  _test,
} from '../../src/payment/v2';
import { toBlockletDid } from '../../src/did';

const {
  createNftFactoryItx,
  verifyNftFactory,
  verifyPaymentIntegrity,
  checkFreeBlocklet,
  _test: { getFactoryInput, getPaymentIntegrity, getPriceTokens, getComponents, getContract },
} = {
  createNftFactoryItx: createNftFactoryItx$0,
  verifyNftFactory: verifyNftFactory$0,
  verifyPaymentIntegrity: verifyPaymentIntegrity$0,
  checkFreeBlocklet: checkFreeBlocklet$0,
  _test,
};

// const sleep = (t = 1000) => new Promise((r) => setTimeout(r, t));

const toTokenDid = (name: string) => {
  const pk = toHex(Buffer.from(typeof name === 'string' ? name.trim() : name));

  return fromPublicKey(pk, { role: types.RoleType.ROLE_TOKEN });
};

const toAccountDid = (name: string) => {
  const pk = toHex(Buffer.from(typeof name === 'string' ? name.trim() : name));

  return fromPublicKey(pk, { role: types.RoleType.ROLE_ACCOUNT });
};

const store1Wallet = fromSecretKey(
  '0x9cb66a1c9f6ba5cac10b5b2006e0c0101dbe0d5b4d44936492713f7ed0df1c3bc26b7850014a5babd48212e63947057dc48b39d4f867cbdca2eeca240a55051a',
  WalletType({
    role: types.RoleType.ROLE_APPLICATION,
  })
);

const store1Info = {
  id: store1Wallet.address,
  pk: store1Wallet.publicKey,
};

let store1Url = '';

const store2Wallet = fromSecretKey(
  '0x9f6a723f8ef802afb177db0973571455cda122beab987ad0726187b21146445cd76ef50fbc78536a942c2d6a00c83f2b4561c1000ef9b1ea687d62aff328a242',
  WalletType({
    role: types.RoleType.ROLE_APPLICATION,
  })
);

const store2Info = {
  id: store2Wallet.address,
  pk: store2Wallet.publicKey,
};

let store2Url = '';

const TokenDecimal = 18;

const ocapClient = {
  getTokenState({ address }: { address: string }) {
    if (address === 'not-exist') {
      return {};
    }

    return {
      state: {
        address,
        decimal: TokenDecimal,
      },
    };
  },
};

const requiredPropsInMeta = {
  version: '1.0.0',
  description: 'xxx',
  group: 'dapp',
  main: 'xxx',
};

const blocklet1 = {
  name: 'blocklet1',
  did: toBlockletDid('blocklet1'),
  payment: {
    componentPrice: [
      {
        type: 'fixed',
        value: 2,
      },
    ],
    price: [],
    share: [
      {
        name: 'blocklet1-owner',
        address: toAccountDid('blocklet1-owner'),
        value: 0.7,
      },
      {
        name: 'store1',
        address: store1Wallet.address,
        value: 0.3,
      },
    ],
  },
  ...requiredPropsInMeta,
};

const blocklet1V2 = {
  ...blocklet1,
  version: '2.0.0',
};

const blocklet2 = {
  name: 'blocklet2',
  did: toBlockletDid('blocklet2'),
  payment: {
    componentPrice: [
      {
        type: 'percentage',
        value: 0.2,
      },
    ],
    price: [],
    share: [
      {
        name: 'blocklet2-owner',
        address: toAccountDid('blocklet2-owner'),
        value: 0.7,
      },
      {
        name: 'store2',
        address: store2Wallet.address,
        value: 0.3,
      },
    ],
  },
  price: [],
  share: [],
  ...requiredPropsInMeta,
};

let blocklet1a: {
  name?: string;
  did?: string;
  payment?: any;
  children?: any;
} = {};

const blocklet2a = {
  name: 'blocklet2a',
  did: toBlockletDid('blocklet2a'),
  ...requiredPropsInMeta,
};

const componentDisabledBlocklet = {
  name: 'component-disabled-blocklet',
  did: toBlockletDid('component-disabled-blocklet'),
  ...requiredPropsInMeta,
  capabilities: {
    component: false,
  },
};

const freeBlocklet = {
  name: 'free-blocklet',
  did: toBlockletDid('free-blocklet'),
  ...requiredPropsInMeta,
};

const app1PriceToken = {
  address: toTokenDid('app1-token'),
  value: 10,
  decimal: TokenDecimal,
};
const app2PriceToken = {
  value: 20,
};

let app1Meta: any = {};
let app2Meta: any = {};

beforeAll(async () => {
  const store1Port = await detectPort();

  const store2Port = await detectPort();

  store1Url = `http://127.0.0.1:${store1Port}`;
  store2Url = `http://127.0.0.1:${store2Port}`;

  blocklet1a = {
    name: 'blocklet1a',
    did: toBlockletDid('blocklet1a'),
    ...requiredPropsInMeta,
    payment: {
      componentPrice: [
        {
          type: 'fixed',
          value: 4,
        },
      ],
      price: [],
      share: [
        {
          name: 'blocklet1a-owner',
          address: toAccountDid('blocklet1a-owner'),
          value: 0.7,
        },
        {
          name: 'store2',
          address: store2Wallet.address,
          value: 0.3,
        },
      ],
    },
    children: [
      {
        name: 'b2',
        mountPoint: '/b2',
        source: {
          store: store2Url,
          name: blocklet2.name,
        },
      },
    ],
  };

  app1Meta = {
    name: 'test-app',
    did: toBlockletDid('test-app'),
    version: '5.0.0',
    payment: {
      price: [
        {
          address: app1PriceToken.address,
          value: app1PriceToken.value,
        },
      ],
      share: [
        {
          name: 'app1-owner',
          address: toAccountDid('app1-owner'),
          value: 0.7,
        },
        {
          name: 'store1',
          address: store1Wallet.address,
          value: 0.3,
        },
      ],
    },
    children: [
      {
        name: 'b1',
        source: {
          store: store1Url,
          name: blocklet1.name,
        },
      },
    ],
  };

  app2Meta = {
    name: 'test-app',
    did: toBlockletDid('test-app'),
    version: '5.0.0',
    payment: {
      price: [
        {
          address: app1PriceToken.address,
          value: app2PriceToken.value,
        },
      ],
      share: [
        {
          name: 'app2-owner',
          address: toAccountDid('app2-owner'),
          value: 0.7,
        },
        {
          name: 'store1',
          address: store1Wallet.address,
          value: 0.3,
        },
      ],
    },
    components: [
      {
        source: {
          store: store1Url,
          name: blocklet1.name,
        },
      },
      {
        name: 'b2',
        source: {
          store: store2Url,
          name: blocklet2.name,
        },
      },
    ],
  };

  const store1Server = express();
  store1Server.use(cors());

  store1Server.use(bodyParser.json());
  store1Server.get('/api/store.json', (req, res) => {
    res.json(store1Info);
  });
  store1Server.get(`/api/blocklets/${blocklet1.did}/blocklet.json`, (req, res) => {
    res.json({
      ...blocklet1,
    });
  });
  store1Server.get(
    `/api/blocklets/${blocklet1.did}/2.0.0/blocklet.json`,
    (req: express.Request, res: express.Response) => {
      res.json({
        ...blocklet1V2,
      });
    }
  );
  store1Server.get(`/api/blocklets/${blocklet1a.did}/blocklet.json`, (req, res) => {
    res.json({
      ...blocklet1a,
    });
  });
  store1Server.get(`/api/blocklets/${componentDisabledBlocklet.did}/blocklet.json`, (req, res) => {
    res.json({
      ...componentDisabledBlocklet,
    });
  });
  store1Server.get(`/api/blocklets/${freeBlocklet.did}/blocklet.json`, (req, res: express.Response) => {
    res.json({
      ...freeBlocklet,
    });
  });
  store1Server.post('/api/payment/signature', async (req, res: express.Response) => {
    const { blockletMeta, paymentIntegrity } = req.body;

    await verifyPaymentIntegrity({
      integrity: paymentIntegrity,
      blockletMeta,
      ocapClient,
      storeId: store1Wallet.address,
    });
    res.json({
      signer: store1Wallet.address,
      pk: store1Wallet.publicKey,
      signature: await store1Wallet.sign(paymentIntegrity),
    });
  });

  const store2Server = express();
  store2Server.use(cors());

  store2Server.use(bodyParser.json());
  store2Server.get('/api/store.json', (req, res) => {
    res.json(store2Info);
  });
  store2Server.get(`/api/blocklets/${blocklet1.did}/blocklet.json`, (req, res: express.Response) => {
    res.json({
      ...blocklet1,
    });
  });
  store2Server.get(`/api/blocklets/${blocklet2.did}/blocklet.json`, (req, res: express.Response) => {
    res.json({
      ...blocklet2,
    });
  });
  store2Server.get(`/api/blocklets/${blocklet2a.did}/blocklet.json`, (req, res: express.Response) => {
    res.json({
      ...blocklet2a,
    });
  });
  store2Server.post('/api/payment/signature', async (req, res: express.Response) => {
    const { blockletMeta, paymentIntegrity } = req.body;

    await verifyPaymentIntegrity({
      integrity: paymentIntegrity,
      blockletMeta,
      ocapClient,
      storeId: store2Wallet.address,
    });
    res.json({
      signer: store2Wallet.address,
      pk: store2Wallet.publicKey,
      signature: await store2Wallet.sign(paymentIntegrity),
    });
  });

  store1Server.listen(store1Port);
  store2Server.listen(store2Port);
});

test('getFactoryInput', () => {
  expect(
    getFactoryInput([
      {
        address: 'token1',
        value: 1,
        decimal: 4,
      },
    ])
  ).toEqual({
    tokens: [
      {
        address: 'token1',
        value: '10000',
      },
    ],
    assets: [],
    variables: [],
  });

  expect(
    getFactoryInput(
      [
        {
          address: 'token1',
          value: 1,
          decimal: 4,
        },
      ],
      { formatToken: false }
    )
  ).toEqual({
    tokens: [
      {
        address: 'token1',
        value: 1,
      },
    ],
    assets: [],
    variables: [],
  });
});

test('getPriceTokens', async () => {
  expect(
    await getPriceTokens(
      {
        payment: {
          price: [
            {
              address: 'token1',
              value: 2,
              otherProps: 'xxx',
            },
          ],
        },
      },
      ocapClient
    )
  ).toEqual([{ address: 'token1', value: 2, decimal: 18, otherProps: 'xxx' }]);

  expect(
    getPriceTokens(
      {
        payment: {
          price: [
            {
              address: 'not-exist',
            },
          ],
        },
      },
      ocapClient
    )
  ).rejects.toThrowError('not found on chain');
});

describe('verifyNftFactory', () => {
  test('should work as expected', async () => {
    const components = [
      { did: 'a', version: '1.0.0' },
      { did: 'b', version: '1.0.0' },
      { did: 'c', version: '1.0.0' },
    ];

    const tokens = [
      {
        address: 'token1',
        value: '3',
        otherProps: 'xxx',
      },
    ];

    const contract = "transferToken('token1', 'account1', '1');\ntransferToken('token1', 'account2', '2')";

    const f1 = {
      input: { tokens },
      hooks: [{ type: 'contract', hook: contract }],
      data: {
        value: JSON.stringify({
          stores: [
            {
              signer: store1Wallet.address,
              components,
              signature: await store1Wallet.sign(
                await getPaymentIntegrity({
                  contract,
                  factoryInput: {
                    tokens: tokens.map((x) => ({ address: x.address, value: x.value })),
                    assets: [],
                    variables: [],
                  },
                  storeComponents: components,
                })
              ),
            },
          ],
        }),
      },
    };

    expect(await verifyNftFactory({ factoryState: f1, signerWallet: store1Wallet })).toEqual({ components });

    const f2 = {
      input: { tokens },
      hooks: [{ type: 'contract', hook: contract }],
      data: {
        value: JSON.stringify({
          stores: [
            {
              signer: store1Wallet.address,
              components,
              signature: 'invalid signature',
            },
          ],
        }),
      },
    };

    expect(
      verifyNftFactory({
        factoryState: f2,
        signerWallet: store1Wallet,
      })
    ).rejects.toThrowError('verify nft factory failed');
  });

  test('store should exist in factory data', () => {
    expect(
      verifyNftFactory({
        factoryState: {
          data: {
            value: JSON.stringify({}),
          },
        },
        signerWallet: store1Wallet,
      })
    ).rejects.toThrowError('Signer does not found in factory');
  });
});

describe('getComponents', () => {
  test('should work as expected', async () => {
    const { components, stores } = await getComponents({
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [
        {
          name: 'b1',
          source: {
            store: store1Url,
            name: blocklet1.name,
          },
        },
      ],
    });

    expect(components[0].meta).toEqual(expect.objectContaining(blocklet1));
    expect(components[0].storeInfo).toEqual(store1Info);
    expect(components[0].storeUrl).toEqual(store1Url);
    expect(components[0].children).toEqual([]);

    expect(stores[0]).toEqual({
      id: store1Wallet.address,
      pk: store1Wallet.publicKey,
      url: store1Url,
      components: [{ did: blocklet1.did, version: blocklet1.version }],
    });
  });

  test('should throw error if component not exist', () => {
    expect(
      getComponents({
        name: 'test-app',
        did: toBlockletDid('test-app'),
        children: [
          {
            name: 'b1',
            source: {
              store: store1Url,
              name: 'not-exist',
            },
          },
        ],
      })
    ).rejects.toThrow('Request failed');
  });

  test('should NOT throw error if component cannot be a component', () => {
    expect(
      getComponents({
        name: 'test-app',
        did: toBlockletDid('test-app'),
        children: [
          {
            name: 'b1',
            source: {
              store: store1Url,
              name: componentDisabledBlocklet.name,
            },
          },
        ],
      })
    ).resolves.toBeTruthy();
  });

  test('bundles with the same did cannot in different stores', () => {
    expect(
      getComponents({
        name: 'test-app',
        did: toBlockletDid('test-app'),
        children: [
          {
            name: 'b1-store1',
            source: {
              store: store1Url,
              name: blocklet1.name,
            },
          },
          {
            name: 'b1-store2',
            source: {
              store: store2Url,
              name: blocklet1.name,
            },
          },
        ],
      })
    ).rejects.toThrowError('Bundles with the same did cannot in different stores');
  });

  test('multiple instance of same component', async () => {
    const { components, stores } = await getComponents({
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [
        {
          name: 'b1-1',
          source: {
            store: store1Url,
            name: blocklet1.name,
          },
        },
        {
          name: 'b1-2',
          source: {
            store: store1Url,
            name: blocklet1.name,
          },
        },
      ],
    });

    expect(components.length).toEqual(2);
    expect(components[0].meta).toEqual(components[1].meta);
    expect(components[0].storeInfo).toEqual(store1Info);
    expect(components[0].storeUrl).toEqual(store1Url);
    expect(components[0].children).toEqual([]);

    expect(stores.length).toEqual(1);
    expect(stores[0]).toEqual({
      id: store1Wallet.address,
      pk: store1Wallet.publicKey,
      url: store1Url,
      components: [{ did: blocklet1.did, version: blocklet1.version }],
    });
  });

  test('multiple instance of same component and different did version', async () => {
    const { components, stores } = await getComponents({
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [
        {
          name: 'b1v1',
          source: {
            store: store1Url,
            name: blocklet1.name,
          },
        },
        {
          name: 'b1v2',
          source: {
            store: store1Url,
            name: blocklet1V2.name,
            version: '2.0.0',
          },
        },
      ],
    });

    expect(components.length).toBe(2);
    expect(components[0].meta.name).toBe(blocklet1.name);
    expect(components[0].meta.version).toBe(blocklet1.version);
    expect(components[1].meta.name).toBe(blocklet1V2.name);
    expect(components[1].meta.version).toBe(blocklet1V2.version);

    expect(stores.length).toBe(1);
    expect(stores[0]).toEqual({
      id: store1Wallet.address,
      pk: store1Wallet.publicKey,
      url: store1Url,
      components: [
        { did: blocklet1.did, version: blocklet1.version },
        { did: blocklet1V2.did, version: blocklet1V2.version },
      ],
    });
  });

  test('nested component', async () => {
    const { components, stores } = await getComponents({
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [
        {
          name: 'b1a',
          source: {
            store: store1Url,
            name: blocklet1a.name,
          },
        },
      ],
    });

    expect(components.length).toBe(1);
    expect(components[0].meta.name).toBe(blocklet1a.name);
    expect(components[0].children.length).toBe(1);
    expect(components[0].children[0].meta.name).toBe(blocklet2.name);

    expect(stores.length).toBe(2);
    expect(stores[0]).toEqual({
      id: store1Wallet.address,
      pk: store1Wallet.publicKey,
      url: store1Url,
      components: [{ did: blocklet1a.did, version: blocklet2a.version }],
    });
    expect(stores[1]).toEqual({
      id: store2Wallet.address,
      pk: store2Wallet.publicKey,
      url: store2Url,
      components: [{ did: blocklet2.did, version: blocklet2.version }],
    });
  });
});

describe('getContract', () => {
  const priceTokens = [
    {
      address: 'token1',
      value: 10,
      decimal: 18,
    },
  ];

  const meta: any = {
    payment: {
      share: [
        {
          name: 'developer',
          address: 'account1',
          value: 0.7,
        },
        {
          name: 'store',
          address: 'store1',
          value: 0.3,
        },
      ],
    },
  };

  const components: any = [
    {
      meta: {
        title: 'Test Component',
        payment: {
          componentPrice: [
            {
              type: 'fixed',
              value: 2,
            },
          ],
          share: [
            {
              name: 'developer',
              address: 'account2',
              value: 0.7,
            },
            {
              name: 'store',
              address: 'store2',
              value: 0.3,
            },
          ],
        },
      },
    },
  ];

  test('should work as expected', () => {
    const { code, shares } = getContract({ meta, priceTokens, components });

    // 10 - 2 = 8
    // account1 = 8 * 0.7 = 5.6
    // store1 = 8 * 0.3 = 2.4
    // account2 = 2 * 0.7 = 1.4
    // store2 = 2 * 0.3 = 0.6
    // decimal = 18
    expect(code).toEqual(
      "transferToken('token1','account2','1400000000000000000');\ntransferToken('token1','store2','600000000000000000');\ntransferToken('token1','account1','5600000000000000000');\ntransferToken('token1','store1','2400000000000000000')"
    );
    expect(shares).toEqual([
      { accountName: 'developer', accountAddress: 'account2', tokenAddress: 'token1', amount: '1.4' },
      { accountName: 'store', accountAddress: 'store2', tokenAddress: 'token1', amount: '0.6' },
      { accountName: 'developer', accountAddress: 'account1', tokenAddress: 'token1', amount: '5.6' },
      { accountName: 'store', accountAddress: 'store1', tokenAddress: 'token1', amount: '2.4' },
    ]);
  });

  test('no child', () => {
    const { code, shares } = getContract({ meta, priceTokens, components: [] });

    // account1 = 10 * 0.7 = 7
    // store1 = 10 * 0.3 = 3
    // decimal = 18
    expect(code).toEqual(
      "transferToken('token1','account1','7000000000000000000');\ntransferToken('token1','store1','3000000000000000000')"
    );
    expect(shares).toEqual([
      { accountName: 'developer', accountAddress: 'account1', tokenAddress: 'token1', amount: '7' },
      { accountName: 'store', accountAddress: 'store1', tokenAddress: 'token1', amount: '3' },
    ]);
  });

  test('merge transfer', () => {
    const components1 = cloneDeep(components);

    components1[0].meta.payment.share[1].address = 'store1';

    const { code, shares } = getContract({ meta, priceTokens, components: components1 });

    // 10 - 2 = 8
    // account1 = 8 * 0.7 = 5.6
    // store1 = 8 * 0.3 = 2.4
    // account2 = 2 * 0.7 = 1.4
    // store1 = 2 * 0.3 = 0.6
    // store1(merged) = 2.4 + 0.6 = 3
    // decimal = 18
    expect(code).toEqual(
      "transferToken('token1','account2','1400000000000000000');\ntransferToken('token1','store1','3000000000000000000');\ntransferToken('token1','account1','5600000000000000000')"
    );
    expect(shares).toEqual([
      { accountName: 'developer', accountAddress: 'account2', tokenAddress: 'token1', amount: '1.4' },
      { accountName: 'store', accountAddress: 'store1', tokenAddress: 'token1', amount: '3' },
      { accountName: 'developer', accountAddress: 'account1', tokenAddress: 'token1', amount: '5.6' },
    ]);
  });

  test('percentage component price', () => {
    const components1 = cloneDeep(components);

    components1[0].meta.payment.componentPrice = [
      {
        type: 'percentage',
        value: 0.4,
      },
    ];

    const { code, shares } = getContract({ meta, priceTokens, components: components1 });

    // 10 - (10 * 0.4) = 6
    // account1 = 6 * 0.7 = 4.2
    // store1 = 6 * 0.3 = 1.8
    // account2 = 4 * 0.7 = 2.8
    // store1 = 4 * 0.3 = 1.2
    // decimal = 18
    expect(code).toEqual(
      "transferToken('token1','account2','2800000000000000000');\ntransferToken('token1','store2','1200000000000000000');\ntransferToken('token1','account1','4200000000000000000');\ntransferToken('token1','store1','1800000000000000000')"
    );
    expect(shares).toEqual([
      { accountName: 'developer', accountAddress: 'account2', tokenAddress: 'token1', amount: '2.8' },
      { accountName: 'store', accountAddress: 'store2', tokenAddress: 'token1', amount: '1.2' },
      { accountName: 'developer', accountAddress: 'account1', tokenAddress: 'token1', amount: '4.2' },
      { accountName: 'store', accountAddress: 'store1', tokenAddress: 'token1', amount: '1.8' },
    ]);
  });

  test('component price token is not same with app price token', () => {
    const components1 = cloneDeep(components);

    components1[0].meta.payment.price = [
      {
        address: 'token2',
        value: 10,
      },
    ];

    expect(() => getContract({ meta, priceTokens, components: components1 })).toThrowError(
      'The token address of the component "Test Component" is inconsistent with the blocklet. Component: token1, Composite Blocklet: token2'
    );
  });

  test('price is not enough', () => {
    const components1 = cloneDeep(components);

    components1[0].meta.payment.componentPrice = [
      {
        type: 'fixed',
        value: 100,
      },
    ];

    expect(() => getContract({ meta, priceTokens, components: components1 })).toThrowError(
      'Price for composite blocklet must be greater than 100 because paid components are included.'
    );
  });
});

describe('verifyPaymentIntegrity', () => {
  test('should work as expected', async () => {
    const { code: contract } = getContract({
      meta: app1Meta,
      priceTokens: [app1PriceToken],
      components: [{ meta: blocklet1 }],
    });

    const factoryInput = {
      tokens: [
        {
          address: app1PriceToken.address,
          value: (app1PriceToken.value ** app1PriceToken.decimal * 10).toString(),
        },
      ],
      assets: [],
      variables: [],
    };

    const storeComponents = [{ did: blocklet1.did, version: blocklet1.version }];

    const integrity = await getPaymentIntegrity({ contract, factoryInput, storeComponents });

    expect(
      verifyPaymentIntegrity({ integrity, blockletMeta: app1Meta, ocapClient, storeId: store1Wallet.address })
    ).resolves.toBeTruthy();

    expect(
      verifyPaymentIntegrity({
        integrity: 'invalid integrity',
        blockletMeta: app1Meta,
        ocapClient,
        storeId: store1Wallet.address,
      })
    ).rejects.toThrowError('verify payment integrity failed');
  });
});

describe('createNftFactoryItx', () => {
  test('payment component', async () => {
    const { itx, stores, shares } = await createNftFactoryItx({
      blockletMeta: app1Meta,
      ocapClient,
      issuers: [toAccountDid('mock-issuer')],
      storeUrl: 'mock-url',
    });

    expect(itx.data.value.name).toEqual(app1Meta.name);
    expect(itx.data.value.did).toEqual(app1Meta.did);
    expect(itx.data.value.version).toEqual(app1Meta.version);
    const s = itx.data.value.stores[0];

    expect(s.signer).toEqual(store1Wallet.address);
    expect(s.pk).toEqual(store1Wallet.publicKey);
    expect(s.signature).toBeTruthy();
    expect(s.components).toEqual([{ did: blocklet1.did, version: blocklet1.version }]);
    expect(await store1Wallet.sign(s.paymentIntegrity)).toEqual(s.signature);
    expect(await store1Wallet.verify(s.paymentIntegrity, s.signature)).toBeTruthy();
    expect(itx.data.value.payment.version).toBe('2.0.0');
    expect(stores[0].id).toBe(store1Wallet.address);

    // price = 10 = 2(blocklet1-owner) + 8(app-owner)
    // blocklet-owner = 1 * 0.7 = 1.4
    // app-owner = 8 * 0.7 = 5.6
    // store = 10 - 1.4 - 5.6 = 3
    expect(shares).toEqual([
      {
        accountName: 'blocklet1-owner',
        accountAddress: toAccountDid('blocklet1-owner'),
        tokenAddress: app1PriceToken.address,
        amount: '1.4',
      },
      {
        accountName: 'store1',
        accountAddress: store1Wallet.address,
        tokenAddress: app1PriceToken.address,
        amount: '3',
      },
      {
        accountName: 'app1-owner',
        accountAddress: toAccountDid('app1-owner'),
        tokenAddress: app1PriceToken.address,
        amount: '5.6',
      },
    ]);
  });

  test('single app', async () => {
    const meta: any = {
      name: 'test-app',
      did: toBlockletDid('test-app'),
      payment: {
        price: [
          {
            address: toTokenDid('mock-token-address'),
            value: 10,
          },
        ],
        share: [
          {
            name: 'app1-owner',
            address: toAccountDid('app1-owner'),
            value: 0.7,
          },
          {
            name: 'store1',
            address: store1Wallet.address,
            value: 0.3,
          },
        ],
      },
      children: [],
    };

    const { itx, stores, shares } = await createNftFactoryItx({
      blockletMeta: meta,
      ocapClient,
      issuers: [toAccountDid('mock-issuer')],
      storeUrl: 'mock-url',
    });

    expect(itx.data.value.stores).toEqual([]);
    expect(itx.data.value.payment.version).toBe('2.0.0');
    expect(stores).toEqual([]);

    // price = 10
    // app-owner = 10 * 0.7 = 7
    // store = 10 * 0.3 = 3
    expect(shares).toEqual([
      {
        accountName: 'app1-owner',
        accountAddress: toAccountDid('app1-owner'),
        tokenAddress: toTokenDid('mock-token-address'),
        amount: '7',
      },
      {
        accountName: 'store1',
        accountAddress: store1Wallet.address,
        tokenAddress: toTokenDid('mock-token-address'),
        amount: '3',
      },
    ]);
  });

  test('payment component in components', async () => {
    const { itx, stores, shares } = await createNftFactoryItx({
      blockletMeta: app2Meta,
      ocapClient,
      issuers: [toAccountDid('mock-issuer')],
      storeUrl: 'mock-url',
    });

    expect(itx.data.value.name).toEqual(app2Meta.name);
    expect(itx.data.value.did).toEqual(app2Meta.did);
    expect(itx.data.value.version).toEqual(app2Meta.version);
    const s = itx.data.value.stores[0];

    expect(s.signer).toEqual(store1Wallet.address);
    expect(s.pk).toEqual(store1Wallet.publicKey);
    expect(s.signature).toBeTruthy();
    expect(s.components).toEqual([{ did: blocklet1.did, version: blocklet1.version }]);
    expect(await store1Wallet.sign(s.paymentIntegrity)).toEqual(s.signature);
    expect(await store1Wallet.verify(s.paymentIntegrity, s.signature)).toBeTruthy();
    expect(itx.data.value.payment.version).toBe('2.0.0');
    expect(stores.length).toBe(2);
    expect(stores[0].id).toBe(store1Wallet.address);
    expect(stores[1].id).toBe(store2Wallet.address);

    // price = 20 = 2(blocklet1-owner) + 4(blocklet2-owner) + 14(app2-owner)
    // blocklet1-owner = 2 * 0.7 = 1.4
    // blocklet2-owner = 4 * 0.7 = 2.8
    // app2-owner = 14 * 0.7 = 9.8
    // store1 = 16 - 1.4 - 9.8 = 4.8
    // store2 = 4-2.8 = 1.2
    expect(shares).toEqual([
      {
        accountName: 'blocklet1-owner',
        accountAddress: toAccountDid('blocklet1-owner'),
        tokenAddress: app1PriceToken.address,
        amount: '1.4',
      },
      {
        accountName: 'store1',
        accountAddress: store1Wallet.address,
        tokenAddress: app1PriceToken.address,
        amount: '4.8',
      },
      {
        accountName: 'blocklet2-owner',
        accountAddress: toAccountDid('blocklet2-owner'),
        tokenAddress: app1PriceToken.address,
        amount: '2.8',
      },
      {
        accountName: 'store2',
        accountAddress: store2Wallet.address,
        tokenAddress: app1PriceToken.address,
        amount: '1.2',
      },
      {
        accountName: 'app2-owner',
        accountAddress: toAccountDid('app2-owner'),
        tokenAddress: app1PriceToken.address,
        amount: '9.8',
      },
    ]);
  });
});

describe('checkFreeBlocklet', () => {
  // use try...catch... because expect().rejects does not work as expected
  test('should throw error', async () => {
    expect.assertions(2);
    // include paid component
    const meta1: any = {
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [
        {
          name: 'b1',
          source: {
            store: store1Url,
            name: blocklet1.name,
          },
        },
      ],
    };

    try {
      await checkFreeBlocklet(meta1);
    } catch (err) {
      expect((err as Error).message).toMatch(
        'Paid component "blocklet1" found in free blocklet "test-app", which is forbidden'
      );
    }

    // itself is not free
    const meta2: any = {
      name: 'test-app',
      did: toBlockletDid('test-app'),
      payment: {
        price: [
          {
            address: app1PriceToken.address,
            value: app1PriceToken.value,
          },
        ],
      },
      children: [
        {
          name: 'b1',
          source: {
            store: store1Url,
            name: blocklet1.name,
          },
        },
      ],
    };

    try {
      await checkFreeBlocklet(meta2);
    } catch (err) {
      expect((err as Error).message).toMatch('blocklet is not free');
    }
  });

  test('should resolve', async () => {
    expect.assertions(2);

    const meta3: any = {
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [
        {
          name: 'xxx',
          source: {
            store: store1Url,
            name: freeBlocklet.name,
          },
        },
      ],
    };

    const r1 = await checkFreeBlocklet(meta3);

    expect(r1).toBe(true);

    const meta4: any = {
      name: 'test-app',
      did: toBlockletDid('test-app'),
      children: [],
    };

    const r2 = await checkFreeBlocklet(meta4);

    expect(r2).toBe(true);
  });
});
