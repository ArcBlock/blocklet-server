const getChainHost = (chainId) => {
  const defaultHost = 'explorer.arcblockio.cn';
  if (!chainId) return defaultHost;

  const chainMap = {
    beta: 'beta.abtnetwork.io',
    main: 'main.abtnetwork.io',
  };
  const chainHost = chainMap[chainId] || defaultHost;

  return chainHost;
};

const getUrlHost = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

module.exports = { getChainHost, getUrlHost };
