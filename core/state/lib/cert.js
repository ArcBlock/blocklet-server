const { EventEmitter } = require('events');
const CertificateManager = require('@abtnode/certificate-manager/sdk/manager');
const logger = require('@abtnode/logger')('@abtnode/core:cert');
const { EVENTS } = require('@abtnode/constant');
const { BlockletEvents } = require('@blocklet/constant');

const getDomainFromInput = (input) => {
  if (Object.prototype.toString.call(input) === '[object Object]') {
    return input.domain;
  }

  return input;
};

class Cert extends EventEmitter {
  constructor({ maintainerEmail, dataDir, states, teamManager }) {
    super();

    this.manager = new CertificateManager({ maintainerEmail, dataDir });

    this.manager.on('cert.issued', this.onCertIssued.bind(this));
    this.manager.on('cert.expired', this.onCertExpired.bind(this));
    this.manager.on('cert.about_to_expire', this.onCertAboutToExpire.bind(this));
    this.manager.on('cert.error', this.onCertError.bind(this));

    /**
     * Array<{domain: string, did: string}>
     */
    this.blockletDomains = [];
    this.states = states;
    this.teamManager = teamManager;
  }

  start() {
    return this.manager.start();
  }

  static fixCertificate(entity) {
    // Hack: this logic exists because gql does not allow line breaks in arg values
    entity.privateKey = entity.privateKey.split('|').join('\n');
    entity.certificate = entity.certificate.split('|').join('\n');
  }

  getAll() {
    return this.manager.getAll();
  }

  getAllNormal() {
    return this.manager.getAllNormal();
  }

  getNormalByDomain(domain) {
    return this.manager.getNormalByDomain(domain);
  }

  getByDomain(inputDomain) {
    const domain = getDomainFromInput(inputDomain);
    return this.manager.getByDomain(domain);
  }

  async add(data) {
    if (!data.certificate || !data.privateKey) {
      throw new Error('certificate and privateKey are required');
    }

    Cert.fixCertificate(data);

    const result = await this.manager.add(data);
    logger.info('add certificate result', { name: result.name });
    this.emit(EVENTS.CERT_ADDED, result);

    return result;
  }

  /**
   * 签发证书
   * @param object data
   * @param string data.domain Domain name
   * @param string data.did Blocklet DID
   * @param object options
   * @param number options.delay Delay time in ms
   */
  issue({ domain, did, siteId, inBlockletSetup = false }, { delay = 0 } = {}) {
    logger.info(`generate certificate for ${domain}`);

    if (did) {
      this.bindBlocklet({ domain, did });
    }

    return this.manager
      .issue({ domain, siteId, inBlockletSetup }, { delay, metadata: { inBlockletSetup, blockletDid: did } })
      .then(async (cert) => {
        // 在 Blocklet Dashboard 中添加域名时，需要更新 domainAliases 中 certificateId
        // 直接在 Blocklet Server Dashboard 中添加域名时，不需要更新 domainAliases 中 certificateId
        if (siteId) {
          const site = await this.states.site.findOne({ id: siteId });
          for (const d of site.domainAliases) {
            if (d.value === domain) {
              d.certificateId = cert.id;

              break;
            }
          }

          await this.states.site.update({ id: siteId }, { $set: { domainAliases: site.domainAliases } });
          logger.info('updated cert id for domain alias', { domain, did, certId: cert.id });
        }

        return cert;
      });
  }

  async upsertByDomain(data) {
    const result = await this.manager.upsertByDomain(data);
    this.emit(EVENTS.CERT_UPDATED, result);

    return result;
  }

  update(data) {
    if (data.certificate && data.privateKey) {
      Cert.fixCertificate(data);
    }

    return this.manager.update(data.id, {
      name: data.name,
      public: data.public,
      certificate: data.certificate,
      privateKey: data.privateKey,
    });
  }

  async remove({ id }) {
    const cert = await this.manager.findById(id);
    if (cert) {
      await this.manager.remove(id);
      logger.info('delete certificate', { id });
      this.emit(EVENTS.CERT_REMOVED, cert);
    }

    return {};
  }

  addWithoutValidations(data) {
    return this.manager.addWithoutValidations(data);
  }

  updateWithoutValidations(id, data) {
    return this.manager.updateWithoutValidations(id, data);
  }

  bindBlocklet({ domain, did }) {
    // only save 100 domains in memory
    const list = this.blockletDomains.slice(-100).filter((x) => x.domain !== domain);
    list.push({ domain, did });
    this.blockletDomains = list;
  }

  /**
   * @param {{
   *   blocklet: string;
   *   server: string;
   * }} event
   * @param {{
   *   domain: string
   * }} cert
   */
  emitEvent(event, cert) {
    const blockletDomain = this.blockletDomains.find((x) => x.domain === cert.domain);
    if (blockletDomain) {
      this.emit(event.blocklet, { ...cert, meta: { did: blockletDomain.did } });
    } else {
      this.emit(event.server, cert);
    }
  }

  onCertIssued(cert) {
    this.emitEvent({ blocklet: BlockletEvents.certIssued, server: EVENTS.CERT_ISSUED }, cert);

    this.teamManager?.createNotification({
      title: 'Certificate Issued',
      description: `The ${cert.domain} certificate is issued successfully`,
      severity: 'success',
      entityType: 'certificate',
      entityId: cert.id,
    });

    logger.info('send certificate issued notification', { domain: cert.domain, certId: cert.id });
  }

  onCertError(cert) {
    cert.message = cert.error?.message;

    this.emitEvent({ blocklet: BlockletEvents.certError, server: EVENTS.CERT_ERROR }, cert);

    this.teamManager?.createNotification({
      title: 'Certificate Issue Failed',
      description: `Failed to issue certificate for ${cert.domain}: ${cert.message}`,
      severity: 'error',
      entityType: 'certificate',
      entityId: cert.id,
    });

    logger.info('send certificate issue failed notification', { domain: cert.domain, certId: cert.id });
  }

  onCertExpired(cert) {
    this.teamManager?.createNotification({
      title: 'SSL Certificate Expired',
      description: `Your SSL certificate for domain ${cert.domain} has expired, please update it in Blocklet Server`,
      severity: 'error',
      entityType: 'certificate',
      entityId: cert.id,
    });

    logger.info('send certificate expire notification', { domain: cert.domain, certId: cert.id });
  }

  onCertAboutToExpire(cert) {
    this.teamManager?.createNotification({
      title: 'SSL Certificate Expire Warning',
      description: `Your SSL certificate for domain ${cert.domain} will expire in ${
        cert.expireInDays
      } days (on ${new Date(cert.validTo).toLocaleString()}), please remember to update it in Blocklet Server`,
      severity: 'warning',
      entityType: 'certificate',
      entityId: cert.id, // eslint-disable-line no-underscore-dangle
    });

    logger.info('send certificate about-expire notification', { domain: cert.domain, certId: cert.id });
  }
}

module.exports = Cert;
