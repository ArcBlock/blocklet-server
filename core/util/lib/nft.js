const last = require('lodash/last');
const get = require('lodash/get');

const getNftExpirationDate = (asset) => last(get(asset, 'data.value.expirationDate', []));

const isDateExpired = (expirationDate) => !!expirationDate && new Date(expirationDate).getTime() <= Date.now();

const isNFTExpired = (asset) => {
  const expirationDate = getNftExpirationDate(asset);
  return isDateExpired(expirationDate);
};

const isNFTConsumed = (asset) => !!asset.data.value.consumedTime;

module.exports = { isNFTExpired, getNftExpirationDate, isNFTConsumed };
