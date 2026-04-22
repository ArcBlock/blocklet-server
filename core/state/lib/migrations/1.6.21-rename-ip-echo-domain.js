const yaml = require('js-yaml');
const fs = require('fs');
const set = require('lodash/set');
const omit = require('lodash/omit');
const {
  DEFAULT_WILDCARD_CERT_HOST,
  DEFAULT_DID_DOMAIN,
  DEFAULT_DID_REGISTRY,
  DEFAULT_IP_DOMAIN,
} = require('@abtnode/constant');

module.exports = async ({ states, printInfo, configFile }) => {
  printInfo('Try to rename dashboardDomain to ipWildcardDomain in db...');

  let info = await states.node.read();
  set(info, 'routing.ipWildcardDomain', info.routing.dashboardDomain || DEFAULT_IP_DOMAIN);
  set(info, 'routing.wildcardCertHost', DEFAULT_WILDCARD_CERT_HOST);
  set(info, 'didDomain', DEFAULT_DID_DOMAIN);
  set(info, 'didRegistry', DEFAULT_DID_REGISTRY);
  info = omit(info, 'routing.dashboardDomain');

  await states.node.updateNodeInfo(info);

  if (process.env.NODE_ENV !== 'development') {
    let rawConfig = yaml.load(fs.readFileSync(configFile).toString());
    set(rawConfig, 'node.routing.ipWildcardDomain', info.routing.ipWildcardDomain);
    set(rawConfig, 'node.routing.wildcardCertHost', DEFAULT_WILDCARD_CERT_HOST);
    set(rawConfig, 'node.didDomain', DEFAULT_DID_DOMAIN);
    set(rawConfig, 'node.didRegistry', DEFAULT_DID_REGISTRY);
    rawConfig = omit(rawConfig, 'node.routing.dashboardDomain');
    fs.writeFileSync(configFile, yaml.dump(rawConfig));
  }

  printInfo(`> Persist new config to file: ${configFile}`);
};
