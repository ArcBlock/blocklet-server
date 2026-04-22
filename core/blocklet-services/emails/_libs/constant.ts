export const DEFAULT_AVATAR = 'https://web.abtwallet.io/static/images/public_default_avatar.png';
export const SUPPORT_TX_TYPES = [
  'Transfer',
  'TransferV2',
  'Exchange',
  'ExchangeV2',
  'AcquireAssetV2',

  'Delegate',

  'RevokeStake',
  'ClaimStake',

  'CreateAsset',
  'CreateFactory',
  'CreateToken',

  'ConsumeAsset',
];

export const ASSETS_TYPES = {
  WALLET: 'WALLET',
  VC_BADGE: 'VC_BADGE',
  VC_CREDENTIAL: 'VC_CREDENTIAL',
  VC_CERTIFICATION: 'VC_CERTIFICATION',
  VC_TICKET: 'VC_TICKET',
  VC_PASSPORT: 'VC_PASSPORT',
  UNKNOWN: 'UNKNOWN',
  NFT_COMMON_DISPLAY: 'NFT_COMMON_DISPLAY',
};

export const NONE_FLAG = 'none';
export const IGNORE_CHAIN = [NONE_FLAG, 'abtnode', 'eth', 'playground'];

export const BLACK_LIST_CHAIN_HOST = [
  'lbd.abtnetwork.io',
  'zinc.network.arcblockio.cn',
  'app.didconnect.io',
  'ausd.abtnetwork.io',
  'zinc.abtnetwork.io',
];

export const DEFAULT_MAIN_HOST = 'https://main.abtnetwork.io/api/';
export const DEFAULT_BETA_HOST = 'https://beta.abtnetwork.io/api/';
export const TOKEN_SWAP_CHAIN_HOSTS = ['xenon.abtnetwork.io', 'xenon.network.arcblockio.cn', 'main.abtnetwork.io'];

export const ARCBLOCK_TOKEN_CONTRACT_ADDRESS = '0xB98d4C97425d9908E66E53A6fDf673ACcA0BE986';
export const ABT_TOKEN_ADDRESS = 'z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD';
export const ASSET_CHAIN_ID = 'xenon-2020-01-15';
export const BETA_CHAIN = 'beta';
export const ETH_MAIN_CHAIN_ID = 'evm-1';
export const DEFAULT_CHAIN_TOKEN = 'ABT';
export const DEFAULT_ETH_TOKEN = 'ETH';
export const DEFAULT_GAS_LIMIT = 25200;
export const DEFAULT_ERC20_GAS_LIMIT = 80000;
export const CONTRACT_GAS_LIMIT = 40000;
export const DEFAULT_WITHDRAW_GAS_LIMIT = 100000;
export const GWEI = 10 ** 9;
export const DEFAULT_DECIMAL = 18;
export const BASE_RATE = 10000;

export const CURRENT_UNIT = 'price-unit';
export const HIDE_TEST_CHAINS = 'hide-test-chains';
export const HIDE_PRICE = 'hide-balance-price';
export const DEFAULT_IPFS_GATEWAY_HOST = 'default-ipfs-gateway-host';
export const DEFAULT_IPFS_GATEWAY = 'default-ipfs-gateway';

export const TX_SEND_STATUS = {
  WAITING: 'WAITING',
  PENDING: 'PENDING',
  OK: 'OK',
  REPLACED: 'replaced',
  FAIL_BEFORE_SEND: 'fail-before-send',
  FAIL: 'fail',
};

export const INFURA_PROJECT_ID = 'ffa38bc49bc64c9c94df039a626aeeaf';
export const EVM_DEFAULT_TOKEN_ADDRESS = 'default';
export const CURRENT_VERSION = '4.0';
export const INIT_WALLET = 'init-wallet';
export const INIT_WALLET_TITLE = 'wallet-title';
export const INIT_CONNECT_SOCKET = 'have-checked-connect-socket';
export const INIT_GENERATE_DEFAULT = 'default-information-has-been-generated';

export const ENUM_SEND_TYPE = {
  EVM_ASSET: 'evm-asset',
  OCAP_ASSET: 'ocap-asset',
  EVM_TOKEN: 'evm-token',
  OCAP_TOKEN: 'ocap-token',
};

export const MAIN_OPENSEA_PROFILE = 'https://opensea.io/account';
export const TEST_OPENSEA_PROFILE = 'https://testnets.opensea.io/account';
export const VERSION_KEY = 'local-wallet-version';

export const ChainTxType = {
  Transfer: 'transfer',
  TransferV2: 'transfer_v2',
  TransferV3: 'transfer_v3',
  ExchangeV2: 'exchange_v2',
  Stake: 'stake',
  RevokeStake: 'revoke_stake',
  ClaimStake: 'claim_stake',
  CreateFactory: 'create_factory',
  CreateToken: 'create_token',
  CreateAsset: 'create_asset',
  AcquireAssetV2: 'acquire_asset_v2',
  AcquireAssetV3: 'acquire_asset_v3',
  WithdrawTokenV2: 'withdraw_token_v2',
  DepositTokenV2: 'deposit_token_v2',
  Delegate: 'delegate',
  RevokeDelegate: 'revoke_delegate',
  SlashStake: 'slash_stake',
  MintAsset: 'mint_asset',
};

export const loadingKeys = {
  migration: 'migrationProviderLoading',
  generate: 'generateProviderLoading',
  states: 'statesProviderLoading',
  importData: 'isImportBackupFile',
  security: 'securityPassword',
};

export const DEFAULT_TOKEN_ADDRESS = [NONE_FLAG, EVM_DEFAULT_TOKEN_ADDRESS];

export const KEY_PAIR_APP_ID = 'zfffffffffffffffffffffffffffffffff';
