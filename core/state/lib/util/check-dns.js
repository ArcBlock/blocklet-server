const { joinURL } = require('ufo');
const dns = require('dns').promises;
const logger = require('@abtnode/logger')('checkDNS');
const axios = require('@abtnode/util/lib/axios');

function convertDomainToUrl(domain) {
  const clean = domain.trim();

  if (clean.startsWith('http')) {
    return clean;
  }

  return `http://${clean}`;
}

const getBlockletUrl = async (domain) => {
  const url = convertDomainToUrl(domain);
  const BLOCKLET_JSON_PATH = '__blocklet__.js?type=json';
  const blockletUrl = joinURL(url, BLOCKLET_JSON_PATH);
  const { data: blocklet } = await axios(blockletUrl, { timeout: 5000 });

  if (typeof blocklet === 'object') {
    return blocklet?.appId;
  }

  // 301 重定向会返回字符串
  const match = blocklet.match(/appId:\s*"(.*?)"/);
  return match?.[1];
};

async function checkIsRedirectedBlocklet(domain1, domain2) {
  try {
    const [domain1Blocklet, domain2Blocklet] = await Promise.all([getBlockletUrl(domain1), getBlockletUrl(domain2)]);

    logger.info('checkIsSameIp', {
      domain1: { domain: domain1, blocklet: domain1Blocklet },
      domain2: { domain: domain2, blocklet: domain2Blocklet },
    });

    return domain1Blocklet === domain2Blocklet;
  } catch (error) {
    logger.error('DNS resolution error:', { domain1, domain2, error });
    return false;
  }
}

async function checkDnsAndCname(domain, expectedCname = '') {
  try {
    const dnsRecords = await dns.resolve(domain);
    logger.info('dnsRecords', { dnsRecords, domain });

    const cnameRecords = await dns.resolveCname(domain).catch(() => []);
    const isCnameMatch = cnameRecords.some((cname) => cname.toLowerCase() === expectedCname.toLowerCase());

    return {
      isDnsResolved: true,
      hasCname: true,
      cnameRecords,
      isCnameMatch: isCnameMatch || (await checkIsRedirectedBlocklet(domain, expectedCname)),
    };
  } catch (error) {
    logger.error('resolve name error', { domain, error });

    return {
      isDnsResolved: false,
      hasCname: false,
      cnameRecords: [],
      isCnameMatch: false,
      error,
    };
  }
}

checkDnsAndCname.convertDomainToUrl = convertDomainToUrl;
checkDnsAndCname.getBlockletUrl = getBlockletUrl;
checkDnsAndCname.checkIsRedirectedBlocklet = checkIsRedirectedBlocklet;

module.exports = checkDnsAndCname;
