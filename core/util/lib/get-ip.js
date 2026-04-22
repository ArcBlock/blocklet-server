const isIp = require('is-ip');
const internalIp = require('internal-ip');
const externalIp = require('public-ip');
const debug = require('debug')('core:util:get-ip');

const gcp = require('./gcp');
const isEC2 = require('./is-ec2');
const getEc2Meta = require('./get-ec2-meta');
const tryWithTimeout = require('./try-with-timeout');

const getExternalIp = async ({ v6 = false, timeout = 5000 } = {}) => {
  try {
    const ip = await tryWithTimeout(v6 ? externalIp.v6 : externalIp.v4, timeout);
    return ip;
  } catch (err) {
    return '';
  }
};

const ensureFormat = ({ internal, external, internalV6, externalV6 }) => ({
  internal: internal && isIp.v4(internal) ? internal : '',
  external: external && isIp.v4(external) ? external : '',
  internalV6: internalV6 && isIp.v6(internalV6) ? internalV6 : '',
  externalV6: externalV6 && isIp.v6(externalV6) ? externalV6 : '',
});

/**
 * @description
 * @param {{
 *  includeV6?: false | true,
 *  timeout?: number,
 *  includeExternal?: true | false,
 * }} [{ includeV6 = false, timeout = 5000, includeExternal = true }={}]
 * @return {Promise<{
 *  internal: string,
 *  external: string,
 *  internalV6: string,
 *  externalV6: string,
 * }>}
 */
const getIP = async ({
  includeV6 = false,
  timeout = 5000,
  includeExternal = true,
  checkIsEC2 = isEC2,
  checkIsGCP = gcp.isInGCP,
} = {}) => {
  try {
    const [inEc2, inGCP] = await Promise.all([checkIsEC2(), checkIsGCP()]);
    debug('check env', { inEc2, inGCP });

    if (process.env.ABT_NODE_HOST) {
      return ensureFormat({
        internal: process.env.ABT_NODE_HOST,
        external: process.env.ABT_NODE_HOST,
        internalV6: process.env.ABT_NODE_HOST,
        externalV6: process.env.ABT_NODE_HOST,
      });
    }

    if (inEc2) {
      debug('in ec2');
      const [internal, external, internalV6, externalV6] = await Promise.all([
        getEc2Meta('local-ipv4', timeout),
        includeExternal ? getEc2Meta('public-ipv4', timeout) : '',
        includeV6 ? getEc2Meta('local-ipv6', timeout) : '',
        includeV6 && includeExternal ? getEc2Meta('public-ipv6', timeout) : '',
      ]);

      debug('got ips in ec2', { internal, external, internalV6, externalV6 });
      return ensureFormat({ internal, external, internalV6, externalV6 });
    }

    if (inGCP) {
      debug('in gcp');
      const [internal, external, internalV6, externalV6] = await Promise.all([
        gcp.getInternalIpv4(),
        includeExternal ? gcp.getExternalIpv4() : '',
        includeV6 ? gcp.getInternalIpv6() : '',
        includeV6 && includeExternal ? gcp.getExternalIpv6() : '',
      ]);

      debug('got ips in gcp', { internal, external, internalV6, externalV6 });
      return ensureFormat({ internal, external, internalV6, externalV6 });
    }

    const [internal, external, internalV6, externalV6] = await Promise.all([
      internalIp.v4(),
      includeExternal ? getExternalIp({ timeout }) : '',
      includeV6 ? internalIp.v6() : '',
      includeV6 && includeExternal ? getExternalIp({ v6: true, timeout }) : '',
    ]);

    return ensureFormat({ internal, external, internalV6, externalV6 });
  } catch (err) {
    return {
      internal: '',
      external: '',
      internalV6: '',
      externalV6: '',
    };
  }
};

module.exports = getIP;
