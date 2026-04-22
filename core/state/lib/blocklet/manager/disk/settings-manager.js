const isUrl = require('is-url');
const get = require('lodash/get');
const isNil = require('lodash/isNil');
const isUndefined = require('lodash/isUndefined');
const isEmpty = require('lodash/isEmpty');
const uniq = require('lodash/uniq');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:manager:settings');
const { CustomError } = require('@blocklet/error');
const { Joi } = require('@arcblock/validator');
const { SESSION_CACHE_TTL, BACKUPS, EVENTS } = require('@abtnode/constant');
const { BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');
const { getEmailServiceProvider } = require('@abtnode/auth/lib/email');

const { getOriginUrl } = require('@abtnode/util/lib/url-evaluation');
const request = require('../../../util/request');

const states = require('../../../states');
const { validateOwner } = require('../../../util');
const { validateAddSpaceGateway, validateUpdateSpaceGateway } = require('../../../validators/space-gateway');
const { sessionConfigSchema } = require('../../../validators/util');
const { translate } = require('../../../locales');
const { SpacesBackup } = require('../../storage/backup/spaces');
const { getBackupJobId, getBackupEndpoint, getCheckUpdateJobId } = require('../../../util/spaces');
const { decryptValue } = require('../../../util/aigne-verify');

/**
 * Set blocklet blurhash
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @param {Object} params.blurhash - Blurhash data
 * @returns {Promise<Object>}
 */
async function setBlockletBlurhash(manager, { did, blurhash }) {
  await states.blockletExtras.setSettings(did, { blurhash });
  const newState = await manager.getBlocklet(did);
  return newState;
}

/**
 * Get blocklet blurhash
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @returns {Promise<Object>}
 */
async function getBlockletBlurhash(manager, { did }) {
  const blurhash = await states.blockletExtras.getSettings(did, 'blurhash');
  const result = blurhash || {};
  if (!result.splashPortrait) {
    result.splashPortrait = 'U0PQ87~q?b~q?bfQj[fQ~qof9FWB?bfQayj[';
  }
  if (!result.splashLandscape) {
    result.splashLandscape = 'U2PQ87xu-;xu%MayfQj[~qj[D%ay%Mj[fQay';
  }
  return result;
}

/**
 * Update blocklet settings
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateBlockletSettings(
  manager,
  { did, enableSessionHardening, invite, gateway, aigne, org, subService },
  context
) {
  const params = {};
  if (!isNil(enableSessionHardening)) {
    params.enableSessionHardening = enableSessionHardening;
  }

  if (!isNil(invite)) {
    params.invite = invite;
  }

  if (!isNil(gateway)) {
    params.gateway = gateway;
  }

  if (!isNil(aigne)) {
    const { key, url } = aigne;
    if (url && !isUrl(url)) {
      throw new CustomError(400, 'The AIGNE API Url is either missing or incorrectly formatted');
    }
    if (!key) {
      throw new CustomError(400, 'The AIGNE API key is missing');
    }

    const decryptedKey = decryptValue(key, did);
    if (key && !decryptedKey) {
      throw new CustomError(400, 'Save failed, the API key is not encrypted');
    }
    params.aigne = {
      ...aigne,
      url: getOriginUrl(aigne.url),
    };
  }

  if (!isNil(subService)) {
    // Security: Validate subService configuration to prevent path traversal
    const SUB_SERVICE_SCHEMA = Joi.object({
      enabled: Joi.boolean().required(),
      domain: Joi.when('enabled', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow(''),
      }),
      staticRoot: Joi.when('enabled', {
        is: true,
        then: Joi.string()
          .required()
          // Reject paths containing ".." or starting with "/"
          .pattern(/^[^/]/, { name: 'no-absolute-path' })
          .pattern(/^(?!.*\.\.).*$/, { name: 'no-parent-reference' })
          .messages({
            'string.pattern.name': 'Invalid path. Path cannot contain ".." or start with "/"',
          }),
        otherwise: Joi.string().optional().allow(''),
      }),
    });

    const { error } = SUB_SERVICE_SCHEMA.validate(subService);
    if (error) {
      throw new CustomError(400, error.message);
    }

    params.subService = subService;
  }

  let shouldRotateSession = false;
  if (!isNil(org)) {
    const ORG_SCHEMA = Joi.object({
      enabled: Joi.boolean().required(),
      maxMemberPerOrg: Joi.number().required().min(2).default(100),
      maxOrgPerUser: Joi.number().required().min(1).default(10),
    });
    const { error } = ORG_SCHEMA.validate(org);
    if (error) {
      throw new CustomError(400, error.message);
    }
    const currentState = await manager.getBlocklet(did, { useCache: true });
    const orgEnabled = get(currentState, 'settings.org.enabled', false);
    if (orgEnabled !== org.enabled) {
      shouldRotateSession = true;
    }
    params.org = org;
  }

  const keys = Object.keys(params);
  if (!keys.length) {
    throw new Error('No settings to update');
  }

  await states.blockletExtras.setSettings(did, params);

  if (!isNil(gateway)) {
    const nodeState = states.node;
    const doc = await nodeState.read();
    nodeState.emit(EVENTS.RELOAD_GATEWAY, doc);
  }

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });

  if (shouldRotateSession) {
    manager.teamAPI.rotateSessionKey({ teamDid: did });
  }

  return newState;
}

/**
 * Update app session config
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateAppSessionConfig(manager, { did, config }, context) {
  const validateConfig = await sessionConfigSchema.validateAsync(config);

  const blocklet = await manager.getBlocklet(did);
  if (!blocklet) {
    throw new Error('blocklet does not exist');
  }

  const sessionConfig = cloneDeep(blocklet.settings.session || {});

  if (validateConfig.cacheTtl) {
    sessionConfig.cacheTtl = validateConfig.cacheTtl;
  } else {
    sessionConfig.cacheTtl = SESSION_CACHE_TTL;
  }
  if (validateConfig.ttl) {
    sessionConfig.ttl = validateConfig.ttl;
  }

  sessionConfig.email = validateConfig.email;
  sessionConfig.phone = validateConfig.phone;
  sessionConfig.enableBlacklist = validateConfig.enableBlacklist;

  if (sessionConfig.email?.enabled && sessionConfig.email?.requireVerified && !getEmailServiceProvider(blocklet)) {
    throw new Error('Email verification is required but email service is not available');
  }

  await states.blockletExtras.setSettings(blocklet.meta.did, { session: sessionConfig });
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletEvents.updated, { ...newState, context });

  return newState;
}

/**
 * Update vault
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateVault(manager, { did, vaults }, context) {
  await states.blocklet.updateBlockletVaults(did, vaults);
  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletEvents.updated, { ...newState, context });
  return newState;
}

/**
 * Add blocklet space gateway
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function addBlockletSpaceGateway(manager, { did, spaceGateway }) {
  const spaceGateways = await getBlockletSpaceGateways(manager, { did });

  const { error, value } = validateAddSpaceGateway.validate(spaceGateway, {
    stripUnknown: true,
    allowUnknown: true,
  });

  if (error) {
    throw error;
  }

  spaceGateways.push(value);

  await states.blockletExtras.setSettings(did, { spaceGateways });
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
}

/**
 * Delete blocklet space gateway
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function deleteBlockletSpaceGateway(manager, { did, spaceGatewayDid }) {
  const spaceGateways = await getBlockletSpaceGateways(manager, { did });

  const latestSpaceGateways = spaceGateways.filter((s) => {
    if (spaceGatewayDid) {
      return s?.did !== spaceGatewayDid;
    }
    return !isUndefined(s?.did);
  });

  await states.blockletExtras.setSettings(did, { spaceGateways: latestSpaceGateways });
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
}

/**
 * Update blocklet space gateway
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function updateBlockletSpaceGateway(manager, { did, where, spaceGateway }) {
  const { error, value } = validateUpdateSpaceGateway.validate(spaceGateway, {
    stripUnknown: true,
    allowUnknown: true,
  });

  if (error) {
    throw error;
  }

  const spaceGateways = await getBlockletSpaceGateways(manager, { did });

  for (const s of spaceGateways) {
    if (s.did === where?.did) {
      Object.assign(s, value);
      break;
    }
  }

  await states.blockletExtras.setSettings(did, { spaceGateways });
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
}

/**
 * Get blocklet space gateways
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Array>}
 */
async function getBlockletSpaceGateways(manager, { did }) {
  const spaceGateways = await states.blockletExtras.getSettings(did, 'spaceGateways', []);
  return spaceGateways;
}

/**
 * Update user space hosts
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<void>}
 */
async function updateUserSpaceHosts(manager, { did, url }) {
  if (isUrl(url)) {
    try {
      const { data } = await request.get(joinURL(url, '__blocklet__.js?type=json'), { timeout: 5000 });
      if (Array.isArray(data.domainAliases)) {
        const userSpaceHosts = await getUserSpaceHosts(manager, { did });
        const validHosts = data.domainAliases.filter(
          (x) => x.endsWith('.did.abtnet.io') === false && x.endsWith('.ip.abtnet.io') === false
        );
        if (validHosts.every((x) => userSpaceHosts.includes(x))) {
          return;
        }

        logger.info('updateUserSpaceHosts', { did, url, domains: data.domainAliases });
        await states.blockletExtras.setSettings(did, {
          userSpaceHosts: uniq([...userSpaceHosts, ...validHosts]),
        });
        manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
      }
    } catch (error) {
      logger.error('updateUserSpaceHosts', { did, url, error });
    }
  }
}

/**
 * Get user space hosts
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Array>}
 */
async function getUserSpaceHosts(manager, { did }) {
  const userSpaceHosts = await states.blockletExtras.getSettings(did, 'userSpaceHosts', []);
  return userSpaceHosts;
}

/**
 * Update auto backup settings
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<void>}
 */
async function updateAutoBackup(manager, { did, autoBackup }, context) {
  const value = { ...autoBackup };

  const jobId = getBackupJobId(did);
  if (typeof manager.backupQueue.delete === 'function') {
    await manager.backupQueue.delete(jobId);
  }

  logger.info('updateAutoBackup.$value', value);

  if (value.enabled) {
    const blocklet = await states.blocklet.getBlocklet(did);
    const backupEndpoint = getBackupEndpoint(blocklet?.environments);

    if (isEmpty(backupEndpoint)) {
      throw new Error(translate(context?.user?.locale, 'backup.space.unableEnableAutoBackup'));
    }

    const spacesBackup = new SpacesBackup({
      appDid: blocklet.appDid,
      appPid: blocklet.meta.did,
      event: manager,
      userDid: context?.user?.did,
      referrer: context?.referrer,
      locale: context?.user?.locale,
      backup: {},
    });
    await spacesBackup.initialize();
    await spacesBackup.verifySpace();

    if (!SpacesBackup.isRunning(did)) {
      manager.backupQueue.push(
        {
          entity: 'blocklet',
          action: 'backupToSpaces',
          did,
          context,
        },
        jobId,
        true,
        BACKUPS.JOB.INTERVAL
      );
    }
  }

  await states.blockletExtras.setSettings(did, { autoBackup: value });
  const newState = await manager.getBlocklet(did);

  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });
  if (!value.enabled) {
    manager.emit(BlockletEvents.disableAutoBackup, { args: { did, autoBackup }, result: autoBackup, context });
  }
}

/**
 * Get auto backup settings
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function getAutoBackup(manager, { did }) {
  const autoBackup = await states.blockletExtras.getSettings(did, 'autoBackup', { enabled: false });
  return autoBackup;
}

/**
 * Update auto check update settings
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<void>}
 */
async function updateAutoCheckUpdate(manager, { did, autoCheckUpdate }, context) {
  const value = { ...autoCheckUpdate };
  await states.blockletExtras.setSettings(did, { autoCheckUpdate: value });

  const newState = await manager.getBlocklet(did);
  manager.emit(BlockletInternalEvents.appSettingChanged, { appDid: did });
  manager.emit(BlockletEvents.updated, { ...newState, context });

  const jobId = getCheckUpdateJobId(did);
  await manager.checkUpdateQueue.delete(jobId);

  logger.info('updateAutoCheckUpdate.$value', value);

  if (value.enabled) {
    manager.checkUpdateQueue.push(
      {
        entity: 'blocklet',
        action: 'autoCheckUpdate',
        did,
        context,
      },
      jobId,
      true
    );
  }
}

/**
 * Get auto check update settings
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @returns {Promise<Object>}
 */
function getAutoCheckUpdate(manager, { did }) {
  return states.blockletExtras.getSettings(did, 'autoCheckUpdate', { enabled: false });
}

/**
 * Set blocklet initialized
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function setInitialized(manager, { did, owner, purpose = '' }, context) {
  if (!validateOwner(owner)) {
    logger.warn('Blocklet owner is invalid for setInitialized', { did, owner });
    throw new Error('Blocklet owner is invalid');
  }

  const blocklet = await states.blocklet.getBlocklet(did);
  await states.blockletExtras.setSettings(blocklet.meta.did, { initialized: true, owner, purpose });
  manager.configSynchronizer.throttledSyncAppConfig(blocklet.meta.did);
  logger.info('Blocklet initialized', { did, owner });

  manager.emit(BlockletEvents.updated, { meta: { did: blocklet.meta.did }, context });

  return manager.getBlocklet(did);
}

/**
 * Update blocklet owner
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateOwner(manager, { did, owner }, context) {
  if (!validateOwner(owner)) {
    logger.warn('Blocklet owner is invalid for updateOwner', { did, owner });
    throw new Error('Blocklet owner is invalid');
  }

  const blocklet = await states.blocklet.getBlocklet(did);
  await states.blockletExtras.setSettings(blocklet.meta.did, { owner });
  logger.info('update blocklet owner', { did, owner });

  manager.emit(BlockletEvents.updated, { meta: { did: blocklet.meta.did }, context });

  return manager.getBlocklet(did);
}

module.exports = {
  setBlockletBlurhash,
  getBlockletBlurhash,
  updateBlockletSettings,
  updateAppSessionConfig,
  updateVault,
  addBlockletSpaceGateway,
  deleteBlockletSpaceGateway,
  updateBlockletSpaceGateway,
  getBlockletSpaceGateways,
  updateUserSpaceHosts,
  getUserSpaceHosts,
  updateAutoBackup,
  getAutoBackup,
  updateAutoCheckUpdate,
  getAutoCheckUpdate,
  setInitialized,
  updateOwner,
};
