import semver from 'semver';

export const SAFE_NODE_VERSION = 'v21.6.0';
/**
 *
 * @param {string} version
 * @returns boolean
 */
export const canUseFileSystemIsolateApi = version => semver.gte(version, SAFE_NODE_VERSION);
