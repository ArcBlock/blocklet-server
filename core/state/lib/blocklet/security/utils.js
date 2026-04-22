const cloneDeep = require('@abtnode/util/lib/deep-clone');

const _formatResponseHeaderPolicy = (data) => {
  const result = cloneDeep(data);
  if (data.securityHeader) {
    try {
      result.securityHeader = JSON.parse(data.securityHeader);
    } catch {
      result.securityHeader = null;
    }
  }
  if (data.cors) {
    try {
      result.cors = JSON.parse(data.cors);
    } catch {
      result.cors = null;
    }
  }
  return result;
};
const _convertResponseHeaderPolicy = (data) => {
  const result = cloneDeep(data);
  if (result.cors) {
    result.cors = JSON.stringify(result.cors);
  }
  if (result.securityHeader) {
    result.securityHeader = JSON.stringify(result.securityHeader);
  }
  return result;
};

module.exports = {
  _formatResponseHeaderPolicy,
  _convertResponseHeaderPolicy,
};
