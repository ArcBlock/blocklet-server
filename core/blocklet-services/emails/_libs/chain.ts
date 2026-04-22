export function getChainHost(chainId?: string) {
  const defaultHost = 'explorer.arcblockio.cn';
  if (!chainId) return defaultHost;

  const chainMap = {
    beta: 'beta.abtnetwork.io',
    main: 'main.abtnetwork.io',
  };
  const chainHost = chainMap[chainId as keyof typeof chainMap] || defaultHost;

  return chainHost;
}

export function getUrlHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
