/* eslint-disable no-async-promise-executor */
/* eslint-disable no-await-in-loop */
/* eslint-disable function-paren-newline */
/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const omit = require('lodash/omit');
const uniq = require('lodash/uniq');
const { Op, Sequelize } = require('sequelize');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const detectPort = require('detect-port');
const security = require('@abtnode/util/lib/security');
const { CustomError } = require('@blocklet/error');
const { fixPerson, fixInterfaces } = require('@blocklet/meta/lib/fix');
const { getDisplayName, forEachBlockletSync, forEachComponentV2, hasStartEngine } = require('@blocklet/meta/lib/util');

const {
  BlockletStatus,
  BlockletSource,
  BLOCKLET_MODES,
  BLOCKLET_DEFAULT_PORT_NAME,
  BlockletGroup,
  BLOCKLET_INTERFACE_TYPE_SERVICE,
} = require('@blocklet/constant');
const { isPortTaken } = require('@abtnode/util/lib/port');
const { verifyVault } = require('@blocklet/meta/lib/security');
const { APP_STRUCT_VERSION } = require('@abtnode/constant');
const { isValid: isValidDid } = require('@arcblock/did');

const logger = require('@abtnode/logger')('@abtnode/core:states:blocklet');

const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const BaseState = require('./base');
const { checkDuplicateComponents, ensureMeta } = require('../util/blocklet');
const { validateBlockletMeta, getBlockletStatus, shouldSkipComponent } = require('../util/blocklet');

const lock = new DBCache(() => ({
  prefix: 'blocklet-port-assign-lock',
  ttl: 1000 * 10,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

// Lock for port assignment to prevent race conditions in multi-process environment
const portAssignLock = new DBCache(() => ({
  prefix: 'blocklet-port-assign-lock',
  ttl: 1000 * 30, // 30 seconds timeout
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

// Default port range: 10000-49151 (registered ports, avoiding ephemeral range 49152-65535)
const DEFAULT_PORT_RANGE = [10000, 49151];

/**
 * 统一的端口分配方法（优化版本）
 * 使用 Set 进行 O(1) 端口查找，hash-based 确定性分配
 * @param {Object} options
 * @param {Array<string>} options.wantedPorts - 需要分配的端口名称列表
 * @param {Array<number>} options.blackListPorts - 黑名单端口（已占用的端口）
 * @param {Array<number>} options.portRange - 端口范围，默认 [10000, 49151]
 * @param {number} options.defaultPort - 回退时的起始端口
 * @param {string} options.blockletDid - blocklet DID，用于确定性 hash 分配
 * @returns {Promise<Object>} 分配的端口对象 { portName: portNumber }
 */
async function assignPortsWithLock({
  wantedPorts,
  blackListPorts = [],
  portRange = DEFAULT_PORT_RANGE,
  defaultPort = 5555,
  blockletDid = '',
}) {
  const lockName = 'blocklet-port-assign';

  // ⚠️ 关键修复：使用 DBCache 锁确保端口分配的原子性
  // 在多进程环境下，防止多个进程同时分配端口导致冲突
  await portAssignLock.acquire(lockName);

  try {
    const assignedPorts = {};
    // OPTIMIZATION: Use Set for O(1) lookup instead of Array O(n)
    const usedPortsSet = new Set(blackListPorts.map(Number));
    const rangeSize = portRange[1] - portRange[0];

    for (let i = 0; i < wantedPorts.length; i++) {
      const wantedPort = wantedPorts[i];
      let assignedPort = null;

      // OPTIMIZATION: Hash-based starting point for deterministic allocation
      // This reduces collision probability and makes port assignment reproducible
      let basePort = portRange[0];
      if (blockletDid) {
        const hash = crypto.createHash('md5').update(`${blockletDid}:${wantedPort}:${i}`).digest('hex');
        basePort = portRange[0] + (parseInt(hash.slice(0, 8), 16) % rangeSize);
      } else {
        // Fallback to random if no DID provided
        basePort = portRange[0] + Math.floor(Math.random() * rangeSize);
      }

      // OPTIMIZATION: Linear probe from hash position (more efficient than random retry)
      // Maximum probes limited to range size to guarantee termination
      const maxProbes = Math.min(rangeSize, 1000); // Cap at 1000 to avoid excessive probing
      for (let offset = 0; offset < maxProbes; offset++) {
        const candidatePort = portRange[0] + ((basePort - portRange[0] + offset) % rangeSize);

        if (!usedPortsSet.has(candidatePort)) {
          // eslint-disable-next-line no-await-in-loop
          const isTaken = await isPortTaken(candidatePort);
          if (!isTaken) {
            assignedPort = candidatePort;
            usedPortsSet.add(assignedPort);
            break;
          }
          // Mark as used even if taken by external process to avoid re-checking
          usedPortsSet.add(candidatePort);
        }
      }

      // Fallback to detectPort if linear probe fails
      if (!assignedPort) {
        logger.warn('Linear probe port assignment failed, falling back to detectPort', {
          wantedPort,
          blockletDid,
          rangeSize,
        });
        let port = Math.max(defaultPort, portRange[0]) + 1;
        // eslint-disable-next-line no-await-in-loop
        let fallbackPort = await detectPort(Number(port));
        while (usedPortsSet.has(fallbackPort) && fallbackPort < portRange[1]) {
          port = fallbackPort + 1;
          // eslint-disable-next-line no-await-in-loop
          fallbackPort = await detectPort(Number(port));
        }
        assignedPort = fallbackPort;
        usedPortsSet.add(assignedPort);
      }

      assignedPorts[wantedPort] = assignedPort;
    }

    return assignedPorts;
  } catch (err) {
    logger.error('Failed to assign ports with lock', { error: err });
    throw err;
  } finally {
    await portAssignLock.releaseLock(lockName);
  }
}

const isHex = (str) => /^0x[0-9a-f]+$/i.test(str);
const getMaxPort = (ports = {}) => Math.max(...Object.values(ports).map(Number));

/**
 * Build SQL condition for searching a DID in migratedFrom array
 * @param {string} did - The DID to search for (must be validated before calling)
 * @param {string} dialect - Database dialect ('postgres' or 'sqlite')
 * @returns {Object} Sequelize literal condition
 */
const getMigratedFromCondition = (did, dialect) => {
  if (dialect === 'postgres') {
    return Sequelize.literal(`EXISTS (
      SELECT 1 FROM jsonb_array_elements("migratedFrom") AS m
      WHERE m->>'appDid' = '${did}'
    )`);
  }
  // SQLite
  return Sequelize.literal(`EXISTS (
    SELECT 1 FROM json_each("migratedFrom")
    WHERE json_extract(value, '$.appDid') = '${did}'
  )`);
};

const getExternalPortsFromMeta = (meta) =>
  (meta.interfaces || []).map((x) => x.port && x.port.external).filter(Boolean);

const formatBlocklet = (blocklet, phase, dek) => {
  if (phase === 'onRead') {
    blocklet.status = getBlockletStatus(blocklet);
    // Ensure children exists before forEachBlockletSync accesses it
    blocklet.children = blocklet.children || [];
  }

  forEachBlockletSync(blocklet, (b) => {
    if (b.meta) {
      fixPerson(b.meta);
      fixInterfaces(b.meta);
    }

    if (phase === 'onRead') {
      b.children = b.children || [];
      b.environments = b.environments || [];
    }

    // Handle appEk encrypt/decrypt before the environments guard
    // appEk only needs meta.did (salt) and dek, not environments
    if (b.appEk && b.meta && dek) {
      if (phase === 'onUpdate' && isHex(b.appEk) === true) {
        b.appEk = security.encrypt(b.appEk, b.meta.did, dek);
      }
      if (phase === 'onRead' && isHex(b.appEk) === false) {
        b.appEk = security.decrypt(b.appEk, b.meta.did, dek);
      }
    }

    if (!b.environments || !b.meta || !dek) {
      return;
    }

    (Array.isArray(b.migratedFrom) ? b.migratedFrom : []).forEach((x) => {
      if (phase === 'onUpdate' && isHex(x.appSk) === true) {
        x.appSk = security.encrypt(x.appSk, b.meta.did, dek);
      }
      if (phase === 'onRead' && isHex(x.appSk) === false) {
        x.appSk = security.decrypt(x.appSk, b.meta.did, dek);
      }
    });

    ['BLOCKLET_APP_SK', 'BLOCKLET_APP_PSK'].forEach((key) => {
      const env = b.environments.find((x) => x.key === key);
      if (!env) {
        return;
      }
      // salt in blocklet state is different from the salt in blocklet-extra state
      // in blocklet-extra state, salt is app meta did in each component
      // in blocklet state, salt is component meta did in each component
      if (phase === 'onUpdate' && isHex(env.value) === true) {
        env.value = security.encrypt(env.value, b.meta.did, dek);
      }
      if (phase === 'onRead' && isHex(env.value) === false) {
        env.value = security.decrypt(env.value, b.meta.did, dek);
      }
    });
  });

  return blocklet;
};

const fixChildren = (children) => {
  if (!children) {
    return;
  }

  children.forEach((child) => {
    child.mode = child.mode || BLOCKLET_MODES.PRODUCTION;
  });
};

// type Application = {
//   appDid: DID,
//   appPid: DID,
//   meta: Meta,
//   source: BlockletSource,
//   deployedFrom: string,
//   mode: BLOCKLET_MODES;
//   status: BlockletStatus,
//   children: Component,
//   ports: Ports;
//   mountPoint: string; // deprecated
//   migratedFrom: Array<{ appSk: string, appDid: DID, at: Date }>,
//   externalSk: boolean,
//   structV1Did: DID, // just for migration purpose and should be removed in the future
// };

// type Component = {
//   mountPoint: string;
//   meta: Meta,
//   bundleSource: ComponentSource,
//   source: BlockletSource,
//   deployedFrom: string,
//   mode: BLOCKLET_MODES;
//   status: BlockletStatus,
//   children: Component,
//   ports: Ports;
//   dependents: Array<{
//     did: DID, // blocklet did
//     required: boolean,
//     version: SemverRange,
//   }>;
//   dependencies: Array<{
//     id: string, // format: <did1/did2/did3>
//     required: boolean,
//   }>;
//   dynamic: boolean; // deprecated
// };

// type Ports = {
//   [name: string]: Number; // name is in meta.interfaces[].port
// };

/**
 * @extends BaseState<import('@abtnode/models').BlockletState>
 */
class BlockletState extends BaseState {
  constructor(model, config = {}) {
    super(model, config);
    this.defaultPort = config.blockletPort || 5555;
    // @didMap: { [did: string]: metaDid: string }
    this.didMap = new Map();
    this.statusLocks = new Map();

    // BlockletChildState instance passed from outside
    this.BlockletChildState = config.BlockletChildState;
  }

  /**
   * Load children for a blocklet
   * @param {string} blockletId - The blocklet ID
   * @returns {Promise<Array>} - Array of children
   */
  /**
   * Process raw children records into structured format
   * @param {Array} children - Raw children records from database
   * @param {string} parentBlockletId - The parent blocklet ID (for logging)
   * @returns {Array} - Processed children array
   */
  _processLoadedChildren(children, parentBlockletId) {
    if (!Array.isArray(children)) {
      return [];
    }

    return children.map((child) => {
      // Ensure meta is an object and has required fields
      const meta = child.meta || {};
      if (!meta.did) {
        logger.warn('loadChildren: child missing meta.did', { childId: child.id, parentBlockletId });
      }
      if (!meta.name && !meta.bundleName) {
        logger.warn('loadChildren: child missing meta.name and meta.bundleName', {
          childId: child.id,
          childDid: meta.did,
          parentBlockletId,
        });
      }

      return {
        id: child.id,
        mountPoint: child.mountPoint,
        meta,
        bundleSource: child.bundleSource || {},
        source: child.source || 0,
        deployedFrom: child.deployedFrom || '',
        mode: child.mode || 'production',
        status: child.status || 0,
        ports: child.ports || {},
        environments: child.environments || [],
        children: child.children || [],
        migratedFrom: child.migratedFrom || [],
        installedAt: child.installedAt,
        startedAt: child.startedAt,
        stoppedAt: child.stoppedAt,
        pausedAt: child.pausedAt,
        operator: child.operator,
        inProgressStart: child.inProgressStart,
        greenStatus: child.greenStatus,
        greenPorts: child.greenPorts,
        appEk: child.appEk,
      };
    });
  }

  async loadChildren(blockletId) {
    if (!blockletId) {
      return [];
    }

    const children = await this.BlockletChildState.getChildrenByParentId(blockletId);
    return this._processLoadedChildren(children, blockletId);
  }

  /**
   * Save children to BlockletChild table
   * @param {string} blockletId - The parent blocklet ID
   * @param {string} blockletDid - The parent blocklet DID
   * @param {Array} children - Array of children to save
   */
  async saveChildren(blockletId, blockletDid, children) {
    if (!blockletId || !blockletDid) {
      logger.warn('saveChildren called with invalid blockletId or blockletDid', { blockletId, blockletDid });
      return;
    }

    if (!children || children.length === 0) {
      // If no children provided, delete all existing children
      await this.BlockletChildState.deleteByParentId(blockletId);
      return;
    }

    // Get existing children
    const existingChildren = await this.BlockletChildState.getChildrenByParentId(blockletId);
    const existingChildrenMap = new Map();
    existingChildren.forEach((child) => {
      existingChildrenMap.set(child.childDid, child);
    });

    // Track which children should be kept
    const childrenToKeep = new Set();

    // Process each child: update if exists, insert if new
    for (const child of children) {
      const childDid = child.meta?.did;
      if (!childDid) {
        logger.warn('saveChildren: child missing meta.did, skipping', {
          blockletId,
          blockletDid,
          child: child.meta?.name || 'unknown',
        });
        continue;
      }

      childrenToKeep.add(childDid);

      const existingChild = existingChildrenMap.get(childDid);
      const updates = {};

      // Only update fields that have changed or are necessary
      // Fields that should be updated: meta, bundleSource, source, deployedFrom, mode, ports, children, migratedFrom
      // Fields that should be preserved if not provided: status, installedAt, startedAt, stoppedAt, pausedAt, operator, inProgressStart, greenStatus, greenPorts

      // Always update these fields
      if (child.mountPoint !== undefined) updates.mountPoint = child.mountPoint;
      if (child.meta !== undefined) updates.meta = child.meta;
      if (child.bundleSource !== undefined) updates.bundleSource = child.bundleSource;
      if (child.source !== undefined) updates.source = child.source;
      if (child.mode !== undefined) updates.mode = child.mode;
      if (child.ports !== undefined) updates.ports = child.ports;
      if (child.environments !== undefined) updates.environments = child.environments;

      // Only update status-related fields if explicitly provided
      if (child.status !== undefined) updates.status = child.status;
      // Note: installedAt should only be set on first install, never updated
      if (child.startedAt !== undefined) updates.startedAt = child.startedAt;
      if (child.stoppedAt !== undefined) updates.stoppedAt = child.stoppedAt;
      if (child.pausedAt !== undefined) updates.pausedAt = child.pausedAt;
      if (child.operator !== undefined) updates.operator = child.operator;
      if (child.inProgressStart !== undefined) updates.inProgressStart = child.inProgressStart;
      if (child.greenStatus !== undefined) updates.greenStatus = child.greenStatus;
      if (child.greenPorts !== undefined) updates.greenPorts = child.greenPorts;
      if (child.appEk !== undefined) {
        updates.appEk =
          child.appEk && isHex(child.appEk) && this.config.dek
            ? security.encrypt(child.appEk, childDid, this.config.dek)
            : child.appEk;
      }

      if (!updates.deployedFrom && child.bundleSource) {
        let deployedFrom = '';
        const { bundleSource } = child;
        const isFromStore = !!bundleSource?.store;
        if (isFromStore) {
          deployedFrom = Array.isArray(bundleSource.store) ? bundleSource.store[0] : bundleSource.store;
        } else if (bundleSource?.url) {
          const urlStr = Array.isArray(bundleSource.url) ? bundleSource.url[0] : bundleSource.url;
          try {
            deployedFrom = new URL(urlStr).origin;
          } catch {
            deployedFrom = urlStr;
          }
        }
        if (deployedFrom) {
          updates.deployedFrom = deployedFrom;
        }
      }

      try {
        if (existingChild) {
          // Update existing child only if there are changes
          if (Object.keys(updates).length > 0) {
            await this.BlockletChildState.update({ id: existingChild.id }, { $set: updates });
          }
        } else {
          // Insert new child
          await this.BlockletChildState.insert({
            parentBlockletId: blockletId,
            parentBlockletDid: blockletDid,
            childDid,
            mountPoint: child.mountPoint,
            meta: child.meta,
            bundleSource: child.bundleSource,
            source: child.source || 0,
            deployedFrom: child.deployedFrom || '',
            mode: child.mode || 'production',
            status: child.status || 0,
            ports: child.ports || {},
            environments: child.environments || [],
            installedAt: new Date(),
            startedAt: child.startedAt,
            stoppedAt: child.stoppedAt,
            pausedAt: child.pausedAt,
            operator: child.operator,
            inProgressStart: child.inProgressStart,
            greenStatus: child.greenStatus,
            greenPorts: child.greenPorts,
            appEk:
              child.appEk && isHex(child.appEk) && this.config.dek
                ? security.encrypt(child.appEk, childDid, this.config.dek)
                : child.appEk || '',
          });
        }
      } catch (error) {
        logger.error('saveChildren: failed to save child', {
          blockletId,
          blockletDid,
          childDid,
          isUpdate: !!existingChild,
          error: error.message,
        });
        throw error;
      }
    }

    // Delete children that are no longer in the list
    const childrenToDelete = existingChildren.filter((child) => !childrenToKeep.has(child.childDid));
    if (childrenToDelete.length > 0) {
      for (const childToDelete of childrenToDelete) {
        await this.BlockletChildState.remove({ id: childToDelete.id });
      }
    }
  }

  /**
   * @description
   * @param {string} did
   * @param {*} [{ decryptSk = true }={}]
   * @return {Promise<import('@blocklet/server-js').BlockletState>}
   * @memberof BlockletState
   */
  async getBlocklet(did, { decryptSk = true } = {}) {
    if (!did || !isValidDid(did)) {
      return null;
    }

    const conditions = [{ appDid: did }, { appPid: did }, { 'meta.did': did }, { structV1Did: did }];
    let doc = await this.findOne({ $or: conditions });

    // If not found and DID is valid, try searching in migratedFrom
    if (!doc) {
      const condition = getMigratedFromCondition(did, this.model.sequelize.getDialect());
      const result = await this.model.findOne({ where: condition });
      if (result) {
        doc = result.toJSON();
      }
    }

    if (!doc) {
      return null;
    }

    // Load children from BlockletChild table
    const children = await this.loadChildren(doc.id);
    doc.children = children;

    return formatBlocklet(doc, 'onRead', decryptSk ? this.config.dek : null);
  }

  async getBlockletMetaDid(did) {
    if (this.didMap.has(did)) {
      return this.didMap.get(did);
    }

    const doc = await this.getBlocklet(did);
    if (doc?.meta?.did) {
      this.didMap.set(did, doc.meta.did);
      return doc.meta.did;
    }

    return null;
  }

  async getBlockletStatus(did) {
    const doc = await this.getBlocklet(did);
    if (!doc) {
      return null;
    }
    return doc.status;
  }

  async hasBlocklet(did) {
    if (!did) {
      return false;
    }

    const conditions = [{ appDid: did }, { appPid: did }, { 'meta.did': did }, { structV1Did: did }];
    let count = await this.count({ $or: conditions });

    // If not found and DID is valid, try searching in migratedFrom
    if (count === 0) {
      const condition = getMigratedFromCondition(did, this.model.sequelize.getDialect());
      count = await this.model.count({ where: condition });
    }

    return count > 0;
  }

  async getBlocklets(query = {}, projection = {}, sort = { createdAt: -1 }) {
    const docs = await this.find(query, projection, sort);
    const validDocs = docs.filter(Boolean);

    if (validDocs.length === 0) {
      return [];
    }

    // Batch load all children in a single query (instead of N+1 queries)
    let childrenMap = new Map();
    const blockletIds = validDocs.map((doc) => doc.id);
    childrenMap = await this.BlockletChildState.getChildrenByParentIds(blockletIds);

    return validDocs.map((doc) => {
      doc.children = this._processLoadedChildren(childrenMap.get(doc.id) || [], doc.id);
      return formatBlocklet(doc, 'onRead', this.config.dek);
    });
  }

  /**
   * Process all blocklets in paginated batches without loading children
   * Optimized for bulk operations that only need specific fields (e.g., appPid)
   * Memory-efficient: only loads one batch at a time instead of all 10K records
   *
   * @param {Object} options
   * @param {Object} [options.query={}] - Query conditions
   * @param {Object} [options.projection={}] - Fields to select (e.g., { appPid: 1 })
   * @param {number} [options.batchSize=100] - Number of records per batch
   * @param {Function} options.onBatch - Async callback for each batch: (batch) => Promise<void>
   * @returns {Promise<void>}
   *
   * @example
   * await blockletState.forEachBatch({
   *   projection: { appPid: 1 },
   *   batchSize: 100,
   *   onBatch: async (blocklets) => {
   *     await Promise.all(blocklets.map(b => processBlocklet(b.appPid)));
   *   }
   * });
   */
  async forEachBatch({ query = {}, projection = {}, batchSize = 100, onBatch } = {}) {
    if (typeof onBatch !== 'function') {
      throw new Error('onBatch callback is required');
    }

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      // Use paginate from BaseState - does NOT load children
      const result = await this.paginate(query, { createdAt: 1 }, { page, pageSize: batchSize }, projection, {
        noCount: page > 1, // Only count on first page for efficiency
      });

      if (result.list.length > 0) {
        await onBatch(result.list);
      }

      // Check if there are more pages
      if (page === 1) {
        hasMore = page < result.paging.pageCount;
      } else {
        // After first page, check by list length
        hasMore = result.list.length === batchSize;
      }
      page++;
    }
  }

  /**
   * Paginated blocklet query with server-side search
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search text (matches name, title, appDid, appPid)
   * @param {boolean} [params.external] - Filter by external blocklets (true/false/undefined for all)
   * @param {Object} [params.paging] - Pagination parameters { page, pageSize }
   * @param {Object} [params.sort] - Sort parameters { field, direction }
   * @returns {Promise<{ list: BlockletState[], paging: Paging }>}
   */
  async findPaginated({ search, external, paging, sort } = {}) {
    // Allowed sort fields whitelist
    const ALLOWED_SORT_FIELDS = ['installedAt', 'updatedAt', 'status', 'startedAt'];
    const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc'];

    const conditions = { where: {} };

    // Server-side search (case-insensitive)
    if (search?.trim()) {
      const searchTerm = search.trim().toLowerCase();
      // Escape special characters for LIKE pattern
      const escapedSearch = searchTerm.replace(/[%_]/g, '\\$&');
      const searchLike = `%${escapedSearch}%`;

      const dialect = this.model.sequelize.getDialect();

      // Build search condition for meta column
      // PostgreSQL: meta is JSONB, need to cast to text before using lower()
      // SQLite: meta is stored as text, can use lower() directly
      let metaSearchCondition;
      if (dialect === 'postgres') {
        // Cast JSONB to text before applying lower() using PostgreSQL-specific syntax
        metaSearchCondition = Sequelize.where(Sequelize.literal('lower("meta"::text)'), { [Op.like]: searchLike });
      } else {
        // SQLite: meta is already text
        metaSearchCondition = Sequelize.where(Sequelize.fn('lower', Sequelize.col('meta')), {
          [Op.like]: searchLike,
        });
      }

      conditions.where[Op.or] = [
        // Search in meta column (JSON stored as text) - search the whole JSON string
        metaSearchCondition,
        // Search in appDid
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('appDid')), {
          [Op.like]: searchLike,
        }),
        // Search in appPid
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('appPid')), {
          [Op.like]: searchLike,
        }),
      ];
    }

    // Filter by external/internal (based on controller field)
    if (typeof external === 'boolean') {
      // skip this for now
      // conditions.where.controller = external ? { [Op.not]: null } : null;
    }

    // Validate and build sort order
    let sortOrder = { updatedAt: -1 }; // default sort

    if (sort?.field) {
      // Validate sort field against whitelist, fallback to updatedAt if invalid
      const isValidField = ALLOWED_SORT_FIELDS.includes(sort.field);
      const sortField = isValidField ? sort.field : 'updatedAt';

      if (!isValidField) {
        logger.warn(
          `Invalid sort field: ${sort.field}. Falling back to updatedAt. Allowed: ${ALLOWED_SORT_FIELDS.join(', ')}`
        );
      }

      // Validate sort direction, fallback to desc if invalid
      const direction = sort.direction?.toLowerCase();
      const isValidDirection = direction && ALLOWED_SORT_DIRECTIONS.includes(direction);
      const validDirection = isValidDirection ? direction : 'desc';

      if (direction && !isValidDirection) {
        logger.warn(
          `Invalid sort direction: ${sort.direction}. Falling back to desc. Allowed: ${ALLOWED_SORT_DIRECTIONS.join(', ')}`
        );
      }

      sortOrder = { [sortField]: validDirection === 'asc' ? 1 : -1 };
    }

    // Use inherited paginate method
    const result = await this.paginate(conditions, sortOrder, { pageSize: 10, ...paging });

    // Batch load children (existing pattern)
    if (result.list.length > 0) {
      const blockletIds = result.list.map((doc) => doc.id);
      const childrenMap = await this.BlockletChildState.getChildrenByParentIds(blockletIds);
      result.list = result.list.map((doc) => {
        doc.children = this._processLoadedChildren(childrenMap.get(doc.id) || [], doc.id);
        return formatBlocklet(doc, 'onRead', this.config.dek);
      });
    } else {
      result.list = result.list.map((doc) => formatBlocklet(doc, 'onRead', this.config.dek));
    }

    return result;
  }

  async deleteBlocklet(did) {
    const doc = await this.getBlocklet(did);
    if (!doc) {
      throw new CustomError(404, `Try to remove non-existing blocklet ${did}`);
    }

    await this.BlockletChildState.deleteByParentId(doc.id);
    await this.remove({ id: doc.id });

    this.didMap.delete(doc.meta?.did);
    this.didMap.delete(doc.appDid);
    this.statusLocks.delete(doc.meta?.did);
    this.statusLocks.delete(doc.appDid);

    this.emit('remove', doc);
    return formatBlocklet(doc, 'onRead', this.config.dek);
  }

  async addBlocklet({
    meta,
    source = BlockletSource.registry,
    status = BlockletStatus.added,
    deployedFrom = '',
    mode = BLOCKLET_MODES.PRODUCTION,
    children: rawChildren = [],
    appPid = null, // the permanent appDid, which will not change after initial set
    migratedFrom = [], // the complete migrate history
    // whether sk is managed by some party beside server, such as did-wallet
    // externalSk is always true in struct V2 blocklet
    externalSk = true,
    externalSkSource = '',
    appEk = '',
  } = {}) {
    let doc = await this.getBlocklet(meta.did);
    if (doc) {
      throw new CustomError(400, `Blocklet already added: ${meta.did}`);
    }

    await lock.acquire('add-blocklet');
    try {
      fixPerson(meta);
      fixInterfaces(meta);
      const { requirements, ...rest } = meta;
      let sanitized = validateBlockletMeta(rest);
      // 补充传入的 requirements.aigne 字段
      if (sanitized.requirements && requirements) {
        sanitized.requirements.aigne = requirements.aigne || false;
      }
      // bundle info
      sanitized = ensureMeta(sanitized);
      sanitized = omit(sanitized, ['htmlAst']);

      // DEPRECATED: App-level port allocation removed
      // Only components (children) need ports as they are the ones that run processes
      // App is just a container and doesn't bind to any ports
      const children = await this.fillChildrenPorts(rawChildren, {
        defaultPort: this.defaultPort,
      });
      fixChildren(children);
      children.forEach((x) => {
        x.installedAt = new Date();
        if (!x.appEk) {
          x.appEk = `0x${crypto.randomBytes(64).toString('hex')}`;
        }
      });

      // add to db — encrypt appEk before insert (insert bypasses formatBlocklet)
      const rootAppEk = appEk || `0x${crypto.randomBytes(64).toString('hex')}`;
      doc = await this.insert({
        appDid: appPid, // will updated later when updating blocklet environments
        appPid,
        mode,
        meta: sanitized,
        status,
        source,
        deployedFrom,
        ports: {}, // DEPRECATED: App-level ports no longer allocated
        environments: [],
        migratedFrom,
        externalSk,
        externalSkSource,
        structVersion: APP_STRUCT_VERSION,
        appEk: this.config.dek ? security.encrypt(rootAppEk, sanitized.did, this.config.dek) : rootAppEk,
      });

      doc = await this.findOne({ id: doc.id });
      doc.children = children;

      // Save children to BlockletChild table
      await this.saveChildren(doc.id, doc.meta.did, children);

      this.emit('add', doc);

      return doc;
    } finally {
      await lock.releaseLock('add-blocklet');
    }
  }

  // FIXME: 这个接口比较危险，可能会修改一些本不应该修改的字段，后续需要考虑改进
  async updateBlocklet(did, updates) {
    const doc = await this.getBlocklet(did);
    if (!doc) {
      throw new Error(`Blocklet does not exist on update: ${did}`);
    }

    const formatted = formatBlocklet(omit(cloneDeep(updates), ['vaults']), 'onUpdate', this.config.dek);
    const [, [updated]] = await this.update({ id: doc.id }, { $set: formatted });

    // If children are being updated, set them on the updated object before calculating status
    // This ensures getBlockletStatus can correctly calculate status based on children
    if (updates.children !== undefined) {
      updated.children = updates.children;
      await this.saveChildren(updated.id, updated.meta.did, updates.children);
    }

    updated.status = getBlockletStatus(updated);

    return updated;
  }

  async updateBlockletVaults(did, vaults) {
    const doc = await this.getBlocklet(did);
    if (!doc) {
      throw new Error(`Blocklet does not exist on update vaults: ${did}`);
    }

    await verifyVault(vaults, doc.appPid, true);

    const [, [updated]] = await this.update({ id: doc.id }, { $set: { vaults } });
    return updated;
  }

  async upgradeBlocklet({ meta, source, deployedFrom = '', children, manualChildPorts } = {}) {
    const doc = await this.getBlocklet(meta.did);
    if (!doc) {
      throw new CustomError(404, `Blocklet does not exist on upgrade: ${meta.did}`);
    }

    await lock.acquire('upgrade-blocklet');
    try {
      fixPerson(meta);
      fixInterfaces(meta);

      // fixes: https://github.com/ArcBlock/blocklet-server/issues/7009
      meta.environments = (meta.environments || []).filter((x) => x.name.startsWith('BLOCKLET_') === false);

      const sanitized = validateBlockletMeta(meta);

      // DEPRECATED: App-level port allocation removed
      // Only components (children) need ports as they are the ones that run processes

      // fill children ports
      logger.info('Fill children ports when upgrading blocklet', { name: doc.meta.name, did: doc.meta.did });
      await this.fillChildrenPorts(children, {
        oldChildren: doc.children,
        defaultPort: this.defaultPort,
      });

      if (manualChildPorts?.length) {
        logger.info('Fill manual child ports when upgrading blocklet', {
          did: doc.meta.did,
          manualChildPorts,
        });
        children.forEach((child) => {
          manualChildPorts.forEach((x) => {
            const _ports = {};
            Object.keys(x.ports || {}).forEach((y) => {
              _ports[y] = +x.ports[y];
            });
            if (child.meta.did === x.did) {
              child.ports = _ports;
            }
          });
        });
      }

      fixChildren(children);

      // add to db - no longer updating app-level ports
      const newDoc = await this.updateBlocklet(meta.did, {
        meta: omit(sanitized, ['htmlAst']),
        source,
        deployedFrom,
      });

      // Save children to BlockletChild table
      await this.saveChildren(newDoc.id, newDoc.meta.did, children);
      newDoc.children = children;

      this.emit('upgrade', newDoc);
      return newDoc;
    } finally {
      await lock.releaseLock('upgrade-blocklet');
    }
  }

  /**
   * assign ports for blocklet during install/upgrade workflow
   */
  async getBlockletPorts({
    interfaces = [],
    alreadyAssigned = {},
    skipOccupiedCheck = false,
    skipOccupiedCheckPorts = [],
    defaultPort = 0,
    blockletDid = '',
  } = {}) {
    try {
      const { occupiedExternalPorts, occupiedInternalPorts } = await this._getOccupiedPorts();

      const wantedPorts = uniq(
        interfaces
          .map((x) => {
            if (typeof x.port === 'string') {
              return x.port;
            }

            if (x.port && typeof x.port.internal === 'string') {
              if (
                skipOccupiedCheck === false &&
                !skipOccupiedCheckPorts.includes(Number(x.port.external)) &&
                occupiedExternalPorts.has(Number(x.port.external))
              ) {
                throw new Error(`Can not assign ports because external port ${x.port.external} already occupied`);
              }
              return x.port.internal;
            }

            return undefined;
          })
          .filter(Boolean)
      );

      if (!wantedPorts.length) {
        logger.warn('empty wantedPorts inferred from blocklet.meta.interfaces, force default');
        wantedPorts.push(BLOCKLET_DEFAULT_PORT_NAME);
      }

      // 过滤出需要分配的端口（排除已分配的）
      const portsToAssign = wantedPorts.filter((port) => typeof alreadyAssigned[port] === 'undefined');

      if (portsToAssign.length === 0) {
        return alreadyAssigned;
      }

      const blackListPorts = [
        ...Array.from(occupiedExternalPorts.keys()),
        ...Array.from(occupiedInternalPorts.keys()),
        ...Object.values(alreadyAssigned),
      ];

      // 使用统一的端口分配方法（包含锁机制）
      const newPorts = await assignPortsWithLock({
        wantedPorts: portsToAssign,
        blackListPorts,
        portRange: DEFAULT_PORT_RANGE,
        defaultPort: Math.max(Number(this.defaultPort), defaultPort),
        blockletDid,
      });

      // 合并已分配的端口和新分配的端口
      return Object.assign({}, alreadyAssigned, newPorts);
    } catch (err) {
      logger.error('Failed to assign port to blocklet', { error: err });
      throw err;
    }
  }

  /**
   * refresh ports for blocklet if occupied during starting workflow
   * OPTIMIZATION: Uses parallel port checks with concurrency limit for better performance at scale
   * @returns {Promise<{refreshed: boolean, componentDids: string[], isInitialAssignment?: boolean}>} 返回是否真正刷新了端口，isInitialAssignment 表示是否是首次分配（非冲突刷新）
   */
  async refreshBlockletPorts(did, componentDids = [], isGreen = false) {
    const blocklet = await this.getBlocklet(did);
    if (!blocklet) {
      throw new CustomError(404, `Blocklet does not exist on refresh: ${did}`);
    }

    const { occupiedExternalPorts, occupiedInternalPorts } = await this._getOccupiedPorts();
    const blackListPorts = [...Array.from(occupiedExternalPorts.keys()), ...Array.from(occupiedInternalPorts.keys())];

    // OPTIMIZATION: Collect all components that need processing first
    const componentsToProcess = [];
    await forEachComponentV2(blocklet, (component) => {
      if (!shouldSkipComponent(component.meta.did, componentDids)) {
        componentsToProcess.push(component);
      }
    });

    if (componentsToProcess.length === 0) {
      return { refreshed: false, componentDids: [], isInitialAssignment: false };
    }

    const actuallyRefreshedDids = [];
    let hasInitialAssignment = false;

    // OPTIMIZATION: Check port availability in parallel with concurrency limit
    const PORT_CHECK_CONCURRENCY = 10;
    const checkPortAvailability = async (ports) => {
      const portValues = Object.values(ports);
      if (portValues.length === 0) return false;

      // Check ports in parallel batches
      for (let i = 0; i < portValues.length; i += PORT_CHECK_CONCURRENCY) {
        const batch = portValues.slice(i, i + PORT_CHECK_CONCURRENCY);
        const results = await Promise.all(batch.map((port) => isPortTaken(port)));
        if (results.some((taken) => taken)) {
          return true; // At least one port is taken
        }
      }
      return false;
    };

    // Process components: first pass - check which need reassignment (parallel)
    const componentChecks = await Promise.all(
      componentsToProcess.map(async (component) => {
        let oldPorts = component[isGreen ? 'greenPorts' : 'ports'];
        const hasOldPorts = oldPorts && Object.keys(oldPorts).length > 0;

        // Green environment initial assignment
        if (isGreen && !hasOldPorts) {
          const basePorts = component.ports || {};
          if (Object.keys(basePorts).length > 0) {
            return { component, action: 'initial_green', basePorts };
          }
          return { component, action: 'skip' };
        }

        // Fallback to ports if oldPorts is empty
        if (!hasOldPorts) {
          oldPorts = component.ports;
        }

        if (!oldPorts || Object.keys(oldPorts).length === 0) {
          return { component, action: 'skip' };
        }

        // Check if any port is taken (parallel within component)
        const needReassign = await checkPortAvailability(oldPorts);
        if (needReassign) {
          return { component, action: 'reassign', oldPorts };
        }

        return { component, action: 'skip' };
      })
    );

    // Second pass - assign new ports for components that need it (sequential due to lock)
    // Track ports assigned in this batch to prevent duplicate assignments
    const assignedInThisBatch = [];

    for (const { component, action, basePorts, oldPorts } of componentChecks) {
      if (action === 'skip') continue;

      // Use combined parent/component DID for deterministic per-component port assignment
      const componentBlockletDid = [blocklet.meta.did, component.meta.did].join('/');

      if (action === 'initial_green') {
        const wantedPorts = Object.keys(basePorts);
        const newPorts = await assignPortsWithLock({
          wantedPorts,
          blackListPorts: [...blackListPorts, ...Object.values(basePorts), ...assignedInThisBatch],
          portRange: DEFAULT_PORT_RANGE,
          defaultPort: this.defaultPort,
          blockletDid: componentBlockletDid,
        });

        component.greenPorts = newPorts;
        actuallyRefreshedDids.push(component.meta.did);
        hasInitialAssignment = true;
        assignedInThisBatch.push(...Object.values(newPorts));
      } else if (action === 'reassign') {
        const wantedPorts = Object.keys(oldPorts);
        const newPorts = await assignPortsWithLock({
          wantedPorts,
          blackListPorts: [...blackListPorts, ...Object.values(oldPorts), ...assignedInThisBatch],
          portRange: DEFAULT_PORT_RANGE,
          defaultPort: this.defaultPort,
          blockletDid: componentBlockletDid,
        });

        component[isGreen ? 'greenPorts' : 'ports'] = newPorts;
        actuallyRefreshedDids.push(component.meta.did);
        assignedInThisBatch.push(...Object.values(newPorts));
      }
    }

    if (actuallyRefreshedDids.length > 0) {
      await this.updateBlocklet(did, {});

      // Only update ports/greenPorts to avoid overwriting status during concurrent operations
      for (const component of blocklet.children) {
        if (actuallyRefreshedDids.includes(component.meta?.did)) {
          await this.BlockletChildState.updateChildPorts(blocklet.id, component.meta.did, {
            ports: component.ports,
            greenPorts: component.greenPorts,
          });
        }
      }
    }

    return {
      refreshed: actuallyRefreshedDids.length > 0,
      componentDids: actuallyRefreshedDids,
      isInitialAssignment: hasInitialAssignment,
    };
  }

  /**
   * Get all services from blocklet children with SERVICE type interfaces
   * Optimized: Single query to BlockletChildren table with DB-level JSON filtering
   * @returns {Promise<Array<{name: string, protocol: string, port: number, upstreamPort: number}>>}
   */
  async getServices() {
    // Single optimized query: only children with SERVICE interfaces, only needed fields
    const children = await this.BlockletChildState.getChildrenWithServiceInterfaces();

    const services = [];
    const portSet = new Set();

    for (const child of children) {
      const serviceInterfaces = ((child.meta || {}).interfaces || []).filter(
        (x) => x.type === BLOCKLET_INTERFACE_TYPE_SERVICE
      );

      for (const iface of serviceInterfaces) {
        const portCfg = iface.port || {};
        // Use greenPorts when green environment is running, otherwise use regular ports
        const isGreenRunning = child.greenStatus === BlockletStatus.running;
        const activePorts = isGreenRunning ? child.greenPorts || {} : child.ports || {};

        let externalPort = Number(portCfg.external);
        const upstreamPort = Number(activePorts[portCfg.internal]);

        // Port redirection support
        // 如果本地 53 端口被系统占用，调试可以配置： export ABT_NODE_REDIRECTION_SERVICE_PORTS="53:10053,553:101553" 等多个 Service 端口重定向
        if (process.env.ABT_NODE_REDIRECTION_SERVICE_PORTS) {
          const redirectionPorts = process.env.ABT_NODE_REDIRECTION_SERVICE_PORTS.split(',');
          for (const portString of redirectionPorts) {
            const [portA, portB] = portString.split(':');
            if (externalPort === +portA) {
              externalPort = +portB;
              break;
            }
          }
        }

        // Validation
        if (!externalPort) {
          logger.error('Missing service port', { iface, childDid: child.meta?.did });
          continue;
        }
        if (!iface.protocol) {
          logger.error('Missing service protocol', { iface, childDid: child.meta?.did });
          continue;
        }
        if (!upstreamPort) {
          logger.error('Missing service upstreamPort', { iface, ports: activePorts, childDid: child.meta?.did });
          continue;
        }

        // Dedup by external port
        if (portSet.has(externalPort)) {
          logger.error('Duplicate service port', { port: externalPort, childDid: child.meta?.did });
          continue;
        }
        portSet.add(externalPort);

        services.push({
          name: iface.name,
          protocol: iface.protocol,
          port: externalPort,
          upstreamPort,
        });
      }
    }

    return services;
  }

  /**
   * @return {Object} { <did> : { interfaceName } }
   */
  async groupAllInterfaces(blocklets) {
    const _blocklets = blocklets || (await this.getBlocklets({}, { id: 1, meta: 1 }));
    const result = {};
    const fillResult = (component, { id }) => {
      const { interfaces } = component.meta;
      if (typeof result[id] === 'undefined') {
        result[id] = {};
      }

      (interfaces || []).forEach((x) => {
        result[id][x.name] = x;
      });
    };

    _blocklets.forEach((blocklet) => {
      forEachBlockletSync(blocklet, fillResult);
    });

    return result;
  }

  /**
   * Reset the blocklet state by clearing all blocklets and their children
   * This overrides BaseState.reset() to handle foreign key constraints
   */
  async reset() {
    await this.BlockletChildState.reset();
    return super.reset();
  }

  /**
   * @param {Did} did blocklet did
   * @param {BlockletStatus} status blocklet status
   * @param {{
   *   componentDids?: Array<Did>
   * }}
   */
  async setBlockletStatus(
    did,
    status,
    { componentDids, operator = 'daemon', isGreen = false, isGreenAndBlue = false } = {}
  ) {
    logger.info('setBlockletStatus', { did, status, componentDids, operator });
    if (typeof status === 'undefined') {
      throw new Error('Unsupported blocklet status');
    }

    const lockName = `set-blocklet-status-${did}`;
    await lock.acquire(lockName);
    try {
      const doc = await this.getBlocklet(did);
      if (!doc) {
        throw new Error(`Blocklet not found: ${did}`);
      }
      if (doc.meta?.group === BlockletGroup.gateway && !doc.children?.length) {
        const updateData = { status, operator };
        const res = await this.updateBlocklet(did, updateData);
        return res;
      }

      // for backward compatibility
      if (!doc.structVersion && !doc.children?.length) {
        const updateData = { status, operator };
        const res = await this.updateBlocklet(did, updateData);
        return res;
      }

      // Collect components to update
      const componentsToUpdate = [];
      for (const component of doc.children || []) {
        if (component.meta.group === BlockletGroup.gateway) {
          continue;
        }

        if (shouldSkipComponent(component.meta.did, componentDids)) {
          continue;
        }

        componentsToUpdate.push(component.meta.did);

        // Update in-memory for return value
        component[isGreen ? 'greenStatus' : 'status'] = status;
        if (isGreenAndBlue) {
          component.greenStatus = status;
          component.status = status;
        }
        if (status === BlockletStatus.running) {
          component.startedAt = new Date();
          component.stoppedAt = null;
        }
        if (status === BlockletStatus.stopped) {
          component.startedAt = null;
          component.stoppedAt = new Date();
        }
        component.operator = operator;
        component.inProgressStart = Date.now();
      }

      const shouldSetStatus = status === BlockletStatus.downloading || status === BlockletStatus.waiting;
      const updateData = {
        operator,
      };
      if (shouldSetStatus) {
        updateData.status = status;
      }

      // Update blocklet without children to avoid overwriting status during concurrent operations
      const res = await this.updateBlocklet(did, updateData);

      // Update each component's status individually using BlockletChildState
      if (componentsToUpdate.length > 0) {
        for (const componentDid of componentsToUpdate) {
          await this.BlockletChildState.updateChildStatus(doc.id, componentDid, {
            status,
            isGreen,
            isGreenAndBlue,
            operator,
          });
        }
      }

      // Sync parent uptime for stable states (running, stopped, error)
      const stableStatuses = [BlockletStatus.running, BlockletStatus.stopped, BlockletStatus.error];
      if (stableStatuses.includes(status)) {
        await this.syncUptimeStatus(doc.id);
      }

      const children = await this.loadChildren(doc.id);

      res.children = children;
      // Recalculate status after children are loaded with updated status
      res.status = getBlockletStatus(res);
      return res;
    } catch (error) {
      logger.error('setBlockletStatus failed', { did, status, componentDids, operator, error });
      throw error;
    } finally {
      await lock.releaseLock(lockName);
    }
  }

  /**
   * Synchronize parent blocklet's startedAt/stoppedAt based on children's running state
   *
   * Rules:
   * - If ANY child has status === RUNNING or greenStatus === RUNNING:
   *   → App is running, startedAt = earliest child startedAt, stoppedAt = null
   * - If NO child is running (all stopped/error):
   *   → App is stopped, stoppedAt = now, startedAt = null
   * - Only acts on stable states, ignores in-progress statuses
   *
   * @param {string} blockletId - The parent blocklet ID (not DID)
   * @returns {Promise<void>}
   */
  async syncUptimeStatus(blockletId) {
    if (!blockletId) {
      return;
    }

    try {
      const blocklet = await this.findOne({ id: blockletId });
      if (!blocklet) {
        return;
      }

      const hasRunning = await this.BlockletChildState.hasAnyRunningChild(blockletId);
      if (hasRunning) {
        // App is running - update startedAt if not already set
        if (!blocklet.startedAt) {
          const earliestStartedAt = await this.BlockletChildState.getEarliestRunningStartedAt(blockletId);
          const newStartedAt = earliestStartedAt || new Date();
          // Use silent: true to prevent updatedAt from being modified
          await this.model.update(
            { startedAt: newStartedAt, stoppedAt: null },
            { where: { id: blockletId }, silent: true }
          );
          logger.info('syncUptimeStatus: app started', {
            blockletId,
            appDid: blocklet.appDid,
            startedAt: newStartedAt,
          });
        }
      } else if (blocklet.startedAt && !blocklet.stoppedAt) {
        // App is not running - update stoppedAt if was previously running
        const now = new Date();
        // Use silent: true to prevent updatedAt from being modified
        await this.model.update({ stoppedAt: now, startedAt: null }, { where: { id: blockletId }, silent: true });
        logger.info('syncUptimeStatus: app stopped', {
          blockletId,
          appDid: blocklet.appDid,
          stoppedAt: now,
        });
      }
    } catch (error) {
      logger.error('syncUptimeStatus failed', { blockletId, error: error.message });
      // Don't throw - uptime sync failure shouldn't break status updates
    }
  }

  async setInstalledAt(did) {
    logger.info('setInstalledAt', { did });
    const blocklet = await this.getBlocklet(did);
    if (!blocklet) {
      throw new Error(`Blocklet does not exist: ${did}`);
    }
    if (!blocklet.installedAt) {
      return this.updateBlocklet(did, { installedAt: new Date() });
    }
    return blocklet;
  }

  async fillChildrenPorts(children, { defaultPort = 0, oldChildren, returnMaxPort } = {}) {
    let _maxPort = defaultPort;
    for (const child of children || []) {
      // generate ports
      const childMeta = child.meta;
      const oldChild = (oldChildren || []).find((x) => x.meta.did === child.meta.did);

      // get skipOccupiedCheckPorts
      const skipOccupiedCheckPorts = oldChild ? getExternalPortsFromMeta(oldChild.meta) : [];

      // Use child's own DID for hash-based port allocation (deterministic per component)
      const ports = await this.getBlockletPorts({
        interfaces: childMeta.interfaces || [],
        defaultPort: _maxPort,
        skipOccupiedCheckPorts,
        blockletDid: child.meta.did,
      });
      _maxPort = getMaxPort(ports);

      if (oldChild && oldChild.ports) {
        // fill old child's port to new child
        logger.info('Merge the previous ports to child blocklet', {
          did: child.meta.did,
          name: child.meta.name,
          oldPorts: oldChild.ports,
          ports,
        });
        Object.keys(ports).forEach((p) => {
          ports[p] = oldChild.ports[p] || ports[p];
        });
      }

      // assign a new port to child
      logger.info('Assign new ports to child blocklet', { did: child.meta.did, name: child.meta.name, ports });
      child.ports = ports;
    }

    for (const child of children || []) {
      const oldChild = (oldChildren || []).find((x) => x.meta.did === child.meta.did);

      _maxPort = await this.fillChildrenPorts(child.children || [], {
        defaultPort: _maxPort,
        oldChildren: oldChild?.children,
        returnMaxPort: true,
      });
    }

    if (returnMaxPort) {
      return _maxPort;
    }

    return children;
  }

  /**
   *
   * @param {string} did
   * @param {array} children
   * @param {{
   *   manualChildPorts: Array<{
   *     did: string,
   *     ports: Record<string, number>,
   *   }>
   * }} param2
   * @returns
   */
  async addChildren(did, children, { manualPorts = [] } = {}) {
    const parent = await this.getBlocklet(did);
    if (!parent) {
      throw new CustomError(404, `Blocklet does not exist on addChildren: ${did}`);
    }

    const oldChildren = parent.children || [];

    const newChildren = [...oldChildren];
    for (const child of children) {
      const { meta, mountPoint, bundleSource = null, source = '', deployedFrom = '', mode } = child;

      if (hasStartEngine(meta) && !mountPoint) {
        throw new CustomError(400, `mountPoint is required when adding component ${getDisplayName(child, true)}`);
      }

      checkDuplicateComponents([child, ...newChildren]);

      newChildren.push({
        mountPoint,
        meta,
        bundleSource,
        source,
        deployedFrom,
        mode,
        status: BlockletStatus.added,
        children: child.children,
        installedAt: new Date(),
        appEk: child.appEk,
      });

      fixChildren(newChildren);
    }

    // use upgradeBlocklet to assign ports to children and write new data to db
    return this.upgradeBlocklet({
      meta: parent.meta,
      source: parent.source,
      deployedFrom: parent.deployedFrom,
      children: newChildren,
      manualChildPorts: manualPorts,
    });
  }

  updateStructV1Did(did, v1Did) {
    return this.updateBlocklet(did, { structV1Did: v1Did });
  }

  /**
   * Get all occupied ports by reading directly from BlockletChild table
   * - Internal ports: From component's ports/greenPorts fields
   * - External ports: From component's meta.interfaces
   */
  async _getOccupiedPorts() {
    const occupiedExternalPorts = new Map();
    const occupiedInternalPorts = new Map();

    // Read directly from BlockletChild table - only components bind to ports
    const children = await this.BlockletChildState.getAllPorts();

    for (const child of children) {
      // Internal ports from component's ports field
      if (child.ports && typeof child.ports === 'object') {
        Object.values(child.ports).forEach((port) => {
          if (port) occupiedInternalPorts.set(Number(port), true);
        });
      }
      // Green ports as well
      if (child.greenPorts && typeof child.greenPorts === 'object') {
        Object.values(child.greenPorts).forEach((port) => {
          if (port) occupiedInternalPorts.set(Number(port), true);
        });
      }
      // External ports from component's meta.interfaces
      if (Array.isArray(child.meta?.interfaces)) {
        child.meta.interfaces.forEach((x) => {
          if (x.port && x.port.external) {
            occupiedExternalPorts.set(Number(x.port.external), true);
          }
        });
      }
    }

    return {
      occupiedExternalPorts,
      occupiedInternalPorts,
    };
  }
}

BlockletState.BlockletStatus = BlockletStatus;
BlockletState.formatBlocklet = formatBlocklet;

module.exports = BlockletState;
