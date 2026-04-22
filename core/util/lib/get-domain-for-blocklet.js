const { DEFAULT_IP_DOMAIN_SUFFIX, SLOT_FOR_IP_DNS_SITE, DEFAULT_DID_DOMAIN } = require('@abtnode/constant');
const { encode: encodeBase32 } = require('./base32');

const getIpDnsDomainForBlocklet = (blocklet) => {
  return `${encodeBase32(blocklet.meta.did)}-${SLOT_FOR_IP_DNS_SITE}.${DEFAULT_IP_DOMAIN_SUFFIX}`;
};

const getDidDomainForBlocklet = ({ did, didDomain = DEFAULT_DID_DOMAIN }) => {
  return `${encodeBase32(did)}.${didDomain}`;
};

module.exports = { getIpDnsDomainForBlocklet, getDidDomainForBlocklet };
