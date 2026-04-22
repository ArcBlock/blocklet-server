const { EventEmitter } = require('events');
const { Certificate } = require('@fidm/x509');
const Cron = require('@abtnode/cron');

const AcmeManager = require('../libs/acme-manager');
const { CERT_SOURCE } = require('../libs/constant');
const states = require('../states');
const { validateAdd, validateUpdate, validateUpsertByDomain } = require('../validators/cert');
const logger = require('../libs/logger');
const { validateCertificate, getCertInfo } = require('../libs/util');

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CERTIFICATE_EXPIRES_WARNING_OFFSET = 7 * DAY_IN_MS;
const DEFAULT_RENEWAL_RATIO = 1 / 3;

class Manager extends EventEmitter {
  constructor({ renewalRatio = DEFAULT_RENEWAL_RATIO, maintainerEmail, dataDir }) {
    super();
    if (!dataDir) {
      throw new Error('dataDir is required');
    }

    this.renewalRatio = renewalRatio;
    this.maintainerEmail = maintainerEmail;
    this.acmeManager = null;
    this.dataDir = dataDir;

    states.init(dataDir);
  }

  async start() {
    const acmeManager = await AcmeManager.initInstance({
      maintainerEmail: this.maintainerEmail,
      renewalRatio: this.renewalRatio,
      baseDataDir: this.dataDir,
    });

    this.acmeManager = acmeManager;

    acmeManager.on('cert.issued', (...args) => {
      this.emit('cert.issued', ...args);
    });
    acmeManager.on('cert.error', (...args) => this.emit('cert.error', ...args));

    Cron.init({
      context: {},
      jobs: [
        acmeManager.getJobSchedular(),
        {
          name: 'check-expired-certificates',
          time: '0 0 9 * * *', // check on 09:00 every day
          fn: this.checkCertificatesExpiration.bind(this),
          options: { runOnInit: false },
        },
      ],
    });
  }

  async checkCertificatesExpiration() {
    try {
      logger.info('check expired certificates');
      const now = Date.now();

      const certificates = await this.getAllNormal();
      for (let i = 0; i < certificates.length; i++) {
        const cert = certificates[i];
        const alreadyExpired = now >= cert.meta.validTo;
        const aboutToExpire =
          cert.meta.validTo - now > 0 && cert.meta.validTo - now < CERTIFICATE_EXPIRES_WARNING_OFFSET;

        const expireInDays = Math.ceil((cert.meta.validTo - now) / DAY_IN_MS);
        const data = { id: cert.id, domain: cert.domain, expireInDays, validTo: cert.meta.validTo };

        if (alreadyExpired) {
          this.emit('cert.expired', data);
        } else if (aboutToExpire) {
          this.emit('cert.about_to_expire', data);
        }
      }
    } catch (error) {
      logger.error('check expired certificates failed', { error });
    }
  }

  getAll(projection = {}) {
    return states.certificate.find({}, projection);
  }

  getAllNormal() {
    return states.certificate.find({
      certificate: { $exists: true },
      privateKey: { $exists: true },
    });
  }

  getNormalByDomain(domain) {
    return states.certificate.findOne({
      domain,
      certificate: { $exists: true },
      privateKey: { $exists: true },
    });
  }

  getByDomain(domain) {
    return states.certificate.findOne({ domain });
  }

  async add(data) {
    await validateAdd(data);

    validateCertificate(data);

    const existed = await states.certificate.findOne({ name: data.name });
    if (existed) {
      throw new Error(`The name ${data.name} already exists!`);
    }

    if (!data.source) {
      data.source = CERT_SOURCE.upload;
    }

    const info = Certificate.fromPEM(data.certificate);
    data.domain = info?.subject?.commonName || '';
    // Fall back to dnsNames if CN is empty or not a valid domain
    // e.g. CloudFlare Origin Certificates use CN="CloudFlare Origin Certificate"
    if ((!data.domain || !data.domain.includes('.')) && Array.isArray(info.dnsNames) && info.dnsNames.length) {
      [data.domain] = info.dnsNames;
    }

    try {
      const result = await states.certificate.insert(data);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /**
   * 生成域名，certificate-manager 会自动生成并更新该证书
   * @param {object} data
   * @param {string} data.domain
   * @param {string} data.siteId
   * @param {object} options
   * @param {number} options.delay - delay time in ms
   * @returns
   */
  issue({ domain, siteId }, options) {
    if (!domain) {
      throw new Error('domain is required');
    }

    return this.acmeManager.add({ domain: domain.toLowerCase(), siteId }, options);
  }

  async upsertByDomain(tmpData) {
    const data = await validateUpsertByDomain(tmpData);

    if (!data.source) {
      data.source = CERT_SOURCE.upload;
    }
    if (data.certificate) {
      data.meta = getCertInfo(data.certificate);
    }

    return states.certificate.upsert({ domain: data.domain }, data);
  }

  async update(id, data) {
    await validateUpdate(data);

    const existed = await states.certificate.findOne({ id });
    if (!existed) {
      throw new Error(`The name ${data.name} does not exists`);
    }

    if (existed.source !== CERT_SOURCE.upload) {
      throw new Error('Can not update non-upload certificate');
    }

    if (data.certificate && data.privateKey) {
      validateCertificate(data);

      const info = Certificate.fromPEM(data.certificate);
      data.domain = info?.subject?.commonName || '';
      // Fall back to dnsNames if CN is empty or not a valid domain
      if ((!data.domain || !data.domain.includes('.')) && Array.isArray(info.dnsNames) && info.dnsNames.length) {
        [data.domain] = info.dnsNames;
      }

      if (data.domain !== existed.domain) {
        throw new Error('Can not update certificate domain, because the domain is not the same as the original domain');
      }
    }

    return states.certificate.update({ id }, { $set: data });
  }

  findById(id) {
    return states.certificate.findOne({ id });
  }

  async remove(id) {
    const existed = await this.findById(id);
    if (!existed) {
      throw new Error(`The certificate ${id} does not exists!`);
    }

    return states.certificate.remove({ id });
  }

  addWithoutValidations(data) {
    return states.certificate.insert(data);
  }

  updateWithoutValidations(id, data) {
    return states.certificate.update({ id }, { $set: data });
  }
}

module.exports = Manager;
