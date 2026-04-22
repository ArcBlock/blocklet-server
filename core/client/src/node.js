/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require('events');
const { fromSecretKey } = require('@ocap/wallet');

const ABTNodeClient = require('./base');
const signer = require('./signer');

class NativeABTNodeClient extends ABTNodeClient {
  constructor(httpEndpoint, userAgent) {
    super(httpEndpoint, userAgent);

    this._accessKeyId = null;
    this._accessKeySecret = null;

    // wallet type
    this._type = null;
  }

  setAuthAccessKey({ accessKeyId, accessKeySecret, type }) {
    NativeABTNodeClient.validateAccessKey({
      accessKeyId,
      accessKeySecret,
      type,
    });

    this._accessKeyId = accessKeyId;
    this._accessKeySecret = accessKeySecret;
    this._type = type;
  }

  async _getAuthHeaders() {
    const headers = await super._getAuthHeaders();
    if (this._accessKeyId && this._accessKeySecret) {
      headers['x-access-key-id'] = this._accessKeyId;
      if (this._type === 'sha256') {
        headers['x-access-signature'] = signer.sha256.sign(this._accessKeySecret);
        headers['x-access-alg'] = 'sha256';
      } else if (this._type === 'totp') {
        headers['x-access-signature'] = signer.totp.sign(this._accessKeySecret);
        headers['x-access-alg'] = 'totp';
      } else {
        const wallet = fromSecretKey(this._accessKeySecret, this._type);
        const timestamp = Date.now();
        headers['x-access-signature'] = await wallet.sign(`${timestamp}-${this._accessKeyId}`);
        headers['x-access-stamp'] = timestamp;
      }
    }

    return headers;
  }

  _getSocketOptions() {
    return {};
  }

  _getEventImplementation() {
    return EventEmitter;
  }
}

NativeABTNodeClient.validateAccessKey = ({ accessKeyId, accessKeySecret, type }) => {
  if (type === 'totp' || type === 'sha256') {
    return;
  }
  const wallet = fromSecretKey(accessKeySecret, type);
  const isSameAddr = (addr1, addr2) => String(addr1).toLowerCase() === String(addr2).toLowerCase();
  const match = isSameAddr(accessKeyId, wallet.address);
  if (!match) {
    throw new Error('accessKeyId and accessKeySecret does not match');
  }
};

NativeABTNodeClient.signWithAccessKey = async ({ accessKeyId, accessKeySecret, message, type }) => {
  NativeABTNodeClient.validateAccessKey({ accessKeyId, accessKeySecret });
  const wallet = fromSecretKey(accessKeySecret, type);
  const data = await wallet.sign(message);
  return data;
};

module.exports = NativeABTNodeClient;
