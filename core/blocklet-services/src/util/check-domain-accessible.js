import { evaluateURL } from '@abtnode/util/lib/url-evaluation';

// eslint-disable-next-line no-promise-executor-return
const sleep = (timeout = 0) => new Promise((resolve) => setTimeout(resolve, timeout));

export default async function checkDomainAccessible(domain, time = 5) {
  if (!domain) throw new Error('domain is required');
  if (typeof time !== 'number') throw new Error('timeout must be a number');
  if (time <= 1) throw new Error('time must be greater than 1s');

  async function testUrl(protocol) {
    try {
      const url = `${protocol}://${domain}`;
      const result = await evaluateURL(url, { preferAccessible: true });
      return result.accessible ? result.url : false;
    } catch (err) {
      return false;
    }
  }

  async function pollDomain() {
    // 立即检测 https
    let url = await testUrl('https');
    if (url) return url;

    let attempts = time;
    while (attempts-- > 0) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
      // eslint-disable-next-line no-await-in-loop
      url = await testUrl('https');
      if (url) return url;
    }

    return url || null;
  }

  const result = await pollDomain();
  if (result) {
    return { accessible: true, url: result };
  }
  return { accessible: false };
}
