const crypto = require('crypto');
const fs = require('fs');
const { Certificate, PrivateKey } = require('@fidm/x509');

const ensureDir = (dir) => {
  if (fs.existsSync(dir)) {
    return dir;
  }

  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const getFingerprint = (data, alg) => {
  const shasum = crypto.createHash(alg);
  // eslint-disable-next-line newline-per-chained-call
  return shasum.update(data).digest('hex').match(/.{2}/g).join(':').toUpperCase();
};

const validateCertificate = (cert, domain) => {
  const certificate = Certificate.fromPEM(cert.certificate);
  const privateKey = PrivateKey.fromPEM(cert.privateKey);

  const data = Buffer.allocUnsafe(100);
  const signature = privateKey.sign(data, 'sha512');
  if (!certificate.publicKey.verify(data, signature, 'sha512')) {
    throw new Error('Invalid certificate: signature verify failed');
  }

  const certDomain = certificate?.subject?.commonName || '';
  if (domain && domain !== certDomain) {
    throw new Error('Invalid certificate: domain does not match');
  }

  const validFrom = certificate?.validFrom || '';
  if (!validFrom || new Date(validFrom).getTime() > Date.now()) {
    throw new Error('Invalid certificate: not in valid period');
  }
  const validTo = certificate?.validTo || '';
  if (!validTo || new Date(validTo).getTime() < Date.now()) {
    throw new Error('Invalid certificate: not in valid period');
  }

  return certificate;
};

const getCertInfo = (certificate) => {
  const info = Certificate.fromPEM(certificate);

  const validFrom = info.validFrom.valueOf();
  const validTo = info.validTo.valueOf();
  const issuer = {
    countryName: info.issuer.countryName.valueOf(),
    organizationName: info.issuer.organizationName.valueOf(),
    commonName: info.issuer.commonName.valueOf(),
  };

  return {
    validFrom,
    validTo,
    issuer,
    sans: info.dnsNames,
    validityPeriod: info.validTo - info.validFrom,
    fingerprintAlg: 'SHA256',
    fingerprint: getFingerprint(info.raw, 'sha256'),
  };
};

module.exports = { ensureDir, getFingerprint, validateCertificate, getCertInfo };
