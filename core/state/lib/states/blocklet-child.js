/* eslint-disable no-underscore-dangle */
const { Sequelize } = require('sequelize');
const { BlockletStatus, BLOCKLET_INTERFACE_TYPE_SERVICE } = require('@blocklet/constant');
const BaseState = require('./base');

/**
 * 没有 deployedFrom 时，才会从 bundleSource 中推断
 * @param {Object} child - The child object
 * @returns {Object} - The child with inferred deployedFrom
 */
const ensureDeployedFrom = (child) => {
  if (child.deployedFrom || !child.bundleSource) {
    return child;
  }

  const { bundleSource } = child;
  let deployedFrom = '';

  if (bundleSource.store) {
    // From registry/store - store is already the domain
    deployedFrom = Array.isArray(bundleSource.store) ? bundleSource.store[0] : bundleSource.store;
  } else if (bundleSource.url) {
    // From URL - extract origin (domain) only
    const urlStr = Array.isArray(bundleSource.url) ? bundleSource.url[0] : bundleSource.url;
    try {
      deployedFrom = new URL(urlStr).origin;
    } catch {
      deployedFrom = urlStr;
    }
  }

  if (deployedFrom) {
    return { ...child, deployedFrom };
  }
  return child;
};

/**
 * @extends BaseState<import('@abtnode/models').BlockletChildState>
 */
class BlockletChildState extends BaseState {
  constructor(model, config = {}) {
    super(model, config);
  }

  /**
   * Get children by parent blocklet ID
   * @param {string} parentBlockletId - The parent blocklet ID
   * @returns {Promise<Array>} - Array of children
   */
  async getChildrenByParentId(parentBlockletId) {
    if (!parentBlockletId) {
      return [];
    }
    const children = await this.find({ parentBlockletId }, {}, { createdAt: 1 });
    // Ensure deployedFrom is inferred from bundleSource if not present
    return (children || []).map(ensureDeployedFrom);
  }

  /**
   * Get children by multiple parent blocklet IDs (batch query)
   * @param {string[]} parentBlockletIds - Array of parent blocklet IDs
   * @returns {Promise<Map<string, Array>>} - Map of parentBlockletId -> children array
   */
  async getChildrenByParentIds(parentBlockletIds) {
    if (!Array.isArray(parentBlockletIds) || parentBlockletIds.length === 0) {
      return new Map();
    }

    const children = await this.find({ parentBlockletId: { $in: parentBlockletIds } }, {}, { createdAt: 1 });

    // Group children by parentBlockletId
    const childrenMap = new Map();
    parentBlockletIds.forEach((id) => childrenMap.set(id, []));

    (children || []).forEach((child) => {
      const processedChild = ensureDeployedFrom(child);
      if (childrenMap.has(child.parentBlockletId)) {
        childrenMap.get(child.parentBlockletId).push(processedChild);
      }
    });

    return childrenMap;
  }

  /**
   * Delete children by parent blocklet ID
   * @param {string} parentBlockletId - The parent blocklet ID
   * @returns {Promise<number>} - Number of deleted children
   */
  deleteByParentId(parentBlockletId) {
    if (!parentBlockletId) {
      return 0;
    }
    return this.remove({ parentBlockletId });
  }

  async updateChildStatusRunning(parentBlockletId, childDid, isGreen, additionalUpdates = {}) {
    const now = new Date();
    const baseUpdates = {
      ...additionalUpdates,
      updatedAt: now,
      startedAt: now,
      stoppedAt: null,
    };

    if (isGreen) {
      // 绿环境启动成功 -> 绿 running，蓝 stopped
      await this.update(
        { parentBlockletId, childDid },
        {
          $set: {
            ...baseUpdates,
            greenStatus: BlockletStatus.running,
            status: BlockletStatus.stopped,
          },
        }
      );
    } else {
      // 蓝环境启动成功 -> 蓝 running，绿 stopped
      await this.update(
        { parentBlockletId, childDid },
        {
          $set: {
            ...baseUpdates,
            greenStatus: BlockletStatus.stopped,
            status: BlockletStatus.running,
          },
        }
      );
    }
  }

  async updateChildStatusError(parentBlockletId, childDid, isGreen, additionalUpdates = {}) {
    const now = new Date();
    const baseUpdates = {
      ...additionalUpdates,
      updatedAt: now,
    };

    if (isGreen) {
      // 绿环境启动失败
      await this.update(
        { parentBlockletId, childDid },
        {
          $set: {
            ...baseUpdates,
            greenStatus: BlockletStatus.error,
          },
        }
      );
    } else {
      // 蓝环境启动失败
      await this.update(
        { parentBlockletId, childDid },
        {
          $set: {
            ...baseUpdates,
            status: BlockletStatus.error,
          },
        }
      );
    }
  }

  /**
   * Update child status only (without overwriting other fields)
   * Used by setBlockletStatus to avoid race conditions in multi-process environments
   * @param {string} parentBlockletId - The parent blocklet ID
   * @param {string} childDid - The child DID
   * @param {Object} options - Update options
   * @param {number} options.status - The blue status to set
   * @param {number} options.greenStatus - The green status to set
   * @param {boolean} options.isGreen - Whether to update green status
   * @param {boolean} options.isGreenAndBlue - Whether to update both statuses
   * @param {string} options.operator - The operator
   * @returns {Promise<Object>} - Updated child
   */
  async updateChildStatus(
    parentBlockletId,
    childDid,
    { status, isGreen = false, isGreenAndBlue = false, operator } = {}
  ) {
    if (!parentBlockletId || !childDid) {
      return null;
    }

    const updates = {
      updatedAt: new Date(),
      inProgressStart: Date.now(),
    };

    if (operator) {
      updates.operator = operator;
    }

    if (isGreenAndBlue) {
      updates.status = status;
      updates.greenStatus = status;
    } else if (isGreen) {
      updates.greenStatus = status;
    } else {
      updates.status = status;
    }

    if (status === BlockletStatus.running) {
      updates.startedAt = new Date();
      updates.stoppedAt = null;
    } else if (status === BlockletStatus.stopped) {
      updates.startedAt = null;
      updates.stoppedAt = new Date();
    }

    const [, [updated]] = await this.update({ parentBlockletId, childDid }, { $set: updates });
    return updated;
  }

  /**
   * Update child ports only (without affecting status fields)
   * Used by refreshBlockletPorts to avoid overwriting status during concurrent operations
   * @param {string} parentBlockletId - The parent blocklet ID
   * @param {string} childDid - The child DID
   * @param {Object} ports - The ports to set (for blue environment)
   * @param {Object} greenPorts - The green ports to set (for green environment)
   * @returns {Promise<Object>} - Updated child
   */
  async updateChildPorts(parentBlockletId, childDid, { ports, greenPorts } = {}) {
    if (!parentBlockletId || !childDid) {
      return null;
    }

    const updates = {
      updatedAt: new Date(),
    };

    if (ports !== undefined) {
      updates.ports = ports;
    }
    if (greenPorts !== undefined) {
      updates.greenPorts = greenPorts;
    }

    // Only update if there's something to update
    if (Object.keys(updates).length <= 1) {
      return null;
    }

    const [, [updated]] = await this.update({ parentBlockletId, childDid }, { $set: updates });
    return updated;
  }

  /**
   * Get aggregated status counts using efficient SQL GROUP BY
   * This avoids loading all children into memory for counting
   * @returns {Promise<{total: number, counts: Object}>} - Total count and counts by status
   */
  async getStatusCounts() {
    try {
      // Use raw SQL for efficient GROUP BY COUNT aggregation
      // This is O(1) memory vs O(n) for loading all records
      const results = await this.query(`
        SELECT status, COUNT(*) as count
        FROM blocklet_children
        GROUP BY status
      `);

      const counts = {};
      let total = 0;

      for (const row of results) {
        const { status, count: countStr } = row;
        const count = parseInt(countStr, 10);
        counts[status] = count;
        total += count;
      }

      return { total, counts };
    } catch (error) {
      // Fallback: return empty counts on error
      return { total: 0, counts: {} };
    }
  }

  /**
   * Get count of children by status value
   * @param {number} status - The status value to count
   * @returns {Promise<number>} - Count of children with the given status
   */
  countByStatus(status) {
    return this.count({ status });
  }

  /**
   * Get all port-related data from all children (optimized for _getOccupiedPorts)
   * Only fetches necessary fields to minimize memory usage
   * @returns {Promise<Array<{ports: Object, greenPorts: Object, meta: Object}>>}
   */
  async getAllPorts() {
    const results = await this.model.findAll({
      attributes: ['ports', 'greenPorts', 'meta'],
      raw: true,
    });
    return results;
  }

  /**
   * Get children that have SERVICE type interfaces (optimized for getServices)
   * Uses database-level JSON filtering to reduce data transfer
   * Works with both SQLite and PostgreSQL
   * @returns {Promise<Array<{meta: Object, ports: Object, greenPorts: Object, greenStatus: number}>>}
   */
  async getChildrenWithServiceInterfaces() {
    const dialect = this.model.sequelize.getDialect();

    let condition;

    if (dialect === 'postgres') {
      // PostgreSQL: Use jsonb_array_elements to check interface types
      condition = Sequelize.literal(`
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(meta->'interfaces') AS iface
          WHERE iface->>'type' = '${BLOCKLET_INTERFACE_TYPE_SERVICE}'
        )
      `);
    } else {
      // SQLite: Use json_each and json_extract for interface type check
      condition = Sequelize.literal(`
        EXISTS (
          SELECT 1 FROM json_each(json_extract(meta, '$.interfaces'))
          WHERE json_extract(value, '$.type') = '${BLOCKLET_INTERFACE_TYPE_SERVICE}'
        )
      `);
    }

    const results = await this.model.findAll({
      attributes: ['meta', 'ports', 'greenPorts', 'greenStatus'],
      where: condition,
    });

    return results.map((x) => x.toJSON());
  }

  /**
   * Check if any child of a parent blocklet is in running state
   * Uses efficient COUNT query instead of loading all children
   * Checks both status and greenStatus for blue-green deployment support
   * @param {string} parentBlockletId - The parent blocklet ID
   * @returns {Promise<boolean>} - True if any child is running
   */
  async hasAnyRunningChild(parentBlockletId) {
    if (!parentBlockletId) {
      return false;
    }

    const { Op } = Sequelize;
    const count = await this.model.count({
      where: {
        parentBlockletId,
        [Op.or]: [{ status: BlockletStatus.running }, { greenStatus: BlockletStatus.running }],
      },
    });

    return count > 0;
  }

  /**
   * Get the earliest startedAt timestamp from running children
   * Used to determine when the app first started running
   * @param {string} parentBlockletId - The parent blocklet ID
   * @returns {Promise<Date|null>} - Earliest startedAt or null if no running children
   */
  async getEarliestRunningStartedAt(parentBlockletId) {
    if (!parentBlockletId) {
      return null;
    }

    const { Op } = Sequelize;
    const result = await this.model.findOne({
      attributes: [[Sequelize.fn('MIN', Sequelize.col('startedAt')), 'earliestStartedAt']],
      where: {
        parentBlockletId,
        [Op.or]: [{ status: BlockletStatus.running }, { greenStatus: BlockletStatus.running }],
        startedAt: { [Op.not]: null },
      },
      raw: true,
    });

    if (result && result.earliestStartedAt) {
      return new Date(result.earliestStartedAt);
    }
    return null;
  }
}

module.exports = BlockletChildState;
