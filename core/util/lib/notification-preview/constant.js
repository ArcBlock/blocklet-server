module.exports = {
  DEFAULT_AVATAR: 'https://web.abtwallet.io/static/images/public_default_avatar.png',
  SUPPORT_TX_TYPES: [
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
  ],

  ASSETS_TYPES: {
    WALLET: 'WALLET',
    VC_BADGE: 'VC_BADGE',
    VC_CREDENTIAL: 'VC_CREDENTIAL',
    VC_CERTIFICATION: 'VC_CERTIFICATION',
    VC_TICKET: 'VC_TICKET',
    VC_PASSPORT: 'VC_PASSPORT',
    UNKNOWN: 'UNKNOWN',
    NFT_COMMON_DISPLAY: 'NFT_COMMON_DISPLAY',
  },

  NONE_FLAG: 'none',
  IGNORE_CHAIN: ['none', 'abtnode', 'eth', 'playground'],

  BLACK_LIST_CHAIN_HOST: [
    'lbd.abtnetwork.io',
    'zinc.network.arcblockio.cn',
    'app.didconnect.io',
    'ausd.abtnetwork.io',
    'zinc.abtnetwork.io',
  ],

  DEFAULT_MAIN_HOST: 'https://main.abtnetwork.io/api/',
  DEFAULT_BETA_HOST: 'https://beta.abtnetwork.io/api/',
  TOKEN_SWAP_CHAIN_HOSTS: ['xenon.abtnetwork.io', 'xenon.network.arcblockio.cn', 'main.abtnetwork.io'],

  ARCBLOCK_TOKEN_CONTRACT_ADDRESS: '0xB98d4C97425d9908E66E53A6fDf673ACcA0BE986',
  ABT_TOKEN_ADDRESS: 'z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD',
  ASSET_CHAIN_ID: 'xenon-2020-01-15',
  BETA_CHAIN: 'beta',
  ETH_MAIN_CHAIN_ID: 'evm-1',
  DEFAULT_CHAIN_TOKEN: 'ABT',
  DEFAULT_ETH_TOKEN: 'ETH',
  DEFAULT_GAS_LIMIT: 25200,
  DEFAULT_ERC20_GAS_LIMIT: 80000,
  CONTRACT_GAS_LIMIT: 40000,
  DEFAULT_WITHDRAW_GAS_LIMIT: 100000,
  GWEI: 10 ** 9,
  DEFAULT_DECIMAL: 18,
  BASE_RATE: 10000,

  CURRENT_UNIT: 'price-unit',
  HIDE_TEST_CHAINS: 'hide-test-chains',
  HIDE_PRICE: 'hide-balance-price',
  DEFAULT_IPFS_GATEWAY_HOST: 'default-ipfs-gateway-host',
  DEFAULT_IPFS_GATEWAY: 'default-ipfs-gateway',

  TX_SEND_STATUS: {
    WAITING: 'WAITING',
    PENDING: 'PENDING',
    OK: 'OK',
    REPLACED: 'replaced',
    FAIL_BEFORE_SEND: 'fail-before-send',
    FAIL: 'fail',
  },

  INFURA_PROJECT_ID: 'ffa38bc49bc64c9c94df039a626aeeaf',
  EVM_DEFAULT_TOKEN_ADDRESS: 'default',
  CURRENT_VERSION: '4.0',
  INIT_WALLET: 'init-wallet',
  INIT_WALLET_TITLE: 'wallet-title',
  INIT_CONNECT_SOCKET: 'have-checked-connect-socket',
  INIT_GENERATE_DEFAULT: 'default-information-has-been-generated',

  ENUM_SEND_TYPE: {
    EVM_ASSET: 'evm-asset',
    OCAP_ASSET: 'ocap-asset',
    EVM_TOKEN: 'evm-token',
    OCAP_TOKEN: 'ocap-token',
  },

  MAIN_OPENSEA_PROFILE: 'https://opensea.io/account',
  TEST_OPENSEA_PROFILE: 'https://testnets.opensea.io/account',
  VERSION_KEY: 'local-wallet-version',

  ChainTxType: {
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
  },

  loadingKeys: {
    migration: 'migrationProviderLoading',
    generate: 'generateProviderLoading',
    states: 'statesProviderLoading',
    importData: 'isImportBackupFile',
    security: 'securityPassword',
  },

  DEFAULT_TOKEN_ADDRESS: ['none', 'default'],

  KEY_PAIR_APP_ID: 'zfffffffffffffffffffffffffffffffff',
};
