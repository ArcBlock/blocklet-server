module.exports = Object.freeze({
  CERT_STATUS: {
    waiting: 'waiting',
    creating: 'creating',
    generated: 'generated',
    renewaling: 'renewaling',
    error: 'error',
  },
  CERT_SOURCE: {
    letsEncrypt: 'lets_encrypt',
    upload: 'upload',
  },
});
