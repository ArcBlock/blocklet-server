const crypto = require('crypto');
const uuid = require('uuid');
const { CustomError } = require('@blocklet/error');
const BaseState = require('./base');
const { oauthClientSchema } = require('../validators/oauth');

const generateCode = (length = 16) => crypto.randomBytes(length).toString('hex').toUpperCase();

/**
 * @extends BaseState<import('@abtnode/models').OauthClientState>
 */
class OauthClient extends BaseState {
  constructor(model, config, models) {
    super(model, config);

    this.models = models;
  }

  async create(input, context) {
    const {
      clientName,
      clientUri,
      redirectUris,
      scope = 'profile:read',
      contacts,
      tosUri,
      policyUri,
      logoUri,
      tokenEndpointAuthMethod,
      grantTypes = ['authorization_code', 'refresh_token'],
      responseTypes = ['code'],
      jwksUri,
      jwks,
      softwareId,
      softwareVersion,
      clientSecretExpiresAt = null,
    } = input || {};

    const data = {
      clientName,
      clientUri,
      logoUri,
      redirectUris: redirectUris && Array.isArray(redirectUris) ? redirectUris : [redirectUris],
      tokenEndpointAuthMethod,
      grantTypes,
      responseTypes,
      scope,
      contacts: contacts && Array.isArray(contacts) ? contacts : [contacts],
      tosUri,
      policyUri,
      jwksUri,
      jwks,
      softwareId,
      softwareVersion,
      clientId: uuid.v4(),
      clientSecret: generateCode(32),
      clientIdIssuedAt: parseInt(Date.now() / 1000, 10),
      clientSecretExpiresAt,
      createdBy: context.user.did,
    };

    await oauthClientSchema.validateAsync(data, { stripUnknown: true });

    const doc = await this.insert(data);
    return doc;
  }

  async update(input = {}) {
    const {
      clientName,
      clientUri,
      redirectUris,
      scope = 'profile:read',
      contacts,
      tosUri,
      policyUri,
      logoUri,
      clientId,
      clientSecretExpiresAt,
    } = input || {};

    const doc = await this.findOne({ clientId });
    if (!doc) {
      throw new CustomError(404, `OAuth Client Id ${clientId} does not exist`);
    }

    doc.clientName = clientName;
    doc.clientUri = clientUri;
    doc.redirectUris = redirectUris && Array.isArray(redirectUris) ? redirectUris : [redirectUris];
    doc.scope = scope;
    doc.contacts = contacts && Array.isArray(contacts) ? contacts : [contacts];
    doc.tosUri = tosUri;
    doc.policyUri = policyUri;
    doc.logoUri = logoUri;
    doc.clientSecretExpiresAt = clientSecretExpiresAt;

    await super.update({ clientId }, { $set: doc });
    return doc;
  }

  async list(paging) {
    const { list, paging: pagingInfo } = await this.paginate({}, { updatedAt: -1 }, paging);
    return {
      list: await Promise.all(
        list.map(async (item) => ({
          ...item,
          createUser: item.createdBy ? await this.models.User.findOne({ where: { did: item.createdBy } }) : null,
        }))
      ),
      paging: pagingInfo,
    };
  }
}

module.exports = OauthClient;
