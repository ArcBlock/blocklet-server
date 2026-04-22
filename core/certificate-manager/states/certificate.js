const { BaseState } = require('@abtnode/models');
const dayjs = require('@abtnode/util/lib/dayjs');

const { CERT_STATUS, CERT_SOURCE } = require('../libs/constant');
const { getCertInfo } = require('../libs/util');

/**
 * @extends BaseState<import('@abtnode/models').CertificateState>
 */
class Certificate extends BaseState {
  updateStatus(domain, status) {
    if (!Object.values(CERT_STATUS).includes(status)) {
      throw new Error('invalid domain status');
    }

    return super.update({ domain }, { $set: { status } });
  }

  updateStatusById(id, status) {
    if (!Object.values(CERT_STATUS).includes(status)) {
      throw new Error('invalid domain status');
    }

    return super.update({ id }, { $set: { status } });
  }

  insert(data) {
    if (data.certificate) {
      data.meta = getCertInfo(data.certificate);
    }

    return super.insert(data);
  }

  update(condition, data) {
    if (data.certificate) {
      data.meta = getCertInfo(data.certificate);
    } else if (data?.$set?.certificate) {
      data.$set.meta = getCertInfo(data.$set.certificate);
    }

    return super.update(condition, data);
  }

  /**
   * Find Let's Encrypt certificates that should be renewed based on their remaining
   * lifetime and a minimum renewal window.
   *
   * The renewal threshold is computed as:
   *   max(totalLifetime * renewalRatio, minimumRenewalDays in milliseconds)
   * and a certificate is selected if its remaining validity is less than or equal
   * to this threshold.
   *
   * @param {number} renewalRatio
   *   Fraction of the certificate's total lifetime at which renewal should be
   *   considered. Expected to be between 0 and 1 (e.g. 0.5 = renew after 50%
   *   of the lifetime has elapsed).
   * @param {number} [minimumRenewalDays=10]
   *   Minimum number of days before expiry at which renewal should be considered,
   *   regardless of the value of {@link renewalRatio}. Must be a non-negative number.
   * @returns {Promise<import('@abtnode/models').CertificateState[]>}
   *   A promise that resolves to the list of certificates that should be renewed.
   */
  async findRenewCerts(renewalRatio, minimumRenewalDays = 10) {
    const certs = await super.find({ source: CERT_SOURCE.letsEncrypt });
    const now = dayjs();
    const minimumThreshold = minimumRenewalDays * 24 * 60 * 60 * 1000;

    return certs.filter((cert) => {
      if (!cert.meta?.validTo || !cert.meta?.validFrom) {
        return false;
      }

      const validFrom = dayjs(cert.meta.validFrom);
      const validTo = dayjs(cert.meta.validTo);
      const totalLifetime = validTo.diff(validFrom, 'milliseconds');
      const remainingTime = validTo.diff(now, 'milliseconds');
      const renewalThreshold = Math.max(totalLifetime * renewalRatio, minimumThreshold);

      return remainingTime <= renewalThreshold;
    });
  }
}

module.exports = Certificate;
