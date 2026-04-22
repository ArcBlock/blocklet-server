const logger = require('@abtnode/logger')('@abtnode/core:states:verify-code');

const { CustomError } = require('@blocklet/error');
const { Hasher } = require('@ocap/mcrypto');
const { Joi } = require('@arcblock/validator');
const { VERIFY_CODE_LENGTH, VERIFY_CODE_TTL, VERIFY_SEND_TTL } = require('@abtnode/constant');

const BaseState = require('./base');

const schema = Joi.string().email().lowercase().required();

/**
 * @extends BaseState<import('@abtnode/models').VerifyCodeState>
 */
class VerifyCodeState extends BaseState {
  async create(raw, scope = 'email', purpose = 'kyc') {
    let subject = raw;
    if (scope === 'email') {
      const { error, value } = schema.validate(subject);
      if (error) {
        throw new CustomError(400, 'Invalid email specified when create verify code');
      }
      subject = value;
    }

    const count = await super.remove({ subject, verified: false });
    if (count > 0) {
      logger.info('remove old verify code', { subject });
    }

    return this.insert({
      code: await this.getVerifyCode(),
      subject,
      digest: Hasher.SHA3.hash256(subject),
      scope,
      verified: false,
      expired: false,
      sent: false,
      issued: false,
      purpose,
    });
  }

  async issue(code) {
    if (!code || code.length !== VERIFY_CODE_LENGTH) {
      throw new CustomError(400, 'verify code invalid');
    }

    const doc = await super.findOne({ code });
    if (!doc) {
      throw new CustomError(404, 'verify code not found');
    }

    if (!doc.verified) {
      throw new CustomError(400, 'verify code has not been verified');
    }

    if (doc.issued) {
      throw new CustomError(400, 'verify code is already issued');
    }

    logger.info('issue verify code', { code, subject: doc.subject });
    const [, [updated]] = await super.update({ code }, { issued: true, issuedAt: Date.now() });

    return updated;
  }

  async verify(code) {
    if (!code || code.length !== VERIFY_CODE_LENGTH) {
      throw new CustomError(400, 'verify code invalid');
    }

    const doc = await super.findOne({ code });
    if (!doc) {
      throw new CustomError(404, 'verify code not found');
    }

    if (doc.expired) {
      throw new CustomError(400, 'verify code has expired');
    }

    if (+new Date() > +doc.createdAt + VERIFY_CODE_TTL) {
      logger.info('expire verify token', { code, subject: doc.subject });
      await super.update({ code }, { expired: true, expiredAt: Date.now() });
      throw new CustomError(400, 'verify code has expired');
    }

    if (doc.verified) {
      throw new CustomError(400, 'verify code has been consumed');
    }

    logger.info('consume verify code', { code, subject: doc.subject });
    const [, [updated]] = await super.update({ code }, { verified: true, verifiedAt: Date.now() });
    // await super.remove({ subject: doc.subject, verified: false });

    return updated;
  }

  async send(code) {
    if (!code || code.length !== VERIFY_CODE_LENGTH) {
      throw new CustomError(400, 'verify code invalid');
    }

    const doc = await super.findOne({ code });
    if (!doc) {
      throw new CustomError(404, 'verify code not found');
    }

    if (doc.sent) {
      throw new CustomError(400, 'verify code has sent');
    }

    logger.info('send verify code', { code, subject: doc.subject });
    const [, [updated]] = await super.update({ code }, { sent: true, sentAt: Date.now() });
    return updated;
  }

  async isVerified(subject) {
    const doc = await this.findOne({ subject: String(subject).trim().toLowerCase(), verified: true });
    return !!doc;
  }

  async isIssued(subject) {
    const doc = await this.findOne({ subject: String(subject).trim().toLowerCase(), issued: true });
    return !!doc;
  }

  async isSent(subject) {
    const doc = await this.findOne({ subject: String(subject).trim().toLowerCase(), sent: true });
    if (!doc) {
      return false;
    }

    return doc.sentAt && +doc.sentAt + VERIFY_SEND_TTL > +new Date();
  }

  async getVerifyCode() {
    let code;
    let exist;
    do {
      code = this.generate();
      // eslint-disable-next-line no-await-in-loop
      exist = await super.findOne({ code });
    } while (exist);

    return code;
  }

  generate() {
    return Array.from({ length: VERIFY_CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
  }
}

module.exports = VerifyCodeState;
