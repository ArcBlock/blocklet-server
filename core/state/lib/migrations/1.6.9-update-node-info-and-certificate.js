/* eslint-disable no-await-in-loop */

const { DEFAULT_DID_REGISTRY, DEFAULT_DID_DOMAIN } = require('@abtnode/constant');
const omit = require('lodash/omit');
const isEmpty = require('lodash/isEmpty');

const updateNodeInfo = async ({ printInfo, states }) => {
  // add didRegistry and didDomain
  const info = await states.node.read();
  const data = {};
  if (!info.didRegistry) {
    data.didRegistry = DEFAULT_DID_REGISTRY;
  }

  if (!info.didDomain) {
    data.didDomain = DEFAULT_DID_DOMAIN;
  }

  if (!isEmpty(data)) {
    await states.node.update({ did: info.did }, { $set: data });
  }

  printInfo('update did registry and did domain successfully');
};

const updateCertificate = async ({ node, printInfo }) => {
  const certs = await node.certManager.getAllNormal();
  for (const cert of certs || []) {
    await node.certManager.updateWithoutValidations(cert.id, omit(cert, 'id'));
  }

  printInfo('update certificate successfully');
};

/* eslint-disable no-underscore-dangle */
module.exports = async ({ node, printInfo, states }) => {
  await updateNodeInfo({ printInfo, states });
  await updateCertificate({ node, printInfo, states });
};
