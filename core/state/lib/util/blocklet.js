/* eslint-disable camelcase */

const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet');
const {
  parseComponents,
  ensureMeta,
  filterDuplicateComponents,
  validateBlockletMeta,
  filterRequiredComponents,
} = require('@blocklet/resolver');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { forEachBlocklet, getDisplayName, findWebInterface, isExternalBlocklet } = require('@blocklet/meta/lib/util');
const { getBlockletMetaFromUrl } = require('@blocklet/meta/lib/util-meta');
const { findInterfacePortByName } = require('./index');
const { getProcessInfo, getProcessState, shouldSkipComponent } = require('./blocklet/process-manager');
const {
  getHealthyCheckTimeout,
  shouldCheckHealthy,
  isBlockletPortHealthy,
  checkBlockletProcessHealthy: _checkBlockletProcessHealthy,
} = require('./blocklet/health-check');
const {
  expandTarball,
  verifyIntegrity,
  getAppDirs,
  pruneBlockletBundle,
  getTypeFromInstallParams,
  getDiffFiles,
  getBundleDir,
  needBlockletDownload,
} = require('./blocklet/install-utils');
const { getDiskInfo, getRuntimeInfo } = require('./blocklet/runtime-info');
const {
  validateBlocklet: _validateBlocklet,
  validateBlockletChainInfo,
  checkDuplicateComponents,
  validateAppConfig,
  checkDuplicateAppSk,
  checkDuplicateMountPoint,
  resolveMountPointConflict,
  validateStore,
  validateInServerless,
  checkStructVersion,
  checkVersionCompatibility,
} = require('./blocklet/validation');
const {
  shouldEnableSlpDomain,
  getSlpDid,
  getBlockletKnownAs,
  publishDidDocument,
  updateDidDocument,
  updateDidDocumentStateOnly,
} = require('./blocklet/did-document');
const {
  getComponentDirs,
  getComponentStartEngine,
  getBlockletConfigObj,
  getAppSystemEnvironments,
  getAppOverwrittenEnvironments,
  getComponentSystemEnvironments,
  fillBlockletConfigs,
  getRuntimeEnvironments,
} = require('./blocklet/environment');
const {
  getConfigFromPreferences,
  getAppConfigsFromComponent,
  getConfigsFromInput,
  removeAppConfigsFromComponent,
  getPackComponent,
  getPackConfig,
  copyPackImages,
} = require('./blocklet/config-manager');
const { mergeMeta, getUpdateMetaList, getFixedBundleSource, getBlockletStatus } = require('./blocklet/meta-utils');
const { updateBlockletFallbackLogo, ensureAppLogo } = require('./blocklet/logo');
const {
  createDataArchive,
  isBlockletAppSkUsed,
  isRotatingAppSk,
  getBlockletURLForLauncher,
  getBlockletDidDomainList,
  getComponentNamesWithVersion,
  isDevelopmentMode,
  getHookArgs,
} = require('./blocklet/app-utils');
const { ensureBlockletExpanded, getBlocklet } = require('./blocklet/blocklet-loader');
const { ensureAppPortsNotOccupied } = require('./blocklet/port-manager');

/**
 * get blocklet engine info, default is node
 * @param {object} meta blocklet meta
 * @return {string} engine name
 */
const getBlockletEngineNameByPlatform = (meta) => getBlockletEngine(meta).interpreter;

/**
 * Wrapper for startBlockletProcess - injects local dependencies
 */
const _startBlockletProcess = (blocklet, options = {}) => {
  // eslint-disable-next-line global-require
  const processManager = require('./blocklet/process-manager');
  return processManager.startBlockletProcess(blocklet, {
    ...options,
    getComponentStartEngine,
    getRuntimeEnvironments,
  });
};

const {
  stopBlockletProcess: _stopBlockletProcess,
  deleteBlockletProcess: _deleteBlockletProcess,
  reloadBlockletProcess: _reloadBlockletProcess,
} = require('./blocklet/process-manager');

const validateBlocklet = (blocklet) => _validateBlocklet(blocklet, getBlockletEngineNameByPlatform);

/**
 * Wrapper for checkBlockletProcessHealthy - injects local dependency findInterfacePortByName
 */
const checkBlockletProcessHealthy = (blocklet, options = {}) =>
  _checkBlockletProcessHealthy(blocklet, {
    ...options,
    findInterfacePortByName,
  });

module.exports = {
  updateBlockletFallbackLogo,
  forEachBlocklet,
  getDisplayName,
  isExternalBlocklet,
  getBlockletMetaFromUrl: (url) => getBlockletMetaFromUrl(url, { logger }),
  parseComponents,
  filterRequiredComponents,
  getComponentDirs,
  getAppSystemEnvironments,
  getAppOverwrittenEnvironments,
  getComponentSystemEnvironments,
  getRuntimeEnvironments,
  getHookArgs,
  validateBlocklet,
  validateBlockletChainInfo,
  fillBlockletConfigs,
  ensureBlockletExpanded,
  startBlockletProcess: _startBlockletProcess,
  stopBlockletProcess: _stopBlockletProcess,
  deleteBlockletProcess: _deleteBlockletProcess,
  reloadBlockletProcess: _reloadBlockletProcess,
  checkBlockletProcessHealthy,
  isBlockletPortHealthy,
  shouldCheckHealthy,
  getHealthyCheckTimeout,
  getProcessInfo,
  expandTarball,
  verifyIntegrity,
  getAppDirs,
  pruneBlockletBundle,
  getDiskInfo,
  getRuntimeInfo,
  mergeMeta,
  getUpdateMetaList,
  getTypeFromInstallParams,
  findWebInterface,
  checkDuplicateComponents,
  filterDuplicateComponents,
  getDiffFiles,
  getBundleDir,
  needBlockletDownload,
  ensureMeta,
  getBlocklet,
  getConfigFromPreferences,
  createDataArchive,
  validateAppConfig,
  isBlockletAppSkUsed,
  isRotatingAppSk,
  checkDuplicateAppSk,
  checkDuplicateMountPoint,
  validateStore,
  validateInServerless,
  checkStructVersion,
  checkVersionCompatibility,
  validateBlockletMeta,
  getBlockletKnownAs,
  getFixedBundleSource,
  ensureAppLogo,
  getBlockletDidDomainList,
  getProcessState,
  getBlockletStatus,
  shouldSkipComponent,
  getBlockletURLForLauncher,
  ensureAppPortsNotOccupied,
  getComponentNamesWithVersion,
  publishDidDocument,
  updateDidDocument,
  updateDidDocumentStateOnly,
  getSlpDid,
  shouldEnableSlpDomain,
  getAppConfigsFromComponent,
  removeAppConfigsFromComponent,
  getConfigsFromInput,
  getPackComponent,
  getPackConfig,
  copyPackImages,
  getBlockletConfigObj,
  isDevelopmentMode,
  resolveMountPointConflict,
};
