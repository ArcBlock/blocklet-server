/* eslint-disable no-await-in-loop */
import crypto from 'crypto';
import Debug from 'debug';
import { joinURL } from 'ufo';
import stableStringify from 'json-stable-stringify';
import get from 'lodash/get';
import pick from 'lodash/pick';
import cloneDeep from 'lodash/cloneDeep';
import { BN, fromTokenToUnit, fromUnitToToken } from '@ocap/util';
import { isValidFactory } from '@ocap/asset';
import { fromPublicKey } from '@ocap/wallet';
import { toFactoryAddress } from '@arcblock/did-util';
import * as did from '@arcblock/did';
// @ts-ignore
import { BLOCKLET_STORE_META_PATH } from '@abtnode/constant';
import { getBlockletPurchaseTemplate } from '../nft-templates';
import { validateMeta } from '../validate';
import { isFreeComponent, isFreeBlocklet } from '../util';
import { getBlockletMetaFromUrls, getSourceUrlsFromConfig } from '../util-meta';
import { TComponent, TBlockletMeta } from '../types';

import axios from '../axios';

const debug = Debug('@blocklet/meta:payment');

const { toTypeInfo } = did;
const VERSION = '2.0.0';
const ZeroBN = new BN(0);
const defaultDecimals = 1e6; // we only support 6 decimals on share ratio
const defaultDecimalsBN = new BN(defaultDecimals);
const getComponentConfig = (meta: TBlockletMeta & { children?: TComponent[] }) =>
  [].concat(meta.components || meta.children).filter(Boolean);

const safeMul = (a: string | number, b: number): number =>
  Number(
    fromUnitToToken(
      fromTokenToUnit(a)
        .mul(new BN(b * defaultDecimals))
        .div(defaultDecimalsBN)
    )
  );

const md5 = (str: string): string => crypto.createHash('md5').update(str).digest('hex');

const getStoreInfo = async (url: string): Promise<{ id: string }> => {
  const storeMetaUrl = joinURL(new URL(url).origin, BLOCKLET_STORE_META_PATH);
  const { data: info } = await axios.get(storeMetaUrl, { timeout: 8000 });
  return info;
};

/**
 * @typedef {{
 *   meta: Object
 *   storeInfo: Object
 *   storeUrl: string
 *   children: Array<Component>
 * }} Component
 *
 * @param {TBlockletMeta} inputMeta
 * @param {{
 *   ancestors: Array<{TBlockletMeta}>
 *   bundles: {
 *     <bundleName>: <storeId>
 *   }
 * }} context
 *
 * @returns {Array<Component>}
 */
const innerGetComponents = async (
  inputMeta: TBlockletMeta,
  context: {
    ancestors?: Array<{ meta: TBlockletMeta }>;
    bundles?: { [key: string]: string };
  } = {}
  // eslint-disable-next-line no-use-before-define
): Promise<Component[]> => {
  // FIXME: Should we validate: same chain; duplicate components?
  const { ancestors = [], bundles = {} } = context;

  // check ancestor length
  if (ancestors.length > 40) {
    throw new Error('The depth of component should not exceed 40');
  }
  const configs: any[] = getComponentConfig(inputMeta);

  if (!configs || !configs.length) {
    return [];
  }
  const children = [];

  for (const config of configs) {
    // get component meta
    const urls = getSourceUrlsFromConfig(config);

    let meta: TBlockletMeta;
    let url: string;
    try {
      const res = await getBlockletMetaFromUrls(urls, {
        returnUrl: true,
        validateFn: (m: TBlockletMeta) => validateMeta(m),
        ensureTarball: false,
      });

      meta = res.meta;
      url = res.url;
    } catch (err) {
      throw new Error(`Failed get component meta: ${config.title || config.name}: ${err.message}`);
    }
    // check circular dependencies
    if (ancestors.map((x) => x.meta?.did).indexOf(meta.did) > -1) {
      throw new Error('Blocklet components have circular dependencies');
    }
    // generate child
    const child: any = {
      meta,
    };

    // child store info
    if (config.source.store) {
      const storeInfo = await getStoreInfo(url);

      // check uniq bundle did in different stores
      if (!bundles[child.meta.did]) {
        bundles[child.meta.did] = storeInfo.id;
      } else if (bundles[child.meta.did] !== storeInfo.id) {
        throw new Error('Bundles with the same did cannot in different stores');
      }
      child.storeInfo = storeInfo;
      child.storeUrl = new URL(url).origin;
    }
    // child children

    child.children = await innerGetComponents(meta, {
      ancestors: [...ancestors, { meta }],
      bundles,
    });
    children.push(child);
  }
  return children;
};

export interface Store {
  id: string;
  pk: string;
  url: string;
  components: Array<{ did: string; version: string }>;
}

export interface Component {
  meta: TBlockletMeta;
  storeInfo: {
    id: string;
    pk: string;
  };
  storeUrl: string;
  children: Component[];
}

/**
 * @param {Array<Component>} components
 * @param {Array<Store>} _stores
 * @returns {Array<Store>}
 */
const getStores = (components: Component[], _stores: Store[] = []): Array<Store> => {
  for (const { meta, storeInfo, storeUrl, children } of components) {
    if (storeInfo && (!isFreeBlocklet(meta) || !isFreeComponent(meta))) {
      const store = _stores.find((x) => x.id === storeInfo.id);

      if (!store) {
        _stores.push({
          id: storeInfo.id,
          pk: storeInfo.pk,
          url: storeUrl,
          components: [{ did: meta.did, version: meta.version }],
        });
      } else if (!store.components.some((x) => x.did === meta.did && x.version === meta.version)) {
        store.components.push({ did: meta.did, version: meta.version });
      }
    }
    if (children && children.length > 0) {
      getStores(children, _stores);
    }
  }
  return _stores;
};

const getComponents = async (
  inputMeta: any
): Promise<{
  components: Component[];
  stores: Store[];
}> => {
  const components = await innerGetComponents(inputMeta);

  const stores = await getStores(components);

  return { components, stores };
};

const getPriceTokens = async (meta: any, ocapClient: any): Promise<any> => {
  const priceTokens = cloneDeep(get(meta, 'payment.price', []));

  for (const token of priceTokens) {
    // eslint-disable-next-line no-await-in-loop
    const { state } = await ocapClient.getTokenState({ address: token.address });

    if (!state) {
      throw new Error(`Token specified in blocklet meta was not found on chain: ${token.address}`);
    }

    token.decimal = state.decimal;
  }
  return priceTokens;
};

const getChildShare = (childMeta: any, parentPrice: number): number => {
  if (!childMeta?.payment?.componentPrice) {
    return 0;
  }
  const priceList = childMeta.payment.componentPrice;

  let price = 0;
  for (const { type, value, parentPriceRange } of priceList) {
    const isDefault = !parentPriceRange || !parentPriceRange.length;

    const skip = isDefault && price !== 0;

    const inRange =
      isDefault || (parentPriceRange && parentPrice >= parentPriceRange[0] && parentPrice <= parentPriceRange[1]);

    if (!skip && inRange) {
      if (type === 'fixed') {
        price = value;
      } else if (type === 'percentage') {
        price = safeMul(parentPrice, value);
      }
    }
  }
  return price;
};

/**
 * @returns {Array<{
 *   tokenAddress: string
 *   accountAddress: string
 *   amount: BN
 * }>}
 */
const getTokenTransfers = ({
  priceToken,
  shares = [],
  components = [],
}): Array<{
  tokenAddress: string;
  accountAddress: string;
  amount: BN;
}> => {
  // check share
  const shareSum = shares.reduce((sum, x) => sum + x.value, 0);

  if (shareSum > 1) {
    throw new Error('payment.share invalid: share sum should not be greater than 1');
  }
  const { value: price } = priceToken;

  let parentShareBN = fromTokenToUnit(price, priceToken.decimal);
  const contracts = [];

  for (const child of components) {
    if (!isFreeComponent(child.meta)) {
      // // check same token
      const [token] = child.meta.payment.price || [];

      if (token && token.address !== priceToken.address) {
        throw new Error(
          `The token address of the component "${
            child.meta.title || child.meta.name
          }" is inconsistent with the blocklet. Component: ${priceToken.address}, Composite Blocklet: ${token.address}`
        );
      }
      const childShare = getChildShare(child.meta, price);

      parentShareBN = parentShareBN.sub(fromTokenToUnit(childShare, priceToken.decimal));
      const componentContracts = getTokenTransfers({
        priceToken: { ...priceToken, value: childShare },
        shares: child.meta.payment.share,
        components: child.children || [],
      });

      contracts.push(...componentContracts);
    }
  }
  if (parentShareBN.lt(ZeroBN)) {
    const needPrice = fromUnitToToken(fromTokenToUnit(price, priceToken.decimal).sub(parentShareBN));

    throw new Error(
      `Price for composite blocklet must be greater than ${needPrice} because paid components are included.`
    );
  }
  shares.forEach(({ name, address: accountAddress, value: ratio }) => {
    contracts.push({
      tokenAddress: priceToken.address,
      accountName: name,
      accountAddress,
      amount: parentShareBN.mul(new BN(ratio * defaultDecimals)).div(defaultDecimalsBN),
    });
  });
  const mergedContracts = [];

  contracts.forEach((x) => {
    const index = mergedContracts.findIndex(
      (y) => y.tokenAddress === x.tokenAddress && y.accountAddress === x.accountAddress
    );

    if (index > -1) {
      mergedContracts[index].amount = mergedContracts[index].amount.add(x.amount);
    } else {
      mergedContracts.push(x);
    }
  });
  return mergedContracts;
};

const getContract = ({
  meta,
  priceTokens,
  components,
}: {
  meta: TBlockletMeta;
  priceTokens: Array<{
    decimal: number;
  }>;
  components;
}): {
  code: string;
  shares: {
    amount: string;
    tokenAddress: string;
    accountAddress: string;
  }[];
} => {
  const shares = meta.payment.share || [];

  const [priceToken] = priceTokens;

  const contracts = getTokenTransfers({ priceToken, shares, components });

  const code = contracts
    .map((x) => `transferToken('${x.tokenAddress}','${x.accountAddress}','${x.amount.toString()}')`)
    .join(';\n');

  const shareList = contracts.map((x) => ({
    ...x,
    amount: fromUnitToToken(x.amount, priceToken.decimal),
  }));

  return {
    code,
    shares: shareList,
  };
};

/**
 * we need to ensure that blocklet purchase factory does not change across changes
 *
 * @typedef {{
 *   data: {
 *     type: 'json'
 *     value: {
 *       did: string
 *       url: string
 *       name: string
 *       version: string
 *       payment: {
 *         version: string
 *       }
 *       stores: Array<{
 *         signer: string
 *         pk: string
 *         signature: string
 *         components: Array<{did: string, version: string}>
 *         paymentIntegrity: string
 *       }>
 *     }
 *   }
 * }} Itx
 * @returns {Itx}
 */
const innerCreateNftFactoryItx = ({
  meta,
  issuers,
  serviceUrl,
  storeSignatures,
  factoryInput,
  contract,
}: {
  meta: TBlockletMeta;
  issuers: string[];
  serviceUrl: string;
  storeSignatures: any[];
  factoryInput: any;
  contract: any;
}) => {
  const factoryOutput = getBlockletPurchaseTemplate(serviceUrl);

  const itx: any = {
    name: meta.title || meta.name,
    description: `Purchase NFT factory for blocklet ${meta.name}`,
    settlement: 'instant',
    limit: 0,
    trustedIssuers: issuers,
    input: factoryInput,
    output: {
      issuer: '{{ctx.issuer.id}}',
      parent: '{{ctx.factory}}',
      moniker: 'BlockletPurchaseNFT',
      readonly: true,
      transferrable: false,
      data: factoryOutput,
    },
    data: {
      type: 'json',
      value: {
        did: meta.did,
        url: joinURL(serviceUrl, `/blocklet/${meta.did}`),
        name: meta.name,
        version: meta.version,
        payment: {
          version: VERSION,
        },
        stores: storeSignatures.map((x) => pick(x, ['signer', 'pk', 'signature', 'components', 'paymentIntegrity'])),
      },
    },
    hooks: [
      {
        name: 'mint',
        type: 'contract',
        hook: contract,
      },
    ],
  };

  itx.address = toFactoryAddress(itx);
  // @ts-expect-error FIXME: help wanted
  isValidFactory(itx, true);
  return itx;
};

const getFactoryInput = (
  inputTokens: Array<{
    address: string;
    value: string | number;
    decimal: number;
  }>,
  { formatToken = true } = {}
): {
  tokens: Array<{
    address: string;
    value: string | number;
    decimal: number;
  }>;
  assets: [];
  variables: [];
} => {
  const tokens = cloneDeep(inputTokens);

  tokens.forEach((token) => {
    if (formatToken) {
      token.value = fromTokenToUnit(token.value, token.decimal).toString();
    }
    delete token.decimal;
  });
  return {
    tokens,
    assets: [],
    variables: [],
  };
};

const getPaymentIntegrity = async ({
  contract,
  factoryInput,
  storeComponents,
  meta,
  client,
  storeId,
}: {
  contract?: string;
  factoryInput?: any;
  storeComponents?: any;
  meta?: any;
  client?: any;
  storeId?: string;
}): Promise<string> => {
  if (!contract && !factoryInput && !storeComponents) {
    const priceTokens = await getPriceTokens(meta, client);

    const { components, stores } = await getComponents(meta);

    const store = stores.find((x) => x.id === storeId);

    // eslint-disable-next-line no-param-reassign
    contract = getContract({ meta, components, priceTokens }).code;
    // eslint-disable-next-line no-param-reassign
    factoryInput = await getFactoryInput(priceTokens);
    // eslint-disable-next-line no-param-reassign
    storeComponents = store?.components || [];
  }
  const paymentData = {
    factoryInput,
    contract,
    components: storeComponents || [],
  };

  const integrity = md5(stableStringify(paymentData));

  return integrity;
};

const getStoreSignatures = async ({
  meta,
  stores,
  factoryInput,
  contract,
}: {
  meta: TBlockletMeta;
  stores: Store[];
  factoryInput: any;
  contract: string;
}): Promise<{
  storeSignatures: {
    signer: string;
    pk: string;
    signature: string;
    components: any;
    paymentIntegrity: string;
    storeUrl: string;
  }[];
}> => {
  const storeSignatures = [];

  for (const store of stores) {
    const { id, url, pk, components: storeComponents } = store;

    const paymentIntegrity = await getPaymentIntegrity({ factoryInput, contract, storeComponents });

    /**
     * protocol: /api/payment/signature
     * method: POST
     * body: { blockletMeta, paymentIntegrity, paymentVersion }
     * return: { signer, pk, signature}
     */
    const { data: res } = await axios.post(
      `${url}/api/payment/signature`,
      {
        blockletMeta: meta,
        paymentIntegrity,
        paymentVersion: VERSION,
      },
      { timeout: 20000 }
    );

    if (res.signer !== id) {
      throw new Error('store signature: store id does not match');
    }

    if (res.pk !== pk) {
      throw new Error('store signature: store pk does not match');
    }

    // verify sig
    const type = toTypeInfo(id);
    const wallet = fromPublicKey(pk, type);
    const verifyRes = await wallet.verify(paymentIntegrity, res.signature);

    if (verifyRes !== true) {
      throw new Error('verify store signature failed');
    }

    storeSignatures.push({
      signer: res.signer,
      pk: res.pk,
      signature: res.signature,
      components: storeComponents,
      paymentIntegrity,
      storeUrl: url,
    });
  }

  return {
    storeSignatures,
  };
};

/**
 * Used by CLI and Store to independent compute factory itx
 *
 * @param {{
 *   blockletMeta: TBlockletMeta,
 *   ocapClient: OcapClient,
 *   issuers: Array<string>,
 *   storeUrl: string,
 * }}
 * @returns {{
 *   itx: Itx
 *   store: Array<{id, url}>
 *   shares: Array<{
 *     accountName: string
 *     accountAddress: DID
 *     tokenAddress: DID
 *     amount: string|number,
 *   }>
 * }}
 */
const createNftFactoryItx = async ({
  blockletMeta,
  ocapClient,
  issuers,
  storeUrl,
}: {
  blockletMeta: TBlockletMeta;
  ocapClient: any;
  issuers: string[];
  storeUrl: string;
}) => {
  const priceTokens = await getPriceTokens(blockletMeta, ocapClient);

  const { components, stores } = await getComponents(blockletMeta);

  const factoryInput = getFactoryInput(priceTokens);

  const { code: contract, shares } = getContract({
    meta: blockletMeta,
    priceTokens,
    components,
  });

  const { storeSignatures } = await getStoreSignatures({
    meta: blockletMeta,
    stores,
    factoryInput,
    contract,
  });

  return {
    itx: innerCreateNftFactoryItx({
      meta: blockletMeta,
      issuers,
      serviceUrl: storeUrl,
      storeSignatures,
      factoryInput,
      contract,
    }),
    stores: storeSignatures.map((x) => ({ id: x.signer, url: x.storeUrl })),
    shares,
  };
};

/**
 * Used by Store before generating payment signature
 *
 * @param {{
 *   integrity: string,
 *   blockletMeta: TBlockletMeta,
 *   ocapClient: OcapClient,
 *   storeId: string
 * }}
 * @returns {string} integrity
 */
const verifyPaymentIntegrity = async ({
  integrity: expected,
  blockletMeta,
  ocapClient,
  storeId,
}: {
  integrity: string;
  blockletMeta: TBlockletMeta;
  ocapClient: any;
  storeId: string;
}): Promise<string> => {
  const actual = await getPaymentIntegrity({ meta: blockletMeta, client: ocapClient, storeId });

  if (actual !== expected) {
    throw new Error('verify payment integrity failed');
  }
  return expected;
};

/**
 * Used by Store before generating downloadToken
 *
 * @param {{
 *   {FactoryState} factoryState
 *   {Wallet} signerWallet
 * }}
 *
 * @returns {{
 *   components: Array<{did: string, version: string}>
 * }}
 */
const verifyNftFactory = async ({
  factoryState,
  signerWallet,
}: {
  factoryState: {
    data: {
      value: string;
    };
    input?: any;
    address?: string;
    hooks?: Array<{
      type: string;
      hook: string;
    }>;
  };
  signerWallet;
}): Promise<any> => {
  const data = JSON.parse(factoryState?.data?.value);

  const stores = data?.stores || [];

  const store = stores.find((x) => x.signer === signerWallet.address);

  if (!store) {
    throw new Error(
      `Signer does not found in factory. factory: ${factoryState.address}, signer: ${signerWallet.address}`
    );
  }
  const c = factoryState.hooks.find((x) => x.type === 'contract');

  const { components } = store;

  // Token fields and factory fields are not identical
  const factoryInput = getFactoryInput(
    factoryState.input.tokens.map((x) => pick(x, ['address', 'value'])),
    { formatToken: false }
  );

  const integrity = await getPaymentIntegrity({
    contract: c.hook,
    factoryInput,
    storeComponents: components,
  });

  if ((await signerWallet.sign(integrity)) !== store.signature) {
    debug(store, factoryInput, integrity, components, c.hook);
    throw new Error(`verify nft factory failed: ${factoryState.address}`);
  }
  return { components };
};

/**
 * Check blocklet and all of components are free
 * Throw Error if not free
 *
 * @param {TBlockletMeta} meta
 */
const checkFreeBlocklet = async (blockletMeta: TBlockletMeta) => {
  if (!isFreeBlocklet(blockletMeta)) {
    return Promise.reject(new Error('blocklet is not free'));
  }
  const { components } = await getComponents(blockletMeta);

  const shouldAllComponentFree = (arr) => {
    arr.forEach(({ meta, children }) => {
      if (!isFreeBlocklet(meta) || !isFreeComponent(meta)) {
        // throw new Error(`Found paid component "${meta.title || meta.name}" in free blocklet`);
        throw new Error(
          `Paid component "${meta.title || meta.name}" found in free blocklet "${
            blockletMeta.title || blockletMeta.name
          }", which is forbidden`
        );
      }
      shouldAllComponentFree(children || []);
    });
  };

  shouldAllComponentFree(components);
  return true;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const _test = {
  getPriceTokens,
  getFactoryInput,
  getPaymentIntegrity,
  getComponents,
  getContract,
};
export { createNftFactoryItx };
export { verifyPaymentIntegrity };
export { verifyNftFactory };
export { checkFreeBlocklet };
export { VERSION as version };
export default {
  createNftFactoryItx,
  verifyPaymentIntegrity,
  verifyNftFactory,
  checkFreeBlocklet,
  version: VERSION,
  _test,
};
