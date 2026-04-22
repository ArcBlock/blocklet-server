const { ASSET_CHAIN_ID, BETA_CHAIN, INFURA_PROJECT_ID, DEFAULT_BETA_HOST, DEFAULT_MAIN_HOST } = require('./constant');

// import ABTIcon from 'cryptocurrency-icons/128/color/abt.png';
// const ETCIcon = 'https://s2.coinmarketcap.com/static/img/coins/128x128/1321.png';

const generateEVMChain = ({
  chainId,
  chainName,
  symbol,
  decimal,
  defaultRPC,
  explorer,
  isTest,
  canRemove,
  networkName,
  icon = '',
  host,
  consensusVersion,
  endpoints = [],
}) => {
  return {
    chainId,
    chainName,
    symbol,
    decimal,
    defaultRPC,
    explorer,
    isTest,
    canRemove,
    networkName,
    icon,
    host,
    consensusVersion,
    endpoints: endpoints.length ? endpoints : [defaultRPC],
  };
};

const CHAIN = {
  EthereumMainnet: 'EthereumMainnet',
  1: 'EthereumMainnet',
  Ropsten: 'Ropsten',
  3: 'Ropsten',
  Rinkeby: 'Rinkeby',
  4: 'Rinkeby',
  Goerli: 'Goerli',
  5: 'Goerli',
  Kovan: 'Kovan',
  42: 'Kovan',
  BSC: 'BSC',
  56: 'BSC',
  BSCTestnet: 'BSCTestnet',
  97: 'BSCTestnet',
  EthereumClassic: 'EthereumClassic',
  61: 'EthereumClassic',
  EthereumClassicMordor: 'EthereumClassicMordor',
  63: 'EthereumClassicMordor',
  EthereumFair: 'EthereumFair',
  513100: 'EthereumFair',
  Arbitrum: 'Arbitrum',
  42161: 'Arbitrum',
  ArbitrumTestnet: 'ArbitrumTestnet',
  421611: 'ArbitrumTestnet',
};

const EVM_PREFIX = 'evm-';
const ETHEREUM_CHAIN = `${EVM_PREFIX}1`;
const ROPSTEN_CHAIN = `${EVM_PREFIX}3`;
const RINKEBY_CHAIN = `${EVM_PREFIX}4`;
const GOERLI_CHAIN = `${EVM_PREFIX}5`;
const KOVAN_CHAIN = `${EVM_PREFIX}42`;
const BINANCE_CHAIN = `${EVM_PREFIX}56`;
const BINANCE_TEST_CHAIN = `${EVM_PREFIX}97`;
const ETHEREUM_FAIR_CHAIN = `${EVM_PREFIX}513100`;
const ARBITRUM_CHAIN = `${EVM_PREFIX}42161`;
const ARBITRUM_TEST_CHAIN = `${EVM_PREFIX}421611`;
const ETHEREUM_CLASSIC_CHAIN = `${EVM_PREFIX}61`;
const ETHEREUM_CLASSIC_MORDOR_CHAIN = `${EVM_PREFIX}63`;

const QUICK_NODE_KEY_TEST = '5e624de4f2e0d168d3b894131df06fb1b5cb288e';
const ARCHEMY_KEY_TEST = 'qalBfUm3aQWUb9CyJWy0AunAMkYWTQKN';
const QUICK_NODE_KEY_MAIN = '50adb12d647f7abc6ac7943ee97d33037a7ca65c';
const ARCHEMY_KEY_MAIN = '3iP2OU6Hnteu-UW4OX6U6Nb-6lxc3_Lk';

const evmConfig = {
  [CHAIN.EthereumMainnet]: generateEVMChain({
    chainId: ETHEREUM_CHAIN,
    chainName: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimal: 18,
    defaultRPC: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    explorer: 'https://etherscan.io',
    isTest: false,
    canRemove: false,
    networkName: 'mainnet',
    endpoints: [
      `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      `https://eth-mainnet.g.alchemy.com/v2/${ARCHEMY_KEY_MAIN}`,
      'https://eth-rpc.gateway.pokt.network/',
      `https://old-wild-sound.discover.quiknode.pro/${QUICK_NODE_KEY_MAIN}/`,
    ],
  }),
  [CHAIN.Goerli]: generateEVMChain({
    chainId: GOERLI_CHAIN,
    chainName: 'Ethereum Goerli',
    symbol: 'GOR',
    decimal: 18,
    defaultRPC: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
    explorer: 'https://goerli.etherscan.io',
    isTest: true,
    canRemove: true,
    networkName: 'goerli',
    endpoints: [
      `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      'https://eth-goerli-rpc.gateway.pokt.network/',
      `https://eth-goerli.g.alchemy.com/v2/${ARCHEMY_KEY_TEST}`,
      `https://crimson-chaotic-asphalt.ethereum-goerli.discover.quiknode.pro/${QUICK_NODE_KEY_TEST}/`,
    ],
  }),
  [CHAIN.Ropsten]: generateEVMChain({
    chainId: ROPSTEN_CHAIN,
    chainName: 'Ethereum Ropsten',
    symbol: 'ROP',
    decimal: 18,
    defaultRPC: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
    explorer: 'https://ropsten.etherscan.io',
    isTest: true,
    canRemove: true,
    networkName: 'ropsten',
  }),
  [CHAIN.Rinkeby]: generateEVMChain({
    chainId: RINKEBY_CHAIN,
    chainName: 'Ethereum Rinkeby',
    symbol: 'RIN',
    decimal: 18,
    defaultRPC: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
    explorer: 'https://rinkeby.etherscan.io',
    isTest: true,
    canRemove: true,
    networkName: 'rinkeby',
  }),
  [CHAIN.Kovan]: generateEVMChain({
    chainId: KOVAN_CHAIN,
    chainName: 'Ethereum Kovan',
    symbol: 'KOV',
    decimal: 18,
    defaultRPC: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
    explorer: 'https://kovan.etherscan.io',
    isTest: true,
    canRemove: true,
    networkName: 'kovan',
  }),
  [CHAIN.BSC]: generateEVMChain({
    chainId: BINANCE_CHAIN,
    chainName: 'Binance Smart Chain',
    symbol: 'BNB',
    decimal: 18,
    defaultRPC: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
    isTest: false,
    canRemove: true,
    networkName: 'BNB',
  }),
  [CHAIN.BSCTestnet]: generateEVMChain({
    chainId: BINANCE_TEST_CHAIN,
    chainName: 'Binance Smart Test Chain',
    symbol: 'tBNB',
    decimal: 18,
    defaultRPC: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorer: 'https://testnet.bscscan.com',
    isTest: true,
    canRemove: true,
    networkName: 'BNB',
  }),
  // ETHF
  [CHAIN.EthereumFair]: generateEVMChain({
    chainId: ETHEREUM_FAIR_CHAIN,
    chainName: 'EthereumFair',
    symbol: 'ETHF',
    decimal: 18,
    defaultRPC: 'https://rpc.etherfair.org',
    explorer: 'https://explorer.etherfair.org',
    isTest: false,
    canRemove: true,
    networkName: 'Ethereum Fair',
  }),
  // Arbitrum
  [CHAIN.Arbitrum]: generateEVMChain({
    chainId: ARBITRUM_CHAIN,
    chainName: 'Arbitrum',
    symbol: 'ETH',
    decimal: 18,
    defaultRPC: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://explorer.arbitrum.io',
    isTest: false,
    canRemove: true,
    networkName: 'Arbitrum',
  }),
  [CHAIN.ArbitrumTestnet]: generateEVMChain({
    chainId: ARBITRUM_TEST_CHAIN,
    chainName: 'Arbitrum Testnet',
    symbol: 'ARETH',
    decimal: 18,
    defaultRPC: 'https://rinkeby.arbitrum.io/rpc',
    explorer: 'https://rinkeby-explorer.arbitrum.io',
    isTest: true,
    canRemove: true,
    networkName: 'Arbitrum Testnet',
  }),
  // ETC
  [CHAIN.EthereumClassic]: generateEVMChain({
    chainId: ETHEREUM_CLASSIC_CHAIN,
    chainName: 'Ethereum Classic',
    symbol: 'ETC',
    decimal: 18,
    defaultRPC: 'https://www.ethercluster.com/etc',
    explorer: 'https://blockscout.com/etc/mainnet',
    isTest: false,
    canRemove: true,
    networkName: 'Ethereum Classic',
  }),
  [CHAIN.EthereumClassicMordor]: generateEVMChain({
    chainId: ETHEREUM_CLASSIC_MORDOR_CHAIN,
    chainName: 'Ethereum Classic Mordor',
    symbol: 'METC',
    decimal: 18,
    defaultRPC: 'https://www.ethercluster.com/mordor',
    explorer: 'https://blockscout.com/etc/mordor',
    isTest: true,
    canRemove: true,
    networkName: 'Ethereum Classic Mordor',
  }),
};

const arcChainConfig = {
  [ASSET_CHAIN_ID]: generateEVMChain({
    chainId: ASSET_CHAIN_ID,
    chainName: 'Main',
    symbol: 'ABT',
    decimal: 18,
    defaultRPC: 'https://main.abtnetwork.io/api/',
    explorer: 'https://main.abtnetwork.io/explorer',
    isTest: false,
    canRemove: false,
    networkName: 'ArcBlock Main',
    host: DEFAULT_MAIN_HOST,
    consensusVersion: '@ocap/statedb-qldb v1.14.9',
  }),
  [BETA_CHAIN]: generateEVMChain({
    chainId: BETA_CHAIN,
    chainName: 'Beta',
    symbol: 'TBA',
    decimal: 18,
    defaultRPC: DEFAULT_BETA_HOST,
    explorer: 'https://beta.abtnetwork.io/explorer',
    isTest: true,
    canRemove: true,
    networkName: 'ArcBlock Beta',
    host: DEFAULT_BETA_HOST,
    consensusVersion: 'ocap/statedb-qldb v1.14.3',
  }),
};

const getConfigByChainId = (chainId) => {
  let Id = chainId;
  try {
    if (chainId.startsWith(EVM_PREFIX)) {
      Id = chainId.replace(EVM_PREFIX, '');
    }
  } catch (error) {
    Id = chainId;
  }

  return evmConfig[CHAIN[Id]];
};

module.exports = {
  generateEVMChain,
  getConfigByChainId,
  arcChainConfig,
  CHAIN,
  EVM_PREFIX,
  evmConfig,
  QUICK_NODE_KEY_TEST,
  ARCHEMY_KEY_TEST,
  QUICK_NODE_KEY_MAIN,
  ARCHEMY_KEY_MAIN,
  ASSET_CHAIN_ID,
  BETA_CHAIN,
  INFURA_PROJECT_ID,
  DEFAULT_BETA_HOST,
  DEFAULT_MAIN_HOST,
};
