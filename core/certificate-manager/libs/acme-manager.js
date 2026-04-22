const { EventEmitter } = require('events');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const { Certificate } = require('@fidm/x509');
const { CustomError } = require('@blocklet/error');
const dayjs = require('@abtnode/util/lib/dayjs');
const md5 = require('@abtnode/util/lib/md5');

const pkg = require('../package.json');
const AcmeWrapper = require('./acme-wrapper');
const { CERT_STATUS, CERT_SOURCE } = require('./constant');
const createQueue = require('./queue');
const logger = require('./logger');
const states = require('../states');

const http01 = require('./http-01').create({});

const DEFAULT_AGENT_NAME = 'blocklet-server';

// Default renewal ratio: renew when remaining lifetime <= 1/3 of total lifetime
const DEFAULT_RENEWAL_RATIO = 1 / 3;
// Minimum days threshold: always renew if remaining days <= 10
const MINIMUM_RENEWAL_DAYS = 10;

class Manager extends EventEmitter {
  constructor({ dataDir, maintainerEmail, staging = false, renewalRatio = DEFAULT_RENEWAL_RATIO }) {
    super();
    logger.info('initialize manager in data dir:', { dataDir });

    // Validate renewalRatio
    if (typeof renewalRatio !== 'number' || Number.isNaN(renewalRatio) || renewalRatio <= 0) {
      throw new Error(`Invalid renewalRatio: ${renewalRatio}. Must be a positive number.`);
    }

    this.acme = new AcmeWrapper({
      packageAgent: `${DEFAULT_AGENT_NAME}/${pkg.version}`,
      staging,
      maintainerEmail,
    });

    this.maintainerEmail = maintainerEmail;
    this.renewalRatio = renewalRatio;
    this.dataDir = dataDir;
    this.getJobId = (job) => (job ? md5(`${job.domain}-${job.challenge}`) : '');
    this.queue = createQueue({
      name: 'create-cert-queue',
      model: states.job,
      onJob: async (data) => {
        if (process.env.NODE_ENV === 'test') {
          logger.info('skip in test environment');
          return;
        }

        await this.createOrRenewCert({ ...data, challenges: { 'http-01': http01 } });
      },
      options: {
        // Let's Encrypt 中对每个账户下的每个域名每个小时只允许有两次失败的 challenge,
        // 所以这里设置为一个小于5的值
        maxRetries: process.env.NODE_ENV === 'production' ? 2 : 0,
        retryDelay: 10 * 1000,
        maxTimeout: 60 * 1000, // throw timeout error after 1 minutes
        id: (job) => this.getJobId(job),
      },
    });
  }

  getJobSchedular() {
    return {
      name: 'check-renewal-cert-job',
      time: '0 0 9 * * *', // 每天执行一次
      fn: this.checkRenewalCerts.bind(this),
      options: { runOnInit: false },
    };
  }

  /*
   * @param {string} domain
   * @param {object} options
   * @param {number} options.delay - delay time in ms
   * @return {Promise<void>}
   */
  async pushToJobQueue(domain, { delay = 0, metadata } = {}) {
    const jobData = { domain, subscriberEmail: this.maintainerEmail, delay, metadata };

    const job = await this.queue.get(this.getJobId(jobData));

    if (!job) {
      const newJob = this.queue.push(jobData);
      newJob.on('failed', async (data) => {
        const tmpDomain = data?.job?.domain;
        if (tmpDomain) {
          await states.certificate.updateStatus(tmpDomain, CERT_STATUS.error);
        }

        this.emit('cert.error', { ...data.job, error: data.error });
        logger.error(`create certificate for ${tmpDomain} job failed`, { domain: tmpDomain, error: data.error });
      });
    }
  }

  /**
   *
   * @param {object} data
   * @param {string} data.domain
   * @param {string} data.siteId
   * @param {object} options
   * @param {number} options.delay - delay time in ms
   * @returns
   */
  async add({ domain, siteId }, { delay = 0, metadata } = {}) {
    if (!domain) {
      throw new Error('domain is required when add domain');
    }

    let cert = await states.certificate.findOne({ domain });

    if (!cert) {
      cert = await states.certificate.insert({
        domain,
        siteId,
        source: CERT_SOURCE.letsEncrypt,
        status: CERT_STATUS.waiting,
      });
    }

    await this.pushToJobQueue(domain, { delay, metadata });
    return cert;
  }

  getCertState(domain) {
    const certDir = path.join(this.acme.certDir, domain);
    return fs.existsSync(certDir);
  }

  readCert(domain) {
    const certDir = path.join(this.acme.certDir, domain);
    if (!fs.existsSync(certDir)) {
      return null;
    }

    const chain = fs.readFileSync(path.join(certDir, 'fullchain.pem')).toString();
    const privkey = fs.readFileSync(path.join(certDir, 'privkey.pem')).toString();

    return {
      domain,
      chain,
      privkey,
    };
  }

  async createOrRenewCert({ domain, subscriberEmail, force = false, challenges, metadata }) {
    try {
      if (!domain) {
        throw new CustomError(400, 'domain is required when generate certificate');
      }

      const { address: ipAddress } = await dns.promises.lookup(domain, { family: 4 }).catch((error) => {
        throw new CustomError(500, `DNS lookup failed: ${error.message}`);
      });

      logger.info('check domain dns success', { domain, ipAddress });

      const cert = await states.certificate.findOne({ domain });
      if (!cert) {
        logger.warn(`create certificate failed: the cert ${domain} does not exist`);
        return null;
      }

      let status = CERT_STATUS.creating;

      if (cert.certificate) {
        const info = Certificate.fromPEM(cert.certificate);
        const now = dayjs();
        const validFrom = dayjs(info.validFrom);
        const validTo = dayjs(info.validTo);
        const totalLifetime = validTo.diff(validFrom, 'days');
        const remainingDays = validTo.diff(now, 'days');
        const renewalThreshold = Math.max(totalLifetime * this.renewalRatio, MINIMUM_RENEWAL_DAYS);

        if (force === false && remainingDays > renewalThreshold) {
          logger.info(
            `no need to renewal ${cert.domain}, remaining ${remainingDays} days > threshold ${renewalThreshold.toFixed(1)} days (max of ${(this.renewalRatio * 100).toFixed(0)}% of ${totalLifetime} days lifetime or ${MINIMUM_RENEWAL_DAYS} days)`
          );
          return null;
        }

        status = CERT_STATUS.renewaling;
      }

      await states.certificate.updateStatus(cert.domain, status);
      const data = await this.acme.create({
        subject: cert.domain,
        subscriberEmail,
        challenges,
      });

      logger.info(`create certificate for ${domain} job success`);

      const [count, certs] = await states.certificate.update(
        { domain: data.subject },
        {
          $set: {
            domain: data.subject,
            status: CERT_STATUS.generated,
            certificate: data.fullchain,
            privateKey: data.privkey,
          },
        }
      );

      if (count === 0) {
        throw new Error(`update certificate for ${domain} failed`);
      }

      logger.info(`updated ${count} certificate for ${domain} job success`);

      this.emit('cert.issued', { id: cert.id, domain: data.subject, metadata });
      return certs[0];
    } catch (error) {
      logger.error(`create certificate for ${domain} job failed`, { error });
      if (error instanceof CustomError) {
        throw error;
      }

      throw new Error('certificate manager error');
    }
  }

  async checkRenewalCerts() {
    logger.info('run renewal certificate job');

    const certs = await states.certificate.findRenewCerts(this.renewalRatio, MINIMUM_RENEWAL_DAYS);

    logger.info(`found ${certs.length} certs need to renewal`);

    for (const cert of certs) {
      // eslint-disable-next-line no-await-in-loop
      await this.pushToJobQueue(cert.domain);
    }
  }
}

let instance = null;

Manager.getInstance = async ({ maintainerEmail, baseDataDir, renewalRatio }) => {
  if (instance) {
    return instance;
  }

  const dataDir = path.join(baseDataDir, '.data');

  instance = new Manager({
    packageRoot: baseDataDir,
    dataDir,
    maintainerEmail,
    renewalRatio,
    staging: typeof process.env.STAGING === 'undefined' ? process.env.NODE_ENV !== 'production' : !!process.env.STAGING,
  });

  if (process.env.ABT_IGNORE_ACME_INIT !== 'true') {
    await instance.acme.init();
  }

  return instance;
};

Manager.initInstance = Manager.getInstance;

module.exports = Manager;
