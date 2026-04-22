const { EventEmitter } = require('events');
const http = require('http');
const https = require('https');
const ACME = require('@root/acme');
const Keypairs = require('@root/keypairs');
const CSR = require('@root/csr');
const PEM = require('@root/pem');
const punycode = require('punycode/');

const states = require('../states');
const logger = require('./logger');

// 强制使用 IPv4
// 背景: 在某些机器上 acme.js 连接 Let's Encrypt Directory URL 时会使用 IPv6
// 但是使用 IPv6 时会导致连接失败， 所以强制使用 IPv4.
// https://github.com/ArcBlock/blocklet-server/issues/10078
if (!process.env.ABT_NODE_ENABLE_IPV6) {
  http.globalAgent.options.family = 4;
  https.globalAgent.options.family = 4;
}

const DIRECTORY_URL = 'https://acme-v02.api.letsencrypt.org/directory';
const DIRECTORY_URL_STAGING = 'https://acme-staging-v02.api.letsencrypt.org/directory';

class AcmeWrapper extends EventEmitter {
  constructor({ maintainerEmail, packageAgent, staging = false }) {
    super();

    this.acme = ACME.create({
      maintainerEmail,
      packageAgent,
      // events list:
      // 1. error
      // 2. warning
      // 3. certificate_order
      // 4. challenge_select
      // 5. challenge_status
      notify: (event, details) => {
        if (event === 'error') {
          logger.error('issue with error:', details);
          this.emit('cert.error', { error: details });
          return;
        }

        if (event === 'warning') {
          logger.warn('issue with warning', { details });
          this.emit('cert.warning', { details });
          return;
        }

        if (['challenge_status', 'cert_issue'].includes(event)) {
          logger.info(`notify ${event} details:`, details);
        }

        this.emit('cert.event:', event);
      },
    });

    this.staging = staging;
    this.directoryUrl = this.staging === true ? DIRECTORY_URL_STAGING : DIRECTORY_URL;
    this.maintainerEmail = maintainerEmail;

    logger.info('directory url', { url: this.directoryUrl });
  }

  async init() {
    await this.acme.init(this.directoryUrl);
  }

  async create({ subject, subscriberEmail, agreeToTerms = true, challenges }) {
    const domains = [subject].map((name) => punycode.toASCII(name));

    const encoding = 'der';
    const typ = 'CERTIFICATE REQUEST';

    const serverKeypair = await Keypairs.generate({ kty: 'RSA', format: 'jwk' });
    const serverKey = serverKeypair.private;
    const serverPem = await Keypairs.export({ jwk: serverKey, encoding: 'pem' });

    const csrDer = await CSR.csr({ jwk: serverKey, domains, encoding });
    const csr = PEM.packBlock({ type: typ, bytes: csrDer });
    logger.info(`validating domain authorization for ${domains.join(' ')}`);

    const dbAccount = await this._createAccount(subscriberEmail, agreeToTerms);
    const accountKey = dbAccount.private_key;

    try {
      const pems = await this.acme.certificates.create({
        account: dbAccount.account,
        accountKey,
        csr,
        domains,
        challenges,
      });

      const fullchain = `${pems.cert}\n${pems.chain}\n`;

      logger.info('certificates generated!');

      const data = {
        subject,
        privkey: serverPem,
        cert: pems.cert,
        chain: pems.chain,
        fullchain,
        challenges,
      };

      return data;
    } catch (error) {
      logger.error('create certificate error', { domain: subject, error });
      this.emit('cert.error', { domain: subject, error_message: error.message });
      throw error;
    }
  }

  async _createAccount(subscriberEmail, agreeToTerms) {
    const dbAccount = await states.account.findOne({ directoryUrl: this.directoryUrl });
    if (dbAccount) {
      return dbAccount;
    }

    // TODO: kty 可以是 RSA? 和 EC 有什么区别？
    const accountKeypair = await Keypairs.generate({ kty: 'EC', format: 'jwk' });
    const accountKey = accountKeypair.private;

    const account = await this.acme.accounts.create({
      subscriberEmail,
      agreeToTerms,
      accountKey,
    });

    await states.account.upsert(
      { directoryUrl: this.directoryUrl },
      { directoryUrl: this.directoryUrl, private_key: accountKey, account, maintainer_email: this.maintainerEmail }
    );

    logger.info('account was created', { directoryUrl: this.directoryUrl, maintainerEmail: this.maintainerEmail });
    return states.account.findOne({ directoryUrl: this.directoryUrl });
  }
}

module.exports = AcmeWrapper;
