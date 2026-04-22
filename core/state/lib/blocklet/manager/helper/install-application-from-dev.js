const path = require('path');
const fs = require('fs-extra');
const { BlockletStatus, BLOCKLET_MODES, BlockletSource } = require('@blocklet/constant');
const { ROLES } = require('@abtnode/constant');
const { generateRandomString } = require('@abtnode/models/lib/util');

const logger = require('@abtnode/logger')('@abtnode/core:install-app-dev');
const { ensureMeta, updateBlockletFallbackLogo, getBundleDir } = require('../../../util/blocklet');

/**
 *
 * @param {{
 *  manager: import('../disk'),
 *  states: import('../../../states/index')
 * }}
 * @returns
 */
const installApplicationFromDev = async ({ folder, meta, states, manager } = {}) => {
  const { version, name, did } = meta;

  const exist = await states.blocklet.getBlocklet(did);
  if (exist) {
    throw new Error(`The application ${exist.meta.title} already exists`);
  }

  // create component
  const component = {
    meta: ensureMeta(meta),
    mountPoint: '/',
    source: BlockletSource.local,
    deployedFrom: folder,
    status: BlockletStatus.installed,
    mode: BLOCKLET_MODES.DEVELOPMENT,
  };

  // create app
  await manager._addBlocklet({
    component,
    name,
    did,
    mode: BLOCKLET_MODES.DEVELOPMENT,
    folder,
  });
  logger.info('add blocklet for dev', { did, version, meta });

  // Add Config
  await manager._setConfigsFromMeta(did);

  // should ensure blocklet integrity
  let blocklet = await manager.ensureBlocklet(did);

  // Add environments
  await manager._updateBlockletEnvironment(did);
  blocklet = await manager.getBlocklet(did);

  await states.blocklet.setBlockletStatus(did, BlockletStatus.installed);

  // logo
  if (fs.existsSync(path.join(folder, component.meta.logo))) {
    await fs.copy(
      path.join(folder, component.meta.logo),
      path.join(getBundleDir(manager.installDir, blocklet.meta), component.meta.logo)
    );
  }
  await updateBlockletFallbackLogo(blocklet);

  await states.blocklet.setInstalledAt(did);

  // Init team db for dev mode (same as production install flow)
  await manager.teamManager.initTeam(did);
  logger.info('initTeam completed for dev mode', { did });

  // In dev mode, auto set server owner as blocklet owner
  const nodeInfo = await states.node.read();
  if (nodeInfo.nodeOwner?.did && nodeInfo.nodeOwner?.pk) {
    // Set blocklet owner in settings
    await manager.setInitialized({
      did,
      owner: {
        did: nodeInfo.nodeOwner.did,
        pk: nodeInfo.nodeOwner.pk,
      },
    });
    logger.info('set blocklet owner from server owner in dev mode', { did, owner: nodeInfo.nodeOwner.did });

    // Add owner to user table so it shows in Members page
    try {
      // Get server owner's user info from server team
      const serverUserState = await manager.teamManager.getUserState(nodeInfo.did);
      const serverOwner = await serverUserState.getUser(nodeInfo.nodeOwner.did);

      // Get blocklet's user state
      const blockletUserState = await manager.teamManager.getUserState(did);

      // Generate a passport ID for the owner
      const passportId = `z${generateRandomString(40)}`;

      // Add owner to blocklet's user table with owner role and passport
      const ownerUser = {
        did: nodeInfo.nodeOwner.did,
        pk: nodeInfo.nodeOwner.pk,
        fullName: serverOwner?.fullName || 'Owner',
        avatar: serverOwner?.avatar || '',
        role: ROLES.OWNER,
        approved: true,
        passports: [
          {
            id: passportId,
            type: ['NFTPassport', 'VerifiableCredential', 'ABTNodePassport'],
            issuer: {
              id: did,
              pk: nodeInfo.pk,
              name: meta.title || meta.name,
            },
            specVersion: '1.0.0',
            name: ROLES.OWNER,
            title: 'Owner',
            endpoint: '',
            status: 'valid',
            role: ROLES.OWNER,
            source: 'issue',
          },
        ],
      };
      await blockletUserState.addUser(ownerUser);
      logger.info('added owner to blocklet user table in dev mode', { did, ownerDid: nodeInfo.nodeOwner.did });
    } catch (err) {
      logger.warn('failed to add owner to blocklet user table in dev mode', { did, error: err.message });
    }
  } else {
    logger.warn('server owner not found, blocklet owner not set in dev mode', { did });
  }

  blocklet = await manager.getBlocklet(did);

  return blocklet;
};

module.exports = { installApplicationFromDev };
